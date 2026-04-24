'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function BookPage() {
  const { id } = useParams();
  const router  = useRouter();

  const [campsite, setCampsite] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success,  setSuccess]  = useState(false);
  const [error,    setError]    = useState('');

  // form fields
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const [form, setForm] = useState({
    guest_name: '',
    phone:      '',
    check_in:   today,
    check_out:  tomorrow,
    guests:     1,
  });

  // ดึงข้อมูล campsite
  useEffect(() => {
    fetch(`/api/campsites/${id}`)
      .then(r => r.json())
      .then(data => { setCampsite(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  // คำนวณจำนวนคืนและราคา
  const nights = campsite
    ? Math.max(0, Math.round(
        (new Date(form.check_out) - new Date(form.check_in)) / 86400000
      ))
    : 0;
  const total = campsite ? nights * Number(campsite.price_night) : 0;

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (nights <= 0) { setError('วันเช็คเอาท์ต้องหลังวันเช็คอิน'); return; }
    if (!form.guest_name.trim()) { setError('กรุณากรอกชื่อผู้จอง'); return; }

    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campsite_id: id, ...form }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'เกิดข้อผิดพลาด');
      }
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return (
    <div className="page-body">
      <div className="container">
        <p className="loading-text">⏳ กำลังโหลด...</p>
      </div>
    </div>
  );

  if (!campsite) return (
    <div className="page-body">
      <div className="container">
        <div className="empty-state">
          <div className="empty-icon">❌</div>
          <p>ไม่พบข้อมูลที่พัก</p>
          <Link href="/campsites" className="btn btn-outline" style={{ marginTop: 16 }}>
            ← กลับหน้าที่พัก
          </Link>
        </div>
      </div>
    </div>
  );

  if (success) return (
    <div className="page-body">
      <div className="container">
        <div className="page-card" style={{ textAlign: 'center', padding: '40px 24px' }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>🎉</div>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8, color: 'var(--green-main)' }}>
            จองสำเร็จแล้ว!
          </h2>
          <p style={{ color: 'var(--text-sub)', marginBottom: 4 }}>
            {campsite.name}
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>
            {form.check_in} → {form.check_out} ({nights} คืน) · {form.guests} คน
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/campsites" className="btn btn-outline">ดูที่พักอื่น</Link>
            <Link href="/bookings"  className="btn btn-primary">ดูการจองทั้งหมด</Link>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="page-body">
      <div className="container">

        {/* breadcrumb */}
        <div style={{ marginBottom: 16, fontSize: 13, color: 'var(--text-muted)' }}>
          <Link href="/campsites" style={{ color: 'var(--green-main)' }}>ที่พัก</Link>
          {' '}/{'  '}จองที่พัก
        </div>

        <div className="page-card">
          {/* campsite summary */}
          <div style={{
            display: 'flex', gap: 14, alignItems: 'center',
            background: 'var(--green-pale)', borderRadius: 'var(--radius-md)',
            padding: '14px 16px', marginBottom: 24,
          }}>
            <div style={{
              fontSize: 36, width: 60, height: 60, background: 'var(--green-light)',
              borderRadius: 'var(--radius-md)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              overflow: 'hidden', position: 'relative',
            }}>
              {campsite.image ? (
                <img
                  src={campsite.image}
                  alt={campsite.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={e => { e.currentTarget.style.display = 'none'; }}
                />
              ) : '⛺'}
            </div>
            <div>
              <p style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-main)' }}>
                {campsite.name}
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                รับได้ {campsite.capacity} คน · {campsite.type}
                {campsite.fac_icons && ` · ${campsite.fac_icons}`}
              </p>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--green-main)', marginTop: 4 }}>
                ฿{Number(campsite.price_night).toLocaleString()}/คืน
              </p>
            </div>
          </div>

          <h1 className="page-card-title">กรอกข้อมูลจอง</h1>

          <form onSubmit={handleSubmit}>
            {/* ชื่อและเบอร์ */}
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">ชื่อผู้จอง *</label>
                <input
                  id="guest_name"
                  name="guest_name"
                  className="form-input"
                  placeholder="ชื่อ-นามสกุล"
                  maxLength={50}
                  value={form.guest_name}
                  onChange={handleChange}
                  required
                />
                <p style={{ fontSize: 11, color: form.guest_name.length > 45 ? 'var(--danger)' : 'var(--text-muted)', textAlign: 'right', marginTop: 3 }}>
                  {form.guest_name.length}/50
                </p>
              </div>
              <div className="form-group">
                <label className="form-label">เบอร์โทรศัพท์</label>
                <input
                  id="phone"
                  name="phone"
                  className="form-input"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="0xxxxxxxxx"
                  value={form.phone}
                  onChange={handleChange}
                  onInput={e => { e.target.value = e.target.value.replace(/\D/g, ''); }}
                />
                <p style={{ fontSize: 11, color: form.phone.length === 10 ? 'var(--green-dark)' : 'var(--text-muted)', textAlign: 'right', marginTop: 3 }}>
                  {form.phone.length}/10
                </p>
              </div>
            </div>

            {/* วันที่ */}
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">วันเช็คอิน *</label>
                <input
                  id="check_in"
                  name="check_in"
                  type="date"
                  className="form-input"
                  value={form.check_in}
                  min={today}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">วันเช็คเอาท์ *</label>
                <input
                  id="check_out"
                  name="check_out"
                  type="date"
                  className="form-input"
                  value={form.check_out}
                  min={form.check_in || today}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* จำนวนคน */}
            <div className="form-group">
              <label className="form-label">จำนวนคน *</label>
              <input
                id="guests"
                name="guests"
                type="number"
                className="form-input"
                min={1}
                max={campsite.capacity}
                value={form.guests}
                onChange={handleChange}
                required
              />
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                รับได้สูงสุด {campsite.capacity} คน
              </p>
            </div>

            {/* สรุปราคา */}
            <div className="price-calc">
              <span>
                {nights > 0
                  ? `฿${Number(campsite.price_night).toLocaleString()} × ${nights} คืน`
                  : 'เลือกวันให้ครบก่อน'}
              </span>
              <span className="total">
                {nights > 0 ? `฿${total.toLocaleString()}` : '—'}
              </span>
            </div>

            {/* error */}
            {error && (
              <p style={{
                color: 'var(--danger)', fontSize: 13,
                background: '#fff5f5', border: '0.5px solid #fcc',
                borderRadius: 'var(--radius-sm)', padding: '8px 12px',
                marginBottom: 12,
              }}>{error}</p>
            )}

            {/* actions */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Link href="/campsites" className="btn btn-outline">ยกเลิก</Link>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting || nights <= 0}
              >
                {submitting ? '⏳ กำลังจอง...' : '✓ ยืนยันจอง'}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
