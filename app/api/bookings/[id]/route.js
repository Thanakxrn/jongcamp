import { NextResponse } from 'next/server';
import { mysqlPool } from '@/utils/db';

// GET /api/bookings/[id]
export async function GET(_req, { params }) {
  const { id } = await params;
  const pool = mysqlPool.promise();
  const [rows] = await pool.query(`
    SELECT b.*, c.name AS campsite_name, c.price_night
    FROM bookings b
    JOIN campsites c ON b.campsite_id = c.id
    WHERE b.id = ?`, [id]);

  if (!rows.length)
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  return NextResponse.json(rows[0]);
}

// PUT /api/bookings/[id] — เปลี่ยน status
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const { status } = await request.json();
    const pool = mysqlPool.promise();

    await pool.query(
      'UPDATE bookings SET status = ? WHERE id = ?', [status, id]
    );
    const [rows] = await pool.query(
      'SELECT * FROM bookings WHERE id = ?', [id]
    );
    return NextResponse.json(rows[0]);

  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PATCH /api/bookings/[id] — แก้ไขข้อมูลการจอง + คำนวณ total ใหม่
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const { guest_name, phone, check_in, check_out, guests, status } = await request.json();
    const pool = mysqlPool.promise();

    // ดึง campsite_id + price_night สำหรับคำนวณ total ใหม่
    const [bRows] = await pool.query(
      'SELECT campsite_id FROM bookings WHERE id = ?', [id]
    );
    if (!bRows.length)
      return NextResponse.json({ message: 'Not found' }, { status: 404 });

    const [cs] = await pool.query(
      'SELECT price_night FROM campsites WHERE id = ?', [bRows[0].campsite_id]
    );
    const [diff] = await pool.query(
      'SELECT DATEDIFF(?, ?) AS nights', [check_out, check_in]
    );
    const nights = diff[0].nights;
    const total  = nights * Number(cs[0].price_night);

    await pool.query(
      `UPDATE bookings
       SET guest_name = ?, phone = ?, check_in = ?, check_out = ?,
           guests = ?, status = ?, total = ?
       WHERE id = ?`,
      [guest_name, phone || '', check_in, check_out, guests || 1, status, total, id]
    );

    const [rows] = await pool.query(
      'SELECT * FROM bookings WHERE id = ?', [id]
    );
    return NextResponse.json(rows[0]);

  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE /api/bookings/[id]
export async function DELETE(_req, { params }) {
  try {
    const { id } = await params;
    const pool = mysqlPool.promise();
    await pool.query('DELETE FROM bookings WHERE id = ?', [id]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}