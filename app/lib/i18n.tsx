"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { LOCALE_COOKIE, type Locale } from "./locale";

export const en = {
  "common.add": "Add",
  "common.change": "Change",
  "common.goBack": "Go back",
  "common.backToDashboard": "Back to dashboard",
  "common.new": "New",
  "common.saved": "Saved",
  "common.save": "Save",
  "common.remove": "Remove",
  "common.keepHome": "Keep home",
  "common.view": "View {address}",
  "common.beds": "Beds",
  "common.baths": "Baths",
  "common.sqft": "Sq ft",
  "common.lot": "Lot",
  "common.bedrooms": "Bedrooms",
  "common.bathrooms": "Bathrooms",
  "common.squareFeet": "Square feet",
  "common.lotSize": "Lot size",
  "common.garage": "Garage",
  "common.pool": "Pool",
  "common.gated": "Gated",
  "common.hoaFee": "HOA fee",
  "common.yearBuilt": "Year built",
  "common.type": "Type",
  "common.daysListed": "Days listed",
  "common.forSale": "For Sale",
  "common.gatedCommunity": "Gated Community",
  "common.newListing": "New listing",
  "common.cityToConfirm": "City to confirm",
  "common.match": "{percent}% Match",
  "common.matchCountOne": "{count} match",
  "common.matchCountMany": "{count} matches",
  "common.removeAddress": "Remove {address}",
  "common.removeAddressFromComparison": "Remove {address} from comparison",
  "common.primary": "Primary",
  "common.savedHomeOne": "{count} saved home, side by side",
  "common.savedHomeMany": "{count} saved homes, side by side",
  "common.illustrationAria":
    "Illustration of a modern gated home with palms and a pool",

  "nav.home": "Home",
  "nav.homes": "Homes",
  "nav.wishlist": "Wishlist",
  "nav.budget": "Budget",
  "nav.more": "More",

  "dashboard.tagline": "Your home search, organized.",
  "dashboard.addHomeAria": "Add a home",
  "dashboard.browseHomes": "Browse homes",
  "dashboard.yourProgress": "Your Progress",
  "dashboard.progressAria": "Home search progress",
  "dashboard.savedHomes": "Saved Homes",
  "dashboard.upcomingTours": "Upcoming Tours",
  "dashboard.wishlistItems": "Wishlist Items",
  "dashboard.topMatches": "Top Matches",
  "dashboard.yourTopMatch": "Your Top Match",
  "dashboard.bedsValue": "{count} beds",
  "dashboard.bedsEmpty": "Beds —",
  "dashboard.bathsValue": "{count} baths",
  "dashboard.bathsEmpty": "Baths —",
  "dashboard.sqftValue": "{value} sq ft",
  "dashboard.sqftEmpty": "Sq ft —",
  "dashboard.updatedToday": "Updated today",
  "dashboard.viewDetails": "View Details",

  "compare.eyebrow": "Saved homes",
  "compare.title": "Compare Homes",
  "compare.removeConfirmTitle": "Remove {address}?",
  "compare.removeConfirmBody":
    "It will be deleted from your homes and tour notes for everyone sharing this list.",
  "compare.notePlaceholder": "Add a note about these homes…",
  "compare.noteAria": "Comparison note",
  "compare.notes": "Comparison notes",
  "compare.emptyTitle": "Nothing to compare yet",
  "compare.emptyBody": "Add a home and its details will line up here.",
  "compare.regionAria": "Home comparison",
  "compare.swipeHint":
    "Swipe sideways to compare every home, or tap one for details.",
  "compare.tapHint": "Tap any home to see the full listing.",
  "compare.showLess": "Show Less",
  "compare.viewFull": "View Full Comparison",
  "compare.matchBadge": "{percent}%",

  "more.eyebrow": "Everything else",
  "more.title": "More",
  "more.summary": "Your search so far",
  "more.active": "Active",
  "more.savedHomes": "Saved homes",
  "more.tours": "Tours",
  "more.topMatch": "Top match",
  "more.synced": "Synced across your devices",
  "more.local": "Saved on this device only",
  "more.connecting": "Connecting…",
  "more.yourSearch": "Your search",
  "more.comingSoon": "Coming soon",
  "more.compare": "Compare Homes",
  "more.wishlist": "Wishlist",
  "more.wishlistDetail": "Must-haves, nice-to-haves and progress",
  "more.tourNotes": "Tour Notes",
  "more.tourNotesDetail": "Ratings, impressions, pros and cons",
  "more.neighborhood": "Neighborhood",
  "more.neighborhoodDetail": "Schools, errands, flood and evacuation",
  "more.budget": "Budget Planner",
  "more.budgetDetail": "The real monthly number",
  "more.documents": "Documents",
  "more.documentsDetail": "Disclosures, inspections and offers",
  "more.cities": "Cities to Avoid",
  "more.citiesDetail": "Keep your dealbreakers close",
  "more.settings": "Settings",
  "more.settingsDetail": "Notifications, account and appearance",
  "more.soon": "Soon",
  "more.version": "Version 1.0 · Made for your search",
  "more.language": "Language",
  "more.languageHint": "Choose the language for the app.",
  "more.english": "English",
  "more.spanish": "Español",

  "budget.eyebrow": "The real number",
  "budget.title": "Budget Planner",
  "budget.intro":
    "See what the monthly payment would really look like.",
  "budget.monthly": "Monthly Payment",
  "budget.total": "Total Cost",
  "budget.homePrice": "Home Price",
  "budget.downPercent": "{percent}% down",
  "budget.homePriceAria": "Home price",
  "budget.downPayment": "Down Payment",
  "budget.downPaymentAria": "Down payment",
  "budget.loanTerm": "Loan Term",
  "budget.termYears": "{years}y",
  "budget.interestRate": "Interest Rate",
  "budget.interestRateAria": "Interest rate",
  "budget.estimatedMonthly": "Estimated Monthly Payment",
  "budget.totalOverYears": "Total Cost Over {years} Years",
  "budget.includesMonthly":
    "Includes taxes, insurance, HOA and maintenance.",
  "budget.includesTotal":
    "Includes down payment, loan payments and monthly costs.",
  "budget.breakdown": "Monthly breakdown",
  "budget.principalInterest": "Principal & interest",
  "budget.propertyTaxes": "Property taxes",
  "budget.insurance": "Homeowners insurance",
  "budget.hoa": "HOA fees",
  "budget.maintenance": "Estimated maintenance",
  "budget.loanAmount": "Loan amount",
  "budget.totalInterest": "Total interest",
  "budget.downPaymentShort": "Down payment",
  "budget.hideBreakdown": "Hide Full Breakdown",
  "budget.viewBreakdown": "View Full Breakdown",

  "wishlist.eyebrow": "Your criteria",
  "wishlist.title": "My Wishlist",
  "wishlist.addAria": "Add a wishlist item",
  "wishlist.all": "All",
  "wishlist.must": "Must-have ({count})",
  "wishlist.nice": "Nice-to-have ({count})",
  "wishlist.addNice": "Add a nice-to-have…",
  "wishlist.addMust": "Add a must-have…",
  "wishlist.mustComplete": "{done} of {total} must-haves complete",
  "wishlist.niceComplete": "{done} of {total} nice-to-haves complete",
  "wishlist.inspiration": "Need inspiration?",
  "wishlist.inspirationBody": "Browse homes that match your wishlist.",
  "wishlist.otherCategory": "Other",

  "tour.eyebrow": "Your impressions",
  "tour.title": "Tour Notes",
  "tour.howFeel": "How did it feel?",
  "tour.notRated": "Not rated yet",
  "tour.rate": "Rate {value} out of 5",
  "tour.notes": "Notes",
  "tour.tapToEdit": "Tap to edit",
  "tour.notesAria": "Tour notes",
  "tour.notesPlaceholder": "What stood out? What would you change?",
  "tour.loved": "What you loved",
  "tour.lovedPlaceholder": "Add something you loved…",
  "tour.pause": "What gave you pause",
  "tour.pausePlaceholder": "Add a concern…",
  "tour.notesSaved": "Notes Saved",
  "tour.saveNotes": "Save Tour Notes",
  "tour.nothingAdded": "Nothing added yet.",
  "tour.removeItem": "Remove {item}",
  "tour.rating1": "Not for us",
  "tour.rating2": "Needs work",
  "tour.rating3": "Worth a look",
  "tour.rating4": "Strong contender",
  "tour.rating5": "Loved it",

  "property.share": "Share this home",
  "property.removeSaved": "Remove from saved homes",
  "property.saveHome": "Save this home",
  "property.facts": "Property facts",
  "property.about": "About this home",
  "property.noDescription":
    "No description yet. Add details from the listing, or capture your impressions in Tour Notes after you visit.",
  "property.tourDetail": "Rating, notes, pros and cons",
  "property.neighborhoodDetail":
    "Schools, commute times and flood zone",
  "property.details": "Home details",
  "property.type": "Property type",
  "property.hoa": "HOA",
  "property.hoaMonthly": "${amount}/mo",
  "property.daysOnMarket": "Days on market",
  "property.daysValue": "{count} days",
  "property.scheduleTour": "Schedule Tour",
  "property.tourRequested": "Tour Requested",
  "property.gated": "Gated",

  "neighborhood.eyebrow": "The area",
  "neighborhood.title": "Neighborhood",
  "neighborhood.mapAria":
    "Map of the neighborhood showing streets, parks and nearby water",
  "neighborhood.tabOverview": "Overview",
  "neighborhood.tabSchools": "Schools",
  "neighborhood.tabErrands": "Errands",
  "neighborhood.tabSafety": "Safety",
  "neighborhood.walkScore": "Walk Score",
  "neighborhood.transit": "Transit",
  "neighborhood.bikeable": "Bikeable",
  "neighborhood.commute": "Min commute",
  "neighborhood.aroundCorner": "Around the corner",
  "neighborhood.parks": "3 parks within a 10-minute walk",
  "neighborhood.grocery": "Grocery and cafés under 5 minutes away",
  "neighborhood.highway": "Easy access to I-95 and the beach",
  "neighborhood.gated": "Gated community with a staffed entry",
  "neighborhood.established": "Established, owner-occupied street",
  "neighborhood.schoolElementary": "Elementary",
  "neighborhood.schoolMiddle": "Middle",
  "neighborhood.schoolHigh": "High",
  "neighborhood.schoolLine": "{level} · {minutes} min drive",
  "neighborhood.schoolNote":
    "School ratings are illustrative. Confirm zoning with the district.",
  "neighborhood.errandGrocery": "Grocery",
  "neighborhood.errandHighway": "Highway",
  "neighborhood.errandPharmacy": "Pharmacy",
  "neighborhood.errandCoffee": "Coffee",
  "neighborhood.errandAirport": "Airport",
  "neighborhood.errandHighwayDetail": "I-95 on-ramp",
  "neighborhood.minutes": "{minutes} min",
  "neighborhood.errandNote":
    "Drive times are estimates at typical traffic.",
  "neighborhood.riskSnapshot": "Risk snapshot",
  "neighborhood.lowFlood": "Low flood risk",
  "neighborhood.lowFloodBody":
    "Outside high-risk flood and evacuation zones, on a quiet residential street.",
  "neighborhood.floodZoneX": "Flood Zone X",
  "neighborhood.floodZoneXDetail":
    "Minimal flood risk. Not in a high-risk flood area according to FEMA maps.",
  "neighborhood.noEvac": "Not in an evacuation zone",
  "neighborhood.noEvacDetail":
    "The property sits outside local evacuation zones.",
  "neighborhood.quietStreet": "Quiet residential street",
  "neighborhood.quietStreetDetail":
    "Low traffic, with a neighborhood watch and well-lit sidewalks.",
  "neighborhood.safetyNote":
    "Verify insurance and flood maps with the county before making an offer.",

  "add.eyebrow": "New shortlist",
  "add.title": "Add a Home",
  "add.intro":
    "Pick a state to make suggestions more accurate, then start typing a street address and choose the closest match. You can add the details you know and fill in the rest later.",
  "add.state": "State",
  "add.optional": "(optional)",
  "add.anyState": "Any state",
  "add.stateSelected":
    "Address suggestions will be narrowed to {state}.",
  "add.stateHint":
    "Choosing a state first narrows the address suggestions to that state.",
  "add.streetAddress": "Street address",
  "add.streetPlaceholder": "e.g. 123 Palm Lane",
  "add.suggestionsAria": "Address suggestions",
  "add.searchUnavailable":
    "Address suggestions are unavailable right now. You can still add the address you typed.",
  "add.noMatches":
    "No matches found. You can still add the address you typed.",
  "add.searching": "Searching addresses…",
  "add.searchingAria": "Searching for address suggestions.",
  "add.suggestionsAvailable": "{count} address suggestions available.",
  "add.keepTyping": "Keep typing to see address suggestions.",
  "add.duplicate": "This address is already in your shortlist.",
  "add.nearDuplicate":
    "You already saved {address}. Check that this is a different home.",
  "add.city": "City / area",
  "add.cityPlaceholder": "e.g. Miami, FL 33137",
  "add.details": "Details",
  "add.lookUp": "Look up details",
  "add.lookingUp": "Looking up…",
  "add.recordsFound": "Public records found",
  "add.hintIdle":
    "Fill in what you know, or look up beds, baths and square footage from public records.",
  "add.hintLoading": "Searching public records for this address…",
  "add.hintFound":
    "Beds, baths, square footage and lot were prefilled where available. Double-check before saving.",
  "add.hintEmpty":
    "No public records found for this address. You can still fill in the details manually.",
  "add.hintError":
    "Property details aren't available right now. Fill them in manually or try again.",
  "add.factsAria": "Public-record property facts",
  "add.built": "Built {year}",
  "add.lastSold": "Last sold {price}",
  "add.lastSoldYear": "Last sold {price} in {year}",
  "add.recordsNote":
    "From public records — confirm before saving. The last sale price is not the current asking price.",
  "add.price": "Price",
  "add.squareFeet": "Square feet",
  "add.beds": "Beds",
  "add.baths": "Baths",
  "add.enterAddress": "Enter a street address to continue.",
  "add.alreadySaved": "That address is already in your shortlist.",
  "add.adding": "Adding home…",
  "add.addHome": "Add Home",
  "add.statusSynced": "Saved to your shared shortlist.",
  "add.statusLocal":
    "Saved on this device until your shared list reconnects.",
  "add.statusConnecting": "Connecting to your shortlist…",
} as const;

