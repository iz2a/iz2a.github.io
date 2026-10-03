// pdf-generator.ts - Server-side PDF using jsPDF + jspdf-autotable

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

type RGB = [number,number,number]
const DB:  RGB = [30,  58,  95]
const MB:  RGB = [37,  99, 235]
const LB:  RGB = [219,234,254]
const TL:  RGB = [8,  145, 178]
const GD:  RGB = [31,  41,  55]
const GM:  RGB = [107,114,128]
const GL:  RGB = [249,250,251]
const GN:  RGB = [229,231,235]
const WH:  RGB = [255,255,255]

export async function generatePdf(params: {
  content: string; framework_id: string; control_ref: string;
  controlTitle: string; docType: string; organization: string;
}): Promise<Buffer> {
  const { content, framework_id, control_ref, controlTitle, docType, organization } = params

  // Load at call-time to avoid bundle issues
  const jsPDFModule = require('jspdf')
  const jsPDF = jsPDFModule.jsPDF || jsPDFModule.default?.jsPDF || jsPDFModule
  require('jspdf-autotable')

  const fwName  = FW_NAMES[framework_id] || framework_id
  const docName = DOC_NAMES[docType]     || docType
  const today   = new Date().toISOString().slice(0,10)
  const nextYear= new Date(Date.now()+365*24*60*60*1000).toISOString().slice(0,10)
  const docRef  = `${docType.slice(0,3).toUpperCase()}-${control_ref.replace(/[.-]/g,'-')}-001`

  const pdf = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' })
  const PW=210, PH=297, ML=20, MR=20, MT=18, MB2=18
  const CW = PW-ML-MR
  let pageNum = 1

  const sc  = (rgb: RGB) => { pdf.setTextColor(rgb[0],rgb[1],rgb[2]) }
  const sf  = (rgb: RGB) => { pdf.setFillColor(rgb[0],rgb[1],rgb[2]) }
  const sd  = (rgb: RGB) => { pdf.setDrawColor(rgb[0],rgb[1],rgb[2]) }
  const hl  = (y: number, rgb=GN, lw=0.3) => { sd(rgb); pdf.setLineWidth(lw); pdf.line(ML,y,PW-MR,y) }

  const addHdr = () => {
    sc(GM); pdf.setFontSize(8); pdf.setFont('helvetica','normal')
    pdf.text(`${control_ref}  -  ${controlTitle}`, ML, 11)
    pdf.text(organization, PW-MR, 11, {align:'right'})
    sd(MB); pdf.setLineWidth(0.5); pdf.line(ML,13,PW-MR,13)
  }
  const addFtr = () => {
    sd(MB); pdf.setLineWidth(0.5); pdf.line(ML,PH-12,PW-MR,PH-12)
    sc(GM); pdf.setFontSize(8); pdf.setFont('helvetica','normal')
    pdf.text(`${docRef}  ·  ${docName}  ·  CONFIDENTIAL`, ML, PH-9)
    pdf.text(`Page ${pageNum}`, PW-MR, PH-9, {align:'right'})
  }
  const newPage = () => { addFtr(); pdf.addPage(); pageNum++; addHdr() }
  const chk = (needed=10) => { if (y+needed > PH-MB2-16) { newPage(); y=MT+8 } }
  const strip = (t: string) => t.replace(/\*\*([^*]+)\*\*/g,'$1')

  // ── COVER PAGE ─────────────────────────────────────────────────────────────
  sf(DB); pdf.rect(0,0,PW,65,'F')
  pdf.setFont('helvetica','bold'); pdf.setFontSize(38); sc(WH)
  pdf.text('MIRSAD', ML, 28)
  pdf.setFontSize(13); pdf.setFont('helvetica','normal')
  pdf.setTextColor(147,197,253); pdf.text('Cybersecurity GRC Platform', ML, 40)
  pdf.setFontSize(9); pdf.setTextColor(96,165,250)
  pdf.text('National Cybersecurity Authority Compliance Suite', ML, 50)

  // Accent stripe + title block
  sf(MB); pdf.rect(0,65,5,75,'F')
  sf(LB); pdf.rect(5,65,PW-5,75,'F')
  pdf.setFontSize(9); pdf.setFont('helvetica','bold'); sc(MB)
  pdf.text(docName.toUpperCase(), ML+7, 78)
  pdf.setFontSize(20); pdf.setFont('helvetica','bold'); sc(DB)
  const titleLines = pdf.splitTextToSize(controlTitle, CW-15) as string[]
  pdf.text(titleLines, ML+7, 92)
  const afterTitle = 92 + titleLines.length * 9
  pdf.setFontSize(10); pdf.setFont('helvetica','bold'); sc(GM)
  pdf.text('Control Reference: ', ML+7, afterTitle)
  sc(MB); pdf.text(control_ref, ML+7+pdf.getTextWidth('Control Reference: '), afterTitle)
  pdf.setFontSize(9); pdf.setFont('helvetica','normal'); sc(GM)
  pdf.text(fwName, ML+7, afterTitle+8)

  // Document info table
  let ty = 150
  pdf.setFontSize(12); pdf.setFont('helvetica','bold'); sc(DB)
  pdf.text('Document Information', ML, ty); ty+=5

  const autoT = (pdf as any).autoTable.bind(pdf)
  autoT({
    startY: ty,
    body: [
      ['Organization',   organization],
      ['Doc Reference',  docRef],
      ['Document Type',  docName],
      ['Version',        '1.0 - Draft'],
      ['Effective Date', today],
      ['Next Review',    nextYear],
      ['Classification', 'CONFIDENTIAL - Internal Use Only'],
      ['Owner',          'Chief Information Security Officer (CISO)'],
    ],
    margin:{left:ML,right:MR}, tableWidth:CW,
    columnStyles:{0:{cellWidth:52,fontStyle:'bold',fillColor:LB,textColor:DB},1:{cellWidth:CW-52,textColor:GD}},
    styles:{fontSize:9,cellPadding:3,lineColor:GN,lineWidth:0.3},
    alternateRowStyles:{fillColor:GL}, theme:'grid',
  })

  ty = (pdf as any).lastAutoTable.finalY + 6
  pdf.setFontSize(12); pdf.setFont('helvetica','bold'); sc(DB)
  pdf.text('Regulatory Reference', ML, ty); ty+=5

  autoT({
    startY: ty,
    body:[['Framework',fwName],['Control Ref',control_ref],['Control',controlTitle]],
    margin:{left:ML,right:MR}, tableWidth:CW,
    columnStyles:{0:{cellWidth:52,fontStyle:'bold',fillColor:LB,textColor:DB},1:{cellWidth:CW-52,textColor:GD}},
    styles:{fontSize:9,cellPadding:3,lineColor:GN,lineWidth:0.3},
    alternateRowStyles:{fillColor:GL}, theme:'grid',
  })

  hl(PH-20,GN,0.3)
  pdf.setFontSize(8); pdf.setFont('helvetica','bold'); sc(GM)
  pdf.text('CLASSIFICATION: CONFIDENTIAL - FOR INTERNAL USE ONLY', PW/2, PH-16, {align:'center'})

  // ── BODY PAGES ─────────────────────────────────────────────────────────────
  pdf.addPage(); pageNum++; addHdr()
  let y = MT+8

  const skipPfx = ['**Document Reference:**','**Version:**','**Classification:**',
    '**Effective Date:**','**Owner:**','**Approved By:**','**Next Review:**',
    '**Regulatory Reference:**','**Control Reference:**','**Framework:**',
    '**Organization:**','**Process Owner:**','**Control:**']

  const lines = content.split('\n')
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (skipPfx.some(p=>line.startsWith(p)) || line==='---') { i++; continue }
    if (line.startsWith('# ') && i<4) { i++; continue }

    if (line.startsWith('# ')) {
      chk(16); pdf.setFontSize(18); pdf.setFont('helvetica','bold'); sc(DB)
      pdf.text(strip(line.slice(2)), ML, y); y+=2; hl(y,MB,0.6); y+=7; i++; continue
    }
    if (line.startsWith('## ')) {
      chk(14); pdf.setFontSize(14); pdf.setFont('helvetica','bold'); sc(MB)
      pdf.text(strip(line.slice(3)), ML, y); y+=1.5; hl(y,LB,0.4); y+=6; i++; continue
    }
    if (line.startsWith('### ')) {
      chk(11); pdf.setFontSize(11); pdf.setFont('helvetica','bold'); sc(TL)
      pdf.text(strip(line.slice(4)), ML, y); y+=6; i++; continue
    }

    if (line.startsWith('| ')) {
      const tLines: string[] = []
      while (i<lines.length && lines[i].startsWith('| ')) { tLines.push(lines[i]); i++ }
      const rows = tLines.filter(l=>!l.match(/^\|[-:\s|]+\|$/))
      if (rows.length>=2) {
        const pr = (r: string) => r.split('|').filter((_,ix,arr)=>ix>0&&ix<arr.length-1).map(c=>strip(c.trim()))
        chk(20)
        autoT({
          startY:y, head:[pr(rows[0])], body:rows.slice(1).map(pr),
          margin:{left:ML,right:MR}, tableWidth:CW,
          headStyles:{fillColor:DB,textColor:WH,fontStyle:'bold',fontSize:9},
          bodyStyles:{textColor:GD,fontSize:9},
          alternateRowStyles:{fillColor:GL},
          styles:{cellPadding:3,lineColor:GN,lineWidth:0.3}, theme:'grid',
          didDrawPage:()=>{ pageNum++; addHdr() }
        })
        y=(pdf as any).lastAutoTable.finalY+6
      }
      continue
    }

    if (line.match(/^[-*] /)) {
      chk(8); const wrapped=pdf.splitTextToSize(`• ${strip(line.slice(2))}`,CW-6) as string[]
      pdf.setFontSize(10); pdf.setFont('helvetica','normal'); sc(GD)
      pdf.text(wrapped,ML+4,y); y+=wrapped.length*5+1; i++; continue
    }
    if (line.match(/^\d+\. /)) {
      chk(8); const num=line.match(/^(\d+)\. /)![1]
      const wrapped=pdf.splitTextToSize(`${num}. ${strip(line.replace(/^\d+\. /,''))}`,CW-6) as string[]
      pdf.setFontSize(10); pdf.setFont('helvetica','normal'); sc(GD)
      pdf.text(wrapped,ML+4,y); y+=wrapped.length*5+1; i++; continue
    }
    if (!line.trim()) { y+=3; i++; continue }

    chk(8); const wrapped=pdf.splitTextToSize(strip(line),CW) as string[]
    pdf.setFontSize(10); pdf.setFont('helvetica','normal'); sc(GD)
    pdf.text(wrapped,ML,y); y+=wrapped.length*5.5+1.5; i++
  }

  addFtr()
  return Buffer.from(pdf.output('arraybuffer') as ArrayBuffer)
}
