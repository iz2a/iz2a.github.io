// docx-generator.ts - Monochrome theme matching aziz.life

const C = {
  darkBlue:  '212529',   // deep bg (used as "dark" surface)
  midBlue:   '495057',   // mid gray (used as section dividers, borders)
  lightBlue: 'dee2e6',   // light gray tint (used as header cell fill)
  teal:      '6c757d',   // mid-gray (h3 color)
  grayDark:  '212529',
  grayMed:   '6c757d',
  grayLight: 'f8f9fa',
  grayLine:  'dee2e6',
  white:     'ffffff',
}

const FW_NAMES: Record<string,string> = {
  NCA_ECC:  'NCA Essential Cybersecurity Controls (ECC) v2.0',
  NCA_DCC:  'NCA Data Cybersecurity Controls (DCC) v1.0',
  SAMA_CSF: 'SAMA Cyber Security Framework (CSF) v1.0',
  ISO_27001:'ISO/IEC 27001:2022',
  NIST_CSF: 'NIST Cybersecurity Framework 2.0',
}
const DOC_NAMES: Record<string,string> = {
  policy:               'Policy Document',
  procedure:            'Operational Procedure',
  evidence_checklist:   'Evidence Checklist',
  implementation_guide: 'Implementation Guide',
}

export async function generateDocx(params: {
  content: string; framework_id: string; control_ref: string;
  controlTitle: string; docType: string; organization: string;
}): Promise<Buffer> {
  const { content, framework_id, control_ref, controlTitle, docType, organization } = params

  const docx = require('docx')
  const {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
    ShadingType, VerticalAlign, PageNumber, PageBreak, TabStopType, TabStopPosition,
  } = docx

  const fwName  = FW_NAMES[framework_id]  || framework_id
  const docName = DOC_NAMES[docType]      || docType
  const todayISO = new Date().toISOString().slice(0,10)
  const nextYear = new Date(Date.now() + 365*24*60*60*1000).toISOString().slice(0,10)
  const docRef   = `${docType.slice(0,3).toUpperCase()}-${control_ref.replace(/[.-]/g,'-')}-001`
  const headerLeft = `${control_ref}  -  ${controlTitle}`
  const footerLeft = `${docRef}  ·  ${docName}  ·  CONFIDENTIAL`

  const bdr  = (color = C.grayLine, size = 4) => ({ style: BorderStyle.SINGLE, size, color })
  const bs   = (c = C.grayLine)  => ({ top: bdr(c), bottom: bdr(c), left: bdr(c), right: bdr(c) })
  const noBorder = { style: BorderStyle.NONE, size: 0, color: C.white }
  const nbs  = () => ({ top: noBorder, bottom: noBorder, left: noBorder, right: noBorder })

  // Header cell - dark bg, white text
  const hdrCell = (text: string, w: number) => new TableCell({
    borders: bs(C.midBlue),
    width: { size: w, type: WidthType.DXA },
    shading: { fill: C.darkBlue, type: ShadingType.CLEAR },
    margins: { top: 120, bottom: 120, left: 160, right: 160 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ alignment: AlignmentType.LEFT, children: [
      new TextRun({ text, font:'Arial', size:20, bold:true, color:'f8f9fa' })
    ]})]
  })

  const dataCell = (text: string, w: number, shade?: string, bold = false, color = '495057') => new TableCell({
    borders: bs(C.grayLine),
    width: { size: w, type: WidthType.DXA },
    shading: shade ? { fill: shade, type: ShadingType.CLEAR } : undefined,
    margins: { top: 100, bottom: 100, left: 160, right: 160 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ children: [
      new TextRun({ text: String(text||'-'), font:'Arial', size:20, bold, color })
    ]})]
  })

  const makeHeader = (left: string, right: string) => new Header({ children: [
    new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: C.midBlue, space: 4 } },
      tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
      spacing: { after: 0 },
      children: [
        new TextRun({ text: left,  font:'Arial', size:18, color: C.grayMed }),
        new TextRun({ text: '\t' }),
        new TextRun({ text: right, font:'Arial', size:18, color: C.grayMed }),
      ]
    })
  ]})

  const makeFooter = (left: string) => new Footer({ children: [
    new Paragraph({
      border: { top: { style: BorderStyle.SINGLE, size: 6, color: C.midBlue, space: 4 } },
      tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
      spacing: { before: 0 },
      children: [
        new TextRun({ text: left, font:'Arial', size:18, color: C.grayMed }),
        new TextRun({ text: '\t' }),
        new TextRun({ text: 'Page ', font:'Arial', size:18, color: C.grayMed }),
        new TextRun({ children: [PageNumber.CURRENT], font:'Arial', size:18, color: C.grayMed }),
        new TextRun({ text: ' of ', font:'Arial', size:18, color: C.grayMed }),
        new TextRun({ children: [PageNumber.TOTAL_PAGES], font:'Arial', size:18, color: C.grayMed }),
      ]
    })
  ]})

  const parseInline = (text: string) =>
    text.split(/\*\*([^*]+)\*\*/).map((p, j) => new TextRun({
      text: p, font: 'Arial', size: 22,
      bold:  j % 2 === 1,
      color: j % 2 === 1 ? 'f8f9fa' : '6c757d',
    }))

  const buildToc = () => {
    const entries: any[] = []
    let n = 0
    for (const line of content.split('\n')) {
      if (line.startsWith('## ')) {
        n++
        entries.push(new Paragraph({ spacing:{ before:80, after:40 },
          children:[new TextRun({ text:`${n}.  ${line.slice(3).replace(/\*\*([^*]+)\*\*/g,'$1')}`, font:'Arial', size:22, color:'6c757d' })] }))
      } else if (line.startsWith('### ')) {
        entries.push(new Paragraph({ spacing:{ before:30, after:20 }, indent:{ left:360 },
          children:[new TextRun({ text:line.slice(4).replace(/\*\*([^*]+)\*\*/g,'$1'), font:'Arial', size:20, color:'495057' })] }))
      }
    }
    return entries.length ? entries : [new Paragraph({ children:[new TextRun({ text:'(No sections)', font:'Arial', size:20, color:'495057', italics:true })] })]
  }

  const parseMarkdown = (): any[] => {
    const out: any[] = []
    const skipPfx = ['**Document Reference:**','**Version:**','**Classification:**',
      '**Effective Date:**','**Owner:**','**Approved By:**','**Next Review:**',
      '**Regulatory Reference:**','**Control Reference:**','**Framework:**',
      '**Organization:**','**Process Owner:**','**Control:**','**Assessment Date:**',
      '**Assessor:**','**Difficulty:**','**Estimated Effort:**']

    const lines = content.split('\n')
    let i = 0
    while (i < lines.length) {
      const line = lines[i]
      if (skipPfx.some(p => line.startsWith(p)) || line === '---') { i++; continue }
      if (line.startsWith('# ') && i < 4) { i++; continue }

      if (line.startsWith('# ')) {
        out.push(new Paragraph({ heading: HeadingLevel.HEADING_1, spacing:{ before:480, after:160 },
          children:[new TextRun({ text:line.slice(2), font:'Arial', size:36, bold:true, color:'f8f9fa' })] }))
        i++; continue
      }
      if (line.startsWith('## ')) {
        out.push(new Paragraph({ heading: HeadingLevel.HEADING_2, spacing:{ before:360, after:120 },
          border:{ bottom:{ style:BorderStyle.SINGLE, size:6, color:C.midBlue, space:2 } },
          children:[new TextRun({ text:line.slice(3), font:'Arial', size:28, bold:true, color:'e9ecef' })] }))
        i++; continue
      }
      if (line.startsWith('### ')) {
        out.push(new Paragraph({ heading: HeadingLevel.HEADING_3, spacing:{ before:240, after:80 },
          children:[new TextRun({ text:line.slice(4), font:'Arial', size:24, bold:true, color:'adb5bd' })] }))
        i++; continue
      }

      if (line.startsWith('| ')) {
        const tableLines: string[] = []
        while (i < lines.length && lines[i].startsWith('| ')) { tableLines.push(lines[i]); i++ }
        const rows = tableLines.filter(l => !l.match(/^\|[-:\s|]+\|$/))
        if (rows.length >= 1) {
          const parseRow = (r: string) => r.split('|').filter((_,ix,arr) => ix>0 && ix<arr.length-1).map(c => c.trim())
          const colCount = parseRow(rows[0]).length
          const totalW   = 9026
          const colW     = Math.floor(totalW / colCount)
          const colWs    = Array(colCount).fill(colW)
          out.push(new Table({ width:{ size:totalW, type:WidthType.DXA }, columnWidths:colWs,
            rows: rows.map((r, ri) => new TableRow({
              tableHeader: ri === 0,
              children: parseRow(r).map((cell, ci) =>
                ri === 0 ? hdrCell(cell, colWs[ci]) : dataCell(cell, colWs[ci], ri%2===1 ? 'f8f9fa' : 'ffffff')
              )
            }))
          }))
          out.push(new Paragraph({ spacing:{ after:160 }, children:[] }))
        }
        continue
      }

      if (line.match(/^[-*] /)) {
        out.push(new Paragraph({ numbering:{ reference:'bullets', level:0 }, spacing:{ before:40, after:40 }, children:parseInline(line.slice(2)) }))
        i++; continue
      }
      if (line.match(/^\d+\. /)) {
        out.push(new Paragraph({ numbering:{ reference:'numbers', level:0 }, spacing:{ before:40, after:40 }, children:parseInline(line.replace(/^\d+\. /,'')) }))
        i++; continue
      }
      if (!line.trim()) { out.push(new Paragraph({ spacing:{ after:80 }, children:[] })); i++; continue }
      out.push(new Paragraph({ spacing:{ before:40, after:80 }, children:parseInline(line) }))
      i++
    }
    return out
  }

  const metaRows: [string,string][] = [
    ['Organization',   organization],
    ['Doc Reference',  docRef],
    ['Document Type',  docName],
    ['Version',        '1.0 - Draft'],
    ['Effective Date', todayISO],
    ['Next Review',    nextYear],
    ['Classification', 'CONFIDENTIAL - Internal Use Only'],
    ['Owner',          'Chief Information Security Officer (CISO)'],
    ['Approved By',    '______________________________'],
  ]
  const fwRows: [string,string][] = [
    ['Framework',    fwName],
    ['Control Ref',  control_ref],
    ['Control',      controlTitle],
  ]

  const metaTable = (rows: [string,string][]) => new Table({
    width:{ size:9026, type:WidthType.DXA }, columnWidths:[2800,6226],
    rows: rows.map(([k,v],idx) => new TableRow({ children:[
      dataCell(k, 2800, C.lightBlue, true, '212529'),
      dataCell(v, 6226, idx%2===0 ? C.white : C.grayLight, false, '495057'),
    ]}))
  })

  const doc = new Document({
    numbering: { config: [
      { reference:'bullets', levels:[{ level:0, format:'bullet', text:'•', alignment:'left', style:{ paragraph:{ indent:{ left:720, hanging:360 } } } }] },
      { reference:'numbers', levels:[{ level:0, format:'decimal', text:'%1.', alignment:'left', style:{ paragraph:{ indent:{ left:720, hanging:360 } } } }] },
    ]},
    styles: {
      default: { document: { run:{ font:'Arial', size:22 } } },
      paragraphStyles: [
        { id:'Heading1', name:'Heading 1', basedOn:'Normal', next:'Normal', quickFormat:true,
          run:{ size:36, bold:true, font:'Arial', color:'f8f9fa' }, paragraph:{ spacing:{ before:480, after:160 }, outlineLevel:0 } },
        { id:'Heading2', name:'Heading 2', basedOn:'Normal', next:'Normal', quickFormat:true,
          run:{ size:28, bold:true, font:'Arial', color:'e9ecef' }, paragraph:{ spacing:{ before:360, after:120 }, outlineLevel:1 } },
        { id:'Heading3', name:'Heading 3', basedOn:'Normal', next:'Normal', quickFormat:true,
          run:{ size:24, bold:true, font:'Arial', color:'adb5bd' }, paragraph:{ spacing:{ before:240, after:80 }, outlineLevel:2 } },
      ]
    },
    sections: [
      // ── COVER PAGE ───────────────────────────────────────────────────────
      {
        properties:{ page:{ size:{ width:11906, height:16838 }, margin:{ top:0, right:0, bottom:0, left:0 } } },
        children:[
          // Top banner - dark bg
          new Table({ width:{ size:11906, type:WidthType.DXA }, columnWidths:[11906], rows:[new TableRow({ children:[new TableCell({
            borders:nbs(), width:{ size:11906, type:WidthType.DXA }, shading:{ fill:'212529', type:ShadingType.CLEAR },
            margins:{ top:1440, bottom:1440, left:1440, right:1440 },
            children:[
              new Paragraph({ children:[new TextRun({ text:'MIRSAD', font:'Arial', size:96, bold:true, color:'f8f9fa' })] }),
              new Paragraph({ spacing:{ before:80 }, children:[new TextRun({ text:'مِرصاد  ·  Cybersecurity GRC Platform', font:'Arial', size:28, color:'adb5bd' })] }),
              new Paragraph({ spacing:{ before:40 }, children:[new TextRun({ text:'National Cybersecurity Authority Compliance Suite', font:'Arial', size:22, color:'6c757d' })] }),
            ]
          })]})]}),
          // Accent stripe + doc title block
          new Table({ width:{ size:11906, type:WidthType.DXA }, columnWidths:[560,11346], rows:[new TableRow({ children:[
            new TableCell({ borders:nbs(), width:{ size:560, type:WidthType.DXA }, shading:{ fill:'495057', type:ShadingType.CLEAR }, children:[new Paragraph({ children:[] })] }),
            new TableCell({ borders:nbs(), width:{ size:11346, type:WidthType.DXA }, shading:{ fill:'dee2e6', type:ShadingType.CLEAR },
              margins:{ top:800, bottom:800, left:1440, right:1440 },
              children:[
                new Paragraph({ children:[new TextRun({ text:docName.toUpperCase(), font:'Arial', size:22, bold:true, color:'495057', characterSpacing:80 })] }),
                new Paragraph({ spacing:{ before:100 }, children:[new TextRun({ text:controlTitle, font:'Arial', size:56, bold:true, color:'212529' })] }),
                new Paragraph({ spacing:{ before:200 }, children:[
                  new TextRun({ text:'Control Reference: ', font:'Arial', size:24, bold:true, color:'6c757d' }),
                  new TextRun({ text:control_ref, font:'Arial', size:24, bold:true, color:'343a40' }),
                ]}),
                new Paragraph({ spacing:{ before:80 }, children:[new TextRun({ text:fwName, font:'Arial', size:22, color:'495057' })] }),
              ]
            }),
          ]})]
          }),
          // Document info tables
          new Table({ width:{ size:11906, type:WidthType.DXA }, columnWidths:[11906], rows:[new TableRow({ children:[new TableCell({
            borders:nbs(), width:{ size:11906, type:WidthType.DXA },
            margins:{ top:1000, bottom:1000, left:1440, right:1440 },
            children:[
              new Paragraph({ spacing:{ after:180 }, children:[new TextRun({ text:'Document Information', font:'Arial', size:28, bold:true, color:'f8f9fa' })] }),
              metaTable(metaRows),
              new Paragraph({ spacing:{ before:600, after:180 }, children:[new TextRun({ text:'Regulatory Reference', font:'Arial', size:28, bold:true, color:'f8f9fa' })] }),
              metaTable(fwRows),
              new Paragraph({ spacing:{ before:800 }, alignment:AlignmentType.CENTER,
                border:{ top:{ style:BorderStyle.SINGLE, size:6, color:C.grayLine, space:8 } },
                children:[new TextRun({ text:'CLASSIFICATION: CONFIDENTIAL - FOR INTERNAL USE ONLY', font:'Arial', size:18, bold:true, color:'6c757d', characterSpacing:40 })]
              }),
            ]
          })]})]}),
        ]
      },
      // ── TOC ──────────────────────────────────────────────────────────────
      {
        properties:{ page:{ size:{ width:11906, height:16838 }, margin:{ top:1440, right:1260, bottom:1440, left:1260 } } },
        headers:{ default: makeHeader(headerLeft, organization) },
        footers:{ default: makeFooter(footerLeft) },
        children:[
          new Paragraph({ heading:HeadingLevel.HEADING_1, spacing:{ before:0, after:200 },
            children:[new TextRun({ text:'Table of Contents', font:'Arial', size:36, bold:true, color:'f8f9fa' })] }),
          new Paragraph({ spacing:{ after:120 }, children:[new TextRun({ text:'Open in Word and press Ctrl+A → F9 to update page numbers.', font:'Arial', size:18, color:'6c757d', italics:true })] }),
          ...buildToc(),
          new Paragraph({ children:[new PageBreak()] }),
        ]
      },
      // ── BODY ─────────────────────────────────────────────────────────────
      {
        properties:{ page:{ size:{ width:11906, height:16838 }, margin:{ top:1440, right:1260, bottom:1440, left:1260 } } },
        headers:{ default: makeHeader(headerLeft, organization) },
        footers:{ default: makeFooter(footerLeft) },
        children: parseMarkdown(),
      },
    ]
  })

  return Packer.toBuffer(doc)
}
