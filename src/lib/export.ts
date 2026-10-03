import type { Risk, Finding, Document } from '@/types/database'

// ==========================================================================
// export.ts  (light, print-ready, enterprise)
// Risk / Findings / Document exports as PDF, Excel and Word.
//
// These are documents people print, email and hand to auditors, so they use a
// LIGHT page: white paper, dark text, one charcoal header band carrying the
// MIRSAD radar logo. This replaces the old dark-page exports and the Word file
// that rendered near-white text on Word's white background (invisible).
// ==========================================================================

type RGB = [number, number, number]
// Charcoal / grey / gold system, matched to the site, chosen for print contrast.
const INK: RGB      = [26, 29, 32]     // near-black body text
const CHARCOAL: RGB = [33, 37, 41]     // header band
const SLATE: RGB    = [73, 80, 87]     // secondary text
const MUTED: RGB    = [108, 117, 125]  // labels
const LINE: RGB     = [222, 226, 230]  // hairlines
const ZEBRA: RGB    = [247, 248, 249]  // alternate row
const BANDTX: RGB   = [248, 249, 250]  // text on the charcoal band
const BANDSUB: RGB  = [173, 181, 189]  // subtext on the band
const GOLD: RGB     = [176, 141, 61]   // accent
const WHITE: RGB    = [255, 255, 255]
const RED: RGB      = [192, 57, 43]     // critical
const ORANGE: RGB   = [196, 94, 10]     // high
const AMBER: RGB    = [138, 106, 0]     // medium
const BLUE: RGB     = [29, 111, 184]    // low / info
const GREEN: RGB    = [31, 122, 77]     // good / resolved

const sevRGB = (s: string): RGB =>
  s === 'Critical' ? RED : s === 'High' ? ORANGE : s === 'Medium' ? AMBER : s === 'Low' ? BLUE : SLATE
const levelRGB = (l: string): RGB =>
  l === 'Critical' ? RED : l === 'High' ? ORANGE : l === 'Medium' ? AMBER : BLUE
const statusRGB = (s: string): RGB =>
  /resolved|mitigated|closed/i.test(s) ? GREEN : /progress/i.test(s) ? BLUE : SLATE

// Radar logo, drawn in light-on-dark for the header band.
function drawLogo(doc: any, cx: number, cy: number) {
  doc.setDrawColor(...BANDSUB); doc.setLineWidth(0.4); doc.circle(cx, cy, 8, 'S')
  doc.setDrawColor(130, 137, 143); doc.setLineWidth(0.35); doc.circle(cx, cy, 5.3, 'S')
  doc.setDrawColor(160, 167, 173); doc.circle(cx, cy, 2.8, 'S')
  doc.setFillColor(...BANDTX); doc.circle(cx, cy, 0.8, 'F')
  doc.setDrawColor(...BANDSUB); doc.setLineWidth(0.3)
  doc.line(cx, cy - 8.5, cx, cy - 3); doc.line(cx, cy + 3, cx, cy + 8.5)
  doc.line(cx - 8.5, cy, cx - 3, cy); doc.line(cx + 3, cy, cx + 8.5, cy)
  doc.setDrawColor(...GOLD); doc.setLineWidth(0.8); doc.line(cx, cy, cx + 7, cy - 7)
  doc.setFillColor(...GOLD); doc.circle(cx + 6.3, cy - 6.3, 1.1, 'F')
}

function header(doc: any, title: string, subtitle: string, orgName: string, landscape = true) {
  const w = landscape ? 297 : 210
  doc.setFillColor(...CHARCOAL); doc.rect(0, 0, w, 32, 'F')
  doc.setFillColor(...GOLD); doc.rect(0, 32, w, 1.2, 'F')  // gold rule under band
  drawLogo(doc, 20, 16)
  doc.setTextColor(...BANDTX); doc.setFont('helvetica', 'bold'); doc.setFontSize(15)
  doc.text('MIRSAD', 34, 14)
  doc.setTextColor(...BANDSUB); doc.setFont('helvetica', 'normal'); doc.setFontSize(7)
  doc.text('CYBERSECURITY GRC PLATFORM', 34, 19.5)
  doc.setTextColor(...BANDTX); doc.setFont('helvetica', 'bold'); doc.setFontSize(11)
  doc.text(title, 34, 27)
  doc.setTextColor(...BANDSUB); doc.setFont('helvetica', 'normal'); doc.setFontSize(8)
  const dateStr = new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })
  doc.text(orgName, w - 14, 13, { align: 'right' })
  doc.text(dateStr, w - 14, 19, { align: 'right' })
  doc.text(subtitle, w - 14, 25, { align: 'right' })
}

