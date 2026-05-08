import { Client } from '@notionhq/client'
import { NextRequest, NextResponse } from 'next/server'

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (body.message?.type !== 'end-of-call-report') {
      return NextResponse.json({ ok: true })
    }

    const transcript = body.message?.transcript || ''
    const analysis = body.message?.analysis || {}

    const nume = analysis?.structuredData?.nume || 'Necunoscut'
    const telefon = analysis?.structuredData?.telefon || body.message?.customer?.number || ''
    const motiv = analysis?.structuredData?.motiv || analysis?.summary || 'Nedefinit'

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

    return NextResponse.json({ ok: true })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}