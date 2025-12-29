/**
 * DOLPHIN BUYBACK SCRIPT (JUPITER)
 * 
 * Esegui: npm run buyback
 */

import 'dotenv/config'
import { 
  Connection, 
  Keypair, 
  LAMPORTS_PER_SOL,
  VersionedTransaction
} from '@solana/web3.js'
import { createClient } from '@supabase/supabase-js'
import bs58 from 'bs58'

// ============== CONFIGURAZIONE ==============
const TOKEN_MINT = 'a3W4qutoEJA4232T2gwZUfgYJTetr96pU4SJMwppump'
const SOL_MINT = 'So11111111111111111111111111111111111111112'
const MIN_SOL_THRESHOLD = parseFloat(process.env.MIN_SOL_THRESHOLD || '0.5')
const MAX_SOL_AMOUNT = parseFloat(process.env.MAX_SOL_AMOUNT || '1000') // Default alto = no limit
const RPC_URL = process.env.RPC_URL || 'https://api.mainnet-beta.solana.com'
const SLIPPAGE_BPS = 500 // 5%

// Jupiter API (public endpoint)
const JUPITER_API = 'https://public.jupiterapi.com'

// Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY

// ============== UTILITIES ==============

function log(message) {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] ${message}`)
}

function getSupabase() {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials not configured')
  }
  return createClient(supabaseUrl, supabaseKey)
}

function parseKey(key) {
  try {
    return Uint8Array.from(JSON.parse(key))
  } catch {
    return bs58.decode(key)
  }
}

async function saveBuybackToSupabase(buyback) {
  const supabase = getSupabase()
  
  const { error: insertError } = await supabase
    .from('buybacks')
    .insert({
      signature: buyback.signature,
      amount: buyback.amount,
      token_amount: buyback.tokenAmount || '0'
    })

  if (insertError) {
    log(`❌ Error inserting buyback: ${insertError.message}`)
    throw insertError
  }

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
    log(`❌ Error updating stats: ${updateError.message}`)
    throw updateError
  }

  log(`📝 Saved to Supabase. Total volume: ${newTotalVolume.toFixed(4)} SOL`)
}

// ============== JUPITER SWAP ==============

async function getJupiterQuote(inputMint, outputMint, amount) {
  const url = `${JUPITER_API}/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${SLIPPAGE_BPS}`
  
  log(`🔗 Calling Jupiter API...`)
  
  const response = await fetch(url)
  
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Jupiter quote failed: ${response.status} - ${errorText}`)
  }
  
  return response.json()
}

async function executeJupiterSwap(connection, wallet, quote) {
  const swapResponse = await fetch(`${JUPITER_API}/swap`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      quoteResponse: quote,
      userPublicKey: wallet.publicKey.toString(),
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
      prioritizationFeeLamports: 'auto'
    })
  })
  
  if (!swapResponse.ok) {
    const errorText = await swapResponse.text()
    throw new Error(`Jupiter swap failed: ${swapResponse.status} - ${errorText}`)
  }
  
  const { swapTransaction } = await swapResponse.json()
  
  const swapTransactionBuf = Buffer.from(swapTransaction, 'base64')
  const transaction = VersionedTransaction.deserialize(swapTransactionBuf)
  transaction.sign([wallet])
  
  log(`📤 Sending transaction...`)
  
  const signature = await connection.sendRawTransaction(transaction.serialize(), {
    skipPreflight: true,
    maxRetries: 3
  })
  
  log(`⏳ Waiting for confirmation...`)
  
  const confirmation = await connection.confirmTransaction(signature, 'confirmed')
  
  if (confirmation.value.err) {
    throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`)
  }
  
  return signature
}

// ============== MAIN ==============

async function runBuyback() {
  log('🐬 ========================================')
  log('🐬 DOLPHIN BUYBACK (Jupiter) - Starting...')
  log('🐬 ========================================')
  
  const requiredEnv = ['DEV_WALLET_PRIVATE_KEY', 'NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_KEY']
  
  for (const envVar of requiredEnv) {
    if (!process.env[envVar]) {
      log(`❌ Missing: ${envVar}`)
      return
    }
  }
  
  try {
    const connection = new Connection(RPC_URL, 'confirmed')
    log(`🌐 RPC: ${RPC_URL}`)
    
    let devWallet
    try {
      devWallet = Keypair.fromSecretKey(parseKey(process.env.DEV_WALLET_PRIVATE_KEY))
    } catch (parseError) {
      log(`❌ Error parsing private key: ${parseError.message}`)
      return
    }
    
    log(`📍 Dev Wallet: ${devWallet.publicKey.toString()}`)
    log(`🎯 Token: ${TOKEN_MINT}`)
    log(`📊 Soglia minima: ${MIN_SOL_THRESHOLD} SOL`)
    log(`📊 Massimo per buy: ${MAX_SOL_AMOUNT} SOL`)
    
    const balance = await connection.getBalance(devWallet.publicKey)
    const balanceSOL = balance / LAMPORTS_PER_SOL
    
    log(`💰 Wallet balance: ${balanceSOL.toFixed(4)} SOL`)
    
    if (balanceSOL < MIN_SOL_THRESHOLD) {
      log(`⏳ Balance sotto soglia (${MIN_SOL_THRESHOLD} SOL). Nessun buyback.`)
      log('🐬 ========================================')
      return
    }
    
    // Calcola quanto usare: min tra (balance - fee) e MAX_SOL_AMOUNT
    const availableSOL = balanceSOL - 0.01 // Tieni 0.01 per fee
    const amountSOL = Math.min(availableSOL, MAX_SOL_AMOUNT)
    const amountLamports = Math.floor(amountSOL * LAMPORTS_PER_SOL)
    
    log(`🔄 Ottengo quote Jupiter per ${amountSOL.toFixed(4)} SOL...`)
    
    const quote = await getJupiterQuote(SOL_MINT, TOKEN_MINT, amountLamports)
    
    log(`📊 Quote ricevuta. Output atteso: ${quote.outAmount} tokens`)
    
    log('🚀 Eseguo swap su Jupiter...')
    const swapSig = await executeJupiterSwap(connection, devWallet, quote)
    
    log(`✅ BUYBACK COMPLETATO!`)
    log(`🔗 TX: https://solscan.io/tx/${swapSig}`)
    
    await saveBuybackToSupabase({
      signature: swapSig,
      amount: amountSOL,
      tokenAmount: quote.outAmount
    })
    
    log('🐬 ========================================')
    log('🐬 FATTO! Buyback salvato su Supabase')
    log('🐬 ========================================')
    
  } catch (error) {
    log(`❌ Errore durante buyback: ${error.message}`)
    console.error(error)
  }
}

runBuyback()
