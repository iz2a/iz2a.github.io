'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { exportRisksPDF, exportFindingsPDF, exportRisksXLSX, exportFindingsXLSX, exportDocumentPDF, exportDocumentDOCX } from '@/lib/export'
import { PUBLIC_MODE, GUEST_PROFILE, GUEST_ORG, demoList, demoInsert, demoUpdate, demoDelete, resetDemo, seedRisks, seedFindings, setGuestActive, isGuest } from '@/lib/public-mode'

// ── MIRSAD (مِرصاد) - "The Watchtower" ───────────────────────────────────────
// From Surah Al-Fajr: "Indeed, your Lord is ever watchful" - إِنَّ رَبَّكَ لَبِالْمِرْصَادِ
// Theme: Clean enterprise navy - deep space navy, royal blue, crisp white

const T = {
  bg:       '#1a1d20',
  bg2:      '#212529',
  bg3:      '#272b2f',
  card:     '#2d3136',
  border:   '#3d4247',
  border2:  '#495057',
  blue:     '#ffffff',
  blueL:    '#e9ecef',
  blueBright:'#adb5bd',
  royal:    '#343a40',
  accent:   '#adb5bd',
  accentL:  '#ced4da',
  white:    '#F0F4FF',
  whiteM:   '#adb5bd',
  whiteDim: '#6c757d',
  success:  '#adb5bd',
  warning:  '#ced4da',
  danger:   '#dc3545',
  dangerL:  '#F87171',
}

const FW = {
  NCA_ECC:  { color:'#adb5bd', ratingScale:['N/A','Partially Implemented','Fully Implemented'], ratingColors:['#dc3545','#adb5bd','#6c757d','#495057','#f8f9fa'] },
  NCA_DCC:  { color:'#adb5bd', ratingScale:['N/A','Partially Implemented','Fully Implemented'], ratingColors:['#dc3545','#adb5bd','#6c757d','#495057','#f8f9fa'] },
  SAMA_CSF: { color:'#ced4da', ratingScale:['Level 1','Level 2','Level 3','Level 4','Level 5'], ratingColors:['#dc3545','#adb5bd','#6c757d','#495057','#f8f9fa'] },
  ISO_27001:{ color:'#dee2e6', ratingScale:['N/A','Partially Implemented','Fully Implemented'], ratingColors:['#dc3545','#adb5bd','#6c757d','#495057','#f8f9fa'] },
  NIST_CSF: { color:'#adb5bd', ratingScale:['Partial','Risk Informed','Repeatable','Adaptive'], ratingColors:['#dc3545','#adb5bd','#6c757d','#495057','#f8f9fa'] },
}

const COMPLIANCE = {
  NCA_ECC:  { domains:[{id:'1-1',name:'Cybersecurity Governance',controls:7,pct:85},{id:'1-2',name:'Risk Management',controls:6,pct:70},{id:'2-1',name:'Asset Management',controls:5,pct:60},{id:'2-2',name:'Identity & Access',controls:8,pct:88},{id:'2-3',name:'Vulnerability Management',controls:6,pct:65},{id:'2-4',name:'Third-Party Security',controls:5,pct:60},{id:'2-5',name:'Cloud & Hosting',controls:7,pct:72},{id:'3-1',name:'Resilience',controls:6,pct:75}] },
  NCA_DCC:  { domains:[{id:'DC-1',name:'Data Governance',controls:6,pct:78},{id:'DC-2',name:'Classification & Labelling',controls:5,pct:65},{id:'DC-3',name:'Data Protection',controls:9,pct:80},{id:'DC-4',name:'Retention & Disposal',controls:4,pct:88},{id:'DC-5',name:'Transfer Security',controls:5,pct:90}] },
  SAMA_CSF: { domains:[{id:'CS-1',name:'Leadership & Governance',controls:10,pct:64},{id:'CS-2',name:'Risk Management',controls:8,pct:56},{id:'CS-3',name:'Operations & Technology',controls:15,pct:60},{id:'CS-4',name:'Third-Party',controls:7,pct:50},{id:'CS-5',name:'Resilience & Recovery',controls:6,pct:66}] },
  ISO_27001:{ domains:[{id:'A.5',name:'Organizational Controls',controls:37,pct:83},{id:'A.6',name:'People Controls',controls:8,pct:82},{id:'A.7',name:'Physical Controls',controls:14,pct:81},{id:'A.8',name:'Technological Controls',controls:34,pct:79}] },
  NIST_CSF: { domains:[{id:'GV',name:'Govern',controls:6,pct:83},{id:'ID',name:'Identify',controls:6,pct:70},{id:'PR',name:'Protect',controls:6,pct:75},{id:'DE',name:'Detect',controls:3,pct:70},{id:'RS',name:'Respond',controls:4,pct:78},{id:'RC',name:'Recover',controls:3,pct:72}] },
}

const TEMPLATES = [
  { id:'isp',    name:'Information Security Policy',         cat:'Policy',    fw:['NCA_ECC','SAMA_CSF','ISO_27001'] },
  { id:'drp',    name:'Disaster Recovery Procedure',         cat:'Procedure', fw:['SAMA_CSF','NCA_ECC','ISO_27001'] },
  { id:'dc',     name:'Data Classification Standard',        cat:'Standard',  fw:['NCA_DCC','ISO_27001'] },
  { id:'iam',    name:'Identity & Access Management Policy', cat:'Policy',    fw:['NCA_ECC','SAMA_CSF','ISO_27001'] },
  { id:'ir',     name:'Incident Response Procedure',         cat:'Procedure', fw:['SAMA_CSF','ISO_27001','NIST_CSF'] },
  { id:'bcp',    name:'Business Continuity Plan',            cat:'Plan',      fw:['SAMA_CSF','ISO_27001','NIST_CSF'] },
  { id:'vuln',   name:'Vulnerability Management Standard',   cat:'Standard',  fw:['NCA_ECC','NIST_CSF'] },
  { id:'vendor', name:'Third-Party Risk Assessment',         cat:'Template',  fw:['NCA_ECC','SAMA_CSF','ISO_27001'] },
]

const INTEGRATIONS = [
  { id:'servicenow', name:'ServiceNow',      tag:'SN', color:'#adb5bd', desc:'GRC & risk management' },
  { id:'jira',       name:'Jira',            tag:'JR', color:'#6c757d', desc:'Finding & task tracking' },
  { id:'siem',       name:'SIEM',            tag:'SM', color:'#adb5bd', desc:'Threat intelligence' },
  { id:'email',      name:'Email Alerts',    tag:'EM', color:'#ced4da', desc:'Automated notifications' },
  { id:'ad',         name:'Active Directory',tag:'AD', color:'#6c757d', desc:'Identity & user sync' },
  { id:'splunk',     name:'Splunk',          tag:'SP', color:'#888',    desc:'Log aggregation' },
]

const ROLE_LABELS = { admin:'Administrator', grc_manager:'GRC Manager', analyst:'GRC Analyst', viewer:'Viewer' }
const ROLE_COLORS = { admin:'#f8f9fa', grc_manager:'#adb5bd', analyst:'#6c757d', viewer:'#495057' }
const SECTORS = ['Financial / Banking','Insurance','Government','Military & Defense','Healthcare','Energy & Utilities','Telecommunications','Technology','Education','Other']

// ── AUTH FETCH - sends Bearer token with every API call ───────────────────────
let _cachedToken = ''
async function getToken(supabaseClient) {
  const { data: { session } } = await supabaseClient.auth.getSession()
  _cachedToken = session?.access_token || ''
  return _cachedToken
}
async function authFetch(url, options = {}, supabaseClient = null) {
  let token = _cachedToken
  if (!token && supabaseClient) token = await getToken(supabaseClient)
  // If still no token, wait briefly and retry once (fixes flash error on first load)
  if (!token) {
    await new Promise(r => setTimeout(r, 800))
    token = _cachedToken
  }
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      ...(token ? { 'Authorization': 'Bearer ' + token } : {}),
    }
  })
}



const fwScore = (id: string, findings: any[], risks: any[]) => {
  // Real calculation: score = 100 - penalty for open/critical items
  const fFindings = findings.filter(f => f.framework_id === id)
  const fRisks    = risks.filter(r => r.framework_id === id)
  if (fFindings.length === 0 && fRisks.length === 0) return 0  // no data
  const total     = fFindings.length + fRisks.length
  const critical  = fFindings.filter(f => f.severity === 'Critical').length
  const high      = fFindings.filter(f => f.severity === 'High').length
  const openRisks = fRisks.filter(r => r.status === 'Open' && (r.risk_level === 'Critical' || r.risk_level === 'High')).length
  const resolved  = fFindings.filter(f => f.status === 'Resolved').length
  const penalty   = (critical * 15) + (high * 7) + (openRisks * 8)
  const bonus     = total > 0 ? Math.round((resolved / total) * 20) : 0
  return Math.min(100, Math.max(0, 100 - penalty + bonus))
}
const riskLevel = (s) => s>=15?['Critical','#dc3545']:s>=10?['High','#adb5bd']:s>=6?['Medium','#6c757d']:['Low','#495057']
const sevColor = (s) => ({Critical:'#dc3545',High:'#adb5bd',Medium:'#6c757d',Low:'#495057',Informational:'#495057'})[s]||'#495057'

// ── ATOMS ──────────────────────────────────────────────────────────────────────
const Pill = ({ label, color, sm=true }) => (
  <span style={{display:'inline-flex',alignItems:'center',background:color+'1A',color,border:`1px solid ${color}33`,borderRadius:4,padding:sm?'2px 8px':'3px 11px',fontSize:sm?10:12,fontWeight:600,whiteSpace:'nowrap'}}>{label}</span>
)

const Bar = ({ pct, color, h=4 }) => (
  <div style={{background:T.border,borderRadius:2,height:h,overflow:'hidden'}}>
    <div style={{width:`${Math.min(pct,100)}%`,background:color,height:'100%',transition:'width 0.6s ease'}}/>
  </div>
)

