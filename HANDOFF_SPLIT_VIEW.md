# Handoff: Split-Screen UI Redesign

*Written 2026-05-06 for the next session. Do not build anything until you have read both this file and REDESIGN_REASONING.md.*

---

## Current State

Branch: `feat/concierge-ui-overhaul`
All existing work is committed and clean. Nothing from the redesign has been built yet.

Dev server: `npm run dev -- --port 3005` from `ui/`
App URL: `http://localhost:3005/horizon`

---

## What the Next Session Must Build

The full architectural reasoning is in `REDESIGN_REASONING.md`. Read it first. This file is the task list.

### Session 1 goal: Persistent 65/35 split layout (the shell)

Jeff's vision: chat is the PRIMARY interface. When the user clicks "Ask AI" or submits the hero input, the page transitions from the travel home into a persistent split-screen where:
- **Left ~65%**: hotel results canvas (search results + filter drawer + "AI Pick" pinned hotels)
- **Right ~35%**: chat panel (TripCart at top + AgentChat embedded at bottom)

Both sides are always visible simultaneously. No flyout, no modal, no wasted real estate.

---

## New Files to Create

### 1. `ui/components/TripCart.tsx`

Shopping cart at the top of the chat panel. State: `{ checkin: Date|null, checkout: Date|null, guests: number, selectedHotel: ChatHotel|null }`.

Install `react-day-picker` first: `npm install react-day-picker --legacy-peer-deps`

Fields:
- Date range picker (react-day-picker, inline popup on click, range selection: first click = checkin, second click = checkout if after checkin)
- Guest count with +/− buttons (min 1, max 20, default 2)
- Selected hotel display (shows when user clicks a hotel card, with X to clear)
- Collapsible via chevron (so chat gets more vertical space)

Export `TripCartState` interface for parent to consume:
```ts
export interface TripCartState {
  checkin: Date | null;
  checkout: Date | null;
  guests: number;
  selectedHotel: ChatHotel | null;
}
```

### 2. `ui/components/ResultsCanvas.tsx`

The hotel results area — left side of the split. Self-contained, owns its own search state.

Props:
```ts
interface ResultsCanvasProps {
  agentPickIds: string[];     // hotel IDs from the agent — pinned at top with "✨ AI Pick" badge
  onSelectHotel: (hotel: Hotel) => void;
  initialQuery?: string;      // prefills the search input if provided
}
```

