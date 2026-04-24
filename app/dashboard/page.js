'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/dashboard');
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) return <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>⏳ กำลังโหลดข้อมูล...</div>;
  if (!stats) return <div className="container" style={{ padding: '2rem' }}>❌ ไม่สามารถโหลดข้อมูลได้</div>;

  return (
    <div className="container">
      <div style={{ marginBottom: 30 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--green-dark)' }}>📊 ภาพรวมระบบ</h1>
        <p style={{ color: 'var(--text-muted)' }}>ข้อมูลสรุปการจองและรายได้ของ JongCamp</p>
      </div>

      {/* Stats Cards */}
      <div className="summary-grid" style={{ marginBottom: 40 }}>
        <div className="summary-card" style={{ borderLeft: '5px solid var(--primary)' }}>
          <div className="s-label">การจองทั้งหมด</div>
          <div className="s-num">{stats.total}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 5 }}>รายการ</div>
        </div>
        <div className="summary-card" style={{ borderLeft: '5px solid var(--accent)' }}>
          <div className="s-label">รอยืนยัน</div>
          <div className="s-num" style={{ color: 'var(--accent)' }}>{stats.pending}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 5 }}>รายการที่ต้องตรวจสอบ</div>
        </div>
        <div className="summary-card" style={{ borderLeft: '5px solid var(--green-dark)' }}>
          <div className="s-label">ยืนยันแล้ว</div>
          <div className="s-num" style={{ color: 'var(--green-dark)' }}>{stats.confirmed}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 5 }}>พร้อมเข้าพัก</div>
        </div>
        <div className="summary-card" style={{ borderLeft: '5px solid #2ecc71', background: 'linear-gradient(135deg, #fff 0%, #f0fff4 100%)' }}>
          <div className="s-label">รายได้ที่ยืนยันแล้ว</div>
          <div className="s-num" style={{ color: '#27ae60', fontSize: 26 }}>
            ฿{Number(stats.revenue).toLocaleString()}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 5 }}>บาท</div>
        </div>
      </div>

      {/* Recent Bookings & Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 30 }}>
        
        {/* Recent Bookings Table */}
        <div className="card" style={{ padding: 24, borderRadius: 16, border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>🕒 การจองล่าสุด</h2>
            <Link href="/bookings" style={{ fontSize: 14, color: 'var(--primary)', fontWeight: 600 }}>ดูทั้งหมด →</Link>
          </div>
          
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '12px 8px', fontSize: 13, color: 'var(--text-muted)' }}>ลูกค้า</th>
                  <th style={{ padding: '12px 8px', fontSize: 13, color: 'var(--text-muted)' }}>ที่พัก</th>
                  <th style={{ padding: '12px 8px', fontSize: 13, color: 'var(--text-muted)' }}>สถานะ</th>
                  <th style={{ padding: '12px 8px', fontSize: 13, color: 'var(--text-muted)', textAlign: 'right' }}>ยอดรวม</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent.map(b => (
                  <tr key={b.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                    <td style={{ padding: '14px 8px', fontSize: 14 }}>
                      <div style={{ fontWeight: 600 }}>{b.guest_name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{b.phone}</div>
                    </td>
                    <td style={{ padding: '14px 8px', fontSize: 14 }}>{b.campsite_name}</td>
                    <td style={{ padding: '14px 8px' }}>
                      <span className={`badge badge-${b.status}`} style={{ fontSize: 11 }}>
                        {b.status === 'confirmed' ? 'ยืนยันแล้ว' : b.status === 'pending' ? 'รอยืนยัน' : 'ยกเลิก'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 8px', textAlign: 'right', fontWeight: 700, fontSize: 14 }}>
                      ฿{Number(b.total).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <div className="card" style={{ padding: 24, borderRadius: 16, border: '1px solid var(--border)', background: 'var(--green-bg)' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 15 }}>⚡ ทางลัด</h2>
            <div style={{ display: 'grid', gap: 10 }}>
              <Link href="/campsites" className="btn btn-primary" style={{ textAlign: 'center', display: 'block', textDecoration: 'none' }}>
                🏕️ จัดการที่พัก
              </Link>
              <Link href="/bookings" className="btn btn-outline" style={{ textAlign: 'center', display: 'block', textDecoration: 'none', background: 'white' }}>
                🧾 ดูรายการจองทั้งหมด
              </Link>
            </div>
          </div>
          
          <div style={{ marginTop: 20, padding: 15, borderRadius: 12, border: '1px dashed var(--border)', textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              ต้องการความช่วยเหลือ? <br />
              <Link href="#" style={{ color: 'var(--primary)' }}>ดูคู่มือการใช้งาน</Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}