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