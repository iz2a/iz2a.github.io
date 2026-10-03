import { NextRequest, NextResponse } from 'next/server'
import { createAuthClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const { client, user } = await createAuthClient(authHeader)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { content, framework_id, control_ref, controlTitle, docType, organization, format = 'docx', saveToEvidence } = body
    if (!content) return NextResponse.json({ error: 'No content' }, { status: 400 })

    let buf: Buffer
    let mimeType: string
    let ext: string

    if (format === 'pdf') {
      buf = await buildPdf({ content, framework_id, control_ref, controlTitle, docType, organization })
      mimeType = 'application/pdf'
      ext = 'pdf'
    } else {
      buf = await buildDocx({ content, framework_id, control_ref, controlTitle, docType, organization })
      mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ext = 'docx'
    }

    const fileName = `MIRSAD-${framework_id}-${control_ref}-${docType}.${ext}`.replace(/[^a-zA-Z0-9._-]/g, '-')

    if (saveToEvidence) {
      try {
        const { data: profile } = await client.from('profiles').select('organization_id').eq('id', user.id).single()
        const orgId = (profile as any)?.organization_id
        if (orgId) {
          const storagePath = `${orgId}/${framework_id}/${Date.now()}-${fileName}`
          const { error: upErr } = await client.storage.from('evidence').upload(storagePath, buf, { contentType: mimeType, upsert: false })
          if (!upErr) {
            const { data: urlData } = client.storage.from('evidence').getPublicUrl(storagePath)
            await client.from('evidence_files').insert({
              organization_id: orgId, framework_id, control_ref,
              description: `AI-generated ${docType.replace(/_/g, ' ')}: ${controlTitle}`,
              file_name: fileName, file_url: urlData?.publicUrl || null,
              file_size: buf.length, file_type: mimeType, uploaded_by: user.id,
            } as any)
          }
        }
      } catch (saveErr: any) { console.error('[export] save err:', saveErr?.message) }
    }

    return NextResponse.json({ success: true, data: buf.toString('base64'), fileName, mimeType })

  } catch (err: any) {
    console.error('[export] ERROR:', err?.message, err?.stack?.slice(0, 500))
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 })
  }
}

// ── Constants ──────────────────────────────────────────────────────────────────
const FW: Record<string,string> = {
  NCA_ECC:'NCA Essential Cybersecurity Controls (ECC) v2.0',
  NCA_DCC:'NCA Data Cybersecurity Controls (DCC) v1.0',
  SAMA_CSF:'SAMA Cyber Security Framework (CSF) v1.0',
  ISO_27001:'ISO/IEC 27001:2022',
  NIST_CSF:'NIST Cybersecurity Framework 2.0',
}
const DN: Record<string,string> = {
  policy:'Policy Document', procedure:'Operational Procedure',
  evidence_checklist:'Evidence Checklist', implementation_guide:'Implementation Guide',
}

// Strip markdown bold, keep text
const strip = (t: string) => t.replace(/\*\*([^*]+)\*\*/g,'$1')

// Remove Arabic characters for PDF (jsPDF can't render them without embedded font)
// Keeps the English translation if present on same line after a colon or dash
const stripArabic = (text: string): string => {
  // If line has both Arabic and English, keep only English parts
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+/g
  return text.replace(arabicRegex, '').replace(/\s{2,}/g, ' ').trim()
}

// Check if string contains Arabic
const hasArabic = (text: string) => /[\u0600-\u06FF]/.test(text)

// For lines that are purely Arabic with no English, extract English equivalent from next line
const cleanLineForPdf = (line: string): string => {
  const cleaned = stripArabic(line)
  // If nothing left after stripping, return empty
  if (!cleaned || cleaned.replace(/[^a-zA-Z0-9]/g,'').length < 2) return ''
  return cleaned
}