export type TranslationKey = keyof typeof en;

const es: Record<TranslationKey, string> = {
  "common.add": "Agregar",
  "common.change": "Cambiar",
  "common.goBack": "Volver",
  "common.backToDashboard": "Volver al inicio",
  "common.new": "Nueva",
  "common.saved": "Guardada",
  "common.save": "Guardar",
  "common.remove": "Quitar",
  "common.keepHome": "Conservar casa",
  "common.view": "Ver {address}",
  "common.beds": "Habit.",
  "common.baths": "Baños",
  "common.sqft": "Pies²",
  "common.lot": "Lote",
  "common.bedrooms": "Habitaciones",
  "common.bathrooms": "Baños",
  "common.squareFeet": "Pies cuadrados",
  "common.lotSize": "Tamaño del lote",
  "common.garage": "Garaje",
  "common.pool": "Piscina",
  "common.gated": "Privada",
  "common.hoaFee": "Cuota de HOA",
  "common.yearBuilt": "Año de construcción",
  "common.type": "Tipo",
  "common.daysListed": "Días en el mercado",
  "common.forSale": "En venta",
  "common.gatedCommunity": "Comunidad privada",
  "common.newListing": "Nuevo anuncio",
  "common.cityToConfirm": "Ciudad por confirmar",
  "common.match": "{percent}% de coincidencia",
  "common.matchCountOne": "{count} coincidencia",
  "common.matchCountMany": "{count} coincidencias",
  "common.removeAddress": "Quitar {address}",
  "common.removeAddressFromComparison": "Quitar {address} de la comparación",
  "common.primary": "Principal",
  "common.savedHomeOne": "{count} casa guardada, lado a lado",
  "common.savedHomeMany": "{count} casas guardadas, lado a lado",
  "common.illustrationAria":
    "Ilustración de una casa moderna privada con palmeras y piscina",

  "nav.home": "Inicio",
  "nav.homes": "Casas",
  "nav.wishlist": "Deseos",
  "nav.budget": "Presupuesto",
  "nav.more": "Más",

  "dashboard.tagline": "Tu búsqueda de casa, organizada.",
  "dashboard.addHomeAria": "Agregar una casa",
  "dashboard.browseHomes": "Explorar casas",
  "dashboard.yourProgress": "Tu progreso",
  "dashboard.progressAria": "Progreso de la búsqueda de casa",
  "dashboard.savedHomes": "Casas guardadas",
  "dashboard.upcomingTours": "Visitas próximas",
  "dashboard.wishlistItems": "Deseos",
  "dashboard.topMatches": "Mejores coincidencias",
  "dashboard.yourTopMatch": "Tu mejor opción",
  "dashboard.bedsValue": "{count} hab.",
  "dashboard.bedsEmpty": "Habit. —",
  "dashboard.bathsValue": "{count} baños",
  "dashboard.bathsEmpty": "Baños —",
  "dashboard.sqftValue": "{value} pies²",
  "dashboard.sqftEmpty": "Pies² —",
  "dashboard.updatedToday": "Actualizado hoy",
  "dashboard.viewDetails": "Ver detalles",

  "compare.eyebrow": "Casas guardadas",
  "compare.title": "Comparar casas",
  "compare.removeConfirmTitle": "¿Quitar {address}?",
  "compare.removeConfirmBody":
    "Se eliminará de tus casas y notas de visita para todos los que comparten esta lista.",
  "compare.notePlaceholder": "Agrega una nota sobre estas casas…",
  "compare.noteAria": "Nota de comparación",
  "compare.notes": "Notas de comparación",
  "compare.emptyTitle": "Aún no hay nada que comparar",
  "compare.emptyBody":
    "Agrega una casa y sus detalles aparecerán aquí.",
  "compare.regionAria": "Comparación de casas",
  "compare.swipeHint":
    "Desliza hacia los lados para comparar todas las casas o toca una para ver los detalles.",
  "compare.tapHint": "Toca cualquier casa para ver la ficha completa.",
  "compare.showLess": "Mostrar menos",
  "compare.viewFull": "Ver comparación completa",
  "compare.matchBadge": "{percent}%",

  "more.eyebrow": "Todo lo demás",
  "more.title": "Más",
  "more.summary": "Tu búsqueda hasta ahora",
  "more.active": "Activa",
  "more.savedHomes": "Casas guardadas",
  "more.tours": "Visitas",
  "more.topMatch": "Mejor opción",
  "more.synced": "Sincronizado en tus dispositivos",
  "more.local": "Guardado solo en este dispositivo",
  "more.connecting": "Conectando…",
  "more.yourSearch": "Tu búsqueda",
  "more.comingSoon": "Próximamente",
  "more.compare": "Comparar casas",
  "more.wishlist": "Lista de deseos",
  "more.wishlistDetail": "Imprescindibles, deseos y progreso",
  "more.tourNotes": "Notas de visita",
  "more.tourNotesDetail": "Calificaciones, impresiones, pros y contras",
  "more.neighborhood": "Vecindario",
  "more.neighborhoodDetail":
    "Escuelas, mandados, inundaciones y evacuación",
  "more.budget": "Planificador de presupuesto",
  "more.budgetDetail": "El número mensual real",
  "more.documents": "Documentos",
  "more.documentsDetail": "Divulgaciones, inspecciones y ofertas",
  "more.cities": "Ciudades a evitar",
  "more.citiesDetail": "Mantén cerca lo que no quieres",
  "more.settings": "Ajustes",
  "more.settingsDetail": "Notificaciones, cuenta y apariencia",
  "more.soon": "Pronto",
  "more.version": "Versión 1.0 · Hecha para tu búsqueda",
  "more.language": "Idioma",
  "more.languageHint": "Elige el idioma de la app.",
  "more.english": "English",
  "more.spanish": "Español",

  "budget.eyebrow": "El número real",
  "budget.title": "Planificador de presupuesto",
  "budget.intro": "Mira cómo sería realmente el pago mensual.",
  "budget.monthly": "Pago mensual",
  "budget.total": "Costo total",
  "budget.homePrice": "Precio de la casa",
  "budget.downPercent": "{percent}% de enganche",
  "budget.homePriceAria": "Precio de la casa",
  "budget.downPayment": "Enganche",
  "budget.downPaymentAria": "Enganche",
  "budget.loanTerm": "Plazo del préstamo",
  "budget.termYears": "{years} a",
  "budget.interestRate": "Tasa de interés",
  "budget.interestRateAria": "Tasa de interés",
  "budget.estimatedMonthly": "Pago mensual estimado",
  "budget.totalOverYears": "Costo total en {years} años",
  "budget.includesMonthly":
    "Incluye impuestos, seguro, HOA y mantenimiento.",
  "budget.includesTotal":
    "Incluye enganche, pagos del préstamo y costos mensuales.",
  "budget.breakdown": "Desglose mensual",
  "budget.principalInterest": "Capital e intereses",
  "budget.propertyTaxes": "Impuestos sobre la propiedad",
  "budget.insurance": "Seguro de vivienda",
  "budget.hoa": "Cuotas de HOA",
  "budget.maintenance": "Mantenimiento estimado",
  "budget.loanAmount": "Monto del préstamo",
  "budget.totalInterest": "Intereses totales",
  "budget.downPaymentShort": "Enganche",
  "budget.hideBreakdown": "Ocultar desglose",
  "budget.viewBreakdown": "Ver desglose completo",

  "wishlist.eyebrow": "Tus criterios",
  "wishlist.title": "Mi lista de deseos",
  "wishlist.addAria": "Agregar un deseo",
  "wishlist.all": "Todo",
  "wishlist.must": "Imprescindibles ({count})",
  "wishlist.nice": "Deseos ({count})",
  "wishlist.addNice": "Agrega un deseo…",
  "wishlist.addMust": "Agrega un imprescindible…",
  "wishlist.mustComplete": "{done} de {total} imprescindibles completados",
  "wishlist.niceComplete": "{done} de {total} deseos completados",
  "wishlist.inspiration": "¿Necesitas inspiración?",
  "wishlist.inspirationBody": "Explora casas que coincidan con tu lista.",
  "wishlist.otherCategory": "Otros",

  "tour.eyebrow": "Tus impresiones",
  "tour.title": "Notas de visita",
  "tour.howFeel": "¿Cómo se sintió?",
  "tour.notRated": "Sin calificar",
  "tour.rate": "Calificar {value} de 5",
  "tour.notes": "Notas",
  "tour.tapToEdit": "Toca para editar",
  "tour.notesAria": "Notas de visita",
  "tour.notesPlaceholder": "¿Qué te llamó la atención? ¿Qué cambiarías?",
  "tour.loved": "Lo que te gustó",
  "tour.lovedPlaceholder": "Agrega algo que te gustó…",
  "tour.pause": "Lo que te hizo dudar",
  "tour.pausePlaceholder": "Agrega una preocupación…",
  "tour.notesSaved": "Notas guardadas",
  "tour.saveNotes": "Guardar notas de visita",
  "tour.nothingAdded": "Aún no hay nada.",
  "tour.removeItem": "Quitar {item}",
  "tour.rating1": "No es para nosotros",
  "tour.rating2": "Necesita trabajo",
  "tour.rating3": "Vale la pena verla",
  "tour.rating4": "Fuerte candidata",
  "tour.rating5": "Nos encantó",

  "property.share": "Compartir esta casa",
  "property.removeSaved": "Quitar de casas guardadas",
  "property.saveHome": "Guardar esta casa",
  "property.facts": "Datos de la propiedad",
  "property.about": "Sobre esta casa",
  "property.noDescription":
    "Aún no hay descripción. Agrega detalles del anuncio o guarda tus impresiones en Notas de visita después de verla.",
  "property.tourDetail": "Calificación, notas, pros y contras",
  "property.neighborhoodDetail":
    "Escuelas, tiempos de viaje y zona de inundación",
  "property.details": "Detalles de la casa",
  "property.type": "Tipo de propiedad",
  "property.hoa": "HOA",
  "property.hoaMonthly": "${amount}/mes",
  "property.daysOnMarket": "Días en el mercado",
  "property.daysValue": "{count} días",
  "property.scheduleTour": "Agendar visita",
  "property.tourRequested": "Visita solicitada",
  "property.gated": "Privada",

  "neighborhood.eyebrow": "La zona",
  "neighborhood.title": "Vecindario",
  "neighborhood.mapAria":
    "Mapa del vecindario con calles, parques y agua cercana",
  "neighborhood.tabOverview": "Resumen",
  "neighborhood.tabSchools": "Escuelas",
  "neighborhood.tabErrands": "Mandados",
  "neighborhood.tabSafety": "Seguridad",
  "neighborhood.walkScore": "Caminabilidad",
  "neighborhood.transit": "Transporte",
  "neighborhood.bikeable": "Bicicleta",
  "neighborhood.commute": "Viaje mínimo",
  "neighborhood.aroundCorner": "A la vuelta",
  "neighborhood.parks": "3 parques a 10 minutos a pie",
  "neighborhood.grocery": "Supermercado y cafés a menos de 5 minutos",
  "neighborhood.highway": "Acceso fácil a la I-95 y la playa",
  "neighborhood.gated": "Comunidad privada con acceso vigilado",
  "neighborhood.established": "Calle establecida, habitada por sus dueños",
  "neighborhood.schoolElementary": "Primaria",
  "neighborhood.schoolMiddle": "Intermedia",
  "neighborhood.schoolHigh": "Secundaria",
  "neighborhood.schoolLine": "{level} · {minutes} min en auto",
  "neighborhood.schoolNote":
    "Las calificaciones escolares son ilustrativas. Confirma la zonificación con el distrito.",
  "neighborhood.errandGrocery": "Supermercado",
  "neighborhood.errandHighway": "Autopista",
  "neighborhood.errandPharmacy": "Farmacia",
  "neighborhood.errandCoffee": "Café",
  "neighborhood.errandAirport": "Aeropuerto",
  "neighborhood.errandHighwayDetail": "Rampla de I-95",
  "neighborhood.minutes": "{minutes} min",
  "neighborhood.errandNote":
    "Los tiempos de manejo son estimados con tráfico típico.",
  "neighborhood.riskSnapshot": "Resumen de riesgo",
  "neighborhood.lowFlood": "Bajo riesgo de inundación",
  "neighborhood.lowFloodBody":
    "Fuera de zonas de alto riesgo de inundación y evacuación, en una calle residencial tranquila.",
  "neighborhood.floodZoneX": "Zona de inundación X",
  "neighborhood.floodZoneXDetail":
    "Riesgo mínimo de inundación. No está en una zona de alto riesgo según los mapas de FEMA.",
  "neighborhood.noEvac": "Fuera de zona de evacuación",
  "neighborhood.noEvacDetail":
    "La propiedad está fuera de las zonas de evacuación locales.",
  "neighborhood.quietStreet": "Calle residencial tranquila",
  "neighborhood.quietStreetDetail":
    "Poco tráfico, con vigilancia vecinal y aceras bien iluminadas.",
  "neighborhood.safetyNote":
    "Verifica el seguro y los mapas de inundación con el condado antes de hacer una oferta.",

  "add.eyebrow": "Nueva lista",
  "add.title": "Agregar una casa",
  "add.intro":
    "Elige un estado para mejorar las sugerencias y luego escribe una dirección y selecciona la coincidencia más cercana. Puedes agregar los datos que conozcas y completar el resto después.",
  "add.state": "Estado",
  "add.optional": "(opcional)",
  "add.anyState": "Cualquier estado",
  "add.stateSelected":
    "Las sugerencias de dirección se limitarán a {state}.",
  "add.stateHint":
    "Elegir un estado primero limita las sugerencias de dirección a ese estado.",
  "add.streetAddress": "Dirección",
  "add.streetPlaceholder": "p. ej., 123 Palm Lane",
  "add.suggestionsAria": "Sugerencias de dirección",
  "add.searchUnavailable":
    "Las sugerencias de dirección no están disponibles ahora. Aún puedes agregar la dirección que escribiste.",
  "add.noMatches":
    "No se encontraron coincidencias. Aún puedes agregar la dirección que escribiste.",
  "add.searching": "Buscando direcciones…",
  "add.searchingAria": "Buscando sugerencias de dirección.",
  "add.suggestionsAvailable": "{count} sugerencias de dirección disponibles.",
  "add.keepTyping": "Sigue escribiendo para ver sugerencias de dirección.",
  "add.duplicate": "Esta dirección ya está en tu lista.",
  "add.nearDuplicate":
    "Ya guardaste {address}. Verifica que sea una casa diferente.",
  "add.city": "Ciudad / zona",
  "add.cityPlaceholder": "p. ej., Miami, FL 33137",
  "add.details": "Detalles",
  "add.lookUp": "Buscar detalles",
  "add.lookingUp": "Buscando…",
  "add.recordsFound": "Registros públicos encontrados",
  "add.hintIdle":
    "Completa lo que sepas o busca habitaciones, baños y pies cuadrados en registros públicos.",
  "add.hintLoading": "Buscando este domicilio en registros públicos…",
  "add.hintFound":
    "Se completaron habitaciones, baños, pies cuadrados y lote cuando estaban disponibles. Verifica antes de guardar.",
  "add.hintEmpty":
    "No se encontraron registros públicos para esta dirección. Aún puedes completar los detalles manualmente.",
  "add.hintError":
    "Los detalles de la propiedad no están disponibles ahora. Complétalos manualmente o inténtalo de nuevo.",
  "add.factsAria": "Datos de propiedad de registros públicos",
  "add.built": "Construida en {year}",
  "add.lastSold": "Última venta {price}",
  "add.lastSoldYear": "Última venta {price} en {year}",
  "add.recordsNote":
    "De registros públicos: confirma antes de guardar. El precio de la última venta no es el precio de venta actual.",
  "add.price": "Precio",
  "add.squareFeet": "Pies cuadrados",
  "add.beds": "Habitaciones",
  "add.baths": "Baños",
  "add.enterAddress": "Ingresa una dirección para continuar.",
  "add.alreadySaved": "Esa dirección ya está en tu lista.",
  "add.adding": "Agregando casa…",
  "add.addHome": "Agregar casa",
  "add.statusSynced": "Guardado en tu lista compartida.",
  "add.statusLocal":
    "Guardado en este dispositivo hasta que tu lista compartida se reconecte.",
  "add.statusConnecting": "Conectando con tu lista…",
};