function footer(doc: any, pageNum: number, total: number, landscape = true) {
  const w = landscape ? 297 : 210
  const h = landscape ? 210 : 297
  doc.setDrawColor(...LINE); doc.setLineWidth(0.3); doc.line(14, h - 10, w - 14, h - 10)
  doc.setTextColor(...MUTED); doc.setFont('helvetica', 'normal'); doc.setFontSize(7)
  doc.text('MIRSAD · Cybersecurity GRC Platform · CONFIDENTIAL', 14, h - 5)
  doc.text(`Page ${pageNum} of ${total}`, w - 14, h - 5, { align: 'right' })
}

function statCards(doc: any, cards: { label: string; val: string; color: RGB }[], y: number) {
  const gap = 4, cw = 50
  cards.forEach((s, i) => {
    const x = 14 + i * (cw + gap)
    doc.setFillColor(...WHITE); doc.setDrawColor(...LINE); doc.setLineWidth(0.4)
    doc.roundedRect(x, y, cw, 17, 1.5, 1.5, 'FD')
    doc.setFillColor(...s.color); doc.roundedRect(x, y, 1.6, 17, 0, 0, 'F') // colored spine
    doc.setTextColor(...s.color); doc.setFont('helvetica', 'bold'); doc.setFontSize(17)
    doc.text(s.val, x + 7, y + 10)
    doc.setTextColor(...MUTED); doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5)
    doc.text(s.label, x + 7, y + 14.5)
  })
}

const BASE_TABLE = {
  theme: 'grid' as const,
  styles: { fontSize: 8, cellPadding: 3, textColor: INK, fillColor: WHITE, lineColor: LINE, lineWidth: 0.2, valign: 'middle' as const },
  headStyles: { fillColor: CHARCOAL, textColor: BANDTX, fontStyle: 'bold' as const, fontSize: 7.5, cellPadding: 3.5 },
  alternateRowStyles: { fillColor: ZEBRA },
}

export async function exportRisksPDF(risks: Risk[], orgName: string) {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  const critical = risks.filter(r => r.risk_level === 'Critical').length
  const high = risks.filter(r => r.risk_level === 'High').length
  const open = risks.filter(r => r.status === 'Open').length

  header(doc, 'Risk Register', `${risks.length} risks · ${critical} critical · ${open} open`, orgName)
  statCards(doc, [
    { label: 'TOTAL RISKS', val: String(risks.length), color: SLATE },
    { label: 'CRITICAL', val: String(critical), color: RED },
    { label: 'HIGH', val: String(high), color: ORANGE },
    { label: 'OPEN', val: String(open), color: BLUE },
    { label: 'MITIGATED', val: String(risks.filter(r => r.status === 'Mitigated').length), color: GREEN },
  ], 40)

  autoTable(doc, {
    ...BASE_TABLE,
    startY: 62,
    head: [['Risk ID', 'Title', 'Framework', 'L', 'I', 'Score', 'Level', 'Treatment', 'Status', 'Owner']],
    body: risks.map(r => [
      r.risk_ref || '', r.title, (r.framework_id || '').replace(/_/g, ' '),
      String(r.likelihood || ''), String(r.impact || ''), String(r.risk_score || ''),
      r.risk_level || '', r.treatment || '', r.status || '', r.owner_name || '-',
    ]),
    columnStyles: {
      0: { fontStyle: 'bold', textColor: MUTED as any, cellWidth: 18 },
      1: { cellWidth: 62 }, 3: { halign: 'center', cellWidth: 8 }, 4: { halign: 'center', cellWidth: 8 },
      5: { halign: 'center', fontStyle: 'bold', cellWidth: 12 }, 6: { fontStyle: 'bold' },
    },
    didParseCell: (d: any) => {
      if (d.section !== 'body') return
      if (d.column.index === 6) d.cell.styles.textColor = levelRGB(String(d.cell.raw))
      if (d.column.index === 8) d.cell.styles.textColor = statusRGB(String(d.cell.raw))
    },
    didDrawPage: (d: any) => footer(doc, d.pageNumber, (doc as any).internal.getNumberOfPages()),
    margin: { left: 14, right: 14 },
  })

  doc.save(`MIRSAD-Risk-Register-${orgName.replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.pdf`)
}

