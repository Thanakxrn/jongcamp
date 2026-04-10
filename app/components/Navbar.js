'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const path = usePathname();

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <Link href="/campsites" className="navbar-logo">
          🏕️ JongCamp
        </Link>
        <div className="navbar-links">
          <Link
            href="/campsites"
            className={`navbar-link ${
              path.startsWith('/campsites') ? 'active' : ''
            }`}
          >
            🏕️ ที่พัก
          </Link>
          <Link
            href="/bookings"
            className={`navbar-link ${
              path.startsWith('/bookings') ? 'active' : ''
            }`}
          >
            🧾 การจอง
          </Link>
          <Link
            href="/facilities"
            className={`navbar-link ${
              path.startsWith('/facilities') ? 'active' : ''
            }`}
          >
            ⚙️ สิ่งอำนวยฯ
          </Link>
        </div>
      </div>
    </nav>
  );
}