// ── DOCX (full Unicode / Arabic support) ──────────────────────────────────────
async function buildDocx(p: {
  content:string; framework_id:string; control_ref:string;
  controlTitle:string; docType:string; organization:string
}): Promise<Buffer> {
  const { content, framework_id, control_ref, controlTitle, docType, organization } = p
  const {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
    ShadingType, VerticalAlign, PageNumber, PageBreak, TabStopType, TabStopPosition,
    ImageRun,
  } = require('docx')

  const fwName  = FW[framework_id] || framework_id
  const docName = DN[docType]      || docType
  const today   = new Date().toISOString().slice(0,10)
  const nextYear= new Date(Date.now()+365*24*60*60*1000).toISOString().slice(0,10)
  const docRef  = `${docType.slice(0,3).toUpperCase()}-${control_ref.replace(/[.-]/g,'-')}-001`

  // Theme colors
  const C = {
    navyDark: '1a1d20',  // page background match
    navy:     '212529',  // card background
    blue:     '495057',  // primary blue
    blueLight:'adb5bd',  // accent cyan
    blueMid:  '343a40',  // darker blue
    teal:     '6c757d',
    white:    'f8f9fa',
    gray:     '6c757d',
    grayDark: '1F2937',
    grayLine: '3d4247',  // border color matching theme
    grayBg:   '1a1d20',  // input background
    success:  '10B981',
  }

  const bdr = (color=C.grayLine, size=4) => ({ style:BorderStyle.SINGLE, size, color })
  const bs  = (c=C.grayLine) => ({ top:bdr(c), bottom:bdr(c), left:bdr(c), right:bdr(c) })
  const nob = { style:BorderStyle.NONE, size:0, color:C.navy }
  const nbs = () => ({ top:nob, bottom:nob, left:nob, right:nob })

  // Header cell: navy bg, white text
  const hc = (text:string, w:number) => new TableCell({
    borders:bs(C.blue), width:{size:w,type:WidthType.DXA},
    shading:{fill:C.navy,type:ShadingType.CLEAR},
    margins:{top:120,bottom:120,left:180,right:180},
    verticalAlign:VerticalAlign.CENTER,
    children:[new Paragraph({alignment:AlignmentType.LEFT,children:[
      new TextRun({text,font:'Calibri',size:20,bold:true,color:C.blueLight})
    ]})]
  })

  // Data cell
  const dc = (text:string, w:number, shade?:string, bold=false, clr=C.white) => new TableCell({
    borders:bs(C.grayLine), width:{size:w,type:WidthType.DXA},
    shading:shade?{fill:shade,type:ShadingType.CLEAR}:undefined,
    margins:{top:100,bottom:100,left:180,right:180},
    verticalAlign:VerticalAlign.CENTER,
    children:[new Paragraph({children:[
      new TextRun({text:String(text||'-'),font:'Calibri',size:20,bold,color:clr})
    ]})]
  })

  const mkHdr = (l:string, r:string) => new Header({ children:[
    new Paragraph({
      border:{bottom:{style:BorderStyle.SINGLE,size:6,color:C.blue,space:4}},
      tabStops:[{type:TabStopType.RIGHT,position:TabStopPosition.MAX}],
      spacing:{after:0},
      children:[
        new TextRun({text:l, font:'Calibri', size:18, color:C.gray}),
        new TextRun({text:'\t'}),
        new TextRun({text:r, font:'Calibri', size:18, color:C.blue, bold:true}),
      ]
    })
  ]})

  const mkFtr = (l:string) => new Footer({ children:[
    new Paragraph({
      border:{top:{style:BorderStyle.SINGLE,size:6,color:C.blue,space:4}},
      tabStops:[{type:TabStopType.RIGHT,position:TabStopPosition.MAX}],
      spacing:{before:0},
      children:[
        new TextRun({text:l, font:'Calibri', size:18, color:C.gray}),
        new TextRun({text:'\t'}),
        new TextRun({text:'Page ', font:'Calibri', size:18, color:C.gray}),
        new TextRun({children:[PageNumber.CURRENT], font:'Calibri', size:18, color:C.blue}),
        new TextRun({text:' of ', font:'Calibri', size:18, color:C.gray}),
        new TextRun({children:[PageNumber.TOTAL_PAGES], font:'Calibri', size:18, color:C.gray}),
      ]
    })
  ]})

  const pi = (text:string) => text.split(/\*\*([^*]+)\*\*/).map((x,j) =>
    new TextRun({text:x, font:'Calibri', size:22, bold:j%2===1, color:j%2===1?C.blueLight:C.white})
  )

  const metaT = (rows:[string,string][]) => new Table({
    width:{size:9026,type:WidthType.DXA}, columnWidths:[2800,6226],
    rows: rows.map(([k,v],i) => new TableRow({children:[
      dc(k, 2800, i%2===0?'0D1530':'1a1d20', true, C.blueLight),
      dc(v, 6226, i%2===0?'1a1d20':'0A0F1E', false, C.white),
    ]}))
  })

  const tocEntries = () => {
    const e:any[] = []; let n = 0
    for (const l of content.split('\n')) {
      if (l.startsWith('## ')) { n++; e.push(new Paragraph({spacing:{before:80,after:40}, children:[new TextRun({text:`${n}.  ${strip(l.slice(3))}`, font:'Calibri', size:22, color:C.white})]}))
      } else if (l.startsWith('### ')) { e.push(new Paragraph({spacing:{before:30,after:20}, indent:{left:360}, children:[new TextRun({text:strip(l.slice(4)), font:'Calibri', size:20, color:C.gray})]})) }
    }
    return e.length ? e : [new Paragraph({children:[new TextRun({text:'-', font:'Calibri', size:20, color:C.gray, italics:true})]})]
  }

  const parseBody = () => {
    const out:any[] = []
    const skip = ['**Document Reference:**','**Version:**','**Classification:**','**Effective Date:**','**Owner:**','**Next Review:**','**Framework:**','**Organization:**','**Control:**','**Approved By:**','**Process Owner:**','**Regulatory Reference:**','**Control Reference:**','**Assessor:**','**Assessment Date:**','**Difficulty:**','**Estimated Effort:**']
    const lines = content.split('\n'); let i = 0
    while (i < lines.length) {
      const l = lines[i]
      if (skip.some(s=>l.startsWith(s)) || l==='---') { i++; continue }
      if (l.startsWith('# ') && i < 4) { i++; continue }

      if (l.startsWith('# ')) {
        out.push(new Paragraph({heading:HeadingLevel.HEADING_1, spacing:{before:480,after:160},
          children:[new TextRun({text:strip(l.slice(2)), font:'Calibri', size:36, bold:true, color:C.blueLight})]}))
        i++; continue
      }
      if (l.startsWith('## ')) {
        out.push(new Paragraph({heading:HeadingLevel.HEADING_2, spacing:{before:360,after:120},
          border:{bottom:{style:BorderStyle.SINGLE,size:6,color:C.blue,space:2}},
          children:[new TextRun({text:strip(l.slice(3)), font:'Calibri', size:28, bold:true, color:C.blue})]}))
        i++; continue
      }
      if (l.startsWith('### ')) {
        out.push(new Paragraph({heading:HeadingLevel.HEADING_3, spacing:{before:240,after:80},
          children:[new TextRun({text:strip(l.slice(4)), font:'Calibri', size:24, bold:true, color:C.teal})]}))
        i++; continue
      }

      // Table
      if (l.startsWith('| ')) {
        const tl:string[] = []
        while (i < lines.length && lines[i].startsWith('| ')) { tl.push(lines[i]); i++ }
        const rows = tl.filter(r => !r.match(/^\|[-:\s|]+\|$/))
        if (rows.length >= 1) {
          const pr = (r:string) => r.split('|').filter((_,ix,a)=>ix>0&&ix<a.length-1).map(c=>c.trim())
          const cc = pr(rows[0]).length; const tw = 9026; const cw = Math.floor(tw/cc)
          const cws = Array(cc).fill(cw)
          out.push(new Table({width:{size:tw,type:WidthType.DXA}, columnWidths:cws,
            rows: rows.map((r,ri) => new TableRow({tableHeader:ri===0, children:
              pr(r).map((cell,ci) => ri===0 ? hc(cell,cws[ci]) : dc(cell,cws[ci], ri%2===1?'0A0F1E':'1a1d20'))
            }))
          }))
          out.push(new Paragraph({spacing:{after:160},children:[]}))
        }
        continue
      }

      if (l.match(/^[-*] /)) {
        out.push(new Paragraph({numbering:{reference:'bullets',level:0}, spacing:{before:40,after:40}, children:pi(l.slice(2))}))
        i++; continue
      }
      if (l.match(/^\d+\. /)) {
        out.push(new Paragraph({numbering:{reference:'numbers',level:0}, spacing:{before:40,after:40}, children:pi(l.replace(/^\d+\. /,''))}))
        i++; continue
      }
      if (!l.trim()) { out.push(new Paragraph({spacing:{after:80},children:[]})); i++; continue }
      out.push(new Paragraph({spacing:{before:40,after:80}, children:pi(l)}))
      i++
    }
    return out
  }

  const hdrStr = `${control_ref}  -  ${controlTitle}`
  const ftrStr = `${docRef}  ·  ${docName}  ·  CONFIDENTIAL`

  const doc = new Document({
    numbering:{config:[
      {reference:'bullets', levels:[{level:0,format:'bullet',text:'•',alignment:'left',style:{paragraph:{indent:{left:720,hanging:360}}}}]},
      {reference:'numbers', levels:[{level:0,format:'decimal',text:'%1.',alignment:'left',style:{paragraph:{indent:{left:720,hanging:360}}}}]},
    ]},
    styles:{
      default:{document:{run:{font:'Calibri',size:22,color:'f8f9fa'}}},
      paragraphStyles:[
        {id:'Heading1',name:'Heading 1',basedOn:'Normal',next:'Normal',quickFormat:true,
          run:{size:36,bold:true,font:'Calibri',color:'adb5bd'},
          paragraph:{spacing:{before:480,after:160},outlineLevel:0}},
        {id:'Heading2',name:'Heading 2',basedOn:'Normal',next:'Normal',quickFormat:true,
          run:{size:28,bold:true,font:'Calibri',color:'495057'},
          paragraph:{spacing:{before:360,after:120},outlineLevel:1}},
        {id:'Heading3',name:'Heading 3',basedOn:'Normal',next:'Normal',quickFormat:true,
          run:{size:24,bold:true,font:'Calibri',color:'6c757d'},
          paragraph:{spacing:{before:240,after:80},outlineLevel:2}},
      ]
    },
    sections:[
      // ── COVER PAGE ────────────────────────────────────────────────────────
      {
        properties:{page:{size:{width:11906,height:16838},margin:{top:0,right:0,bottom:0,left:0}}},
        children:[
          // Full dark navy background header band
          new Table({width:{size:11906,type:WidthType.DXA},columnWidths:[11906],rows:[new TableRow({children:[
            new TableCell({borders:nbs(),width:{size:11906,type:WidthType.DXA},
              shading:{fill:'1a1d20',type:ShadingType.CLEAR},
              margins:{top:1600,bottom:1200,left:1440,right:1440},
              children:[
                // Logo text: MIRSAD
                new Paragraph({spacing:{after:60},children:[
                  new TextRun({text:'◉ ', font:'Calibri', size:48, color:C.blueLight}),
                  new TextRun({text:'MIRSAD', font:'Calibri', size:96, bold:true, color:C.white}),
                ]}),
                new Paragraph({spacing:{after:40},children:[
                  new TextRun({text:'مِرصاد  ·  The Watchtower', font:'Calibri', size:28, color:'adb5bd'}),
                ]}),
                new Paragraph({spacing:{after:0},children:[
                  new TextRun({text:'Cybersecurity GRC Platform  ·  National Cybersecurity Authority Suite', font:'Calibri', size:22, color:'6c757d'}),
                ]}),
              ]
            })
          ]})]})
          ,
          // Blue accent stripe + title block
          new Table({width:{size:11906,type:WidthType.DXA},columnWidths:[480,11426],rows:[new TableRow({children:[
            new TableCell({borders:nbs(),width:{size:480,type:WidthType.DXA},
              shading:{fill:'495057',type:ShadingType.CLEAR},children:[new Paragraph({children:[]})]}),
            new TableCell({borders:nbs(),width:{size:11426,type:WidthType.DXA},
              shading:{fill:'1a1d20',type:ShadingType.CLEAR},
              margins:{top:1000,bottom:1000,left:1440,right:1440},
              children:[
                new Paragraph({spacing:{after:80},children:[
                  new TextRun({text:docName.toUpperCase(), font:'Calibri', size:20, bold:true, color:C.blue, characterSpacing:120}),
                ]}),
                new Paragraph({spacing:{after:160},children:[
                  new TextRun({text:controlTitle, font:'Calibri', size:60, bold:true, color:C.white}),
                ]}),
                new Paragraph({spacing:{after:80},children:[
                  new TextRun({text:'Control Reference: ', font:'Calibri', size:24, bold:true, color:C.gray}),
                  new TextRun({text:control_ref, font:'Calibri', size:24, bold:true, color:C.blueLight}),
                ]}),
                new Paragraph({spacing:{after:0},children:[
                  new TextRun({text:fwName, font:'Calibri', size:22, color:'6c757d'}),
                ]}),
              ]
            }),
          ]})]})
          ,
          // Document info tables
          new Table({width:{size:11906,type:WidthType.DXA},columnWidths:[11906],rows:[new TableRow({children:[
            new TableCell({borders:nbs(),width:{size:11906,type:WidthType.DXA},
              shading:{fill:'1a1d20',type:ShadingType.CLEAR},
              margins:{top:1000,bottom:1000,left:1440,right:1440},
              children:[
                new Paragraph({spacing:{after:200},children:[
                  new TextRun({text:'Document Information', font:'Calibri', size:28, bold:true, color:C.blueLight}),
                ]}),
                metaT([
                  ['Organization',   organization],
                  ['Doc Reference',  docRef],
                  ['Document Type',  docName],
                  ['Version',        '1.0 - Draft'],
                  ['Effective Date', today],
                  ['Next Review',    nextYear],
                  ['Classification', 'CONFIDENTIAL - Internal Use Only'],
                  ['Owner',          'Chief Information Security Officer (CISO)'],
                  ['Approved By',    '______________________________'],
                ]),
                new Paragraph({spacing:{before:700,after:200},children:[
                  new TextRun({text:'Regulatory Reference', font:'Calibri', size:28, bold:true, color:C.blueLight}),
                ]}),
                metaT([
                  ['Framework',   fwName],
                  ['Control Ref', control_ref],
                  ['Control',     controlTitle],
                ]),
                new Paragraph({spacing:{before:900},alignment:AlignmentType.CENTER,
                  border:{top:{style:BorderStyle.SINGLE,size:4,color:'3d4247',space:8}},
                  children:[new TextRun({text:'CLASSIFICATION: CONFIDENTIAL - FOR INTERNAL USE ONLY', font:'Calibri', size:18, bold:true, color:'6c757d', characterSpacing:60})],
                }),
              ]
            })
          ]})]})
        ]
      },
      // ── TOC ──────────────────────────────────────────────────────────────
      {
        properties:{page:{size:{width:11906,height:16838},margin:{top:1440,right:1260,bottom:1440,left:1260},pageNumbers:{start:1}}},
        headers:{default:mkHdr(hdrStr, organization)},
        footers:{default:mkFtr(ftrStr)},
        children:[
          new Paragraph({heading:HeadingLevel.HEADING_1, spacing:{before:0,after:240},
            children:[new TextRun({text:'Table of Contents', font:'Calibri', size:36, bold:true, color:C.blueLight})]}),
          new Paragraph({spacing:{after:160}, children:[
            new TextRun({text:'In Word: press Ctrl+A then F9 to update page numbers.', font:'Calibri', size:18, color:C.gray, italics:true})
          ]}),
          ...tocEntries(),
          new Paragraph({children:[new PageBreak()]}),
        ]
      },
      // ── BODY ─────────────────────────────────────────────────────────────
      {
        properties:{page:{size:{width:11906,height:16838},margin:{top:1440,right:1260,bottom:1440,left:1260}}},
        headers:{default:mkHdr(hdrStr, organization)},
        footers:{default:mkFtr(ftrStr)},
        children: parseBody(),
      },
    ]
  })

  return Packer.toBuffer(doc)
}

