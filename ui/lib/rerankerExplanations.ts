export interface RankExplanation {
  hotelNameFragment: string;
  movedUp: boolean;
  explanation: string;
}

export interface QueryExplanations {
  [hotelNameFragment: string]: RankExplanation;
}

export const RERANKER_EXPLANATIONS: Record<string, QueryExplanations> = {
  'quiet hotel for focused remote work': {
    'Zephyr': {
      hotelNameFragment: 'Zephyr',
      movedUp: true,
      explanation: 'Reranker found "hushed co-working lounge, no gaming floor noise" buried in the room description — embeddings scored it low because the vector matched louder keywords.',
    },
    'Grand Casino': {
      hotelNameFragment: 'Grand Casino',
      movedUp: false,
      explanation: 'The name "Casino" pulled this up via BM25/embeddings, but the reranker read the full text: "24-hour slot machines adjacent to guest corridors." Dropped.',
    },
  },
  'romantic beachfront with private pool villa': {
    'Cancun Palace': {
      hotelNameFragment: 'Cancun Palace',
      movedUp: false,
      explanation: 'Strong keyword match on "beachfront" and "pool." But the reranker read the key phrase: "all-inclusive party resort with nightly foam events." Not romantic.',
    },
    'Villa Serenata': {
      hotelNameFragment: 'Villa Serenata',
      movedUp: true,
      explanation: 'Fewer keywords but the reranker understood: "secluded plunge pool on your terrace, couple\'s spa rituals at sunset." Moved from #8 to #1.',
    },
  },
  'boutique heritage hotel with authentic local architecture': {
    'Heritage Collection Suites': {
      hotelNameFragment: 'Heritage Collection Suites',
      movedUp: false,
      explanation: '"Heritage" in the name drove an exact match. But the property is a modern chain hotel — the reranker read "contemporary business amenities in a heritage-inspired building." Dropped.',
    },
    'Riad Al Andalus': {
      hotelNameFragment: 'Riad Al Andalus',
      movedUp: true,
      explanation: 'No keyword overlap, but the reranker understood the poetic description: "hand-carved cedar lattice, original zellige tilework, courtyard built in 1847." Authentic heritage — rose from #9.',
    },
  },
  'eco-lodge for wildlife photography safaris': {
    'Safari Star Hotel': {
      hotelNameFragment: 'Safari Star Hotel',
      movedUp: false,
      explanation: '"Safari" in the name dominated embeddings. The reranker read the full context: city-center Nairobi business hotel, safari tours sold at the concierge desk. Not an eco-lodge.',
    },
    'Laikipia Conservation': {
      hotelNameFragment: 'Laikipia Conservation',
      movedUp: true,
      explanation: 'The reranker found: "solar-powered bandas, resident naturalist guides, photography blinds at the watering hole, conservation levy funds anti-poaching." Exact match in meaning, not keywords.',
    },
  },
};

export function getExplanation(query: string, hotelName: string): string | null {
  const lowerQuery = query.toLowerCase();
  const lowerName = hotelName.toLowerCase();

  for (const [queryKey, explanations] of Object.entries(RERANKER_EXPLANATIONS)) {
    if (lowerQuery.includes(queryKey.toLowerCase())) {
      for (const [nameKey, exp] of Object.entries(explanations)) {
        if (lowerName.includes(nameKey.toLowerCase())) {
          return exp.explanation;
        }
      }
    }
  }
  return null;
}
