const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, PageBreak, LevelFormat,
  TableOfContents, TabStopType, TabStopPosition, ExternalHyperlink
} = require('/home/claude/mirsad-export/node_modules/docx')
const fs = require('fs')

// Read args
const args = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))
const { content, framework_id, control_ref, controlTitle, docType, organization, outputPath } = args

// ── Color palette (professional blues) ──────────────────────
const DARK_BLUE  = '1E3A5F'
const MID_BLUE   = '2563EB'
const LIGHT_BLUE = 'DBEAFE'
const ACCENT     = '3B82F6'
const TEAL       = '0891B2'
const GRAY_DARK  = '374151'
const GRAY_MED   = '6B7280'
const GRAY_LIGHT = 'F3F4F6'
const GRAY_LINE  = 'E5E7EB'
const WHITE      = 'FFFFFF'

const FW_NAMES = {
  NCA_ECC:  'NCA Essential Cybersecurity Controls (ECC) v2.0',
  NCA_DCC:  'NCA Data Cybersecurity Controls (DCC) v1.0',
  SAMA_CSF: 'SAMA Cyber Security Framework v1.0',
  ISO_27001:'ISO/IEC 27001:2022',
  NIST_CSF: 'NIST Cybersecurity Framework 2.0',
}

const DOC_TYPE_NAMES = {
  policy:               'Policy Document',
  procedure:            'Operational Procedure',
  evidence_checklist:   'Evidence Checklist',
  implementation_guide: 'Implementation Guide',
}

const today = new Date().toLocaleDateString('en-SA', { year:'numeric', month:'long', day:'numeric' })
const todayISO = new Date().toISOString().slice(0,10)
const nextYear = new Date(Date.now() + 365*24*60*60*1000).toLocaleDateString('en-SA', { year:'numeric', month:'long', day:'numeric' })
const docRef = `${docType.slice(0,3).toUpperCase()}-${control_ref.replace(/[.-]/g,'-')}-001`
const fwName = FW_NAMES[framework_id] || framework_id

// ── Helpers ───────────────────────────────────────────────────
const border = (color = GRAY_LINE, size = 4) => ({ style: BorderStyle.SINGLE, size, color })
const cellBorders = (c = GRAY_LINE) => ({ top: border(c), bottom: border(c), left: border(c), right: border(c) })
const noBorder = () => ({ style: BorderStyle.NONE, size: 0, color: WHITE })
const noBorders = () => ({ top: noBorder(), bottom: noBorder(), left: noBorder(), right: noBorder() })
const hdrCell = (text, w) => new TableCell({
  borders: cellBorders(MID_BLUE),
  width: { size: w, type: WidthType.DXA },
  shading: { fill: DARK_BLUE, type: ShadingType.CLEAR },
  margins: { top: 100, bottom: 100, left: 150, right: 150 },
  verticalAlign: VerticalAlign.CENTER,
  children: [new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun({ text, font:'Arial', size: 20, bold:true, color: WHITE })] })]
})
const dataCell = (text, w, shade = null, bold = false) => new TableCell({
  borders: cellBorders(),
  width: { size: w, type: WidthType.DXA },
  shading: shade ? { fill: shade, type: ShadingType.CLEAR } : undefined,
  margins: { top: 80, bottom: 80, left: 150, right: 150 },
  children: [new Paragraph({ children: [new TextRun({ text: String(text||''), font:'Arial', size: 20, bold, color: GRAY_DARK })] })]
})

