import './globals.css';
import Navbar from './components/Navbar';

export const metadata = {
  title:       'JongCamp — จองแคมป์',
  description: 'ระบบจองที่พักแคมปิ้งออนไลน์',
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body>
        <Navbar />
        <main className="container page-body">
          {children}
        </main>
      </body>
    </html>
  );
}