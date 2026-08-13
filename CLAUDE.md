# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository overview

`ClaudeLab` is a personal sandbox repo containing two unrelated projects:

- **`/` (root)** — **Bleachdle**, a static Wordle-style character-guessing game for the anime/manga *Bleach*. This is the actively developed project and the subject of the rest of this file.
- **`tampermonkey/`** — a standalone Tampermonkey userscript (`copy-article.user.js`) that adds a "copy article text" button on padi.com. Unrelated to Bleachdle; no shared code or tooling.

## Running Bleachdle

No build step, no dependencies, no package.json. It's plain HTML/CSS/JS loaded via `<script>` tags.

- Open `index.html` directly in a browser, or serve it locally: `npx http-server -c-1 .` (or `npx serve .`) from the repo root.
- Deployed via GitHub Pages from the repo root on the default branch — this is *why* the game files live at the repo root rather than in a subfolder (they were moved there specifically for Pages compatibility).
- No test suite, linter, or build/typecheck command exists. Verify changes by loading the page in a browser (Playwright via the pre-installed Chromium works well for automated checks — see recent commit history for patterns) and checking: no console errors, no horizontal scroll, and a played-through guess (win + loss) behaves correctly.

## Architecture

Load order matters and is fixed in `index.html`: `version.js` → `characters.js` → `game.js`. All three are classic (non-module) scripts that share the global scope — `game.js` reads `APP_VERSION` and `CHARACTERS` as bare globals.

- **`characters.js`** — the entire dataset as one `CHARACTERS` array constant. Each character is a flat object; see the large header comment in the file for the authoritative field-by-field schema and the semantics of each field (several are non-obvious — read it before editing entries).
- **`game.js`** — all game logic: daily/infinite mode state machine, the attribute comparison engine (`ATTRIBUTES` array + `compareAttribute` dispatch), guess autocomplete, localStorage persistence, and DOM rendering. No framework, no build — everything is manual `document.createElement`/event listeners.
- **`style.css`** — single stylesheet, CSS custom properties for the color palette (`:root`), two responsive layouts for the results table (see "Responsive breakpoint" below).
- **`index.html`** — static shell; the results `<table>` header and body are built entirely by `game.js` (`buildHeader()`, `renderGuessRow()`), not hardcoded in HTML.
- **`favicon.svg`** — hand-drawn logo, also used as the header image.
- **`background.webp`** — full-page background artwork, layered under a dark CSS gradient in `style.css` so foreground contrast holds.

## Key functional decisions (read before changing behavior)

**Two game modes, different persistence.** "Défi du jour" derives a deterministic daily target from `EPOCH_UTC` (`getDailyCharacter()` in `game.js`) and persists guesses to `localStorage` per UTC date (`storageKey()`), so reloading mid-day restores progress and a finished day can't be replayed. "Illimité" (`startInfiniteMode()`) picks a random character, excluding the last `INFINITE_NO_REPEAT_WINDOW` (7) characters already used this session (`recentInfiniteNames`, in-memory), and is **never** persisted — a reload always resets both the guess state and that no-repeat window. Don't add localStorage writes to infinite mode; that's intentional.

**Both modes have post-game stats, but with different lifetimes.** `endGame()` branches on `mode`: for `"daily"`, `recordDailyResult(won, guessCount)` cumulates games-played/win-rate/current-and-max-streak/guess-distribution into a single global `localStorage` key (`bleachdle-stats`, separate from the per-date daily-state key), guarded by a `state.statsRecorded` flag (persisted alongside the daily state) so a result is never double-counted — `replayState()` also fires `recordDailyResult` retroactively if a finished state is loaded with `statsRecorded` still unset, which is what lets an already-finished day get counted on next reload instead of staying stuck at zero. For `"infinite"`, `recordInfiniteResult(won, guessCount)` updates the same shape of stats but in the in-memory `infiniteStats` object only — consistent with Infinite mode never touching `localStorage`, a reload resets these to zero too. `renderStats()` picks the source (`loadStats()` vs `infiniteStats`) based on the current `mode`, shows `#statsPanel` whenever `state.finished` regardless of mode, and swaps the panel title/note text so it's visually clear when stats are the persisted daily kind vs. the ephemeral per-session infinite kind. Daily streaks are day-based (`recordDailyResult` compares `lastResultDate` to the current UTC date via `isNextUTCDay()` and only extends the streak on a win recorded exactly one UTC day after the last one); infinite streaks are simpler — just consecutive wins within the session, no date logic. A loss always resets `currentStreak` to 0 in both.