export async function exportFindingsPDF(findings: Finding[], orgName: string) {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  const crit = findings.filter(f => f.severity === 'Critical').length
  const open = findings.filter(f => f.status === 'Open').length

  header(doc, 'Audit Findings', `${findings.length} findings · ${crit} critical · ${open} open`, orgName)
  statCards(doc, [
    { label: 'TOTAL', val: String(findings.length), color: SLATE },
    { label: 'CRITICAL', val: String(crit), color: RED },
    { label: 'HIGH', val: String(findings.filter(f => f.severity === 'High').length), color: ORANGE },
    { label: 'MEDIUM', val: String(findings.filter(f => f.severity === 'Medium').length), color: AMBER },
    { label: 'RESOLVED', val: String(findings.filter(f => f.status === 'Resolved').length), color: GREEN },
  ], 40)

  autoTable(doc, {
    ...BASE_TABLE,
    startY: 62,
    head: [['Finding ID', 'Title', 'Severity', 'Framework', 'Domain', 'Control', 'Status', 'Assignee', 'AI Rating']],
    body: findings.map(f => [
      f.finding_ref || '', f.title, f.severity || '', (f.framework_id || '').replace(/_/g, ' '),
      f.domain_ref || '-', f.control_ref || '-', f.status || '', f.assignee_name || '-', f.ai_rating || '-',
    ]),
    columnStyles: {
      0: { fontStyle: 'bold', textColor: MUTED as any, cellWidth: 22 },
      1: { cellWidth: 66 }, 2: { fontStyle: 'bold' },
    },
    didParseCell: (d: any) => {
      if (d.section !== 'body') return
      if (d.column.index === 2) d.cell.styles.textColor = sevRGB(String(d.cell.raw))
      if (d.column.index === 6) d.cell.styles.textColor = statusRGB(String(d.cell.raw))
    },
    didDrawPage: (d: any) => footer(doc, d.pageNumber, (doc as any).internal.getNumberOfPages()),
    margin: { left: 14, right: 14 },
  })

  doc.save(`MIRSAD-Audit-Findings-${orgName.replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.pdf`)
}

