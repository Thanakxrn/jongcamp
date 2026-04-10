'use client';
import { useEffect, useState } from 'react';

const STATUS_LABEL = {
  pending:   'pending',
  confirmed: 'confirmed',
  cancelled: 'cancelled',
};

const CAMPSITE_ICON = {
  'เต็นท์':   '⛺',
  'กระท่อม':  '🏠',
  'บ้านพัก':  '🏡',
};

function toInputDate(str) {
  if (!str) return '';
  return str.slice(0, 10);
}

function formatDate(str) {
  if (!str) return '';
  const d = new Date(str);
  return `${d.getDate()} ${['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.',
    'ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'][d.getMonth()]}`;
}

function nightsBetween(ci, co) {
  return Math.max(0, Math.round((new Date(co) - new Date(ci)) / 86400000));
}

export default function BookingsPage() {
  const [bookings,    setBookings]    = useState([]);
  const [revenue,     setRevenue]     = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState('');

  // Edit modal state
  const [editTarget,  setEditTarget]  = useState(null);   // booking object
  const [editForm,    setEditForm]    = useState({});
  const [saving,      setSaving]      = useState(false);

  // Delete confirm state
  const [deleteId,    setDeleteId]    = useState(null);
  const [deleting,    setDeleting]    = useState(false);

  async function load() {
    setLoading(true);
    const res  = await fetch('/api/bookings');
    const data = await res.json();
    setBookings(data.bookings || []);
    setRevenue(data.revenue  || 0);
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

  const filtered = filter
    ? bookings.filter(b => b.status === filter)
    : bookings;

  const editNights = nightsBetween(editForm.check_in, editForm.check_out);

  return (
    <div className="page-body">
      <div className="container">

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h1 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-main)' }}>
            การจองทั้งหมด
          </h1>
          <span style={{ fontSize: 14, color: 'var(--text-sub)' }}>
            รายได้รวม:{' '}
            <strong style={{ color: 'var(--green-main)', fontSize: 16 }}>
              ฿{Number(revenue).toLocaleString()}
            </strong>
          </span>
        </div>

        {/* Filter chips */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {[
            { val: '',           label: 'ทั้งหมด' },
            { val: 'confirmed',  label: '✓ confirmed' },
            { val: 'pending',    label: '⏳ pending' },
            { val: 'cancelled',  label: '✗ cancelled' },
          ].map(({ val, label }) => (
            <button
              key={val}
              className={`filter-chip${filter === val ? ' active' : ''}`}
              onClick={() => setFilter(val)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Booking list */}
        {loading ? (
          <p className="loading-text">⏳ กำลังโหลด...</p>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🧾</div>
            <p>ไม่มีรายการจอง</p>
          </div>
        ) : (
          <div>
            {filtered.map(b => {
              const nights = nightsBetween(b.check_in, b.check_out);
              const icon   = CAMPSITE_ICON[b.type] || '⛺';
              return (
                <div key={b.id} className="booking-row" style={{ gap: 12, flexWrap: 'wrap' }}>

                  {/* icon */}
                  <div style={{
                    width: 40, height: 40, borderRadius: 'var(--radius-md)',
                    background: 'var(--green-pale)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, flexShrink: 0,
                  }}>
                    {icon}
                  </div>

                  {/* info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-main)', marginBottom: 2 }}>
                      {b.guest_name}
                      <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
                        {' '}· {b.campsite_name}
                      </span>
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {formatDate(b.check_in)}–{formatDate(b.check_out)} · {b.guests} คน
                      {nights > 0 && ` · ${nights} คืน`}
                    </p>
                  </div>

                  {/* price */}
                  <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                    ฿{Number(b.total).toLocaleString()}
                  </span>

                  {/* status badge + dropdown */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className={`badge badge-${b.status}`}>
                      {STATUS_LABEL[b.status] || b.status}
                    </span>

                    <select
                      value={b.status}
                      onChange={e => changeStatus(b.id, e.target.value)}
                      style={{
                        fontSize: 11, padding: '3px 6px',
                        border: '0.5px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--white)',
                        color: 'var(--text-sub)',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="pending">pending</option>
                      <option value="confirmed">confirmed</option>
                      <option value="cancelled">cancelled</option>
                    </select>
                  </div>

                  {/* ── Edit / Delete buttons ── */}
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => openEdit(b)}
                      title="แก้ไข"
                    >
                      ✏️ แก้ไข
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => setDeleteId(b.id)}
                      title="ลบ"
                    >
                      🗑 ลบ
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* ══════════ Edit Modal ══════════ */}
      {editTarget && (
        <div className="modal-overlay" onClick={() => setEditTarget(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-main)' }}>
                ✏️ แก้ไขการจอง
              </h2>
              <button
                onClick={() => setEditTarget(null)}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-muted)', lineHeight: 1 }}
              >×</button>
            </div>

            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
              {editTarget.campsite_name}
            </p>

            {/* Name + Phone */}
            <div className="form-grid-2" style={{ marginBottom: 12 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">ชื่อผู้จอง</label>
                <input
                  className="form-input"
                  value={editForm.guest_name}
                  onChange={e => setEditForm(f => ({ ...f, guest_name: e.target.value }))}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">เบอร์โทร</label>
                <input
                  className="form-input"
                  value={editForm.phone}
                  onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                />
              </div>
            </div>

            {/* Check-in / Check-out / Guests */}
            <div className="form-grid-3" style={{ marginBottom: 12 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">เช็คอิน</label>
                <input
                  type="date"
                  className="form-input"
                  value={editForm.check_in}
                  onChange={e => setEditForm(f => ({ ...f, check_in: e.target.value }))}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">เช็คเอาท์</label>
                <input
                  type="date"
                  className="form-input"
                  value={editForm.check_out}
                  onChange={e => setEditForm(f => ({ ...f, check_out: e.target.value }))}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">จำนวนคน</label>
                <input
                  type="number"
                  min={1}
                  className="form-input"
                  value={editForm.guests}
                  onChange={e => setEditForm(f => ({ ...f, guests: e.target.value }))}
                />
              </div>
            </div>

            {/* Status */}
            <div className="form-group">
              <label className="form-label">สถานะ</label>
              <select
                className="form-select"
                value={editForm.status}
                onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
              >
                <option value="pending">pending</option>
                <option value="confirmed">confirmed</option>
                <option value="cancelled">cancelled</option>
              </select>
            </div>

            {/* Summary */}
            {editNights > 0 && (
              <div style={{
                background: 'var(--green-pale)', borderRadius: 'var(--radius-md)',
                padding: '10px 14px', fontSize: 13, color: 'var(--text-sub)',
                marginBottom: 16,
              }}>
                {editNights} คืน × ฿{Number(editTarget.price_night).toLocaleString()} ={' '}
                <strong style={{ color: 'var(--green-main)' }}>
                  ฿{(editNights * Number(editTarget.price_night)).toLocaleString()}
                </strong>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                className="btn btn-outline"
                onClick={() => setEditTarget(null)}
              >ยกเลิก</button>
              <button
                className="btn btn-primary"
                onClick={saveEdit}
                disabled={saving}
              >
                {saving ? 'กำลังบันทึก...' : '💾 บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ Delete Confirm Dialog ══════════ */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal-box" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🗑️</div>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-main)', marginBottom: 8 }}>
                ยืนยันการลบ
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                คุณต้องการลบรายการจองนี้ใช่หรือไม่?<br />การกระทำนี้ไม่สามารถย้อนกลับได้
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                className="btn btn-outline"
                onClick={() => setDeleteId(null)}
              >ยกเลิก</button>
              <button
                className="btn btn-danger"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? 'กำลังลบ...' : '🗑 ลบเลย'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
