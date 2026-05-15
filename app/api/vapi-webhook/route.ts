import { Client } from '@notionhq/client'
import { NextRequest, NextResponse } from 'next/server'

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
})

// ─── Mapare servicii → departament ────────────────────────────────────────

function getDepartament(serviciu: string): string {
  const s = serviciu.toLowerCase()

  const hair = [
    'tuns', 'haircut', 'vârfuri', 'varfuri', 'trimming', 'uscat', 'breton', 'barbă', 'barba',
    'coafat', 'coafură', 'coafura', 'blowdry', 'împletitură', 'impletitura', 'braiding',
    'bucle', 'waves', 'coc', 'bun', 'updo', 'mireasă', 'mireasa', 'bridal',
    'kerastase', 'keratermie', 'keratină', 'keratina', 'keratin', 'fiolă', 'fiola', 'ampoule',
    'scalp', 'decolorat', 'bleaching', 'decapaj', 'suvițe', 'suvite', 'highlights',
    'foilyage', 'balayage', 'airtouch', 'vopsit', 'coloring', 'nuanțare', 'nuantare',
    'toner', 'cover', 'sprâncene vopsit', 'spălat', 'spalat', 'washing', 'ritual',
    'îngrijire păr', 'ingrijire par',
  ]

  const nails = [
    'manichiură', 'manichiura', 'manicure', 'pedichiură', 'pedichiura', 'pedicure',
    'semipermanentă', 'semipermanenta', 'semipermanent', 'ojă', 'oja', 'gel', 'tips',
    'unghii', 'unghie', 'întreținere unghii', 'intretinere unghii',
  ]

  const beauty = [
    'tratament facial', 'tratament față', 'tratament fata', 'curățare', 'curatare',
    'ultrasunete', 'rf', 'led', 'hidradermoabraziune', 'microdermoabraziune',
    'anti-rid', 'depigmentare', 'oxigenare', 'microneedeling', 'plasma',
    'epilat', 'epilare', 'epilație', 'epilatie', 'ipl', 'bikini', 'brațe', 'brate',
    'axilă', 'axila', 'mustață', 'mustata', 'toplip', 'picioare',
    'anticelulitic', 'drenaj limfatic', 'tonifiere', 'bust',
    'extensii gene', 'gene', 'machiaj', 'makeup', 'fotoregenerare',
    'sprâncene', 'sprancene', 'pensat', 'reconstrucție sprâncene',
  ]

  if (hair.some(k => s.includes(k))) return 'Hair'
  if (nails.some(k => s.includes(k))) return 'Nails'
  if (beauty.some(k => s.includes(k))) return 'Beauty'
  return 'Hair' // fallback
}

// ─── Lista echipă cu departament ──────────────────────────────────────────

