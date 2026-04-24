'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function EditCampsitePage() {
  const { id }  = useParams();
  const router  = useRouter();

  const [facilities,   setFacilities]   = useState([]);
  const [selectedFacs, setSelectedFacs] = useState([]);
  const [form,         setForm]         = useState(null);
  const [submitting,   setSubmitting]   = useState(false);
  const [error,        setError]        = useState('');

  /* โหลด facilities + ข้อมูลเดิมพร้อมกัน (จาก V1 — Promise.all) */
  useEffect(() => {
    Promise.all([
      fetch('/api/facilities').then(r => r.json()),
      fetch(`/api/campsites/${id}`).then(r => r.json()),
    ]).then(([facs, site]) => {
      setFacilities(facs);
      setForm({
        name:        site.name        ?? '',
        type:        site.type        ?? 'เต็นท์',
        capacity:    site.capacity    ?? 1,
        price_night: site.price_night ?? '',
        image:       site.image       ?? '',
        description: site.description ?? '',
        status:      site.status      ?? 'available',
      });
      /* prefill facilities ที่เลือกอยู่ (จาก V1) */
      const ids = site.fac_ids
        ? site.fac_ids.split(',').map(Number)
        : [];
      setSelectedFacs(ids);
    }).catch(() => {});
  }, [id]);

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  /* Pill toggle (จาก V1) */
  function toggleFac(fid) {
    setSelectedFacs(prev =>
      prev.includes(fid) ? prev.filter(x => x !== fid) : [...prev, fid]
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim())  return setError('กรุณากรอกชื่อที่พัก');
    if (!form.capacity)     return setError('กรุณากรอกความจุ');
    if (!form.price_night)  return setError('กรุณากรอกราคา/คืน');

    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(`/api/campsites/${id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          ...form,
          capacity:    Number(form.capacity),
          price_night: Number(form.price_night),
          facilities:  selectedFacs,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'เกิดข้อผิดพลาด');
      }
      router.push(`/campsites/${id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!form) return (
    <p style={{ textAlign: 'center', padding: '3rem' }}>⏳ กำลังโหลด...</p>
  );

  return (
    <div className="page-body">
      <div className="container">

        {/* breadcrumb */}
        <div style={{ marginBottom: 16, fontSize: 13, color: 'var(--text-muted)' }}>
          <Link href={`/campsites/${id}`} style={{ color: 'var(--green)' }}>← ยกเลิกและกลับ</Link>
        </div>

        <div className="page-card">
          <h1 className="page-card-title">✏️ แก้ไขที่พัก</h1>

          <form onSubmit={handleSubmit}>

            {/* ชื่อ + ประเภท */}
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="name">ชื่อที่พัก *</label>
                <input id="name" name="name" className="form-input"
                  value={form.name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="type">ประเภท *</label>
                <select id="type" name="type" className="form-select"
                  value={form.type} onChange={handleChange}>
                  {['เต็นท์', 'กระท่อม', 'ริมน้ำ', 'บ้านพัก'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* ความจุ + ราคา + สถานะ */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div className="form-group">
                <label className="form-label" htmlFor="capacity">ความจุ (คน) *</label>
                <input id="capacity" name="capacity" type="number" min={1}
                  className="form-input"
                  value={form.capacity} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="price_night">ราคา/คืน (฿) *</label>
                <input id="price_night" name="price_night" type="number" min={0}
                  className="form-input"
                  value={form.price_night} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="status">สถานะ</label>
                <select id="status" name="status" className="form-select"
                  value={form.status} onChange={handleChange}>
                  <option value="available">ว่าง</option>
                  <option value="full">เต็ม</option>
                </select>
              </div>
            </div>

            {/* รูปภาพ URL + preview (ratio 4:3 + error fallback) */}
            <div className="form-group">
              <label className="form-label" htmlFor="image">รูปภาพ URL</label>
              <input id="image" name="image" className="form-input"
                placeholder="https://..."
                value={form.image} onChange={handleChange} />
              {form.image && (
                <div style={{
                  marginTop: 10, borderRadius: 10, overflow: 'hidden',
                  aspectRatio: '4/3', background: 'var(--green-bg)',
                  position: 'relative', maxWidth: 260,
                }}>
                  <img src={form.image} alt="preview"
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextSibling.style.display = 'flex';
                    }} />
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

            {/* Facilities — pill button style */}
            {facilities.length > 0 && (
              <div className="form-group">
                <label className="form-label">สิ่งอำนวยความสะดวก</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                  {facilities.map(f => {
                    const active = selectedFacs.includes(f.id);
                    return (
                      <label key={f.id} style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        fontSize: 13, cursor: 'pointer', userSelect: 'none',
                        padding: '6px 14px', borderRadius: 20,
                        border: '1.5px solid',
                        background:  active ? '#1B5E20' : 'var(--white)',
                        borderColor: active ? '#1B5E20' : 'var(--border)',
                        color:       active ? '#ffffff'  : 'var(--text-muted)',
                        boxShadow:   active ? '0 2px 8px rgba(27,94,32,0.35)' : 'none',
                        fontWeight:  active ? 600 : 400,
                        transition: 'all 0.15s',
                      }}>
                        <input type="checkbox" style={{ display: 'none' }}
                          checked={active} onChange={() => toggleFac(f.id)} />
                        {f.icon} {f.name}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* คำอธิบาย */}
            <div className="form-group">
              <label className="form-label" htmlFor="description">คำอธิบาย</label>
              <textarea id="description" name="description"
                className="form-input form-textarea"
                placeholder="บรรยากาศริมลำธาร เงียบสงบ ..."
                value={form.description} onChange={handleChange} />
            </div>

            {/* Error */}
            {error && (
              <p style={{
                color: 'var(--danger)', fontSize: 13,
                background: '#fff5f5', border: '1px solid #fcc',
                borderRadius: 8, padding: '8px 12px', marginBottom: 14,
              }}>{error}</p>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10 }}>
              <Link href={`/campsites/${id}`} className="btn btn-outline">ยกเลิก</Link>
              <button type="submit" className="btn btn-primary"
                disabled={submitting}
                style={{ flex: 1, justifyContent: 'center' }}>
                {submitting ? '⏳ กำลังบันทึก...' : '💾 บันทึกการแก้ไข'}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}
