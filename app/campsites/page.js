'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

/* ── helper functions (จาก V1) ── */
function typeIcon(type) {
  const icons = { 'เต็นท์': '⛺', 'กระท่อม': '🛖', 'ริมน้ำ': '🌊', 'บ้านพัก': '🏠' };
  return <span style={{ fontSize: 48 }}>{icons[type] || '🏕️'}</span>;
}
function imgBg(type) {
  const bgs = { 'เต็นท์': '#E8F5E9', 'กระท่อม': '#FFF8E1', 'ริมน้ำ': '#E3F2FD', 'บ้านพัก': '#FCE4EC' };
  return bgs[type] || '#f0f4ec';
}

export default function CampsitesPage() {
  const [campsites,    setCampsites]    = useState([]);
  const [search,       setSearch]       = useState('');
  const [filter,       setFilter]       = useState('ทั้งหมด');
  const [loading,      setLoading]      = useState(true);

  /* Edit modal */
  const [editTarget, setEditTarget] = useState(null);
  const [editForm,   setEditForm]   = useState({});
  const [saving,     setSaving]     = useState(false);

  /* Delete confirm */
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting,     setDeleting]     = useState(false);

  const types = ['ทั้งหมด', 'เต็นท์', 'กระท่อม', 'ริมน้ำ', 'บ้านพัก'];

  function load() {
    fetch('/api/campsites')
      .then(r => r.json())
      .then(data => { setCampsites(data); setLoading(false); })
      .catch(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  const filtered = campsites.filter(c => {
    const matchType   = filter === 'ทั้งหมด' || c.type === filter;
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  /* summary */
  const total     = campsites.length;
  const available = campsites.filter(c => c.status === 'available').length;
  const full      = total - available;

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

  if (loading) return <p style={{ textAlign: 'center', padding: '3rem' }}>⏳ กำลังโหลด...</p>;

  return (
    <div>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>🏕️ ที่พักทั้งหมด</h1>
        <Link href="/campsites/new" className="btn btn-primary">+ เพิ่มที่พัก</Link>
      </div>

      {/* ── Summary cards ── */}
      <div className="summary-grid">
        <div className="summary-card">
          <div className="s-num">{total}</div>
          <div className="s-label">ที่พักทั้งหมด</div>
        </div>
        <div className="summary-card">
          <div className="s-num">{available}</div>
          <div className="s-label">ว่างอยู่</div>
        </div>
        <div className="summary-card">
          <div className="s-num" style={{ color: full > 0 ? 'var(--accent)' : undefined }}>{full}</div>
          <div className="s-label">เต็มแล้ว</div>
        </div>
      </div>

      {/* ── Filter + Search (chip buttons จาก V1) ── */}
      <div className="filter-bar">
        <input
          className="form-input"
          style={{ maxWidth: 240 }}
          placeholder="🔍 ค้นหาชื่อที่พัก..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {types.map(t => (
          <button
            key={t}
            className={`filter-chip ${filter === t ? 'active' : ''}`}
            onClick={() => setFilter(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Campsite Grid ── */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: 48, marginBottom: 8 }}>🏕️</div>
          <p style={{ color: 'var(--text-muted)' }}>ไม่พบที่พักที่ค้นหา</p>
        </div>
      ) : (
        <div className="campsite-grid">
          {filtered.map(item => (
            <div key={item.id} style={{ position: 'relative' }}>

              <Link href={`/campsites/${item.id}`} className="campsite-card" style={{ display: 'block', textDecoration: 'none' }}>
                {/* รูปภาพ + ไอคอนตามประเภท (จาก V1) */}
                <div className="campsite-card-img" style={{ background: imgBg(item.type) }}>
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : typeIcon(item.type)}
                  <span className={`campsite-status ${item.status}`}>
                    {item.status === 'available' ? 'ว่าง' : 'เต็ม'}
                  </span>
                </div>

                <div className="campsite-card-body">
                  <p className="campsite-name">{item.name}</p>
                  <p className="campsite-meta">
                    รับได้ {item.capacity} คน
                    {item.facility_icons && ' · ' + item.facility_icons}
                  </p>
                  <div className="campsite-footer">
                    <span className="campsite-price">฿{Number(item.price_night).toLocaleString()}/คืน</span>
                    <span className="type-badge">{item.type}</span>
                  </div>
                </div>
              </Link>

            </div>
          ))}
        </div>
      )}

      {/* ══ Edit Modal ══ */}
      {editTarget && (
        <div className="modal-overlay" onClick={() => setEditTarget(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600 }}>✏️ แก้ไขที่พัก</h2>
              <button onClick={() => setEditTarget(null)}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-muted)' }}>×</button>
            </div>

            <div className="form-grid-2" style={{ marginBottom: 12 }}>
              <div className="form-group">
                <label className="form-label">ชื่อที่พัก</label>
                <input className="form-input" value={editForm.name}
                  onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">ประเภท</label>
                <select className="form-select" value={editForm.type}
                  onChange={e => setEditForm(f => ({ ...f, type: e.target.value }))}>
                  {['เต็นท์', 'กระท่อม', 'ริมน้ำ', 'บ้านพัก'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div className="form-group">
                <label className="form-label">ความจุ (คน)</label>
                <input type="number" min={1} className="form-input" value={editForm.capacity}
                  onChange={e => setEditForm(f => ({ ...f, capacity: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">ราคา/คืน (฿)</label>
                <input type="number" min={0} className="form-input" value={editForm.price_night}
                  onChange={e => setEditForm(f => ({ ...f, price_night: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">สถานะ</label>
                <select className="form-select" value={editForm.status}
                  onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="available">ว่าง</option>
                  <option value="full">เต็ม</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">รูปภาพ URL</label>
              <input className="form-input" placeholder="https://..." value={editForm.image}
                onChange={e => setEditForm(f => ({ ...f, image: e.target.value }))} />
              {editForm.image && (
                <img src={editForm.image} alt="preview"
                  style={{ marginTop: 8, height: 80, borderRadius: 8, objectFit: 'cover' }}
                  onError={e => { e.currentTarget.style.display = 'none'; }} />
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setEditTarget(null)}>ยกเลิก</button>
              <button className="btn btn-primary" onClick={saveEdit} disabled={saving}>
                {saving ? 'กำลังบันทึก...' : '💾 บันทึก'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ══ Delete Confirm ══ */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal-box" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🏕️</div>
              <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>ยืนยันการลบที่พัก</h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                ต้องการลบ <strong>"{deleteTarget.name}"</strong> ใช่หรือไม่?
                <br />การจองที่เกี่ยวข้องจะถูกลบออกด้วย
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn btn-outline" onClick={() => setDeleteTarget(null)}>ยกเลิก</button>
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
