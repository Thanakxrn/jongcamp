'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const path = usePathname();
  const links = [
    { href: '/dashboard',  label: '📊 Dashboard' },
    { href: '/campsites',  label: '🏕️ ที่พัก'    },
    { href: '/bookings',   label: '🧾 การจอง'  },
    { href: '/facilities', label: '⚙️ สิ่งอำนวยฯ' },
  ];

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <Link href="/dashboard" className="navbar-logo">
          🏕️ JongCamp
        </Link>
        <div className="navbar-links">
          {links.map(({ href, label }) => (
            <Link key={href} href={href}
              className={`navbar-link ${
                path.startsWith(href) ? 'active' : ''
              }`}>
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}