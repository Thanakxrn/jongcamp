import { NextResponse } from 'next/server';
import { mysqlPool } from '@/utils/db';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const { name, icon } = await request.json();
    const pool = mysqlPool.promise();
    await pool.query(
      'UPDATE facilities SET name=?, icon=? WHERE id=?',
      [name, icon, id]
    );
    const [rows] = await pool.query(
      'SELECT * FROM facilities WHERE id = ?', [id]
    );
    return NextResponse.json(rows[0]);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(_req, { params }) {
  try {
    const { id } = await params;
    const pool = mysqlPool.promise();
    await pool.query(
      'DELETE FROM facilities WHERE id = ?', [id]
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}