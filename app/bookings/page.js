'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

/* ── constants ── */
const STATUS_LABELS = {
  pending:   'รอยืนยัน',
  confirmed: 'ยืนยันแล้ว',
  checked_out: 'เช็คเอาต์แล้ว',
  cancelled: 'ยกเลิก',
};

const CAMPSITE_ICON = {
  'เต็นท์':  '⛺',
  'กระท่อม': '🛖',
  'ริมน้ำ':  '🌊',
  'บ้านพัก': '🏠',
};

/* ── helpers ── */
function formatDate(str) {
  if (!str) return '';
  const d = new Date(str);
  const months = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.',
                  'ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

function toInputDate(str) {
  return str ? str.slice(0, 10) : '';
}

function nightsBetween(ci, co) {
  return Math.max(0, Math.round((new Date(co) - new Date(ci)) / 86400000));
}

/* ══════════════════════════════════════ */
export default function BookingsPage() {
  const [bookings,    setBookings]    = useState([]);
  const [revenue,     setRevenue]     = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState('');

  /* Edit modal */
  const [editTarget,  setEditTarget]  = useState(null);
  const [editForm,    setEditForm]    = useState({});
  const [saving,      setSaving]      = useState(false);

  /* Delete confirm modal */
  const [deleteId,    setDeleteId]    = useState(null);
  const [deleting,    setDeleting]    = useState(false);

  async function load() {
    setLoading(true);
    const res  = await fetch('/api/bookings');
    const data = await res.json();
    setBookings(data.bookings || []);
    setRevenue(data.revenue   || 0);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function changeStatus(id, status) {
    await fetch(`/api/bookings/${id}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ status }),
    });
    load();
  }

  /* ── Edit ── */
  function openEdit(b) {
    setEditTarget(b);
    setEditForm({
      guest_name: b.guest_name,
      phone:      b.phone || '',
      check_in:   toInputDate(b.check_in),
      check_out:  toInputDate(b.check_out),
      guests:     b.guests,
      status:     b.status,
    });
  }
  async function saveEdit() {
    setSaving(true);
    await fetch(`/api/bookings/${editTarget.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(editForm),
    });
    setSaving(false);
    setEditTarget(null);
    load();
  }

  /* ── Delete ── */
  async function confirmDelete() {
    setDeleting(true);
    await fetch(`/api/bookings/${deleteId}`, { method: 'DELETE' });
    setDeleting(false);
    setDeleteId(null);
    load();
  }

  /* ── Export CSV ── */
  function exportToCSV() {
    const headers = ['ID', 'ชื่อผู้จอง', 'เบอร์โทร', 'ที่พัก', 'เช็คอิน', 'เช็คเอาท์', 'จำนวนคืน', 'จำนวนคน', 'ยอดรวม (บาท)', 'สถานะ', 'เวลาจอง'];
    const rows = bookings.map(b => {
      const nights = nightsBetween(b.check_in, b.check_out);
      return [
        b.id,
        b.guest_name,
        b.phone || '-',
        b.campsite_name,
        formatDate(b.check_in),
        formatDate(b.check_out),
        nights,
        b.guests,
        b.total,
        STATUS_LABELS[b.status] || b.status,
        new Date(b.created_at).toLocaleString('th-TH')
      ].map(val => `"${String(val).replace(/"/g, '""')}"`);
    });
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `bookings_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /* ── derived ── */
  const filtered = filter
    ? bookings.filter(b => b.status === filter)
    : bookings;

  const pendingCount   = bookings.filter(b => b.status === 'pending').length;
  const confirmedCount = bookings.filter(b => b.status === 'confirmed').length;
  const editNights     = nightsBetween(editForm.check_in, editForm.check_out);

  return (
    <div className="page-body">
      <div className="container">

        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>🧾 การจองทั้งหมด</h1>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-outline btn-sm" onClick={exportToCSV}>
              📥 Export CSV
            </button>
            <Link href="/campsites" className="btn btn-outline btn-sm">🏕️ ดูที่พัก</Link>
          </div>
        </div>

        {/* ── Summary cards (จาก V1) ── */}
        <div className="summary-grid" style={{ marginBottom: 24 }}>
          <div className="summary-card">
            <div className="s-num">{bookings.length}</div>
            <div className="s-label">การจองทั้งหมด</div>
          </div>
          <div className="summary-card">
            <div className="s-num" style={{ color: pendingCount > 0 ? 'var(--accent)' : undefined }}>
              {pendingCount}
            </div>
            <div className="s-label">รอยืนยัน</div>
          </div>
          <div className="summary-card">
            <div className="s-num" style={{ color: 'var(--green-dark)' }}>{confirmedCount}</div>
            <div className="s-label">ยืนยันแล้ว</div>
          </div>
          <div className="summary-card">
            <div className="s-num" style={{ fontSize: 22, color: 'var(--green-dark)' }}>
              ฿{Number(revenue).toLocaleString()}
            </div>
            <div className="s-label">รายได้รวม</div>
          </div>
        </div>

        {/* ── Filter chips ── */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {[
            { val: '',           label: 'ทั้งหมด' },
            { val: 'confirmed',  label: '✓ ยืนยันแล้ว' },
            { val: 'pending',    label: '⏳ รอยืนยัน' },
            { val: 'checked_out', label: '🚪 เช็คเอาต์แล้ว' },
            { val: 'cancelled',  label: '✗ ยกเลิก' },
          ].map(({ val, label }) => (
            <button key={val}
              className={`filter-chip${filter === val ? ' active' : ''}`}
              onClick={() => setFilter(val)}>
              {label}
            </button>
          ))}
        </div>

        {/* ── Booking list ── */}
        {loading ? (
          <p style={{ textAlign: 'center', padding: '2rem' }}>⏳ กำลังโหลด...</p>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: 48, marginBottom: 8 }}>🧾</div>
            <p style={{ color: 'var(--text-muted)' }}>ไม่มีรายการจอง</p>
          </div>
        ) : (
          <div>
            {filtered.map(b => {
              const nights = nightsBetween(b.check_in, b.check_out);
              const icon   = CAMPSITE_ICON[b.type] || '⛺';
              return (
                <div key={b.id} className="booking-row" style={{ gap: 12, flexWrap: 'wrap' }}>

                  {/* icon วงกลม (จาก V2) */}
                  <div style={{
                    width: 44, height: 44, borderRadius: 10,
                    background: 'var(--green-bg)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: 24, flexShrink: 0,
                  }}>
                    {icon}
                  </div>

                  {/* info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>
                      {b.guest_name}
                      {b.phone && (
                        <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 12 }}>
                          {' '}· {b.phone}
                        </span>
                      )}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {b.campsite_name}
                      {' · '}
                      {formatDate(b.check_in)} → {formatDate(b.check_out)}
                      {nights > 0 && ` (${nights} คืน)`}
                      {' · '}{b.guests} คน
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      เวลาจอง: {new Date(b.created_at).toLocaleString('th-TH')}
                    </p>
                  </div>

                  {/* ราคา */}
                  <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--green-dark)', whiteSpace: 'nowrap' }}>
                    ฿{Number(b.total).toLocaleString()}
                  </span>

                  {/* badge + dropdown เปลี่ยนสถานะด่วน (จาก V1) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className={`badge badge-${b.status}`}>
                      {STATUS_LABELS[b.status]}
                    </span>
                    <select
                      value={b.status}
                      onChange={e => changeStatus(b.id, e.target.value)}
                      style={{
                        fontSize: 11, padding: '3px 6px',
                        border: '1px solid var(--border)',
                        borderRadius: 6, background: 'var(--white)',
                        cursor: 'pointer', color: 'var(--text-muted)',
                      }}>
                      <option value="pending">รอยืนยัน</option>
                      <option value="confirmed">ยืนยันแล้ว</option>
                      <option value="checked_out">เช็คเอาต์แล้ว</option>
                      <option value="cancelled">ยกเลิก</option>
                    </select>
                  </div>

                  {/* Edit + Delete */}
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-outline btn-sm" onClick={() => openEdit(b)}>
                      ✏️ แก้ไข
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(b.id)}>
                      🗑 ลบ
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* ══ Edit Modal ══ */}
      {editTarget && (
        <div className="modal-overlay" onClick={() => setEditTarget(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600 }}>✏️ แก้ไขการจอง</h2>
              <button onClick={() => setEditTarget(null)}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-muted)' }}>×</button>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
              {editTarget.campsite_name}
            </p>

            {/* ชื่อ + เบอร์ */}
            <div className="form-grid-2" style={{ marginBottom: 12 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">ชื่อผู้จอง</label>
                <input className="form-input"
                  maxLength={50} value={editForm.guest_name}
                  onChange={e => setEditForm(f => ({ ...f, guest_name: e.target.value }))} />
                <p style={{ fontSize: 11, color: (editForm.guest_name?.length || 0) > 45 ? 'var(--danger)' : 'var(--text-muted)', textAlign: 'right', marginTop: 3 }}>
                  {editForm.guest_name?.length || 0}/50
                </p>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">เบอร์โทร</label>
                <input className="form-input"
                  inputMode="numeric" maxLength={10}
                  placeholder="0xxxxxxxxx"
                  value={editForm.phone}
                  onChange={e => setEditForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, '') }))} />
                <p style={{ fontSize: 11, color: (editForm.phone?.length || 0) === 10 ? 'var(--green-dark)' : 'var(--text-muted)', textAlign: 'right', marginTop: 3 }}>
                  {editForm.phone?.length || 0}/10
                </p>
              </div>
            </div>

            {/* วันที่ + จำนวนคน */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">เช็คอิน</label>
                <input type="date" className="form-input" value={editForm.check_in}
                  onChange={e => setEditForm(f => ({ ...f, check_in: e.target.value }))} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">เช็คเอาท์</label>
                <input type="date" className="form-input" value={editForm.check_out}
                  onChange={e => setEditForm(f => ({ ...f, check_out: e.target.value }))} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">จำนวนคน</label>
                <input type="number" min={1} className="form-input" value={editForm.guests}
                  onChange={e => setEditForm(f => ({ ...f, guests: e.target.value }))} />
              </div>
            </div>

            {/* สถานะ */}
            <div className="form-group">
              <label className="form-label">สถานะ</label>
              <select className="form-select" value={editForm.status}
                onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}>
                <option value="pending">รอยืนยัน</option>
                <option value="confirmed">ยืนยันแล้ว</option>
                <option value="checked_out">เช็คเอาต์แล้ว</option>
                <option value="cancelled">ยกเลิก</option>
              </select>
            </div>

            {/* สรุปราคา */}
            {editNights > 0 && (
              <div className="price-calc" style={{ marginBottom: 16 }}>
                <span>{editNights} คืน × ฿{Number(editTarget.price_night).toLocaleString()}</span>
                <span className="total">
                  ฿{(editNights * Number(editTarget.price_night)).toLocaleString()}
                </span>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setEditTarget(null)}>ยกเลิก</button>
              <button className="btn btn-primary" onClick={saveEdit} disabled={saving}>
                {saving ? 'กำลังบันทึก...' : '💾 บันทึก'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ══ Delete Confirm Modal ══ */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal-box" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🗑️</div>
              <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>ยืนยันการลบ</h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                ต้องการลบรายการจองนี้ใช่หรือไม่?<br />การกระทำนี้ไม่สามารถย้อนกลับได้
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn btn-outline" onClick={() => setDeleteId(null)}>ยกเลิก</button>
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