const ECHIPA: { nume: string; departament: string }[] = [
  // Hair
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
  // Nails
  { nume: 'Gabriela Tudor', departament: 'Nails' },
  { nume: 'Magda Oceanu', departament: 'Nails' },
  { nume: 'Adina Nistor', departament: 'Nails' },
  { nume: 'Mariana Luca', departament: 'Nails' },
  // Beauty
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

  // Folosim timezone Romania (+3) pentru a evita probleme cu UTC
  const aziRo = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Bucharest' }))
  const an = aziRo.getFullYear()

  function formatData(d: Date): string {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const zi = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${zi}`
  }

  const s = data.toLowerCase().trim()

  if (s === 'azi' || s === 'astazi' || s === 'astăzi' || s === 'today') {
    return formatData(aziRo)
  }

  if (s === 'maine' || s === 'mâine' || s === 'tomorrow') {
    const maine = new Date(aziRo)
    maine.setDate(aziRo.getDate() + 1)
    return formatData(maine)
  }

  if (s === 'poimaine' || s === 'poimâine') {
    const poi = new Date(aziRo)
    poi.setDate(aziRo.getDate() + 2)
    return formatData(poi)
  }

  // Format: "16 mai" sau "16 mai 2026"
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
// Dacă prenumele e unic în lista de disponibili → doar prenume
// Dacă se dublează → nume complet

function formateazaNume(numeComplet: string, totiDisponibilii: string[]): string {
  const prenume = numeComplet.split(' ')[0]
  const dubluri = totiDisponibilii.filter(n => n.split(' ')[0] === prenume)
  return dubluri.length > 1 ? numeComplet : prenume
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
    const data = searchParams.get('data') // ex: "16 mai"
    const ora = searchParams.get('ora')   // ex: "12:00"
    const serviciu = searchParams.get('serviciu') // ex: "tuns"

    if (!data || !ora || !serviciu) {
      return NextResponse.json({ error: 'Parametri lipsă: data, ora, serviciu' }, { status: 400 })
    }

    const departament = getDepartament(serviciu)

    // ─── Sloturi fixe 10:00 - 19:00 din 45 în 45 minute ──────────────────
    const SLOTURI_FIXE: number[] = []
    for (let min = 10 * 60; min + 45 <= 19 * 60; min += 45) {
      SLOTURI_FIXE.push(min)
    }

    function oraInMinuteGlobal(oraStr: string): number {
      const [h, m] = oraStr.split(':').map(Number)
      return h * 60 + (m || 0)
    }

    function minuteInOra(min: number): string {
      const h = Math.floor(min / 60).toString().padStart(2, '0')
      const m = (min % 60).toString().padStart(2, '0')
      return `${h}:${m}`
    }

    // Verifică dacă e azi și filtrează sloturile din trecut
    const aziISO = parseDataRomana('azi')
    const dataISO = parseDataRomana(data) || data
    const eAzi = dataISO === aziISO

    // Ora curentă în Romania
    const acumRo = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Bucharest' }))
    const oraAcumMin = acumRo.getHours() * 60 + acumRo.getMinutes()

    // Sloturile disponibile — exclude trecutul dacă e azi
    const SLOTURI_DISPONIBILE = eAzi
      ? SLOTURI_FIXE.filter(s => s > oraAcumMin)
      : SLOTURI_FIXE

    // Verifică dacă ora cerută e un slot valid și nu e în trecut
    const oraCerutaMin = oraInMinuteGlobal(ora)
    const eSlotValid = SLOTURI_DISPONIBILE.includes(oraCerutaMin)

    // Dacă nu e slot valid, găsim cel mai apropiat slot DISPONIBIL
    let celMaiApropiateSlot: string | null = null
    if (!eSlotValid) {
      if (SLOTURI_DISPONIBILE.length === 0) {
        celMaiApropiateSlot = null // Nu mai sunt sloturi azi
      } else {
        let minDif = Infinity
        for (const slot of SLOTURI_DISPONIBILE) {
          const dif = Math.abs(slot - oraCerutaMin)
          if (dif < minDif) {
            minDif = dif
            celMaiApropiateSlot = minuteInOra(slot)
          }
        }
      }
    }

    // Interoghează Notion pentru programările existente la data și ora cerute
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
            date: { equals: parseDataRomana(data) || data },
          },
        }),
      }
    )

    const notionData = await response.json()
    const programariExistente = notionData.results || []

    console.log('=== VERIFICARE DISPONIBILITATE ===')
    console.log('Data ceruta:', data, '-> ISO:', parseDataRomana(data))
    console.log('Ora ceruta:', ora)
    console.log('Serviciu:', serviciu, '-> Departament:', departament)
    console.log('Programari gasite in Notion:', programariExistente.length)
    programariExistente.forEach((p: any) => {
      console.log('  -', 
        p.properties?.['Specialist']?.select?.name,
        'ora:', p.properties?.['Ora programare']?.rich_text?.[0]?.text?.content,
        'data:', p.properties?.['Data programare']?.date?.start
      )
    })

    const oraCeruta = oraInMinuteGlobal(ora)
    const DURATA = 45 // minute
    function oraInMinute(oraStr: string): number {
      return oraInMinuteGlobal(oraStr)
    }

    // Specialiștii ocupați — verificăm overlap cu interval ±45 minute
    const ocupati: string[] = programariExistente
      .map((p: any) => {
        const specialist = p.properties?.['Specialist']?.select?.name || ''
        const oraProg = p.properties?.['Ora programare']?.rich_text?.[0]?.text?.content || ''
        if (!specialist || !oraProg) return null
        const oraProgMin = oraInMinute(oraProg)
        // Overlap dacă |oraCeruta - oraProg| < DURATA
        if (Math.abs(oraCeruta - oraProgMin) < DURATA) return specialist
        return null
      })
      .filter(Boolean)

    // Filtrează echipa după departament și exclude ocupații
    const disponibili = ECHIPA
      .filter(m => m.departament === departament)
      .filter(m => !ocupati.includes(m.nume))
      .map(m => m.nume)

    // Formatează numele pentru agentul vocal
    const numeFormatate = disponibili.map(n => formateazaNume(n, disponibili))

    // Dacă s-a cerut un specialist specific, verificăm dacă e liber
    // și dacă nu, găsim primul slot liber pentru el în ziua respectivă
    const specialistCerut = searchParams.get('specialist') || ''
    let specialistCerutLiber = true
    let urmatorSlotLiber: string | null = null

    if (specialistCerut) {
      // Verificăm dacă specialistul cerut e în lista ocupați
      const specialistCompletCerut = ECHIPA.find(m =>
        m.nume.toLowerCase().includes(specialistCerut.toLowerCase()) ||
        specialistCerut.toLowerCase().includes(m.nume.split(' ')[0].toLowerCase())
      )

      if (specialistCompletCerut) {
        specialistCerutLiber = !ocupati.includes(specialistCompletCerut.nume)

        if (!specialistCerutLiber) {
          // Găsim toate programările specialistului în ziua respectivă
          const programariSpecialist = programariExistente
            .filter((p: any) => {
              const spec = p.properties?.['Specialist']?.select?.name || ''
              return spec === specialistCompletCerut.nume
            })
            .map((p: any) => {
              const oraProg = p.properties?.['Ora programare']?.rich_text?.[0]?.text?.content || ''
              return oraInMinute(oraProg)
            })
            .filter((m: number) => m > 0)

          // Folosim doar sloturi disponibile (exclude trecutul dacă e azi)
          const sloturi = SLOTURI_DISPONIBILE

          // Găsim cel mai apropiat slot liber — mai întâi după ora cerută, apoi înainte
          const sloturiDupa = sloturi.filter(s => s > oraCeruta)
          const sloturiInainte = sloturi.filter(s => s < oraCeruta && s > oraAcumMin).reverse()
          const ordineCautare = [...sloturiDupa, ...sloturiInainte]

          for (const slot of ordineCautare) {
            const eOcupat = programariSpecialist.some((p: number) => Math.abs(slot - p) < DURATA)
            if (!eOcupat) {
              const h = Math.floor(slot / 60).toString().padStart(2, '0')
              const m = (slot % 60).toString().padStart(2, '0')
              urmatorSlotLiber = `${h}:${m}`
              break
            }
          }
        }
      }
    }

    return NextResponse.json({
      disponibili: numeFormatate,
      disponibili_complet: disponibili,
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

    // Găsește numele complet al specialistului din echipă (pentru câmpul Select din Notion)
    let specialistComplet = specialist
    if (specialist) {
      const gasit = ECHIPA.find(m =>
        m.nume.toLowerCase().startsWith(specialist.toLowerCase()) ||
        m.nume.toLowerCase() === specialist.toLowerCase()
      )
      if (gasit) specialistComplet = gasit.nume
    }

    // Proprietăți Notion
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

// ─── PATCH - modificare programare existentă ───────────────────────────────

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Modificare programare:', JSON.stringify(body))

    const { telefon, serviciu, data, ora, nume, specialist } = body

    if (!telefon) {
      return NextResponse.json({ error: 'Telefon lipsă' }, { status: 400 })
    }

    const programareExistenta = await gasesteProgramareByTelefon(telefon)

    if (!programareExistenta) {
      return NextResponse.json({ error: 'Programare negăsită' }, { status: 404 })
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

    return NextResponse.json({ ok: true, message: 'Programare modificată' })
  } catch (error) {
    console.error('Modificare error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}