/**
 * Seeded wishlist categories and items are stored in English in the shared
 * dataset. Translate them for display only, so custom items stay exactly as
 * the user typed them.
 */
const ES_WISHLIST_TEXT: Record<string, string> = {
  "Bedrooms & Workspaces": "Dormitorios y espacios de trabajo",
  "Interior & Layout": "Interiores y distribución",
  Kitchen: "Cocina",
  "Outdoor Space": "Espacio exterior",
  "Community Amenities": "Amenidades de la comunidad",
  "Location & Neighborhood": "Ubicación y vecindario",
  "Home Condition": "Estado de la casa",
  "3+ bedrooms": "3+ dormitorios",
  "Primary suite": "Suite principal",
  "Dedicated home office": "Oficina en casa",
  "Guest room": "Cuarto de huéspedes",
  "Walk-in closet": "Vestidor",
  "Flexible playroom": "Sala de juegos flexible",
  "Separate laundry room": "Cuarto de lavado separado",
  "Open floor plan": "Plano abierto",
  "High ceilings": "Techos altos",
  "Ample storage": "Amplio almacenamiento",
  "Indoor-outdoor flow": "Conexión interior-exterior",
  "Separate dining room": "Comedor separado",
  Mudroom: "Recibidor",
  "Bonus room": "Cuarto adicional",
  "Hardwood floors": "Pisos de madera",
  "Dedicated office nook": "Rincón de oficina",
  "Kitchen island": "Isla de cocina",
  "Gas range": "Estufa de gas",
  "Double oven": "Horno doble",
  "Updated cabinets": "Gabinetes renovados",
  "Walk-in pantry": "Despensa",
  "Breakfast nook": "Rincón de desayuno",
  "Fenced yard": "Patio cercado",
  "Covered patio": "Patio cubierto",
  Pool: "Piscina",
  "Garden space": "Espacio para jardín",
  "Outdoor kitchen": "Cocina exterior",
  "Room for a playset": "Espacio para juegos",
  "Gated entry": "Entrada privada",
  "Walking trails": "Senderos",
  "Dog park": "Parque para perros",
  "Community gym": "Gimnasio comunitario",
  Playground: "Área de juegos",
  Clubhouse: "Casa club",
  "Tennis courts": "Canchas de tenis",
  "Guest parking": "Estacionamiento para visitas",
  "Good schools": "Buenas escuelas",
  "Quiet street": "Calle tranquila",
  "Walkable errands": "Mandados a pie",
  "Near parks": "Cerca de parques",
  "Short commute": "Viaje corto al trabajo",
  "Low flood risk": "Bajo riesgo de inundación",
  "Grocery nearby": "Supermercado cerca",
  "Easy highway access": "Acceso fácil a la autopista",
  "Move-in ready": "Lista para mudarse",
  "New roof": "Techo nuevo",
  "HVAC under 5 years": "A/C de menos de 5 años",
  "Updated electrical": "Sistema eléctrico renovado",
  "New windows": "Ventanas nuevas",
  "Recently painted": "Pintada recientemente",
  "No major repairs": "Sin reparaciones mayores",
  "2+ bathrooms": "2+ baños",
  "2-car garage": "Garaje para 2 autos",
  "Updated kitchen": "Cocina renovada",
  "Fenced backyard": "Patio trasero cercado",
  "Good school district": "Buen distrito escolar",
  "Central air": "Aire acondicionado central",
  "Laundry room": "Cuarto de lavado",
  "Storage space": "Espacio de almacenamiento",
  "Pet-friendly yard": "Patio para mascotas",
  "Gated community": "Comunidad privada",
  Fireplace: "Chimenea",
  "Water view": "Vista al agua",
  "Smart home": "Casa inteligente",
  "Guest suite": "Suite de huéspedes",
  "EV charger": "Cargador para auto eléctrico",
  Other: "Otros",
};

