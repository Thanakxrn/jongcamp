'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const STATUS_TH = {
  pending:      'รอยืนยัน',
  confirmed:    'ยืนยันแล้ว',
  cancelled:    'ยกเลิก',
  checked_out:  'เช็คเอาต์แล้ว',
};

export default function DashboardPage() {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [checkingOut, setCheckingOut] = useState(null); // booking id ที่กำลัง process

  const loadData = () => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); });
  };

  useEffect(() => { loadData(); }, []);

  // เช็คเอาต์ด้วยมือ
  async function handleCheckout(bookingId) {
    if (!confirm('ยืนยันเช็คเอาต์ก่อนกำหนด?')) return;
    setCheckingOut(bookingId);
    try {
      await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'checked_out' }),
      });
      loadData(); // refresh ข้อมูล dashboard
    } finally {
      setCheckingOut(null);
    }
  }

  if (loading) return <div className="loading-text">กำลังโหลด...</div>;

  const { summary, top_campsites, recent_bookings, monthly_revenue } = data;
  const maxBookings = Math.max(...top_campsites.map(c => c.booking_count), 1);

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between',
                    alignItems:'center', marginBottom:'24px' }}>
        <div>
          <h1 style={{ fontSize:'22px', fontWeight:'600',
                       marginBottom:'4px' }}>
            📊 ภาพรวม JongCamp
          </h1>
          <p style={{ fontSize:'13px', color:'var(--text-muted)' }}>
            ข้อมูล ณ วันนี้
          </p>
        </div>
        <div style={{ display:'flex', gap:'8px' }}>
          <Link href="/campsites" className="btn btn-outline btn-sm">
            🏕️ ที่พัก
          </Link>
          <Link href="/bookings" className="btn btn-outline btn-sm">
            🧾 การจอง
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-grid"
        style={{ gridTemplateColumns:'repeat(4,1fr)',
                 marginBottom:'28px' }}>
        <div className="summary-card">
          <div className="s-num">
            {summary.total_campsites}
          </div>
          <div className="s-label">🏕️ ที่พักทั้งหมด</div>
        </div>
        <div className="summary-card">
          <div className="s-num earn">
            ฿{Number(summary.total_revenue).toLocaleString()}
          </div>
          <div className="s-label">💰 รายได้รวม</div>
        </div>
        <div className="summary-card">
          <div className="s-num warn">
            {summary.pending_bookings}
          </div>
          <div className="s-label">⏳ รอยืนยัน</div>
        </div>
        <div className="summary-card">
          <div className="s-num"
            style={{ color:'var(--green-mid)' }}>
            {summary.total_bookings}
          </div>
          <div className="s-label">📋 จองทั้งหมด</div>
        </div>
      </div>

      {/* Main content 2 columns */}
      <div style={{ display:'grid',
                    gridTemplateColumns:'1fr 1fr',
                    gap:'20px', marginBottom:'28px' }}>

        {/* Top campsites */}
        <div style={{ background:'var(--white)',
                      border:'0.5px solid var(--border)',
                      borderRadius:'var(--radius-lg)',
                      padding:'18px' }}>
          <p style={{ fontSize:'14px', fontWeight:'600',
                      marginBottom:'14px',
                      color:'var(--text-main)' }}>
            🏆 ที่พักยอดนิยม
          </p>
          {top_campsites.map((c, i) => (
            <div key={c.id} style={{ display:'flex', alignItems:'center',
                                      gap:'10px', padding:'10px 0',
                                      borderBottom: i < top_campsites.length - 1
                                        ? '0.5px solid var(--border)' : 'none' }}>
              {/* rank badge */}
              <div style={{
                width:'26px', height:'26px', borderRadius:'50%',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:'11px', fontWeight:'600', flexShrink:0,
                background: i === 0 ? 'var(--green-main)' : 'var(--green-pale)',
                color: i === 0 ? '#fff' : 'var(--green-dark)',
              }}>{i + 1}</div>

              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:'13px', fontWeight:'500',
                            color:'var(--text-main)',
                            marginBottom:'4px',
                            overflow:'hidden', textOverflow:'ellipsis',
                            whiteSpace:'nowrap' }}>
                  {c.name}
                </p>
                {/* bar chart */}
                <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                  <div style={{ flex:1, background:'var(--green-pale)',
                                 borderRadius:'4px', height:'6px',
                                 overflow:'hidden' }}>
                    <div style={{
                      height:'100%', borderRadius:'4px',
                      background:'var(--green-main)',
                      width: `${(c.booking_count / maxBookings) * 100}%`,
                      transition:'width 0.6s ease',
                    }} />
                  </div>
                  <span style={{ fontSize:'11px', color:'var(--text-muted)',
                                  whiteSpace:'nowrap' }}>
                    {c.booking_count} ครั้ง
                  </span>
                </div>
              </div>

              <span style={{ fontSize:'12px', fontWeight:'600',
                              color:'var(--brown-dark)',
                              flexShrink:0 }}>
                ฿{Number(c.revenue).toLocaleString()}
              </span>
            </div>
          ))}
          {top_campsites.every(c => c.booking_count === 0) && (
            <p style={{ fontSize:'13px', color:'var(--text-muted)',
                        textAlign:'center', padding:'16px 0' }}>
              ยังไม่มีการจอง
            </p>
          )}
        </div>

        {/* Recent bookings */}
        <div style={{ background:'var(--white)',
                      border:'0.5px solid var(--border)',
                      borderRadius:'var(--radius-lg)',
                      padding:'18px' }}>
          <div style={{ display:'flex', justifyContent:'space-between',
                        alignItems:'center', marginBottom:'14px' }}>
            <p style={{ fontSize:'14px', fontWeight:'600',
                        color:'var(--text-main)' }}>
              🕐 การจองล่าสุด
            </p>
            <Link href="/bookings"
              style={{ fontSize:'12px', color:'var(--green-main)' }}>
              ดูทั้งหมด →
            </Link>
          </div>

          {recent_bookings.length === 0 ? (
            <p style={{ fontSize:'13px', color:'var(--text-muted)',
                        textAlign:'center', padding:'16px 0' }}>
              ยังไม่มีการจอง
            </p>
          ) : recent_bookings.map(b => (
            <div key={b.id}
              style={{ display:'flex', alignItems:'center',
                       gap:'10px', padding:'8px 12px',
                       background:'var(--green-pale)',
                       borderRadius:'8px', marginBottom:'6px',
                       border:'0.5px solid var(--border)' }}>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:'13px', fontWeight:'500',
                            color:'var(--text-main)',
                            marginBottom:'1px' }}>
                  {b.guest_name}
                </p>
                <p style={{ fontSize:'11px', color:'var(--text-muted)',
                            overflow:'hidden', textOverflow:'ellipsis',
                            whiteSpace:'nowrap' }}>
                  {b.campsite_name} · {b.check_in} → {b.check_out}
                </p>
              </div>
              <span style={{ fontSize:'12px', fontWeight:'600',
                              color:'var(--green-main)',
                              flexShrink:0 }}>
                ฿{Number(b.total).toLocaleString()}
              </span>
              <span className={`badge badge-${b.status}`}>
                {STATUS_TH[b.status]}
              </span>
              {/* ปุ่มเช็คเอาต์ด้วยมือ — แสดงเฉพาะ confirmed */}
              {b.status === 'confirmed' && (
                <button
                  onClick={() => handleCheckout(b.id)}
                  disabled={checkingOut === b.id}
                  style={{
                    flexShrink: 0,
                    fontSize: '11px',
                    fontWeight: '600',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    border: '1px solid var(--green-main)',
                    background: checkingOut === b.id ? 'var(--green-pale)' : 'var(--green-main)',
                    color: checkingOut === b.id ? 'var(--green-main)' : '#fff',
                    cursor: checkingOut === b.id ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                  }}>
                  {checkingOut === b.id ? '...' : '🚪 เช็คเอาต์'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Revenue Bar Chart */}
      {monthly_revenue.length > 0 && (
        <div style={{ background:'var(--white)',
                      border:'0.5px solid var(--border)',
                      borderRadius:'var(--radius-lg)',
                      padding:'18px' }}>
          <p style={{ fontSize:'14px', fontWeight:'600',
                      marginBottom:'20px',
                      color:'var(--text-main)' }}>
            📈 รายได้รายเดือน (6 เดือนหลัง)
          </p>
          <MonthlyChart data={monthly_revenue} />
        </div>
      )}
    </div>
  );
}

// Bar chart component แบบ pure CSS ไม่ต้องติดตั้ง library
function MonthlyChart({ data }) {
  const maxRev = Math.max(...data.map(d => Number(d.revenue)), 1);

  return (
    <div style={{ display:'flex', alignItems:'flex-end',
                  gap:'10px', height:'140px',
                  padding:'0 8px' }}>
      {data.map(d => {
        const pct = (Number(d.revenue) / maxRev) * 100;
        const [yr, mo] = d.month.split('-');
        const label = new Date(yr, mo - 1)
          .toLocaleDateString('th-TH', { month:'short' });
        return (
          <div key={d.month}
            style={{ flex:1, display:'flex', flexDirection:'column',
                     alignItems:'center', gap:'6px',
                     height:'100%', justifyContent:'flex-end' }}>
            <span style={{ fontSize:'10px', color:'var(--text-muted)',
                           whiteSpace:'nowrap' }}>
              ฿{(Number(d.revenue) / 1000).toFixed(1)}k
            </span>
            <div style={{
              width:'100%', borderRadius:'6px 6px 0 0',
              background:'var(--green-main)',
              height: `${pct}%`,
              minHeight:'4px',
              transition:'height 0.6s ease',
            }} />
            <span style={{ fontSize:'11px', color:'var(--text-sub)' }}>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
