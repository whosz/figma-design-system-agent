import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type AiProvider = 'anthropic' | 'openai' | 'google' | 'copilot'
export type OutputTier = 'static-file' | 'static-site' | 'framework-app'
export type CssApproach = 'plain-css' | 'tailwind' | 'scss'
export type Device = 'mobile' | 'tablet' | 'desktop'
export type StepStatus = 'idle' | 'running' | 'done' | 'error'
export type ComponentStatus = 'ready' | 'needs-work' | 'skip'

export interface TargetProfile {
  tier: OutputTier
  cssApproach: CssApproach
  devices: Device[]
  showcaseAutoUpdate: boolean
}

export interface ComponentEntry {
  id: string
  name: string
  states: string[]
  variants: string[]
  selected: boolean
  status: ComponentStatus
  notes: string
  generated: boolean
}

export interface TokenOverride {
  name: string
  originalValue: string
  newValue: string
}

export type FigmaDataMode = 'auto' | 'mcp' | 'rest'

interface WizardState {
  // Auth
  figmaToken: string | null
  figmaTokenType: 'oauth' | 'pat' | null
  aiProvider: AiProvider
  aiApiKey: string | null
  aiModel: string | null
  figmaDataMode: FigmaDataMode

  // File
  figmaFileUrl: string

  // Profile
  profile: TargetProfile

  // Artifacts from extraction
  tokenCount: number
  componentEntries: ComponentEntry[]
  showcaseHtml: string

  // Edits
  tokenOverrides: Record<string, string>

  // Step tracking
  stepStatus: Record<number, StepStatus>
  currentStep: number

  // Actions
  setFigmaToken: (token: string, type: 'oauth' | 'pat') => void
  setAiCredentials: (provider: AiProvider, key: string, model: string) => void
  setFigmaDataMode: (mode: FigmaDataMode) => void
  setFigmaFileUrl: (url: string) => void
  setProfile: (profile: Partial<TargetProfile>) => void
  setTokenCount: (count: number) => void
  setComponentEntries: (entries: ComponentEntry[]) => void
  toggleComponent: (id: string) => void
  setComponentStatus: (id: string, status: ComponentStatus) => void
  setComponentNotes: (id: string, notes: string) => void
  setTokenOverride: (name: string, value: string) => void
  setShowcaseHtml: (html: string) => void
  setStepStatus: (step: number, status: StepStatus) => void
  setCurrentStep: (step: number) => void
  markComponentGenerated: (id: string) => void
  reset: () => void
}

const defaultProfile: TargetProfile = {
  tier: 'static-file',
  cssApproach: 'plain-css',
  devices: ['mobile', 'desktop'],
  showcaseAutoUpdate: true,
}

export const useWizardStore = create<WizardState>()(
  persist(
    (set) => ({
      figmaToken: null,
      figmaTokenType: null,
      aiProvider: 'anthropic',
      aiApiKey: null,
      aiModel: null,
      figmaDataMode: 'auto' as FigmaDataMode,
      figmaFileUrl: '',
      profile: defaultProfile,
      tokenCount: 0,
      componentEntries: [],
      showcaseHtml: '',
      tokenOverrides: {},
      stepStatus: { 1: 'idle', 2: 'idle', 3: 'idle', 4: 'idle', 5: 'idle', 6: 'idle', 7: 'idle' },
      currentStep: 1,

      setFigmaToken: (token, type) => set({ figmaToken: token, figmaTokenType: type }),
      setAiCredentials: (provider, key, model) => set({ aiProvider: provider, aiApiKey: key, aiModel: model }),
      setFigmaDataMode: (mode) => set({ figmaDataMode: mode }),
      setFigmaFileUrl: (url) => set({ figmaFileUrl: url }),
      setProfile: (partial) => set((s) => ({ profile: { ...s.profile, ...partial } })),
      setTokenCount: (count) => set({ tokenCount: count }),
      setComponentEntries: (entries) => set({ componentEntries: entries }),
      toggleComponent: (id) =>
        set((s) => ({
          componentEntries: s.componentEntries.map((c) =>
            c.id === id ? { ...c, selected: !c.selected } : c
          ),
        })),
      setComponentStatus: (id, status) =>
        set((s) => ({
          componentEntries: s.componentEntries.map((c) =>
            c.id === id ? { ...c, status } : c
          ),
        })),
      setComponentNotes: (id, notes) =>
        set((s) => ({
          componentEntries: s.componentEntries.map((c) =>
            c.id === id ? { ...c, notes } : c
          ),
        })),
      setTokenOverride: (name, value) =>
        set((s) => ({ tokenOverrides: { ...s.tokenOverrides, [name]: value } })),
      setShowcaseHtml: (html) => set({ showcaseHtml: html }),
      setStepStatus: (step, status) =>
        set((s) => ({ stepStatus: { ...s.stepStatus, [step]: status } })),
      setCurrentStep: (step) => set({ currentStep: step }),
      markComponentGenerated: (id) =>
        set((s) => ({
          componentEntries: s.componentEntries.map((c) =>
            c.id === id ? { ...c, generated: true } : c
          ),
        })),
      reset: () =>
        set({
          figmaToken: null,
          figmaTokenType: null,
          aiProvider: 'anthropic',
          aiApiKey: null,
          aiModel: null,
          figmaDataMode: 'auto',
          figmaFileUrl: '',
          profile: defaultProfile,
          tokenCount: 0,
          componentEntries: [],
          showcaseHtml: '',
          tokenOverrides: {},
          stepStatus: { 1: 'idle', 2: 'idle', 3: 'idle', 4: 'idle', 5: 'idle', 6: 'idle', 7: 'idle' },
          currentStep: 1,
        }),
    }),
    { name: 'wizard-state' }
  )
)
