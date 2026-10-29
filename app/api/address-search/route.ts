import { findState, findStateByName, type UsState } from "../../lib/us-states";

type PhotonFeature = {
  properties?: {
    name?: string;
    housenumber?: string;
    street?: string;
    postcode?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    country?: string;
    countrycode?: string;
    osm_id?: number;
    osm_type?: string;
  };
};

type AddressSuggestion = {
  id: string;
  label: string;
  secondary: string;
  address: string;
  city: string;
  state: string;
  stateCode: string;
};

const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new Map<string, { at: number; results: AddressSuggestion[] }>();

function buildSuggestion(
  feature: PhotonFeature,
  index: number,
): AddressSuggestion | null {
  const props = feature.properties ?? {};
  const streetLine = [props.housenumber, props.street]
    .filter(Boolean)
    .join(" ")
    .trim();
  const label = streetLine || props.name?.trim() || "";
  if (!label) return null;

  const locality =
    props.city || props.town || props.village || props.county || "";
  const region = [props.state, props.postcode].filter(Boolean).join(" ");
  const city = [locality, region].filter(Boolean).join(", ");
  const country =
    props.countrycode && props.countrycode !== "US" ? props.country : "";
  const rawState = props.state ?? "";
  const state = findStateByName(rawState);

  return {
    id: `${props.osm_type ?? "place"}-${props.osm_id ?? index}`,
    label,
    secondary: [city, country].filter(Boolean).join(" · "),
    address: label,
    city,
    state: rawState,
    stateCode: state?.code ?? "",
  };
}

function matchesState(suggestion: AddressSuggestion, state: UsState) {
  return (
    suggestion.stateCode === state.code ||
    suggestion.state.toLowerCase() === state.name.toLowerCase()
  );
}

async function fetchSuggestions(
  query: string,
  limit: number,
): Promise<AddressSuggestion[]> {
  const url = new URL("https://photon.komoot.io/api/");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("lang", "en");

  const response = await fetch(url, {
    headers: {
      "User-Agent": "TheNextHomeEdit/1.0 (personal house-hunting app)",
    },
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    throw new Error(`Photon responded ${response.status}`);
  }

  const payload = (await response.json()) as {
    features?: PhotonFeature[];
  };

  const seen = new Set<string>();
  const results: AddressSuggestion[] = [];

  for (const [index, feature] of (payload.features ?? []).entries()) {
    const suggestion = buildSuggestion(feature, index);
    if (!suggestion) continue;
    const key = `${suggestion.label}|${suggestion.city}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    results.push(suggestion);
  }

  return results;
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const query = params.get("q")?.trim() ?? "";
  if (query.length < 4) {
    return Response.json({ results: [] });
  }

  const selectedState = findState(params.get("state"));
  const cacheKey = `${query.toLowerCase()}|${selectedState?.code ?? ""}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return Response.json({ results: cached.results });
  }

  try {
    let results = await fetchSuggestions(
      selectedState ? `${query}, ${selectedState.name}` : query,
      selectedState ? 15 : 6,
    );

    // Photon does not expose a state filter, so narrow the ranked results
    // ourselves. If the state-assisted query finds nothing there, retry the
    // plain query before giving up on the filter.
    if (selectedState) {
      const inState = results.filter((result) =>
        matchesState(result, selectedState),
      );

      if (inState.length > 0) {
        results = inState;
      } else {
        const fallback = await fetchSuggestions(query, 15);
        const fallbackInState = fallback.filter((result) =>
          matchesState(result, selectedState),
        );
        results = fallbackInState.length > 0 ? fallbackInState : fallback;
      }
    }

    results = results.slice(0, 6);
    cache.set(cacheKey, { at: Date.now(), results });
    if (cache.size > 200) {
      const oldest = cache.keys().next().value;
      if (oldest) cache.delete(oldest);
    }

    return Response.json(
      { results },
      { headers: { "Cache-Control": "public, max-age=300" } },
    );
  } catch (error) {
    console.warn("Address lookup failed:", error);
    return Response.json({ results: [], unavailable: true });
  }
}
