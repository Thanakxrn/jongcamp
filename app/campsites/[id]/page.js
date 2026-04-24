'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function typeIcon(type) {
  const icons = { 'เต็นท์': '⛺', 'กระท่อม': '🛖', 'ริมน้ำ': '🌊', 'บ้านพัก': '🏠' };
  return icons[type] || '🏕️';
}

export default function CampsiteDetailPage() {
  const { id }  = useParams();
  const router  = useRouter();

  const [site,      setSite]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [deleting,  setDeleting]  = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success,   setSuccess]   = useState(null); // booking result
  const [error,     setError]     = useState('');

  /* default dates: today / tomorrow */
  const today    = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const [form, setForm] = useState({
    guest_name: '',
    phone:      '',
    check_in:   today,
    check_out:  tomorrow,
    guests:     1,
  });

  useEffect(() => {
    fetch(`/api/campsites/${id}`)
      .then(r => r.json())
      .then(data => { setSite(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  /* คำนวณ realtime */
  const nights = Math.max(0, Math.round(
    (new Date(form.check_out) - new Date(form.check_in)) / 86400000
  ));
  const total = nights * Number(site?.price_night || 0);

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  /* ── Delete ── */
  async function onDelete() {
    setDeleting(true);
    await fetch(`/api/campsites/${id}`, { method: 'DELETE' });
    router.push('/campsites');
  }

  /* ── Book ── */
  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.guest_name.trim()) return setError('กรุณากรอกชื่อผู้จอง');
    if (nights <= 0) return setError('วันเช็คเอาท์ต้องหลังวันเช็คอิน');

    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/bookings', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ campsite_id: id, ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'เกิดข้อผิดพลาด');
      setSuccess(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Loading / Not found ── */
  if (loading) return (
    <p style={{ textAlign: 'center', padding: '3rem' }}>⏳ กำลังโหลด...</p>
  );
  if (!site) return (
    <div style={{ textAlign: 'center', padding: '3rem' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>❌</div>
      <p style={{ marginBottom: 16 }}>ไม่พบที่พักนี้</p>
      <Link href="/campsites" className="btn btn-outline">← กลับหน้าที่พัก</Link>
    </div>
  );

  /* ── Success screen ── */
  if (success) return (
    <div className="page-card" style={{ textAlign: 'center', padding: '48px 24px', maxWidth: 480, margin: '40px auto' }}>
      <div style={{ fontSize: 52, marginBottom: 12 }}>🎉</div>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: 'var(--green-dark)' }}>
        จองสำเร็จแล้ว!
      </h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{site.name}</p>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 4 }}>
        {success.check_in} → {success.check_out} ({nights} คืน) · {form.guests} คน
      </p>
      <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--green-dark)', marginBottom: 24 }}>
        ฿{Number(success.total).toLocaleString()}
      </p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link href="/campsites" className="btn btn-outline">ดูที่พักอื่น</Link>
        <Link href="/bookings"  className="btn btn-primary">ดูการจองทั้งหมด</Link>
      </div>
    </div>
  );

  /* ── facilities ── */
  const facs  = site.fac_names  ? site.fac_names.split(',').filter(Boolean)  : [];
  const icons = site.fac_icons  ? site.fac_icons.split(' ').filter(Boolean)  : [];

  return (
    <>
    <div style={{ maxWidth: 780, margin: '0 auto' }}>

      {/* Breadcrumb */}
      <div style={{ marginBottom: 16, fontSize: 13, color: 'var(--text-muted)' }}>
        <Link href="/campsites" style={{ color: 'var(--green)' }}>← กลับหน้าที่พัก</Link>
      </div>

      {/* ── Hero ── */}
      <div style={{
        borderRadius: 14, height: 240, overflow: 'hidden', position: 'relative',
        background: 'var(--green-bg)', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        fontSize: 72, marginBottom: 20,
      }}>
        {site.image ? (
          <img src={site.image} alt={site.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => { e.currentTarget.style.display = 'none'; }} />
        ) : typeIcon(site.type)}
        <span className={`campsite-status ${site.status}`} style={{ top: 14, right: 14 }}>
          {site.status === 'available' ? 'ว่าง' : 'เต็ม'}
        </span>
      </div>

      {/* ── Info row ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{site.name}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            {site.type} · รับได้ {site.capacity} คน
          </p>
        </div>
        <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--green-dark)' }}>
          ฿{Number(site.price_night).toLocaleString()}/คืน
        </p>
      </div>

      {/* ── Facilities ── */}
      {facs.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          {facs.map((f, i) => (
            <span key={i} className="fac-pill">{icons[i]} {f}</span>
          ))}
        </div>
      )}

      {/* ── Description ── */}
      {site.description && (
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 20 }}>
          {site.description}
        </p>
      )}

      {/* ── Action buttons ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
        <Link href={`/campsites/${id}/edit`} className="btn btn-outline btn-sm">✏️ แก้ไขข้อมูล</Link>
        <button className="btn btn-danger btn-sm" onClick={() => setShowDeleteModal(true)}>
          🗑 ลบที่พัก
        </button>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', marginBottom: 28 }} />

      {/* ══ Booking Form / Not Available Banner ══ */}
      {site.status !== 'available' ? (
        /* ── ป้ายไม่ว่าง ── */
        <div style={{
          background: '#fff5f5',
          border: '1.5px solid #fca5a5',
          borderRadius: 12,
          padding: '24px 20px',
          textAlign: 'center',
          marginTop: 8,
        }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🔒</div>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: '#b91c1c', marginBottom: 8 }}>
            ที่พักนี้ไม่ว่างในขณะนี้
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 18 }}>
            มีผู้เข้าพักอยู่แล้ว ยังไม่สามารถจองได้<br />
            กรุณารอจนกว่าที่พักจะว่าง หรือเลือกที่พักอื่น
          </p>
          <Link href="/campsites" className="btn btn-outline">← เลือกที่พักอื่น</Link>
        </div>
      ) : (
        /* ── Form จอง ── */
        <>
          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 18 }}>จองที่พักนี้</h2>

          <form onSubmit={handleSubmit}>

            {/* ชื่อ + เบอร์ */}
            <div className="form-grid-2" style={{ marginBottom: 14 }}>
              <div className="form-group">
                <label className="form-label">ชื่อผู้จอง *</label>
                <input id="guest_name" name="guest_name" className="form-input"
                  placeholder="ชื่อ-นามสกุล" value={form.guest_name}
                  maxLength={50} onChange={handleChange} required />
                <p style={{ fontSize: 11, color: form.guest_name.length > 45 ? 'var(--danger)' : 'var(--text-muted)', textAlign: 'right', marginTop: 3 }}>
                  {form.guest_name.length}/50
                </p>
              </div>
              <div className="form-group">
                <label className="form-label">เบอร์โทร</label>
                <input id="phone" name="phone" className="form-input"
                  inputMode="numeric" maxLength={10}
                  placeholder="0xxxxxxxxx" value={form.phone}
                  onChange={handleChange}
                  onInput={e => { e.target.value = e.target.value.replace(/\D/g, ''); }} />
                <p style={{ fontSize: 11, color: form.phone.length === 10 ? 'var(--green-dark)' : 'var(--text-muted)', textAlign: 'right', marginTop: 3 }}>
                  {form.phone.length}/10
                </p>
              </div>
            </div>

            {/* วันที่ + จำนวนคน */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div className="form-group">
                <label className="form-label">เช็คอิน *</label>
                <input id="check_in" name="check_in" type="date" className="form-input"
                  value={form.check_in} min={today} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">เช็คเอาท์ *</label>
                <input id="check_out" name="check_out" type="date" className="form-input"
                  value={form.check_out} min={form.check_in || today} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">จำนวนคน</label>
                <input id="guests" name="guests" type="number" className="form-input"
                  min={1} max={site.capacity} value={form.guests} onChange={handleChange} required />
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  สูงสุด {site.capacity} คน
                </p>
              </div>
            </div>

            {/* Price calc */}
            <div className="price-calc" style={{ marginBottom: 14 }}>
              <span>
                {nights > 0
                  ? `฿${Number(site.price_night).toLocaleString()} × ${nights} คืน`
                  : 'เลือกวันให้ครบก่อน'}
              </span>
              <span className="total">
                {nights > 0 ? `฿${total.toLocaleString()}` : '—'}
              </span>
            </div>

            {/* Error */}
            {error && (
              <p style={{
                color: 'var(--danger)', fontSize: 13,
                background: '#fff5f5', border: '1px solid #fcc',
                borderRadius: 8, padding: '8px 12px', marginBottom: 14,
              }}>{error}</p>
            )}

            {/* Submit */}
            <div style={{ display: 'flex', gap: 10 }}>
              <Link href="/campsites" className="btn btn-outline">ยกเลิก</Link>
              <button type="submit" className="btn btn-primary"
                disabled={submitting || nights <= 0}>
                {submitting ? '⏳ กำลังจอง...' : '✅ ยืนยันการจอง'}
              </button>
            </div>

          </form>
        </>
      )}

    </div>

      {/* ══ Delete Confirm Modal ══ */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-box" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🏕️</div>
              <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>ยืนยันการลบที่พัก</h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                ต้องการลบ <strong>"{site?.name}"</strong> ใช่หรือไม่?<br />
                การจองที่เกี่ยวข้องจะถูกลบออกด้วย
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn btn-outline" onClick={() => setShowDeleteModal(false)}>ยกเลิก</button>
              <button className="btn btn-danger" onClick={onDelete} disabled={deleting}>
                {deleting ? 'กำลังลบ...' : '🗑 ลบเลย'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