const Ring = ({ pct, color, size=60 }) => {
  const r=size/2-6, c=2*Math.PI*r, dash=(pct/100)*c
  return (
    <div style={{position:'relative',width:size,height:size,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <svg width={size} height={size} style={{position:'absolute',top:0,left:0,transform:'rotate(-90deg)'}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={T.border2} strokeWidth={5}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={5} strokeDasharray={`${dash} ${c-dash}`} strokeLinecap="round"/>
      </svg>
      <span style={{fontSize:size*.18,fontWeight:800,color,zIndex:1}}>{pct}%</span>
    </div>
  )
}

const Spinner = () => (
  <div style={{display:'flex',alignItems:'center',justifyContent:'center',padding:48}}>
    <div style={{width:32,height:32,border:`3px solid ${T.border2}`,borderTopColor:T.blueL,borderRadius:'50%',animation:'spin 0.7s linear infinite'}}/>
  </div>
)

const CS = {background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:16}

const Modal = ({ title, onClose, children, wide=false }) => (
  <div style={{position:'fixed',inset:0,background:'#000000dd',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:20}} onClick={e=>e.target===e.currentTarget&&onClose()}>
    <div style={{background:T.bg3,border:`1px solid ${T.border2}`,borderRadius:12,width:'100%',maxWidth:wide?740:560,maxHeight:'88vh',overflow:'auto',boxShadow:'0 32px 80px #00000088'}}>
      <div style={{padding:'15px 20px',borderBottom:`1px solid ${T.border}`,display:'flex',justifyContent:'space-between',alignItems:'center',position:'sticky',top:0,background:T.bg3,zIndex:1}}>
        <span style={{fontSize:14,fontWeight:700,color:T.white}}>{title}</span>
        <button onClick={onClose} style={{background:'none',border:'none',color:T.whiteM,cursor:'pointer',fontSize:20,lineHeight:1,padding:'0 4px'}}>x</button>
      </div>
      <div style={{padding:20}}>{children}</div>
    </div>
  </div>
)

const Inp = ({ label, ...p }) => (
  <div style={{marginBottom:12}}>
    {label&&<label style={{fontSize:10,color:T.whiteM,display:'block',marginBottom:4,textTransform:'uppercase',letterSpacing:'0.07em',fontWeight:600}}>{label}</label>}
    <input {...p} style={{width:'100%',background:T.bg2,border:`1px solid ${T.border}`,color:T.white,padding:'8px 11px',borderRadius:7,fontSize:13,outline:'none',boxSizing:'border-box',fontFamily:'inherit',transition:'border-color 0.15s',...(p.style||{})}}
      onFocus={e=>e.target.style.borderColor=T.blueL} onBlur={e=>e.target.style.borderColor=T.border}/>
  </div>
)

const Sel = ({ label, children, ...p }) => (
  <div style={{marginBottom:12}}>
    {label&&<label style={{fontSize:10,color:T.whiteM,display:'block',marginBottom:4,textTransform:'uppercase',letterSpacing:'0.07em',fontWeight:600}}>{label}</label>}
    <select {...p} style={{width:'100%',background:T.bg2,border:`1px solid ${T.border}`,color:T.white,padding:'8px 11px',borderRadius:7,fontSize:13,outline:'none',fontFamily:'inherit',...(p.style||{})}}>{children}</select>
  </div>
)

const Btn = ({ children, variant='primary', loading=false, ...p }) => {
  const vs = {
    primary: {background:'#343a40',color:'#f8f9fa',border:'1px solid #495057',boxShadow:'none'},
    secondary: {background:'transparent',border:`1px solid ${T.border2}`,color:T.whiteM},
    danger: {background:'#EF444411',border:'1px solid #EF444444',color:T.dangerL},
  }
  return (
    <button {...p} disabled={loading||p.disabled}
      style={{padding:'8px 16px',borderRadius:7,cursor:loading||p.disabled?'not-allowed':'pointer',fontSize:13,fontWeight:600,fontFamily:'inherit',opacity:loading||p.disabled?0.5:1,...(vs[variant]||vs.primary),...(p.style||{})}}>
      {loading?'...':children}
    </button>
  )
}

// ── AI CHAT ───────────────────────────────────────────────────────────────────
function AIChatPanel({ initialPrompt }) {
  const [msgs, setMsgs] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [noKey, setNoKey] = useState(false)
  const endRef = useRef(null)

  const send = useCallback(async (text) => {
    const msg = text||input
    if (!msg.trim()) return
    setInput('')
    const next = [...msgs, {role:'user',content:msg}]
    setMsgs(next); setLoading(true)
    try {
      const res = await authFetch('/api/ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'chat',messages:next})})
      const d = await res.json()
      if (d.error && (d.error === 'NO_API_KEY' || d.error.includes('API key')||d.error.includes('api_key')||d.error.includes('GEMINI'))) { setNoKey(true); setLoading(false); return }
      setMsgs(m=>[...m,{role:'assistant',content:d.content||d.error||'No response'}])
    } catch { setMsgs(m=>[...m,{role:'assistant',content:'Connection error.'}]) }
    setLoading(false)
  }, [input, msgs])

  useEffect(()=>{if(initialPrompt&&!sent){setSent(true);send(initialPrompt)}},[initialPrompt,sent])
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:'smooth'})},[msgs,loading])

  const md = (text) => (text||'').split('\n').map((line,i)=>{
    if(line.startsWith('# ')) return <div key={i} style={{fontSize:15,fontWeight:800,color:T.white,margin:'14px 0 5px'}}>{line.slice(2)}</div>
    if(line.startsWith('## ')) return <div key={i} style={{fontSize:13,fontWeight:700,color:T.blueBright,margin:'11px 0 4px',paddingBottom:3,borderBottom:`1px solid ${T.border}`}}>{line.slice(3)}</div>
    if(line.startsWith('### ')) return <div key={i} style={{fontSize:12,fontWeight:600,color:T.accentL,margin:'8px 0 3px'}}>{line.slice(4)}</div>
    if(line.startsWith('- ')) return <div key={i} style={{display:'flex',gap:7,margin:'2px 0',paddingLeft:4}}><span style={{color:T.blueL,flexShrink:0,marginTop:1}}>•</span><span style={{color:T.whiteM,fontSize:13}}>{line.slice(2)}</span></div>
    if(!line.trim()) return <div key={i} style={{height:5}}/>
    return <div key={i} style={{color:T.whiteM,fontSize:13,lineHeight:1.75}}>{line.replace(/\*\*(.*?)\*\*/g,'$1')}</div>
  })

  if (noKey) return (
    <div style={{background:'#050F18',border:`1px solid ${T.blueL}33`,borderRadius:10,padding:24}}>
      <div style={{fontSize:15,fontWeight:700,color:T.blueBright,marginBottom:8}}>Groq API Key Required - 100% Free</div>
      <div style={{fontSize:13,color:T.whiteM,lineHeight:1.8,marginBottom:16}}>Get your free Groq API key. No credit card. Generous free tier with fast Llama 3.3 70B.</div>
      <div style={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:8,padding:14,marginBottom:12}}>
        {[['1','Go to console.groq.com'],['2','Sign up for a free account (no credit card)'],['3','Go to API Keys and click Create API key'],['4','Copy the key (starts with gsk_)'],['5','Open your project .env.local file'],['6','Add line: GROQ_API_KEY=gsk_YOUR_KEY'],['7','Save file and restart: Ctrl+C then npm run dev']].map(([n,t])=>(
          <div key={n} style={{display:'flex',gap:9,marginBottom:7,alignItems:'flex-start'}}>
            <div style={{width:18,height:18,borderRadius:'50%',background:T.blue+'22',border:`1px solid ${T.blue}44`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:700,color:T.blueL,flexShrink:0}}>{n}</div>
            <div style={{fontSize:12,color:T.whiteM}}>{t}</div>
          </div>
        ))}
      </div>
      <div style={{fontFamily:'monospace',fontSize:11,color:T.blueBright,background:T.bg2,border:`1px solid ${T.border}`,borderRadius:6,padding:'8px 12px'}}>GROQ_API_KEY=gsk_...</div>
    </div>
  )

  const QUICK = [
    'Generate a cybersecurity policy aligned with NCA ECC v2.0 for a Saudi financial institution',
    'Provide a SAMA CSF gap analysis for domain CS-3 (Operations & Technology)',
    'Draft a data classification standard per NCA DCC v1.0',
    'What are the key differences between NCA ECC and SAMA CSF?',
  ]

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',minHeight:0}}>
      <div style={{flex:1,overflow:'auto',paddingRight:2}}>
        {msgs.length===0&&(
          <div style={{textAlign:'center',padding:'32px 0 20px'}}>
            <div style={{fontSize:28,fontWeight:900,color:T.white,marginBottom:4}}>MIRSAD</div>
            <div style={{fontSize:11,color:T.whiteM,marginBottom:4}}>مِرصاد - The Watchtower</div>
            <div style={{fontSize:10,color:T.whiteDim,marginBottom:20}}>NCA ECC · NCA DCC · SAMA CSF · ISO 27001 · NIST CSF 2.0</div>
            <div style={{display:'flex',flexDirection:'column',gap:6,maxWidth:500,margin:'0 auto'}}>
              {QUICK.map((q,i)=>(
                <button key={i} onClick={()=>send(q)}
                  style={{background:T.card,border:`1px solid ${T.border}`,color:T.whiteM,padding:'10px 13px',borderRadius:7,cursor:'pointer',fontSize:12,textAlign:'left',fontFamily:'inherit',transition:'all 0.15s'}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=T.blueL+'66';e.currentTarget.style.color=T.blueBright}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.color=T.whiteM}}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {msgs.map((m,i)=>(
          <div key={i} style={{marginBottom:14,display:'flex',gap:9,flexDirection:m.role==='user'?'row-reverse':'row'}}>
            <div style={{width:28,height:28,borderRadius:'50%',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,background:m.role==='user'?'#343a40':`${T.card}`,color:T.white,border:`1px solid ${m.role==='user'?T.blueL:T.border2}`}}>
              {m.role==='user'?'U':'AI'}
            </div>
            <div style={{maxWidth:'86%',background:m.role==='user'?T.blue+'14':T.card,border:`1px solid ${m.role==='user'?T.blueL+'33':T.border}`,borderRadius:9,padding:'11px 13px'}}>
              {m.role==='assistant'?md(m.content):<span style={{color:T.white,fontSize:13}}>{m.content}</span>}
            </div>
          </div>
        ))}
        {loading&&(
          <div style={{display:'flex',gap:9,marginBottom:14}}>
            <div style={{width:28,height:28,borderRadius:'50%',background:T.card,border:`1px solid ${T.border2}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:700,color:T.blueL}}>AI</div>
            <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:9,padding:'12px 14px',display:'flex',gap:5,alignItems:'center'}}>
              {[0,1,2].map(j=><div key={j} style={{width:6,height:6,borderRadius:'50%',background:T.blueL,animation:`bounce 1s ${j*0.18}s infinite`}}/>)}
            </div>
          </div>
        )}
        <div ref={endRef}/>
      </div>
      <div style={{borderTop:`1px solid ${T.border}`,paddingTop:11,marginTop:6}}>
        <div style={{display:'flex',gap:7}}>
          <textarea value={input} onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}}}
            placeholder="Ask about NCA ECC, SAMA CSF, generate documents... (Enter to send, Shift+Enter for newline)"
            style={{flex:1,background:T.bg2,border:`1px solid ${T.border}`,color:T.white,padding:'9px 11px',borderRadius:7,fontSize:13,resize:'none',height:62,outline:'none',fontFamily:'inherit',lineHeight:1.55}}/>
          <button onClick={()=>send()} disabled={loading||!input.trim()}
            style={{background:loading||!input.trim()?T.border:'#343a40',border:'none',borderRadius:7,padding:'0 15px',color:loading||!input.trim()?T.whiteDim:T.white,cursor:loading||!input.trim()?'not-allowed':'pointer',fontSize:17,fontWeight:700,minWidth:46,boxShadow:loading||!input.trim()?'none':'0 2px 12px #2563EB44'}}>
            {loading?'...':'>'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── EVIDENCE MODAL ─────────────────────────────────────────────────────────────
function EvidenceModal({ finding, onClose, onSave, notify }) {
  const [evidence, setEvidence] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const fw = FW[finding.framework_id] || FW.NCA_ECC
  const rColor = result ? (fw.ratingColors[fw.ratingScale.indexOf(result.rating)]||T.whiteM) : T.whiteM

  const review = async () => {
    if(!evidence.trim()) return; setLoading(true)
    try {
      const res = await authFetch('/api/ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'review_evidence',context:{finding,framework:{id:finding.framework_id,rating_scale:fw.ratingScale},evidenceText:evidence}})})
      const d = await res.json(); setResult(d)
    } catch { notify('AI review failed','error') }
    setLoading(false)
  }

  return (
    <Modal title={'AI Evidence Review - '+(finding.finding_ref||'')} onClose={onClose}>
      <div style={{marginBottom:11}}>
        <label style={{fontSize:10,color:T.whiteM,display:'block',marginBottom:4,textTransform:'uppercase',letterSpacing:'0.07em',fontWeight:600}}>Finding</label>
        <div style={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:7,padding:'9px 11px',fontSize:13,color:T.white}}>{finding.title}</div>
      </div>
      <div style={{display:'flex',gap:6,marginBottom:13}}><Pill label={finding.framework_id||''} color={fw.color}/><Pill label={fw.ratingScale.join(' > ')} color={T.whiteDim}/></div>
      <div style={{marginBottom:12}}>
        <label style={{fontSize:10,color:T.whiteM,display:'block',marginBottom:4,textTransform:'uppercase',letterSpacing:'0.07em',fontWeight:600}}>Evidence Description</label>
        <textarea value={evidence} onChange={e=>setEvidence(e.target.value)} placeholder="Describe the evidence collected..."
          style={{width:'100%',background:T.bg2,border:`1px solid ${T.border}`,color:T.white,padding:'9px 11px',borderRadius:7,fontSize:13,resize:'none',height:82,outline:'none',fontFamily:'inherit',lineHeight:1.6,boxSizing:'border-box'}}/>
      </div>
      <Btn onClick={review} loading={loading} disabled={!evidence.trim()} style={{width:'100%',marginBottom:12,padding:10}}>Analyze with AI</Btn>
      {result&&(
        <div style={{background:T.bg2,border:`1px solid ${rColor}44`,borderRadius:10,padding:14}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:10}}>
            <div><div style={{fontSize:9,color:T.whiteM,marginBottom:2}}>AI RATING</div><div style={{fontSize:22,fontWeight:800,color:rColor}}>{result.rating}</div></div>
            <div style={{textAlign:'right'}}><div style={{fontSize:9,color:T.whiteM,marginBottom:2}}>CONFIDENCE</div><div style={{fontSize:22,fontWeight:800,color:T.white}}>{result.confidence}%</div></div>
          </div>
          <div style={{fontSize:12,color:T.whiteM,lineHeight:1.7,marginBottom:8}}>{result.reasoning}</div>
          {(result.gaps||[]).length>0&&<div style={{marginBottom:7}}><div style={{fontSize:9,color:'#adb5bd',fontWeight:700,marginBottom:4}}>GAPS IDENTIFIED</div>{result.gaps.map((g,i)=><div key={i} style={{display:'flex',gap:6,marginBottom:2}}><span style={{color:'#adb5bd'}}>-</span><span style={{color:T.whiteM,fontSize:11}}>{g}</span></div>)}</div>}
          {(result.recommendations||[]).length>0&&<div><div style={{fontSize:9,color:'#adb5bd',fontWeight:700,marginBottom:4}}>RECOMMENDATIONS</div>{result.recommendations.map((r,i)=><div key={i} style={{display:'flex',gap:6,marginBottom:2}}><span style={{color:'#adb5bd'}}>+</span><span style={{color:T.whiteM,fontSize:11}}>{r}</span></div>)}</div>}
          <Btn onClick={()=>{onSave(finding.id,result);onClose()}} variant="secondary" style={{width:'100%',marginTop:11,padding:8,borderColor:'#adb5bd'+'44',color:'#adb5bd'}}>Save Rating to Finding</Btn>
        </div>
      )}
    </Modal>
  )
}

// ── RISK FORM ──────────────────────────────────────────────────────────────────
function RiskForm({ onClose, onSave, notify }) {
  const [f, setF] = useState({title:'',description:'',framework_id:'SAMA_CSF',category:'Technical',likelihood:3,impact:3,treatment:'Mitigate',status:'Open',owner_name:'',due_date:''})
  const [loading, setLoading] = useState(false)
  const u = (k,v) => setF(x=>({...x,[k]:v}))
  const score = f.likelihood*f.impact
  const [lvl,col] = riskLevel(score)

  const submit = async () => {
    if(!f.title) return; setLoading(true)
    try {
      if(isGuest()){ onSave(demoInsert('risks', f as any, 'risk_ref', 'RSK')); onClose(); setLoading(false); return }
      const res = await authFetch('/api/risks',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(f)})
      const d = await res.json()
      if(!res.ok){notify(d.error||'Failed to save risk','error');setLoading(false);return}
      onSave(d.data); onClose()
    } catch { notify('Network error','error') }
    setLoading(false)
  }

  return (
    <Modal title="Add New Risk" onClose={onClose} wide>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 14px'}}>
        <div style={{gridColumn:'1/-1'}}><Inp label="Risk Title *" value={f.title} onChange={e=>u('title',e.target.value)} placeholder="e.g. Unauthorized access to core banking system"/></div>
        <div style={{gridColumn:'1/-1'}}>
          <label style={{fontSize:10,color:T.whiteM,display:'block',marginBottom:4,textTransform:'uppercase',letterSpacing:'0.07em',fontWeight:600}}>Description</label>
          <textarea value={f.description} onChange={e=>u('description',e.target.value)} placeholder="Optional details..."
            style={{width:'100%',background:T.bg2,border:`1px solid ${T.border}`,color:T.white,padding:'8px 11px',borderRadius:7,fontSize:13,resize:'none',height:55,outline:'none',fontFamily:'inherit',marginBottom:12,boxSizing:'border-box'}}/>
        </div>
        <Sel label="Framework" value={f.framework_id} onChange={e=>u('framework_id',e.target.value)}>{Object.keys(FW).map(k=><option key={k} value={k}>{k.replace('_',' ')}</option>)}</Sel>
        <Sel label="Category" value={f.category} onChange={e=>u('category',e.target.value)}>{['Technical','Operational','Third-Party','People','Compliance','Financial'].map(c=><option key={c}>{c}</option>)}</Sel>
        <div>
          <label style={{fontSize:10,color:T.whiteM,display:'block',marginBottom:4,textTransform:'uppercase',letterSpacing:'0.07em',fontWeight:600}}>Likelihood: {f.likelihood}/5</label>
          <input type="range" min={1} max={5} value={f.likelihood} onChange={e=>u('likelihood',+e.target.value)} style={{width:'100%',marginBottom:12,accentColor:T.blueL}}/>
        </div>
        <div>
          <label style={{fontSize:10,color:T.whiteM,display:'block',marginBottom:4,textTransform:'uppercase',letterSpacing:'0.07em',fontWeight:600}}>Impact: {f.impact}/5</label>
          <input type="range" min={1} max={5} value={f.impact} onChange={e=>u('impact',+e.target.value)} style={{width:'100%',marginBottom:12,accentColor:T.blueL}}/>
        </div>
        <div style={{gridColumn:'1/-1',background:T.bg2,border:`1px solid ${col}33`,borderRadius:8,padding:'10px 14px',marginBottom:12,display:'flex',gap:20,alignItems:'center'}}>
          <div><div style={{fontSize:9,color:T.whiteM}}>RISK SCORE</div><div style={{fontSize:28,fontWeight:900,color:col,lineHeight:1}}>{score}</div></div>
          <div><div style={{fontSize:9,color:T.whiteM,marginBottom:3}}>LEVEL</div><Pill label={lvl} color={col} sm={false}/></div>
          <div style={{fontSize:11,color:T.whiteM}}>L{f.likelihood} x I{f.impact} = {score}</div>
        </div>
        <Sel label="Treatment" value={f.treatment} onChange={e=>u('treatment',e.target.value)}>{['Mitigate','Accept','Transfer','Avoid'].map(t=><option key={t}>{t}</option>)}</Sel>
        <Sel label="Status" value={f.status} onChange={e=>u('status',e.target.value)}>{['Open','In Progress','Mitigated','Accepted','Closed'].map(s=><option key={s}>{s}</option>)}</Sel>
        <Inp label="Risk Owner" value={f.owner_name} onChange={e=>u('owner_name',e.target.value)} placeholder="e.g. IT Security Team"/>
        <Inp label="Due Date" type="date" value={f.due_date} onChange={e=>u('due_date',e.target.value)}/>
      </div>
      <div style={{display:'flex',gap:8,marginTop:6}}>
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn onClick={submit} loading={loading} disabled={!f.title}>Save Risk</Btn>
      </div>
    </Modal>
  )
}

// ── FINDING FORM ───────────────────────────────────────────────────────────────
function FindingForm({ onClose, onSave, notify }) {
  const [f, setF] = useState({title:'',description:'',severity:'High',framework_id:'NCA_ECC',domain_ref:'',control_ref:'',status:'Open',assignee_name:'',due_date:''})
  const [loading, setLoading] = useState(false)
  const u = (k,v) => setF(x=>({...x,[k]:v}))

  const submit = async () => {
    if(!f.title) return; setLoading(true)
    try {
      if(isGuest()){ onSave(demoInsert('findings', f as any, 'finding_ref', 'FND')); onClose(); setLoading(false); return }
      const res = await authFetch('/api/findings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(f)})
      const d = await res.json()
      if(!res.ok){notify(d.error||'Failed to save finding','error');setLoading(false);return}
      onSave(d.data); onClose()
    } catch { notify('Network error','error') }
    setLoading(false)
  }

  return (
    <Modal title="Add New Finding" onClose={onClose} wide>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 14px'}}>
        <div style={{gridColumn:'1/-1'}}><Inp label="Finding Title *" value={f.title} onChange={e=>u('title',e.target.value)} placeholder="e.g. MFA not enforced on privileged admin accounts"/></div>
        <div style={{gridColumn:'1/-1'}}>
          <label style={{fontSize:10,color:T.whiteM,display:'block',marginBottom:4,textTransform:'uppercase',letterSpacing:'0.07em',fontWeight:600}}>Description</label>
          <textarea value={f.description} onChange={e=>u('description',e.target.value)} placeholder="Detailed finding description..."
            style={{width:'100%',background:T.bg2,border:`1px solid ${T.border}`,color:T.white,padding:'8px 11px',borderRadius:7,fontSize:13,resize:'none',height:55,outline:'none',fontFamily:'inherit',marginBottom:12,boxSizing:'border-box'}}/>
        </div>
        <Sel label="Severity" value={f.severity} onChange={e=>u('severity',e.target.value)}>{['Critical','High','Medium','Low','Informational'].map(s=><option key={s}>{s}</option>)}</Sel>
        <Sel label="Framework" value={f.framework_id} onChange={e=>u('framework_id',e.target.value)}>{Object.keys(FW).map(k=><option key={k} value={k}>{k.replace('_',' ')}</option>)}</Sel>
        <Sel label="Domain Reference" value={f.domain_ref} onChange={e=>u('domain_ref',e.target.value)}>
          <option value="">Select domain...</option>
          {(COMPLIANCE[f.framework_id]?.domains||[]).map(d=><option key={d.id} value={d.id}>{d.id} - {d.name}</option>)}
        </Sel>
        <Inp label="Control Reference" value={f.control_ref} onChange={e=>u('control_ref',e.target.value)} placeholder="e.g. CS-3.1, 2-2-1, A.8.24"/>
        <Inp label="Assignee" value={f.assignee_name} onChange={e=>u('assignee_name',e.target.value)} placeholder="e.g. Ahmed Al-Qahtani"/>
        <Inp label="Due Date" type="date" value={f.due_date} onChange={e=>u('due_date',e.target.value)}/>
      </div>
      <div style={{display:'flex',gap:8,marginTop:6}}>
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn onClick={submit} loading={loading} disabled={!f.title}>Save Finding</Btn>
      </div>
    </Modal>
  )
}

// ── DOC GENERATOR ──────────────────────────────────────────────────────────────
function DocGenerator({ notify, savedDocs, setSavedDocs, orgName, authFetch }) {
  const [sel, setSel] = useState(null)
  const [fwId, setFwId] = useState('NCA_ECC')
  const [org, setOrg] = useState(orgName||'')
  const [lang, setLang] = useState('English')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const generate = async () => {
    if(!sel||!org) return; setLoading(true); setResult(null)
    try {
      const res = await authFetch('/api/ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'generate_document',context:{template:sel,framework:{id:fwId,short_name:fwId.replace('_',' '),...FW[fwId]},organization:org,language:lang}})})
      const d = await res.json()
      if(d.error){notify(d.error,'error');setLoading(false);return}
      const doc={id:Date.now().toString(),title:sel.name,document_type:sel.cat,framework_id:fwId,language:lang,content:d.content||'',version:'1.0',status:'Draft',generated_by_ai:true}
      setResult(doc); setSavedDocs(x=>[doc,...x]); notify('Document generated!')
    } catch { notify('Generation failed - check GROQ_API_KEY in .env.local','error') }
    setLoading(false)
  }

  const md = (text) => (text||'').split('\n').map((line,i)=>{
    if(line.startsWith('# ')) return <div key={i} style={{fontSize:15,fontWeight:800,color:T.white,margin:'14px 0 5px'}}>{line.slice(2)}</div>
    if(line.startsWith('## ')) return <div key={i} style={{fontSize:13,fontWeight:700,color:'#adb5bd',margin:'11px 0 4px',paddingBottom:3,borderBottom:`1px solid #2d3136`}}>{line.slice(3)}</div>
    if(line.startsWith('- ')) return <div key={i} style={{display:'flex',gap:6,margin:'2px 0',paddingLeft:4}}><span style={{color:'#6c757d',flexShrink:0}}>•</span><span style={{color:'#adb5bd',fontSize:13}}>{line.slice(2)}</span></div>
    if(!line.trim()) return <div key={i} style={{height:4}}/>
    return <div key={i} style={{color:'#adb5bd',fontSize:13,lineHeight:1.7}}>{line.replace(/\*\*(.*?)\*\*/g,'$1')}</div>
  })

  const TEMPLATES = [
    {cat:'Policy',name:'Information Security Policy',desc:'High-level IS policy document'},
    {cat:'Policy',name:'Access Control Policy',desc:'IAM and access management policy'},
    {cat:'Policy',name:'Incident Response Policy',desc:'Cyber incident handling procedures'},
    {cat:'Policy',name:'Business Continuity Policy',desc:'BCP and disaster recovery policy'},
    {cat:'Policy',name:'Data Classification Policy',desc:'Data handling and classification'},
    {cat:'Procedure',name:'Vulnerability Management Procedure',desc:'Scan, track and remediate findings'},
    {cat:'Procedure',name:'Change Management Procedure',desc:'IT change control process'},
    {cat:'Procedure',name:'Backup & Recovery Procedure',desc:'Data backup and restore steps'},
    {cat:'Standard',name:'Password Standard',desc:'Password complexity and rotation rules'},
    {cat:'Standard',name:'Encryption Standard',desc:'Cryptography and key management'},
    {cat:'Plan',name:'Incident Response Plan',desc:'Step-by-step IR playbook'},
    {cat:'Plan',name:'Disaster Recovery Plan',desc:'DR runbook and RTO/RPO targets'},
  ]

  const cats = [...new Set(TEMPLATES.map(t=>t.cat))]

  const ROW:React.CSSProperties = {display:'flex',gap:10,marginBottom:10,alignItems:'center'}
  const LBL:React.CSSProperties = {fontSize:10,fontWeight:700,color:'#6c757d',textTransform:'uppercase' as const,letterSpacing:'0.08em',width:90,flexShrink:0}
  const INP:React.CSSProperties = {flex:1,background:'#1a1d20',border:'1px solid #3d4247',borderRadius:6,color:'#f8f9fa',padding:'8px 12px',fontSize:13,fontFamily:'inherit',outline:'none'}
  const SEL:React.CSSProperties = {...INP,cursor:'pointer'}

  return (
    <div style={{display:'grid',gridTemplateColumns:'340px 1fr',gap:14,height:'calc(100vh - 160px)'}}>

      {/* ── Left panel: controls ── */}
      <div style={{background:'#212529',border:'1px solid #2d3136',borderRadius:10,padding:20,overflowY:'auto' as const,display:'flex',flexDirection:'column' as const,gap:0}}>
        <div style={{fontSize:10,fontWeight:700,color:'#495057',textTransform:'uppercase' as const,letterSpacing:'0.1em',marginBottom:16}}>Document Generator</div>

        {/* Framework */}
        <div style={ROW}>
          <div style={LBL}>Framework</div>
          <select value={fwId} onChange={e=>setFwId(e.target.value)} style={SEL}>
            {Object.keys(FW).map(k=><option key={k} value={k}>{k.replace(/_/g,' ')}</option>)}
          </select>
        </div>

        {/* Organization */}
        <div style={ROW}>
          <div style={LBL}>Organization</div>
          <input value={org} onChange={e=>setOrg(e.target.value)} placeholder="Your org name" style={INP}/>
        </div>

        {/* Language */}
        <div style={ROW}>
          <div style={LBL}>Language</div>
          <select value={lang} onChange={e=>setLang(e.target.value)} style={SEL}>
            {['English','Arabic','Bilingual'].map(l=><option key={l}>{l}</option>)}
          </select>
        </div>

        <div style={{borderTop:'1px solid #2d3136',margin:'14px 0'}}/>

        {/* Template picker */}
        <div style={{fontSize:10,fontWeight:700,color:'#495057',textTransform:'uppercase' as const,letterSpacing:'0.08em',marginBottom:10}}>Select Template</div>
        {cats.map(cat=>(
          <div key={cat} style={{marginBottom:12}}>
            <div style={{fontSize:10,fontWeight:600,color:'#6c757d',marginBottom:6,paddingLeft:2}}>{cat}</div>
            {TEMPLATES.filter(t=>t.cat===cat).map(t=>(
              <div key={t.name} onClick={()=>setSel(t)}
                style={{padding:'9px 12px',borderRadius:7,marginBottom:4,cursor:'pointer',
                  background:sel?.name===t.name?'#2d3136':'transparent',
                  border:`1px solid ${sel?.name===t.name?'#495057':'transparent'}`,
                  transition:'all 0.15s'}}>
                <div style={{fontSize:12,fontWeight:600,color:sel?.name===t.name?'#f8f9fa':'#adb5bd'}}>{t.name}</div>
                <div style={{fontSize:11,color:'#495057',marginTop:2}}>{t.desc}</div>
              </div>
            ))}
          </div>
        ))}

        <div style={{marginTop:'auto',paddingTop:14}}>
          <button onClick={generate} disabled={loading||!sel||!org}
            style={{width:'100%',padding:'10px 0',
              background:loading||!sel||!org?'#2d3136':'#343a40',
              border:`1px solid ${loading||!sel||!org?'#3d4247':'#495057'}`,
              color:loading||!sel||!org?'#495057':'#f8f9fa',
              borderRadius:7,cursor:loading||!sel||!org?'not-allowed':'pointer',
              fontSize:13,fontWeight:700,fontFamily:'inherit',transition:'all 0.15s'}}
            onMouseEnter={e=>{if(!loading&&sel&&org)(e.target as any).style.background='#495057'}}
            onMouseLeave={e=>{if(!loading&&sel&&org)(e.target as any).style.background='#343a40'}}>
            {loading?'Generating…':'Generate Document'}
          </button>
        </div>
      </div>

      {/* ── Right panel: output ── */}
      <div style={{background:'#212529',border:'1px solid #2d3136',borderRadius:10,overflow:'hidden',display:'flex',flexDirection:'column' as const}}>
        {!result&&!loading&&(
          <div style={{flex:1,display:'flex',flexDirection:'column' as const,alignItems:'center',justifyContent:'center',color:'#495057'}}>
            <div style={{fontSize:32,marginBottom:12,opacity:0.3}}>📄</div>
            <div style={{fontSize:13,fontWeight:600}}>Select a template and click Generate</div>
            <div style={{fontSize:11,marginTop:6,color:'#3d4247'}}>AI-generated compliance document will appear here</div>
          </div>
        )}
        {loading&&(
          <div style={{flex:1,display:'flex',flexDirection:'column' as const,alignItems:'center',justifyContent:'center',gap:16}}>
            <Spinner/>
            <div style={{fontSize:13,color:'#6c757d'}}>Generating {sel?.name}…</div>
          </div>
        )}
        {result&&!loading&&(
          <div style={{flex:1,display:'flex',flexDirection:'column' as const,overflow:'hidden'}}>
            {/* doc header bar */}
            <div style={{padding:'14px 20px',borderBottom:'1px solid #2d3136',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
              <div>
                <div style={{fontSize:14,fontWeight:700,color:'#f8f9fa'}}>{result.title}</div>
                <div style={{fontSize:11,color:'#6c757d',marginTop:2}}>{result.framework_id.replace(/_/g,' ')} · {result.document_type} · {result.language}</div>
              </div>
              <div style={{display:'flex',gap:8}}>
                <button onClick={()=>{
                    exportDocumentPDF(result, org).catch(()=>notify('PDF export failed','error'))
                  }}
                  style={{padding:'7px 14px',background:'#2d3136',border:'1px solid #3d4247',color:'#adb5bd',borderRadius:6,cursor:'pointer',fontSize:11,fontWeight:600,fontFamily:'inherit'}}>
                  Export PDF
                </button>
                <button onClick={()=>{
                    exportDocumentDOCX(result, org).catch(()=>notify('DOCX export failed','error'))
                  }}
                  style={{padding:'7px 14px',background:'#343a40',border:'1px solid #495057',color:'#f8f9fa',borderRadius:6,cursor:'pointer',fontSize:11,fontWeight:600,fontFamily:'inherit'}}>
                  Export DOCX
                </button>
              </div>
            </div>
            {/* doc content */}
            <div style={{flex:1,overflowY:'auto' as const,padding:'20px 24px'}}>
              {md(result.content)}
            </div>
          </div>
        )}
      </div>

    </div>
  )
}

// ── AI EVIDENCE GENERATOR ─────────────────────────────────────────────────────
// ── EXPORT ACTIONS ───────────────────────────────────────────────────────────
function ExportActions({ content, framework_id, control_ref, controlTitle, docType, organization, authFetch, notify, onSaved }: any) {
  const [state, setState] = useState<Record<string,any>>({})
  const [copied, setCopied] = useState(false)
  const anyBusy = Object.values(state).some(v => v === true)
  const fwColor = '#adb5bd'

  const doExport = async (format: string, saveToEvidence: boolean) => {
    const key = saveToEvidence ? `save-${format}` : format
    setState(s => ({...s, [key]: true}))
    try {
      const res = await authFetch('/api/export-evidence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, framework_id, control_ref, controlTitle, docType, organization, format, saveToEvidence })
      })
      if (!res.ok) {
        const err = await res.json().catch(()=>({error:'Server error'}))
        notify('Export failed: ' + (err.error||'unknown'), 'error')
        setState(s => ({...s, [key]: false})); return
      }
      const d = await res.json()
      if (d.error) { notify('Export failed: ' + d.error, 'error'); setState(s => ({...s, [key]: false})); return }
      if (saveToEvidence) {
        notify(`Saved ${format.toUpperCase()} to Evidence repository`)
        if (onSaved) onSaved()
        setState(s => ({...s, [key]: 'done'}))
        setTimeout(() => setState(s => ({...s, [key]: false})), 2500)
      } else {
        const bytes = Uint8Array.from(atob(d.data), c => c.charCodeAt(0))
        const blob  = new Blob([bytes], { type: d.mimeType })
        const url   = URL.createObjectURL(blob)
        const a     = document.createElement('a')
        a.href = url; a.download = d.fileName; a.click()
        URL.revokeObjectURL(url)
        notify(`Downloaded ${d.fileName}`)
        setState(s => ({...s, [key]: false}))
      }
    } catch {
      notify('Export failed - check console', 'error')
      setState(s => ({...s, [key]: false}))
    }
  }

  const copyMd = () => {
    navigator.clipboard.writeText(content||'').then(() => {
      setCopied(true); setTimeout(()=>setCopied(false),2000)
      notify('Copied to clipboard')
    })
  }

  const Btn = ({ onClick, disabled, children, style }: any) => (
    <button onClick={onClick} disabled={disabled}
      style={{display:'flex',alignItems:'center',gap:5,padding:'7px 14px',borderRadius:7,
        cursor:disabled?'not-allowed':'pointer',fontSize:11,fontWeight:700,fontFamily:'inherit',
        transition:'opacity 0.15s',opacity:disabled?0.55:1,...style}}>
      {children}
    </button>
  )

  const sd = state['save-docx'], sp = state['save-pdf']

  return (
    <div style={{marginBottom:12}}>
      <div style={{display:'flex',gap:5,alignItems:'center',flexWrap:'wrap' as const,marginBottom:5}}>
        <span style={{fontSize:10,color:'#6c757d',fontWeight:600,marginRight:2}}>Download:</span>
        <Btn onClick={()=>doExport('docx',false)} disabled={anyBusy}
          style={{background:state.docx?'#2d3136':'#343a40',border:'1px solid #495057',color:state.docx?'#6c757d':'#f8f9fa'}}>
          <span style={{fontSize:13,fontWeight:900,fontFamily:'Georgia,serif'}}>W</span>
          {state.docx?'Generating…':'Word (.docx)'}
        </Btn>
        <Btn onClick={()=>doExport('pdf',false)} disabled={anyBusy}
          style={{background:state.pdf?'#2d3136':'#343a40',border:'1px solid #495057',color:state.pdf?'#6c757d':'#f8f9fa'}}>
          <span style={{fontSize:12,fontWeight:900}}>PDF</span>
          {state.pdf?'Generating…':'PDF (.pdf)'}
        </Btn>
        <div style={{width:1,height:20,background:'#2d3136'}}/>
        <Btn onClick={copyMd} disabled={anyBusy}
          style={{background:copied?'#2d3136':'#212529',border:`1px solid ${copied?'#adb5bd':'#3d4247'}`,color:copied?'#adb5bd':'#6c757d'}}>
          {copied?'✓ Copied':'Copy .md'}
        </Btn>
      </div>
      <div style={{display:'flex',gap:5,alignItems:'center',flexWrap:'wrap' as const}}>
        <span style={{fontSize:10,color:'#6c757d',fontWeight:600,marginRight:2}}>Save to Evidence:</span>
        <Btn onClick={()=>doExport('docx',true)} disabled={anyBusy}
          style={{background:sd==='done'?'#2d3136':'#212529',border:`1px solid ${sd==='done'?'#adb5bd':'#3d4247'}`,color:sd==='done'?'#adb5bd':sd?'#6c757d':'#adb5bd'}}>
          <span style={{fontSize:11,fontWeight:900,fontFamily:'Georgia,serif'}}>W</span>
          {sd==='done'?'✓ Saved':sd?'Saving…':'Save as Word'}
        </Btn>
        <Btn onClick={()=>doExport('pdf',true)} disabled={anyBusy}
          style={{background:sp==='done'?'#2d3136':'#212529',border:`1px solid ${sp==='done'?'#adb5bd':'#3d4247'}`,color:sp==='done'?'#adb5bd':sp?'#6c757d':'#adb5bd'}}>
          <span style={{fontSize:11,fontWeight:900}}>PDF</span>
          {sp==='done'?'✓ Saved':sp?'Saving…':'Save as PDF'}
        </Btn>
      </div>
      <div style={{marginTop:5,fontSize:9,color:'#495057'}}>
        Both formats include cover page · document metadata · formatted headings & tables · A4 · professional styling
      </div>
    </div>
  )
}


function AiEvidenceGenerator({ framework_id, control_ref, controlTitle, controlDesc, organization, authFetch, notify, profile, supabase, onFileSaved }) {
  const [open, setOpen]       = useState(false)
  const [docType, setDocType] = useState('policy')
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState(null)
  const [copied, setCopied]   = useState(false)

  const FW_COLORS = {NCA_ECC:'#adb5bd',NCA_DCC:'#adb5bd',SAMA_CSF:'#ced4da',ISO_27001:'#dee2e6',NIST_CSF:'#adb5bd'}
  const color = FW_COLORS[framework_id] || T.blueL

  const DOC_TYPES = [
    {id:'policy',            label:'Policy',             icon:'P',  desc:'Formal policy document for auditors'},
    {id:'procedure',         label:'Procedure',          icon:'PR', desc:'Step-by-step operational procedure'},
    {id:'evidence_checklist',label:'Evidence Checklist', icon:'✓',  desc:'Auditor checklist with evidence items'},
    {id:'implementation_guide',label:'Impl. Guide',      icon:'G',  desc:'Implementation roadmap and guidance'},
  ]

  const generate = async () => {
    setLoading(true)
    setResult(null)
    try {
      const res = await authFetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_evidence_doc',
          context: { framework_id, control_ref, controlTitle, controlDesc, organization, docType }
        })
      })
      const d = await res.json()
      if (d.error === 'NO_API_KEY') { notify('Add GROQ_API_KEY to .env.local and restart', 'error'); return }
      if (d.error) { notify(d.error, 'error'); return }
      setResult(d.content)
    } catch { notify('Generation failed', 'error') }
    setLoading(false)
  }

  const copy = () => {
    navigator.clipboard.writeText(result || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    notify('Copied to clipboard')
  }

  const download = () => {
    const blob = new Blob([result || ''], { type: 'text/markdown' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `${framework_id}-${control_ref}-${docType}.md`.replace(/[^a-zA-Z0-9._-]/g, '-')
    a.click()
    URL.revokeObjectURL(url)
  }

  // Simple markdown renderer
  const renderMd = (md) => {
    if (!md) return null
    return md.split('\n').map((line, i) => {
      if (line.startsWith('# '))  return <div key={i} style={{fontSize:16,fontWeight:900,color:color,marginBottom:6,marginTop:i>0?14:0,lineHeight:1.3}}>{line.slice(2)}</div>
      if (line.startsWith('## ')) return <div key={i} style={{fontSize:13,fontWeight:800,color:T.white,marginBottom:4,marginTop:10,borderBottom:`1px solid ${T.border}`,paddingBottom:3}}>{line.slice(3)}</div>
      if (line.startsWith('### ')) return <div key={i} style={{fontSize:12,fontWeight:700,color:T.blueL,marginBottom:3,marginTop:7}}>{line.slice(4)}</div>
      if (line.startsWith('**') && line.endsWith('**')) return <div key={i} style={{fontSize:11,fontWeight:700,color:T.white,marginBottom:2}}>{line.slice(2,-2)}</div>
      if (line.startsWith('| ')) return <div key={i} style={{fontSize:10,color:T.whiteM,fontFamily:'monospace',marginBottom:1,padding:'1px 0'}}>{line}</div>
      if (line.startsWith('- ') || line.startsWith('* ')) return <div key={i} style={{fontSize:11,color:T.whiteM,marginBottom:2,paddingLeft:12,display:'flex',gap:6}}><span style={{color:color,flexShrink:0}}>•</span><span>{line.slice(2)}</span></div>
      if (/^\d+\. /.test(line)) return <div key={i} style={{fontSize:11,color:T.whiteM,marginBottom:2,paddingLeft:12}}>{line}</div>
      if (line.startsWith('---')) return <hr key={i} style={{border:'none',borderTop:`1px solid ${T.border}`,margin:'8px 0'}}/>
      if (line.trim() === '') return <div key={i} style={{height:4}}/>
      // Inline bold
      const parts = line.split(/\*\*([^*]+)\*\*/)
      return <div key={i} style={{fontSize:11,color:T.whiteM,marginBottom:2,lineHeight:1.7}}>
        {parts.map((p,j) => j%2===1 ? <strong key={j} style={{color:T.white,fontWeight:700}}>{p}</strong> : p)}
      </div>
    })
  }

  return (
    <div style={{...CS, flexShrink:0, border:'1px solid #2d3136'}}>
      {/* Header toggle */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',cursor:'pointer'}} onClick={()=>setOpen(o=>!o)}>
        <div style={{display:'flex',gap:9,alignItems:'center'}}>
          <div style={{width:28,height:28,background:'#2d3136',border:'1px solid #3d4247',borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12}}>✦</div>
          <div>
            <div style={{fontSize:12,fontWeight:700,color:color}}>AI Evidence Generator</div>
            <div style={{fontSize:10,color:T.whiteDim}}>Generate policy, procedure, checklist, or implementation guide for {control_ref}</div>
          </div>
        </div>
        <div style={{color:T.whiteDim,fontSize:14,transform:open?'rotate(180deg)':'rotate(0)',transition:'transform 0.2s'}}>v</div>
      </div>

      {open && (
        <div style={{marginTop:12,borderTop:`1px solid ${T.border}`,paddingTop:12}}>
          {/* Doc type selector */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6,marginBottom:11}}>
            {DOC_TYPES.map(dt=>(
              <button key={dt.id} onClick={()=>setDocType(dt.id)}
                style={{padding:'8px 6px',borderRadius:7,border:`1px solid ${docType===dt.id?color+'66':T.border}`,background:docType===dt.id?color+'12':'transparent',cursor:'pointer',fontFamily:'inherit',textAlign:'center'}}>
                <div style={{fontSize:14,marginBottom:3}}>{dt.icon}</div>
                <div style={{fontSize:11,fontWeight:docType===dt.id?700:400,color:docType===dt.id?color:T.white}}>{dt.label}</div>
                <div style={{fontSize:9,color:T.whiteDim,marginTop:1,lineHeight:1.3}}>{dt.desc}</div>
              </button>
            ))}
          </div>

          <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:result?12:0}}>
            <button onClick={generate} disabled={loading}
              style={{padding:'8px 20px',background:loading?T.border:'#343a40',border:'none',borderRadius:7,color:loading?T.whiteDim:T.white,cursor:loading?'not-allowed':'pointer',fontSize:12,fontWeight:700,fontFamily:'inherit',boxShadow:loading?'none':'none'}}>
              {loading?'Generating…':'Generate with AI'}
            </button>
            {loading&&<div style={{fontSize:11,color:T.whiteDim}}>Generating {DOC_TYPES.find(d=>d.id===docType)?.label} for {control_ref}…</div>}
          </div>

          {/* Result */}
          {result && (
            <div>
              <ExportActions
                content={result}
                framework_id={framework_id}
                control_ref={control_ref}
                controlTitle={controlTitle}
                docType={docType}
                organization={organization}
                authFetch={authFetch}
                notify={notify}
                onSaved={onFileSaved}
              />
              <div style={{background:T.bg,border:`1px solid ${T.border}`,borderRadius:9,padding:'16px 18px',lineHeight:1.6}}>
                {renderMd(result)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── EVIDENCE REPOSITORY ────────────────────────────────────────────────────────
// ── CONTROLS LIBRARY ─────────────────────────────────────────────────────────
function ControlsLibrary({ notify, navTo }: any) {
  const [selFw, setSelFw]   = useState('NCA_ECC')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<Record<string,boolean>>({})

  const fw = EV_CONTROLS[selFw as keyof typeof EV_CONTROLS] as any
  if (!fw) return null

  const toggle = (ref: string) => setExpanded(x => ({...x, [ref]: !x[ref]}))

  const allControls: any[] = []
  fw.domains?.forEach((d: any) => {
    d.controls?.forEach((c: any) => {
      allControls.push({...c, domainName: d.name})
      c.sub?.forEach((s: any) => allControls.push({...s, domainName: d.name, parent: c.ref}))
    })
  })

  const filtered = search
    ? allControls.filter(c =>
        c.ref?.toLowerCase().includes(search.toLowerCase()) ||
        c.title?.toLowerCase().includes(search.toLowerCase()) ||
        c.desc?.toLowerCase().includes(search.toLowerCase())
      )
    : null

  const B = `1px solid #2d3136`
  const CARD: React.CSSProperties = { background: '#212529', border: B, borderRadius: 9, marginBottom: 8 }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: 'calc(100vh - 160px)' }}>

      {/* Header controls */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' as const }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {Object.keys(EV_CONTROLS).map(id => (
            <button key={id} onClick={() => { setSelFw(id); setSearch(''); setExpanded({}) }}
              style={{ padding: '6px 14px', borderRadius: 6, border: `1px solid ${selFw===id?'#495057':'#2d3136'}`,
                background: selFw===id?'#343a40':'#212529', color: selFw===id?'#f8f9fa':'#6c757d',
                fontSize: 11, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>
              {id.replace(/_/g,' ')}
            </button>
          ))}
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search controls…"
          style={{ flex: 1, minWidth: 200, background: '#1a1d20', border: `1px solid #3d4247`, borderRadius: 6,
            color: '#f8f9fa', padding: '7px 12px', fontSize: 12, fontFamily: 'inherit', outline: 'none' }}/>
        <div style={{ fontSize: 11, color: '#495057' }}>
          {allControls.filter(c => !c.parent).length} controls · {allControls.filter(c => !!c.parent).length} sub-controls
        </div>
      </div>

      {/* Controls list */}
      <div style={{ flex: 1, overflowY: 'auto' as const }}>
        {search && filtered ? (
          <div>
            <div style={{ fontSize: 10, color: '#495057', marginBottom: 8 }}>{filtered.length} results for "{search}"</div>
            {filtered.map(c => (
              <div key={c.ref} style={{ ...CARD, padding: '12px 16px' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, background: '#2d3136', border: `1px solid #3d4247`,
                    color: '#adb5bd', padding: '2px 8px', borderRadius: 4, flexShrink: 0, fontFamily: 'monospace' }}>
                    {c.ref}
                  </span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#f8f9fa' }}>{c.title}</div>
                    <div style={{ fontSize: 11, color: '#6c757d', marginTop: 3 }}>{c.desc}</div>
                    <div style={{ fontSize: 10, color: '#495057', marginTop: 4 }}>Domain: {c.domainName}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          fw.domains?.map((domain: any) => (
            <div key={domain.ref} style={{ marginBottom: 10 }}>
              {/* Domain header */}
              <div style={{ fontSize: 10, fontWeight: 700, color: '#6c757d', textTransform: 'uppercase' as const,
                letterSpacing: '0.08em', padding: '8px 0 6px', borderBottom: `1px solid #2d3136`, marginBottom: 8 }}>
                {domain.ref} - {domain.name}
                <span style={{ marginLeft: 8, color: '#3d4247', fontWeight: 400 }}>
                  {domain.controls?.length} controls
                </span>
              </div>

              {domain.controls?.map((ctrl: any) => (
                <div key={ctrl.ref} style={CARD}>
                  {/* Control row */}
                  <div onClick={() => toggle(ctrl.ref)}
                    style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px', cursor: 'pointer' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, background: '#2d3136', border: `1px solid #3d4247`,
                      color: '#adb5bd', padding: '2px 8px', borderRadius: 4, flexShrink: 0, fontFamily: 'monospace', marginTop: 1 }}>
                      {ctrl.ref}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#f8f9fa' }}>{ctrl.title}</div>
                      <div style={{ fontSize: 11, color: '#6c757d', marginTop: 3, lineHeight: 1.5 }}>{ctrl.desc}</div>
                    </div>
                    <div style={{ fontSize: 11, color: '#495057', flexShrink: 0 }}>
                      {ctrl.sub?.length || 0} sub
                      <span style={{ marginLeft: 6 }}>{expanded[ctrl.ref] ? '▲' : '▼'}</span>
                    </div>
                  </div>

                  {/* Sub-controls */}
                  {expanded[ctrl.ref] && ctrl.sub?.map((sub: any) => (
                    <div key={sub.ref} style={{ borderTop: `1px solid #2d3136`, padding: '10px 16px 10px 44px',
                      background: '#1a1d20', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 9, fontWeight: 700, background: '#212529', border: `1px solid #2d3136`,
                        color: '#6c757d', padding: '2px 7px', borderRadius: 3, flexShrink: 0, fontFamily: 'monospace', marginTop: 1 }}>
                        {sub.ref}
                      </span>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#adb5bd' }}>{sub.title}</div>
                        <div style={{ fontSize: 11, color: '#495057', marginTop: 2, lineHeight: 1.5 }}>{sub.desc}</div>
                      </div>
                      <button onClick={() => navTo && navTo('evidence')}
                        style={{ marginLeft: 'auto', padding: '4px 10px', background: '#212529',
                          border: `1px solid #2d3136`, color: '#6c757d', borderRadius: 5,
                          fontSize: 10, fontFamily: 'inherit', cursor: 'pointer', flexShrink: 0,
                          whiteSpace: 'nowrap' as const }}>
                        Add Evidence
                      </button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  )
}


const EV_CONTROLS = {
  NCA_ECC: {
    label:'NCA ECC v2.0', color:'#adb5bd',
    scale:['N/A','Partially Implemented','Fully Implemented'],
    scaleColors:{'N/A':'#495057','Partially Implemented':'#ced4da','Fully Implemented':'#adb5bd'},
    domains:[
      {ref:'1',name:'Cybersecurity Governance',controls:[
        {ref:'1-1',title:'Cybersecurity Strategy',desc:'Board-approved cybersecurity strategy aligned with organizational objectives.',sub:[
          {ref:'1-1-1',title:'Strategy Development',desc:'Cybersecurity strategy covering vision, objectives, and 3-year roadmap.'},
          {ref:'1-1-2',title:'Board Approval',desc:'Formal senior management or board approval of the strategy.'},
          {ref:'1-1-3',title:'Annual Strategy Review',desc:'Strategy reviewed and updated at least annually or upon significant change.'},
        ]},
        {ref:'1-2',title:'Cybersecurity Policies',desc:'Comprehensive policy framework covering all critical cybersecurity domains.',sub:[
          {ref:'1-2-1',title:'Policy Framework',desc:'Policy hierarchy with coverage of all critical domains.'},
          {ref:'1-2-2',title:'Policy Approval',desc:'Policies formally approved by management.'},
          {ref:'1-2-3',title:'Policy Communication',desc:'Policies communicated to all relevant staff.'},
          {ref:'1-2-4',title:'Policy Review',desc:'Annual policy review with version control records.'},
        ]},
        {ref:'1-3',title:'Roles and Responsibilities',desc:'Defined cybersecurity roles including CISO and governance committee.',sub:[
          {ref:'1-3-1',title:'CISO Designation',desc:'CISO designated with appropriate authority and reporting line.'},
          {ref:'1-3-2',title:'Cybersecurity Committee',desc:'Governance committee with board-level representation, meets quarterly.'},
          {ref:'1-3-3',title:'Role Accountability Matrix',desc:'Documented RACI matrix for all cybersecurity responsibilities.'},
        ]},
        {ref:'1-4',title:'Awareness and Training',desc:'Mandatory cybersecurity awareness and training programs.',sub:[
          {ref:'1-4-1',title:'Annual Awareness Program',desc:'Annual security awareness program for all employees.'},
          {ref:'1-4-2',title:'Specialized Training',desc:'Role-based technical training for IT and security staff.'},
          {ref:'1-4-3',title:'Training Completion Records',desc:'Records tracking completion rates per department.'},
          {ref:'1-4-4',title:'Phishing Simulations',desc:'Regular phishing simulation exercises with results tracking.'},
        ]},
        {ref:'1-5',title:'Compliance Management',desc:'Ensure compliance with NCA, SAMA, and applicable regulations.',sub:[
          {ref:'1-5-1',title:'Regulatory Monitoring',desc:'Formal process to track regulatory changes.'},
          {ref:'1-5-2',title:'Compliance Assessment',desc:'Annual gap assessment against applicable frameworks.'},
        ]},
      ]},
      {ref:'2',name:'Cybersecurity Risk Management',controls:[
        {ref:'2-1',title:'Asset Management',desc:'Comprehensive inventory of all information assets with criticality classification.',sub:[
          {ref:'2-1-1',title:'Asset Inventory',desc:'Up-to-date inventory of hardware, software, and data assets.'},
          {ref:'2-1-2',title:'Asset Classification',desc:'Assets classified by criticality and sensitivity.'},
          {ref:'2-1-3',title:'Cloud Asset Tracking',desc:'Cloud and SaaS assets included in inventory.'},
        ]},
        {ref:'2-2',title:'Identity and Access Management',desc:'Least privilege, MFA for privileged accounts, regular access reviews.',sub:[
          {ref:'2-2-1',title:'Access Control Policy',desc:'Documented policy with least privilege principle.'},
          {ref:'2-2-2',title:'MFA for Privileged Access',desc:'MFA enforced for privileged and remote access.'},
          {ref:'2-2-3',title:'Access Reviews',desc:'Quarterly access certification reviews.'},
          {ref:'2-2-4',title:'PAM Solution',desc:'Privileged Access Management platform deployed.'},
          {ref:'2-2-5',title:'Onboarding/Offboarding',desc:'Formal process for access provisioning and revocation.'},
        ]},
        {ref:'2-3',title:'System and Software Security',desc:'Patch management, hardening baselines, and software inventory.',sub:[
          {ref:'2-3-1',title:'Patch Management',desc:'Patches applied within SLA: Critical 72hrs, High 30 days.'},
          {ref:'2-3-2',title:'Hardening Baselines',desc:'Documented and enforced configuration baselines.'},
          {ref:'2-3-3',title:'Authorized Software List',desc:'Approved software inventory with unapproved software blocking.'},
        ]},
        {ref:'2-4',title:'Email and Web Protection',desc:'Anti-phishing, URL filtering, email gateway security controls.',sub:[
          {ref:'2-4-1',title:'Email Gateway',desc:'Gateway with spam, malware, and phishing protection.'},
          {ref:'2-4-2',title:'URL Filtering',desc:'Web proxy blocking malicious and policy-violating content.'},
          {ref:'2-4-3',title:'Sandboxing',desc:'Sandbox analysis for email attachments and web downloads.'},
        ]},
        {ref:'2-5',title:'Data Protection',desc:'Encryption at rest and in transit; DLP controls per NCA DCC.',sub:[
          {ref:'2-5-1',title:'Encryption at Rest',desc:'AES-256 minimum for sensitive data at rest.'},
          {ref:'2-5-2',title:'Encryption in Transit',desc:'TLS 1.2+ for all data in transit.'},
          {ref:'2-5-3',title:'DLP Implementation',desc:'DLP covering email, web, endpoint, and cloud channels.'},
        ]},
        {ref:'2-6',title:'Cryptography',desc:'NCA-approved algorithms with HSM-based key management.',sub:[
          {ref:'2-6-1',title:'Cryptographic Standards',desc:'Only NCA-approved cryptographic algorithms used.'},
          {ref:'2-6-2',title:'Key Management',desc:'HSM-based key management with documented lifecycle.'},
        ]},
        {ref:'2-7',title:'Vulnerability Management',desc:'Monthly scanning, annual penetration testing, remediation SLA tracking.',sub:[
          {ref:'2-7-1',title:'Vulnerability Scanning',desc:'Monthly automated scanning of all critical systems.'},
          {ref:'2-7-2',title:'Penetration Testing',desc:'Annual pentest by qualified third party.'},
          {ref:'2-7-3',title:'Remediation Tracking',desc:'Remediation tracked against defined SLAs with management reporting.'},
        ]},
      ]},
      {ref:'3',name:'Cybersecurity Operations',controls:[
        {ref:'3-1',title:'Logging and Monitoring',desc:'Centralized SIEM with 24/7 monitoring and 12-month log retention.',sub:[
          {ref:'3-1-1',title:'Log Collection',desc:'Centralized collection from all critical systems.'},
          {ref:'3-1-2',title:'SIEM with Use Cases',desc:'SIEM deployed with documented and tuned detection use cases.'},
          {ref:'3-1-3',title:'12-Month Log Retention',desc:'Logs retained for minimum 12 months.'},
          {ref:'3-1-4',title:'24/7 Monitoring',desc:'Continuous monitoring with on-call escalation procedures.'},
        ]},
        {ref:'3-2',title:'Incident Management',desc:'CSIRT, documented IRP, NCA reporting within 24 hours.',sub:[
          {ref:'3-2-1',title:'Incident Response Plan',desc:'IRP covering detection, containment, eradication, recovery.'},
          {ref:'3-2-2',title:'CSIRT Team',desc:'Named CSIRT with defined roles and escalation paths.'},
          {ref:'3-2-3',title:'NCA Reporting Process',desc:'Process to notify NCA within 24 hours of significant incidents.'},
          {ref:'3-2-4',title:'Post-Incident Review',desc:'PIR conducted after significant incidents; lessons learned documented.'},
        ]},
        {ref:'3-3',title:'Physical Security',desc:'Data center access controls, CCTV, visitor management.',sub:[
          {ref:'3-3-1',title:'DC Physical Access',desc:'Multi-factor physical controls on data center entry.'},
          {ref:'3-3-2',title:'CCTV Coverage',desc:'CCTV with defined retention period.'},
          {ref:'3-3-3',title:'Visitor Management',desc:'Visitor log, escorting, and badge procedures.'},
        ]},
      ]},
      {ref:'4',name:'Third-Party and Cloud Security',controls:[
        {ref:'4-1',title:'Third-Party Cybersecurity',desc:'Pre-engagement assessments, contractual controls, ongoing monitoring.',sub:[
          {ref:'4-1-1',title:'Third-Party Assessment',desc:'Security assessment before onboarding high-risk vendors.'},
          {ref:'4-1-2',title:'Contractual Requirements',desc:'Security clauses and right-to-audit in all critical contracts.'},
          {ref:'4-1-3',title:'Ongoing Monitoring',desc:'Annual reassessment of high-risk third parties.'},
        ]},
        {ref:'4-2',title:'Cloud Security',desc:'Cloud security assessments, Saudi data residency where required.',sub:[
          {ref:'4-2-1',title:'Cloud Provider Assessment',desc:'Security review of cloud providers before deployment.'},
          {ref:'4-2-2',title:'Data Residency',desc:'Sensitive data stored in Saudi Arabia as required.'},
          {ref:'4-2-3',title:'Shared Responsibility',desc:'Documented shared responsibility model per cloud service.'},
        ]},
      ]},
      {ref:'5',name:'Cybersecurity Resilience',controls:[
        {ref:'5-1',title:'Business Continuity',desc:'BCP/DRP with cybersecurity scenarios tested annually.',sub:[
          {ref:'5-1-1',title:'BCP Documentation',desc:'BCP covering cybersecurity incident scenarios with RTO/RPO.'},
          {ref:'5-1-2',title:'Annual BCP Test',desc:'Annual DR test with documented results and action plan.'},
          {ref:'5-1-3',title:'Backup and Recovery',desc:'Backup procedures with tested recovery and offsite copies.'},
        ]},
        {ref:'5-2',title:'Change Management',desc:'CAB process with mandatory security review gates.',sub:[
          {ref:'5-2-1',title:'Change Process',desc:'Formal CAB approval workflow for all changes.'},
          {ref:'5-2-2',title:'Security Review Gate',desc:'Mandatory security assessment for significant changes.'},
        ]},
      ]},
    ]
  },
  NCA_DCC: {
    label:'NCA DCC v1.0', color:'#adb5bd',
    scale:['N/A','Partially Implemented','Fully Implemented'],
    scaleColors:{'N/A':'#495057','Partially Implemented':'#ced4da','Fully Implemented':'#adb5bd'},
    domains:[
      {ref:'DC-1',name:'Data Governance',controls:[
        {ref:'DC-1-1',title:'Data Governance Policy',desc:'Framework defining data ownership, stewardship, and accountability.',sub:[
          {ref:'DC-1-1-1',title:'Policy Documentation',desc:'Written data governance policy approved by management.'},
          {ref:'DC-1-1-2',title:'Governance Committee',desc:'Data governance committee with clear terms of reference.'},
        ]},
        {ref:'DC-1-2',title:'Data Owner Assignment',desc:'Data owners assigned for all critical data assets.',sub:[
          {ref:'DC-1-2-1',title:'Owner Register',desc:'Register mapping data assets to assigned owners.'},
          {ref:'DC-1-2-2',title:'Owner Responsibilities',desc:'Documented responsibilities for each data owner.'},
        ]},
      ]},
      {ref:'DC-2',name:'Data Classification',controls:[
        {ref:'DC-2-1',title:'Classification Policy',desc:'Minimum 4 levels: Public, Internal, Confidential, Restricted.',sub:[
          {ref:'DC-2-1-1',title:'Classification Levels',desc:'Clear criteria defined for each classification level.'},
          {ref:'DC-2-1-2',title:'Handling Requirements',desc:'Storage, transmission, and sharing rules per level.'},
        ]},
        {ref:'DC-2-2',title:'Data Labeling',desc:'Labels applied consistently to documents, emails, and databases.',sub:[
          {ref:'DC-2-2-1',title:'Document Labeling',desc:'All documents carry visible classification marking.'},
          {ref:'DC-2-2-2',title:'Email Classification',desc:'Email classification labels applied.'},
          {ref:'DC-2-2-3',title:'Database Tagging',desc:'Database fields and tables classified and tagged.'},
        ]},
      ]},
      {ref:'DC-3',name:'Data Protection',controls:[
        {ref:'DC-3-1',title:'Data Encryption',desc:'AES-256 at rest; TLS 1.2+ in transit; HSM key management.',sub:[
          {ref:'DC-3-1-1',title:'Encryption at Rest',desc:'AES-256 for Confidential and Restricted data at rest.'},
          {ref:'DC-3-1-2',title:'Encryption in Transit',desc:'TLS 1.2 minimum for all data in transit.'},
          {ref:'DC-3-1-3',title:'Key Management',desc:'HSM-based key management with rotation schedule.'},
        ]},
        {ref:'DC-3-2',title:'Data Loss Prevention',desc:'DLP across email, endpoint, web, and cloud channels.',sub:[
          {ref:'DC-3-2-1',title:'Email DLP',desc:'DLP policies on outbound email blocking/alerting on sensitive data.'},
          {ref:'DC-3-2-2',title:'Endpoint DLP',desc:'DLP agent on all endpoints.'},
          {ref:'DC-3-2-3',title:'Cloud DLP',desc:'DLP policies applied to cloud storage and sharing.'},
        ]},
        {ref:'DC-3-3',title:'Data Access Control',desc:'Role-based access aligned with data classification.',sub:[
          {ref:'DC-3-3-1',title:'Classification-Based Access',desc:'Access rights determined by data classification level.'},
          {ref:'DC-3-3-2',title:'Periodic Access Reviews',desc:'Quarterly access reviews for sensitive data repositories.'},
        ]},
      ]},
      {ref:'DC-4',name:'Data Retention and Disposal',controls:[
        {ref:'DC-4-1',title:'Retention Policy',desc:'Retention periods defined per data category aligned with Saudi law.',sub:[
          {ref:'DC-4-1-1',title:'Retention Schedule',desc:'Documented schedule for each data category with legal basis.'},
          {ref:'DC-4-1-2',title:'Legal Hold Process',desc:'Process to preserve data subject to litigation or investigation.'},
          {ref:'DC-4-1-3',title:'Automated Enforcement',desc:'Retention rules enforced via system controls where possible.'},
        ]},
        {ref:'DC-4-2',title:'Secure Disposal',desc:'Cryptographic erasure or certified destruction with records.',sub:[
          {ref:'DC-4-2-1',title:'Digital Media Erasure',desc:'Cryptographic erasure or DoD-standard wiping for digital media.'},
          {ref:'DC-4-2-2',title:'Physical Destruction',desc:'Certified vendor with destruction certificates for physical media.'},
          {ref:'DC-4-2-3',title:'Disposal Records',desc:'Maintained records of all disposal actions.'},
        ]},
      ]},
      {ref:'DC-5',name:'Data Transfer',controls:[
        {ref:'DC-5-1',title:'Data Transfer Controls',desc:'Approved encrypted channels; transfer logging; cross-border restrictions.',sub:[
          {ref:'DC-5-1-1',title:'Approved Channels',desc:'Only approved encrypted channels for sensitive data transfer.'},
          {ref:'DC-5-1-2',title:'Transfer Logging',desc:'All transfers of Confidential and Restricted data logged.'},
          {ref:'DC-5-1-3',title:'Cross-Border Controls',desc:'Controls on cross-border transfers per Saudi data laws.'},
        ]},
      ]},
    ]
  },
  SAMA_CSF: {
    label:'SAMA CSF v1.0', color:'#ced4da',
    scale:['Level 1','Level 2','Level 3','Level 4','Level 5'],
    scaleColors:{'Level 1':'#dc3545','Level 2':'#adb5bd','Level 3':'#ced4da','Level 4':'#adb5bd','Level 5':'#adb5bd'},
    domains:[
      {ref:'CS-1',name:'Leadership and Governance',controls:[
        {ref:'CS-1.1',title:'Cybersecurity Strategy',desc:'Board-approved strategy with measurable KPIs, reviewed annually.',sub:[
          {ref:'CS-1.1.1',title:'Strategy Document',desc:'Written strategy with vision, objectives, and roadmap.'},
          {ref:'CS-1.1.2',title:'Board Approval',desc:'Formal board-level approval documented.'},
          {ref:'CS-1.1.3',title:'KPI Framework',desc:'Measurable KPIs tracking strategy execution.'},
          {ref:'CS-1.1.4',title:'Annual Review',desc:'Evidence of annual strategy review and update.'},
        ]},
        {ref:'CS-1.2',title:'Governance Structure',desc:'CISO with board reporting line; committee meeting quarterly.',sub:[
          {ref:'CS-1.2.1',title:'CISO Designation',desc:'CISO role with direct CEO/Board reporting line.'},
          {ref:'CS-1.2.2',title:'Committee Charter',desc:'Cybersecurity committee charter and meeting minutes.'},
          {ref:'CS-1.2.3',title:'Accountability Matrix',desc:'RACI matrix for cybersecurity decisions.'},
        ]},
        {ref:'CS-1.3',title:'Budget Allocation',desc:'Adequate cybersecurity budget with quarterly spend tracking.',sub:[
          {ref:'CS-1.3.1',title:'Budget Approval',desc:'Board-approved annual cybersecurity budget.'},
          {ref:'CS-1.3.2',title:'Spend Reporting',desc:'Quarterly budget vs. actuals reporting.'},
        ]},
      ]},
      {ref:'CS-2',name:'Risk Management and Compliance',controls:[
        {ref:'CS-2.1',title:'Cyber Risk Assessment',desc:'Annual risk assessments using documented methodology.',sub:[
          {ref:'CS-2.1.1',title:'Risk Methodology',desc:'Documented risk assessment methodology and schedule.'},
          {ref:'CS-2.1.2',title:'Risk Assessment Report',desc:'Annual assessment with executive summary.'},
          {ref:'CS-2.1.3',title:'Threat Intelligence Integration',desc:'Threat intelligence incorporated into assessments.'},
        ]},
        {ref:'CS-2.2',title:'Risk Treatment',desc:'Risk register with owners, treatment plans, deadlines, quarterly review.',sub:[
          {ref:'CS-2.2.1',title:'Risk Register',desc:'Maintained register with scores, owners, and treatments.'},
          {ref:'CS-2.2.2',title:'Treatment Plans',desc:'Documented plans with milestones and owners.'},
          {ref:'CS-2.2.3',title:'Management Reporting',desc:'Quarterly risk status to senior management.'},
        ]},
        {ref:'CS-2.3',title:'Regulatory Compliance',desc:'Compliance calendar; annual SAMA CSF gap assessment.',sub:[
          {ref:'CS-2.3.1',title:'Compliance Calendar',desc:'Calendar tracking all SAMA submission deadlines.'},
          {ref:'CS-2.3.2',title:'CSF Gap Assessment',desc:'Annual gap assessment against SAMA CSF.'},
        ]},
      ]},
      {ref:'CS-3',name:'Operations and Technology',controls:[
        {ref:'CS-3.1',title:'Asset Management',desc:'CMDB with hardware, software, and cloud assets; criticality classified.',sub:[
          {ref:'CS-3.1.1',title:'CMDB',desc:'Automated CMDB covering all asset types.'},
          {ref:'CS-3.1.2',title:'Criticality Classification',desc:'Assets classified by business criticality.'},
        ]},
        {ref:'CS-3.2',title:'Identity and Access Management',desc:'PAM, mandatory MFA, zero-trust principles, quarterly certification.',sub:[
          {ref:'CS-3.2.1',title:'PAM Platform',desc:'PAM solution managing all privileged accounts.'},
          {ref:'CS-3.2.2',title:'MFA Enforcement',desc:'MFA mandatory for privileged and remote access.'},
          {ref:'CS-3.2.3',title:'Access Certification',desc:'Quarterly access certification for critical systems.'},
          {ref:'CS-3.2.4',title:'Zero Trust Architecture',desc:'Zero trust principles implemented and documented.'},
        ]},
        {ref:'CS-3.3',title:'Vulnerability Management',desc:'100% scanning coverage; SLAs: Critical 72hrs, High 30d, Medium 90d.',sub:[
          {ref:'CS-3.3.1',title:'Scan Coverage',desc:'Monthly scanning of all internet-facing and critical systems.'},
          {ref:'CS-3.3.2',title:'Patch SLAs',desc:'Documented SLAs with compliance tracking.'},
          {ref:'CS-3.3.3',title:'MTTR Metrics',desc:'Mean time to remediate tracked and reported.'},
        ]},
        {ref:'CS-3.4',title:'Security Monitoring',desc:'24/7 SOC with SIEM; threat intelligence; MTTD/MTTR metrics.',sub:[
          {ref:'CS-3.4.1',title:'SOC Operations',desc:'24/7 SOC capability (internal or managed) documented.'},
          {ref:'CS-3.4.2',title:'SIEM Use Cases',desc:'Documented use cases tuned for SAMA threat landscape.'},
          {ref:'CS-3.4.3',title:'MTTD/MTTR Tracking',desc:'Detection and response time metrics tracked quarterly.'},
        ]},
        {ref:'CS-3.5',title:'Change Management',desc:'CAB process; security gate; emergency change procedure.',sub:[
          {ref:'CS-3.5.1',title:'CAB Workflow',desc:'Formal change advisory board with documented approval flow.'},
          {ref:'CS-3.5.2',title:'Security Review Gate',desc:'Mandatory security assessment for significant changes.'},
          {ref:'CS-3.5.3',title:'Emergency Change Process',desc:'Emergency change procedure requiring CISO approval.'},
        ]},
      ]},
      {ref:'CS-4',name:'Third-Party Management',controls:[
        {ref:'CS-4.1',title:'Third-Party Risk',desc:'Vendor tiering; pre-engagement assessments; right-to-audit; annual review.',sub:[
          {ref:'CS-4.1.1',title:'Vendor Tiering',desc:'Vendors tiered by risk with frequency of assessment per tier.'},
          {ref:'CS-4.1.2',title:'Pre-Engagement Assessment',desc:'Security assessment before onboarding critical vendors.'},
          {ref:'CS-4.1.3',title:'Contractual Controls',desc:'Right-to-audit and security obligations in contracts.'},
          {ref:'CS-4.1.4',title:'Annual Reassessment',desc:'Annual reassessment of Tier 1 and 2 vendors.'},
        ]},
      ]},
      {ref:'CS-5',name:'Resilience',controls:[
        {ref:'CS-5.1',title:'Incident Response',desc:'IRP, CSIRT, SAMA reporting, annual IR exercise, post-incident review.',sub:[
          {ref:'CS-5.1.1',title:'IRP Document',desc:'Written IRP with SAMA notification procedures.'},
          {ref:'CS-5.1.2',title:'CSIRT',desc:'Named CSIRT with 24/7 on-call capability.'},
          {ref:'CS-5.1.3',title:'SAMA Reporting',desc:'Process to report to SAMA within required timeframes.'},
          {ref:'CS-5.1.4',title:'IR Exercise',desc:'Annual incident response exercise with results.'},
          {ref:'CS-5.1.5',title:'Post-Incident Review',desc:'PIR within 2 weeks; lessons learned tracked.'},
        ]},
        {ref:'CS-5.2',title:'Business Continuity',desc:'BIA-driven BCP/DRP with RTO/RPO; annual testing.',sub:[
          {ref:'CS-5.2.1',title:'Business Impact Analysis',desc:'BIA identifying critical processes and dependencies.'},
          {ref:'CS-5.2.2',title:'BCP/DRP',desc:'Written BCP and DRP with RTO/RPO targets.'},
          {ref:'CS-5.2.3',title:'Annual BCP Test',desc:'Annual test with documented results and action plan.'},
        ]},
      ]},
    ]
  }
}

function EvidenceRepository({ profile, notify, authFetch }) {
  const supabase = createClient()
  const [selFw, setSelFw]         = useState('NCA_ECC')
  const [selDomain, setSelDomain] = useState(null)
  const [selControl, setSelCtrl]  = useState(null)
  const [selSub, setSelSub]       = useState(null)
  const [allFiles, setAllFiles]   = useState([])
  const [loading, setLoading]     = useState(false)
  const [uploading, setUploading] = useState(false)
  const [ratingId, setRatingId]   = useState(null)
  const [dragOver, setDragOver]   = useState(false)
  const [desc, setDesc]           = useState('')

  const fw       = EV_CONTROLS[selFw]
  const domain   = fw?.domains.find(d => d.ref === selDomain)
  const ctrl     = domain?.controls.find(c => c.ref === selControl)
  const sub      = ctrl?.sub?.find(s => s.ref === selSub)
  const activeRef  = selSub || selControl || selDomain || null
  const activeItem = sub || ctrl || domain || null

  // Flat list of all controls+subs for the selected framework (used for file counts)
  const allRefs = fw?.domains.flatMap(d =>
    d.controls.flatMap(c => [c.ref, ...(c.sub||[]).map(s => s.ref)])
  ) || []

  const fwFileCount = (fwId) => allFiles.filter(f => f.framework_id === fwId).length

  const loadFiles = async () => {
    if (!profile?.organization_id) { setLoading(false); return }
    if (isGuest()) { setAllFiles(demoList('evidence_files')); setLoading(false); return }
    setLoading(true)
    const { data } = await supabase
      .from('evidence_files')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .order('created_at', { ascending: false })
    setAllFiles(data || [])
    setLoading(false)
  }
  useEffect(() => { loadFiles() }, [profile?.organization_id])

  const visibleFiles = allFiles.filter(f => {
    if (f.framework_id !== selFw) return false
    if (!activeRef) return true
    return f.control_ref === activeRef || f.domain_ref === activeRef
  })

  const countFor = (ref) => allFiles.filter(f => f.framework_id === selFw && (f.control_ref === ref || f.domain_ref === ref)).length

  const upload = async (file) => {
    if (!file || !profile?.organization_id) return
    if (isGuest()) {
      const rec = demoInsert('evidence_files', {
        organization_id: 'demo-org', framework_id: selFw, domain_ref: selDomain || null,
        control_ref: activeRef || null, description: desc.trim() || file.name,
        file_name: file.name, file_url: null, file_size: file.size, file_type: file.type, uploaded_by: 'demo-guest',
      } as any)
      setAllFiles(prev => [rec, ...prev]); setDesc(''); notify('Added (demo): ' + file.name)
      if (selControl) rateFile(rec)
      return
    }
    setUploading(true)
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const path = `${profile.organization_id}/${selFw}/${Date.now()}-${safeName}`
      let file_url = null
      const { error: upErr } = await supabase.storage.from('evidence').upload(path, file, { upsert: false })
      if (!upErr) {
        const { data: urlData } = supabase.storage.from('evidence').getPublicUrl(path)
        file_url = urlData?.publicUrl || null
      }
      const payload = {
        organization_id: profile.organization_id,
        framework_id: selFw,
        domain_ref: selDomain || null,
        control_ref: activeRef || null,
        description: desc.trim() || file.name,
        file_name: file.name,
        file_url,
        file_size: file.size,
        file_type: file.type,
        uploaded_by: profile.id,
      }
      const { data: rec, error: dbErr } = await supabase
        .from('evidence_files')
        .insert(payload)
        .select()
        .single()
      if (dbErr) throw new Error(dbErr.message)
      setAllFiles(prev => [rec, ...prev])
      setDesc('')
      notify('Uploaded: ' + file.name)
      // Auto-trigger AI rating if a specific control is selected
      if (selControl && rec) rateFile(rec)
    } catch (e) {
      notify('Upload failed: ' + (e.message || 'unknown error'), 'error')
    }
    setUploading(false)
  }

  const rateFile = async (file) => {
    setRatingId(file.id)
    try {
      const item = selSub
        ? ctrl?.sub?.find(s => s.ref === selSub)
        : selControl ? ctrl : null
      const res = await authFetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'rate_evidence_file',
          context: {
            fileDescription: file.description,
            fileName: file.file_name,
            framework_id: selFw,
            control_ref: file.control_ref || activeRef,
            controlTitle: item?.title || activeItem?.title || 'N/A',
            controlDesc: item?.desc || activeItem?.desc || '',
          }
        })
      })
      const d = await res.json()
      if (d.error === 'NO_API_KEY') { notify('Add GROQ_API_KEY to .env.local and restart', 'error'); setRatingId(null); return }
      if (d.error) { notify(d.error, 'error'); setRatingId(null); return }
      const ratingPatch = {
        ai_rating: d.rating, ai_confidence: d.confidence, ai_reasoning: d.reasoning,
        ai_gaps: d.gaps || [], ai_recommendations: d.recommendations || [],
      }
      if (isGuest()) demoUpdate('evidence_files', file.id, ratingPatch as any)
      else await supabase.from('evidence_files').update(ratingPatch).eq('id', file.id)
      setAllFiles(fs => fs.map(f => f.id === file.id ? { ...f, ai_rating: d.rating, ai_confidence: d.confidence, ai_reasoning: d.reasoning, ai_gaps: d.gaps || [], ai_recommendations: d.recommendations || [] } : f))
      notify('AI rated: ' + d.rating)
    } catch (e) {
      notify('Rating failed', 'error')
    }
    setRatingId(null)
  }

  const rColor    = (r) => fw?.scaleColors?.[r] || T.whiteDim
  const fileIcon  = (t) => !t ? 'FILE' : t.includes('pdf') ? 'PDF' : t.includes('word') || t.includes('doc') ? 'DOC' : t.includes('sheet') || t.includes('xls') ? 'XLS' : t.includes('image') ? 'IMG' : 'FILE'
  const fileClr   = (t) => !t ? T.whiteM : t.includes('pdf') ? '#dc3545' : t.includes('word') || t.includes('doc') ? T.blue : t.includes('sheet') || t.includes('xls') ? '#adb5bd' : t.includes('image') ? '#6c757d' : T.whiteM
  const totalFw   = allFiles.filter(f => f.framework_id === selFw).length
  const ratedFw   = allFiles.filter(f => f.framework_id === selFw && f.ai_rating).length

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '230px 1fr', gap: 10, height: 'calc(100vh - 140px)', minHeight: 500 }}>

      {/* ── LEFT: Navigation tree ─────────────────────────────── */}
      <div style={{ ...CS, padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Framework tabs */}
        <div style={{ padding: '10px 8px 6px', borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
          <div style={{ fontSize: 9, color: T.whiteM, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, fontWeight: 700 }}>Framework</div>
          {Object.entries(EV_CONTROLS).map(([id, fwDef]) => (
            <button key={id}
              onClick={() => { setSelFw(id); setSelDomain(null); setSelCtrl(null); setSelSub(null) }}
              style={{ width: '100%', textAlign: 'left', padding: '6px 9px', borderRadius: 6, marginBottom: 3, border: `1px solid ${selFw === id ? fwDef.color + '66' : T.border}`, background: selFw === id ? fwDef.color + '12' : 'transparent', color: selFw === id ? fwDef.color : T.whiteM, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: selFw === id ? 700 : 400 }}>{fwDef.label}</span>
              <span style={{ fontSize: 9, color: selFw === id ? fwDef.color + 'aa' : T.whiteDim, background: T.bg2, padding: '1px 5px', borderRadius: 3 }}>{fwFileCount(id)}</span>
            </button>
          ))}
        </div>

        {/* Tree scroll area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '6px 6px 10px' }}>
          {/* All */}
          <div onClick={() => { setSelDomain(null); setSelCtrl(null); setSelSub(null) }}
            style={{ padding: '5px 8px', borderRadius: 5, cursor: 'pointer', marginBottom: 5, background: !selDomain ? fw?.color + '15' : 'transparent', border: `1px solid ${!selDomain ? fw?.color + '55' : 'transparent'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, fontWeight: !selDomain ? 700 : 400, color: !selDomain ? fw?.color : T.whiteM }}>All Evidence</span>
            <span style={{ fontSize: 9, color: T.whiteDim }}>{totalFw} · {ratedFw} rated</span>
          </div>

          {/* Domains */}
          {fw?.domains.map(d => {
            const dActive = selDomain === d.ref
            const dFileCount = allFiles.filter(f => f.framework_id === selFw && (f.domain_ref === d.ref || d.controls.some(c => f.control_ref === c.ref || (c.sub || []).some(s => f.control_ref === s.ref)))).length
            return (
              <div key={d.ref}>
                <div onClick={() => { setSelDomain(dActive && !selControl ? null : d.ref); setSelCtrl(null); setSelSub(null) }}
                  style={{ padding: '6px 8px', borderRadius: 5, cursor: 'pointer', marginBottom: 2, background: dActive && !selControl ? fw?.color + '12' : 'transparent', border: `1px solid ${dActive && !selControl ? fw?.color + '44' : 'transparent'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 9, fontWeight: 800, color: dActive ? fw?.color : T.blueL, fontFamily: 'monospace' }}>{d.ref}</span>
                    <span style={{ fontSize: 9, color: T.whiteDim }}>{dFileCount > 0 ? dFileCount : ''}</span>
                  </div>
                  <div style={{ fontSize: 10, color: dActive ? fw?.color : T.white, lineHeight: 1.3, marginTop: 1 }}>{d.name}</div>
                </div>

                {/* Controls (show when domain selected) */}
                {dActive && d.controls.map(c => {
                  const cActive = selControl === c.ref
                  const cCount = countFor(c.ref)
                  return (
                    <div key={c.ref} style={{ marginLeft: 10, marginBottom: 1 }}>
                      <div onClick={() => { setSelCtrl(cActive && !selSub ? null : c.ref); setSelSub(null) }}
                        style={{ padding: '5px 8px', borderRadius: 5, cursor: 'pointer', background: cActive && !selSub ? fw?.color + '10' : 'transparent', border: `1px solid ${cActive && !selSub ? fw?.color + '44' : 'transparent'}`, marginBottom: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: 9, fontWeight: 700, color: cActive ? fw?.color : T.accent }}>{c.ref}</span>
                          <span style={{ fontSize: 9, color: T.whiteDim }}>{cCount > 0 ? cCount : ''}</span>
                        </div>
                        <div style={{ fontSize: 10, color: cActive ? fw?.color : T.whiteM, lineHeight: 1.3 }}>{c.title}</div>
                        <div style={{ fontSize: 8, color: T.whiteDim, marginTop: 1 }}>{(c.sub || []).length} sub-controls</div>
                      </div>

                      {/* Sub-controls (show when control selected) */}
                      {cActive && (c.sub || []).map(s => {
                        const sActive = selSub === s.ref
                        const sCount = countFor(s.ref)
                        return (
                          <div key={s.ref} onClick={() => setSelSub(sActive ? null : s.ref)}
                            style={{ marginLeft: 10, padding: '4px 8px', borderRadius: 4, cursor: 'pointer', marginBottom: 1, background: sActive ? fw?.color + '10' : 'transparent', border: `1px solid ${sActive ? fw?.color + '44' : 'transparent'}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ fontFamily: 'monospace', fontSize: 8, fontWeight: 700, color: sActive ? fw?.color : T.whiteDim }}>{s.ref}</span>
                              <span style={{ fontSize: 8, color: T.whiteDim }}>{sCount > 0 ? sCount : ''}</span>
                            </div>
                            <div style={{ fontSize: 10, color: sActive ? fw?.color : T.whiteDim, lineHeight: 1.3 }}>{s.title}</div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── RIGHT: Upload + file cards ────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflow: 'auto' }}>

        {/* Context header */}
        <div style={{ ...CS, padding: '12px 16px', flexShrink: 0 }}>
          {activeRef ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', gap: 7, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 800, color: fw?.color }}>{activeRef}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.white }}>{activeItem?.title}</span>
                  {selSub && <span style={{ fontSize: 9, color: T.whiteDim, background: T.bg2, padding: '1px 7px', borderRadius: 3, border: `1px solid ${T.border}` }}>sub-control</span>}
                </div>
                <div style={{ fontSize: 11, color: T.whiteM, maxWidth: 520, lineHeight: 1.6 }}>{activeItem?.desc}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                {visibleFiles.filter(f => f.ai_rating).length > 0 && (
                  <span style={{ fontSize: 10, color: '#adb5bd' }}>{visibleFiles.filter(f => f.ai_rating).length} rated</span>
                )}
                {visibleFiles.filter(f => !f.ai_rating).length > 0 && (
                  <span style={{ fontSize: 10, color: '#6c757d' }}>{visibleFiles.filter(f => !f.ai_rating).length} unrated</span>
                )}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: fw?.color }}>{fw?.label} - All Evidence</div>
                <div style={{ fontSize: 11, color: T.whiteM, marginTop: 2 }}>{totalFw} files · {ratedFw} AI-rated · {totalFw - ratedFw} pending</div>
              </div>
              <div style={{ fontSize: 10, color: T.whiteDim }}>Select a control in the tree to upload targeted evidence</div>
            </div>
          )}
        </div>

        {/* Upload zone */}
        <div style={{ ...CS, flexShrink: 0, border: `2px dashed ${dragOver ? fw?.color + 'aa' : T.border}`, background: dragOver ? fw?.color + '08' : T.card, transition: 'border-color 0.15s, background 0.15s', cursor: 'default' }}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) upload(f) }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 10, color: T.whiteM, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>
                Evidence Description {selControl && <span style={{ color: fw?.color, textTransform: 'none' }}>- uploading to {activeRef}</span>}
              </label>
              <input value={desc} onChange={e => setDesc(e.target.value)}
                placeholder={selControl ? `Describe this evidence for ${activeRef} - e.g. "MFA enforcement policy v2.1, approved March 2025"` : 'Select a control first, then describe the evidence file'}
                style={{ width: '100%', background: T.bg2, border: `1px solid ${T.border}`, color: T.white, padding: '9px 12px', borderRadius: 7, fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
            </div>
            <label style={{ cursor: uploading ? 'not-allowed' : 'pointer', flexShrink: 0 }}>
              <input type="file" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && upload(e.target.files[0])} accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt,.csv,.zip" disabled={uploading} />
              <div style={{ padding: '9px 20px', background: uploading ? T.border : '#343a40', borderRadius: 7, color: uploading ? T.whiteDim : T.white, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', boxShadow: uploading ? 'none' : 'none', pointerEvents: uploading ? 'none' : 'auto' }}>
                {uploading ? 'Uploading…' : '+ Upload Evidence'}
              </div>
            </label>
          </div>
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px dashed ${T.border}`, fontSize: 10, color: T.whiteDim, textAlign: 'center' }}>
            Drag & drop here · PDF, DOCX, XLSX, PNG, JPG, CSV · {selControl ? <span style={{ color: '#adb5bd' }}>AI will auto-rate against {activeRef}</span> : <span style={{ color: '#6c757d' }}>Select a control for AI auto-rating</span>}
          </div>
        </div>

        {/* AI Evidence Generator */}
        {selControl && (
          <AiEvidenceGenerator
            framework_id={selFw}
            control_ref={activeRef}
            controlTitle={activeItem?.title || ''}
            controlDesc={activeItem?.desc || ''}
            organization={profile?.organizations?.name || 'Your Organization'}
            authFetch={authFetch}
            notify={notify}
            onFileSaved={loadFiles}
          />
        )}

        {/* Files */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 50, color: T.whiteDim }}>Loading evidence…</div>
          ) : visibleFiles.length === 0 ? (
            <div style={{ ...CS, textAlign: 'center', padding: '50px 30px' }}>
              <div style={{ fontSize: 36, opacity: 0.15, marginBottom: 14 }}>|&gt;</div>
              <div style={{ fontSize: 14, color: T.white, fontWeight: 600, marginBottom: 6 }}>No evidence {activeRef ? `for ${activeRef}` : `in ${fw?.label}`}</div>
              <div style={{ fontSize: 12, color: T.whiteDim, maxWidth: 420, margin: '0 auto', lineHeight: 1.7 }}>Upload screenshots, policy documents, configuration exports, signed approvals, audit reports, and other artifacts. AI automatically rates each file against the selected control.</div>
            </div>
          ) : visibleFiles.map(f => {
            const isRating   = ratingId === f.id
            const hasRating  = !!f.ai_rating
            const rc         = hasRating ? rColor(f.ai_rating) : T.whiteDim
            const confidence = f.ai_confidence || 0
            return (
              <div key={f.id} style={{ ...CS, border: `1px solid ${hasRating ? rc + '33' : T.border}`, transition: 'border-color 0.2s' }}>
                <div style={{ display: 'flex', gap: 12 }}>
                  {/* Icon */}
                  <div style={{ width: 44, height: 44, background: fileClr(f.file_type) + '18', border: `1px solid ${fileClr(f.file_type)}33`, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900, color: fileClr(f.file_type), flexShrink: 0, letterSpacing: '0.02em' }}>
                    {fileIcon(f.file_type)}
                  </div>

                  {/* Main content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Top row */}
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: T.white }}>{f.file_name}</span>
                      {f.control_ref && (
                        <span style={{ fontFamily: 'monospace', fontSize: 9, color: fw?.color, background: fw?.color + '14', border: `1px solid ${fw?.color}44`, padding: '2px 7px', borderRadius: 4, flexShrink: 0 }}>{f.control_ref}</span>
                      )}
                      {f.file_size && <span style={{ fontSize: 9, color: T.whiteDim }}>{(f.file_size / 1024).toFixed(1)} KB</span>}
                      <span style={{ fontSize: 9, color: T.whiteDim }}>{(f.created_at || '').split('T')[0]}</span>
                      {f.file_url && (
                        <a href={f.file_url} target="_blank" rel="noreferrer" style={{ fontSize: 9, color: T.blueL, textDecoration: 'none', marginLeft: 'auto' }}>View ↗</a>
                      )}
                    </div>

                    {/* Description */}
                    {f.description && f.description !== f.file_name && (
                      <div style={{ fontSize: 11, color: T.whiteM, marginBottom: 8, lineHeight: 1.5 }}>{f.description}</div>
                    )}

                    {/* AI Rating panel */}
                    {hasRating && (
                      <div style={{ background: T.bg2, border: `1px solid ${rc}2a`, borderRadius: 9, padding: '12px 14px', marginBottom: 4 }}>
                        {/* Rating header */}
                        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 10, flexWrap: 'wrap' }}>
                          <div>
                            <div style={{ fontSize: 8, color: T.whiteDim, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3, fontWeight: 700 }}>AI Rating</div>
                            <div style={{ fontSize: 15, fontWeight: 900, color: rc, letterSpacing: '-0.01em' }}>{f.ai_rating}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 8, color: T.whiteDim, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3, fontWeight: 700 }}>Confidence</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div style={{ fontSize: 15, fontWeight: 900, color: T.white }}>{confidence}%</div>
                              <div style={{ width: 56, height: 5, background: T.border, borderRadius: 2, overflow: 'hidden' }}>
                                <div style={{ width: `${confidence}%`, height: '100%', background: confidence >= 75 ? '#adb5bd' : confidence >= 50 ? '#6c757d' : T.danger }} />
                              </div>
                            </div>
                          </div>
                          <div style={{ flex: 1, minWidth: 200 }}>
                            <div style={{ fontSize: 8, color: T.whiteDim, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3, fontWeight: 700 }}>Reasoning</div>
                            <div style={{ fontSize: 11, color: T.whiteM, lineHeight: 1.7 }}>{f.ai_reasoning}</div>
                          </div>
                        </div>

                        {/* Gaps */}
                        {(f.ai_gaps || []).length > 0 && (
                          <div style={{ marginBottom: 8 }}>
                            <div style={{ fontSize: 8, color: '#6c757d', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>Evidence Gaps</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              {(f.ai_gaps || []).map((g, i) => (
                                <div key={i} style={{ display: 'flex', gap: 6, fontSize: 11, color: T.whiteM, lineHeight: 1.5 }}>
                                  <span style={{ color: '#6c757d', flexShrink: 0, marginTop: 2 }}>▸</span>
                                  <span>{g}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Recommendations */}
                        {(f.ai_recommendations || []).length > 0 && (
                          <div>
                            <div style={{ fontSize: 8, color: '#adb5bd', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>Recommendations</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              {(f.ai_recommendations || []).map((r, i) => (
                                <div key={i} style={{ display: 'flex', gap: 6, fontSize: 11, color: T.whiteM, lineHeight: 1.5 }}>
                                  <span style={{ color: '#adb5bd', flexShrink: 0, marginTop: 2 }}>✓</span>
                                  <span>{r}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Pending rating notice */}
                    {!hasRating && !isRating && (
                      <div style={{ fontSize: 10, color: T.whiteDim, fontStyle: 'italic' }}>Not yet AI-rated - click "AI Rate" to analyze this evidence against {f.control_ref || 'the selected control'}</div>
                    )}
                    {isRating && (
                      <div style={{ fontSize: 10, color: fw?.color }}>Analyzing evidence with AI…</div>
                    )}
                  </div>

                  {/* Action button */}
                  <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <button onClick={() => rateFile(f)} disabled={isRating}
                      style={{ padding: '6px 14px', background: hasRating ? T.bg2 : T.blue + '1a', border: `1px solid ${hasRating ? T.border : T.blueL + '55'}`, color: isRating ? T.whiteDim : hasRating ? T.whiteM : T.blueBright, borderRadius: 6, cursor: isRating ? 'not-allowed' : 'pointer', fontSize: 10, fontWeight: 700, fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                      {isRating ? 'Rating…' : hasRating ? '↻ Re-rate' : 'AI Rate'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}


// ── KPIs & KRIs ────────────────────────────────────────────────────────────────
function KpiKriPanel({ profile, notify }) {
  const supabase = createClient()

  const DEFAULT_KPIS = [
    {type:'KPI',name:'Patch Compliance Rate',category:'Technical',framework_id:'NCA_ECC',target_value:95,current_value:null,unit:'%',direction:'higher_better',description:'Percentage of systems patched within SLA'},
    {type:'KPI',name:'Security Awareness Training Completion',category:'Governance',framework_id:'NCA_ECC',target_value:100,current_value:null,unit:'%',direction:'higher_better',description:'% of staff completing annual security training'},
    {type:'KPI',name:'Mean Time to Detect (MTTD)',category:'Operations',framework_id:'SAMA_CSF',target_value:4,current_value:null,unit:'hours',direction:'lower_better',description:'Average time to detect a security incident'},
    {type:'KPI',name:'Mean Time to Respond (MTTR)',category:'Operations',framework_id:'SAMA_CSF',target_value:24,current_value:null,unit:'hours',direction:'lower_better',description:'Average time to respond to a security incident'},
    {type:'KPI',name:'Vulnerability Remediation Rate',category:'Technical',framework_id:'NCA_ECC',target_value:90,current_value:null,unit:'%',direction:'higher_better',description:'Critical vulnerabilities remediated within SLA'},
    {type:'KPI',name:'Third-Party Assessment Coverage',category:'Compliance',framework_id:'SAMA_CSF',target_value:100,current_value:null,unit:'%',direction:'higher_better',description:'% of high-risk vendors assessed in past 12 months'},
    {type:'KRI',name:'Open Critical Findings',category:'Risk',framework_id:'NCA_ECC',target_value:0,current_value:null,unit:'count',direction:'lower_better',description:'Number of unresolved critical audit findings'},
    {type:'KRI',name:'Overdue Risk Treatments',category:'Risk',framework_id:'SAMA_CSF',target_value:0,current_value:null,unit:'count',direction:'lower_better',description:'Risk treatment actions past their due date'},
    {type:'KRI',name:'Failed Access Control Attempts',category:'Technical',framework_id:'NCA_ECC',target_value:10,current_value:null,unit:'count',direction:'lower_better',description:'Unauthorized access attempts per day (threshold)'},
    {type:'KRI',name:'Data Loss Prevention Incidents',category:'Technical',framework_id:'NCA_DCC',target_value:0,current_value:null,unit:'count',direction:'lower_better',description:'DLP policy violations per month'},
    {type:'KPI',name:'Policy Review Compliance',category:'Governance',framework_id:'SAMA_CSF',target_value:100,current_value:null,unit:'%',direction:'higher_better',description:'% of policies reviewed on schedule'},
    {type:'KPI',name:'BCP Test Success Rate',category:'Compliance',framework_id:'SAMA_CSF',target_value:100,current_value:null,unit:'%',direction:'higher_better',description:'Business continuity tests passed vs. planned'},
  ]

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState(null)
  const [editVal, setEditVal] = useState('')
  const [filter, setFilter] = useState('All')
  const [showAdd, setShowAdd] = useState(false)
  const [newItem, setNewItem] = useState({type:'KPI',name:'',category:'Governance',framework_id:'NCA_ECC',target_value:'',current_value:'',unit:'%',direction:'higher_better',description:''})

  const load = async () => {
    if (!profile?.organization_id) { setLoading(false); return }
    if (isGuest()) {
      setItems(demoList('kpi_kri', () => DEFAULT_KPIS.map((k,i)=>({...k,id:'kpi-seed-'+i,organization_id:'demo-org'}))))
      setLoading(false); return
    }
    setLoading(true)
    const {data} = await supabase.from('kpi_kri').select('*').eq('organization_id',profile.organization_id).order('type').order('category')
    if (data && data.length > 0) {
      setItems(data)
    } else {
      // Seed defaults
      const seeded = await Promise.all(DEFAULT_KPIS.map(k=>
        supabase.from('kpi_kri').insert({...k,organization_id:profile.organization_id}).select().single()
      ))
      setItems(seeded.filter(r=>r.data).map(r=>r.data))
    }
    setLoading(false)
  }
  useEffect(()=>{load()},[profile?.organization_id])

  const updateValue = async (id, val) => {
    const num = parseFloat(val)
    if (isNaN(num)) return
    const item = items.find(i=>i.id===id)
    if (!item) return
    let status = 'On Track'
    if (item.direction==='higher_better') status = num >= item.target_value ? 'On Track' : num >= item.target_value*0.8 ? 'At Risk' : 'Breached'
    else status = num <= item.target_value ? 'On Track' : num <= item.target_value*1.2 ? 'At Risk' : 'Breached'
    const history = [...(item.history||[]),{value:num,date:new Date().toISOString().slice(0,10)}].slice(-12)
    if (isGuest()) demoUpdate('kpi_kri', id, {current_value:num,status,history} as any)
    else await supabase.from('kpi_kri').update({current_value:num,status,history,updated_at:new Date().toISOString()}).eq('id',id)
    setItems(its=>its.map(i=>i.id===id?{...i,current_value:num,status,history}:i))
    setEditId(null); notify('Updated')
  }

  const addItem = async () => {
    if (!newItem.name) return
    const payload = {...newItem,organization_id:profile.organization_id,target_value:parseFloat(newItem.target_value)||0,current_value:newItem.current_value!==''?parseFloat(newItem.current_value):null}
    const data = isGuest() ? demoInsert('kpi_kri', payload as any) : (await supabase.from('kpi_kri').insert(payload).select().single()).data
    if (data) {setItems(its=>[...its,data]);notify('Added');setShowAdd(false);setNewItem({type:'KPI',name:'',category:'Governance',framework_id:'NCA_ECC',target_value:'',current_value:'',unit:'%',direction:'higher_better',description:''})}
  }

  const statusColor = (s) => ({OnTrack:'#adb5bd','On Track':'#adb5bd',AtRisk:'#6c757d','At Risk':'#6c757d',Breached:T.danger})[s?.replace(' ','')] || T.whiteDim
  const FW_COLORS = {NCA_ECC:'#adb5bd',NCA_DCC:'#adb5bd',SAMA_CSF:'#ced4da',ISO_27001:'#dee2e6',NIST_CSF:'#adb5bd'}
  const CAT_COLORS = {Governance:T.blueL,Risk:T.danger,Compliance:T.accent,Operations:'#6c757d',Technical:'#adb5bd'}

  const filtered = filter==='All'?items:items.filter(i=>i.type===filter)
  const kpis = items.filter(i=>i.type==='KPI')
  const kris = items.filter(i=>i.type==='KRI')
  const onTrack = items.filter(i=>i.status==='On Track').length
  const atRisk = items.filter(i=>i.status==='At Risk').length
  const breached = items.filter(i=>i.status==='Breached').length

  const getPct = (item) => {
    if (item.current_value==null||item.target_value==null) return null
    if (item.direction==='higher_better') return Math.min(Math.round((item.current_value/item.target_value)*100),100)
    return item.current_value<=item.target_value ? 100 : Math.max(0,Math.round(100-(((item.current_value-item.target_value)/item.target_value)*100)))
  }

  if (loading) return <div style={{textAlign:'center',padding:40,color:T.whiteDim}}>Loading KPIs...</div>

  return (
    <div>
      {/* Summary cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10,marginBottom:13}}>
        {[
          {label:'Total Indicators',val:items.length,color:T.blueL},
          {label:'KPIs',val:kpis.length,color:T.accent},
          {label:'KRIs',val:kris.length,color:'#adb5bd'},
          {label:'On Track',val:onTrack,color:'#adb5bd'},
          {label:'Breached',val:breached,color:T.danger},
        ].map((s,i)=>(
          <div key={i} style={{...CS,borderLeft:`3px solid ${s.color}`,padding:'12px 14px'}}>
            <div style={{fontSize:9,color:T.whiteM,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:4,fontWeight:600}}>{s.label}</div>
            <div style={{fontSize:28,fontWeight:900,color:s.color,lineHeight:1}}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Filters + Add */}
      <div style={{display:'flex',gap:6,marginBottom:11,alignItems:'center'}}>
        {['All','KPI','KRI'].map(f=>(
          <button key={f} onClick={()=>setFilter(f)}
            style={{padding:'5px 14px',borderRadius:5,border:`1px solid ${filter===f?T.blueL+'55':T.border}`,background:filter===f?T.blue+'14':'transparent',color:filter===f?T.blueBright:T.whiteM,cursor:'pointer',fontSize:11,fontWeight:600,fontFamily:'inherit'}}>
            {f}
          </button>
        ))}
        <div style={{marginLeft:'auto'}}>
          <button onClick={()=>setShowAdd(!showAdd)}
            style={{padding:'6px 14px',background:'#343a40',border:'1px solid #495057',color:T.white,borderRadius:6,cursor:'pointer',fontSize:11,fontWeight:700,fontFamily:'inherit'}}>
            + Add Indicator
          </button>
        </div>
      </div>

      {showAdd&&(
        <div style={{...CS,marginBottom:11,background:'#050F18',border:`1px solid ${T.blueL}22`}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:'0 10px'}}>
            <div style={{marginBottom:10}}>
              <label style={{fontSize:10,color:T.whiteM,display:'block',marginBottom:4,textTransform:'uppercase',letterSpacing:'0.07em',fontWeight:600}}>Type</label>
              <select value={newItem.type} onChange={e=>setNewItem(x=>({...x,type:e.target.value}))} style={{width:'100%',background:T.bg2,border:`1px solid ${T.border}`,color:T.white,padding:'8px 10px',borderRadius:6,fontSize:12,fontFamily:'inherit'}}>
                <option>KPI</option><option>KRI</option>
              </select>
            </div>
            <div style={{gridColumn:'span 2',marginBottom:10}}>
              <label style={{fontSize:10,color:T.whiteM,display:'block',marginBottom:4,textTransform:'uppercase',letterSpacing:'0.07em',fontWeight:600}}>Name</label>
              <input value={newItem.name} onChange={e=>setNewItem(x=>({...x,name:e.target.value}))} placeholder="e.g. Patch Compliance Rate"
                style={{width:'100%',background:T.bg2,border:`1px solid ${T.border}`,color:T.white,padding:'8px 10px',borderRadius:6,fontSize:12,fontFamily:'inherit',outline:'none',boxSizing:'border-box'}}/>
            </div>
            <div style={{marginBottom:10}}>
              <label style={{fontSize:10,color:T.whiteM,display:'block',marginBottom:4,textTransform:'uppercase',letterSpacing:'0.07em',fontWeight:600}}>Unit</label>
              <input value={newItem.unit} onChange={e=>setNewItem(x=>({...x,unit:e.target.value}))} placeholder="%, count, days"
                style={{width:'100%',background:T.bg2,border:`1px solid ${T.border}`,color:T.white,padding:'8px 10px',borderRadius:6,fontSize:12,fontFamily:'inherit',outline:'none',boxSizing:'border-box'}}/>
            </div>
            <div style={{marginBottom:10}}>
              <label style={{fontSize:10,color:T.whiteM,display:'block',marginBottom:4,textTransform:'uppercase',letterSpacing:'0.07em',fontWeight:600}}>Target</label>
              <input type="number" value={newItem.target_value} onChange={e=>setNewItem(x=>({...x,target_value:e.target.value}))}
                style={{width:'100%',background:T.bg2,border:`1px solid ${T.border}`,color:T.white,padding:'8px 10px',borderRadius:6,fontSize:12,fontFamily:'inherit',outline:'none',boxSizing:'border-box'}}/>
            </div>
            <div style={{marginBottom:10}}>
              <label style={{fontSize:10,color:T.whiteM,display:'block',marginBottom:4,textTransform:'uppercase',letterSpacing:'0.07em',fontWeight:600}}>Direction</label>
              <select value={newItem.direction} onChange={e=>setNewItem(x=>({...x,direction:e.target.value}))} style={{width:'100%',background:T.bg2,border:`1px solid ${T.border}`,color:T.white,padding:'8px 10px',borderRadius:6,fontSize:12,fontFamily:'inherit'}}>
                <option value="higher_better">Higher is better</option>
                <option value="lower_better">Lower is better</option>
              </select>
            </div>
            <div style={{marginBottom:10}}>
              <label style={{fontSize:10,color:T.whiteM,display:'block',marginBottom:4,textTransform:'uppercase',letterSpacing:'0.07em',fontWeight:600}}>Framework</label>
              <select value={newItem.framework_id} onChange={e=>setNewItem(x=>({...x,framework_id:e.target.value}))} style={{width:'100%',background:T.bg2,border:`1px solid ${T.border}`,color:T.white,padding:'8px 10px',borderRadius:6,fontSize:12,fontFamily:'inherit'}}>
                {['NCA_ECC','NCA_DCC','SAMA_CSF','ISO_27001','NIST_CSF'].map(fw=><option key={fw} value={fw}>{fw.replace(/_/g,' ')}</option>)}
              </select>
            </div>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button onClick={addItem} disabled={!newItem.name} style={{padding:'7px 18px',background:'#343a40',border:'1px solid #495057',borderRadius:6,color:T.white,cursor:'pointer',fontSize:12,fontWeight:700,fontFamily:'inherit'}}>Add</button>
            <button onClick={()=>setShowAdd(false)} style={{padding:'7px 14px',background:'transparent',border:`1px solid ${T.border}`,borderRadius:6,color:T.whiteM,cursor:'pointer',fontSize:12,fontFamily:'inherit'}}>Cancel</button>
          </div>
        </div>
      )}

      {/* KPIs/KRIs grid */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
        {filtered.map(item=>{
          const pct = getPct(item)
          const sColor = statusColor(item.status)
          const isEditing = editId===item.id
          const noData = item.current_value==null
          return (
            <div key={item.id} style={{...CS,border:`1px solid ${noData?T.border:sColor+'33'}`}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:'flex',gap:5,marginBottom:4,flexWrap:'wrap'}}>
                    <span style={{fontSize:9,fontWeight:800,background:item.type==='KPI'?T.blueL+'18':'#6c757d'+'18',color:item.type==='KPI'?T.blueBright:'#6c757d',border:`1px solid ${item.type==='KPI'?T.blueL+'44':'#6c757d'+'44'}`,padding:'1px 7px',borderRadius:3}}>{item.type}</span>
                    <span style={{fontSize:9,color:CAT_COLORS[item.category]||T.whiteM,background:(CAT_COLORS[item.category]||T.whiteM)+'18',border:`1px solid ${(CAT_COLORS[item.category]||T.whiteM)}33`,padding:'1px 7px',borderRadius:3}}>{item.category}</span>
                    <span style={{fontSize:9,color:FW_COLORS[item.framework_id]||T.whiteM,padding:'1px 7px'}}>{(item.framework_id||'').replace(/_/g,' ')}</span>
                  </div>
                  <div style={{fontSize:12,fontWeight:700,color:T.white,lineHeight:1.3}}>{item.name}</div>
                  {item.description&&<div style={{fontSize:10,color:T.whiteDim,marginTop:3,lineHeight:1.4}}>{item.description}</div>}
                </div>
                <div style={{flexShrink:0,marginLeft:8,textAlign:'right'}}>
                  <div style={{fontSize:9,color:T.whiteDim}}>TARGET</div>
                  <div style={{fontSize:13,fontWeight:800,color:T.white}}>{item.target_value}{item.unit}</div>
                </div>
              </div>

              {/* Current value */}
              <div style={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:8,padding:'10px 12px',marginBottom:8}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                  <div style={{fontSize:9,color:T.whiteM,textTransform:'uppercase',letterSpacing:'0.07em',fontWeight:600}}>Current Value</div>
                  {!noData&&<span style={{fontSize:9,fontWeight:700,background:sColor+'18',color:sColor,border:`1px solid ${sColor}44`,padding:'1px 8px',borderRadius:3}}>{item.status}</span>}
                </div>
                {isEditing ? (
                  <div style={{display:'flex',gap:5}}>
                    <input type="number" value={editVal} onChange={e=>setEditVal(e.target.value)} autoFocus
                      style={{flex:1,background:T.bg,border:`1px solid ${T.blueL}`,color:T.white,padding:'4px 8px',borderRadius:5,fontSize:16,fontWeight:800,outline:'none',fontFamily:'inherit'}}
                      onKeyDown={e=>{if(e.key==='Enter')updateValue(item.id,editVal);if(e.key==='Escape')setEditId(null)}}/>
                    <button onClick={()=>updateValue(item.id,editVal)} style={{background:T.blue,border:'none',color:T.white,padding:'4px 10px',borderRadius:5,cursor:'pointer',fontSize:11,fontFamily:'inherit'}}>Save</button>
                    <button onClick={()=>setEditId(null)} style={{background:'transparent',border:`1px solid ${T.border}`,color:T.whiteM,padding:'4px 8px',borderRadius:5,cursor:'pointer',fontSize:11,fontFamily:'inherit'}}>x</button>
                  </div>
                ) : (
                  <div style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}} onClick={()=>{setEditId(item.id);setEditVal(item.current_value??'')}}>
                    <div style={{fontSize:28,fontWeight:900,color:noData?T.whiteDim:sColor,lineHeight:1}}>
                      {noData?'-':item.current_value+item.unit}
                    </div>
                    {noData&&<div style={{fontSize:11,color:T.whiteDim}}>Click to enter value</div>}
                    {!noData&&pct!=null&&(
                      <div style={{flex:1}}>
                        <div style={{display:'flex',justifyContent:'space-between',fontSize:9,color:T.whiteDim,marginBottom:2}}>
                          <span>Progress</span><span>{pct}%</span>
                        </div>
                        <div style={{background:T.border,borderRadius:2,height:5,overflow:'hidden'}}>
                          <div style={{width:`${pct}%`,height:'100%',background:sColor,transition:'width 0.4s'}}/>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Trend sparkline from history */}
              {(item.history||[]).length > 1 && (
                <div style={{marginBottom:8}}>
                  <div style={{fontSize:9,color:T.whiteDim,marginBottom:3}}>TREND (last {item.history.length} updates)</div>
                  <div style={{display:'flex',alignItems:'flex-end',gap:2,height:24}}>
                    {item.history.slice(-10).map((h,i)=>{
                      const vals = item.history.slice(-10).map(x=>x.value)
                      const mn=Math.min(...vals), mx=Math.max(...vals), range=mx-mn||1
                      const h_pct = ((h.value-mn)/range)*100
                      const col = item.direction==='higher_better'?(h.value>=item.target_value?'#adb5bd':'#6c757d'):(h.value<=item.target_value?'#adb5bd':'#6c757d')
                      return <div key={i} style={{flex:1,background:col,borderRadius:1,height:`${Math.max(h_pct,8)}%`,opacity:0.7+i*0.03}}/>
                    })}
                  </div>
                </div>
              )}

              <div style={{fontSize:9,color:T.whiteDim,direction:'ltr'}}>
                {item.direction==='higher_better'?'Higher is better':'Lower is better'} · Updated {(item.updated_at||item.created_at||'').split('T')[0]}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── TEAM MANAGEMENT ──────────────────────────────────────────────────────────
function TeamManagement({ currentProfile, notify }: any) {
  const supabase = createClient()
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('analyst')
  const [inviting, setInviting] = useState(false)
  const [updatingId, setUpdatingId] = useState<string|null>(null)

  const isAdmin = ['admin','grc_manager'].includes(currentProfile?.role)

  const load = async () => {
    if (!currentProfile?.organization_id) { setLoading(false); return }
    if (isGuest()) { setMembers([{ ...GUEST_PROFILE, created_at: new Date().toISOString() }]); setLoading(false); return }
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, created_at, avatar_url')
      .eq('organization_id', currentProfile.organization_id)
      .order('created_at')
    setMembers(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [currentProfile?.organization_id])

  const invite = async () => {
    if (!inviteEmail) return
    if (isGuest()) { notify('Team management is available once you sign in', 'error'); return }
    setInviting(true)
    try {
      const res = await authFetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole, full_name: inviteEmail.split('@')[0] }),
      })
      const d = await res.json()
      if (!res.ok) notify(d.error || 'Invite failed', 'error')
      else { notify('Member added: ' + inviteEmail); setInviteEmail(''); setShowInvite(false); load() }
    } catch { notify('Invite failed', 'error') }
    setInviting(false)
  }

  const changeRole = async (memberId: string, role: string) => {
    if (isGuest()) { notify('Team management is available once you sign in', 'error'); return }
    setUpdatingId(memberId)
    await supabase.from('profiles').update({ role }).eq('id', memberId)
    setMembers(ms => ms.map(m => m.id === memberId ? { ...m, role } : m))
    setUpdatingId(null)
    notify('Role updated')
  }

  const removeMember = async (memberId: string) => {
    if (isGuest()) { notify('Team management is available once you sign in', 'error'); return }
    if (memberId === currentProfile?.id) { notify('Cannot remove yourself', 'error'); return }
    if (!confirm('Remove this member?')) return
    await supabase.from('profiles').update({ organization_id: null }).eq('id', memberId)
    setMembers(ms => ms.filter(m => m.id !== memberId))
    notify('Member removed')
  }

  const ROLES = ['admin', 'grc_manager', 'analyst', 'viewer']
  const ROLE_LABELS: Record<string,string> = { admin: 'Administrator', grc_manager: 'GRC Manager', analyst: 'GRC Analyst', viewer: 'Viewer' }
  const INP: React.CSSProperties = { background: '#1a1d20', border: '1px solid #3d4247', borderRadius: 6, color: '#f8f9fa', padding: '8px 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box' as const }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#f8f9fa' }}>Team Members</div>
          <div style={{ fontSize: 11, color: '#6c757d', marginTop: 3 }}>
            {members.length} member{members.length !== 1 ? 's' : ''} in your organization
          </div>
        </div>
        {isAdmin && (
          <button onClick={() => setShowInvite(v => !v)}
            style={{ padding: '8px 16px', background: '#343a40', border: '1px solid #495057', color: '#f8f9fa',
              borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}>
            {showInvite ? 'Cancel' : '+ Invite Member'}
          </button>
        )}
      </div>

      {/* Invite panel */}
      {showInvite && isAdmin && (
        <div style={{ background: '#212529', border: '1px solid #2d3136', borderRadius: 10, padding: '20px 24px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#495057', textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 16 }}>
            Invite New Member
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px auto', gap: 10, alignItems: 'end' }}>
            <div>
              <div style={{ fontSize: 10, color: '#6c757d', marginBottom: 5, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.07em' }}>Email Address</div>
              <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com" style={INP}
                onKeyDown={e => e.key === 'Enter' && invite()}/>
            </div>
            <div>
              <div style={{ fontSize: 10, color: '#6c757d', marginBottom: 5, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.07em' }}>Role</div>
              <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                style={{ ...INP, cursor: 'pointer' }}>
                {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
            </div>
            <button onClick={invite} disabled={inviting || !inviteEmail}
              style={{ padding: '8px 20px', background: inviting||!inviteEmail ? '#2d3136' : '#343a40',
                border: `1px solid ${inviting||!inviteEmail ? '#3d4247' : '#495057'}`,
                color: inviting||!inviteEmail ? '#495057' : '#f8f9fa',
                borderRadius: 6, cursor: inviting||!inviteEmail ? 'not-allowed' : 'pointer',
                fontSize: 12, fontWeight: 600, fontFamily: 'inherit', whiteSpace: 'nowrap' as const }}>
              {inviting ? 'Sending…' : 'Send Invite'}
            </button>
          </div>
          <div style={{ fontSize: 10, color: '#495057', marginTop: 10 }}>
            They will receive an email to set their password and join your organization.
          </div>
        </div>
      )}

      {/* Members list */}
      <div style={{ background: '#212529', border: '1px solid #2d3136', borderRadius: 10, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#495057', fontSize: 13 }}>Loading members…</div>
        ) : members.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#495057', fontSize: 13 }}>
            No members found. Invite your team to get started.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #2d3136' }}>
                {['Member', 'Role', 'Joined', isAdmin ? 'Actions' : ''].filter(Boolean).map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left' as const, fontSize: 10,
                    fontWeight: 700, color: '#495057', textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map((m, idx) => (
                <tr key={m.id} style={{ borderBottom: idx < members.length-1 ? '1px solid #1a1d20' : 'none',
                  background: idx % 2 === 0 ? 'transparent' : '#1a1d2022' }}>
                  {/* Avatar + name */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#2d3136',
                        border: '1px solid #3d4247', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, fontWeight: 700, color: '#f8f9fa', overflow: 'hidden', flexShrink: 0 }}>
                        {m.avatar_url
                          ? <img src={m.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                          : (m.full_name?.[0]?.toUpperCase() || m.email?.[0]?.toUpperCase() || '?')}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#f8f9fa' }}>
                          {m.full_name || '-'}
                          {m.id === currentProfile?.id && (
                            <span style={{ marginLeft: 8, fontSize: 9, color: '#6c757d',
                              background: '#2d3136', border: '1px solid #3d4247', padding: '1px 6px', borderRadius: 3 }}>
                              You
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: '#6c757d', marginTop: 2 }}>{m.email}</div>
                      </div>
                    </div>
                  </td>
                  {/* Role */}
                  <td style={{ padding: '12px 16px' }}>
                    {isAdmin && m.id !== currentProfile?.id ? (
                      <select value={m.role} onChange={e => changeRole(m.id, e.target.value)}
                        disabled={updatingId === m.id}
                        style={{ background: '#1a1d20', border: '1px solid #3d4247', borderRadius: 5,
                          color: '#adb5bd', padding: '5px 8px', fontSize: 11, fontFamily: 'inherit',
                          cursor: 'pointer', outline: 'none' }}>
                        {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                      </select>
                    ) : (
                      <span style={{ fontSize: 11, fontWeight: 600, background: '#2d3136',
                        border: '1px solid #3d4247', color: '#adb5bd', padding: '3px 10px', borderRadius: 4 }}>
                        {ROLE_LABELS[m.role] || m.role}
                      </span>
                    )}
                  </td>
                  {/* Joined */}
                  <td style={{ padding: '12px 16px', fontSize: 11, color: '#6c757d' }}>
                    {m.created_at ? new Date(m.created_at).toLocaleDateString('en-SA', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}
                  </td>
                  {/* Actions */}
                  {isAdmin && (
                    <td style={{ padding: '12px 16px' }}>
                      {m.id !== currentProfile?.id && (
                        <button onClick={() => removeMember(m.id)}
                          style={{ padding: '4px 12px', background: 'transparent', border: '1px solid #3d4247',
                            color: '#6c757d', borderRadius: 5, cursor: 'pointer', fontSize: 11, fontFamily: 'inherit' }}
                          onMouseEnter={e => { (e.target as any).style.borderColor = '#dc3545'; (e.target as any).style.color = '#dc3545' }}
                          onMouseLeave={e => { (e.target as any).style.borderColor = '#3d4247'; (e.target as any).style.color = '#6c757d' }}>
                          Remove
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}


// ── PROFILE SETTINGS ─────────────────────────────────────────────────────────
function ProfileSettings({ profile, org, onUpdate, notify }: any) {
  const supabase = createClient()
  const [pf, setPf] = useState({ full_name: profile?.full_name || '' })
  const [of, setOf] = useState({
    name: org?.name || '', name_ar: org?.name_ar || '',
    sector: org?.sector || 'Financial / Banking', license_number: org?.license_number || '',
  })
  const [pw, setPw] = useState({ newp: '', confirm: '' })
  const [saving, setSaving] = useState(false)
  const [pwSaving, setPwSaving] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string|null>(profile?.avatar_url || null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setPf({ full_name: profile?.full_name || '' }); setAvatarUrl(profile?.avatar_url || null) }, [profile?.full_name, profile?.avatar_url])
  useEffect(() => { setOf({ name: org?.name||'', name_ar: org?.name_ar||'', sector: org?.sector||'Financial / Banking', license_number: org?.license_number||'' }) }, [org?.name, org?.name_ar, org?.sector, org?.license_number])

  const canEditOrg = ['admin','grc_manager'].includes(profile?.role)

  const saveProfile = async () => {
    if (isGuest()) { onUpdate({ ...profile, full_name: pf.full_name }); notify('Saved (demo)'); return }
    setSaving(true)
    try {

      const res = await authFetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: { full_name: pf.full_name }, org: canEditOrg ? of : undefined }),
      })
      const d = await res.json()
      if (!res.ok) notify(d.error || 'Save failed', 'error')
      else { onUpdate(d.data); notify('Saved successfully') }
    } catch { notify('Network error', 'error') }
    setSaving(false)
  }

  const changePw = async () => {
    if (isGuest()) { notify('Sign in to manage a password', 'error'); return }
    if (pw.newp !== pw.confirm) { notify('Passwords do not match', 'error'); return }
    if (pw.newp.length < 8) { notify('Minimum 8 characters', 'error'); return }
    setPwSaving(true)
    const { error } = await supabase.auth.updateUser({ password: pw.newp })
    if (error) notify(error.message, 'error')
    else { notify('Password updated'); setPw({ newp: '', confirm: '' }) }
    setPwSaving(false)
  }

  const uploadAvatar = async (file: File) => {
    if (isGuest()) { notify('Sign in to upload an avatar', 'error'); return }
    const ext = file.name.split('.').pop()
    const path = `avatars/${profile?.id}.${ext}`
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (error) { notify('Avatar upload failed', 'error'); return }
    const url = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
    setAvatarUrl(url)
    await supabase.from('profiles').update({ avatar_url: url }).eq('id', profile?.id)
    notify('Avatar updated')
  }

  const CARD: React.CSSProperties = { background: '#212529', border: '1px solid #2d3136', borderRadius: 10, padding: '22px 24px' }
  const SEC:  React.CSSProperties = { fontSize: 10, fontWeight: 700, color: '#495057', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 18 }
  const LBL:  React.CSSProperties = { display: 'block', fontSize: 10, fontWeight: 600, color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }
  const INP:  React.CSSProperties = { width: '100%', boxSizing: 'border-box', background: '#1a1d20', border: '1px solid #3d4247', borderRadius: 6, color: '#f8f9fa', padding: '9px 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', marginBottom: 14, transition: 'border-color 0.15s' }
  const INP_D:React.CSSProperties = { ...INP, background: '#212529', color: '#495057', cursor: 'not-allowed' }
  const BTN = (on: boolean): React.CSSProperties => ({ padding: '9px 20px', background: on?'#343a40':'#2d3136', border: `1px solid ${on?'#495057':'#3d4247'}`, color: on?'#f8f9fa':'#495057', borderRadius: 6, cursor: on?'pointer':'not-allowed', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' })
  const fo = (e: any) => e.target.style.borderColor = '#adb5bd'
  const bl = (e: any) => e.target.style.borderColor = '#3d4247'
  const rl: Record<string,string> = { admin:'Administrator', grc_manager:'GRC Manager', analyst:'GRC Analyst', viewer:'Viewer' }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, padding: '4px 0' }}>

      <div style={CARD}>
        <div style={SEC}>My Profile</div>
        <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:22, padding:'14px 16px', background:'#1a1d20', borderRadius:8, border:'1px solid #2d3136' }}>
          <div style={{ position:'relative', flexShrink:0 }}>
            <div onClick={()=>fileRef.current?.click()}
              style={{ width:52, height:52, borderRadius:'50%', background:'#2d3136', border:'2px solid #3d4247', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:800, color:'#f8f9fa', cursor:'pointer', overflow:'hidden' }}>
              {avatarUrl ? <img src={avatarUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/> : (profile?.full_name?.[0]?.toUpperCase()||'U')}
            </div>
            <div style={{ position:'absolute', bottom:0, right:0, width:16, height:16, background:'#343a40', border:'1px solid #495057', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, cursor:'pointer' }} onClick={()=>fileRef.current?.click()}>✎</div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={e=>e.target.files?.[0]&&uploadAvatar(e.target.files[0])}/>
          <div style={{minWidth:0}}>
            <div style={{fontSize:15,fontWeight:700,color:'#f8f9fa'}}>{profile?.full_name||'-'}</div>
            <div style={{fontSize:11,color:'#6c757d',marginTop:3}}>{profile?.email}</div>
            <div style={{marginTop:6}}><span style={{fontSize:10,fontWeight:700,background:'#2d3136',border:'1px solid #3d4247',color:'#adb5bd',padding:'2px 10px',borderRadius:4}}>{rl[profile?.role]||profile?.role}</span></div>
          </div>
        </div>
        <label style={LBL}>Full Name</label>
        <input value={pf.full_name} onChange={e=>setPf(x=>({...x,full_name:e.target.value}))} style={INP} onFocus={fo} onBlur={bl} placeholder="Your full name"/>
        <label style={LBL}>Email</label>
        <input value={profile?.email||''} disabled style={INP_D}/>
        <button onClick={saveProfile} disabled={saving} style={BTN(!saving)}
          onMouseEnter={e=>{if(!saving)(e.target as any).style.background='#495057'}}
          onMouseLeave={e=>{if(!saving)(e.target as any).style.background='#343a40'}}>
          {saving?'Saving…':'Save Profile'}
        </button>
      </div>

      <div style={CARD}>
        <div style={SEC}>Organization</div>
        {!canEditOrg&&<div style={{fontSize:11,color:'#495057',fontStyle:'italic',marginBottom:14,padding:'8px 12px',background:'#1a1d20',borderRadius:6,border:'1px solid #2d3136'}}>View only - contact your admin to edit</div>}
        <label style={LBL}>Name (English)</label>
        <input value={of.name} onChange={e=>setOf(x=>({...x,name:e.target.value}))} style={canEditOrg?INP:INP_D} disabled={!canEditOrg} onFocus={fo} onBlur={bl} placeholder="e.g. Saudi National Bank"/>
        <label style={LBL}>Name (Arabic)</label>
        <input value={of.name_ar||''} onChange={e=>setOf(x=>({...x,name_ar:e.target.value}))} style={canEditOrg?{...INP,direction:'rtl'}:{...INP_D,direction:'rtl'}} disabled={!canEditOrg} onFocus={fo} onBlur={bl} placeholder="الاسم بالعربية" dir="rtl"/>
        <label style={LBL}>Sector</label>
        <select value={of.sector} onChange={e=>setOf(x=>({...x,sector:e.target.value}))} disabled={!canEditOrg} style={canEditOrg?{...INP,cursor:'pointer'}:{...INP_D,cursor:'not-allowed'}}>
          {['Financial / Banking','Insurance','Government','Military & Defense','Healthcare','Energy & Utilities','Telecommunications','Technology','Education','Other'].map(s=><option key={s}>{s}</option>)}
        </select>
        <label style={LBL}>License / CR Number</label>
        <input value={of.license_number||''} onChange={e=>setOf(x=>({...x,license_number:e.target.value}))} style={canEditOrg?INP:INP_D} disabled={!canEditOrg} onFocus={fo} onBlur={bl} placeholder="e.g. 1010XXXXXX"/>
        {canEditOrg&&<button onClick={saveProfile} disabled={saving} style={BTN(!saving)}
          onMouseEnter={e=>{if(!saving)(e.target as any).style.background='#495057'}}
          onMouseLeave={e=>{if(!saving)(e.target as any).style.background='#343a40'}}>
          {saving?'Saving…':'Save Organization'}
        </button>}
      </div>

      <div style={CARD}>
        <div style={SEC}>Change Password</div>
        <label style={LBL}>New Password</label>
        <input type="password" value={pw.newp} onChange={e=>setPw(x=>({...x,newp:e.target.value}))} style={INP} onFocus={fo} onBlur={bl} placeholder="Minimum 8 characters"/>
        <label style={LBL}>Confirm Password</label>
        <input type="password" value={pw.confirm} onChange={e=>setPw(x=>({...x,confirm:e.target.value}))} style={INP} onFocus={fo} onBlur={bl} placeholder="Repeat new password"/>
        {pw.newp&&pw.confirm&&pw.newp!==pw.confirm&&<div style={{fontSize:11,color:'#dc3545',marginBottom:10,marginTop:-8}}>Passwords do not match</div>}
        <button onClick={changePw} disabled={pwSaving||!pw.newp||!pw.confirm||pw.newp!==pw.confirm} style={BTN(!pwSaving&&!!pw.newp&&!!pw.confirm&&pw.newp===pw.confirm)}
          onMouseEnter={e=>{if(!pwSaving&&pw.newp&&pw.confirm&&pw.newp===pw.confirm)(e.target as any).style.background='#495057'}}
          onMouseLeave={e=>{if(!pwSaving&&pw.newp&&pw.confirm&&pw.newp===pw.confirm)(e.target as any).style.background='#343a40'}}>
          {pwSaving?'Updating…':'Update Password'}
        </button>
      </div>

      <div style={CARD}>
        <div style={SEC}>Configuration</div>
        {[
          {l:'Supabase URL',      k:'NEXT_PUBLIC_SUPABASE_URL',      v:process.env.NEXT_PUBLIC_SUPABASE_URL?'✓ Configured':'✗ Not set'},
          {l:'Supabase Anon Key',k:'NEXT_PUBLIC_SUPABASE_ANON_KEY',v:process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?'✓ Configured':'✗ Not set'},
          {l:'Groq API Key (AI)',k:'GROQ_API_KEY',                  v:'Set in .env.local'},
        ].map(item=>(
          <div key={item.k} style={{background:'#1a1d20',border:'1px solid #2d3136',borderRadius:6,padding:'10px 13px',marginBottom:8}}>
            <div style={{fontSize:12,fontWeight:600,color:'#f8f9fa'}}>{item.l}</div>
            <div style={{fontFamily:'monospace',fontSize:10,color:'#495057',marginTop:3}}>{item.k}</div>
            <div style={{fontSize:11,color:item.v.startsWith('✓')?'#adb5bd':'#dc3545',marginTop:4}}>{item.v}</div>
          </div>
        ))}
        <div style={{background:'#1a1d20',border:'1px solid #2d3136',borderRadius:6,padding:'10px 13px'}}>
          <div style={{fontSize:10,color:'#6c757d',fontFamily:'monospace',lineHeight:1.8}}>
            edit .env.local → restart:<br/><span style={{color:'#adb5bd'}}>Ctrl+C → npm run dev</span>
          </div>
        </div>
      </div>

    </div>
  )
}


// ── MAIN ───────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const supabase = createClient()
  const router = useRouter()
  const [tab, setTab] = useState('dashboard')
  const [aiPrompt, setAiPrompt] = useState(undefined)
  const [sidebar, setSidebar] = useState(true)
  const [clock, setClock] = useState(new Date())
  const [toast, setToast] = useState(null)
  const [profile, setProfile] = useState(null)
  const [org, setOrg] = useState(null)
  const [risks, setRisks] = useState([])
  const [findings, setFindings] = useState([])
  const [savedDocs, setSavedDocs] = useState([])
  const [integrations, setIntegrations] = useState({})
  const [fwActive, setFwActive] = useState(null)
  const [riskFilter, setRiskFilter] = useState('All')
  const [sevFilter, setSevFilter] = useState('All')
  const [showRiskForm, setShowRiskForm] = useState(false)
  const [showFindingForm, setShowFindingForm] = useState(false)
  const [evidenceFinding, setEvidenceFinding] = useState(null)
  const [syncingItem, setSyncingItem] = useState(null)
  const [loadingData, setLoadingData] = useState(true)
  const [guest, setGuest] = useState(false)

  const notify = useCallback((msg,type='success')=>{setToast({msg,type});setTimeout(()=>setToast(null),3600)},[])
  const navTo = useCallback((t,p)=>{setTab(t);if(p)setAiPrompt(p)},[])

  useEffect(()=>{const t=setInterval(()=>setClock(new Date()),1000);return()=>clearInterval(t)},[])

  useEffect(()=>{
    // Fall back to the demo workspace when there is no session, or when Supabase
    // cannot be reached or is not configured, so the page never hangs on the loader.
    const startGuest = () => {
      setGuest(true); setGuestActive(true)
      setProfile(GUEST_PROFILE); setOrg(GUEST_ORG)
      setRisks(demoList('risks', seedRisks))
      setFindings(demoList('findings', seedFindings))
      setIntegrations({})
      setLoadingData(false)
    }
    const load = async () => {
      let user = null
      try {
        const res = await supabase.auth.getUser()
        user = res?.data?.user || null
      } catch { user = null }
      if(!user){
        if(!PUBLIC_MODE){router.push('/login');return}
        startGuest()
        return
      }
      try {
        // Cache auth token for all API calls
        await getToken(supabase)
        const [{data:p},{data:r},{data:f},{data:ic}] = await Promise.all([
          supabase.from('profiles').select('*').eq('id',user.id).single(),
          supabase.from('risks').select('*').order('risk_score',{ascending:false}).limit(200),
          supabase.from('findings').select('*').order('created_at',{ascending:false}).limit(200),
          supabase.from('integration_configs').select('*'),
        ])
        if(p){setProfile(p);if(p.organization_id){const {data:o}=await supabase.from('organizations').select('*').eq('id',p.organization_id).single();if(o)setOrg(o)}}
        setRisks(r||[]); setFindings(f||[])
        const icMap={};(ic||[]).forEach(i=>{icMap[i.integration_type]=i}); setIntegrations(icMap)
        setLoadingData(false)
      } catch {
        // Signed in but the data load failed: show the app rather than hang.
        setLoadingData(false)
      }
    }
    load()
  },[])

  const syncItem = async (integration,item_id,item_type) => {
    setSyncingItem(item_id)
    if(guest){ setTimeout(()=>{notify('Demo: integration sync is available once you sign in','error');setSyncingItem(null)},400); return }
    try {
      const res = await authFetch('/api/integrations/sync',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({integration,item_id,item_type})})
      const d = await res.json()
      if(!res.ok){notify(d.error||'Sync failed','error');setSyncingItem(null);return}
      notify(d.message||'Synced to '+integration)
    } catch { notify('Sync failed','error') }
    setSyncingItem(null)
  }

  const saveEvidence = async (findingId,aiResult) => {
    setFindings(fs=>fs.map(f=>f.id===findingId?{...f,ai_rating:aiResult.rating,ai_confidence:aiResult.confidence}:f))
    if(guest){ demoUpdate('findings', findingId, {ai_rating:aiResult.rating,ai_confidence:aiResult.confidence} as any); notify('AI rating saved'); return }
    await authFetch('/api/findings',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:findingId,ai_rating:aiResult.rating,ai_confidence:aiResult.confidence})})
    notify('AI rating saved')
  }

  const signOut = async () => {await supabase.auth.signOut();router.push(PUBLIC_MODE?'/dashboard':'/login')}

  const fwScores = Object.keys(FW).map(id=>({id,score:fwScore(id,findings,risks),color:FW[id].color}))
  const activeFwScores = fwScores.filter(f=>f.score>0)
  const overall = activeFwScores.length
    ? Math.round(activeFwScores.reduce((a,x)=>a+x.score,0)/activeFwScores.length)
    : 0
  const openRisks = risks.filter(r=>r.status==='Open').length
  const critFindings = findings.filter(f=>f.severity==='Critical').length
  const highFindings = findings.filter(f=>f.severity==='High').length
  const connectedInts = INTEGRATIONS.filter(i=>integrations[i.id]?.is_active).length
  const filteredRisks = riskFilter==='All'?risks:risks.filter(r=>r.risk_level===riskFilter)
  const filteredFindings = sevFilter==='All'?findings:findings.filter(f=>f.severity===sevFilter)

  const PAGE = {dashboard:'Executive Dashboard',frameworks:'Compliance Frameworks',controls:'Controls Library',evidence:'Evidence Repository',kpis:'KPIs & KRIs',risks:'Risk Register',findings:'Audit Findings',docgen:'Document Generator',ai:'AI Assistant',integrations:'Integrations',reports:'Reports & Exports',profile:'Profile & Settings',team:'Team Management'}
  const NAVS = [{id:'dashboard',label:'Dashboard',tag:'D'},{id:'frameworks',label:'Frameworks',tag:'F'},{id:'controls',label:'Controls Library',tag:'CL'},{id:'evidence',label:'Evidence',tag:'EV'},{id:'kpis',label:'KPIs & KRIs',tag:'KP'},{id:'risks',label:'Risk Register',tag:'R'},{id:'findings',label:'Findings',tag:'A'},{id:'docgen',label:'Doc Generator',tag:'G'},{id:'ai',label:'AI Assistant',tag:'AI'},{id:'integrations',label:'Integrations',tag:'I'},{id:'reports',label:'Reports',tag:'X'}]

  if(loadingData) return (
    <div style={{position:'fixed',inset:0,background:'#1a1d20',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',zIndex:9999}}>
      <div style={{display:'flex',flexDirection:'column',alignItems:'center'}}>
        <svg viewBox="0 0 90 90" fill="none" xmlns="http://www.w3.org/2000/svg"
          style={{width:90,height:90,display:'block',margin:'0 auto 18px'}}>
          {/* outer dashed ring */}
          <circle cx="45" cy="45" r="38" stroke="#3d4247" strokeWidth="1.2" strokeDasharray="5 3"/>
          {/* mid ring */}
          <circle cx="45" cy="45" r="26" stroke="#495057" strokeWidth="1.2"/>
          {/* inner ring */}
          <circle cx="45" cy="45" r="15" stroke="#6c757d" strokeWidth="1.2"/>
          {/* tiny inner ring */}
          <circle cx="45" cy="45" r="6" stroke="#adb5bd" strokeWidth="1"/>
          {/* center dot */}
          <circle cx="45" cy="45" r="2.5" fill="#f8f9fa"/>
          {/* crosshair ticks */}
          <line x1="45" y1="7" x2="45" y2="19" stroke="#3d4247" strokeWidth="1" strokeLinecap="round"/>
          <line x1="45" y1="71" x2="45" y2="83" stroke="#3d4247" strokeWidth="1" strokeLinecap="round"/>
          <line x1="7" y1="45" x2="19" y2="45" stroke="#3d4247" strokeWidth="1" strokeLinecap="round"/>
          <line x1="71" y1="45" x2="83" y2="45" stroke="#3d4247" strokeWidth="1" strokeLinecap="round"/>
          {/* sweep line */}
          <line x1="45" y1="45" x2="77" y2="13" stroke="#adb5bd" strokeWidth="1.8" strokeLinecap="round" opacity="0.9"/>
          {/* main blip */}
          <circle cx="74" cy="16" r="3" fill="#f8f9fa" opacity="0.85"/>
          {/* echo blip */}
          <circle cx="62" cy="28" r="2" fill="#adb5bd" opacity="0.55"/>
          {/* faint echo */}
          <circle cx="54" cy="36" r="1.2" fill="#6c757d" opacity="0.4"/>
        </svg>
        <div style={{fontSize:30,fontWeight:900,color:'#f8f9fa',letterSpacing:'0.16em',lineHeight:1}}>MIRSAD</div>
        <div style={{fontSize:11,color:'#6c757d',marginTop:7,letterSpacing:'0.05em'}}>مِرصاد · Cybersecurity GRC</div>
        <div style={{marginTop:28}}><Spinner/></div>
      </div>
    </div>
  )

  const B = `1px solid ${T.border}`

  return (
    <div style={{display:'flex',height:'100vh',background:T.bg,color:T.white,fontFamily:'Inter,IBM Plex Sans,Segoe UI,sans-serif',overflow:'hidden'}}>

      {/* SIDEBAR */}
      <div style={{width:sidebar?208:52,background:T.bg2,borderRight:B,display:'flex',flexDirection:'column',transition:'width 0.22s ease',flexShrink:0,overflow:'hidden'}}>
        <div style={{padding:'15px 11px 12px',borderBottom:B,display:'flex',alignItems:'center',gap:9}}>
          <svg viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:30,height:30,flexShrink:0}}><circle cx="15" cy="15" r="12" stroke="#495057" strokeWidth="1" strokeDasharray="3 2"/><circle cx="15" cy="15" r="7.5" stroke="#6c757d" strokeWidth="1"/><circle cx="15" cy="15" r="3.5" stroke="#adb5bd" strokeWidth="1"/><circle cx="15" cy="15" r="1.3" fill="#f8f9fa"/><line x1="15" y1="3" x2="15" y2="7.5" stroke="#495057" strokeWidth="1" strokeLinecap="round"/><line x1="15" y1="22.5" x2="15" y2="27" stroke="#495057" strokeWidth="1" strokeLinecap="round"/><line x1="3" y1="15" x2="7.5" y2="15" stroke="#495057" strokeWidth="1" strokeLinecap="round"/><line x1="22.5" y1="15" x2="27" y2="15" stroke="#495057" strokeWidth="1" strokeLinecap="round"/><line x1="15" y1="15" x2="25" y2="5" stroke="#adb5bd" strokeWidth="1.2" strokeLinecap="round" opacity="0.9"/><circle cx="22.2" cy="7.8" r="1" fill="#f8f9fa" opacity="0.8"/></svg>
          <div style={{opacity:sidebar?1:0,transition:'opacity 0.15s',overflow:'hidden',whiteSpace:'nowrap'}}>
            <div style={{fontSize:14,fontWeight:900,color:'#f8f9fa',letterSpacing:'0.1em'}}>MIRSAD</div>
            <div style={{fontSize:8,color:T.whiteDim,letterSpacing:'0.05em'}}>مِرصاد - GRC Platform</div>
          </div>
        </div>
        <nav style={{flex:1,padding:'8px 5px',display:'flex',flexDirection:'column',gap:1,overflow:'auto'}}>
          {NAVS.map(n=>(
            <div key={n.id} onClick={()=>{setTab(n.id);if(n.id!=='ai')setAiPrompt(undefined)}}
              style={{display:'flex',alignItems:'center',gap:8,padding:'7px 7px',borderRadius:6,cursor:'pointer',background:tab===n.id?T.blue+'18':'transparent',border:`1px solid ${tab===n.id?T.blueL+'33':'transparent'}`,color:tab===n.id?T.blueBright:T.whiteM,fontSize:12,fontWeight:tab===n.id?600:400,whiteSpace:'nowrap',transition:'all 0.12s'}}>
              <div style={{width:24,height:24,borderRadius:5,background:tab===n.id?T.blue+'22':T.border,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:800,color:tab===n.id?T.blueL:T.whiteDim,flexShrink:0}}>{n.tag}</div>
              <span style={{opacity:sidebar?1:0,transition:'opacity 0.1s'}}>{n.label}</span>
            </div>
          ))}
        </nav>
        <div style={{padding:'8px 5px',borderTop:B}}>
          <div onClick={()=>setTab('profile')} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 7px',borderRadius:6,cursor:'pointer',background:tab==='profile'?T.blue+'14':'transparent',marginBottom:4}}>
            <div style={{width:26,height:26,borderRadius:'50%',background:'#343a40',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:800,color:T.white,flexShrink:0}}>{profile?.full_name?.[0]||'A'}</div>
            <div style={{opacity:sidebar?1:0,transition:'opacity 0.15s',overflow:'hidden',whiteSpace:'nowrap'}}>
              <div style={{fontSize:10,fontWeight:600,color:T.white}}>{profile?.full_name||'...'}</div>
              <div style={{fontSize:8,color:T.whiteDim}}>{ROLE_LABELS[profile?.role]||profile?.role}</div>
            </div>
          </div>
          {sidebar&&(guest?(
            <div style={{display:'flex',gap:4,padding:'0 2px'}}>
              <a href="/login" style={{flex:1,textAlign:'center',background:T.blue+'14',border:`1px solid ${T.blueL}44`,color:T.blueL,padding:'4px',borderRadius:5,cursor:'pointer',fontSize:9,fontFamily:'inherit',textDecoration:'none'}}>Sign In</a>
              <button onClick={()=>{resetDemo();setRisks(demoList('risks',seedRisks));setFindings(demoList('findings',seedFindings));notify('Demo workspace reset')}} style={{flex:1,background:'none',border:B,color:T.whiteM,padding:'4px',borderRadius:5,cursor:'pointer',fontSize:9,fontFamily:'inherit'}}>Reset Demo</button>
            </div>
          ):(
            <div style={{display:'flex',gap:4,padding:'0 2px'}}>
              <button onClick={()=>setTab('team')} style={{flex:1,background:'none',border:B,color:T.whiteM,padding:'4px',borderRadius:5,cursor:'pointer',fontSize:9,fontFamily:'inherit'}}>Team</button>
              <button onClick={signOut} style={{flex:1,background:'none',border:B,color:T.whiteM,padding:'4px',borderRadius:5,cursor:'pointer',fontSize:9,fontFamily:'inherit'}}>Sign Out</button>
            </div>
          ))}
        </div>
      </div>

      {/* MAIN */}
      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
        {/* TOPBAR */}
        <div style={{padding:'10px 18px',background:T.bg2,borderBottom:B,display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <button onClick={()=>setSidebar(s=>!s)} style={{background:'none',border:'none',color:T.whiteM,cursor:'pointer',fontSize:14,padding:'3px 5px',lineHeight:1,borderRadius:4}}>|||</button>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:T.white}}>{PAGE[tab]||tab}</div>
              <div style={{fontSize:9,color:T.whiteDim}}>{clock.toLocaleDateString('en-SA',{weekday:'short',month:'short',day:'numeric',year:'numeric'})} · {clock.toLocaleTimeString('en-SA')}</div>
            </div>
          </div>
          <div style={{display:'flex',gap:6,alignItems:'center'}}>
            {guest&&<span style={{background:'#343a40',border:`1px solid ${T.border2}`,color:T.accentL,padding:'3px 10px',borderRadius:999,fontSize:10,fontWeight:700,letterSpacing:'0.04em'}}>DEMO MODE · changes saved in this browser only</span>}
            {['NCA ECC','NCA DCC','SAMA CSF'].map(fw=><Pill key={fw} label={fw} color={T.whiteDim}/>)}
            <button onClick={async()=>{
              if(guest){ setRisks(demoList('risks',seedRisks)); setFindings(demoList('findings',seedFindings)); notify('Demo data refreshed'); return }
              const [{data:r},{data:f}]=await Promise.all([supabase.from('risks').select('*').order('risk_score',{ascending:false}),supabase.from('findings').select('*').order('created_at',{ascending:false})])
              setRisks(r||[]); setFindings(f||[]); notify('Data refreshed')
            }} style={{background:T.blue+'14',border:`1px solid ${T.blueL}44`,color:T.blueL,padding:'5px 12px',borderRadius:6,cursor:'pointer',fontSize:11,fontWeight:600,fontFamily:'inherit'}}>Refresh</button>
          </div>
        </div>

        {/* CONTENT */}
        <div style={{flex:1,overflow:'auto',padding:'16px 18px'}}>

          {/* DASHBOARD */}
          {tab==='dashboard'&&(
            <div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:11,marginBottom:14}}>
                {[
                  {label:'Overall Compliance',val:overall?overall+'%':'No data',sub:activeFwScores.length?activeFwScores.length+' frameworks active':'Add risks & findings',color:T.blueL},
                  {label:'Open Risks',val:openRisks,sub:risks.filter(r=>r.status==='In Progress').length+' in progress',color:'#adb5bd'},
                  {label:'Critical Findings',val:critFindings,sub:highFindings+' high severity',color:T.danger},
                  {label:'Integrations',val:connectedInts+'/'+INTEGRATIONS.length,sub:'connected',color:'#adb5bd'},
                ].map((k,i)=>(
                  <div key={i} style={{...CS,borderLeft:`3px solid ${k.color}`}}>
                    <div style={{fontSize:9,color:T.whiteM,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:7,fontWeight:600}}>{k.label}</div>
                    <div style={{fontSize:32,fontWeight:900,color:k.color,lineHeight:1}}>{k.val}</div>
                    <div style={{fontSize:10,color:T.whiteDim,marginTop:5}}>{k.sub}</div>
                  </div>
                ))}
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1.5fr 1fr',gap:11,marginBottom:11}}>
                <div style={{...CS}}>
                  <div style={{fontSize:10,color:T.whiteM,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:13,fontWeight:600}}>Framework Compliance</div>
                  {fwScores.map(({id,score,color})=>(
                    <div key={id} style={{marginBottom:12,cursor:'pointer'}} onClick={()=>{setFwActive(id);setTab('frameworks')}}>
                      <div style={{display:'flex',justifyContent:'space-between',marginBottom:4,alignItems:'center'}}>
                        <div style={{display:'flex',alignItems:'center',gap:7}}>
                          <span style={{width:8,height:8,background:color,borderRadius:2,display:'inline-block',flexShrink:0}}/>
                          <span style={{fontSize:12,color:T.white,fontWeight:500}}>{id.replace('_',' ')}</span>
                          <Pill label={['NCA_ECC','NCA_DCC','SAMA_CSF'].includes(id)?'SA':'INTL'} color={T.whiteDim}/>
                        </div>
                        <span style={{fontSize:13,fontWeight:800,color}}>{score}%</span>
                      </div>
                      <Bar pct={score} color={color}/>
                    </div>
                  ))}
                </div>
                <div style={{...CS}}>
                  <div style={{fontSize:10,color:T.whiteM,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:12,fontWeight:600}}>Risk Heatmap</div>
                  <div style={{display:'grid',gridTemplateColumns:'18px repeat(5,1fr)',gap:3}}>
                    <div/>{['I1','I2','I3','I4','I5'].map(l=><div key={l} style={{fontSize:8,color:T.whiteDim,textAlign:'center',paddingBottom:2,fontWeight:600}}>{l}</div>)}
                    {[5,4,3,2,1].map(l=>[
                      <div key={'lbl'+l} style={{fontSize:8,color:T.whiteDim,display:'flex',alignItems:'center',justifyContent:'flex-end',paddingRight:3,fontWeight:600}}>L{l}</div>,
                      ...[1,2,3,4,5].map(imp=>{
                        const sc=l*imp; const [,col]=riskLevel(sc); const rs=risks.filter(r=>r.likelihood===l&&r.impact===imp)
                        return <div key={l+'-'+imp} onClick={()=>rs.length&&setTab('risks')}
                          style={{height:28,background:col+(rs.length?'33':'11'),borderRadius:4,display:'flex',alignItems:'center',justifyContent:'center',border:`1px solid ${rs.length?col+'55':'transparent'}`,fontSize:10,fontWeight:800,color:rs.length?col:'transparent',cursor:rs.length?'pointer':'default'}}>{rs.length||''}</div>
                      })
                    ])}
                  </div>
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1.5fr 1fr',gap:11}}>
                <div style={{...CS}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                    <div style={{fontSize:10,color:T.whiteM,textTransform:'uppercase',letterSpacing:'0.08em',fontWeight:600}}>Recent Findings</div>
                    <button onClick={()=>setTab('findings')} style={{background:'none',border:'none',color:T.blueL,cursor:'pointer',fontSize:11,fontFamily:'inherit'}}>View all</button>
                  </div>
                  {findings.slice(0,5).map(f=>(
                    <div key={f.id} style={{display:'flex',alignItems:'center',gap:10,padding:'7px 0',borderBottom:`1px solid ${T.border}22`}}>
                      <span style={{fontFamily:'monospace',fontSize:10,color:T.whiteDim,minWidth:60}}>{f.finding_ref}</span>
                      <span style={{flex:1,fontSize:12,color:T.white,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.title}</span>
                      <Pill label={f.severity} color={sevColor(f.severity)}/>
                    </div>
                  ))}
                  {findings.length===0&&<div style={{textAlign:'center',padding:'20px 0',color:T.whiteDim,fontSize:12}}>No findings yet. <button onClick={()=>setShowFindingForm(true)} style={{background:'none',border:'none',color:T.blueL,cursor:'pointer',fontFamily:'inherit',fontSize:12}}>Add one</button></div>}
                </div>
                <div style={{...CS,background:'#1a1d20',border:`1px solid ${T.blueL}22`}}>
                  <div style={{fontSize:10,color:T.blueL,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:9,fontWeight:600}}>AI Quick Actions</div>
                  {[
                    {label:'Generate Security Policy',prompt:'Generate a complete Information Security Policy aligned with NCA ECC v2.0 for a Saudi financial institution.'},
                    {label:'SAMA CSF Gap Analysis',prompt:'Provide a detailed gap analysis for SAMA CSF domain CS-3 (Operations & Technology) with prioritized remediation steps.'},
                    {label:'NCA DCC Data Classification',prompt:'Create a data classification standard aligned with NCA DCC v1.0 including classification tiers and handling requirements.'},
                  ].map((q,i)=>(
                    <button key={i} onClick={()=>navTo('ai',q.prompt)}
                      style={{width:'100%',textAlign:'left',background:T.blue+'0D',border:`1px solid ${T.blueL}22`,borderRadius:7,padding:'9px 11px',color:T.blueBright,cursor:'pointer',fontSize:11,fontWeight:500,marginBottom:6,fontFamily:'inherit',display:'flex',justifyContent:'space-between',alignItems:'center',transition:'all 0.15s'}}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor=T.blueL+'55';e.currentTarget.style.background=T.blue+'18'}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor=T.blueL+'22';e.currentTarget.style.background=T.blue+'0D'}}>
                      {q.label} <span style={{color:T.blueL,fontWeight:700}}>-&gt;</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* FRAMEWORKS */}
          {tab==='frameworks'&&(
            <div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10,marginBottom:13}}>
                {Object.entries(FW).map(([id,fw])=>{
                  const score=fwScore(id,findings,risks); const isActive=fwActive===id
                  return (
                    <div key={id} onClick={()=>setFwActive(isActive?null:id)}
                      style={{...CS,cursor:'pointer',border:`1px solid ${isActive?fw.color+'77':T.border}`,background:isActive?fw.color+'08':T.card,transition:'all 0.15s'}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:9}}>
                        <div><Pill label={id.replace('_',' ')} color={fw.color} sm={false}/><div style={{fontSize:9,color:T.whiteDim,marginTop:4}}>{['NCA_ECC','NCA_DCC','SAMA_CSF'].includes(id)?'Saudi':'International'}</div></div>
                        <Ring pct={score} color={fw.color} size={46}/>
                      </div>
                      <div style={{fontSize:8,color:T.whiteDim,lineHeight:1.5}}>{fw.ratingScale.join(' > ')}</div>
                    </div>
                  )
                })}
              </div>
              {fwActive&&(()=>{
                const fw=FW[fwActive]; const domains=COMPLIANCE[fwActive]?.domains||[]
                return (
                  <div style={{...CS,border:`1px solid ${fw.color}44`}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:13}}>
                      <div><div style={{fontSize:15,fontWeight:800,color:fw.color}}>{fwActive.replace('_',' ')}</div><div style={{fontSize:10,color:T.whiteDim,marginTop:2}}>{fw.ratingScale.join(' > ')}</div></div>
                      <div style={{display:'flex',gap:7}}>
                        <button onClick={()=>navTo('ai','Provide a detailed compliance assessment for '+fwActive.replace('_',' ')+' with domain-by-domain gap analysis and prioritized remediation roadmap.')}
                          style={{background:fw.color+'14',border:`1px solid ${fw.color}44`,color:fw.color,padding:'6px 13px',borderRadius:6,cursor:'pointer',fontSize:11,fontWeight:600,fontFamily:'inherit'}}>AI Assessment</button>
                        <button onClick={async()=>{await exportRisksXLSX(risks.filter(r=>r.framework_id===fwActive));notify('Exported')}}
                          style={{background:fw.color+'14',border:`1px solid ${fw.color}44`,color:fw.color,padding:'6px 13px',borderRadius:6,cursor:'pointer',fontSize:11,fontWeight:600,fontFamily:'inherit'}}>Export XLSX</button>
                      </div>
                    </div>
                    <table style={{width:'100%',borderCollapse:'collapse'}}>
                      <thead><tr>{['Domain','Controls','Score','Status','AI Gap'].map(h=><th key={h} style={{padding:'8px 11px',textAlign:'left',fontSize:9,fontWeight:700,color:T.whiteM,letterSpacing:'0.07em',textTransform:'uppercase',borderBottom:B}}>{h}</th>)}</tr></thead>
                      <tbody>{domains.map(d=>(
                        <tr key={d.id} style={{borderBottom:`1px solid ${T.border}22`}}>
                          <td style={{padding:'10px 11px'}}><span style={{fontFamily:'monospace',color:T.whiteDim,fontSize:10,marginRight:8}}>{d.id}</span><span style={{fontSize:12,color:T.white}}>{d.name}</span></td>
                          <td style={{padding:'10px 11px',textAlign:'center',fontSize:12,color:T.whiteM}}>{d.controls}</td>
                          <td style={{padding:'10px 11px',minWidth:130}}>
                            <div style={{display:'flex',alignItems:'center',gap:7}}><div style={{flex:1}}><Bar pct={d.pct} color={fw.color}/></div><span style={{fontSize:11,fontWeight:800,color:fw.color,minWidth:32}}>{d.pct}%</span></div>
                          </td>
                          <td style={{padding:'10px 11px'}}><Pill label={d.pct>=80?'Good':d.pct>=60?'Partial':'Gap'} color={d.pct>=80?'#adb5bd':d.pct>=60?'#6c757d':T.danger}/></td>
                          <td style={{padding:'10px 11px'}}><button onClick={()=>navTo('ai','For '+fwActive.replace('_',' ')+' domain '+d.id+' ('+d.name+'): control-by-control gap analysis and remediation steps.')}
                            style={{background:'none',border:B,color:T.whiteM,padding:'3px 9px',borderRadius:4,cursor:'pointer',fontSize:10,fontFamily:'inherit'}}>AI Gap</button></td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                )
              })()}
            </div>
          )}

          {/* RISKS */}
          {tab==='risks'&&(
            <div>
              {showRiskForm&&<RiskForm onClose={()=>setShowRiskForm(false)} onSave={r=>{setRisks(rs=>[r,...rs]);notify('Risk '+(r.risk_ref||'')+' created')}} notify={notify}/>}
              <div style={{display:'flex',gap:6,marginBottom:11,flexWrap:'wrap',alignItems:'center'}}>
                <div style={{display:'flex',gap:4}}>{['All','Critical','High','Medium','Low'].map(l=><button key={l} onClick={()=>setRiskFilter(l)} style={{padding:'5px 12px',borderRadius:5,border:`1px solid ${riskFilter===l?T.blueL+'55':T.border}`,background:riskFilter===l?T.blue+'14':'transparent',color:riskFilter===l?T.blueBright:T.whiteM,cursor:'pointer',fontSize:11,fontWeight:600,fontFamily:'inherit'}}>{l}</button>)}</div>
                <div style={{marginLeft:'auto',display:'flex',gap:5}}>
                  <button onClick={()=>exportRisksXLSX(risks)} style={{padding:'5px 12px',borderRadius:5,border:B,background:'transparent',color:T.whiteM,cursor:'pointer',fontSize:11,fontFamily:'inherit'}}>XLSX</button>
                  <button onClick={()=>exportRisksPDF(risks,org?.name||'Organization')} style={{padding:'5px 12px',borderRadius:5,border:B,background:'transparent',color:T.whiteM,cursor:'pointer',fontSize:11,fontFamily:'inherit'}}>PDF</button>
                  <button onClick={()=>setShowRiskForm(true)} style={{padding:'5px 15px',borderRadius:5,background:'#343a40',border:'1px solid #495057',color:T.white,cursor:'pointer',fontSize:11,fontWeight:700,fontFamily:'inherit',boxShadow:'none'}}>+ Add Risk</button>
                </div>
              </div>
              <div style={{...CS,padding:0,overflow:'hidden'}}>
                <table style={{width:'100%',borderCollapse:'collapse'}}>
                  <thead><tr style={{background:T.bg2}}>{['ID','Title','Framework','L','I','Score','Level','Treatment','Status','Owner','Sync'].map(h=><th key={h} style={{padding:'9px 10px',textAlign:'left',fontSize:9,fontWeight:700,color:T.whiteM,letterSpacing:'0.07em',textTransform:'uppercase',borderBottom:B}}>{h}</th>)}</tr></thead>
                  <tbody>
                    {filteredRisks.map(r=>{
                      const sc=r.risk_score||(r.likelihood*r.impact); const [lvl,col]=riskLevel(sc)
                      return (
                        <tr key={r.id} style={{borderBottom:`1px solid ${T.border}22`}}
                          onMouseEnter={e=>e.currentTarget.style.background=T.blue+'08'}
                          onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                          <td style={{padding:'10px 10px',fontFamily:'monospace',fontSize:10,color:T.whiteDim}}>{r.risk_ref}</td>
                          <td style={{padding:'10px 10px',fontSize:12,color:T.white,maxWidth:180}}>{r.title}</td>
                          <td style={{padding:'10px 10px'}}>{r.framework_id&&<Pill label={r.framework_id.replace('_',' ')} color={FW[r.framework_id]?.color||T.whiteM}/>}</td>
                          <td style={{padding:'10px 10px',textAlign:'center',color:T.whiteM,fontSize:12}}>{r.likelihood}</td>
                          <td style={{padding:'10px 10px',textAlign:'center',color:T.whiteM,fontSize:12}}>{r.impact}</td>
                          <td style={{padding:'10px 10px',textAlign:'center'}}><span style={{fontSize:18,fontWeight:900,color:col}}>{sc}</span></td>
                          <td style={{padding:'10px 10px'}}><Pill label={lvl} color={col}/></td>
                          <td style={{padding:'10px 10px',fontSize:11,color:T.whiteM}}>{r.treatment}</td>
                          <td style={{padding:'10px 10px'}}><Pill label={r.status} color={r.status==='Open'?T.danger:r.status==='Mitigated'?'#adb5bd':'#6c757d'}/></td>
                          <td style={{padding:'10px 10px',fontSize:11,color:T.whiteM}}>{r.owner_name||'-'}</td>
                          <td style={{padding:'10px 10px'}}>
                            <div style={{display:'flex',gap:3}}>
                              <button onClick={()=>syncItem('servicenow',r.id,'risk')} disabled={syncingItem===r.id} style={{background:'none',border:B,color:T.whiteM,padding:'2px 7px',borderRadius:3,cursor:'pointer',fontSize:9,fontFamily:'inherit'}}>{syncingItem===r.id?'...':'SN'}</button>
                              <button onClick={()=>syncItem('jira',r.id,'risk')} disabled={syncingItem===r.id} style={{background:'none',border:B,color:T.whiteM,padding:'2px 7px',borderRadius:3,cursor:'pointer',fontSize:9,fontFamily:'inherit'}}>JR</button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {filteredRisks.length===0&&<div style={{textAlign:'center',padding:'30px',color:T.whiteDim,fontSize:12}}>No risks yet. <button onClick={()=>setShowRiskForm(true)} style={{background:'none',border:'none',color:T.blueL,cursor:'pointer',fontFamily:'inherit',fontSize:12}}>Add first risk</button></div>}
              </div>
            </div>
          )}

          {/* FINDINGS */}
          {tab==='findings'&&(
            <div>
              {showFindingForm&&<FindingForm onClose={()=>setShowFindingForm(false)} onSave={f=>{setFindings(fs=>[f,...fs]);notify('Finding '+(f.finding_ref||'')+' created')}} notify={notify}/>}
              {evidenceFinding&&<EvidenceModal finding={evidenceFinding} onClose={()=>setEvidenceFinding(null)} onSave={saveEvidence} notify={notify}/>}
              <div style={{display:'flex',gap:6,marginBottom:11,flexWrap:'wrap',alignItems:'center'}}>
                <div style={{display:'flex',gap:4}}>{['All','Critical','High','Medium','Low'].map(s=><button key={s} onClick={()=>setSevFilter(s)} style={{padding:'5px 12px',borderRadius:5,border:`1px solid ${sevFilter===s?sevColor(s)+'55':T.border}`,background:sevFilter===s?sevColor(s)+'14':'transparent',color:sevFilter===s?sevColor(s):T.whiteM,cursor:'pointer',fontSize:11,fontWeight:600,fontFamily:'inherit'}}>{s}</button>)}</div>
                <div style={{marginLeft:'auto',display:'flex',gap:5}}>
                  <button onClick={()=>exportFindingsXLSX(findings)} style={{padding:'5px 12px',borderRadius:5,border:B,background:'transparent',color:T.whiteM,cursor:'pointer',fontSize:11,fontFamily:'inherit'}}>XLSX</button>
                  <button onClick={()=>exportFindingsPDF(findings,org?.name||'Organization')} style={{padding:'5px 12px',borderRadius:5,border:B,background:'transparent',color:T.whiteM,cursor:'pointer',fontSize:11,fontFamily:'inherit'}}>PDF</button>
                  <button onClick={()=>setShowFindingForm(true)} style={{padding:'5px 15px',borderRadius:5,background:'#343a40',border:'1px solid #495057',color:T.white,cursor:'pointer',fontSize:11,fontWeight:700,fontFamily:'inherit',boxShadow:'none'}}>+ New Finding</button>
                </div>
              </div>
              <div style={{...CS,padding:0,overflow:'hidden'}}>
                <table style={{width:'100%',borderCollapse:'collapse'}}>
                  <thead><tr style={{background:T.bg2}}>{['ID','Title','Severity','Framework','Domain','AI Rating','Status','Assignee','Actions'].map(h=><th key={h} style={{padding:'9px 10px',textAlign:'left',fontSize:9,fontWeight:700,color:T.whiteM,letterSpacing:'0.07em',textTransform:'uppercase',borderBottom:B}}>{h}</th>)}</tr></thead>
                  <tbody>
                    {filteredFindings.map(f=>(
                      <tr key={f.id} style={{borderBottom:`1px solid ${T.border}22`}}
                        onMouseEnter={e=>e.currentTarget.style.background=T.blue+'08'}
                        onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                        <td style={{padding:'10px 10px',fontFamily:'monospace',fontSize:10,color:T.whiteDim}}>{f.finding_ref}</td>
                        <td style={{padding:'10px 10px',fontSize:12,color:T.white,maxWidth:190}}>{f.title}</td>
                        <td style={{padding:'10px 10px'}}><Pill label={f.severity} color={sevColor(f.severity)}/></td>
                        <td style={{padding:'10px 10px'}}>{f.framework_id&&<Pill label={f.framework_id.replace('_',' ')} color={FW[f.framework_id]?.color||T.whiteM}/>}</td>
                        <td style={{padding:'10px 10px',fontFamily:'monospace',fontSize:10,color:T.whiteDim}}>{f.domain_ref||'-'}</td>
                        <td style={{padding:'10px 10px'}}>
                          {f.ai_rating?<div style={{display:'flex',alignItems:'center',gap:4}}><Pill label={f.ai_rating} color={FW[f.framework_id||'NCA_ECC']?.color||T.whiteM}/>{f.ai_confidence&&<span style={{fontSize:9,color:T.whiteDim}}>{f.ai_confidence}%</span>}</div>:<span style={{fontSize:10,color:T.whiteDim}}>-</span>}
                        </td>
                        <td style={{padding:'10px 10px'}}><Pill label={f.status} color={f.status==='Open'?T.danger:f.status==='Resolved'?'#adb5bd':'#6c757d'}/></td>
                        <td style={{padding:'10px 10px',fontSize:11,color:T.whiteM}}>{f.assignee_name||'-'}</td>
                        <td style={{padding:'10px 10px'}}>
                          <div style={{display:'flex',gap:4}}>
                            <button onClick={()=>setEvidenceFinding(f)} style={{background:T.blueL+'14',border:`1px solid ${T.blueL}44`,color:T.blueBright,padding:'2px 8px',borderRadius:4,cursor:'pointer',fontSize:9,fontWeight:700,fontFamily:'inherit'}}>AI</button>
                            <button onClick={()=>syncItem('jira',f.id,'finding')} disabled={syncingItem===f.id} style={{background:'none',border:B,color:T.whiteM,padding:'2px 7px',borderRadius:4,cursor:'pointer',fontSize:9,fontFamily:'inherit'}}>JR</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredFindings.length===0&&<div style={{textAlign:'center',padding:'30px',color:T.whiteDim,fontSize:12}}>No findings yet. <button onClick={()=>setShowFindingForm(true)} style={{background:'none',border:'none',color:T.blueL,cursor:'pointer',fontFamily:'inherit',fontSize:12}}>Add first finding</button></div>}
              </div>
            </div>
          )}

          {tab==='docgen'&&<DocGenerator notify={notify} savedDocs={savedDocs} setSavedDocs={setSavedDocs} orgName={org?.name} authFetch={authFetch}/>}

          {tab==='ai'&&<div style={{...CS,height:'calc(100vh - 168px)'}}><AIChatPanel initialPrompt={aiPrompt}/></div>}

          {/* INTEGRATIONS */}
          {tab==='integrations'&&(
            <div>
              <div style={{background:'#1a1d20',border:`1px solid ${T.blueL}22`,borderRadius:9,padding:'11px 15px',marginBottom:13,fontSize:12,color:T.whiteM}}>
                <span style={{color:T.blueL,fontWeight:600}}>Mock Mode Active</span> - Syncs use realistic mock responses. Add credentials to .env.local to connect live instances.
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:11}}>
                {INTEGRATIONS.map(int=>{
                  const cfg=integrations[int.id]; const active=cfg?.is_active||false
                  return (
                    <div key={int.id} style={{...CS}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:11}}>
                        <div style={{display:'flex',gap:9,alignItems:'center'}}>
                          <div style={{width:38,height:38,background:int.color+'18',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,color:int.color,border:`1px solid ${int.color}33`}}>{int.tag}</div>
                          <div><div style={{fontSize:13,fontWeight:700,color:T.white}}>{int.name}</div><div style={{fontSize:10,color:T.whiteM}}>{int.desc}</div></div>
                        </div>
                        <div style={{display:'flex',alignItems:'center',gap:4}}><div style={{width:6,height:6,borderRadius:'50%',background:active?'#adb5bd':'#6c757d'}}/><span style={{fontSize:9,color:T.whiteDim}}>{active?'Live':'Mock'}</span></div>
                      </div>
                      <div style={{display:'flex',justifyContent:'space-between',marginBottom:11}}>
                        <div><div style={{fontSize:20,fontWeight:900,color:int.color}}>{cfg?.sync_count||0}</div><div style={{fontSize:9,color:T.whiteDim}}>syncs</div></div>
                        <div style={{textAlign:'right'}}><div style={{fontSize:9,color:T.whiteDim}}>Last sync</div><div style={{fontSize:10,color:T.whiteM,fontFamily:'monospace'}}>{cfg?.last_sync_at?new Date(cfg.last_sync_at).toLocaleTimeString('en-SA'):'-'}</div></div>
                      </div>
                      <button onClick={()=>notify('Add '+int.id.toUpperCase()+'_BASE_URL to .env.local to connect live instance.')}
                        style={{width:'100%',padding:'7px',background:int.color+'14',border:`1px solid ${int.color}33`,color:int.color,borderRadius:6,cursor:'pointer',fontSize:11,fontWeight:600,fontFamily:'inherit'}}>Configure</button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* REPORTS */}
          {tab==='reports'&&(
            <div>
              <div style={{display:'flex',gap:7,marginBottom:13,flexWrap:'wrap'}}>
                <button onClick={()=>navTo('ai','Generate a comprehensive executive cybersecurity compliance report covering NCA ECC, NCA DCC, SAMA CSF, ISO 27001, and NIST CSF 2.0 with strategic remediation roadmap.')}
                  style={{padding:'8px 16px',background:'#343a40',border:'1px solid #495057',color:T.white,borderRadius:7,cursor:'pointer',fontSize:12,fontWeight:700,fontFamily:'inherit',boxShadow:'0 2px 10px #2563EB33'}}>AI Executive Report</button>
                {[['Risks XLSX',()=>exportRisksXLSX(risks)],['Findings XLSX',()=>exportFindingsXLSX(findings)],['Risks PDF',()=>exportRisksPDF(risks,org?.name||'')],['Findings PDF',()=>exportFindingsPDF(findings,org?.name||'')]].map(([l,fn])=>(
                  <button key={l} onClick={fn} style={{padding:'8px 14px',background:'transparent',border:B,color:T.whiteM,borderRadius:7,cursor:'pointer',fontSize:11,fontFamily:'inherit'}}>{l}</button>
                ))}
              </div>
              <div style={{...CS}}>
                <div style={{fontSize:10,color:T.whiteM,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:13,fontWeight:600}}>Saved AI Documents</div>
                {savedDocs.length===0?(
                  <div style={{textAlign:'center',padding:'26px',color:T.whiteDim,fontSize:12}}>No documents yet. <button onClick={()=>setTab('docgen')} style={{background:'none',border:'none',color:T.blueL,cursor:'pointer',fontFamily:'inherit',fontSize:12}}>Generate one</button></div>
                ):(
                  <table style={{width:'100%',borderCollapse:'collapse'}}>
                    <thead><tr>{['Title','Type','Framework','Version','Export'].map(h=><th key={h} style={{padding:'8px 10px',textAlign:'left',fontSize:9,fontWeight:700,color:T.whiteM,letterSpacing:'0.07em',textTransform:'uppercase',borderBottom:B}}>{h}</th>)}</tr></thead>
                    <tbody>{savedDocs.map(d=>(
                      <tr key={d.id} style={{borderBottom:`1px solid ${T.border}22`}}>
                        <td style={{padding:'10px 10px',fontSize:12,color:T.white}}>{d.title}</td>
                        <td style={{padding:'10px 10px'}}><Pill label={d.document_type} color={T.accent}/></td>
                        <td style={{padding:'10px 10px'}}>{d.framework_id&&<Pill label={d.framework_id.replace('_',' ')} color={FW[d.framework_id]?.color||T.whiteM}/>}</td>
                        <td style={{padding:'10px 10px',fontSize:11,color:T.whiteM}}>v{d.version}</td>
                        <td style={{padding:'10px 10px'}}>
                          <div style={{display:'flex',gap:4}}>
                            <button onClick={()=>exportDocumentPDF(d,org?.name||'Organization')} style={{background:'none',border:B,color:T.whiteM,padding:'2px 8px',borderRadius:3,cursor:'pointer',fontSize:9,fontFamily:'inherit'}}>PDF</button>
                            <button onClick={()=>exportDocumentDOCX(d,org?.name||'Organization')} style={{background:'none',border:B,color:T.whiteM,padding:'2px 8px',borderRadius:3,cursor:'pointer',fontSize:9,fontFamily:'inherit'}}>DOCX</button>
                          </div>
                        </td>
                      </tr>
                    ))}</tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {tab==='controls'&&<ControlsLibrary notify={notify} navTo={navTo}/>}
          {tab==='evidence'&&<EvidenceRepository profile={profile} notify={notify} authFetch={authFetch}/>}
          {tab==='kpis'&&<KpiKriPanel profile={profile} notify={notify}/>}
          {tab==='profile'&&<ProfileSettings profile={profile} org={org} onUpdate={d=>{setProfile(d);if(d?.organization_id){supabase.from("organizations").select("*").eq("id",d.organization_id).single().then(({data:o})=>{if(o)setOrg(o)})}}} notify={notify}/>}
          {tab==='team'&&<TeamManagement currentProfile={profile} notify={notify}/>}

        </div>
      </div>

      {/* TOAST */}
      {toast&&(
        <div onClick={()=>setToast(null)} style={{position:'fixed',bottom:22,right:22,zIndex:9999,cursor:'pointer',background:toast.type==='error'?'#180508':T.bg3,border:`1px solid ${toast.type==='error'?T.danger+'55':T.blueL+'55'}`,color:toast.type==='error'?T.dangerL:T.blueBright,padding:'11px 16px',borderRadius:9,fontSize:12,fontWeight:600,boxShadow:'0 8px 32px #000000aa',display:'flex',alignItems:'center',gap:8,animation:'toastIn 0.3s ease'}}>
          {toast.type==='error'?'x':'+'} {toast.msg}
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=IBM+Plex+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:#212529}
        ::-webkit-scrollbar-thumb{background:#495057;border-radius:2px}
        select option{background:#212529;color:#adb5bd}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes toastIn{from{transform:translateY(10px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
      `}</style>
    </div>
  )
}
