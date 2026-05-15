import { NextRequest, NextResponse } from 'next/server'

// Storage in-memory cu TTL de 5 minute
// Cheia: internal_number (numărul CloudTalk), Valoarea: { telefon, timestamp }
const callerStore = new Map<string, { telefon: string; timestamp: number }>()

const TTL_MS = 5 * 60 * 1000 // 5 minute

// Curăță intrările expirate
function cleanup() {
  const now = Date.now()
  for (const [key, value] of callerStore.entries()) {
    if (now - value.timestamp > TTL_MS) {
      callerStore.delete(key)
    }
  }
}

// ─── POST - CloudTalk trimite numărul apelantului ──────────────────────────
// Apelat de Workflow Automation din CloudTalk când începe un apel inbound

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Caller webhook received:', JSON.stringify(body))

    const telefon = body.telefon || body.external_number || ''

    if (!telefon) {
      return NextResponse.json({ error: 'Telefon lipsa' }, { status: 400 })
    }

    cleanup()

    // Salvăm cu cheia = numărul de telefon normalizat
    const telefonCurat = telefon.replace(/\s/g, '')
    callerStore.set('latest', { telefon: telefonCurat, timestamp: Date.now() })

    console.log('Caller saved:', telefonCurat)
    return NextResponse.json({ ok: true, telefon: telefonCurat })
  } catch (error) {
    console.error('Caller POST error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// ─── GET - ElevenLabs agent preia numărul apelantului ─────────────────────
// Apelat de tool-ul get_telefon_client din agentul Frizeru

export async function GET(request: NextRequest) {
  try {
    cleanup()

    const entry = callerStore.get('latest')

    if (!entry) {
      return NextResponse.json({ telefon: null, found: false })
    }

    const ageMs = Date.now() - entry.timestamp

    // Dacă e mai vechi de 5 minute, nu îl returnăm
    if (ageMs > TTL_MS) {
      callerStore.delete('latest')
      return NextResponse.json({ telefon: null, found: false })
    }

    console.log('Caller retrieved:', entry.telefon, 'age:', Math.round(ageMs / 1000), 's')
    return NextResponse.json({ telefon: entry.telefon, found: true })
  } catch (error) {
    console.error('Caller GET error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}