# Figma Design System Wizard — Plan

Web app prowadząca designerów i developerów przez cały Bootstrap pipeline
krok po kroku — bez terminala, bez konfiguracji plików.

---

## Stack

| Warstwa | Technologia |
|---|---|
| Framework | Next.js 15 (App Router) + TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| State | Zustand (wizard state) + URL params (shareable step) |
| LLM | Claude API `claude-sonnet-4-6` z tool_use + streaming |
| Figma | Remote MCP `https://mcp.figma.com/mcp` via OAuth / PAT |
| ZIP | JSZip (client-side bundle) |
| Deploy | GitHub REST API → GitHub Pages |
| Auth | NextAuth.js (Figma OAuth provider) + encrypted cookie |

---

## Struktura folderów

```
wizard/
├── PLAN.md                        # ten plik
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── .env.example                   # FIGMA_CLIENT_ID, FIGMA_CLIENT_SECRET,
│                                  # ANTHROPIC_API_KEY, NEXTAUTH_SECRET
├── app/
│   ├── layout.tsx                 # root layout + providers
│   ├── page.tsx                   # redirect → /wizard/1
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts   # NextAuth Figma OAuth
│   │   ├── run-skill/route.ts            # Claude API stream (POST)
│   │   ├── export/zip/route.ts           # ZIP generator (POST)
│   │   ├── export/github-pages/route.ts  # GitHub Pages deploy (POST)
│   │   └── export/ai-instructions/route.ts # .designrules.md / CLAUDE.md
│   └── wizard/
│       ├── layout.tsx             # WizardShell (stepper sidebar)
│       └── [step]/page.tsx        # kroki 1–7 dynamicznie
├── components/
│   ├── wizard/
│   │   ├── WizardShell.tsx        # sidebar stepper + nawigacja
│   │   ├── steps/
│   │   │   ├── Step1Connect.tsx   # Figma OAuth lub PAT
│   │   │   ├── Step2Readiness.tsx # URL pliku + wynik readiness check
│   │   │   ├── Step3Profile.tsx   # stack, CSS approach, urządzenia
│   │   │   ├── Step4Extract.tsx   # streaming ekstrakcji z licznikami
│   │   │   ├── Step5Validate.tsx  # tabela stanów komponentów
│   │   │   ├── Step6Generate.tsx  # lista komponentów + postęp generowania
│   │   │   ├── Step6bEdit.tsx     # token editor + notatki do komponentów
│   │   │   └── Step7Export.tsx    # podgląd showcase + ZIP + GitHub Pages + AI
│   │   └── shared/
│   │       ├── SkillStream.tsx    # wyświetla streaming output z Claude
│   │       ├── StatusBadge.tsx    # PASS / WARN / FAIL / IN PROGRESS
│   │       └── ArtifactCard.tsx   # karta z plikiem wyjściowym
│   └── ui/                        # shadcn: Button, Card, Progress, Badge…
├── lib/
│   ├── claude.ts                  # buildMessages() + streamSkill()
│   ├── figma-auth.ts              # getToken() → OAuth lub PAT
│   ├── skill-prompts.ts           # buildPrompt(skillName, inputs) → string
│   │                              # czyta ../skills/<name>/SKILL.md
│   ├── wizard-store.ts            # Zustand store
│   └── export/
│       ├── zip.ts                 # zbiera artifacts, pakuje JSZip
│       ├── github-pages.ts        # GitHub API: create/update repo + Pages
│       └── ai-instructions.ts     # .designrules.md / CLAUDE.md / copilot
└── skills -> ../skills            # symlink (read-only reference do skilli)
```

---

## Kroki wizarda (7 + 1 opcjonalny)

### Krok 1 — Połącz z Figmą
- Przycisk "Zaloguj przez Figma" (OAuth)
- Fallback: pole tekstowe na Personal Access Token
- Token zapisywany w zaszyfrowanym cookie sesji

### Krok 2 — Plik Figma + Readiness Check
- Input: URL pliku Figma
- Po wklejeniu: auto-wywołanie `figma-readiness-check` (streaming)
- Wynik: karta z verdict (READY / WARNINGS / NOT READY), lista blokerów
- Jeśli NOT READY: blokada "Dalej" z opcją "Kontynuuj mimo to"

### Krok 3 — Profil projektu
- Kafelki: tier (static-file / static-site / framework-app)
- Multi-select: urządzenia (mobile, tablet, desktop)
- Dropdown: CSS approach (plain-css, tailwind, scss)
- Checkbox: showcaseAutoUpdate (domyślnie ON)

### Krok 4 — Ekstrakcja
- Streaming output z `extract-design-system`
- Live liczniki: tokeny, komponenty
- Na końcu: tabela tokenów + lista komponentów

