import { NextResponse } from 'next/server';
import { mysqlPool } from '@/utils/db';

export async function GET() {
<<<<<<< HEAD
  try {
    const pool = mysqlPool.promise();

    // 1. จำนวนการจองทั้งหมด
    const [totalRows] = await pool.query('SELECT COUNT(*) as count FROM bookings');

    // 2. แยกตามสถานะ
    const [statusRows] = await pool.query('SELECT status, COUNT(*) as count FROM bookings GROUP BY status');

    // 3. รายได้รวม (เฉพาะที่ยืนยันแล้ว)
    const [revenueRows] = await pool.query('SELECT SUM(total) as total FROM bookings WHERE status = "confirmed"');

    // 4. การจองล่าสุด 5 รายการ
    const [recentRows] = await pool.query(`
      SELECT b.*, c.name as campsite_name 
      FROM bookings b 
      JOIN campsites c ON b.campsite_id = c.id 
      ORDER BY b.created_at DESC 
      LIMIT 5
    `);

    const stats = {
      total: totalRows[0].count,
      pending: statusRows.find(s => s.status === 'pending')?.count || 0,
      confirmed: statusRows.find(s => s.status === 'confirmed')?.count || 0,
      cancelled: statusRows.find(s => s.status === 'cancelled')?.count || 0,
      revenue: revenueRows[0].total || 0,
      recent: recentRows
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Dashboard API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
=======
  const pool = mysqlPool.promise();

  // ── Auto-checkout ──────────────────────────────────────────────
  // ดึง booking ที่ confirmed และ check_out < วันนี้
  const [expiredBookings] = await pool.query(`
    SELECT id, campsite_id FROM bookings
    WHERE status = 'confirmed'
      AND check_out < CURDATE()
  `);

  // อัปเดตทีละรายการ (หรือจะใช้ IN ก็ได้ถ้าเยอะ)
  if (expiredBookings.length > 0) {
    const ids        = expiredBookings.map(b => b.id);
    const campsiteIds = [...new Set(expiredBookings.map(b => b.campsite_id))];

    // เปลี่ยน booking → checked_out
    await pool.query(
      `UPDATE bookings SET status = 'checked_out' WHERE id IN (?)`,
      [ids]
    );

    // คืนสถานะ campsite → available
    // (เช็คก่อนว่าไม่มี booking confirmed อื่นอยู่)
    for (const csId of campsiteIds) {
      const [active] = await pool.query(
        `SELECT COUNT(*) AS cnt FROM bookings
         WHERE campsite_id = ? AND status = 'confirmed'`,
        [csId]
      );
      if (active[0].cnt === 0) {
        await pool.query(
          `UPDATE campsites SET status = 'available' WHERE id = ?`,
          [csId]
        );
      }
    }
  }
  // ───────────────────────────────────────────────────────────────

  // รัน query ทั้งหมดพร้อมกันด้วย Promise.all
  const [
    [summary],
    topCampsites,
    recentBookings,
    monthlyRevenue,
  ] = await Promise.all([

    // 1. สรุปตัวเลขหลัก
    pool.query(`
      SELECT
        (SELECT COUNT(*) FROM campsites)  AS total_campsites,
        (SELECT COUNT(*) FROM bookings)   AS total_bookings,
        (SELECT COUNT(*) FROM bookings
          WHERE status = 'pending')        AS pending_bookings,
        (SELECT COALESCE(SUM(total), 0)
          FROM bookings
          WHERE status = 'confirmed')      AS total_revenue
    `),

    // 2. ที่พักยอดนิยม (จำนวนจอง + รายได้)
    pool.query(`
      SELECT
        c.id,
        c.name,
        c.type,
        COUNT(b.id)          AS booking_count,
        COALESCE(SUM(b.total), 0) AS revenue
      FROM campsites c
      LEFT JOIN bookings b
        ON c.id = b.campsite_id
        AND b.status != 'cancelled'
      GROUP BY c.id, c.name, c.type
      ORDER BY booking_count DESC, revenue DESC
      LIMIT 5
    `),

    // 3. การจองล่าสุด 5 รายการ
    pool.query(`
      SELECT
        b.id,
        b.guest_name,
        b.check_in,
        b.check_out,
        b.total,
        b.status,
        c.name AS campsite_name
      FROM bookings b
      JOIN campsites c ON b.campsite_id = c.id
      ORDER BY b.created_at DESC
      LIMIT 5
    `),

    // 4. รายได้รายเดือน 6 เดือนหลัง
    pool.query(`
      SELECT
        DATE_FORMAT(check_in, '%Y-%m') AS month,
        COUNT(*)                        AS bookings,
        COALESCE(SUM(total), 0)         AS revenue
      FROM bookings
      WHERE status = 'confirmed'
        AND check_in >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(check_in, '%Y-%m')
      ORDER BY month ASC
    `),

  ]);

  return NextResponse.json({
    summary:         summary[0],
    top_campsites:   topCampsites[0],
    recent_bookings: recentBookings[0],
    monthly_revenue: monthlyRevenue[0],
  });
}
>>>>>>> 975ab91 (feat: add dashboard, auto-checkout, double-booking guard, manual checkout)
