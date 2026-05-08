# Horizon Concierge UI — Full Redesign Reasoning

*Written 2026-05-06 for context handoff to next session.*

---

## The Problem Statement

Jeff's complaints about the current AI Concierge:
1. Concierge is secondary — floats at the bottom, search is primary. Should be reversed.
2. Calendar/date picker exists but isn't interactive.
3. No guest count picker.
4. Chat window feels small.
5. Flyout wastes real estate — the rest of the screen sits unused while chat is open.

Jeff's proposed vision:
- Keep the flyout panel on the right
- BUT: results open in the **other 75% of the screen** — not wasted
- Left 75%: hotel results + filters that **live-update from chat**
- Right 25% (chat panel): **top = "current trip" shopping cart** (dates, guests, selected hotel), **bottom = chat conversation**
- Agent/concierge is the **PRIMARY interface** — "search" is a subtle secondary option

---

## What Exists (codebase state as of this session)

### Branch: `feat/concierge-ui-overhaul` (all working, committed)

**Changes already made this session:**
- `AgentChat.tsx` — full rewrite: collapsed thinking, rotating Jina tool labels, expandable tool I/O, markdown rendering, TravelHotelCard hotel cards in chat (replace text when cards present), sidebar/modal/embedded modes
- `useAgentChat.ts` — ChatHotel type with full Tier 1+2 schema, fuzzy hotel extraction from agent text, thinking time tracking
- `HotelDetailModal.tsx` — Book Now button → static PNR confirmation, Venetian easter egg
- `page.tsx` — selectedHotel state, chatHotelToHotel converter (moved to lib/chatHotelUtils.ts), AgentChat in sidebar mode for travel view
- `ChatHotelCard.tsx` — created (not used, kept for reference)
- `ui/public/hotels.json` — copy of data/hotels.json for client-side fuzzy matching
- `ui/tailwind.config.ts` — @tailwindcss/typography plugin added
- Packages added: react-markdown, remark-gfm, @tailwindcss/typography

**Current TravelHome layout:**
- Full-width hero section (search bar + hero image)
- Featured hotel horizontal scroll
- Below: filter sidebar (left) + hotel grid (center+right)
- Agent chat: floating button bottom-left → opens AgentChat as right sidebar (520px overlay, fixed position)

**AgentChat sidebar:** 520px fixed right panel. Shows thinking section (collapsed), then TravelHotelCard grid when agent responds with hotel names (fuzzy matched). Text hidden when cards present.

**Hotel data:** 137 hotels. 8 Tier 1 (minimal: description singular, no rating/price). 129 Tier 2 (full: descriptions[], rating, price, amenities, style, location). All in `ui/public/hotels.json` (fetched eagerly on mount) and indexed in Elasticsearch.

**Key files:**
- `ui/app/page.tsx` — root state: viewMode, station, demoMode, selectedHotel, showAgentChat
- `ui/components/TravelHome.tsx` — 37KB, the entire travel view (huge, don't refactor in place)
- `ui/components/AgentChat.tsx` — sidebar/modal/embedded modes, SSE streaming
- `ui/hooks/useAgentChat.ts` — SSE parsing, Message{id, role, content, reasoning, toolCalls, hotels, isComplete}
- `ui/lib/chatHotelUtils.ts` — chatHotelToHotel() converter
- `ui/components/HotelDetailModal.tsx` — detail modal with booking flow

---

## Full Reasoning on Each Design Question

### 1. Layout: 75/25 vs other patterns

**Options considered:**
- A) Current flyout (overlay, wastes rest of screen) — Jeff explicitly hates
- B) Persistent split: left ~65% content, right ~35% chat always visible — **Jeff's vision, Opus recommends**
- C) Full-page chat as landing, results embed in chat — loses "live results updating" theatre
- D) Tab style: Chat | Results — loses simultaneous visibility
- E) Bottom dock — wrong vibe for travel site

**Decision: Persistent split, 65/35 ratio (not 75/25)**

Why 65/35 not 75/25:
- At 1440px (MacBook on stage): 75% = 1080px content, 25% = 360px chat — too narrow for trip cart + conversation
- At 1440px with 65/35: 936px content, 504px chat — workable
- Use `clamp(420px, 32%, 560px)` for chat panel: floor of 420px, cap at 560px
- Results canvas gets everything else

**The demo money shot:** User types natural language → thinking indicator pulses → TravelHotelCard grid populates on the LEFT canvas while chat sits RIGHT. Both visible simultaneously. Field engineers see Jina + Elastic working in real time.

### 2. Trip Shopping Cart (top of chat panel)

**Fields:** Check-in date, check-out date, guests (adults + children optional), selected hotel name.

**Key decision: ONE-WAY DATA FLOW ONLY**
- UI → agent: YES (inject cart state into system prompt on each send)
- Agent → UI cart: NO (agent returns plain text, no structured output)

