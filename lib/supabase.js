import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ Supabase credentials not configured')
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseKey || ''
)

// ============== DATABASE FUNCTIONS ==============

/**
 * Get buyback statistics
 */
export async function getStats() {
  const { data, error } = await supabase
    .from('stats')
    .select('*')
    .eq('id', 1)
    .single()

  if (error) {
    console.error('Error fetching stats:', error)
    return { totalVolume: 0, totalBuys: 0, lastBuyAmount: 0 }
  }

  return {
    totalVolume: data?.total_volume || 0,
    totalBuys: data?.total_buys || 0,
    lastBuyAmount: data?.last_buy_amount || 0
  }
}

/**
 * Get recent buyback history
 */
export async function getHistory(limit = 50) {
  const { data, error } = await supabase
    .from('buybacks')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching history:', error)
    return []
  }

  return data.map(row => ({
    signature: row.signature,
    amount: row.amount,
    timestamp: row.created_at,
    tokenAmount: row.token_amount
  }))
}

/**
 * Add a new buyback record
 */
export async function addBuyback(buyback) {
  // Insert buyback record
  const { error: insertError } = await supabase
    .from('buybacks')
    .insert({
      signature: buyback.signature,
      amount: buyback.amount,
      token_amount: buyback.tokenAmount || '0'
    })

  if (insertError) {
    console.error('Error inserting buyback:', insertError)
    throw insertError
  }

  // Update stats
  const { data: currentStats } = await supabase
    .from('stats')
    .select('*')
    .eq('id', 1)
    .single()

  const newTotalVolume = (currentStats?.total_volume || 0) + buyback.amount
  const newTotalBuys = (currentStats?.total_buys || 0) + 1

  const { error: updateError } = await supabase
    .from('stats')
    .upsert({
      id: 1,
      total_volume: newTotalVolume,
      total_buys: newTotalBuys,
      last_buy_amount: buyback.amount,
      updated_at: new Date().toISOString()
    })

  if (updateError) {
    console.error('Error updating stats:', updateError)
    throw updateError
  }

  return {
    totalVolume: newTotalVolume,
    totalBuys: newTotalBuys
  }
}
