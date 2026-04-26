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

// PUT /api/bookings/[id] — เปลี่ยน status + sync campsite
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const { status } = await request.json();
    const pool = mysqlPool.promise();

    // 1. อัปเดต booking
    await pool.query(
      'UPDATE bookings SET status = ? WHERE id = ?',
      [status, id]
    );

    // 2. หา campsite_id
    const [rows] = await pool.query(
      'SELECT campsite_id FROM bookings WHERE id = ?',
      [id]
    );

    if (!rows.length) {
      return NextResponse.json({ message: 'Booking not found' }, { status: 404 });
    }

    const campsiteId = rows[0].campsite_id;

    // 3. sync สถานะ campsite
    if (status === 'confirmed' || status === 'pending') {
      await pool.query(
        "UPDATE campsites SET status = 'full' WHERE id = ?",
        [campsiteId]
      );
    }

    if (status === 'cancelled' || status === 'checked_out') {
      const [active] = await pool.query(
        `SELECT COUNT(*) AS cnt FROM bookings 
         WHERE campsite_id = ? AND status IN ('confirmed', 'pending')`,
        [campsiteId]
      );
      if (active[0].cnt === 0) {
        await pool.query(
          "UPDATE campsites SET status = 'available' WHERE id = ?",
          [campsiteId]
        );
      }
    }

    // 4. ส่งข้อมูลกลับ
    const [updated] = await pool.query(
      'SELECT * FROM bookings WHERE id = ?',
      [id]
    );

    return NextResponse.json(updated[0]);

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

    const [bRows] = await pool.query(
      'SELECT campsite_id FROM bookings WHERE id = ?', [id]
    );

    if (!bRows.length)
      return NextResponse.json({ message: 'Not found' }, { status: 404 });

    const campsiteId = bRows[0].campsite_id;

    const [cs] = await pool.query(
      'SELECT price_night FROM campsites WHERE id = ?', [campsiteId]
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

    // 🔥 sync campsite เหมือนกัน
    if (status === 'confirmed' || status === 'pending') {
      await pool.query(
        "UPDATE campsites SET status = 'full' WHERE id = ?",
        [campsiteId]
      );
    }

    if (status === 'cancelled' || status === 'checked_out') {
      const [active] = await pool.query(
        `SELECT COUNT(*) AS cnt FROM bookings 
         WHERE campsite_id = ? AND status IN ('confirmed', 'pending')`,
        [campsiteId]
      );
      if (active[0].cnt === 0) {
        await pool.query(
          "UPDATE campsites SET status = 'available' WHERE id = ?",
          [campsiteId]
        );
      }
    }

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

    const [rows] = await pool.query('SELECT campsite_id FROM bookings WHERE id = ?', [id]);

    await pool.query('DELETE FROM bookings WHERE id = ?', [id]);

    if (rows.length > 0) {
      const campsiteId = rows[0].campsite_id;
      const [active] = await pool.query(
        `SELECT COUNT(*) AS cnt FROM bookings 
         WHERE campsite_id = ? AND status IN ('confirmed', 'pending')`,
        [campsiteId]
      );
      if (active[0].cnt === 0) {
        await pool.query(
          "UPDATE campsites SET status = 'available' WHERE id = ?",
          [campsiteId]
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
