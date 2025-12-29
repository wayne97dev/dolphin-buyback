import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function getSupabase() {
  if (!supabaseUrl || !supabaseKey) {
    return null
  }
  return createClient(supabaseUrl, supabaseKey)
}

export async function GET() {
  try {
    const supabase = getSupabase()
    
    if (!supabase) {
      return NextResponse.json({
        stats: { totalVolume: 0, totalBuys: 0, lastBuyAmount: 0 },
        history: [],
        error: 'Supabase not configured'
      })
    }

    // Get stats
    const { data: statsData, error: statsError } = await supabase
      .from('stats')
      .select('*')
      .eq('id', 1)
      .single()

    if (statsError && statsError.code !== 'PGRST116') {
      console.error('Stats error:', statsError)
    }

    // Get history
    const { data: historyData, error: historyError } = await supabase
      .from('buybacks')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (historyError) {
      console.error('History error:', historyError)
    }

    const stats = {
      totalVolume: statsData?.total_volume || 0,
      totalBuys: statsData?.total_buys || 0,
      lastBuyAmount: statsData?.last_buy_amount || 0
    }

    const history = (historyData || []).map(row => ({
      signature: row.signature,
      amount: row.amount,
      timestamp: row.created_at,
      tokenAmount: row.token_amount
    }))

    return NextResponse.json({ stats, history })
    
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch stats',
        stats: { totalVolume: 0, totalBuys: 0, lastBuyAmount: 0 },
        history: []
      },
      { status: 500 }
    )
  }
}
