import { WizardShell } from '@/components/wizard/WizardShell'

export default function WizardLayout({ children }: { children: React.ReactNode }) {
  return <WizardShell>{children}</WizardShell>
}
