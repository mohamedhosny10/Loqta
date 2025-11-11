import Link from 'next/link';
import Image from 'next/image';

export function CTASection() {
  return (
    <section className="max-w-6xl mx-auto px-4">
      <div className="grid grid-cols-1 md:grid-cols-2 rounded-3xl overflow-hidden border border-gray-200">
        <div className="bg-primary p-10 md:p-14 flex flex-col justify-center">
          <h3 className="text-2xl md:text-3xl font-bold mb-3 text-black">Join the Loqta community.</h3>
          <p className="text-black/80 mb-6">Help reunite people with their belongings.</p>
          <div>
            <Link href="/signin" className="inline-block bg-black text-white px-6 py-3 rounded-full font-semibold hover:opacity-90 transition-transform hover:scale-[1.03] shadow">
              Get Started
            </Link>
          </div>
        </div>
        <div className="relative min-h-[220px] md:min-h-[320px] bg-white">
          <Image
            src="/Image%20Join%20Us.png"
            alt="Join Us"
            fill
            className="object-contain p-6 md:p-10"
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
      </div>
    </section>
  );
}


