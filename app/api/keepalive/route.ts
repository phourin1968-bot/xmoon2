import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data, error } = await supabase.from('users').select('id').limit(1)
    
    if (error) throw error
    
    return NextResponse.json({ 
      status: 'alive', 
      db: 'connected',
      timestamp: new Date().toISOString() 
    })
  } catch (e: any) {
    return NextResponse.json({ 
      status: 'error', 
      message: e.message 
    }, { status: 500 })
  }
}