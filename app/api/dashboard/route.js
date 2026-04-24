import { NextResponse } from 'next/server';
import { mysqlPool } from '@/utils/db';

export async function GET() {
  try {
    const pool = mysqlPool.promise();

    // ── Auto-checkout ──────────────────────────────────────────────
    // ดึง booking ที่ confirmed และ check_out < วันนี้
    const [expiredBookings] = await pool.query(`
      SELECT id, campsite_id FROM bookings
      WHERE status = 'confirmed'
        AND check_out < CURDATE()
    `);

    // อัปเดตทีละรายการ
    if (expiredBookings.length > 0) {
      const ids = expiredBookings.map(b => b.id);
      const campsiteIds = [...new Set(expiredBookings.map(b => b.campsite_id))];

      // เปลี่ยน booking → checked_out
      await pool.query(
        `UPDATE bookings SET status = 'checked_out' WHERE id IN (?)`,
        [ids]
      );

      // คืนสถานะ campsite → available
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

    // รัน query ทั้งหมดพร้อมกัน
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
      summary: summary[0],
      top_campsites: topCampsites[0],
      recent_bookings: recentBookings[0],
      monthly_revenue: monthlyRevenue[0],
    });

  } catch (error) {
    console.error('Dashboard API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
