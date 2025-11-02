# URL Builder - Modern Angular Application

A production-grade URL builder application built with modern Angular 19 features, demonstrating SOLID principles, clean architecture, and advanced TypeScript patterns.

- **Angular Version:** 19.0.0
- **Time Spent:** Approximately 5-6 hours
- **Architecture:** Clean Architecture + Domain-Driven Design

## ✨ Features

### Core Functionality
- **URL Form Builder** with typed reactive forms
  - Required base URL with robust validation
  - Optional UTM parameters (source, medium, campaign)
  - Dynamic key-value parameter pairs with duplicate key prevention
  - Real-time validation feedback

- **Live URL Preview**
  - Real-time URL construction using computed signals
  - Character count display
  - Parameter count display
  - Copy to clipboard with feedback

- **Recent Builds History**
  - Last 5 saved builds with localStorage persistence
  - Advanced search/filter (searches URL, UTM params, and custom params)
  - Click to reload into form
  - Delete individual builds
  - Lazy-loaded using `@defer` for optimal performance

- **User Experience**
  - Toast notifications for all actions (success, error, warning, info)
  - Accessible keyboard navigation
  - ARIA labels and screen reader support
  - Responsive design
  - Professional UI with modern styling

## 🛠 Tech Stack

- **Angular 19** - Latest stable version
- **TypeScript 5.6** - Strict mode enabled
- **Standalone Components** - No NgModules
- **Angular Signals** - Reactive state management
- **Typed Reactive Forms** - Full type safety
- **Modern Control Flow** - `@if`, `@for`, `@defer`
- **RxJS 7.8** - For complex async operations

## 🏗 Architecture

This application follows **Clean Architecture** and **SOLID principles** with clear separation of concerns.

### Layered Architecture

```
┌─────────────────────────────────────────┐
│      Presentation Layer                 │
│  (Components - Declarative UI)          │
├─────────────────────────────────────────┤
│      Application Layer                  │
│  (Services - Orchestration)             │
├─────────────────────────────────────────┤
│      Domain Layer                       │
│  (Models, Business Logic, Validators)   │
├─────────────────────────────────────────┤
│      Infrastructure Layer               │
│  (Storage, Clipboard, Notifications)    │
└─────────────────────────────────────────┘
```

### SOLID Principles Applied

#### 1. Single Responsibility Principle (SRP)
Each service has ONE clear responsibility:
- `UrlBuilderService` - Builds URLs from data
- `ClipboardService` - Handles clipboard operations
- `StorageService` - Manages localStorage
- `NotificationService` - Manages user notifications
- `FormStateManagerService` - Manages form state
- `UrlBuildRepositoryService` - Handles data persistence

#### 2. Open/Closed Principle
- Services are open for extension, closed for modification
- Validators are pure functions that can be composed
- Components accept inputs and emit outputs (no tight coupling)

#### 3. Liskov Substitution Principle
- Services can be mocked/replaced without breaking the system
- All dependencies are injected via DI

#### 4. Interface Segregation Principle
- Small, focused interfaces (models)
- Components only depend on what they need

#### 5. Dependency Inversion Principle
- High-level modules (components) depend on abstractions (services)
- All dependencies flow through DI container

## How to Run

1.  **Install Dependencies:**
    ```bash
    npm install
    ```
2.  **Run the Development Server:**
    ```bash
    ng serve
    ```
3.  Open your browser to `http://localhost:4200/`.

## 📁 Project Structure

```
src/app/
├── core/                           # Core domain and infrastructure
│   ├── models/
│   │   └── url-build.model.ts     # Domain models, interfaces, type guards
│   ├── services/
│   │   ├── url-builder.service.ts        # Domain: URL construction logic
│   │   ├── form-state-manager.service.ts # Application: Form orchestration
│   │   ├── url-build-repository.service.ts # Data persistence with signals
│   │   ├── clipboard.service.ts          # Infrastructure: Clipboard API
│   │   ├── notification.service.ts       # Infrastructure: Toast notifications
│   │   └── storage.service.ts            # Infrastructure: localStorage wrapper
│   └── validators/
│       └── url-validators.ts      # Pure validator factory functions
│
├── features/                       # Feature modules (domain-specific)
│   ├── url-builder/
│   │   └── components/
│   │       ├── url-preview/       # URL display and actions
│   │       └── dynamic-params/    # Parameter list management
│   └── history/
│       └── history.component.ts   # Build history with filtering
│
├── shared/                         # Shared/reusable components
│   └── components/
│       └── toast-notification/    # Global toast system
│
└── app.component.ts               # Root coordinator component
```

### Key Design Decisions

#### 1. **Separation by Layer, Not by Feature**
```
core/        → Domain logic & infrastructure (reusable)
features/    → Feature-specific UI components
shared/      → Cross-cutting concerns
```

#### 2. **Repository Pattern**
`UrlBuildRepositoryService` abstracts data storage:
- In-memory state using signals
- localStorage persistence
- CRUD operations
- Type-safe with validation

#### 3. **Service Layer Pattern**
Three types of services:
- **Domain Services**: Pure business logic (`UrlBuilderService`)
- **Application Services**: Orchestration (`FormStateManagerService`)
- **Infrastructure Services**: External APIs (`ClipboardService`, `StorageService`)

#### 4. **Component Composition**
Components are small, focused, and composable:
```typescript
<app-url-preview
  [urlData]="constructedUrl()"
  (copyClicked)="onCopyUrl()"
  (saveClicked)="onSaveBuild()">
</app-url-preview>
```

## 🎯 Advanced Patterns Used

### 1. Signals with Computed Values
```typescript
readonly filterTerm = signal('');
readonly filteredBuilds = computed(() => {
  const term = this.filterTerm().toLowerCase();
  return this.allBuilds().filter(build =>
    build.finalUrl.includes(term)
  );
});
```

### 2. Typed Reactive Forms
```typescript
FormGroup<{
  baseUrl: FormControl<string | null>;
  params: FormArray<FormGroup<{
    key: FormControl<string | null>;
    value: FormControl<string | null>;
  }>>;
}>
```

### 3. Validator Factories (Pure Functions)
```typescript
export function absoluteUrlValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    // Validation logic
  };
}
```

### 4. Type Guards
```typescript
export function isValidQueryParameter(param: unknown): param is QueryParameter {
  return (
    typeof param === 'object' &&
    param !== null &&
    'key' in param &&
    'value' in param
  );
}
```

## 🧪 Code Quality

- **TypeScript Strict Mode** - Full type safety
- **No `any` types** - Explicit typing throughout
- **Immutability** - Readonly properties in models
- **Pure Functions** - No side effects in validators and utilities
- **DRY** - No code duplication
- **KISS** - Simple, understandable code
- **SOLID** - All principles applied

## 🔒 Security

- URL validation prevents XSS
- Input sanitization for parameter keys
- No direct DOM manipulation
- CSP-friendly (no inline scripts)

## ♿ Accessibility

- ARIA labels and roles
- Keyboard navigation (Enter, Space)
- Screen reader support
- Focus management
- Semantic HTML

## 📦 Bundle Size

```
Initial bundle:  ~69 KB (gzipped)
Lazy chunk:      ~2 KB (history component)
```

## 🚀 Future Enhancements

- [ ] QR code generation for URLs
- [ ] Export/import builds to JSON
- [ ] URL shortening integration
- [ ] More comprehensive unit tests
- [ ] E2E tests with Playwright
- [ ] i18n support
- [ ] Dark mode theme