### Krok 5 — Walidacja
- Auto-wywołanie `validate-extraction`
- Tabela: komponent × stany × wynik (✅ / ⚠️ / ❌)
- Przycisk "Kontynuuj mimo ostrzeżeń" jeśli brak blokerów

### Krok 6 — Generowanie komponentów
- Lista checkboxów: wszystkie wykryte komponenty (domyślnie zaznaczone)
- Postęp per-komponent (streaming) + mini-podgląd showcase po każdym

### Krok 6b — Edycja design systemu (opcjonalny)
- **Token editor**: edytowalne wartości tokenów (kolor, spacing, typografia)
- **Component notes**: dopisanie opisów/notatek do komponentów
- **Status komponentu**: gotowy / wymaga poprawki / pomiń
- Wszystkie zmiany lokalne w sesji — nie zapisuje do Figmy

### Krok 7 — Eksport
- Podgląd `showcase/components.html` w iframie
- Trzy opcje:
  1. **Pobierz ZIP** — tokeny + komponenty + showcase.html
  2. **Deploy na GitHub Pages** — formularz: repo name + GitHub token → URL strony
  3. **Eksportuj instrukcje AI** — do wyboru:
     - `.designrules.md` (Cursor / Windsurf `@file`)
     - `CLAUDE.md` (Claude Code)
     - `.github/copilot-instructions.md` (GitHub Copilot)

---

## Kluczowe decyzje techniczne

### Claude API + Figma MCP (server-side)
```ts
// app/api/run-skill/route.ts
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-6',
  max_tokens: 8192,
  stream: true,
  system: skillPrompt,   // treść SKILL.md jako system prompt
  messages: [{ role: 'user', content: userMessage }],
  mcp_servers: [{
    type: 'url',
    url: 'https://mcp.figma.com/mcp',
    authorization_token: figmaToken,
  }]
})
// Wynik → Server-Sent Events → SkillStream.tsx
```

### Wizard state (Zustand)
```ts
{
  figmaToken: string | null,
  figmaFileUrl: string,
  profile: TargetProfile,
  artifacts: {
    tokens: TokenFile[],
    components: ComponentEntry[],
    showcase: string,
  },
  edits: {
    tokenOverrides: Record<string, string>,
    componentNotes: Record<string, string>,
    componentStatus: Record<string, 'ready' | 'needs-work' | 'skip'>,
  },
  stepStatus: Record<1 | 2 | 3 | 4 | 5 | 6 | 7, 'idle' | 'running' | 'done' | 'error'>
}
```

### ZIP export (client-side)
`lib/export/zip.ts` — zbiera tokens + komponenty + edits z store, pakuje
JSZip → Blob → download trigger. Zero uploadu.

### GitHub Pages deploy
```
1. POST /repos/{owner}/{repo} — utwórz repo
2. PUT /repos/{owner}/{repo}/contents/{path} — push pliki showcase
3. POST /repos/{owner}/{repo}/pages — aktywuj Pages
4. Zwróć URL: https://{owner}.github.io/{repo}/
```

---

## Kolejność implementacji

1. Scaffold — `package.json`, `next.config.ts`, `tailwind.config.ts`, `.env.example`
2. Auth — `lib/figma-auth.ts` + `app/api/auth/`
3. Claude bridge — `lib/skill-prompts.ts` + `app/api/run-skill/route.ts`
4. Wizard shell — `WizardShell.tsx` + routing `/wizard/[step]`
5. Kroki 1–6 (jeden po drugim)
6. Token editor (krok 6b)
7. Export — `lib/export/` + `app/api/export/` + krok 7

---

## Weryfikacja end-to-end

- Krok 1: OAuth redirect → token w cookie
- Krok 2: URL → streaming readiness check widoczny w UI
- Krok 3: wybór profilu zapisuje się w store
- Krok 4: liczniki tokenów i komponentów rosną podczas ekstrakcji
- Krok 6b: zmiana tokenu kolorystycznego widoczna w sesji
- Krok 7/ZIP: paczka zawiera tokeny + komponenty + showcase + user edits
- Krok 7/Pages: `https://{owner}.github.io/{repo}/` otwiera showcase
- Krok 7/AI: `.designrules.md` załadowany jako `@file` w Cursor — agent
  rozumie tokeny i komponenty bez uruchamiania MCP

---

## Czego NIE robimy w tej wersji

- Lokalny MCP (wymaga desktopa — za trudne dla designerów)
- Rejestracja / historia projektów / dashboard
- Edycja komponentów w UI (tylko tokeny i notatki)
- Zapis zmian z powrotem do Figmy
