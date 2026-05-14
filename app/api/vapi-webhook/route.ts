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

    const analysis = body.message?.analysis || {}
    const structured = analysis?.structuredData || {}

    const nume = structured.nume || 'Necunoscut'
    const telefon = structured.telefon || body.message?.customer?.number || ''
    const email = structured.email || ''
    const firma = structured.firma || ''
    const domeniu = structured.domeniu || ''
    const problema = structured.problema || ''
    const disponibilitate = structured.disponibilitate || ''

    // Construim câmpul motiv concatenat
    const motivParts = []
    if (firma) motivParts.push(`Firma: ${firma}`)
    if (domeniu) motivParts.push(`Domeniu: ${domeniu}`)
    if (problema) motivParts.push(`Problema: ${problema}`)
    if (email) motivParts.push(`Email: ${email}`)
    if (disponibilitate) motivParts.push(`Disponibilitate: ${disponibilitate}`)
    
    const motiv = motivParts.length > 0 
      ? motivParts.join(' | ') 
      : structured.motiv || 'Nedefinit'

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