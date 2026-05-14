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
    `Salut, ${nume}! 👋\n\n` +
    `Îți mulțumim că ai apelat la serviciile noastre.\n\n` +
    `✅ Programarea ta a fost înregistrată:\n` +
    `${motiv}\n\n` +
    `Te așteptăm cu drag! 💇\n` +
    `— Echipa Frizeru\n` +
    `📞 +40312221753`

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`

  const response = await fetch(url, {
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

  const result = await response.json()
  console.log('Twilio response:', JSON.stringify(result))
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Body received:', JSON.stringify(body))

    const isElevenLabs = body.name || body.nume || body.telefon || body.serviciu

    let nume: string
    let telefon: string
    let motiv: string

    if (isElevenLabs) {
      nume = body.name || body.nume || 'Necunoscut'
      telefon = body.telefon || ''
      const parts = []
      if (body.serviciu) parts.push(`Serviciu: ${body.serviciu}`)
      if (body.specialist) parts.push(`Specialist: ${body.specialist}`)
      if (body.data) parts.push(`Data: ${body.data}`)
      if (body.ora) parts.push(`Ora: ${body.ora}`)
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

    await sendWhatsApp(telefon, nume, motiv)

    return NextResponse.json({ ok: true })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}