const ES_PROPERTY_TYPES: Record<string, string> = {
  "Single family": "Unifamiliar",
  "Single Family": "Unifamiliar",
  Condo: "Condominio",
  Condominium: "Condominio",
  Townhouse: "Adosado",
  "Multi-family": "Multifamiliar",
  "Multi-Family": "Multifamiliar",
  Villa: "Villa",
  Apartment: "Apartamento",
  Mobile: "Casa móvil",
  Manufactured: "Casa móvil",
  "Vacant land": "Terreno",
};

export function translateWishlistText(value: string, locale: Locale) {
  return locale === "es" ? (ES_WISHLIST_TEXT[value] ?? value) : value;
}

export function translatePropertyType(value: string, locale: Locale) {
  return locale === "es" ? (ES_PROPERTY_TYPES[value] ?? value) : value;
}

type I18nValue = {
  locale: Locale;
  localeCode: string;
  setLocale: (locale: Locale) => void;
  t: (
    key: TranslationKey,
    vars?: Record<string, string | number>,
  ) => string;
  number: (value: number, options?: Intl.NumberFormatOptions) => string;
};

const I18nContext = createContext<I18nValue | null>(null);

export function LanguageProvider({
  initialLocale = "en",
  children,
}: {
  initialLocale?: Locale;
  children: ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    document.documentElement.lang = next;
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
  }, []);

  const value = useMemo<I18nValue>(() => {
    const localeCode = locale === "es" ? "es-US" : "en-US";
    const dictionary = locale === "es" ? es : en;

    const t = (
      key: TranslationKey,
      vars?: Record<string, string | number>,
    ) => {
      let text = dictionary[key] ?? en[key] ?? key;
      if (vars) {
        for (const [name, replacement] of Object.entries(vars)) {
          text = text
            .split(`{${name}}`)
            .join(String(replacement));
        }
      }
      return text;
    };

    const number = (
      input: number,
      options?: Intl.NumberFormatOptions,
    ) => new Intl.NumberFormat(localeCode, options).format(input);

    return { locale, localeCode, setLocale, t, number };
  }, [locale, setLocale]);

  return (
    <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within a LanguageProvider");
  }
  return context;
}
