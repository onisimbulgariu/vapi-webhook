import { Client } from '@notionhq/client'
import { NextRequest, NextResponse } from 'next/server'

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
})

async function sendWhatsApp(telefon: string, nume: string, motiv: string) {
  if (!telefon || telefon === '') return

  let numarFormatat = telefon.replace(/\s/g, '')
  if (numarFormatat.startsWith('0')) {
    numarFormatat = '+4' + numarFormatat
  }
  if (!numarFormatat.startsWith('+')) {
    numarFormatat = '+' + numarFormatat
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_WHATSAPP_FROM

  const mesaj =
    `Buna ziua, ${nume}! 👋\n\n` +
    `Va multumim ca ati apelat la *Frizeru*.\n\n` +
    `✅ Programarea dumneavoastra a fost inregistrata:\n` +
    `${motiv}\n\n` +
    `Va asteptam cu drag! 💇\n` +
    `— Echipa Frizeru\n` +
    `📞 +40316060150`

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`

  await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      From: from!,
      To: `whatsapp:${numarFormatat}`,
      Body: mesaj,
    }).toString(),
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Detectăm sursa: ElevenLabs sau Vapi
    const isElevenLabs = body.nume || body.telefon

    let nume: string
    let telefon: string
    let motiv: string

    if (isElevenLabs) {
      // Date venite direct de la ElevenLabs tool
      nume = body.nume || 'Necunoscut'
      telefon = body.telefon || ''
      const parts = []
      if (body.serviciu) parts.push(`Serviciu: ${body.serviciu}`)
      if (body.specialist) parts.push(`Specialist: ${body.specialist}`)
      if (body.data) parts.push(`Data: ${body.data}`)
      if (body.ora) parts.push(`Ora: ${body.ora}`)
      motiv = parts.join(' | ') || 'Nedefinit'
    } else {
      // Date venite de la Vapi
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

    // Salvare Notion
    await notion.pages.create({
      parent: { database_id: process.env.NOTION_DATABASE_ID! },
      properties: {
        'Nume client': {
          title: [{ text: { content: nume } }]
        },
        'Telefon': {
          phone_number: telefon
        },
        'Motiv apel': {
          rich_text: [{ text: { content: motiv } }]
        },
        'Data apel': {
          date: { start: new Date().toISOString() }
        },
        'Status': {
          select: { name: 'Nou' }
        }
      }
    })

    // Trimitere WhatsApp
    await sendWhatsApp(telefon, nume, motiv)

    return NextResponse.json({ ok: true })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}