export async function exportDocumentPDF(document: any, orgName: string) {
  const { default: jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const w = 210, PH = 297, margin = 18, bottom = PH - 16

  header(doc, document.title, `${document.document_type || 'Document'} · v${document.version || '1.0'}`, orgName, false)

  // classification strip
  doc.setFillColor(...ZEBRA); doc.rect(0, 33.2, w, 7, 'F')
  doc.setTextColor(...MUTED); doc.setFont('helvetica', 'bold'); doc.setFontSize(7)
  doc.text('CLASSIFICATION: CONFIDENTIAL - FOR INTERNAL USE ONLY', w / 2, 37.6, { align: 'center' })

  let y = 50
  const strip = (t: string) => t.replace(/\*\*(.*?)\*\*/g, '$1')
  const newPage = () => {
    footer(doc, (doc as any).internal.getNumberOfPages(), (doc as any).internal.getNumberOfPages(), false)
    doc.addPage(); y = 22
  }

  for (const raw of (document.content || '').split('\n')) {
    if (y > bottom) newPage()
    const line = raw
    if (line.startsWith('# ')) {
      y += 3
      doc.setTextColor(...INK); doc.setFont('helvetica', 'bold'); doc.setFontSize(15)
      doc.text(strip(line.slice(2)), margin, y); y += 2.5
      doc.setDrawColor(...GOLD); doc.setLineWidth(0.6); doc.line(margin, y, w - margin, y); y += 6
    } else if (line.startsWith('## ')) {
      y += 2.5
      doc.setTextColor(...CHARCOAL); doc.setFont('helvetica', 'bold'); doc.setFontSize(11.5)
      doc.text(strip(line.slice(3)), margin, y); y += 1.5
      doc.setDrawColor(...LINE); doc.setLineWidth(0.3); doc.line(margin, y, w - margin, y); y += 5
    } else if (line.startsWith('### ')) {
      y += 2
      doc.setTextColor(...SLATE); doc.setFont('helvetica', 'bold'); doc.setFontSize(10)
      doc.text(strip(line.slice(4)), margin, y); y += 5
    } else if (line.match(/^[-*] /)) {
      doc.setTextColor(...INK); doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5)
      doc.setFillColor(...GOLD); doc.circle(margin + 1.5, y - 1.3, 0.7, 'F')
      const wrapped = doc.splitTextToSize(strip(line.slice(2)), w - margin * 2 - 8)
      doc.text(wrapped, margin + 6, y); y += wrapped.length * 4.8 + 1
    } else if (!line.trim()) {
      y += 2.5
    } else {
      doc.setTextColor(...INK); doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5)
      const wrapped = doc.splitTextToSize(strip(line), w - margin * 2)
      doc.text(wrapped, margin, y); y += wrapped.length * 4.8 + 1.5
    }
  }

  footer(doc, (doc as any).internal.getNumberOfPages(), (doc as any).internal.getNumberOfPages(), false)
  doc.save(`MIRSAD-${(document.title || 'Document').replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.pdf`)
}

// ── Excel ────────────────────────────────────────────────────────────────────
function styleSheet(utils: any, ws: any, titleCols: number) {
  // Column widths handled by caller; here we just set a frozen header-ish look
  ws['!freeze'] = { xSplit: 0, ySplit: 4 }
}

export async function exportRisksXLSX(risks: Risk[]) {
  const { utils, writeFile } = await import('xlsx')
  const header = ['Risk ID', 'Title', 'Framework', 'Category', 'Likelihood', 'Impact', 'Score', 'Level', 'Treatment', 'Status', 'Owner', 'Due Date']
  const ws = utils.aoa_to_sheet([
    ['MIRSAD - Risk Register'],
    [`Organization export · Generated ${new Date().toLocaleString('en-GB')}`],
    [],
    header,
    ...risks.map(r => [r.risk_ref, r.title, (r.framework_id || '').replace(/_/g, ' '), r.category, r.likelihood, r.impact, r.risk_score, r.risk_level, r.treatment, r.status, r.owner_name || '', r.due_date || '']),
  ])
  ws['!cols'] = [{ wch: 12 }, { wch: 42 }, { wch: 12 }, { wch: 14 }, { wch: 11 }, { wch: 8 }, { wch: 8 }, { wch: 10 }, { wch: 12 }, { wch: 13 }, { wch: 20 }, { wch: 12 }]
  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: header.length - 1 } }, { s: { r: 1, c: 0 }, e: { r: 1, c: header.length - 1 } }]
  ws['!freeze'] = { xSplit: 0, ySplit: 4 }
  const wb = utils.book_new(); utils.book_append_sheet(wb, ws, 'Risk Register')
  writeFile(wb, `MIRSAD-Risk-Register-${new Date().toISOString().slice(0, 10)}.xlsx`)
}

export async function exportFindingsXLSX(findings: Finding[]) {
  const { utils, writeFile } = await import('xlsx')
  const header = ['Finding ID', 'Title', 'Severity', 'Framework', 'Domain', 'Control Ref', 'Status', 'Assignee', 'AI Rating', 'Due Date']
  const ws = utils.aoa_to_sheet([
    ['MIRSAD - Audit Findings'],
    [`Organization export · Generated ${new Date().toLocaleString('en-GB')}`],
    [],
    header,
    ...findings.map(f => [f.finding_ref, f.title, f.severity, (f.framework_id || '').replace(/_/g, ' '), f.domain_ref || '', f.control_ref || '', f.status, f.assignee_name || '', f.ai_rating || '', f.due_date || '']),
  ])
  ws['!cols'] = [{ wch: 13 }, { wch: 46 }, { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 13 }, { wch: 20 }, { wch: 24 }, { wch: 12 }]
  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: header.length - 1 } }, { s: { r: 1, c: 0 }, e: { r: 1, c: header.length - 1 } }]
  ws['!freeze'] = { xSplit: 0, ySplit: 4 }
  const wb = utils.book_new(); utils.book_append_sheet(wb, ws, 'Audit Findings')
  writeFile(wb, `MIRSAD-Audit-Findings-${new Date().toISOString().slice(0, 10)}.xlsx`)
}