Features:
- Compact top bar: keyword search input + "Go" button + filter toggle + sort dropdown
- Collapsible filter drawer (inline, not sidebar): rating, style, amenities, price range
- Hotel grid: `repeat(auto-fill, minmax(260px, 1fr))`
- AI Pick hotels: sorted to top, teal border, "✨ AI Pick" badge overlay replacing "Free cancellation"
- Empty state: "Chat to find your perfect stay — AI picks will appear here" when no search and no agent picks
- All the same filter/sort logic as TravelHome (style, amenities, rating, price, sort keys)
- Use the same `HotelCard` inner component pattern from TravelHome (copy it, don't import from there)

When `agentPickIds` arrives but user hasn't searched: show only the AI pick hotels.
When user has searched: show all results, AI picks pinned at top.

### 3. `ui/components/TravelSplitView.tsx`

The main shell. Owns: agentPickIds state, tripCart state, wires everything together.

```tsx
<div className="flex flex-col h-screen overflow-hidden">
  <header>  {/* compact 52px nav: back button, Horizon logo, theme toggle, How It Works */}
  <div className="flex flex-1 min-h-0">
    <div className="flex-1 min-w-0 border-r">
      <ResultsCanvas agentPickIds={agentPickIds} onSelectHotel={...} initialQuery={initialQuery} />
    </div>
    <div style={{ width: 'clamp(400px, 32%, 540px)' }} className="flex flex-col flex-shrink-0">
      <TripCart state={tripCart} onChange={setTripCart} />
      <div className="flex-1 min-h-0">
        <AgentChat panel onOpenHotel={...} onAgentHotels={...} tripContext={...} initialMessage={initialQuery} />
      </div>
    </div>
  </div>
</div>
```

Props:
```ts
interface TravelSplitViewProps {
  onBack: () => void;
  onShowDemo: () => void;
  onOpenHotel: (hotel: Hotel) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  demoMode: boolean;
  onToggleDemo: () => void;
  initialQuery?: string;
}
```

Data flow inside TravelSplitView:
- `agentPickIds: string[]` — set when AgentChat fires `onAgentHotels(hotels)` → extract hotel IDs
- `tripCart: TripCartState` — owned here, passed to TripCart and used to build tripContext string
- `tripContext` — built from cart state, prepended to every message: `"[Trip context: 2 guests, check-in May 13, check-out May 14]"`
- `initialQuery` — passed to both ResultsCanvas (prefills search) and AgentChat (fires on mount)
- When user clicks hotel card in ResultsCanvas → `onOpenHotel(hotel)` → HotelDetailModal opens
- When user clicks hotel card in AgentChat → set `tripCart.selectedHotel` AND `onOpenHotel(chatHotelToHotel(...))`

Helper for building tripContext (return undefined if only guests=2 and nothing else meaningful):
```ts
function buildTripContext(cart: TripCartState): string | undefined {
  const parts: string[] = [];
  if (cart.checkin && cart.checkout) {
    parts.push(`check-in ${fmt(cart.checkin)}, check-out ${fmt(cart.checkout)}`);
  }
  parts.push(`${cart.guests} guests`);
  if (cart.selectedHotel) parts.push(`considering: ${cart.selectedHotel.name}`);
  if (parts.length === 1 && cart.guests === 2 && !cart.selectedHotel) return undefined;
  return `[Trip context: ${parts.join(', ')}]`;
}
```

---

## Files to Modify

### 4. `ui/components/AgentChat.tsx`

Add three new props to `AgentChatProps`:
```ts
panel?: boolean;                                    // fills its container, no border/shadow
onAgentHotels?: (hotels: ChatHotel[]) => void;     // called when latest complete message has hotels
tripContext?: string;                               // prepended to every sendMessage call
initialMessage?: string;                           // sent once on mount
```

Changes to the component body:
- Add `panel` render mode (before `embedded`): just `<div className="flex flex-col h-full">{chatContent}</div>`
- Track `initialSent` with a ref, fire `sendMessage(initialMessage)` once on mount if provided
- In `submit()`: if `tripContext`, prepend it: `sendMessage(tripContext + '\n\n' + val)`
- Add `useEffect` watching `messages`: when latest assistant message is complete and has hotels, call `onAgentHotels(hotels)`

### 5. `ui/app/page.tsx`

- Change `type ViewMode = 'travel' | 'demo'` → `'travel' | 'split' | 'demo'`
- Add `splitInitialQuery` state: `const [splitInitialQuery, setSplitInitialQuery] = useState<string | undefined>(undefined)`
- Add `openSplitView` callback: sets `splitInitialQuery` and `setViewMode('split')`
- Add import for `TravelSplitView`
- Change the `viewMode === 'travel'` conditional from ternary to three separate `{viewMode === 'X' && ...}` blocks
- Pass `onOpenAgent={(query) => openSplitView(query)}` to TravelHome
- Render `<TravelSplitView>` when `viewMode === 'split'`
- Remove the `showAgentChat` sidebar/modal rendering for travel view — split view has embedded chat

### 6. `ui/components/TravelHome.tsx`

- Change `onOpenAgent: () => void` → `onOpenAgent: (query?: string) => void`
- Search button: change from `onClick={() => runSearch(query)}` to `onClick={() => query.trim() ? onOpenAgent(query) : onOpenAgent()}`. Label changes to "Ask AI" with Sparkles icon.
- Hero input `onKeyDown`: `Enter` calls `onOpenAgent(query)` instead of `runSearch(query)`
- Quick chips: `onClick={() => onOpenAgent(c.query)}` instead of `runSearch`
- The AI Concierge CTA buttons already call `onOpenAgent()` — no change needed there

---

## Key Architecture Decisions (do not revisit these)

**One-way data flow**: UI → agent context string only. Agent NEVER writes back to TripCart. The cart context string is injected on each send. No structured output parsing needed for dates.

**No refactoring TravelHome**: It stays untouched except for the `onOpenAgent` signature change. All hotel grid + filter logic is re-implemented fresh in ResultsCanvas.

**agentPickIds via fuzzy match**: Agent returns hotels via text. The existing `extractHotelsFromText` in useAgentChat already fuzzy-matches against hotels.json and attaches ChatHotel objects to messages. TravelSplitView reads `msg.hotels` from AgentChat and extracts IDs for ResultsCanvas to pin.

**ViewMode transition**: travel → split (on "Ask AI" click or chip click). split → travel (on "Browse" back button). split → demo (on "How It Works" button).

---

## Build Order

1. Install react-day-picker
2. Create TripCart.tsx (simplest, no deps)
3. Create ResultsCanvas.tsx (hotel grid, self-contained)
4. Modify AgentChat.tsx (add panel mode + new props)
5. Create TravelSplitView.tsx (wires 2+3+4)
6. Modify page.tsx (add split viewMode)
7. Modify TravelHome.tsx (onOpenAgent signature)
8. `npx tsc --noEmit` — fix any errors
9. `npm run build` — must be clean
10. Test: travel home → click "Ask AI" → split view opens → type query → agent responds → hotels appear in left canvas with AI Pick badges → click hotel → modal opens with full data

---

## Environment

- Dev server: `npm run dev -- --port 3005` from `ui/`
- App URL: `http://localhost:3005/horizon`
- Branch: `feat/concierge-ui-overhaul`
- Agent ID: `6e729f42-8cab-4860-b9ce-2b653ff7c259`
- Elasticsearch + Kibana: credentials in `ui/.env.local`
