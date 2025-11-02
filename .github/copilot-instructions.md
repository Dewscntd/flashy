## Quick orientation for AI coding agents

This repo is a small Angular (v19) URL-builder app. The goal of these notes is to make an AI coding agent productive quickly by pointing to the project's structure, conventions, and important patterns to follow when editing code or adding features.

### Big picture
- App is a single-page Angular app using standalone components (no NgModules). Entry/important files:
  - `src/app/app.component.ts` — main form, typed reactive form, `computed()` signal `finalUrl` builds the URL.
  - `src/app/mock-api.service.ts` — in-memory "backend" implemented with an Angular signal; single source of truth for recent builds.
  - `src/app/history/history.component.ts` — lazy-loaded, uses `@defer` in templates; emits a `loadBuild` event to the parent to reload a selected build.
  - `src/app/app.config.ts` — app-level config; uses `provideZoneChangeDetection({ eventCoalescing: true })`.

### Key patterns & conventions (do not change these without reason)
- Signals-first state: components expose or consume signals (e.g., `MockApiService.getRecentBuilds()` returns a readonly signal). Use `signal()`, `computed()` and `.asReadonly()` consistently.
- Typed reactive forms: main form is created with `FormBuilder` and explicit form-group types (see `AppComponent`). When adding form controls follow the same typed `FormGroup`/`FormArray` approach.
- No NgModules: components are declared as `standalone: true` and import dependencies in the component `imports` array.
- Communication:
  - Shared state: `MockApiService` (signals) is the canonical data flow for saved builds.
  - Parent-child: `HistoryComponent` emits `loadBuild` (EventEmitter) which `AppComponent` listens to and calls `loadBuild(build)`.
- Immutability for recent builds: `MockApiService` enforces keeping only the last 5 builds — preserve this constraint unless explicitly changing behavior.

### Where to look for examples
- Building the final URL reactively: `src/app/app.component.ts` (search for `finalUrl = computed(`).
- Saving a build / signal usage: `src/app/mock-api.service.ts` (look for `signal<UrlBuild[]>`, `update(...)`, `.asReadonly()`).
- History filtering and events: `src/app/history/history.component.ts` (`filterTerm` signal, `filteredBuilds` computed, `loadBuild` emitter).

### Developer workflows & commands
- Install deps: `npm install` (project root). The project uses Angular CLI v19.
- Run dev server: `npm start` (alias for `ng serve`). Dev server serves at `http://localhost:4200`.
- Build: `npm run build` (uses `ng build`).
- Unit tests: `npm test` (runs `ng test` with Karma).
- Playwright e2e: run `npx playwright test` from project root — the Playwright config (`playwright.config.ts`) has a `webServer` entry that runs `npm run start` automatically, with `baseURL: http://localhost:4200` and `reuseExistingServer: true` locally.

### Testing conventions & artifacts
- E2E tests live in `/e2e`. Playwright output is saved in `playwright-report/` and `test-results/` — inspect those for failures and recorded traces.

### Small-but-critical implementation notes (examples)
- Use `inject()` for DI inside standalone components (see `AppComponent` where `FormBuilder` and `MockApiService` are injected).
- When creating dynamic params, use a `FormArray` and non-nullable `FormControl` as in `AppComponent.addParam()`.
- The app uses the browser `URL` API to assemble search params (see `finalUrl` implementation). Prefer this over string concatenation.
- IDs and timestamps: saved builds use `crypto.randomUUID()` and `new Date().toISOString()` — keep that for predictable id format.

### Editing / adding features — checklist for PRs
1. Keep standalone component style: export `standalone: true` and add required imports to the component `imports` array.
2. Preserve signal usage or expose readonly signals from services (use `.asReadonly()` where appropriate).
3. If touching persistence, respect the 5-build limit in `MockApiService` or explicitly document any change.
4. Update `README.md` (root or `url_builder/README.md`) with new developer-facing commands or behaviors.
5. Run `npm test` and `npx playwright test` (or at least confirm Playwright's `webServer` starts correctly) before requesting review.

### Other notes
- There is a second app in `url_builder/` with its own `README.md` — check it before making global changes.
- Project uses modern Angular features (`@if`, `@for`, signals, `@defer`) — prefer to follow current patterns rather than revert to older paradigms.

### Home assignment (canonical requirements)
When working on the URL Builder assignment or verifying submissions, follow these exact, testable requirements:

- Goal: Implement a small Angular app that builds a URL with query parameters using modern Angular features: standalone components, signals, typed Reactive Forms, new control flow, and a tiny in-memory mock API.

- Functional requirements (must be implemented exactly):
  1. URL Form Builder
     - Typed reactive form with validation:
       - `baseUrl`: required, valid absolute URL
       - `utmSource`, `utmMedium`, `utmCampaign`: optional
       - Dynamic key–value params: each `{ key: string; value: string }`, both required
     - Live preview built reactively via `computed()` and signals
     - Character count (computed)
     - Actions: copy to clipboard, save to mock API
  2. Recent Builds (History)
     - Show last 5 saved items from mock API
     - Filter box implemented with `signal` + `computed`
     - Optional: clicking an item reloads the form (emitted via `loadBuild`)
     - History panel should be lazy-loaded with `@defer`
  3. Mock Backend
     - Model must match:

```ts
interface UrlBuild {
  id: string;
  finalUrl: string;
  form: {
    baseUrl: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    params: Array<{ key: string; value: string }>;
  };
  createdAt: string;
}
```

- Technical requirements:
  - Angular standalone components only (no NgModules)
  - Use `signal`, `computed`, and readonly signals where appropriate
  - Typed Reactive Forms and `FormArray` for params
  - Use `@if` and `@for` at least once in templates
  - Use `@defer` once for lazy history load
  - Prefer strict type and template checks (follow tsconfig/Angular defaults)
  - Accessibility basics (labels, aria where needed)

- README for submissions must include Angular version, install/run commands, short architecture notes, time spent, and TODOs.

### Evaluation checklist (what reviewers will check)
- Modern Angular fluency: signals, computed, standalone components
- Code quality: naming, SOLID principles, strictly typed TypeScript
- Typed forms & validation correctness
- Mock API correctness (signal-based, 5-item limit)

### Agent role & coding standards (must-follow)
When you act on this repo you MUST adopt the following constraints and style. Treat yourself as the principal tech lead (Angular GDE level):

- Principal responsibilities: design clear, testable, and idiomatic Angular code that reviewers can quickly understand.
- Strict typing: every public function, component input/output, and form model must be fully typed. Avoid `any`.
- SOLID, clean, DRY: favor single-responsibility, small pure functions, and composition over inheritance.
- Declarative & composable: prefer signals, `computed`, standalone components, and small reusable composables (functions that return signals/computed) rather than inheritance or large monoliths.
- Use modern Angular APIs: `inject()`, `signal()`, `computed()`, `@if/@for/@defer`, and the browser `URL` API where appropriate.
- Small PRs: when adding features, keep changes scoped to a few files and include a short PR description that explains the contract (inputs/outputs), edge cases handled, and a short test plan.

Reference the existing project files for examples (see `src/app/*`). Use them as canonical patterns, not as templates to replicate mistakes.

If any of these sections are unclear or you'd like more specifics (e.g., template examples, common code snippets, or a short PR checklist tailored to a given change), tell me which area and I'll expand or adjust this file.
