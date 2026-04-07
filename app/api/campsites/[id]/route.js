import { NextResponse } from 'next/server';
import { mysqlPool } from '@/utils/db';

// GET /api/campsites/[id]
export async function GET(_req, { params }) {
  const { id } = await params;
  const pool = mysqlPool.promise();

  // ดึงที่พัก + facilities
  const [rows] = await pool.query(`
    SELECT c.*,
      GROUP_CONCAT(f.id   ORDER BY f.id SEPARATOR ',') AS fac_ids,
      GROUP_CONCAT(f.icon ORDER BY f.id SEPARATOR ' ') AS fac_icons,
      GROUP_CONCAT(f.name ORDER BY f.id SEPARATOR ',') AS fac_names
    FROM campsites c
    LEFT JOIN campsite_facilities cf ON c.id = cf.campsite_id
    LEFT JOIN facilities f ON cf.facility_id = f.id
    WHERE c.id = ?
    GROUP BY c.id`, [id]);

  if (!rows.length)
    return NextResponse.json(
      { message: `Campsite ${id} not found` }, { status: 404 }
    );

  // ดึง bookings ของที่พักนี้
  const [bookings] = await pool.query(
    `SELECT * FROM bookings
     WHERE campsite_id = ?
     ORDER BY check_in DESC`, [id]
  );

  return NextResponse.json({ ...rows[0], bookings });
}

// PUT /api/campsites/[id]
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, type, capacity, price_night,
            image, description, status, facilities } = body;
    const pool = mysqlPool.promise();

    await pool.query(`
      UPDATE campsites
      SET name=?, type=?, capacity=?, price_night=?,
          image=?, description=?, status=?
      WHERE id=?`,
      [name, type, capacity, price_night,
       image, description, status || 'available', id]
    );

    // อัปเดต facilities (ลบเก่า → ใส่ใหม่)
    if (facilities) {
      await pool.query(
        'DELETE FROM campsite_facilities WHERE campsite_id = ?', [id]
      );
      if (facilities.length) {
        const vals = facilities.map(fid => [id, fid]);
        await pool.query(
          'INSERT INTO campsite_facilities (campsite_id, facility_id) VALUES ?',
          [vals]
        );
      }
    }

    const [rows] = await pool.query(
      'SELECT * FROM campsites WHERE id = ?', [id]
    );
    return NextResponse.json(rows[0]);

  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE /api/campsites/[id]
export async function DELETE(_req, { params }) {
  try {
    const { id } = await params;
    const pool = mysqlPool.promise();

    const [exists] = await pool.query(
      'SELECT id FROM campsites WHERE id = ?', [id]
    );
    if (!exists.length)
      return NextResponse.json(
        { message: 'Not found' }, { status: 404 }
      );

    // ON DELETE CASCADE จัดการ campsite_facilities + bookings ให้
    await pool.query('DELETE FROM campsites WHERE id = ?', [id]);
    return NextResponse.json({ ok: true });

  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}