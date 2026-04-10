'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewCampsitePage() {
  const router = useRouter();

  const [facilities, setFacilities] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState('');

  const [form, setForm] = useState({
    name:        '',
    type:        'เต็นท์',
    capacity:    '',
    price_night: '',
    image:       '',
    description: '',
    facilities:  [],   // array of facility ids (number)
  });

  // ดึงรายการ facilities ทั้งหมด
  useEffect(() => {
    fetch('/api/facilities')
      .then(r => r.json())
      .then(setFacilities)
      .catch(() => {});
  }, []);

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function toggleFacility(id) {
    setForm(prev => ({
      ...prev,
      facilities: prev.facilities.includes(id)
        ? prev.facilities.filter(f => f !== id)
        : [...prev.facilities, id],
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim())        { setError('กรุณากรอกชื่อที่พัก'); return; }
    if (!form.capacity)           { setError('กรุณากรอกความจุ'); return; }
    if (!form.price_night)        { setError('กรุณากรอกราคา/คืน'); return; }

    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/campsites', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          ...form,
          capacity:    Number(form.capacity),
          price_night: Number(form.price_night),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'เกิดข้อผิดพลาด');
      }
      router.push('/campsites');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page-body">
      <div className="container">

        {/* breadcrumb */}
        <div style={{ marginBottom: 16, fontSize: 13, color: 'var(--text-muted)' }}>
          <Link href="/campsites" style={{ color: 'var(--green-main)' }}>← กลับ</Link>
        </div>

        <div className="page-card">
          <h1 className="page-card-title">เพิ่มที่พักใหม่</h1>

          <form onSubmit={handleSubmit}>

            {/* ชื่อ + ประเภท */}
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="name">ชื่อที่พัก *</label>
                <input
                  id="name"
                  name="name"
                  className="form-input"
                  placeholder="เช่น Zone A — ริมลำธาร"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="type">ประเภท *</label>
                <select
                  id="type"
                  name="type"
                  className="form-input"
                  value={form.type}
                  onChange={handleChange}
                >
                  <option value="เต็นท์">เต็นท์</option>
                  <option value="กระท่อม">กระท่อม</option>
                  <option value="บ้านพัก">บ้านพัก</option>
                </select>
              </div>
            </div>

            {/* ความจุ + ราคา */}
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="capacity">ความจุ (คน) *</label>
                <input
                  id="capacity"
                  name="capacity"
                  type="number"
                  min={1}
                  className="form-input"
                  placeholder="4"
                  value={form.capacity}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="price_night">ราคา/คืน (฿) *</label>
                <input
                  id="price_night"
                  name="price_night"
                  type="number"
                  min={0}
                  className="form-input"
                  placeholder="800"
                  value={form.price_night}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* รูปภาพ URL */}
            <div className="form-group">
              <label className="form-label" htmlFor="image">รูปภาพ URL</label>
              <input
                id="image"
                name="image"
                className="form-input"
                placeholder="https://..."
                value={form.image}
                onChange={handleChange}
              />
              {/* preview */}
              {form.image && (
                <div style={{
                  marginTop: 10, borderRadius: 'var(--radius-md)',
                  overflow: 'hidden', aspectRatio: '4/3',
                  background: 'var(--green-pale)', position: 'relative',
                  maxWidth: 260,
                }}>
                  <img
                    src={form.image}
                    alt="preview"
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div style={{
                    display: 'none', position: 'absolute', inset: 0,
                    alignItems: 'center', justifyContent: 'center',
                    flexDirection: 'column', gap: 4,
                    fontSize: 12, color: 'var(--text-muted)',
                  }}>
                    <span style={{ fontSize: 28 }}>🖼️</span>
                    <span>โหลดรูปไม่ได้</span>
                  </div>
                </div>
              )}
            </div>

            {/* Facilities checkboxes */}
            {facilities.length > 0 && (
              <div className="form-group">
                <label className="form-label">สิ่งอำนวยความสะดวก</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 20px', marginTop: 6 }}>
                  {facilities.map(f => (
                    <label
                      key={f.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        fontSize: 13, cursor: 'pointer', userSelect: 'none',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={form.facilities.includes(f.id)}
                        onChange={() => toggleFacility(f.id)}
                        style={{ accentColor: 'var(--green-main)', width: 15, height: 15 }}
                      />
                      {f.icon} {f.name}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* คำอธิบาย */}
            <div className="form-group">
              <label className="form-label" htmlFor="description">คำอธิบาย</label>
              <textarea
                id="description"
                name="description"
                className="form-input form-textarea"
                placeholder="บรรยากาศริมลำธาร ..."
                value={form.description}
                onChange={handleChange}
              />
            </div>

            {/* error */}
            {error && (
              <p style={{
                color: 'var(--danger)', fontSize: 13,
                background: '#fff5f5', border: '0.5px solid #fcc',
                borderRadius: 'var(--radius-sm)', padding: '8px 12px',
                marginBottom: 14,
              }}>{error}</p>
            )}

            {/* submit */}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
            >
              {submitting ? '⏳ กำลังบันทึก...' : 'บันทึกที่พัก'}
            </button>

          </form>
        </div>

      </div>
    </div>
  );
}
