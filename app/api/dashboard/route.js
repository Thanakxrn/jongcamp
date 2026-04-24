import { NextResponse } from 'next/server';
import { mysqlPool } from '@/utils/db';

export async function GET() {
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