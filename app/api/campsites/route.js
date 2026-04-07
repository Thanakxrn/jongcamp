import { NextResponse } from 'next/server';
import { mysqlPool } from '@/utils/db';

// GET /api/campsites?type=เต็นท์
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  const pool = mysqlPool.promise();
  let sql = `
    SELECT c.*,
      GROUP_CONCAT(f.icon ORDER BY f.id SEPARATOR ' ') AS facility_icons,
      GROUP_CONCAT(f.name ORDER BY f.id SEPARATOR ',') AS facility_names
    FROM campsites c
    LEFT JOIN campsite_facilities cf ON c.id = cf.campsite_id
    LEFT JOIN facilities f ON cf.facility_id = f.id
  `;
  const params = [];
  if (type) {
    sql += ' WHERE c.type = ?';
    params.push(type);
  }
  sql += ' GROUP BY c.id ORDER BY c.id';

  const [rows] = await pool.query(sql, params);
  return NextResponse.json(rows);
}

// POST /api/campsites
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, type, capacity, price_night,
            image, description, facilities } = body;

    const pool = mysqlPool.promise();

    // insert campsite
    const [result] = await pool.query(
      `INSERT INTO campsites
        (name, type, capacity, price_night, image, description)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, type, capacity || 1,
       price_night, image || '', description || '']
    );
    const newId = result.insertId;

    // insert junction table (facilities[])
    if (facilities?.length) {
      const vals = facilities.map(fid => [newId, fid]);
      await pool.query(
        `INSERT INTO campsite_facilities
          (campsite_id, facility_id) VALUES ?`,
        [vals]
      );
    }

    const [rows] = await pool.query(
      'SELECT * FROM campsites WHERE id = ?', [newId]
    );
    return NextResponse.json(rows[0], { status: 201 });

  } catch (e) {
    return NextResponse.json(
      { error: e.message }, { status: 500 }
    );
  }
}