**Why one-way only:**
The agent outputs unstructured SSE text. Making the agent reliably update UI state requires structured output (`<dates>`, `<cart>` tags), which requires Kibana Agent Builder system prompt engineering + validation. This is testable and buildable, but is a SEPARATE task from the layout redesign. Build it after the layout is stable.

**Implementation:**
- `TripCart` component at top of chat panel
- State: `{ checkin: Date|null, checkout: Date|null, guests: number, selectedHotel: ChatHotel|null }`
- Inline editing: date pickers for dates, +/- for guests
- When user clicks a hotel card: sets selectedHotel in TripCart
- On every `sendMessage()`: prepend context string: `"[Trip context: 2 adults, check-in Jul 4, check-out Jul 7, considering: The Venetian Resort Las Vegas]"`
- This makes the agent's recommendations relevant without needing structured output

### 3. Agent as Primary Interface

**Decision: Full-width "Describe your trip" hero input replaces the search bar**

First 5 seconds of demo:
- User lands on page
- Sees a travel site with ONE prominent action: a large textarea "Tell me about your perfect stay..."
- Chips below with engineered queries ("quiet remote work hotel", "baller Vegas room with Strip view", etc.)
- Type → submit → split layout activates, agent starts streaming, hotels appear on left canvas

Traditional filters become a collapsible "Refine results" drawer on the results canvas — accessible but secondary. No top keyword search bar.

**Why this wins for the demo:** Field engineers immediately understand: this is agent-first. No "where do I click?" moment. The story is self-evident.

### 4. Dates/Calendar — What to Build

**What to build:** Functional `react-day-picker` range picker in the TripCart. Standalone UI, feeds into agent context string.

**What NOT to build (yet):** 
- Parsing dates from agent response text (fragile, will fail on edge cases live)
- Agent writing back to calendar via structured output (needs `<dates>` tag parsing)

The "magic moment" Jeff describes (I say July 4 and the calendar updates) IS achievable — but it requires:
1. System prompt instructs agent to output `<dates>{"checkin":"2026-07-04","checkout":"2026-07-07"}</dates>` 
2. Frontend parses this tag on `message_complete` (same pattern as `<hotels>` tag we discussed)
3. Updates TripCart state

This is a clean, buildable feature. Build it in a follow-up session after the layout ships. Include it in the system prompt update along with hotel IDs.

### 5. Layout Implementation Strategy

**DO NOT refactor TravelHome.tsx in place.** It's 37KB, deeply coupled, has its own state, and touching it risks breaking the existing demo stations.

**Strategy: Build `TravelSplitView.tsx` alongside**

New component `ui/components/TravelSplitView.tsx`:
```
<div class="flex h-screen">
  <ResultsCanvas class="flex-1 overflow-y-auto">
    <!-- lifted from TravelHome: filter drawer + hotel grid -->
  </ResultsCanvas>
  <ChatPanel class="clamp(420px, 32%, 560px) flex flex-col">
    <TripCart />  <!-- top section, max-h-[280px] -->
    <AgentChat embedded />  <!-- bottom section, flex-grow, own scroll -->
  </ChatPanel>
</div>
```

`page.tsx` gains a third view state: `viewMode: 'travel' | 'split' | 'demo'`
- `travel` = existing TravelHome (keep, used for initial landing with hero)
- `split` = new TravelSplitView (activated when agent is opened OR on first chat submit)
- `demo` = existing station-based demo view

**Transition flow:**
1. User lands on `travel` view (existing TravelHome with hero)
2. User clicks "Chat with AI Concierge" OR submits the hero input → transitions to `split` view
3. `split` view has the 65/35 split, TripCart, embedded AgentChat, hotel results canvas
4. "Back to Browse" button returns to `travel`

This preserves the existing TravelHome entirely (no risk) while building the new experience in a fresh component.

### 6. Chat Panel Architecture

Chat panel (right 32-35%):
```
┌─────────────────────────┐
│ Header: AI Concierge    │  (fixed, ~56px)
│ Jina AI + Elastic       │
├─────────────────────────┤
│ TripCart                │  (max-h-[280px], collapsible)
│ ┌─ Check-in  Check-out ─┐│
│ │  [Jul 4]   [Jul 7]   ││
│ ├────────────────────────┤│
│ │  👤 2 adults          ││
│ ├────────────────────────┤│
│ │  🏨 The Venetian      ││
│ └────────────────────────┘│
├─────────────────────────┤
│ Chat messages           │  (flex-grow, overflow-y-auto)
│ [thinking indicator]    │
│ [message bubbles]       │
│ [hotel cards if any]    │
├─────────────────────────┤
│ Input textarea          │  (fixed bottom, ~80px)
│ Jina + Elastic footer   │
└─────────────────────────┘
```

### 7. Results Canvas Architecture

