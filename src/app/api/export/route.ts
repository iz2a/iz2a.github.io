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

// ── Shared helpers ─────────────────────────────────────────────────────────────
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
const strip = (t: string) => t.replace(/\*\*([^*]+)\*\*/g,'$1')

// ── DOCX builder ───────────────────────────────────────────────────────────────
async function buildDocx(p: {
  content:string; framework_id:string; control_ref:string;
  controlTitle:string; docType:string; organization:string
}): Promise<Buffer> {
  const { content, framework_id, control_ref, controlTitle, docType, organization } = p
  const {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
    ShadingType, VerticalAlign, PageNumber, PageBreak, TabStopType, TabStopPosition,
  } = require('docx')

  const fwName  = FW[framework_id]  || framework_id
  const docName = DN[docType]       || docType
  const today   = new Date().toISOString().slice(0,10)
  const nextYear= new Date(Date.now()+365*24*60*60*1000).toISOString().slice(0,10)
  const docRef  = `${docType.slice(0,3).toUpperCase()}-${control_ref.replace(/[.-]/g,'-')}-001`
  const C = { db:'1E3A5F',mb:'2563EB',lb:'DBEAFE',tl:'0891B2',gd:'1F2937',gm:'6B7280',gl:'F9FAFB',gn:'E5E7EB',wh:'FFFFFF' }

  const bdr = (color='E5E7EB',size=4) => ({ style:BorderStyle.SINGLE, size, color })
  const bs  = (c='E5E7EB') => ({ top:bdr(c),bottom:bdr(c),left:bdr(c),right:bdr(c) })
  const nob = { style:BorderStyle.NONE, size:0, color:'FFFFFF' }
  const nbs = () => ({ top:nob,bottom:nob,left:nob,right:nob })

  const hc = (text:string,w:number) => new TableCell({ borders:bs(C.mb), width:{size:w,type:WidthType.DXA}, shading:{fill:C.db,type:ShadingType.CLEAR}, margins:{top:120,bottom:120,left:160,right:160}, verticalAlign:VerticalAlign.CENTER, children:[new Paragraph({alignment:AlignmentType.LEFT,children:[new TextRun({text,font:'Arial',size:20,bold:true,color:C.wh})]})] })
  const dc = (text:string,w:number,shade?:string,bold=false,clr=C.gd) => new TableCell({ borders:bs(), width:{size:w,type:WidthType.DXA}, shading:shade?{fill:shade,type:ShadingType.CLEAR}:undefined, margins:{top:100,bottom:100,left:160,right:160}, verticalAlign:VerticalAlign.CENTER, children:[new Paragraph({children:[new TextRun({text:String(text||'-'),font:'Arial',size:20,bold,color:clr})]})] })

  const mkHdr = (l:string,r:string) => new Header({ children:[new Paragraph({ border:{bottom:{style:BorderStyle.SINGLE,size:8,color:C.mb,space:4}}, tabStops:[{type:TabStopType.RIGHT,position:TabStopPosition.MAX}], spacing:{after:0}, children:[new TextRun({text:l,font:'Arial',size:18,color:C.gm}),new TextRun({text:'\t'}),new TextRun({text:r,font:'Arial',size:18,color:C.gm})] })] })
  const mkFtr = (l:string) => new Footer({ children:[new Paragraph({ border:{top:{style:BorderStyle.SINGLE,size:8,color:C.mb,space:4}}, tabStops:[{type:TabStopType.RIGHT,position:TabStopPosition.MAX}], spacing:{before:0}, children:[new TextRun({text:l,font:'Arial',size:18,color:C.gm}),new TextRun({text:'\t'}),new TextRun({text:'Page ',font:'Arial',size:18,color:C.gm}),new TextRun({children:[PageNumber.CURRENT],font:'Arial',size:18,color:C.gm}),new TextRun({text:' of ',font:'Arial',size:18,color:C.gm}),new TextRun({children:[PageNumber.TOTAL_PAGES],font:'Arial',size:18,color:C.gm})] })] })
  const pi = (text:string) => text.split(/\*\*([^*]+)\*\*/).map((x,j)=>new TextRun({text:x,font:'Arial',size:22,bold:j%2===1,color:j%2===1?C.db:C.gd}))
  const metaT = (rows:[string,string][]) => new Table({ width:{size:9026,type:WidthType.DXA},columnWidths:[2800,6226], rows:rows.map(([k,v],i)=>new TableRow({children:[dc(k,2800,C.lb,true,C.db),dc(v,6226,i%2===0?C.wh:C.gl)]})) })
  const tocEntries = () => { const e:any[]=[]; let n=0; for(const l of content.split('\n')){ if(l.startsWith('## ')){n++;e.push(new Paragraph({spacing:{before:80,after:40},children:[new TextRun({text:`${n}.  ${strip(l.slice(3))}`,font:'Arial',size:22,color:C.gd})]}))} else if(l.startsWith('### ')){e.push(new Paragraph({spacing:{before:30,after:20},indent:{left:360},children:[new TextRun({text:strip(l.slice(4)),font:'Arial',size:20,color:C.gm})]}))} }; return e.length?e:[new Paragraph({children:[new TextRun({text:'-',font:'Arial',size:20,color:C.gm,italics:true})]})] }

  const parseBody = () => {
    const out:any[] = []
    const skip = ['**Document Reference:**','**Version:**','**Classification:**','**Effective Date:**','**Owner:**','**Next Review:**','**Framework:**','**Organization:**','**Control:**','**Approved By:**','**Process Owner:**','**Regulatory Reference:**','**Control Reference:**','**Assessor:**','**Assessment Date:**']
    const lines = content.split('\n'); let i=0
    while(i<lines.length) {
      const l = lines[i]
      if(skip.some(s=>l.startsWith(s))||l==='---'){i++;continue}
      if(l.startsWith('# ')&&i<4){i++;continue}
      if(l.startsWith('# ')){out.push(new Paragraph({heading:HeadingLevel.HEADING_1,spacing:{before:480,after:160},children:[new TextRun({text:l.slice(2),font:'Arial',size:36,bold:true,color:C.db})]}));i++;continue}
      if(l.startsWith('## ')){out.push(new Paragraph({heading:HeadingLevel.HEADING_2,spacing:{before:360,after:120},border:{bottom:{style:BorderStyle.SINGLE,size:8,color:C.mb,space:2}},children:[new TextRun({text:l.slice(3),font:'Arial',size:28,bold:true,color:C.mb})]}));i++;continue}
      if(l.startsWith('### ')){out.push(new Paragraph({heading:HeadingLevel.HEADING_3,spacing:{before:240,after:80},children:[new TextRun({text:l.slice(4),font:'Arial',size:24,bold:true,color:C.tl})]}));i++;continue}
      if(l.startsWith('| ')){
        const tl:string[]=[];while(i<lines.length&&lines[i].startsWith('| ')){tl.push(lines[i]);i++}
        const rows=tl.filter(r=>!r.match(/^\|[-:\s|]+\|$/))
        if(rows.length>=1){const pr=(r:string)=>r.split('|').filter((_,ix,a)=>ix>0&&ix<a.length-1).map(c=>c.trim());const cc=pr(rows[0]).length;const tw=9026;const cw=Math.floor(tw/cc);const cws=Array(cc).fill(cw);out.push(new Table({width:{size:tw,type:WidthType.DXA},columnWidths:cws,rows:rows.map((r,ri)=>new TableRow({tableHeader:ri===0,children:pr(r).map((cell,ci)=>ri===0?hc(cell,cws[ci]):dc(cell,cws[ci],ri%2===1?C.gl:C.wh))}))}));out.push(new Paragraph({spacing:{after:160},children:[]}))}
        continue
      }
      if(l.match(/^[-*] /)){out.push(new Paragraph({numbering:{reference:'bullets',level:0},spacing:{before:40,after:40},children:pi(l.slice(2))}));i++;continue}
      if(l.match(/^\d+\. /)){out.push(new Paragraph({numbering:{reference:'numbers',level:0},spacing:{before:40,after:40},children:pi(l.replace(/^\d+\. /,''))}));i++;continue}
      if(!l.trim()){out.push(new Paragraph({spacing:{after:80},children:[]}));i++;continue}
      out.push(new Paragraph({spacing:{before:40,after:80},children:pi(l)}));i++
    }
    return out
  }

  const hdrStr = `${control_ref}  -  ${controlTitle}`
  const ftrStr = `${docRef}  ·  ${docName}  ·  CONFIDENTIAL`

  const doc = new Document({
    numbering:{config:[
      {reference:'bullets',levels:[{level:0,format:'bullet',text:'•',alignment:'left',style:{paragraph:{indent:{left:720,hanging:360}}}}]},
      {reference:'numbers',levels:[{level:0,format:'decimal',text:'%1.',alignment:'left',style:{paragraph:{indent:{left:720,hanging:360}}}}]},
    ]},
    styles:{default:{document:{run:{font:'Arial',size:22}}},paragraphStyles:[
      {id:'Heading1',name:'Heading 1',basedOn:'Normal',next:'Normal',quickFormat:true,run:{size:36,bold:true,font:'Arial',color:C.db},paragraph:{spacing:{before:480,after:160},outlineLevel:0}},
      {id:'Heading2',name:'Heading 2',basedOn:'Normal',next:'Normal',quickFormat:true,run:{size:28,bold:true,font:'Arial',color:C.mb},paragraph:{spacing:{before:360,after:120},outlineLevel:1}},
      {id:'Heading3',name:'Heading 3',basedOn:'Normal',next:'Normal',quickFormat:true,run:{size:24,bold:true,font:'Arial',color:C.tl},paragraph:{spacing:{before:240,after:80},outlineLevel:2}},
    ]},
    sections:[
      // ── Cover ──
      {properties:{page:{size:{width:11906,height:16838},margin:{top:0,right:0,bottom:0,left:0}}},children:[
        new Table({width:{size:11906,type:WidthType.DXA},columnWidths:[11906],rows:[new TableRow({children:[new TableCell({borders:nbs(),width:{size:11906,type:WidthType.DXA},shading:{fill:C.db,type:ShadingType.CLEAR},margins:{top:1440,bottom:1440,left:1440,right:1440},children:[new Paragraph({children:[new TextRun({text:'MIRSAD',font:'Arial',size:96,bold:true,color:C.wh})]}),new Paragraph({spacing:{before:80},children:[new TextRun({text:'مِرصاد  ·  Cybersecurity GRC Platform',font:'Arial',size:28,color:'93C5FD'})]}),new Paragraph({spacing:{before:40},children:[new TextRun({text:'National Cybersecurity Authority Compliance Suite',font:'Arial',size:22,color:'60A5FA'})]})]})]})]})
        ,new Table({width:{size:11906,type:WidthType.DXA},columnWidths:[560,11346],rows:[new TableRow({children:[new TableCell({borders:nbs(),width:{size:560,type:WidthType.DXA},shading:{fill:C.mb,type:ShadingType.CLEAR},children:[new Paragraph({children:[]})]}),new TableCell({borders:nbs(),width:{size:11346,type:WidthType.DXA},shading:{fill:C.lb,type:ShadingType.CLEAR},margins:{top:800,bottom:800,left:1440,right:1440},children:[new Paragraph({children:[new TextRun({text:docName.toUpperCase(),font:'Arial',size:22,bold:true,color:C.mb,characterSpacing:80})]}),new Paragraph({spacing:{before:100},children:[new TextRun({text:controlTitle,font:'Arial',size:56,bold:true,color:C.db})]}),new Paragraph({spacing:{before:200},children:[new TextRun({text:'Control Reference: ',font:'Arial',size:24,bold:true,color:C.gm}),new TextRun({text:control_ref,font:'Arial',size:24,bold:true,color:C.mb})]}),new Paragraph({spacing:{before:80},children:[new TextRun({text:fwName,font:'Arial',size:22,color:C.gm})]})]})]})]}),
        new Table({width:{size:11906,type:WidthType.DXA},columnWidths:[11906],rows:[new TableRow({children:[new TableCell({borders:nbs(),width:{size:11906,type:WidthType.DXA},margins:{top:1000,bottom:1000,left:1440,right:1440},children:[
          new Paragraph({spacing:{after:180},children:[new TextRun({text:'Document Information',font:'Arial',size:28,bold:true,color:C.db})]}),
          metaT([['Organization',organization],['Doc Reference',docRef],['Document Type',docName],['Version','1.0 - Draft'],['Effective Date',today],['Next Review',nextYear],['Classification','CONFIDENTIAL - Internal Use Only'],['Owner','Chief Information Security Officer (CISO)'],['Approved By','______________________________']]),
          new Paragraph({spacing:{before:600,after:180},children:[new TextRun({text:'Regulatory Reference',font:'Arial',size:28,bold:true,color:C.db})]}),
          metaT([['Framework',fwName],['Control Ref',control_ref],['Control',controlTitle]]),
          new Paragraph({spacing:{before:800},alignment:AlignmentType.CENTER,border:{top:{style:BorderStyle.SINGLE,size:6,color:C.gn,space:8}},children:[new TextRun({text:'CLASSIFICATION: CONFIDENTIAL - FOR INTERNAL USE ONLY',font:'Arial',size:18,bold:true,color:C.gm,characterSpacing:40})]}),
        ]})]})]}),
      ]},
      // ── TOC ──
      {properties:{page:{size:{width:11906,height:16838},margin:{top:1440,right:1260,bottom:1440,left:1260}}},headers:{default:mkHdr(hdrStr,organization)},footers:{default:mkFtr(ftrStr)},children:[
        new Paragraph({heading:HeadingLevel.HEADING_1,spacing:{before:0,after:200},children:[new TextRun({text:'Table of Contents',font:'Arial',size:36,bold:true,color:C.db})]}),
        new Paragraph({spacing:{after:120},children:[new TextRun({text:'Open in Word → press Ctrl+A then F9 to update page numbers.',font:'Arial',size:18,color:C.gm,italics:true})]}),
        ...tocEntries(),
        new Paragraph({children:[new PageBreak()]}),
      ]},
      // ── Body ──
      {properties:{page:{size:{width:11906,height:16838},margin:{top:1440,right:1260,bottom:1440,left:1260}}},headers:{default:mkHdr(hdrStr,organization)},footers:{default:mkFtr(ftrStr)},children:parseBody()},
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

  type RGB=[number,number,number]
  const DB:RGB=[30,58,95],MB:RGB=[37,99,235],LB:RGB=[219,234,254],TL:RGB=[8,145,178]
  const GD:RGB=[31,41,55],GM:RGB=[107,114,128],GL:RGB=[249,250,251],GN:RGB=[229,231,235],WH:RGB=[255,255,255]

  const pdf = new jsPDF({orientation:'portrait',unit:'mm',format:'a4'})
  const PW=210,PH=297,ML=20,MR=20,MT=18,CW=PW-ML-MR
  let pg=1
  const sc=(r:RGB)=>pdf.setTextColor(r[0],r[1],r[2])
  const sf=(r:RGB)=>pdf.setFillColor(r[0],r[1],r[2])
  const sd=(r:RGB)=>pdf.setDrawColor(r[0],r[1],r[2])
  const hl=(y:number,r=GN,lw=0.3)=>{sd(r);pdf.setLineWidth(lw);pdf.line(ML,y,PW-MR,y)}
  const AT=(pdf as any).autoTable.bind(pdf)
  const addHdr=()=>{sc(GM);pdf.setFontSize(8);pdf.setFont('helvetica','normal');pdf.text(`${control_ref}  -  ${controlTitle}`,ML,11);pdf.text(organization,PW-MR,11,{align:'right'});sd(MB);pdf.setLineWidth(0.5);pdf.line(ML,13,PW-MR,13)}
  const addFtr=()=>{sd(MB);pdf.setLineWidth(0.5);pdf.line(ML,PH-12,PW-MR,PH-12);sc(GM);pdf.setFontSize(8);pdf.setFont('helvetica','normal');pdf.text(`${docRef}  ·  ${docName}  ·  CONFIDENTIAL`,ML,PH-9);pdf.text(`Page ${pg}`,PW-MR,PH-9,{align:'right'})}
  const np=()=>{addFtr();pdf.addPage();pg++;addHdr()}
  let y=0
  const chk=(n=10)=>{if(y+n>PH-18-16){np();y=MT+8}}

  // Cover
  sf(DB);pdf.rect(0,0,PW,65,'F')
  pdf.setFont('helvetica','bold');pdf.setFontSize(38);sc(WH);pdf.text('MIRSAD',ML,28)
  pdf.setFontSize(13);pdf.setFont('helvetica','normal');pdf.setTextColor(147,197,253);pdf.text('Cybersecurity GRC Platform',ML,40)
  pdf.setFontSize(9);pdf.setTextColor(96,165,250);pdf.text('National Cybersecurity Authority Compliance Suite',ML,50)
  sf(MB);pdf.rect(0,65,5,75,'F');sf(LB);pdf.rect(5,65,PW-5,75,'F')
  pdf.setFontSize(9);pdf.setFont('helvetica','bold');sc(MB);pdf.text(docName.toUpperCase(),ML+7,78)
  pdf.setFontSize(20);pdf.setFont('helvetica','bold');sc(DB)
  const tlines=pdf.splitTextToSize(controlTitle,CW-15) as string[];pdf.text(tlines,ML+7,92)
  const at=92+tlines.length*9;pdf.setFontSize(10);pdf.setFont('helvetica','bold');sc(GM)
  pdf.text('Control Reference: ',ML+7,at);sc(MB);pdf.text(control_ref,ML+7+pdf.getTextWidth('Control Reference: '),at)
  pdf.setFontSize(9);pdf.setFont('helvetica','normal');sc(GM);pdf.text(fwName,ML+7,at+8)
  let ty=150;pdf.setFontSize(12);pdf.setFont('helvetica','bold');sc(DB);pdf.text('Document Information',ML,ty);ty+=5
  AT({startY:ty,body:[['Organization',organization],['Doc Reference',docRef],['Document Type',docName],['Version','1.0 - Draft'],['Effective Date',today],['Next Review',nextYear],['Classification','CONFIDENTIAL - Internal Use Only'],['Owner','CISO']],margin:{left:ML,right:MR},tableWidth:CW,columnStyles:{0:{cellWidth:52,fontStyle:'bold',fillColor:LB,textColor:DB},1:{cellWidth:CW-52,textColor:GD}},styles:{fontSize:9,cellPadding:3,lineColor:GN,lineWidth:0.3},alternateRowStyles:{fillColor:GL},theme:'grid'})
  ty=(pdf as any).lastAutoTable.finalY+6;pdf.setFontSize(12);pdf.setFont('helvetica','bold');sc(DB);pdf.text('Regulatory Reference',ML,ty);ty+=5
  AT({startY:ty,body:[['Framework',fwName],['Control Ref',control_ref],['Control',controlTitle]],margin:{left:ML,right:MR},tableWidth:CW,columnStyles:{0:{cellWidth:52,fontStyle:'bold',fillColor:LB,textColor:DB},1:{cellWidth:CW-52,textColor:GD}},styles:{fontSize:9,cellPadding:3,lineColor:GN,lineWidth:0.3},alternateRowStyles:{fillColor:GL},theme:'grid'})
  hl(PH-20,GN,0.3);pdf.setFontSize(8);pdf.setFont('helvetica','bold');sc(GM);pdf.text('CLASSIFICATION: CONFIDENTIAL - FOR INTERNAL USE ONLY',PW/2,PH-16,{align:'center'})

  // Body
  pdf.addPage();pg++;addHdr();y=MT+8
  const skip=['**Document Reference:**','**Version:**','**Classification:**','**Effective Date:**','**Owner:**','**Next Review:**','**Framework:**','**Organization:**','**Control:**','**Approved By:**','**Regulatory Reference:**']
  const lines=content.split('\n');let i=0
  while(i<lines.length){
    const l=lines[i]
    if(skip.some(s=>l.startsWith(s))||l==='---'){i++;continue}
    if(l.startsWith('# ')&&i<4){i++;continue}
    if(l.startsWith('# ')){chk(16);pdf.setFontSize(18);pdf.setFont('helvetica','bold');sc(DB);pdf.text(strip(l.slice(2)),ML,y);y+=2;hl(y,MB,0.6);y+=7;i++;continue}
    if(l.startsWith('## ')){chk(14);pdf.setFontSize(14);pdf.setFont('helvetica','bold');sc(MB);pdf.text(strip(l.slice(3)),ML,y);y+=1.5;hl(y,LB,0.4);y+=6;i++;continue}
    if(l.startsWith('### ')){chk(11);pdf.setFontSize(11);pdf.setFont('helvetica','bold');sc(TL);pdf.text(strip(l.slice(4)),ML,y);y+=6;i++;continue}
    if(l.startsWith('| ')){
      const tls:string[]=[];while(i<lines.length&&lines[i].startsWith('| ')){tls.push(lines[i]);i++}
      const rows=tls.filter(r=>!r.match(/^\|[-:\s|]+\|$/))
      if(rows.length>=2){const pr=(r:string)=>r.split('|').filter((_,ix,a)=>ix>0&&ix<a.length-1).map(c=>strip(c.trim()));chk(20);AT({startY:y,head:[pr(rows[0])],body:rows.slice(1).map(pr),margin:{left:ML,right:MR},tableWidth:CW,headStyles:{fillColor:DB,textColor:WH,fontStyle:'bold',fontSize:9},bodyStyles:{textColor:GD,fontSize:9},alternateRowStyles:{fillColor:GL},styles:{cellPadding:3,lineColor:GN,lineWidth:0.3},theme:'grid',didDrawPage:()=>{pg++;addHdr()}});y=(pdf as any).lastAutoTable.finalY+6}
      continue
    }
    if(l.match(/^[-*] /)){chk(8);const w=pdf.splitTextToSize(`• ${strip(l.slice(2))}`,CW-6) as string[];pdf.setFontSize(10);pdf.setFont('helvetica','normal');sc(GD);pdf.text(w,ML+4,y);y+=w.length*5+1;i++;continue}
    if(l.match(/^\d+\. /)){chk(8);const w=pdf.splitTextToSize(`${l.match(/^(\d+)\./)?.[1]}. ${strip(l.replace(/^\d+\. /,''))}`,CW-6) as string[];pdf.setFontSize(10);pdf.setFont('helvetica','normal');sc(GD);pdf.text(w,ML+4,y);y+=w.length*5+1;i++;continue}
    if(!l.trim()){y+=3;i++;continue}
    chk(8);const w=pdf.splitTextToSize(strip(l),CW) as string[];pdf.setFontSize(10);pdf.setFont('helvetica','normal');sc(GD);pdf.text(w,ML,y);y+=w.length*5.5+1.5;i++
  }
  addFtr()
  return Buffer.from(pdf.output('arraybuffer') as ArrayBuffer)
}
