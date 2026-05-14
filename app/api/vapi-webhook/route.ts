import { Client } from '@notionhq/client'
import { NextRequest, NextResponse } from 'next/server'

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
})

async function sendWhatsApp(telefon: string, nume: string, motiv: string) {
  if (!telefon || telefon === '') return

  // Normalizăm numărul — adăugăm prefix România dacă e local
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

    if (body.message?.type !== 'end-of-call-report') {
      return NextResponse.json({ ok: true })
    }

    const analysis = body.message?.analysis || {}
    const structured = analysis?.structuredData || {}

    const nume = structured.nume || 'Necunoscut'
    const telefon = structured.telefon || body.message?.customer?.number || ''
    const email = structured.email || ''
    const firma = structured.firma || ''
    const domeniu = structured.domeniu || ''
    const problema = structured.problema || ''
    const disponibilitate = structured.disponibilitate || ''

    const motivParts = []
    if (firma) motivParts.push(`Firma: ${firma}`)
    if (domeniu) motivParts.push(`Domeniu: ${domeniu}`)
    if (problema) motivParts.push(`Problema: ${problema}`)
    if (email) motivParts.push(`Email: ${email}`)
    if (disponibilitate) motivParts.push(`Disponibilitate: ${disponibilitate}`)

    const motiv = motivParts.length > 0
      ? motivParts.join(' | ')
      : structured.motiv || 'Nedefinit'

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

    // Trimitere WhatsApp confirmare
    await sendWhatsApp(telefon, nume, motiv)

    return NextResponse.json({ ok: true })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}