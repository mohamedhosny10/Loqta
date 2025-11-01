import Image from 'next/image';
import Link from 'next/link';
import { Instagram, Linkedin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-24 bg-dark text-white">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="flex items-center">
            <Image 
              src="/Logo.png" 
              alt="Loqta" 
              width={220} 
              height={80} 
              className="h-16 md:h-24 w-auto object-contain"
            />
          </div>
          <div className="flex flex-col md:flex-row gap-8 md:gap-12">
            <div>
              <h4 className="font-semibold mb-3">Follow us</h4>
              <div className="flex items-center gap-3">
                <Link href="#" aria-label="LinkedIn" className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/10 hover:bg-white/20">
                  <Linkedin />
                </Link>
                <Link href="#" aria-label="Instagram" className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/10 hover:bg-white/20">
                  <Instagram />
                </Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Contact</h4>
              <ul className="space-y-2 text-sm text-white/80" id="contact">
                <li><a href="mailto:hello@loqta.app" className="hover:text-primary">hello@loqta.app</a></li>
                <li><a href="mailto:support@loqta.app" className="hover:text-primary">support@loqta.app</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Links</h4>
              <ul className="space-y-2 text-sm text-white/80">
                <li><Link href="#" className="hover:text-primary">Brand Assets</Link></li>
                <li><Link href="#" className="hover:text-primary">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4 text-xs text-white/70">
          © 2025 Loqta
        </div>
      </div>
    </footer>
  );
}