// ── Parse markdown-ish content into docx paragraphs ──────────
function parseContent(md) {
  const paragraphs = []
  const lines = md.split('\n')
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Skip doc-ref header block (we render it in the cover / meta table)
    if (line.startsWith('**Document Reference:**') ||
        line.startsWith('**Version:**') ||
        line.startsWith('**Classification:**') ||
        line.startsWith('**Effective Date:**') ||
        line.startsWith('**Owner:**') ||
        line.startsWith('**Approved By:**') ||
        line.startsWith('**Next Review:**') ||
        line.startsWith('**Regulatory Reference:**') ||
        line.startsWith('**Control Reference:**') ||
        line.startsWith('**Framework:**') ||
        line.startsWith('**Assessment Date:**') ||
        line.startsWith('**Assessor:**') ||
        line.startsWith('**Organization:**') ||
        line.startsWith('**Process Owner:**') ||
        line.startsWith('**Difficulty:**') ||
        line.startsWith('**Estimated Effort:**') ||
        line === '---') continue

    // H1 → skip (rendered in cover)
    if (line.startsWith('# ') && i < 3) continue

    // H1
    if (line.startsWith('# ')) {
      paragraphs.push(new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 160 },
        children: [new TextRun({ text: line.slice(2), font:'Arial', size: 36, bold:true, color: DARK_BLUE })]
      }))
      continue
    }
    // H2
    if (line.startsWith('## ')) {
      paragraphs.push(new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 320, after: 100 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: MID_BLUE, space: 1 } },
        children: [new TextRun({ text: line.slice(3), font:'Arial', size: 28, bold:true, color: MID_BLUE })]
      }))
      continue
    }
    // H3
    if (line.startsWith('### ')) {
      paragraphs.push(new Paragraph({
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 240, after: 80 },
        children: [new TextRun({ text: line.slice(4), font:'Arial', size: 24, bold:true, color: TEAL })]
      }))
      continue
    }
    // Table row
    if (line.startsWith('| ')) {
      // Collect all table rows
      const tableLines = []
      while (i < lines.length && lines[i].startsWith('| ')) {
        tableLines.push(lines[i])
        i++
      }
      i-- // back up
      const rows = tableLines.filter(l => !l.match(/^\|[-\s|]+\|$/))
      if (rows.length < 1) continue
      const cols = rows[0].split('|').filter((c,idx,arr) => idx>0 && idx<arr.length-1).map(c=>c.trim())
      const colCount = cols.length
      const totalW = 9026
      const colW = Math.floor(totalW / colCount)
      const colWidths = Array(colCount).fill(colW)
      const tableRows = rows.map((r, ri) => {
        const cells = r.split('|').filter((c,idx,arr) => idx>0 && idx<arr.length-1).map(c=>c.trim())
        return new TableRow({
          children: cells.map((cell, ci) => {
            const isHeader = ri === 0
            if (isHeader) return hdrCell(cell, colWidths[ci])
            return dataCell(cell, colWidths[ci], ri%2===0 ? GRAY_LIGHT : null)
          })
        })
      })
      paragraphs.push(new Table({
        width: { size: totalW, type: WidthType.DXA },
        columnWidths: colWidths,
        rows: tableRows,
      }))
      paragraphs.push(new Paragraph({ spacing: { after: 120 }, children: [] }))
      continue
    }
    // Bullet
    if (line.match(/^[-*] /)) {
      const text = line.slice(2)
      paragraphs.push(new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        spacing: { before: 40, after: 40 },
        children: [new TextRun({ text, font:'Arial', size: 22, color: GRAY_DARK })]
      }))
      continue
    }
    // Numbered
    if (line.match(/^\d+\. /)) {
      const text = line.replace(/^\d+\. /, '')
      paragraphs.push(new Paragraph({
        numbering: { reference: 'numbers', level: 0 },
        spacing: { before: 40, after: 40 },
        children: [new TextRun({ text, font:'Arial', size: 22, color: GRAY_DARK })]
      }))
      continue
    }
    // Empty line
    if (line.trim() === '') {
      paragraphs.push(new Paragraph({ spacing: { after: 80 }, children: [] }))
      continue
    }
    // Regular paragraph with inline bold
    const parts = line.split(/\*\*([^*]+)\*\*/)
    paragraphs.push(new Paragraph({
      spacing: { before: 40, after: 80 },
      children: parts.map((p, j) => new TextRun({
        text: p, font:'Arial', size: 22,
        bold: j%2 === 1,
        color: j%2 === 1 ? DARK_BLUE : GRAY_DARK
      }))
    }))
  }
  return paragraphs
}

// ── Document metadata table ───────────────────────────────────
function metaTable() {
  const rows = [
    ['Document Reference', docRef],
    ['Document Type',      DOC_TYPE_NAMES[docType] || docType],
    ['Framework',          fwName],
    ['Control Reference',  control_ref],
    ['Control',            controlTitle],
    ['Organization',       organization],
    ['Version',            '1.0'],
    ['Classification',     'CONFIDENTIAL — Internal Use Only'],
    ['Effective Date',     todayISO],
    ['Owner',              'Chief Information Security Officer (CISO)'],
    ['Next Review Date',   nextYear],
  ]
  return new Table({
    width: { size: 9026, type: WidthType.DXA },
    columnWidths: [2800, 6226],
    rows: rows.map((r, i) => new TableRow({
      children: [
        dataCell(r[0], 2800, LIGHT_BLUE, true),
        dataCell(r[1], 6226, i%2===0 ? WHITE : GRAY_LIGHT),
      ]
    }))
  })
}

// ── Build document ────────────────────────────────────────────
const bodyContent = parseContent(content)

