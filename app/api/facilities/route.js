import { NextResponse } from 'next/server';
import { mysqlPool } from '@/utils/db';

export async function GET() {
  const pool = mysqlPool.promise();
  const [rows] = await pool.query(
    'SELECT * FROM facilities ORDER BY id'
  );
  return NextResponse.json(rows);
}

export async function POST(request) {
  try {
    const { name, icon } = await request.json();
    const pool = mysqlPool.promise();
    const [result] = await pool.query(
      'INSERT INTO facilities (name, icon) VALUES (?, ?)',
      [name, icon || '']
    );
    const [rows] = await pool.query(
      'SELECT * FROM facilities WHERE id = ?', [result.insertId]
    );
    return NextResponse.json(rows[0], { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}