**The attribute comparison engine is generic and type-driven.** Each entry in `ATTRIBUTES` (`game.js`) has a `type` that selects a comparison function in `compareAttribute()`:
- `"array"` — tri-state (correct/**partial**/incorrect) via set overlap. Used for `race` and `affiliation` specifically so hybrid characters (e.g. Ichigo: Human/Shinigami/Hollow/Quincy) can show a partial match against a guess sharing only some of those races.
- `"exact"` — plain equality (default when no `type` matches).
- `"numeric"` — equality or up/down arrow, `null === null` counts as a match (used for `rank`, where `null` genuinely means "no squad/Espada number" — a real shared fact, not missing data).
- `"ageBracket"` and `"arc"` — ordinal comparison via a shared `compareOrdinal(guessVal, targetVal, order)` helper against a fixed ordered list (`AGE_BRACKET_ORDER`, `ARC_ORDER`).

**Age is a fixed bracket, never an invented exact number.** `ageBracket` is one of exactly six values in `AGE_BRACKET_ORDER` (`"10-20 ans"` … `"1000+ ans"`, youngest to oldest). This went through several iterations this project: real per-character ages turned out to be undocumented for most adult Shinigami/Arrancar/Quincy in the actual databooks (confirmed via a user-supplied Bleach Fandom Wiki infobox scrape), so inventing precise numbers or even loose "apparent age" categories was misleading. The fixed-bracket scheme is the settled approach — do not reintroduce per-character exact ages without a confirmed source.

**`location` and `rank` reflect the character's final/most-notable state, not their state at first appearance.** E.g. Aizen's `location` is `"Soul Society"` (where he's imprisoned at story's end) even though most of his screen time is in Hueco Mundo; ex-captains (Urahara, Isshin, Love, Hiyori, etc.) keep their historical squad number in `rank` even though they're no longer active. Keep this policy consistent when adding characters.

**No character portraits/images.** Deliberate — avoids copyright issues and keeps the dataset self-contained. The game is comparison-table-only; don't add character art without revisiting this decision with the user.

**Stats can be viewed on demand, not just at game end.** `statsOpen` (in-memory, `game.js`) is toggled by `statsToggleBtn`, independent of `state.finished`. `updateStatsVisibility()` shows `#statsPanel` whenever `statsOpen || state.finished` and re-renders its content via `renderStatsContent()` (the old `renderStats()` was split into these two so content can be computed without forcing visibility). `statsOpen` persists across mode switches and "Nouvelle partie" clicks — only closing it manually or a full reload resets it — so a user who opened it mid-session keeps seeing whichever mode's stats are current.

**Encyclopedia is gated on `state.finished`, in both modes.** `encyclopediaBtn` is disabled (and `openEncyclopedia()` no-ops even if called directly) whenever `!state.finished` — kept in sync by `syncGameControls()`, called from `endGame()`, `replayState()`'s finished branch, and `resetBoard()` (so a fresh/unfinished game — daily or infinite — always re-locks it). This is deliberate: the encyclopedia shows every character's exact attributes, so leaving it open during an active guess would defeat the game. The modal (`#encyclopediaModal`) itself force-closes in `resetBoard()` as a safety net. Sorting (`encyclopediaSort` + `encyclopediaCompare()`) reuses each attribute's `type` from `ATTRIBUTES` (array → joined-string compare, numeric → nulls sort last, ageBracket/arc → ordinal index) so it doesn't need a second definition of comparison semantics. Search filters by name only, through the same `normalize()` used everywhere else.