const doc = new Document({
  numbering: {
    config: [
      { reference: 'bullets', levels: [{ level:0, format: LevelFormat.BULLET, text:'•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left:720, hanging:360 } } } }] },
      { reference: 'numbers', levels: [{ level:0, format: LevelFormat.DECIMAL, text:'%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left:720, hanging:360 } } } }] },
    ]
  },
  styles: {
    default: { document: { run: { font:'Arial', size: 22 } } },
    paragraphStyles: [
      { id:'Heading1', name:'Heading 1', basedOn:'Normal', next:'Normal', quickFormat:true,
        run:{ size:36, bold:true, font:'Arial', color: DARK_BLUE },
        paragraph:{ spacing:{ before:400, after:160 }, outlineLevel:0 } },
      { id:'Heading2', name:'Heading 2', basedOn:'Normal', next:'Normal', quickFormat:true,
        run:{ size:28, bold:true, font:'Arial', color: MID_BLUE },
        paragraph:{ spacing:{ before:320, after:100 }, outlineLevel:1 } },
      { id:'Heading3', name:'Heading 3', basedOn:'Normal', next:'Normal', quickFormat:true,
        run:{ size:24, bold:true, font:'Arial', color: TEAL },
        paragraph:{ spacing:{ before:240, after:80 }, outlineLevel:2 } },
    ]
  },
  sections: [
    // ── COVER PAGE ───────────────────────────────────────────
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 0, right: 0, bottom: 0, left: 0 }
        }
      },
      children: [
        // Top color band
        new Table({
          width: { size: 11906, type: WidthType.DXA },
          columnWidths: [11906],
          rows: [new TableRow({ children: [new TableCell({
            borders: noBorders(),
            width: { size: 11906, type: WidthType.DXA },
            shading: { fill: DARK_BLUE, type: ShadingType.CLEAR },
            margins: { top: 1200, bottom: 1200, left: 1440, right: 1440 },
            children: [
              new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun({ text: 'MIRSAD', font:'Arial', size: 80, bold:true, color: WHITE })] }),
              new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun({ text: 'مِرصاد  ·  Cybersecurity GRC Platform', font:'Arial', size: 26, color: '93C5FD' })] }),
            ]
          })] })]
        }),
        // Blue accent bar
        new Table({
          width: { size: 11906, type: WidthType.DXA },
          columnWidths: [800, 11106],
          rows: [new TableRow({ children: [
            new TableCell({ borders: noBorders(), width:{ size:800, type:WidthType.DXA }, shading:{ fill: ACCENT, type: ShadingType.CLEAR }, children:[new Paragraph({ children:[] })] }),
            new TableCell({ borders: noBorders(), width:{ size:11106, type:WidthType.DXA }, shading:{ fill: LIGHT_BLUE, type: ShadingType.CLEAR },
              margins:{ top:600, bottom:600, left:1440, right:1440 },
              children:[
                new Paragraph({ alignment: AlignmentType.LEFT, children:[new TextRun({ text: DOC_TYPE_NAMES[docType]||docType, font:'Arial', size: 22, color: MID_BLUE, bold:true })] }),
                new Paragraph({ alignment: AlignmentType.LEFT, spacing:{ before:80 }, children:[new TextRun({ text: controlTitle, font:'Arial', size: 52, bold:true, color: DARK_BLUE })] }),
                new Paragraph({ alignment: AlignmentType.LEFT, spacing:{ before:120 }, children:[new TextRun({ text: `Control Reference: ${control_ref}`, font:'Arial', size: 24, color: GRAY_MED, bold:true })] }),
                new Paragraph({ alignment: AlignmentType.LEFT, spacing:{ before:60 }, children:[new TextRun({ text: fwName, font:'Arial', size: 22, color: GRAY_MED })] }),
              ]
            }),
          ]})]
        }),
        // White body area
        new Table({
          width: { size: 11906, type: WidthType.DXA },
          columnWidths: [11906],
          rows: [new TableRow({ children: [new TableCell({
            borders: noBorders(),
            width: { size: 11906, type: WidthType.DXA },
            margins: { top: 800, bottom: 800, left: 1440, right: 1440 },
            children: [
              new Paragraph({ spacing:{ after:160 }, children:[new TextRun({ text:'Document Information', font:'Arial', size:26, bold:true, color: DARK_BLUE })] }),
              new Table({
                width: { size: 9026, type: WidthType.DXA },
                columnWidths: [2800, 6226],
                rows: [
                  ['Organization', organization],
                  ['Document Reference', docRef],
                  ['Version', '1.0'],
                  ['Date', todayISO],
                  ['Classification', 'CONFIDENTIAL — Internal Use Only'],
                  ['Owner', 'Chief Information Security Officer (CISO)'],
                  ['Next Review', nextYear],
                ].map(([k,v], i) => new TableRow({ children: [
                  dataCell(k, 2800, LIGHT_BLUE, true),
                  dataCell(v, 6226, i%2===0 ? WHITE : GRAY_LIGHT),
                ]}))
              }),
              new Paragraph({ spacing:{ before:600, after:160 }, children:[new TextRun({ text:'Regulatory Reference', font:'Arial', size:26, bold:true, color: DARK_BLUE })] }),
              new Table({
                width: { size: 9026, type: WidthType.DXA },
                columnWidths: [2800, 6226],
                rows: [
                  ['Framework', fwName],
                  ['Control Reference', control_ref],
                  ['Control Title', controlTitle],
                ].map(([k,v], i) => new TableRow({ children: [
                  dataCell(k, 2800, LIGHT_BLUE, true),
                  dataCell(v, 6226, i%2===0 ? WHITE : GRAY_LIGHT),
                ]}))
              }),
            ]
          })] })]
        }),
      ]
    },
    // ── TABLE OF CONTENTS ────────────────────────────────────
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, right: 1260, bottom: 1440, left: 1260 }
        }
      },
      headers: {
        default: new Header({ children: [
          new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: MID_BLUE, space: 4 } },
            tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
            children: [
              new TextRun({ text: `${control_ref} — ${controlTitle}`, font:'Arial', size:18, color: GRAY_MED }),
              new TextRun({ text: '\t', font:'Arial', size:18 }),
              new TextRun({ text: organization, font:'Arial', size:18, color: GRAY_MED }),
            ]
          })
        ]})
      },
      footers: {
        default: new Footer({ children: [
          new Paragraph({
            border: { top: { style: BorderStyle.SINGLE, size: 6, color: MID_BLUE, space: 4 } },
            tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
            children: [
              new TextRun({ text: `${docRef}  ·  ${DOC_TYPE_NAMES[docType]||docType}  ·  CONFIDENTIAL`, font:'Arial', size:18, color: GRAY_MED }),
              new TextRun({ text: '\t', font:'Arial', size:18 }),
              new TextRun({ text: 'Page ', font:'Arial', size:18, color: GRAY_MED }),
              new TextRun({ children: [PageNumber.CURRENT], font:'Arial', size:18, color: GRAY_MED }),
              new TextRun({ text: ' of ', font:'Arial', size:18, color: GRAY_MED }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], font:'Arial', size:18, color: GRAY_MED }),
            ]
          })
        ]})
      },
      children: [
        new Paragraph({ heading: HeadingLevel.HEADING_1, spacing:{ before:0, after:200 }, children:[new TextRun({ text:'Table of Contents', font:'Arial', size:36, bold:true, color: DARK_BLUE })] }),
        new TableOfContents('Table of Contents', { hyperlink: true, headingStyleRange: '1-3' }),
        new Paragraph({ children: [new PageBreak()] }),
      ]
    },
    // ── MAIN CONTENT ─────────────────────────────────────────
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, right: 1260, bottom: 1440, left: 1260 }
        }
      },
      headers: {
        default: new Header({ children: [
          new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: MID_BLUE, space: 4 } },
            tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
            children: [
              new TextRun({ text: `${control_ref} — ${controlTitle}`, font:'Arial', size:18, color: GRAY_MED }),
              new TextRun({ text: '\t' }),
              new TextRun({ text: organization, font:'Arial', size:18, color: GRAY_MED }),
            ]
          })
        ]})
      },
      footers: {
        default: new Footer({ children: [
          new Paragraph({
            border: { top: { style: BorderStyle.SINGLE, size: 6, color: MID_BLUE, space: 4 } },
            tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
            children: [
              new TextRun({ text: `${docRef}  ·  ${DOC_TYPE_NAMES[docType]||docType}  ·  CONFIDENTIAL`, font:'Arial', size:18, color: GRAY_MED }),
              new TextRun({ text: '\t' }),
              new TextRun({ text: 'Page ', font:'Arial', size:18, color: GRAY_MED }),
              new TextRun({ children: [PageNumber.CURRENT], font:'Arial', size:18, color: GRAY_MED }),
              new TextRun({ text: ' of ', font:'Arial', size:18, color: GRAY_MED }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], font:'Arial', size:18, color: GRAY_MED }),
            ]
          })
        ]})
      },
      children: bodyContent
    }
  ]
})

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(outputPath, buf)
  console.log('OK:' + outputPath)
}).catch(e => {
  console.error('ERROR:' + e.message)
  process.exit(1)
})
