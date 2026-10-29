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

  return {
    id: `${props.osm_type ?? "place"}-${props.osm_id ?? index}`,
    label,
    secondary: [city, country].filter(Boolean).join(" · "),
    address: label,
    city,
  };
}

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < 4) {
    return Response.json({ results: [] });
  }

  const cacheKey = query.toLowerCase();
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return Response.json({ results: cached.results });
  }

  try {
    const url = new URL("https://photon.komoot.io/api/");
    url.searchParams.set("q", query);
    url.searchParams.set("limit", "6");
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