Left canvas (flex-1):
```
┌─────────────────────────────────────┐
│ [Refine ▾] [Sort ▾]  "23 hotels"   │  (filter bar, ~52px)
├─────────────────────────────────────┤
│ [Filter drawer - collapsible]       │  (price, style, amenities, rating)
├─────────────────────────────────────┤
│ Hotel grid (2-3 columns)            │  (overflow-y-auto)
│ ┌────────┐ ┌────────┐ ┌────────┐   │
│ │TravelH │ │TravelH │ │TravelH │   │
│ │otelCard│ │otelCard│ │otelCard│   │
│ └────────┘ └────────┘ └────────┘   │
│ ...                                 │
└─────────────────────────────────────┘
```

Hotels in canvas: initially from semantic search (same as current TravelHome). When agent recommends hotels (via fuzzy match), highlight/pin those hotels at the top of the canvas with a "✨ AI Pick" badge.

This is the **live update** Jeff wants — agent recommends → hotels surface on the left. No structured output needed, just a shared state: `agentPickIds: string[]` in page.tsx, used to sort/badge the hotel grid.

---

## Implementation Plan (session-by-session)

### Session 1: The Split Layout Shell
1. New `ui/components/TravelSplitView.tsx` — flex container, ResultsCanvas + ChatPanel
2. New `ui/components/ResultsCanvas.tsx` — hotel grid (lifted from TravelHome), filter drawer
3. New `ui/components/TripCart.tsx` — display-only initially (dates null, guests 2, no hotel)
4. Modify `page.tsx` — add `split` viewMode, transition from travel → split on agent open
5. Wire `AgentChat embedded` into ChatPanel
6. Wire `agentPickIds` from message.hotels into ResultsCanvas for top-sorting + "AI Pick" badge

### Session 2: Trip Cart + Date Picker
1. Install `react-day-picker`
2. Add date state to TripCart + calendar popup
3. Guest count +/- in TripCart
4. Selected hotel: updates when user clicks hotel card (from either canvas OR chat)
5. `sendMessage()` in useAgentChat — prepend cart context to query
6. Collapsible TripCart (so conversation gets more space when cart not needed)

### Session 3: Agent-as-Primary Hero (optional, if split is solid)
1. New landing hero for the `travel` view: big textarea, example chips
2. On submit: set input, transition to `split`, fire sendMessage
3. The "Search" keyword input becomes a secondary "Keyword search" link in ResultsCanvas filter bar

### Session 4: Structured output from agent (post-demo or late session 3)
1. Update Kibana Agent Builder system prompt
2. Parse `<hotels>` IDs + `<dates>` from agent stream (on message_complete)
3. Agent hotel IDs → deterministic hotel card matching (more reliable than fuzzy)
4. Agent dates → update TripCart date state

---

## What NOT to Build Before May 13

- Agent parsing dates from plain text (fragile)
- Agent writing back to filters/cart via structured output (needs system prompt + validation)
- Rewriting TravelHome.tsx in place (too risky, 37KB)
- A multi-step booking wizard (static confirmation is enough)

---

## Demo Narrative Arc (final state)

1. **Land** on travel home — hero with big agent input, example chips
2. **Type** "baller hotel room in vegas with a view of the strip"
3. **Transition** → split view: right panel shows thinking indicator pulsing, left canvas loading
4. **Results** appear: 5 Vegas hotels in the canvas grid with "✨ AI Pick" badges, TravelHotelCards in the right chat panel
5. **Cart** at top of right panel shows: no dates yet, 2 adults
6. **Click** a hotel card in either panel → HotelDetailModal opens (with image, price, rating, amenities)
7. **"Book Now"** → if The Venetian: "See you on May 13!" easter egg
8. **Chat** continues: "Actually, can you find something quieter? No casino noise." → new results surface
9. **Set dates** in TripCart → "Let me search for availability July 4-7" in chat (manual, user-driven)

This is the story. 5-6 interactions that show: natural language → semantic search → reranking → visual results → booking. All powered by Jina + Elastic.

---

## Key Files for Next Session

```
ui/app/page.tsx                    — add 'split' viewMode
ui/components/TravelHome.tsx       — DO NOT REFACTOR, just reference for what to lift
ui/components/AgentChat.tsx        — use embedded mode only in split view
ui/hooks/useAgentChat.ts           — add cart context injection to sendMessage
ui/lib/chatHotelUtils.ts           — chatHotelToHotel converter (already exists)
ui/lib/types.ts                    — Hotel, Station types

NEW FILES:
ui/components/TravelSplitView.tsx  — the main new shell
ui/components/ResultsCanvas.tsx    — hotel grid + filter drawer
ui/components/TripCart.tsx         — shopping cart panel
```

## Environment

- Dev server: `npm run dev -- --port 3005` from `ui/` directory
- App URL: `http://localhost:3005/horizon`
- Branch: `feat/concierge-ui-overhaul`
- Agent ID: `6e729f42-8cab-4860-b9ce-2b653ff7c259`
- Elasticsearch + Kibana: credentials in `ui/.env.local`