// ── PDF builder ────────────────────────────────────────────────────────────────
async function buildPdf(p: {
  content:string; framework_id:string; control_ref:string;
  controlTitle:string; docType:string; organization:string
}): Promise<Buffer> {
  const { content, framework_id, control_ref, controlTitle, docType, organization } = p
  const jsPDFMod = require('jspdf')
  const jsPDF = jsPDFMod.jsPDF || jsPDFMod.default?.jsPDF || jsPDFMod
  require('jspdf-autotable')

  const fwName  = FW[framework_id] || framework_id
  const docName = DN[docType]      || docType
  const today   = new Date().toISOString().slice(0,10)
  const nextYear= new Date(Date.now()+365*24*60*60*1000).toISOString().slice(0,10)
  const docRef  = `${docType.slice(0,3).toUpperCase()}-${control_ref.replace(/[.-]/g,'-')}-001`

  // Theme RGB colors matching MIRSAD
  type RGB = [number,number,number]
  const NAVY:    RGB = [26,  29,  32]   // #050810
  const CARD:    RGB = [33,  37,  41]   // #0C1128
  const BLUE:    RGB = [73,  80,  87]  // #2563EB
  const CYAN:    RGB = [173,181,189]  // #38BDF8
  const DARK:    RGB = [26,  29,  32]   // #080C18
  const WHITE:   RGB = [248,249,250]   // #F0F4FF
  const GRAY:    RGB = [108,117,125]   // #94A3B8
  const BORDER:  RGB = [61,  66,  71]   // #1A2340
  const TEAL:    RGB = [108,117,125]   // #0891B2
  const LGRAY:   RGB = [73,  80,  87]   // #334155

  const pdf = new jsPDF({orientation:'portrait', unit:'mm', format:'a4'})
  const PW=210, PH=297, ML=20, MR=20, MT=20, CW=PW-ML-MR
  let pg = 1

  const sc  = (r:RGB) => pdf.setTextColor(r[0],r[1],r[2])
  const sf  = (r:RGB) => pdf.setFillColor(r[0],r[1],r[2])
  const sd  = (r:RGB) => pdf.setDrawColor(r[0],r[1],r[2])
  const AT  = (pdf as any).autoTable.bind(pdf)

  // Draw radar logo (SVG primitives)
  const drawLogo = (x:number, y:number, size=14) => {
    const cx = x + size/2, cy = y + size/2, r = size/2
    // Outer dashed ring
    sd(BLUE); pdf.setLineWidth(0.4)
    pdf.circle(cx, cy, r*0.85, 'S')
    // Inner ring
    sd(CYAN); pdf.setLineWidth(0.5)
    pdf.circle(cx, cy, r*0.45, 'S')
    // Center dot
    sf(CYAN); pdf.circle(cx, cy, r*0.12, 'F')
    // Crosshairs
    sd(BLUE); pdf.setLineWidth(0.35)
    pdf.line(cx, cy-r, cx, cy-r*0.55)  // top
    pdf.line(cx, cy+r*0.55, cx, cy+r)  // bottom
    pdf.line(cx-r, cy, cx-r*0.55, cy)  // left
    pdf.line(cx+r*0.55, cy, cx+r, cy)  // right
    // Sweep line
    sd(CYAN); pdf.setLineWidth(0.4)
    pdf.line(cx, cy, cx+r*0.7, cy-r*0.7)
  }

  const addHdr = () => {
    sf(CARD); pdf.rect(0,0,PW,14,'F')
    drawLogo(ML, 1, 11)
    sc(GRAY); pdf.setFontSize(8); pdf.setFont('helvetica','normal')
    pdf.text(`${control_ref}  -  ${controlTitle}`, ML+14, 8, {maxWidth: CW-40})
    sc(BLUE); pdf.setFontSize(8); pdf.setFont('helvetica','bold')
    pdf.text(organization, PW-MR, 8, {align:'right'})
    sd(BLUE); pdf.setLineWidth(0.5); pdf.line(0,14,PW,14)
  }

  const addFtr = () => {
    sd(BLUE); pdf.setLineWidth(0.5); pdf.line(0,PH-12,PW,PH-12)
    sf(CARD); pdf.rect(0,PH-12,PW,12,'F')
    sc(GRAY); pdf.setFontSize(8); pdf.setFont('helvetica','normal')
    pdf.text(`${docRef}  ·  ${docName}  ·  CONFIDENTIAL`, ML, PH-5)
    sc(BLUE); pdf.setFont('helvetica','bold')
    pdf.text(`Page ${pg}`, PW-MR, PH-5, {align:'right'})
  }

  const np = () => { addFtr(); pdf.addPage(); pg++; addHdr(); sf([255,255,255]); pdf.rect(0,14,PW,PH-14,'F'); pdf.setTextColor(33,37,41) }
  let y = 0
  const chk = (n=12) => { if (y+n > PH-18) { np(); y = MT+6 } }

  // ── COVER PAGE ─────────────────────────────────────────────────────────────
  // Full dark background
  sf(NAVY); pdf.rect(0,0,PW,PH,'F')

  // Top header band
  sf(CARD); pdf.rect(0,0,PW,72,'F')
  sd(BLUE); pdf.setLineWidth(0.5); pdf.line(0,72,PW,72)

  // Logo area
  drawLogo(ML, 14, 22)
  pdf.setFont('helvetica','bold'); pdf.setFontSize(32); pdf.setTextColor(33,37,41)
  pdf.text('MIRSAD', ML+26, 30)
  pdf.setFontSize(11); pdf.setFont('helvetica','normal')
  pdf.setTextColor(96,165,250) // #60A5FA
  pdf.text('The Watchtower  \u00b7  Cybersecurity GRC Platform', ML+26, 42)
  pdf.setFontSize(9); sc(LGRAY)
  pdf.text('National Cybersecurity Authority Compliance Suite', ML+26, 53)

  // Blue accent stripe
  sf(BLUE); pdf.rect(0,72,6,80,'F')

  // Title block
  sf(DARK); pdf.rect(6,72,PW-6,80,'F')
  pdf.setFontSize(9); pdf.setFont('helvetica','bold'); sc(BLUE)
  pdf.text(docName.toUpperCase(), ML+8, 85)
  pdf.setFontSize(18); pdf.setFont('helvetica','bold'); pdf.setTextColor(33,37,41)
  const titleLines = pdf.splitTextToSize(controlTitle, CW-16) as string[]
  pdf.text(titleLines, ML+8, 97)
  const afterTitle = 97 + titleLines.length * 8
  pdf.setFontSize(10); pdf.setFont('helvetica','normal'); sc(GRAY)
  pdf.text('Control Reference: ', ML+8, afterTitle+2)
  sc(CYAN)
  pdf.text(control_ref, ML+8+pdf.getTextWidth('Control Reference: '), afterTitle+2)
  pdf.setFontSize(9); sc(LGRAY)
  pdf.text(fwName, ML+8, afterTitle+11)

  // Document info table
  let ty = 165
  pdf.setFontSize(13); pdf.setFont('helvetica','bold'); sc(CYAN)
  pdf.text('Document Information', ML, ty); ty += 6

  AT({
    startY: ty,
    body: [
      ['Organization',   organization],
      ['Doc Reference',  docRef],
      ['Document Type',  docName],
      ['Version',        '1.0 - Draft'],
      ['Effective Date', today],
      ['Next Review',    nextYear],
      ['Classification', 'CONFIDENTIAL - Internal Use Only'],
      ['Owner',          'CISO'],
    ],
    margin:{left:ML, right:MR}, tableWidth:CW,
    columnStyles:{
      0:{cellWidth:52, fontStyle:'bold', fillColor:CARD, textColor:CYAN},
      1:{cellWidth:CW-52, textColor:[248,249,250], fillColor:DARK},
    },
    alternateRowStyles:{fillColor:[26,29,32]},
    styles:{fontSize:9, cellPadding:3, lineColor:BORDER, lineWidth:0.3},
    theme:'grid',
  })

  ty = (pdf as any).lastAutoTable.finalY + 8
  pdf.setFontSize(13); pdf.setFont('helvetica','bold'); sc(CYAN)
  pdf.text('Regulatory Reference', ML, ty); ty += 6

  AT({
    startY: ty,
    body:[['Framework',fwName],['Control Ref',control_ref],['Control',controlTitle]],
    margin:{left:ML, right:MR}, tableWidth:CW,
    columnStyles:{
      0:{cellWidth:52, fontStyle:'bold', fillColor:CARD, textColor:CYAN},
      1:{cellWidth:CW-52, textColor:[248,249,250], fillColor:DARK},
    },
    styles:{fontSize:9, cellPadding:3, lineColor:BORDER, lineWidth:0.3},
    theme:'grid',
  })

  // Footer bar on cover
  sf(CARD); pdf.rect(0,PH-16,PW,16,'F')
  sd(BLUE); pdf.setLineWidth(0.5); pdf.line(0,PH-16,PW,PH-16)
  pdf.setFontSize(8); pdf.setFont('helvetica','bold'); sc(LGRAY)
  pdf.text('CLASSIFICATION: CONFIDENTIAL - FOR INTERNAL USE ONLY', PW/2, PH-7, {align:'center'})

  // ── BODY PAGES ─────────────────────────────────────────────────────────────
  pdf.addPage(); pg++; addHdr()
  sf([255,255,255]); pdf.rect(0,14,PW,PH-14,'F')
  y = MT + 8

  const skip = ['**Document Reference:**','**Version:**','**Classification:**',
    '**Effective Date:**','**Owner:**','**Next Review:**','**Framework:**',
    '**Organization:**','**Control:**','**Approved By:**','**Regulatory Reference:**',
    '**Control Reference:**','**Process Owner:**','**Assessor:**','**Assessment Date:**',
    '**Difficulty:**','**Estimated Effort:**']

  const lines = content.split('\n'); let i = 0
  while (i < lines.length) {
    let l = lines[i]
    if (skip.some(s=>l.startsWith(s)) || l==='---') { i++; continue }
    if (l.startsWith('# ') && i < 4) { i++; continue }

    // Clean Arabic for PDF rendering
    if (hasArabic(l)) {
      const cleaned = cleanLineForPdf(l)
      if (!cleaned) { i++; continue }
      l = cleaned
    }

    if (l.startsWith('# ')) {
      chk(18); pdf.setFontSize(17); pdf.setFont('helvetica','bold'); pdf.setTextColor(33,37,41)
      pdf.text(strip(l.slice(2)), ML, y)
      y += 2; sd(BLUE); pdf.setLineWidth(0.6); pdf.line(ML,y,PW-MR,y); y += 8
      i++; continue
    }
    if (l.startsWith('## ')) {
      chk(14); pdf.setFontSize(13); pdf.setFont('helvetica','bold'); pdf.setTextColor(73,80,87)
      pdf.text(strip(l.slice(3)), ML, y)
      y += 1.5; sd([37,99,235]); pdf.setLineWidth(0.4); pdf.line(ML,y,PW-MR,y); y += 7
      i++; continue
    }
    if (l.startsWith('### ')) {
      chk(11); pdf.setFontSize(11); pdf.setFont('helvetica','bold'); pdf.setTextColor(108,117,125)
      pdf.text(strip(l.slice(4)), ML, y); y += 7; i++; continue
    }

    if (l.startsWith('| ')) {
      const tls:string[] = []
      while (i < lines.length && lines[i].startsWith('| ')) { tls.push(lines[i]); i++ }
      const rows = tls.filter(r=>!r.match(/^\|[-:\s|]+\|$/))
      if (rows.length >= 2) {
        const pr = (r:string) => r.split('|')
          .filter((_,ix,a)=>ix>0&&ix<a.length-1)
          .map(c => { const t=strip(c.trim()); return hasArabic(t)?stripArabic(t):t })
        chk(22)
        AT({
          startY:y, head:[pr(rows[0])], body:rows.slice(1).map(pr),
          margin:{left:ML,right:MR}, tableWidth:CW,
          headStyles:{fillColor:[73,80,87], textColor:[248,249,250], fontStyle:'bold', fontSize:9},
          bodyStyles:{textColor:[33,37,41], fontSize:9, fillColor:[255,255,255]},
          alternateRowStyles:{fillColor:[245,245,245]},
          styles:{cellPadding:3, lineColor:BORDER, lineWidth:0.3},
          theme:'grid',
          didDrawPage:()=>{ pg++; addHdr(); sf([255,255,255]); pdf.rect(0,14,PW,PH-14,'F') }
        })
        y = (pdf as any).lastAutoTable.finalY + 7
      }
      continue
    }

    if (l.match(/^[-*] /)) {
      chk(8)
      const txt = strip(l.slice(2)); const cleaned = hasArabic(txt)?stripArabic(txt):txt
      if (cleaned) {
        const w = pdf.splitTextToSize(`\u2022  ${cleaned}`, CW-8) as string[]
        pdf.setFontSize(10); pdf.setFont('helvetica','normal'); pdf.setTextColor(33,37,41)
        pdf.text(w, ML+4, y); y += w.length*5.5+1
      }
      i++; continue
    }
    if (l.match(/^\d+\. /)) {
      chk(8)
      const num = l.match(/^(\d+)\./)?.[1]
      const txt = strip(l.replace(/^\d+\. /,'')); const cleaned = hasArabic(txt)?stripArabic(txt):txt
      if (cleaned) {
        const w = pdf.splitTextToSize(`${num}. ${cleaned}`, CW-8) as string[]
        pdf.setFontSize(10); pdf.setFont('helvetica','normal'); pdf.setTextColor(33,37,41)
        pdf.text(w, ML+4, y); y += w.length*5.5+1
      }
      i++; continue
    }

    if (!l.trim()) { y += 4; i++; continue }

    chk(8)
    const cleaned = hasArabic(l) ? stripArabic(l) : strip(l)
    if (cleaned.trim()) {
      const w = pdf.splitTextToSize(cleaned, CW) as string[]
      pdf.setFontSize(10); pdf.setFont('helvetica','normal'); pdf.setTextColor(33,37,41)
      pdf.text(w, ML, y); y += w.length*5.5+2
    }
    i++
  }

  addFtr()
  return Buffer.from(pdf.output('arraybuffer') as ArrayBuffer)
}
