import { Client } from '@notionhq/client'
import { NextRequest, NextResponse } from 'next/server'

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
})

// ─── ElevenLabs WhatsApp ───────────────────────────────────────────────────

async function sendElevenLabsWhatsApp(
  telefon: string,
  nume: string,
  serviciu: string,
  data: string,
  ora: string
) {
  if (!telefon || telefon === '') return

  // Formatează numărul: scoate +, păstrează doar cifrele (ex: 40722123456)
  let whatsappUserId = telefon.replace(/\s/g, '').replace(/^\+/, '')

  const XI_API_KEY = process.env.ELEVENLABS_API_KEY!
  const WHATSAPP_PHONE_NUMBER_ID = process.env.ELEVENLABS_WHATSAPP_PHONE_NUMBER_ID!
  const AGENT_ID = process.env.ELEVENLABS_AGENT_ID!

  const response = await fetch(
    'https://api.elevenlabs.io/v1/convai/whatsapp/outbound-message',
    {
      method: 'POST',
      headers: {
        'xi-api-key': XI_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        whatsapp_phone_number_id: WHATSAPP_PHONE_NUMBER_ID,
        whatsapp_user_id: whatsappUserId,
        agent_id: AGENT_ID,
        template_name: 'confirmare_programare_frizeru',
        template_language_code: 'ro',
        template_params: [
          { type: 'text', text: nume },
          { type: 'text', text: serviciu },
          { type: 'text', text: data },
          { type: 'text', text: ora },
        ],
      }),
    }
  )

  const result = await response.json()
  console.log('ElevenLabs WhatsApp response:', JSON.stringify(result))
  return result
}

// ─── Găsește programare în Notion după număr de telefon ────────────────────

async function gasesteProgramareByTelefon(telefon: string) {
  const response = await fetch(
    `https://api.notion.com/v1/databases/${process.env.NOTION_DATABASE_ID}/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filter: {
          property: 'Telefon',
          phone_number: {
            equals: telefon,
          },
        },
        sorts: [{ property: 'Data apel', direction: 'descending' }],
        page_size: 1,
      }),
    }
  )

  const data = await response.json()
  return data.results?.[0] || null
}

// ─── POST principal (salvare programare nouă) ──────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Body received:', JSON.stringify(body))

    const isElevenLabs = body.name || body.nume || body.telefon || body.serviciu

    let nume: string
    let telefon: string
    let motiv: string
    let serviciu = ''
    let data = ''
    let ora = ''

    if (isElevenLabs) {
      nume = body.name || body.nume || 'Necunoscut'
      telefon = body.telefon || ''
      serviciu = body.serviciu || ''
      data = body.data || ''
      ora = body.ora || ''

      const parts = []
      if (serviciu) parts.push(`Serviciu: ${serviciu}`)
      if (body.specialist) parts.push(`Specialist: ${body.specialist}`)
      if (data) parts.push(`Data: ${data}`)
      if (ora) parts.push(`Ora: ${ora}`)
      motiv = parts.join(' | ') || 'Nedefinit'
    } else {
      if (body.message?.type !== 'end-of-call-report') {
        return NextResponse.json({ ok: true })
      }
      const structured = body.message?.analysis?.structuredData || {}
      nume = structured.nume || 'Necunoscut'
      telefon = structured.telefon || body.message?.customer?.number || ''
      const parts = []
      if (structured.firma) parts.push(`Firma: ${structured.firma}`)
      if (structured.problema) parts.push(`Problema: ${structured.problema}`)
      if (structured.email) parts.push(`Email: ${structured.email}`)
      if (structured.disponibilitate) parts.push(`Disponibilitate: ${structured.disponibilitate}`)
      motiv = parts.join(' | ') || structured.motiv || 'Nedefinit'
    }

    // Salvează în Notion
    await notion.pages.create({
      parent: { database_id: process.env.NOTION_DATABASE_ID! },
      properties: {
        'Nume client': {
          title: [{ text: { content: nume } }],
        },
        'Telefon': {
          phone_number: telefon,
        },
        'Motiv apel': {
          rich_text: [{ text: { content: motiv } }],
        },
        'Data apel': {
          date: { start: new Date().toISOString() },
        },
        'Status': {
          select: { name: 'Nou' },
        },
      },
    })

    // Trimite confirmare WhatsApp prin ElevenLabs
    await sendElevenLabsWhatsApp(telefon, nume, serviciu, data, ora)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// ─── PATCH - modificare programare existentă ───────────────────────────────

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Modificare programare:', JSON.stringify(body))

    const { telefon, serviciu, data, ora, nume } = body

    if (!telefon) {
      return NextResponse.json({ error: 'Telefon lipsă' }, { status: 400 })
    }

    // Găsește programarea existentă
    const programareExistenta = await gasesteProgramareByTelefon(telefon)

    if (!programareExistenta) {
      return NextResponse.json({ error: 'Programare negăsită' }, { status: 404 })
    }

    // Construiește motiv actualizat
    const parts = []
    if (serviciu) parts.push(`Serviciu: ${serviciu}`)
    if (data) parts.push(`Data: ${data}`)
    if (ora) parts.push(`Ora: ${ora}`)
    const motivNou = parts.join(' | ') || 'Nedefinit'

    // Actualizează în Notion
    await notion.pages.update({
      page_id: programareExistenta.id,
      properties: {
        'Motiv apel': {
          rich_text: [{ text: { content: motivNou } }],
        },
        'Status': {
          select: { name: 'Modificat' },
        },
      },
    })

    // Trimite noua confirmare WhatsApp
    const numeClient = nume || 'Client'
    await sendElevenLabsWhatsApp(telefon, numeClient, serviciu, data, ora)

    return NextResponse.json({ ok: true, message: 'Programare modificată' })
  } catch (error) {
    console.error('Modificare error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}