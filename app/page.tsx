import { Hero } from '@/components/Hero';
import { HowItWorks } from '@/components/HowItWorks';
import { CTASection } from '@/components/CTASection';

export default function HomePage() {
  return (
    <div className="flex flex-col gap-24">
      <Hero />
      <HowItWorks />
      <CTASection />
    </div>
  );
}


