import { NextResponse } from 'next/server';
import { mysqlPool } from '@/utils/db';

export const dynamic = 'force-dynamic';

// GET /api/bookings
export async function GET() {
  const pool = mysqlPool.promise();
  const [rows] = await pool.query(`
    SELECT b.*, c.name AS campsite_name,
           c.price_night, c.type
    FROM bookings b
    JOIN campsites c ON b.campsite_id = c.id
    ORDER BY b.created_at DESC`);

  // ยอดรายได้รวม (confirmed เท่านั้น)
  const [rev] = await pool.query(`
    SELECT COALESCE(SUM(total), 0) AS revenue
    FROM bookings
    WHERE status IN ('confirmed', 'checked_out')`);

  return NextResponse.json({
    bookings: rows,
    revenue: rev[0].revenue
  });
}

// POST /api/bookings — คำนวณ total อัตโนมัติ
export async function POST(request) {
  try {
    const body = await request.json();
    const { campsite_id, guest_name, phone,
            check_in, check_out, guests } = body;

    const pool = mysqlPool.promise();

    // ดึง price_night จาก campsites
    const [cs] = await pool.query(
      'SELECT price_night FROM campsites WHERE id = ?',
      [campsite_id]
    );
    if (!cs.length)
      return NextResponse.json(
        { error: 'Campsite not found' }, { status: 404 }
      );

    // ── ตรวจสอบการจองทับซ้อน ──────────────────────────────────
    // หา booking ที่ confirmed/pending ที่วันทับกับช่วงที่ขอจอง
    const [overlap] = await pool.query(`
      SELECT COUNT(*) AS cnt FROM bookings
      WHERE campsite_id = ?
        AND status IN ('confirmed', 'pending')
        AND check_in  < ?
        AND check_out > ?
    `, [campsite_id, check_out, check_in]);

    if (overlap[0].cnt > 0) {
      return NextResponse.json(
        { error: 'ที่พักนี้มีการจองในช่วงวันที่เลือกแล้ว กรุณาเลือกวันอื่น' },
        { status: 409 }
      );
    }
    // ──────────────────────────────────────────────────────────

    // คำนวณ total = DATEDIFF × price_night
    const [diff] = await pool.query(
      'SELECT DATEDIFF(?, ?) AS nights',
      [check_out, check_in]
    );
    const nights = diff[0].nights;
    const total  = nights * Number(cs[0].price_night);

    const [result] = await pool.query(`
      INSERT INTO bookings
        (campsite_id, guest_name, phone,
         check_in, check_out, guests, total)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [campsite_id, guest_name, phone || '',
       check_in, check_out, guests || 1, total]
    );

    // อัปเดตสถานะที่พักเป็น full ทันทีที่มีการจอง
    await pool.query(
      "UPDATE campsites SET status = 'full' WHERE id = ?",
      [campsite_id]
    );

    const [rows] = await pool.query(
      'SELECT * FROM bookings WHERE id = ?', [result.insertId]
    );
    return NextResponse.json(rows[0], { status: 201 });

  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}