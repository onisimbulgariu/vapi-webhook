import { Client } from '@notionhq/client'
import { NextRequest, NextResponse } from 'next/server'

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
})

// ─── Mapare servicii → departament ────────────────────────────────────────

function getDepartament(serviciu: string): string {
  const s = serviciu.toLowerCase()

  const hair = [
    'tuns', 'haircut', 'varfuri', 'trimming', 'uscat', 'breton', 'barba',
    'coafat', 'coafura', 'blowdry', 'impletitura', 'braiding',
    'bucle', 'waves', 'coc', 'bun', 'updo', 'mireasa', 'bridal',
    'kerastase', 'keratermie', 'keratina', 'keratin', 'fiola', 'ampoule',
    'scalp', 'decolorat', 'bleaching', 'decapaj', 'suvite', 'highlights',
    'foilyage', 'balayage', 'airtouch', 'vopsit', 'coloring', 'nuantare',
    'toner', 'cover', 'spalat', 'washing', 'ritual', 'ingrijire par',
  ]

  const nails = [
    'manicura', 'manichiura', 'manicure', 'pedicura', 'pedichiura', 'pedicure',
    'semipermanenta', 'semipermanent', 'oja', 'gel', 'tips',
    'unghii', 'unghie',
  ]

  const beauty = [
    'tratament facial', 'tratament fata', 'curatare',
    'ultrasunete', 'rf', 'led', 'hidradermoabraziune', 'microdermoabraziune',
    'anti-rid', 'depigmentare', 'oxigenare', 'microneedeling', 'plasma',
    'epilat', 'epilare', 'epilatie', 'ipl', 'bikini', 'brate',
    'axila', 'mustata', 'toplip', 'picioare',
    'anticelulitic', 'drenaj limfatic', 'tonifiere', 'bust',
    'extensii gene', 'gene', 'machiaj', 'makeup', 'fotoregenerare',
    'sprancene', 'pensat',
  ]

  if (hair.some(k => s.includes(k))) return 'Hair'
  if (nails.some(k => s.includes(k))) return 'Nails'
  if (beauty.some(k => s.includes(k))) return 'Beauty'
  return 'Hair'
}

// ─── Lista echipă cu departament ──────────────────────────────────────────

const ECHIPA: { nume: string; departament: string }[] = [
  { nume: 'Alina Rustei', departament: 'Hair' },
  { nume: 'Ioana Simion', departament: 'Hair' },
  { nume: 'Claudiu Rusu', departament: 'Hair' },
  { nume: 'Alex Ianculescu', departament: 'Hair' },
  { nume: 'Laurentiu Ilie', departament: 'Hair' },
  { nume: 'Camelia Parvu', departament: 'Hair' },
  { nume: 'Catalin Dulu', departament: 'Hair' },
  { nume: 'Ioana Mihai', departament: 'Hair' },
  { nume: 'Vlad Barbu', departament: 'Hair' },
  { nume: 'Emma Pal', departament: 'Hair' },
  { nume: 'Adrian Voicu', departament: 'Hair' },
  { nume: 'Claudiu Silvianu', departament: 'Hair' },
  { nume: 'Paula Ene', departament: 'Hair' },
  { nume: 'Cristian Ispas', departament: 'Hair' },
  { nume: 'Catalin Munteanu', departament: 'Hair' },
  { nume: 'Ilia Ivanov', departament: 'Hair' },
  { nume: 'George Garlasteanu', departament: 'Hair' },
  { nume: 'Gabriela Tudor', departament: 'Nails' },
  { nume: 'Magda Oceanu', departament: 'Nails' },
  { nume: 'Adina Nistor', departament: 'Nails' },
  { nume: 'Mariana Luca', departament: 'Nails' },
  { nume: 'Cristiana Mitrache', departament: 'Beauty' },
  { nume: 'Alina Preda', departament: 'Beauty' },
]

// ─── Conversie dată română → ISO ──────────────────────────────────────────