**Daily share text is generated, not stored.** `buildShareText()` (in `game.js`) composes a Wordle-style summary on demand from `state`/`target` at click time — nothing about it is persisted. The per-guess emoji row is a simplification: since guesses compare ~12 attributes rather than Wordle's per-letter-position match, each non-winning guess is scored by the *fraction* of attributes that came back `"correct"` and bucketed into 🟨 (≥50%) or ⬜, rather than trying to encode all 12 attributes' colors. `getDailyPuzzleNumber()` reuses the same `daysSinceEpoch()` helper as `getDailyCharacter()` so the puzzle number and the character selection can never drift apart. Infinite mode never shows the share button (`syncGameControls()` gates it on `mode === "daily"`) since there's no stable "puzzle number" to reference and nothing is persisted to challenge someone else against.

**Data reliability is mixed and intentionally documented in-file.** The dataset was built in three passes: initial recall from model knowledge, a cross-referenced web-research correction pass (network access to bleach.fandom.com was blocked from this environment, so that pass used secondary sources), and a final correction pass against a **user-provided local scrape** of the actual wiki infobox data (much more reliable). Three entries in that scrape were contaminated by the scraper matching the wrong page (Nemu Kurotsuchi got Mayuri's data, Giselle Gewelle got Bambietta's, Nanao Ise got a "clan" infobox) — those fields were deliberately left uncorrected rather than applying bad data. See the header comment in `characters.js` for the full data-provenance note.

## Versioning convention

`version.js` exports `APP_VERSION`, shown as a small badge next to the `<h1>` in the header (`.title-row`). **This is bumped by 1 on every commit that touches the game** (this was an explicit, ongoing user request — not a one-off). Increment it as part of any commit that changes game behavior/content, including this file's sibling source files; don't skip it.

## Responsive breakpoint: 1080px, not a typical mobile breakpoint

The results table has up to 13 columns. Below `1080px` viewport width, `style.css` switches the table to a stacked "card" layout (label/value rows) instead of shrinking table columns. This threshold was arrived at empirically, not guessed: a naive `640px` breakpoint (typical mobile/desktop split) left a wide "tablet / unmaximized laptop window" zone (~640–1000px) where the 13-column table technically fit without a horizontal scrollbar but had nearly every cell wrapping onto 2–4 lines — unreadable despite passing a naive "no overflow" check. If you touch table layout, verify readability (not just absence of horizontal scroll) across the full width range, not only at phone and full-desktop sizes.

Also note: CSS `nth-child` column-width rules have higher specificity than a plain-element selector inside a differently-scoped media query — a `min-width` rule for desktop column widths can silently win over a `max-width` mobile rule of lower specificity even when the mobile media query is the one that should apply. Keep the desktop `nth-child` width rules scoped inside their own `@media (min-width: …)` block (as they are now) rather than left unconditional.

**Bare-element selectors in `style.css` leak into every table/modal added later — scope new ones.** This bit the results table three separate times once the encyclopedia modal (a second `<table>` on the page) was added: the responsive card-layout rules (`table, tbody, tr, td { display: block; ... }` and the `nth-child` width rules above) and the plain `table { table-layout: fixed; width: 100%; }` rule were all originally unscoped, so they also applied to `.encyclopedia-table` and silently broke its layout (forced single-column stacking below 1080px, forced equal-width columns above it) even though it visually lives in a completely separate modal. All of these are now scoped under `.table-wrapper` (e.g. `.table-wrapper table`, `.table-wrapper td.cell::before`). If you add another `<table>` anywhere, don't assume the existing bare `table`/`th`/`td` rules leave it alone — check `style.css` for unscoped element selectors first. The same applies to toggling visibility: an element with `hidden` **and** a class that sets `display` explicitly (e.g. `.modal-overlay { display: flex; }`) will stay visible, because the author stylesheet's `display` beats the UA `[hidden] { display: none; }` default — pair any such class with an explicit `.your-class[hidden] { display: none; }` override (see `.modal-overlay[hidden]`).

## Interaction conventions

- Character-name matching (both the autocomplete filter and exact-match validation) is accent-insensitive via a shared `normalize()` (NFD decode + strip combining marks + lowercase) — apply it consistently if you touch name matching, don't add a second matching path.
- The suggestion dropdown supports keyboard navigation (↑/↓ to move, Enter to confirm the highlighted suggestion — not just an exact literal-text match, Escape to close) in addition to mouse hover/click; both keep `activeSuggestionIndex`/`currentSuggestions` in sync.
- Suggestion items use `mousedown` with `preventDefault()` so clicking one never blurs the input.
