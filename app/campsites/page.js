'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function CampsitesPage() {
  const [campsites,  setCampsites]  = useState([]);
  const [search,     setSearch]     = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading,    setLoading]    = useState(true);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, name }
  const [deleting,     setDeleting]     = useState(false);

  // Edit modal
  const [editTarget, setEditTarget] = useState(null);
  const [editForm,   setEditForm]   = useState({});
  const [saving,     setSaving]     = useState(false);

  function load() {
    const params = new URLSearchParams();
    if (typeFilter) params.set('type', typeFilter);
    fetch(`/api/campsites?${params}`)
      .then(r => r.json())
      .then(data => { setCampsites(data); setLoading(false); })
      .catch(() => setLoading(false));
  }

  useEffect(() => { load(); }, [typeFilter]);

  const filtered = campsites.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  /* ── Delete ── */
  async function confirmDelete() {
    setDeleting(true);
    await fetch(`/api/campsites/${deleteTarget.id}`, { method: 'DELETE' });
    setDeleting(false);
    setDeleteTarget(null);
    load();
  }

  /* ── Edit ── */
  function openEdit(item) {
    setEditTarget(item);
    setEditForm({
      name:        item.name,
      type:        item.type,
      capacity:    item.capacity,
      price_night: item.price_night,
      image:       item.image || '',
      status:      item.status,
    });
  }

  async function saveEdit() {
    setSaving(true);
    await fetch(`/api/campsites/${editTarget.id}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        ...editForm,
        capacity:    Number(editForm.capacity),
        price_night: Number(editForm.price_night),
      }),
    });
    setSaving(false);
    setEditTarget(null);
    load();
  }

  return (
    <div>

      {/* filter bar */}
      <div className="filter-bar">
        <input
          className="form-input"
          placeholder="🔍 ค้นหาชื่อที่พัก..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="form-input"
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          style={{ maxWidth: 160 }}
        >
          <option value="">ทุกประเภท</option>
          <option value="เต็นท์">เต็นท์</option>
          <option value="กระท่อม">กระท่อม</option>
          <option value="บ้านพัก">บ้านพัก</option>
        </select>
        <Link href="/campsites/new" className="btn btn-primary">
          + เพิ่มที่พัก
        </Link>
      </div>

      {/* summary cards */}
      <div className="summary-grid">
        <div className="summary-card">
          <div className="s-num">{campsites.length}</div>
          <div className="s-label">ที่พักทั้งหมด</div>
        </div>
        <div className="summary-card">
          <div className="s-num">
            {campsites.filter(c => c.status === 'available').length}
          </div>
          <div className="s-label">ว่างอยู่</div>
        </div>
        <div className="summary-card">
          <div className="s-num">
            {campsites.filter(c => c.status === 'full').length}
          </div>
          <div className="s-label">เต็มแล้ว</div>
        </div>
      </div>

      {/* campsite grid */}
      {loading ? (
        <p style={{ textAlign: 'center', padding: '2rem' }}>⏳ กำลังโหลด...</p>
      ) : filtered.length === 0 ? (
        <p style={{ textAlign: 'center', padding: '2rem' }}>ไม่พบที่พัก</p>
      ) : (
        <div className="campsite-grid">
          {filtered.map(item => (
            <div key={item.id} style={{ position: 'relative' }}>

              {/* ── Edit + Delete buttons ── */}
              <div style={{
                position: 'absolute', top: 8, left: 8, zIndex: 10,
                display: 'flex', gap: 4,
              }}>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={e => { e.stopPropagation(); openEdit(item); }}
                  style={{
                    padding: '4px 10px', fontSize: 12,
                    background: 'rgba(255,255,255,0.92)',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                  }}
                  title="แก้ไขที่พัก"
                >
                  ✏️ แก้ไข
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={e => { e.stopPropagation(); setDeleteTarget({ id: item.id, name: item.name }); }}
                  style={{ padding: '4px 10px', fontSize: 12, boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}
                  title="ลบที่พัก"
                >
                  🗑 ลบ
                </button>
              </div>

              <Link
                href={`/campsites/${item.id}/book`}
                className="campsite-card"
                style={{ display: 'block', textDecoration: 'none' }}
              >
                <div className="campsite-card-img">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : (
                    <span style={{ fontSize: 48 }}>⛺</span>
                  )}
                  <span className={`campsite-status ${item.status}`}>
                    {item.status === 'available' ? 'ว่าง' : 'เต็ม'}
                  </span>
                </div>
                <div className="campsite-card-body">
                  <p className="campsite-name">{item.name}</p>
                  <p className="campsite-meta">รับได้ {item.capacity} คน</p>
                  {item.facility_icons && (
                    <p className="campsite-meta">{item.facility_icons}</p>
                  )}
                  <div className="campsite-footer">
                    <span className="campsite-price">
                      ฿{Number(item.price_night).toLocaleString()}/คืน
                    </span>
                    <span className="type-badge">{item.type}</span>
                  </div>
                </div>
              </Link>

            </div>
          ))}
        </div>
      )}

      {/* ══════════ Edit Modal ══════════ */}
      {editTarget && (
        <div className="modal-overlay" onClick={() => setEditTarget(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-main)' }}>
                ✏️ แก้ไขที่พัก
              </h2>
              <button
                onClick={() => setEditTarget(null)}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-muted)', lineHeight: 1 }}
              >×</button>
            </div>

            {/* ชื่อ + ประเภท */}
            <div className="form-grid-2" style={{ marginBottom: 12 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">ชื่อที่พัก</label>
                <input
                  className="form-input"
                  value={editForm.name}
                  onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">ประเภท</label>
                <select
                  className="form-select"
                  value={editForm.type}
                  onChange={e => setEditForm(f => ({ ...f, type: e.target.value }))}
                >
                  <option value="เต็นท์">เต็นท์</option>
                  <option value="กระท่อม">กระท่อม</option>
                  <option value="บ้านพัก">บ้านพัก</option>
                </select>
              </div>
            </div>

            {/* ความจุ + ราคา + สถานะ */}
            <div className="form-grid-3" style={{ marginBottom: 12 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">ความจุ (คน)</label>
                <input
                  type="number" min={1}
                  className="form-input"
                  value={editForm.capacity}
                  onChange={e => setEditForm(f => ({ ...f, capacity: e.target.value }))}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">ราคา/คืน (฿)</label>
                <input
                  type="number" min={0}
                  className="form-input"
                  value={editForm.price_night}
                  onChange={e => setEditForm(f => ({ ...f, price_night: e.target.value }))}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">สถานะ</label>
                <select
                  className="form-select"
                  value={editForm.status}
                  onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                >
                  <option value="available">ว่าง</option>
                  <option value="full">เต็ม</option>
                </select>
              </div>
            </div>

            {/* รูปภาพ URL + preview */}
            <div className="form-group">
              <label className="form-label">รูปภาพ URL</label>
              <input
                className="form-input"
                placeholder="https://..."
                value={editForm.image}
                onChange={e => setEditForm(f => ({ ...f, image: e.target.value }))}
              />
              {editForm.image && (
                <div style={{
                  marginTop: 10, borderRadius: 'var(--radius-md)',
                  overflow: 'hidden', aspectRatio: '4/3',
                  background: 'var(--green-pale)', position: 'relative',
                  maxWidth: 200,
                }}>
                  <img
                    src={editForm.image}
                    alt="preview"
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => { e.currentTarget.style.display = 'none'; }}
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
              <button className="btn btn-outline" onClick={() => setEditTarget(null)}>
                ยกเลิก
              </button>
              <button className="btn btn-primary" onClick={saveEdit} disabled={saving}>
                {saving ? 'กำลังบันทึก...' : '💾 บันทึก'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ══════════ Delete Confirm Dialog ══════════ */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal-box" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🏕️</div>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-main)', marginBottom: 8 }}>
                ยืนยันการลบที่พัก
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                ต้องการลบ <strong style={{ color: 'var(--text-main)' }}>"{deleteTarget.name}"</strong> ใช่หรือไม่?
                <br />การจองที่เกี่ยวข้องจะถูกลบออกด้วย
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn btn-outline" onClick={() => setDeleteTarget(null)}>
                ยกเลิก
              </button>
              <button className="btn btn-danger" onClick={confirmDelete} disabled={deleting}>
                {deleting ? 'กำลังลบ...' : '🗑 ลบเลย'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