function parseDataRomana(data: string): string | null {
  const luni: Record<string, string> = {
    'ianuarie': '01', 'februarie': '02', 'martie': '03',
    'aprilie': '04', 'mai': '05', 'iunie': '06',
    'iulie': '07', 'august': '08', 'septembrie': '09',
    'octombrie': '10', 'noiembrie': '11', 'decembrie': '12'
  }

  const aziRo = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Bucharest' }))
  const an = aziRo.getFullYear()

  function formatData(d: Date): string {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const zi = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${zi}`
  }

  const s = data.toLowerCase().trim()

  if (s === 'azi' || s === 'astazi' || s === 'today') {
    return formatData(aziRo)
  }

  if (s === 'maine' || s === 'tomorrow') {
    const maine = new Date(aziRo)
    maine.setDate(aziRo.getDate() + 1)
    return formatData(maine)
  }

  if (s === 'poimaine') {
    const poi = new Date(aziRo)
    poi.setDate(aziRo.getDate() + 2)
    return formatData(poi)
  }

  // Zilele saptamanii
  const zileMap: Record<string, number> = {
    'luni': 1, 'marti': 2, 'marti': 2, 'miercuri': 3,
    'joi': 4, 'vineri': 5, 'sambata': 6, 'duminica': 0,
  }
  const ziuaSaptamanii = zileMap[s]
  if (ziuaSaptamanii !== undefined) {
    const azi = aziRo.getDay() // 0=duminica, 1=luni...
    let diff = ziuaSaptamanii - azi
    if (diff <= 0) diff += 7 // urmatoarea aparitie
    const ziuaViitoare = new Date(aziRo)
    ziuaViitoare.setDate(aziRo.getDate() + diff)
    return formatData(ziuaViitoare)
  }

  const parts = s.split(' ')
  if (parts.length >= 2) {
    const zi = parts[0].replace(/\D/g, '').padStart(2, '0')
    const luna = luni[parts[1]]
    if (luna && zi) {
      const anFinal = parts[2] ? parseInt(parts[2]) : an
      return `${anFinal}-${luna}-${zi}`
    }
  }

  return null
}

// ─── Formatare nume pentru agent vocal ────────────────────────────────────

function formateazaNume(numeComplet: string, totiDisponibilii: string[]): string {
  const prenume = numeComplet.split(' ')[0]
  const dubluri = totiDisponibilii.filter(n => n.split(' ')[0] === prenume)
  return dubluri.length > 1 ? numeComplet : prenume
}

// ─── Ora string → minute ──────────────────────────────────────────────────

function oraInMinute(oraStr: string): number {
  const [h, m] = oraStr.split(':').map(Number)
  return h * 60 + (m || 0)
}

function minuteInOra(min: number): string {
  const h = Math.floor(min / 60).toString().padStart(2, '0')
  const m = (min % 60).toString().padStart(2, '0')
  return `${h}:${m}`
}

// ─── ElevenLabs WhatsApp ───────────────────────────────────────────────────

async function sendElevenLabsWhatsApp(
  telefon: string,
  nume: string,
  serviciu: string,
  data: string,
  ora: string
) {
  if (!telefon || telefon === '') return

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

// ─── Gaseste programare dupa telefon ──────────────────────────────────────

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
          phone_number: { equals: telefon },
        },
        sorts: [{ property: 'Data apel', direction: 'descending' }],
        page_size: 1,
      }),
    }
  )

  const data = await response.json()
  return data.results?.[0] || null
}

// ─── GET - verificare disponibilitate ─────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const data = searchParams.get('data')
    const ora = searchParams.get('ora')
    const serviciu = searchParams.get('serviciu')
    const specialistCerut = searchParams.get('specialist') || ''

    if (!data || !ora || !serviciu) {
      return NextResponse.json({ error: 'Parametri lipsa: data, ora, serviciu' }, { status: 400 })
    }

    const departament = getDepartament(serviciu)
    const DURATA = 45

    // Sloturi fixe 10:00 - 19:00 din 45 in 45 minute
    const SLOTURI_FIXE: number[] = []
    for (let min = 10 * 60; min + 45 <= 19 * 60; min += 45) {
      SLOTURI_FIXE.push(min)
    }

    // Ora curenta Romania
    const acumRo = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Bucharest' }))
    const oraAcumMin = acumRo.getHours() * 60 + acumRo.getMinutes()

    // Verifica daca e azi
    const aziISO = parseDataRomana('azi')
    const dataISO = parseDataRomana(data) || data
    const eAzi = dataISO === aziISO

    // Sloturi disponibile - exclude trecutul daca e azi
    const SLOTURI_DISPONIBILE = eAzi
      ? SLOTURI_FIXE.filter(s => s > oraAcumMin)
      : SLOTURI_FIXE

    const oraCerutaMin = oraInMinute(ora)
    const eSlotValid = SLOTURI_DISPONIBILE.includes(oraCerutaMin)

    // Interogheaza Notion pentru toate programarile din ziua respectiva
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
            property: 'Data programare',
            date: { equals: dataISO },
          },
        }),
      }
    )

    const notionData = await response.json()
    const programariExistente = notionData.results || []

    console.log('=== VERIFICARE DISPONIBILITATE ===')
    console.log('Data ceruta:', data, '-> ISO:', dataISO)
    console.log('Ora ceruta:', ora, '-> minute:', oraCerutaMin)
    console.log('Slot valid:', eSlotValid)
    console.log('Programari gasite in Notion:', programariExistente.length)
    programariExistente.forEach((p: any) => {
      console.log('  -',
        p.properties?.['Specialist']?.select?.name,
        'ora:', p.properties?.['Ora programare']?.rich_text?.[0]?.text?.content,
        'data:', p.properties?.['Data programare']?.date?.start
      )
    })

    // Functie care verifica daca un specialist e ocupat la un slot dat
    function eOcupatLaSlot(numeSpecialist: string, slotMin: number): boolean {
      return programariExistente.some((p: any) => {
        const spec = p.properties?.['Specialist']?.select?.name || ''
        const oraProg = p.properties?.['Ora programare']?.rich_text?.[0]?.text?.content || ''
        if (spec !== numeSpecialist || !oraProg) return false
        const oraProgMin = oraInMinute(oraProg)
        return Math.abs(slotMin - oraProgMin) < DURATA
      })
    }

    // Specialistii ocupati la ora ceruta
    const ocupatiLaOraCeruta: string[] = programariExistente
      .map((p: any) => {
        const specialist = p.properties?.['Specialist']?.select?.name || ''
        const oraProg = p.properties?.['Ora programare']?.rich_text?.[0]?.text?.content || ''
        if (!specialist || !oraProg) return null
        const oraProgMin = oraInMinute(oraProg)
        if (Math.abs(oraCerutaMin - oraProgMin) < DURATA) return specialist
        return null
      })
      .filter(Boolean)

    // Specialisti disponibili la ora ceruta
    const disponibili = ECHIPA
      .filter(m => m.departament === departament)
      .filter(m => !ocupatiLaOraCeruta.includes(m.nume))
      .map(m => m.nume)

    const numeFormatate = disponibili.map(n => formateazaNume(n, disponibili))

    // Gasim cel mai apropiat slot disponibil (slot valid SI neocupat pentru TOTI)
    let celMaiApropiateSlot: string | null = null
    if (!eSlotValid && SLOTURI_DISPONIBILE.length > 0) {
      // Sortam sloturile dupa distanta fata de ora ceruta
      const sloturiSortate = [...SLOTURI_DISPONIBILE].sort((a, b) =>
        Math.abs(a - oraCerutaMin) - Math.abs(b - oraCerutaMin)
      )

      for (const slot of sloturiSortate) {
        // Verificam daca exista cel putin un specialist liber la acest slot
        const specialistiLiberiLaSlot = ECHIPA
          .filter(m => m.departament === departament)
          .filter(m => !eOcupatLaSlot(m.nume, slot))

        if (specialistiLiberiLaSlot.length > 0) {
          celMaiApropiateSlot = minuteInOra(slot)
          break
        }
      }
    }

    // Logica pentru specialist specific cerut
    let specialistCerutLiber = true
    let urmatorSlotLiber: string | null = null

    if (specialistCerut) {
      const specialistCompletCerut = ECHIPA.find(m =>
        m.nume.toLowerCase().includes(specialistCerut.toLowerCase()) ||
        specialistCerut.toLowerCase().includes(m.nume.split(' ')[0].toLowerCase())
      )

      if (specialistCompletCerut) {
        specialistCerutLiber = !eOcupatLaSlot(specialistCompletCerut.nume, oraCerutaMin)

        if (!specialistCerutLiber) {
          // Cautam urmatorul slot liber pentru specialist
          const sloturiDupa = SLOTURI_DISPONIBILE.filter(s => s > oraCerutaMin)
          const sloturiInainte = SLOTURI_DISPONIBILE.filter(s => s < oraCerutaMin).reverse()
          const ordineCautare = [...sloturiDupa, ...sloturiInainte]

          for (const slot of ordineCautare) {
            if (!eOcupatLaSlot(specialistCompletCerut.nume, slot)) {
              urmatorSlotLiber = minuteInOra(slot)
              break
            }
          }
        }
      }
    }

    // Daca slot_valid e false, recalculam disponibili pentru cel_mai_apropiat_slot
    let disponibiliLaCelMaiApropiateSlot: string[] = []
    if (!eSlotValid && celMaiApropiateSlot) {
      const slotMin = oraInMinute(celMaiApropiateSlot)
      disponibiliLaCelMaiApropiateSlot = ECHIPA
        .filter(m => m.departament === departament)
        .filter(m => !eOcupatLaSlot(m.nume, slotMin))
        .map(m => m.nume)
    }

    console.log('Ocupati la ora ceruta:', ocupatiLaOraCeruta)
    console.log('Disponibili:', disponibili)
    console.log('Cel mai apropiat slot:', celMaiApropiateSlot)
    console.log('Disponibili la cel mai apropiat slot:', disponibiliLaCelMaiApropiateSlot)

    return NextResponse.json({
      disponibili: numeFormatate,
      disponibili_complet: disponibili,
      disponibili_la_slot_propus: disponibiliLaCelMaiApropiateSlot.map(n =>
        formateazaNume(n, disponibiliLaCelMaiApropiateSlot)
      ),
      departament,
      data,
      ora,
      liber: disponibili.length > 0,
      slot_valid: eSlotValid,
      cel_mai_apropiat_slot: celMaiApropiateSlot,
      ora_in_trecut: eAzi && oraCerutaMin <= oraAcumMin,
      nu_mai_sunt_sloturi_azi: eAzi && SLOTURI_DISPONIBILE.length === 0,
      specialist_cerut: specialistCerut,
      specialist_cerut_liber: specialistCerutLiber,
      urmator_slot_liber_specialist: urmatorSlotLiber,
    })
  } catch (error) {
    console.error('Verificare disponibilitate error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// ─── POST principal (salvare programare noua) ──────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Body received:', JSON.stringify(body))

    const isElevenLabs = body.name || body.nume || body.telefon || body.serviciu

    let nume: string
    let telefon: string
    let motiv: string
    let serviciu = ''
    let specialist = ''
    let data = ''
    let ora = ''

    if (isElevenLabs) {
      nume = body.name || body.nume || 'Necunoscut'
      telefon = body.telefon || ''
      serviciu = body.serviciu || ''
      specialist = body.specialist || ''
      data = body.data || ''
      ora = body.ora || ''

      const parts = []
      if (serviciu) parts.push(`Serviciu: ${serviciu}`)
      if (specialist) parts.push(`Specialist: ${specialist}`)
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
      specialist = structured.specialist || ''
      serviciu = structured.serviciu || ''
      data = structured.data || ''
      ora = structured.ora || ''
      const parts = []
      if (structured.firma) parts.push(`Firma: ${structured.firma}`)
      if (structured.problema) parts.push(`Problema: ${structured.problema}`)
      if (structured.email) parts.push(`Email: ${structured.email}`)
      if (structured.disponibilitate) parts.push(`Disponibilitate: ${structured.disponibilitate}`)
      motiv = parts.join(' | ') || structured.motiv || 'Nedefinit'
    }

    const departament = serviciu ? getDepartament(serviciu) : ''

    let specialistComplet = specialist
    if (specialist) {
      const gasit = ECHIPA.find(m =>
        m.nume.toLowerCase().startsWith(specialist.toLowerCase()) ||
        m.nume.toLowerCase() === specialist.toLowerCase()
      )
      if (gasit) specialistComplet = gasit.nume
    }

    const notionProperties: any = {
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
    }

    if (serviciu) {
      notionProperties['Serviciu'] = {
        rich_text: [{ text: { content: serviciu } }],
      }
    }

    if (specialistComplet) {
      notionProperties['Specialist'] = {
        select: { name: specialistComplet },
      }
    }

    if (departament) {
      notionProperties['Departament'] = {
        select: { name: departament },
      }
    }

    if (data) {
      const dataISO = parseDataRomana(data)
      if (dataISO) {
        notionProperties['Data programare'] = {
          date: { start: dataISO },
        }
      } else {
        notionProperties['Data programare'] = {
          rich_text: [{ text: { content: data } }],
        }
      }
    }

    if (ora) {
      notionProperties['Ora programare'] = {
        rich_text: [{ text: { content: ora } }],
      }
    }

    await notion.pages.create({
      parent: { database_id: process.env.NOTION_DATABASE_ID! },
      properties: notionProperties,
    })

    await sendElevenLabsWhatsApp(telefon, nume, serviciu, data, ora)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// ─── PATCH - modificare programare existenta ───────────────────────────────

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Modificare programare:', JSON.stringify(body))

    const { telefon, serviciu, data, ora, nume, specialist } = body

    if (!telefon) {
      return NextResponse.json({ error: 'Telefon lipsa' }, { status: 400 })
    }

    const programareExistenta = await gasesteProgramareByTelefon(telefon)

    if (!programareExistenta) {
      return NextResponse.json({ error: 'Programare negasita' }, { status: 404 })
    }

    const parts = []
    if (serviciu) parts.push(`Serviciu: ${serviciu}`)
    if (specialist) parts.push(`Specialist: ${specialist}`)
    if (data) parts.push(`Data: ${data}`)
    if (ora) parts.push(`Ora: ${ora}`)
    const motivNou = parts.join(' | ') || 'Nedefinit'

    const updateProperties: any = {
      'Motiv apel': {
        rich_text: [{ text: { content: motivNou } }],
      },
      'Status': {
        select: { name: 'Modificat' },
      },
    }

    if (serviciu) {
      updateProperties['Serviciu'] = {
        rich_text: [{ text: { content: serviciu } }],
      }
      updateProperties['Departament'] = {
        select: { name: getDepartament(serviciu) },
      }
    }

    if (specialist) {
      const gasit = ECHIPA.find(m =>
        m.nume.toLowerCase().startsWith(specialist.toLowerCase()) ||
        m.nume.toLowerCase() === specialist.toLowerCase()
      )
      updateProperties['Specialist'] = {
        select: { name: gasit ? gasit.nume : specialist },
      }
    }

    if (data) {
      const dataISOPatch = parseDataRomana(data)
      if (dataISOPatch) {
        updateProperties['Data programare'] = {
          date: { start: dataISOPatch },
        }
      } else {
        updateProperties['Data programare'] = {
          rich_text: [{ text: { content: data } }],
        }
      }
    }

    if (ora) {
      updateProperties['Ora programare'] = {
        rich_text: [{ text: { content: ora } }],
      }
    }

    await notion.pages.update({
      page_id: programareExistenta.id,
      properties: updateProperties,
    })

    const numeClient = nume || 'Client'
    await sendElevenLabsWhatsApp(telefon, numeClient, serviciu, data, ora)

    return NextResponse.json({ ok: true, message: 'Programare modificata' })
  } catch (error) {
    console.error('Modificare error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}