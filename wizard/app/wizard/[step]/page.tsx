import { notFound } from 'next/navigation'
import { Step1Connect } from '@/components/wizard/steps/Step1Connect'
import { Step2Readiness } from '@/components/wizard/steps/Step2Readiness'
import { Step3Profile } from '@/components/wizard/steps/Step3Profile'
import { Step4Extract } from '@/components/wizard/steps/Step4Extract'
import { Step5Validate } from '@/components/wizard/steps/Step5Validate'
import { Step6Generate } from '@/components/wizard/steps/Step6Generate'
import { Step7Export } from '@/components/wizard/steps/Step7Export'

const STEPS: Record<string, React.ComponentType> = {
  '1': Step1Connect,
  '2': Step2Readiness,
  '3': Step3Profile,
  '4': Step4Extract,
  '5': Step5Validate,
  '6': Step6Generate,
  '7': Step7Export,
}

export default async function StepPage({ params }: { params: Promise<{ step: string }> }) {
  const { step } = await params
  const StepComponent = STEPS[step]
  if (!StepComponent) notFound()
  return <StepComponent />
}

export function generateStaticParams() {
  return Object.keys(STEPS).map((step) => ({ step }))
}