// ── Word ─────────────────────────────────────────────────────────────────────
// Dark text on Word's white page. The old version used near-white text, which
// was invisible once opened in Word.
export async function exportDocumentDOCX(document: any, orgName: string) {
  const { Document: Docx, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, Packer } = await import('docx')
  const saveAs = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob)
    const a = Object.assign(window.document.createElement('a'), { href: url, download: name })
    window.document.body.appendChild(a); a.click()
    setTimeout(() => { URL.revokeObjectURL(url); a.remove() }, 1000)
  }

  const INKX = '1A1D20', SLATEX = '495057', MUTEDX = '6C757D', GOLDX = 'B08D3D'

  const children: any[] = [
    new Paragraph({ children: [new TextRun({ text: 'MIRSAD', bold: true, size: 32, color: INKX })], alignment: AlignmentType.CENTER, spacing: { after: 40 } }),
    new Paragraph({ children: [new TextRun({ text: 'Cybersecurity GRC Platform', size: 18, color: MUTEDX })], alignment: AlignmentType.CENTER, spacing: { after: 220 } }),
    new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun({ text: document.title, bold: true, size: 36, color: INKX })], alignment: AlignmentType.CENTER, spacing: { after: 140 } }),
    new Paragraph({
      children: [
        new TextRun({ text: `Organization: ${orgName}   `, color: SLATEX, size: 18 }),
        new TextRun({ text: `Framework: ${(document.framework_id || '').replace(/_/g, ' ')}   `, color: SLATEX, size: 18 }),
        new TextRun({ text: `Version: ${document.version || '1.0'}   `, color: SLATEX, size: 18 }),
        new TextRun({ text: `Date: ${new Date().toLocaleDateString('en-GB')}`, color: SLATEX, size: 18 }),
      ],
      alignment: AlignmentType.CENTER, spacing: { after: 100 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'CLASSIFICATION: CONFIDENTIAL - FOR INTERNAL USE ONLY', bold: true, color: GOLDX, size: 16 })],
      alignment: AlignmentType.CENTER,
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'B08D3D', space: 6 } },
      spacing: { after: 360 },
    }),
  ]

  const strip = (t: string) => t.replace(/\*\*(.*?)\*\*/g, '$1')
  for (const line of (document.content || '').split('\n')) {
    if (line.startsWith('# ')) {
      children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: strip(line.slice(2)), bold: true, color: INKX })], spacing: { before: 280, after: 140 } }))
    } else if (line.startsWith('## ')) {
      children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: strip(line.slice(3)), bold: true, color: CHARCOALX() })], spacing: { before: 200, after: 90 } }))
    } else if (line.startsWith('### ')) {
      children.push(new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun({ text: strip(line.slice(4)), bold: true, color: SLATEX })], spacing: { before: 150, after: 70 } }))
    } else if (line.match(/^[-*] /)) {
      children.push(new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: strip(line.slice(2)), color: INKX })], spacing: { after: 60 } }))
    } else if (line.trim()) {
      children.push(new Paragraph({ children: [new TextRun({ text: strip(line), color: INKX })], spacing: { after: 90 } }))
    } else {
      children.push(new Paragraph({ children: [new TextRun('')], spacing: { after: 40 } }))
    }
  }

  const docx = new Docx({
    creator: 'MIRSAD GRC Platform', title: document.title,
    description: `${document.document_type || 'Document'} generated by MIRSAD for ${orgName}`,
    sections: [{ properties: {}, children }],
  })
  const blob = await Packer.toBlob(docx)
  saveAs(blob, `MIRSAD-${(document.title || 'Document').replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.docx`)
}

function CHARCOALX() { return '212529' }
