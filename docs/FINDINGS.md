# Findings

What was observed while building and publishing this proof, kept apart from what is only documented or still untested. Written 2026-10-02 against Artifact runtime contract 0.2.66.

Legend: **Observed** = I ran it in this session. **Documented** = stated in the runtime's type definitions or skill text, not run. **Untested** = needs someone to open the Artifact.

## Verdict on the five claims

| Claim | Result |
|---|---|
| Decision tree as data, walked by a pure engine | **Observed.** 25 tests pass: 5 scenarios, every outcome covered, 7 validation rules, rewind and precedence. |
| Use cases drive tests and the scenario picker | **Observed** in headless Chromium: the picker opened a scenario at step 3 with the answer pre-filled. |
| Screens from design-system components only | **Observed.** Every screen uses `StepLayout`, `SelectionCardGroup`, `ChipGroup`, `TextInput`, `PricingCard`, `ProgressStepper`, `AssistantMessage`, `InfoDrawer`, `GroupedList`, `PromoBanner`, `Button`. No hex or px in `src/` (the build script's stamp uses tokens too). |
| Services behind adapters | **Observed** for the interfaces and the local implementation. The Artifact implementation compiles and its storage path was exercised through `ArtifactData`, but its code was not run inside claude.ai. |
| Graceful degradation | **Observed** locally: with no `window.claude` the whole flow works, uses the keyword rule, says storage is memory-only, and the panel shows all three adapters as local. |

## What works for me (owner, signed in)

- **Observed:** publishing `dist/index.html` plus `assets/*` as one Artifact works; the declaration `{db, user, sample}` was stored and carried forward on republish; the page is private to the owner until shared from the Share menu.
- **Observed:** with `ArtifactData` I wrote a probe document at `data/users/me/sessions/items/probe`, listed it, and deleted it. `me` resolved to my user id.
- **Untested:** the page itself running in the viewer (`use("db")`, `use("user")`, a real session write, the "previous sessions" list). I cannot open claude.ai from this session. Open the link, finish one flow, then ask me to list the sessions collection to confirm the page's own write.

## A bug the check caught: collection paths

The brief asked for `data/users/<user id>/sessions/<id>`. Paths alternate collection/document, so that has five segments and is a **collection**, while `data/users/<id>/sessions` (four) is a **document**. My first adapter called `db.collection("data/users/<id>/sessions")`, which the platform rejects as a document path. Sessions now live in the collection `data/users/<id>/sessions/items`, one document per session, still under the private `data/users/` prefix. `artifact.test.ts` asserts the odd segment count. Anyone designing paths for this platform should count segments first.

## What a viewer outside the organization or on a public link gets

- **Documented:** `user` serves "the owner's organization and invited guests; others are absent", so `use("user")` is `null`. `db` is `null` when signed out. A page that declares `assets` is never public; `db`, `user` and `sample` have no such note, but I did not test a public link.
- **Observed (locally, same code path):** with every `use()` returning `null` the flow still completes: keyword classification, in-memory session, a visible note on the outcome screen. Nothing in the engine or screens branches on the platform.
- **Untested:** a real outside viewer. Also untested: whether `sample` is served to guests; the code falls back to the keyword rule on any `sample` error (`not_granted`, `rate_limited`, anything else) and shows the code in a note.
- **Documented:** a framed host that never answers makes `use()` resolve `null` after 10 s. The page renders immediately with local adapters and swaps in Artifact ones as they resolve, so that wait never blocks the first paint; the panel says "Checking what this view supports…" meanwhile.

## `sample`: latency and consent

- **Documented:** the first call asks the viewer for consent; the viewer pays; `use("sample")` itself asks for nothing, which is why the app calls only `use` on load and `sample.json` only after the free-text step is submitted. The skill text says output can show "Thinking…" for 5-60 s before the first text.
- **Documented:** results are cached for 5 minutes by default. I did not set `cache`, so repeating the same sentence will return fast and understate real latency; set `cache: false` for timing runs.
- **Not measured.** I could not call `sample` from this session. The app does measure it: the outcome screen shows source, confidence and seconds for the AI call, and the same fields are saved in each session document (`classification.ms`). After a few real runs, ask me to read `data/users/me/sessions/items` and this section gets real numbers.
- Design choices already made: `modelTier: "quick"`, the description is capped at 500 characters and framed as data, and a reply whose category is not in the tree's enum is rejected and replaced by the keyword rule.

## Limits hit or documented

- **Isolation of private data.** `as_level` keeps my identity, so reading my own subtree at `view` or `interact` still returned my probe. That does not show other viewers are blocked. What I did observe: writing to another user id's path was refused. The tool text says the subtree is private even from the owner. A second account reading it is **untested**.
- **CSP (documented):** scripts only from cdnjs, jsdelivr/npm, unpkg, cdn.tailwindcss.com and code.jquery.com; stylesheets only from Google Fonts; no `fetch`/XHR/WebSocket to anything but files published with the page. This build needs none of that: Vite bundles React and the CSS. The design system names licensed fonts but ships none, so the fallback fonts apply.
- **Size:** `dist/` is about 280 KB (JS 245 KB, CSS 25 KB) against a 16 MB limit.
- **No downloads, print, `alert`/`confirm`, `mailto:`** inside the frame (documented). None is used.
- **Theme:** the design system has no dark theme, so the page pins the light look, as the design-system repo's own preview does. The artifact guidance asks for both themes; this follows the design system instead.
- **Module script:** the page loads Vite's `type="module"` script as the design-system preview does. Whether the host serves it untouched is **untested** until the link is opened.
- **Typing:** `window.claude` has no bundled types here; `artifact.ts` declares the small slice it uses, copied from the 0.2.66 definitions. A contract bump needs a re-read of those files.

## Porting the adapters to Lovable

Estimate, not done. The engine, spec files and screens move unchanged. Three files replace `artifact.ts`:

1. **Storage:** a `sessions` table (user id, answers, path, outcome, classification, timestamp) with row-level security on the user id; `save` is an insert, `list` a select ordered by time.
2. **Identity:** the auth client's user id, or `null` when signed out.
3. **AI:** a server-side function that calls a model and returns `{category, confidence}`, so the key stays off the client. Keep the keyword fallback on any error.

`App.tsx` would choose adapters by environment instead of by `window.claude`. The design system already reaches Lovable through its own sync script, so the local `ds:sync` copy is only needed for Claude. Expect an hour or two for the three adapters plus Lovable's routing wrapper, mostly on RLS and the function.

## Recommendation for the real assignment

1. **Use this architecture.** Spec as JSON, a pure engine with a validator, scenarios shared by tests and UI, adapters at the edges. It stayed small (about 600 lines of source) and the validator and scenario tests caught real mistakes early.
2. **Make AI an enhancement, never a dependency.** Every AI step needs a deterministic fallback and a visible note of which path ran, as here.
3. **Count path segments** before designing any storage layout, and add a test for it.
4. **Verify in the viewer before presenting.** The one gap in this proof is the page running inside claude.ai; budget a first pass for exactly that: a real session write, the consent prompt and the `sample` timing, and a second account.
5. **Keep the design system content-free** and re-sync rather than patching the copy.
