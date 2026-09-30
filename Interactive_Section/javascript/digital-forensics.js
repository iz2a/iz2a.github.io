/* ==========================================================================
   Digital Forensics Simulation (2026, rebuilt)
   A DFIR case: an insider data breach at the fintech GulfPay. The analyst
   acquires four evidence sources (workstation disk image, memory dump, a
   seized Android phone, and network/badge logs), examines the artifacts,
   tags the incriminating ones to an evidence board, then names the culprit
   and method. Mobile forensics is the centerpiece: calls, messages,
   recovered deleted texts, photos with GPS EXIF, installed apps and location
   history. Everything is browser-only but modeled on real tools (Autopsy,
   Volatility, Cellebrite-style extraction).
   ========================================================================== */
(function () {
    'use strict';
    function ready(fn){ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',fn); else fn(); }
    var $=function(s,r){return (r||document).querySelector(s);};
    var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));};
    var esc=function(s){return String(s==null?'':s).replace(/[&<>]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;'}[c];});};

    /* ------------------------------------------------------------------ */
    var CASE = {
        id: 'GP-IR-2026-0417',
        title: 'Insider data breach at GulfPay',
        brief: 'Two days ago, 2.6 GB of customer financial records were uploaded to an external cloud account overnight. The SOC traced the upload to the Finance subnet but could not identify the person. Three employees had the access and opportunity. You have been handed four evidence sources. Examine them, tag what matters, and tell us who did it, how, and what they took.',
        suspects: [
            { id:'faisal', name:'Faisal Al-Otaibi', role:'Finance Analyst', note:'Access to the customer database for reporting.' },
            { id:'khalid', name:'Khalid Al-Harbi', role:'IT Administrator', note:'Domain admin. Broad access to everything.' },
            { id:'sara', name:'Sara Al-Dosari', role:'HR Specialist', note:'No access to financial systems.' }
        ],
        culprit: 'faisal',
        methods: [
            { id:'exfil-cloud', text:'Copied the customer export to a personal cloud account (MEGA) and sold it to an outside broker' },
            { id:'ransomware', text:'Deployed ransomware that encrypted the file server' },
            { id:'phishing', text:'Fell for a phishing email that let an external attacker in' },
            { id:'misconfig', text:'A public cloud bucket accidentally exposed the data' }
        ],
        correctMethod: 'exfil-cloud'
    };

    /* Evidence sources and their artifacts. incriminating:true artifacts point
       at the real culprit; some decoys point elsewhere or are noise. */
    var EVIDENCE = [
        {
            id:'disk', type:'Disk image', icon:'fa-hard-drive',
            name:'FIN-WS03 workstation', device:"Faisal Al-Otaibi's workstation",
            size:'512 GB', hash:'sha256: 9f2c1a...e7b4', tool:'Autopsy 4.21',
            groups:[
                { label:'File system', items:[
                    { id:'d1', title:'customers_export.csv (deleted)', time:'2026-04-15 21:06', detail:'A 2.6 GB CSV recovered from unallocated space. Header row lists full names, IBANs, card PANs and balances for 48,000 customers. Deleted at 21:41 the same night.', incriminating:true },
                    { id:'d2', title:'fin.7z in C:\\Users\\faisal\\AppData\\Local\\Temp', time:'2026-04-15 21:12', detail:'A password-protected 7-Zip archive the same size as the CSV. Created minutes after the export.', incriminating:true },
                    { id:'d3', title:'Quarterly_Report_Q1.xlsx', time:'2026-04-14 10:30', detail:'A normal finance workbook, last opened the day before. Nothing unusual.', incriminating:false }
                ]},
                { label:'USB / device history', items:[
                    { id:'d4', title:'USB mass storage connected', time:'2026-04-15 21:14', detail:'A SanDisk 64 GB stick (serial 4C531...) mounted at 21:14 and removed at 21:33. Not a company-issued device.', incriminating:true }
                ]},
                { label:'Browser history', items:[
                    { id:'d5', title:'Search: "sell customer data anonymously"', time:'2026-04-13 23:10', detail:'Private-window search two days before the breach, followed by visits to several data-broker forums.', incriminating:true },
                    { id:'d6', title:'Login to mega.nz', time:'2026-04-15 21:28', detail:'Signed in to a personal MEGA cloud account from the workstation.', incriminating:true },
                    { id:'d7', title:'Company webmail', time:'2026-04-15 09:02', detail:'Routine morning webmail session. Normal.', incriminating:false }
                ]}
            ]
        },
        {
            id:'memory', type:'Memory dump', icon:'fa-memory',
            name:'FIN-WS03 RAM capture', device:'8 GB live memory image',
            size:'8 GB', hash:'sha256: 3ab90c...11df', tool:'Volatility 3',
            groups:[
                { label:'Processes at capture', items:[
                    { id:'m1', title:'rclone.exe running', time:'2026-04-15 21:29', detail:'A command-line cloud-sync tool was running with arguments pointing at a MEGA remote and the fin.7z archive. rclone is not installed on any managed workstation.', incriminating:true },
                    { id:'m2', title:'7zG.exe (7-Zip)', time:'2026-04-15 21:12', detail:'The 7-Zip GUI process, consistent with creating the archive.', incriminating:true },
                    { id:'m3', title:'chrome.exe', time:'2026-04-15 21:28', detail:'Browser process. Expected on any workstation.', incriminating:false }
                ]},
                { label:'Network connections', items:[
                    { id:'m4', title:'Outbound TLS to gfs302.mega.nz', time:'2026-04-15 21:30', detail:'An established connection to MEGA storage carrying a large sustained upload from the workstation.', incriminating:true }
                ]}
            ]
        },
        {
            id:'mobile', type:'Mobile device', icon:'fa-mobile-screen',
            name:"Faisal's Android phone", device:'Samsung Galaxy S23 (seized at desk)',
            size:'256 GB', hash:'sha256: c71e40...9a2b', tool:'Cellebrite-style logical + file-system extraction',
            phone:true,
            groups:[
                { label:'Call log', icon:'fa-phone', items:[
                    { id:'p1', title:'3 outgoing calls to +971 50 xxx (unsaved)', time:'2026-04-14 to 04-15', detail:'Three short calls to the same UAE mobile the day before and the night of the breach. The number is not in contacts. It later resolves to a known data broker alias "M.".', incriminating:true },
                    { id:'p2', title:'Call to Mom', time:'2026-04-15 19:40', detail:'Routine personal call. Not relevant.', incriminating:false }
                ]},
                { label:'Messages (Signal)', icon:'fa-comment', items:[
                    { id:'p3', title:'"Files ready. Same price as agreed?"', time:'2026-04-15 21:35', detail:'Sent to the +971 number minutes after the upload finished.', incriminating:true },
                    { id:'p4', title:'"Send the payment to the usual wallet."', time:'2026-04-15 22:02', detail:'Follow-up message negotiating cryptocurrency payment.', incriminating:true }
                ]},
                { label:'Recovered deleted messages', icon:'fa-trash-arrow-up', items:[
                    { id:'p5', title:'RECOVERED: "I\'ll pull the full CSV tonight after everyone leaves."', time:'2026-04-15 18:22', detail:'Deleted from the chat but carved from the SQLite WAL journal. Premeditation, stated intent, and timing all line up with the export.', incriminating:true },
                    { id:'p6', title:'RECOVERED: "delete this chat when we\'re done"', time:'2026-04-15 22:05', detail:'Instruction to destroy evidence, recovered from free pages in the messaging database.', incriminating:true }
                ]},
                { label:'Photos (with EXIF)', icon:'fa-image', items:[
                    { id:'p7', title:'Photo of a monitor showing customer records', time:'2026-04-15 21:20', detail:'A phone photo of a screen full of the customer table. EXIF GPS: 24.7136, 46.6753 (GulfPay HQ, Riyadh). Taken at 21:20, after hours, from inside the office.', incriminating:true },
                    { id:'p8', title:'Lunch photo', time:'2026-04-15 13:05', detail:'A photo of a meal. EXIF places it at a nearby restaurant at midday. Not relevant.', incriminating:false }
                ]},
                { label:'Installed apps', icon:'fa-grip', items:[
                    { id:'p9', title:'MEGA + Signal + "Secure Eraser"', time:'installed 2026-04-12', detail:'A personal cloud client, an encrypted messenger, and a file-shredding app, all installed three days before the breach.', incriminating:true },
                    { id:'p10', title:'Banking and food-delivery apps', time:'various', detail:'Ordinary consumer apps. Not relevant.', incriminating:false }
                ]},
                { label:'Location history', icon:'fa-location-dot', items:[
                    { id:'p11', title:'At GulfPay HQ 20:55 to 22:10', time:'2026-04-15 night', detail:'Google location history places the phone inside the office from just before 21:00 until after 22:00 on the night of the breach, matching the export, archive and upload times.', incriminating:true }
                ]}
            ]
        },
        {
            id:'logs', type:'Logs', icon:'fa-list',
            name:'Proxy, DLP and badge logs', device:'Central log store',
            size:'—', hash:'sha256: 55d1e2...80cc', tool:'SIEM export',
            groups:[
                { label:'Proxy / DLP', items:[
                    { id:'l1', title:'2.6 GB upload to mega.nz', time:'2026-04-15 21:30', detail:'The perimeter proxy logged a 2.6 GB HTTPS upload to MEGA from 10.20.14.53 (FIN-WS03), Faisal\'s assigned workstation.', incriminating:true }
                ]},
                { label:'Badge access', items:[
                    { id:'l2', title:'Faisal badged in 20:55, out 22:10', time:'2026-04-15', detail:'Physical access records put Faisal in the building across the entire window of the breach.', incriminating:true },
                    { id:'l3', title:'Khalid badged out 18:02', time:'2026-04-15', detail:'The IT administrator left the building nearly three hours before the breach and did not return. He had the access but not the opportunity.', incriminating:false, clears:'khalid' },
                    { id:'l4', title:'Sara has no financial-system access', time:'—', detail:'HR accounts cannot reach the customer database at all.', incriminating:false, clears:'sara' }
                ]}
            ]
        }
    ];

    var incriminatingIds = [];
    EVIDENCE.forEach(function(e){ e.groups.forEach(function(g){ g.items.forEach(function(it){ if(it.incriminating) incriminatingIds.push(it.id); }); }); });

    /* ---- state ---- */
    var acquired = {}; // evidenceId -> true
    var tagged = {};   // artifactId -> artifact (with source)
    var openEvidence = null;

    ready(function(){
        if(!$('#df-app')) return;
        renderAcquire();
        renderExaminer();
        renderBoard();
        buildAccuse();

        $('#df-search-btn').addEventListener('click', doSearch);
        $('#df-search').addEventListener('keydown', function(e){ if(e.key==='Enter') doSearch(); });
    });

    function findArtifact(id){
        var found=null;
        EVIDENCE.forEach(function(e){ e.groups.forEach(function(g){ g.items.forEach(function(it){ if(it.id===id){ found={art:it, ev:e, group:g}; } }); }); });
        return found;
    }

    /* ---- acquisition ---- */
    function renderAcquire(){
        var wrap=$('#df-acquire');
        wrap.innerHTML=EVIDENCE.map(function(e){
            var got=acquired[e.id];
            return '<div class="df-ev '+(got?'is-acquired':'')+'">'+
                '<div class="df-ev-ico"><i class="fas '+e.icon+'"></i></div>'+
                '<div class="df-ev-b"><div class="df-ev-name">'+esc(e.name)+'</div>'+
                '<div class="df-ev-meta">'+esc(e.type)+' &middot; '+esc(e.device)+'</div>'+
                (got?'<div class="df-ev-hash">'+esc(e.hash)+' &middot; verified &middot; '+esc(e.tool)+'</div>':'')+
                '</div>'+
                (got?'<span class="df-ev-ok"><i class="fas fa-lock"></i> Acquired</span>':'<button class="btn btn-primary df-acq" data-e="'+e.id+'">Acquire &amp; hash</button>')+
                '</div>';
        }).join('');
        $$('#df-acquire .df-acq').forEach(function(b){ b.addEventListener('click', function(){
            acquired[b.dataset.e]=true;
            flash('Image acquired and hash verified. Chain of custody recorded for '+findEv(b.dataset.e).name+'.');
            renderAcquire(); renderExaminer();
        }); });
    }
    function findEv(id){ for(var i=0;i<EVIDENCE.length;i++){ if(EVIDENCE[i].id===id) return EVIDENCE[i]; } }

    /* ---- examiner ---- */
    function renderExaminer(){
        var tabs=$('#df-ev-tabs'), body=$('#df-ev-body');
        var avail=EVIDENCE.filter(function(e){ return acquired[e.id]; });
        if(!avail.length){ tabs.innerHTML=''; body.innerHTML='<div class="df-empty">Acquire an evidence source above to begin examining it.</div>'; return; }
        if(!openEvidence || !acquired[openEvidence]) openEvidence=avail[0].id;
        tabs.innerHTML=avail.map(function(e){
            return '<button class="df-evtab '+(e.id===openEvidence?'active':'')+'" data-e="'+e.id+'"><i class="fas '+e.icon+'"></i> '+esc(e.name)+'</button>';
        }).join('');
        $$('#df-ev-tabs .df-evtab').forEach(function(b){ b.addEventListener('click', function(){ openEvidence=b.dataset.e; renderExaminer(); }); });

        var e=findEv(openEvidence);
        var html='<div class="df-examhead"><span class="df-examtool"><i class="fas fa-toolbox"></i> '+esc(e.tool)+'</span> <span class="df-examhash">'+esc(e.hash)+'</span></div>';
        html+=e.groups.map(function(g){
            return '<div class="df-group">'+
                '<div class="df-group-h">'+(g.icon?'<i class="fas '+g.icon+'"></i> ':'')+esc(g.label)+'</div>'+
                g.items.map(function(it){
                    var isTag=!!tagged[it.id];
                    return '<div class="df-art">'+
                        '<div class="df-art-b"><div class="df-art-t">'+esc(it.title)+'</div>'+
                        '<div class="df-art-time">'+esc(it.time)+'</div>'+
                        '<div class="df-art-d">'+esc(it.detail)+'</div></div>'+
                        '<button class="df-tag '+(isTag?'is-tagged':'')+'" data-a="'+it.id+'">'+(isTag?'<i class="fas fa-check"></i> Tagged':'<i class="fas fa-flag"></i> Tag as evidence')+'</button>'+
                        '</div>';
                }).join('')+
            '</div>';
        }).join('');
        body.innerHTML=html;
        $$('#df-ev-body .df-tag').forEach(function(b){ b.addEventListener('click', function(){ toggleTag(b.dataset.a); }); });
    }

    function toggleTag(id){
        if(tagged[id]){ delete tagged[id]; }
        else { var f=findArtifact(id); tagged[id]={ id:id, title:f.art.title, ev:f.ev.name, incriminating:f.art.incriminating, clears:f.art.clears }; }
        renderExaminer(); renderBoard();
    }

    /* ---- evidence board ---- */
    function renderBoard(){
        var box=$('#df-board'); var ids=Object.keys(tagged);
        $('#df-board-count').textContent=ids.length;
        if(!ids.length){ box.innerHTML='<div class="df-empty">Tag artifacts while you examine the evidence and they will collect here as your case file.</div>'; return; }
        box.innerHTML=ids.map(function(id){
            var t=tagged[id];
            return '<div class="df-boarditem"><div class="df-bi-t">'+esc(t.title)+'</div><div class="df-bi-s">'+esc(t.ev)+'</div><button class="df-untag" data-a="'+id+'">&times;</button></div>';
        }).join('');
        $$('#df-board .df-untag').forEach(function(b){ b.addEventListener('click', function(){ toggleTag(b.dataset.a); }); });
    }

    /* ---- keyword search across acquired evidence ---- */
    function doSearch(){
        var q=($('#df-search').value||'').trim().toLowerCase();
        var out=$('#df-search-out');
        if(!q){ out.innerHTML=''; return; }
        var hits=[];
        EVIDENCE.forEach(function(e){ if(!acquired[e.id]) return; e.groups.forEach(function(g){ g.items.forEach(function(it){
            if((it.title+' '+it.detail).toLowerCase().indexOf(q)!==-1) hits.push({it:it,ev:e});
        }); }); });
        if(!hits.length){ out.innerHTML='<div class="df-empty">No matches in acquired evidence'+(Object.keys(acquired).length<EVIDENCE.length?'. Acquire more sources to widen the search.':'.')+'</div>'; return; }
        out.innerHTML='<div class="df-searchhits">'+hits.map(function(h){
            return '<div class="df-hit"><span class="df-hit-ev">'+esc(h.ev.name)+'</span> '+esc(h.it.title)+'<button class="df-tag mini '+(tagged[h.it.id]?'is-tagged':'')+'" data-a="'+h.it.id+'">'+(tagged[h.it.id]?'Tagged':'Tag')+'</button></div>';
        }).join('')+'</div>';
        $$('#df-search-out .df-tag').forEach(function(b){ b.addEventListener('click', function(){ toggleTag(b.dataset.a); }); });
    }

    /* ---- accusation ---- */
    function buildAccuse(){
        $('#df-suspect').innerHTML='<option value="">Select a suspect</option>'+CASE.suspects.map(function(s){ return '<option value="'+s.id+'">'+esc(s.name)+' ('+esc(s.role)+')</option>'; }).join('');
        $('#df-method').innerHTML='<option value="">Select the method</option>'+CASE.methods.map(function(m){ return '<option value="'+m.id+'">'+esc(m.text)+'</option>'; }).join('');
        $('#df-accuse-btn').addEventListener('click', verdict);
    }

    function verdict(){
        var who=$('#df-suspect').value, how=$('#df-method').value;
        if(!who || !how){ flash('Choose both a suspect and a method before submitting.'); return; }
        var taggedInc=Object.keys(tagged).filter(function(id){ return tagged[id].incriminating; });
        var wrongTags=Object.keys(tagged).filter(function(id){ return !tagged[id].incriminating; });
        var coverage=Math.round(taggedInc.length / incriminatingIds.length * 100);

        var correctWho=who===CASE.culprit, correctHow=how===CASE.correctMethod;
        var pts=0;
        pts += taggedInc.length*6;      // each real piece of evidence
        pts -= wrongTags.length*3;      // noise tagged as evidence
        pts += correctWho?25:0;
        pts += correctHow?15:0;
        pts = Math.max(0, Math.min(100, pts));

        var whoName=(CASE.suspects.find(function(s){return s.id===who;})||{}).name;
        var verdictText, cls;
        if(correctWho && correctHow && coverage>=60){
            verdictText='Case solved. '+whoName+' exfiltrated the customer export to a personal MEGA account and sold it to an outside broker, coordinating over Signal from the seized phone. The disk, memory, phone and logs corroborate each other, and the after-hours badge and location records place '+whoName.split(' ')[0]+' at the scene while the two other suspects are cleared.';
            cls='ok';
        } else if(correctWho && correctHow){
            verdictText='Right conclusion, thin file. You named '+whoName+' and the correct method, but you only tagged '+coverage+'% of the available evidence. A defense lawyer would pull this apart. Go back and corroborate across the disk, phone and logs.';
            cls='warn';
        } else if(correctWho){
            verdictText='You identified '+whoName+' correctly, but the method is wrong. Re-read the cloud upload in the proxy logs, the rclone process in memory, and the Signal messages on the phone.';
            cls='warn';
        } else {
            verdictText='That does not hold up. The badge and access logs clear the other two suspects, and the disk, phone and network evidence all point one way. Review what you tagged and try again.';
            cls='bad';
        }

        var modal=$('#df-verdict');
        modal.innerHTML='<div class="df-verdict-card">'+
            '<button class="df-verdict-x">&times;</button>'+
            '<div class="df-verdict-score '+cls+'">'+pts+'<span>/100</span></div>'+
            '<h3>'+(correctWho&&correctHow&&coverage>=60?'Case closed':'Review needed')+'</h3>'+
            '<p>'+verdictText+'</p>'+
            '<div class="df-verdict-stats"><span><b>'+taggedInc.length+'/'+incriminatingIds.length+'</b> key artifacts found</span><span><b>'+wrongTags.length+'</b> false leads tagged</span><span><b>'+coverage+'%</b> evidence coverage</span></div>'+
            '</div>';
        modal.classList.add('show');
        $('.df-verdict-x',modal).addEventListener('click', function(){ modal.classList.remove('show'); });
        modal.addEventListener('click', function(e){ if(e.target===modal) modal.classList.remove('show'); });
    }

    function flash(t){
        var d=document.createElement('div'); d.className='df-flash'; d.textContent=t; document.body.appendChild(d);
        setTimeout(function(){ d.classList.add('show'); },10);
        setTimeout(function(){ d.classList.remove('show'); setTimeout(function(){ d.remove(); },300); },3200);
    }
})();
