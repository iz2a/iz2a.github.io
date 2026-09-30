/* ==========================================================================
   Raqib SOC Simulation (2026, light rebuild)
   A fully interactive SIEM: search the live log store with an SPL-style query
   language, triage offenses, investigate each one on its own timeline, take
   ONLY the response actions that fit that alert, run the mapped playbook as a
   live checklist, watch the dashboard update, and generate a real shift report.
   ========================================================================== */
(function () {
    'use strict';
    var D = window.SOC;
    function ready(fn){ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',fn); else fn(); }
    var $=function(s,r){return (r||document).querySelector(s);};
    var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));};
    var esc=function(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});};
    var fmtT=function(d){return d.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false});};
    var fmtC=function(d){return d.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',hour12:false});};

    var state = {
        offenses: [], actions:{}, playbookProgress:{}, activeOffense:null, score:0
    };

    ready(function(){
        if(!D || !$('#siem-app')) return;
        // build mutable offense state
        state.offenses = D.OFFENSES.map(function(o){ return Object.assign({}, o, {status:'open'}); });
        D.OFFENSES.forEach(function(o){ state.actions[o.id]=[]; state.playbookProgress[o.id]={}; });

        $$('.siem-tab').forEach(function(t){ t.addEventListener('click', function(){ switchView(t.dataset.tab); }); });
        $('#siem-run').addEventListener('click', function(){ runSearch($('#siem-q').value); });
        $('#siem-q').addEventListener('keydown', function(e){ if(e.key==='Enter'){ e.preventDefault(); runSearch($('#siem-q').value); } });
        buildSaved();
        runSearch('severity=critical');
        renderOffenses(); updateHeader(); tick(); setInterval(tick,1000);
        toast('New shift. Three offenses are open, start with the critical one.', 'warn');
    });

    /* ------------------- SEARCH (SPL-style) ------------------- */
    function tokenize(st){var o=[],c='',q=false;for(var i=0;i<st.length;i++){var ch=st[i];if(ch==='"'){q=!q;continue;}if(ch===' '&&!q){if(c){o.push(c);c='';}continue;}c+=ch;}if(c)o.push(c);return o;}
    function match(rec,tok){
        var m=tok.match(/^([a-zA-Z_]+)\s*(!=|>=|<=|=|>|<)\s*(.*)$/);
        if(!m) return JSON.stringify(rec).toLowerCase().indexOf(tok.toLowerCase())!==-1;
        var f=m[1],op=m[2],val=m[3], v=rec[f]; if(v==null&&rec.extra)v=rec.extra[f];
        var s=String(v==null?'':v).toLowerCase(), t=val.toLowerCase();
        if(op==='='){ if(t.indexOf('*')!==-1){return new RegExp('^'+t.replace(/[.+?^${}()|[\]\\]/g,'\\$&').replace(/\*/g,'.*')+'$').test(s);} return s===t; }
        if(op==='!=') return s!==t;
        if(op==='>') return parseFloat(v)>parseFloat(val);
        if(op==='<') return parseFloat(v)<parseFloat(val);
        if(op==='>=') return parseFloat(v)>=parseFloat(val);
        if(op==='<=') return parseFloat(v)<=parseFloat(val);
        return false;
    }
    function search(query){
        var stages=query.split('|').map(function(s){return s.trim();}).filter(Boolean);
        var rows=D.LOGS.slice(), agg=null, start=0;
        var isCmd=function(s){return /^(stats|timechart|sort|head|tail)\b/.test(s);};
        if(stages.length && !isCmd(stages[0])){ var toks=tokenize(stages[0]); rows=rows.filter(function(r){return toks.every(function(t){return t==='*'||match(r,t);});}); start=1; }
        for(var i=start;i<stages.length;i++){ var st=stages[i], cmd=st.split(/\s+/)[0];
            if(cmd==='stats'){ var by=(st.match(/by\s+([a-zA-Z_]+)/)||[])[1]||'source'; var c={}; rows.forEach(function(r){var k=r[by]!=null?r[by]:(r.extra&&r.extra[by])||'(none)';c[k]=(c[k]||0)+1;}); agg={type:'stats',by:by,rows:Object.keys(c).map(function(k){return {key:k,count:c[k]};}).sort(function(a,b){return b.count-a.count;})}; }
            else if(cmd==='timechart'){ var bk={}; rows.forEach(function(r){var b=Math.floor((r.time-D.shiftStart)/(15*60000));bk[b]=(bk[b]||0)+1;}); agg={type:'timechart',rows:Object.keys(bk).map(function(b){return {bucket:+b,count:bk[b]};}).sort(function(a,b){return a.bucket-b.bucket;})}; }
            else if(cmd==='sort'){ var f=st.replace(/^sort\s+/,'').trim(),desc=f[0]==='-',k=f.replace(/^-/,''); rows.sort(function(a,b){var x=a[k],y=b[k];return (x>y?1:x<y?-1:0)*(desc?-1:1);}); }
            else if(cmd==='head'){ rows=rows.slice(0,parseInt(st.split(/\s+/)[1]||'10',10)); }
            else if(cmd==='tail'){ rows=rows.slice(-parseInt(st.split(/\s+/)[1]||'10',10)); }
        }
        return {rows:rows,agg:agg};
    }
    function runSearch(q){
        var out=$('#siem-results'), res;
        try{ res=search(q); }catch(e){ out.innerHTML='<div class="siem-msg">Could not parse that. Try <code>source=edr severity=critical</code>.</div>'; return; }
        $('#siem-count').textContent=res.rows.length.toLocaleString();
        if(res.agg&&res.agg.type==='stats'){ var mx=Math.max.apply(null,res.agg.rows.map(function(r){return r.count;}))||1;
            out.innerHTML='<table class="siem-stats"><thead><tr><th>'+esc(res.agg.by)+'</th><th>count</th><th></th></tr></thead><tbody>'+res.agg.rows.map(function(r){return '<tr><td>'+esc(r.key)+'</td><td>'+r.count+'</td><td><span class="statbar" style="width:'+(r.count/mx*100)+'%"></span></td></tr>';}).join('')+'</tbody></table>'; return; }
        if(res.agg&&res.agg.type==='timechart'){ var mx2=Math.max.apply(null,res.agg.rows.map(function(r){return r.count;}))||1;
            out.innerHTML='<div class="siem-timechart">'+res.agg.rows.map(function(r){var t=new Date(D.shiftStart.getTime()+r.bucket*15*60000);return '<div class="tc-col" title="'+fmtC(t)+' ('+r.count+')"><div class="tc-bar" style="height:'+Math.max(4,r.count/mx2*120)+'px"></div><div class="tc-lbl">'+fmtC(t)+'</div></div>';}).join('')+'</div>'; return; }
        if(!res.rows.length){ out.innerHTML='<div class="siem-msg">No events match. Widen the search.</div>'; return; }
        out.innerHTML='<div class="siem-rows">'+res.rows.slice(0,200).map(function(r){var sv=r.severity||'info';
            return '<button class="ev" data-ev="'+r._id+'"><span class="ev-time">'+fmtT(r.time)+'</span><span class="ev-sev sev-'+sv+'">'+sv+'</span><span class="ev-src">'+esc(r.source)+'</span><span class="ev-host">'+esc(r.host)+'</span><span class="ev-msg">'+esc(r.msg)+'</span>'+(r.technique?'<span class="ev-tech">'+esc(r.technique)+'</span>':'')+'</button>';
        }).join('')+(res.rows.length>200?'<div class="siem-msg">Showing first 200 of '+res.rows.length+'.</div>':'')+'</div>';
        $$('.ev',out).forEach(function(b){ b.addEventListener('click', function(){ openEvent(b.dataset.ev); }); });
    }
    function openEvent(id){ var r=D.LOGS.find(function(e){return e._id===id;}); if(!r)return;
        var rows=[]; var add=function(k,v){ if(v!=null&&v!=='') rows.push('<tr><td>'+esc(k)+'</td><td>'+esc(v)+'</td></tr>'); };
        add('_time',r.time.toLocaleString()); add('severity',r.severity); add('source',r.source); add('action',r.action); add('host',r.host); add('ip',r.ip); add('user',r.user); add('signature',r.signature);
        if(r.technique) add('technique',r.technique+' - '+(D.TECHNIQUES[r.technique]||'')); if(r.extra) Object.keys(r.extra).forEach(function(k){add(k,r.extra[k]);}); add('message',r.msg);
        var off=state.offenses.find(function(o){return o.eventIds.indexOf(id)!==-1;});
        var m=modal('Event '+esc(r._id), '<table class="ev-detail">'+rows.join('')+'</table>'+(off?'<div class="ev-linked">Part of offense <a href="#" data-goto="'+off.id+'">'+esc(off.id)+' - '+esc(off.title)+'</a></div>':''));
        var l=$('[data-goto]',m); if(l) l.addEventListener('click',function(e){e.preventDefault();closeModal();openOffense(off.id);});
    }
    function buildSaved(){
        var S=[['All critical','severity=critical'],['EDR process activity','source=edr action=process'],['Traffic to C2','185.225.19.44'],['Failed VPN logins','source=auth action=failure'],['Events on FIN-WS03','host=FIN-WS03 | sort time'],['Count by source','* | stats count by source'],['Volume over time','* | timechart']];
        $('#siem-saved').innerHTML=S.map(function(s){return '<button class="saved-q" data-q="'+esc(s[1])+'">'+esc(s[0])+'</button>';}).join('');
        $$('#siem-saved .saved-q').forEach(function(b){ b.addEventListener('click',function(){ $('#siem-q').value=b.dataset.q; runSearch(b.dataset.q); }); });
    }

    /* ------------------- OFFENSES ------------------- */
    function renderOffenses(){
        var open=state.offenses.filter(function(o){return o.status==='open';}), closed=state.offenses.filter(function(o){return o.status!=='open';});
        $('#of-open-count').textContent=open.length;
        var card=function(o){ var acts=state.actions[o.id]||[];
            return '<button class="of-card sevb-'+o.severity+(o.status!=='open'?' is-closed':'')+'" data-of="'+o.id+'">'+
                '<div class="of-top"><span class="of-mag sevbg-'+o.severity+'">'+o.magnitude.toFixed(1)+'</span>'+
                '<div class="of-h"><div class="of-id">'+esc(o.id)+' &middot; '+esc(o.category)+'</div><div class="of-title">'+esc(o.title)+'</div></div>'+
                '<span class="of-status st-'+o.status+'">'+esc(o.status)+'</span></div>'+
                '<div class="of-meta"><span><i class="fas fa-desktop"></i> '+esc(o.sourceHost)+'</span><span><i class="fas fa-layer-group"></i> '+o.eventIds.length+' events</span><span><i class="far fa-clock"></i> '+fmtC(o.firstSeen)+'&ndash;'+fmtC(o.lastSeen)+'</span>'+(acts.length?'<span class="of-at"><i class="fas fa-bolt"></i> '+acts.length+' actions</span>':'')+'</div></button>';
        };
        $('#of-list').innerHTML=open.map(card).join('')||'<div class="siem-msg">No open offenses. Quiet shift.</div>';
        $('#of-closed').innerHTML=closed.length?('<div class="of-closed-h">Closed this shift</div>'+closed.map(card).join('')):'';
        $$('#of-list .of-card, #of-closed .of-card').forEach(function(b){ b.addEventListener('click',function(){ openOffense(b.dataset.of); }); });
    }
    function openOffense(id){ state.activeOffense=id; switchView('investigate'); renderInvestigation(state.offenses.find(function(o){return o.id===id;})); }

    /* ------------------- INVESTIGATION ------------------- */
    function renderInvestigation(o){
        var wrap=$('#inv-body');
        var events=o.eventIds.map(function(id){return D.LOGS.find(function(e){return e._id===id;});}).filter(Boolean).sort(function(a,b){return a.time-b.time;});
        var acts=state.actions[o.id]||[];
        var techs=o.techniques.map(function(t){return '<span class="tech-chip" title="'+esc(D.TECHNIQUES[t]||'')+'">'+esc(t)+'</span>';}).join('');
        // CONTEXTUAL actions: only what fits THIS offense
        var actionBtns=(o.available||[]).map(function(k){ var a=D.ACTIONS[k]; var done=acts.indexOf(k)!==-1;
            return '<button class="act-btn'+(done?' is-done':'')+'" data-act="'+k+'"'+(done?' disabled':'')+'><i class="fas '+a.icon+'"></i> '+esc(a.label)+(done?' <i class="fas fa-check act-check"></i>':'')+'</button>';
        }).join('');
        var certPanel = o.cert ? ('<div class="inv-panel"><div class="inv-panel-h">Certificate details</div><table class="cert-tbl">'+
            '<tr><td>Domain</td><td>'+esc(o.cert.domain)+'</td></tr><tr><td>Expiry</td><td>'+esc(o.cert.expiry)+'</td></tr><tr><td>Issuer</td><td>'+esc(o.cert.issuer)+'</td></tr><tr><td>Type</td><td>'+esc(o.cert.type)+'</td></tr><tr><td>Auto-renew</td><td>'+esc(o.cert.autorenew)+'</td></tr></table></div>') : '';

        wrap.innerHTML=
            '<div class="inv-head"><button class="inv-back" id="inv-back"><i class="fas fa-arrow-left"></i> Offenses</button>'+
            '<div class="inv-tw"><span class="of-mag sevbg-'+o.severity+'">'+o.magnitude.toFixed(1)+'</span><div><h2 class="inv-title">'+esc(o.title)+'</h2><div class="inv-sub">'+esc(o.id)+' &middot; '+esc(o.category)+' &middot; source '+esc(o.sourceHost)+' ('+esc(o.sourceUser)+')</div></div></div>'+
            '<span class="of-status st-'+o.status+'">'+esc(o.status)+'</span></div>'+
            '<div class="inv-grid"><div class="inv-main">'+
                '<div class="inv-summary">'+esc(o.summary)+'</div>'+
                (techs?'<div class="inv-tech"><span class="inv-label">ATT&CK</span>'+techs+'</div>':'')+
                '<div class="inv-tl-h"><i class="fas fa-bars-staggered"></i> '+(o.cert?'Related events':'Attack timeline')+' ('+events.length+')</div>'+
                '<ol class="inv-tl">'+events.map(function(e){var sv=e.severity||'info';return '<li class="tl-ev"><span class="tl-dot sevbg-'+sv+'"></span><div class="tl-card"><div class="tl-when">'+fmtT(e.time)+' &middot; <span class="tl-src">'+esc(e.source)+'</span> &middot; '+esc(e.host)+'</div><div class="tl-sig">'+esc(e.signature)+'</div><div class="tl-msg">'+esc(e.msg)+'</div>'+(e.technique?'<div class="tl-tech">'+esc(e.technique)+' &middot; '+esc(D.TECHNIQUES[e.technique]||'')+'</div>':'')+'</div></li>';}).join('')+'</ol>'+
            '</div><aside class="inv-side">'+
                (recDone(o) && o.status==='open' ? '<button class="btn-close-offense" id="inv-close-btn"><i class="fas fa-flag-checkered"></i> Close offense '+esc(o.id)+'</button>' : '')+
                certPanel+
                '<div class="inv-panel"><div class="inv-panel-h">Response actions</div><p class="inv-hint">'+(o.cert?'Fix the certificate and prevent recurrence.':'Contain first, then eradicate and escalate. Order is scored.')+'</p><div class="act-grid">'+actionBtns+'</div></div>'+
                (o.playbook?'<div class="inv-panel"><div class="inv-panel-h">Playbook: '+esc(D.PLAYBOOKS[o.playbook].name)+'</div><ol class="inv-pb" id="inv-pb">'+renderPB(o)+'</ol><button class="pb-open" id="pb-open">Open full playbook</button></div>':'')+
                '<div class="inv-panel"><div class="inv-panel-h">Action log</div><ul class="inv-log">'+renderLog(o)+'</ul></div>'+
            '</aside></div>';
        $('#inv-back').addEventListener('click', function(){ switchView('offenses'); });
        $$('.act-btn',wrap).forEach(function(b){ if(!b.disabled) b.addEventListener('click', function(){ takeAction(o.id,b.dataset.act); }); });
        var pbo=$('#pb-open'); if(pbo) pbo.addEventListener('click', function(){ switchView('playbooks'); openPlaybook(o.playbook, o.id); });
        $$('#inv-pb .pb-step').forEach(function(li){ li.addEventListener('click', function(){ togglePB(o.id, +li.dataset.i); renderInvestigation(o); }); });
        var cb=$('#inv-close-btn'); if(cb) cb.addEventListener('click', function(){ finish(o); });
    }
    function recDone(o){ var a=state.actions[o.id]||[]; var rec=o.recommended.filter(function(r){return r!=='close';}); return rec.every(function(r){return a.indexOf(r)!==-1;}); }
    function renderPB(o){ var pb=D.PLAYBOOKS[o.playbook]; var prog=state.playbookProgress[o.id]||{};
        return pb.steps.map(function(s,i){ return '<li class="pb-step'+(prog[i]?' done':'')+'" data-i="'+i+'"><span class="pb-check">'+(prog[i]?'<i class="fas fa-check"></i>':(i+1))+'</span>'+esc(s)+'</li>'; }).join('');
    }
    function togglePB(id,i){ var p=state.playbookProgress[id]; p[i]=!p[i]; }
    function renderLog(o){ var a=state.actions[o.id]||[]; if(!a.length) return '<li class="inv-log-e">No actions taken yet.</li>'; return a.map(function(k,i){return '<li><span class="ilog-n">'+(i+1)+'</span>'+esc(D.ACTIONS[k].label)+'</li>';}).join(''); }

    function takeAction(id,k){ var o=state.offenses.find(function(x){return x.id===id;}), a=state.actions[id]; if(a.indexOf(k)!==-1)return;
        a.push(k); var act=D.ACTIONS[k]; toast(act.ok, (act.kind==='contain'||act.kind==='escalate'||act.kind==='remediate')?'ok':undefined);
        renderInvestigation(o); renderOffenses(); updateHeader();
        var rec=o.recommended.filter(function(r){return r!=='close';}); var done=rec.filter(function(r){return a.indexOf(r)!==-1;});
        if(done.length===rec.length){ toast('All recommended actions complete. Close the offense when ready.','ok'); }
    }
    function finish(o){ o.status='closed'; var a=state.actions[o.id]; var rec=o.recommended.filter(function(r){return r!=='close';});
        var hit=rec.filter(function(r){return a.indexOf(r)!==-1;}).length; var extra=a.filter(function(k){return rec.indexOf(k)===-1;}).length;
        var pts=Math.max(0, hit*20 - extra*4);
        var fc=a.findIndex(function(k){return D.ACTIONS[k].kind==='contain';}); var fe=a.findIndex(function(k){return D.ACTIONS[k].kind==='eradicate';});
        if(!o.cert && fc!==-1 && (fe===-1||fc<fe)) pts+=15;
        state.score+=pts;
        var pbDone=Object.keys(state.playbookProgress[o.id]||{}).filter(function(k){return state.playbookProgress[o.id][k];}).length;
        var verdict = hit===rec.length ? 'Handled well. Every recommended action was taken'+(!o.cert&&fc!==-1&&(fe===-1||fc<fe)?', and you contained before eradicating.':'.') : 'Closed with '+hit+' of '+rec.length+' recommended actions. Review the playbook for what was missed.';
        switchView('offenses'); renderOffenses(); updateHeader();
        modal('Offense '+esc(o.id)+' closed', '<div class="verdict"><div class="v-score">+'+pts+' pts</div><p>'+esc(verdict)+'</p><div class="v-detail"><strong>Recommended:</strong> '+o.recommended.filter(function(r){return r!=='close';}).map(function(r){return a.indexOf(r)!==-1?'<span class="v-ok">'+esc(D.ACTIONS[r].label)+'</span>':'<span class="v-miss">'+esc(D.ACTIONS[r].label)+'</span>';}).join(', ')+'</div>'+(pbDone?'<div class="v-detail">Playbook steps completed: '+pbDone+'</div>':'')+'</div>'+(state.offenses.every(function(x){return x.status!=='open';})?'<p class="v-done">All offenses handled. Shift score: <strong>'+state.score+'</strong>. Generate your report in the Reports tab.</p>':''));
    }

    /* ------------------- DASHBOARD ------------------- */
    function renderDashboard(){
        var logs=D.LOGS, bySev={critical:0,high:0,medium:0,low:0,info:0}, bySrc={};
        logs.forEach(function(l){bySev[l.severity]=(bySev[l.severity]||0)+1;bySrc[l.source]=(bySrc[l.source]||0)+1;});
        $('#db-total').textContent=logs.length.toLocaleString();
        $('#db-open').textContent=state.offenses.filter(function(o){return o.status==='open';}).length;
        $('#db-closed').textContent=state.offenses.filter(function(o){return o.status!=='open';}).length;
        var sm=Math.max.apply(null,Object.keys(bySev).map(function(k){return bySev[k];}))||1;
        $('#db-sev').innerHTML=['critical','high','medium','low','info'].map(function(s){return '<div class="db-bar-row"><span class="db-bl sev-'+s+'">'+s+'</span><span class="db-bt"><span class="db-b sevbg-'+s+'" style="width:'+(bySev[s]/sm*100)+'%"></span></span><span class="db-bv">'+bySev[s]+'</span></div>';}).join('');
        var bk={}; logs.forEach(function(l){var b=Math.floor((l.time-D.shiftStart)/(15*60000));bk[b]=(bk[b]||0)+1;});
        var ks=Object.keys(bk).map(Number).sort(function(a,b){return a-b;}), bm=Math.max.apply(null,ks.map(function(k){return bk[k];}))||1;
        $('#db-tc').innerHTML=ks.map(function(k){var t=new Date(D.shiftStart.getTime()+k*15*60000);return '<div class="tc-col" title="'+fmtC(t)+' ('+bk[k]+')"><div class="tc-bar" style="height:'+Math.max(4,bk[k]/bm*120)+'px"></div><div class="tc-lbl">'+fmtC(t)+'</div></div>';}).join('');
        var cm=Math.max.apply(null,Object.keys(bySrc).map(function(k){return bySrc[k];}))||1;
        $('#db-src').innerHTML=Object.keys(bySrc).sort(function(a,b){return bySrc[b]-bySrc[a];}).map(function(s){return '<div class="db-si"><div class="db-sv">'+bySrc[s]+'</div><div class="db-sl">'+esc(s)+'</div><div class="db-st"><span style="width:'+(bySrc[s]/cm*100)+'%"></span></div></div>';}).join('');
    }

    /* ------------------- PLAYBOOKS (runnable) ------------------- */
    function renderPlaybooks(){
        var keys=Object.keys(D.PLAYBOOKS);
        $('#pb-body').innerHTML='<p class="siem-msg">Response playbooks. Click one to open it as a live checklist you can work through.</p><div class="pb-list">'+keys.map(function(k){var pb=D.PLAYBOOKS[k];return '<button class="pb-card" data-pb="'+k+'"><div class="pb-card-h">'+esc(pb.name)+'</div><div class="pb-card-m">'+esc(pb.category)+' &middot; '+pb.steps.length+' steps</div></button>';}).join('')+'</div><div id="pb-detail"></div>';
        $$('#pb-body .pb-card').forEach(function(b){ b.addEventListener('click', function(){ openPlaybook(b.dataset.pb, null); }); });
    }
    function openPlaybook(key, offId){
        var pb=D.PLAYBOOKS[key]; if(!pb)return;
        // tie progress to an offense that uses this playbook, if any
        var off = offId ? state.offenses.find(function(o){return o.id===offId;}) : state.offenses.find(function(o){return o.playbook===key;});
        var prog = off ? state.playbookProgress[off.id] : (state._genericPB=state._genericPB||{});
        var d=$('#pb-detail');
        function draw(){
            var done=pb.steps.filter(function(_,i){return prog[i];}).length;
            d.innerHTML='<div class="pb-run"><div class="pb-run-h"><h3>'+esc(pb.name)+'</h3><span class="pb-prog">'+done+' / '+pb.steps.length+' done</span></div>'+
                (off?'<div class="pb-tie">Working the '+esc(off.id)+' incident</div>':'')+
                '<ol class="pb-steps">'+pb.steps.map(function(s,i){return '<li class="pb-step'+(prog[i]?' done':'')+'" data-i="'+i+'"><span class="pb-check">'+(prog[i]?'<i class="fas fa-check"></i>':(i+1))+'</span>'+esc(s)+'</li>';}).join('')+'</ol></div>';
            $$('#pb-detail .pb-step').forEach(function(li){ li.addEventListener('click', function(){ prog[+li.dataset.i]=!prog[+li.dataset.i]; draw(); }); });
        }
        draw(); d.scrollIntoView({behavior:'smooth', block:'nearest'});
    }

    /* ------------------- REPORTS (real, current) ------------------- */
    function renderReports(){
        var done=state.offenses.filter(function(o){return o.status!=='open';}), open=state.offenses.filter(function(o){return o.status==='open';});
        $('#rep-body').innerHTML='<div class="rep-actions"><button class="btn-primary" id="rep-gen"><i class="fas fa-file-lines"></i> Generate shift report</button></div>'+
            '<div class="rep-sum"><div class="rep-s"><div class="rep-n">'+D.LOGS.length.toLocaleString()+'</div><div class="rep-l">events ingested</div></div><div class="rep-s"><div class="rep-n">'+state.offenses.length+'</div><div class="rep-l">offenses raised</div></div><div class="rep-s"><div class="rep-n">'+done.length+'</div><div class="rep-l">closed</div></div><div class="rep-s"><div class="rep-n">'+state.score+'</div><div class="rep-l">shift score</div></div></div>'+
            (open.length?'<p class="siem-msg">'+open.length+' offense(s) still open. Close them from the Offenses tab for a complete report.</p>':'<p class="siem-msg">All offenses handled this shift.</p>')+
            '<div id="rep-preview"></div>';
        $('#rep-gen').addEventListener('click', genReport);
    }
    function reportText(){
        var L=[]; L.push('GULFPAY SOC - SHIFT REPORT'); L.push('Analyst: '+D.ORG.analyst+'   Generated: '+new Date().toLocaleString()); L.push('Shift start: '+D.shiftStart.toLocaleString()); L.push(''.padEnd(58,'='));
        L.push('Events ingested: '+D.LOGS.length); L.push('Offenses raised: '+state.offenses.length); L.push('Shift score:     '+state.score); L.push('');
        state.offenses.forEach(function(o){ var a=state.actions[o.id]; L.push('['+o.id+'] '+o.title); L.push('  Severity '+o.severity+' | magnitude '+o.magnitude+' | status '+o.status); L.push('  Window '+fmtC(o.firstSeen)+'-'+fmtC(o.lastSeen)+' | events '+o.eventIds.length); L.push('  ATT&CK: '+(o.techniques.join(', ')||'n/a')); L.push('  Actions taken: '+(a.length?a.map(function(k){return D.ACTIONS[k].label;}).join('; '):'none')); L.push('  Summary: '+o.summary); L.push(''); });
        return L.join('\n');
    }
    function genReport(){ var txt=reportText();
        $('#rep-preview').innerHTML='<pre class="rep-pre">'+esc(txt)+'</pre>';
        var blob=new Blob([txt],{type:'text/plain'}); var a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='gulfpay-soc-shift-report.txt'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function(){URL.revokeObjectURL(a.href);},1000);
        toast('Shift report generated and downloaded.','ok');
    }

    /* ------------------- chrome ------------------- */
    function updateHeader(){ var open=state.offenses.filter(function(o){return o.status==='open';}); $('#hdr-off').textContent=open.length; $('#hdr-crit').textContent=open.filter(function(o){return o.severity==='critical';}).length; $('#hdr-score').textContent=state.score; var bd=$('#nav-of-badge'); if(bd){bd.textContent=open.length;bd.style.display=open.length?'':'none';} }
    function tick(){ var el=$('#siem-clock'); if(el) el.textContent=new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}); }
    function switchView(n){ $$('.siem-view').forEach(function(v){v.classList.toggle('is-active',v.dataset.view===n);}); $$('.siem-tab').forEach(function(t){t.classList.toggle('is-active',t.dataset.tab===n);});
        if(n==='dashboard') renderDashboard(); if(n==='offenses') renderOffenses(); if(n==='playbooks') renderPlaybooks(); if(n==='reports') renderReports(); if(n==='search') $('#siem-q').focus(); }

    function modal(title,html){ closeModal(); var b=document.createElement('div'); b.className='siem-modal-back'; b.id='siem-modal';
        b.innerHTML='<div class="siem-modal" role="dialog"><div class="siem-modal-h"><h3>'+esc(title)+'</h3><button class="siem-modal-x">&times;</button></div><div class="siem-modal-b">'+html+'</div></div>';
        document.body.appendChild(b); b.addEventListener('click',function(e){if(e.target===b)closeModal();}); $('.siem-modal-x',b).addEventListener('click',closeModal); document.addEventListener('keydown',escC); return b; }
    function closeModal(){ var m=$('#siem-modal'); if(m)m.remove(); document.removeEventListener('keydown',escC); }
    function escC(e){ if(e.key==='Escape') closeModal(); }
    function toast(m,t){ if(window.SX&&window.SX.toast){window.SX.toast(m,t);return;} var d=document.createElement('div'); d.className='siem-toast'+(t?' '+t:''); d.textContent=m; document.body.appendChild(d); setTimeout(function(){d.classList.add('show');},10); setTimeout(function(){d.classList.remove('show');setTimeout(function(){d.remove();},300);},3200); }
})();
