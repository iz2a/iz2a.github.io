/* ==========================================================================
   OWASP Top 10 Workshop (2026, interactive rebuild)
   Hands-on web exploitation. Each challenge is a small simulated vulnerable
   app; you type the actual payload and watch it succeed or fail, then read why
   it worked and how to fix it. Absorbs the former Web Hacking Challenge.
   ========================================================================== */
(function () {
    'use strict';
    function ready(fn){ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',fn); else fn(); }
    var $=function(s,r){return (r||document).querySelector(s);};
    var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));};
    var esc=function(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});};

    var CHALLENGES = [
        {
            id:'sqli', cat:'A03', title:'SQL Injection: authentication bypass',
            scenario:'The GulfPay staff portal builds its login query by string concatenation:',
            code:"SELECT * FROM users WHERE user='$u' AND pass='$p'",
            prompt:'Log in as the admin without knowing the password. Type a username payload that makes the WHERE clause always true.',
            field:'Username', placeholder:"admin' OR '1'='1",
            test:function(v){ v=v.toLowerCase().replace(/\s+/g,''); return /('|%27)(or|\|\|)('?1'?='?1|'?'='?'|true)/.test(v) || v.indexOf("'or'1'='1")!==-1 || v.indexOf("'or1=1--")!==-1 || /'or.*=.*--/.test(v); },
            success:'Logged in as admin. The injected <code>OR \'1\'=\'1\'</code> made the WHERE clause always true, so the first row (admin) was returned.',
            flag:'flag{sqli_auth_bypass}', fix:'Use parameterized queries / prepared statements so input is never parsed as SQL. Never concatenate user input into queries.'
        },
        {
            id:'idor', cat:'A01', title:'Broken Access Control: IDOR',
            scenario:'After logging in you land on your own invoice at:',
            code:'GET /api/invoice?id=1007   (your account)',
            prompt:'The server never checks that the invoice belongs to you. Request another customer\u2019s invoice by changing the id. Enter an id that is not 1007.',
            field:'id', placeholder:'1008',
            test:function(v){ v=v.trim(); return /^\d{3,5}$/.test(v) && v!=='1007'; },
            success:'You pulled invoice #{V}, which belongs to a different customer, including their IBAN and balance. The API authenticated you but never authorized the object.',
            flag:'flag{idor_horizontal_access}', fix:'Enforce object-level authorization on every request: check that the logged-in user owns the resource. Use unguessable IDs as defense in depth, not as the control.'
        },
        {
            id:'xss', cat:'A03', title:'Cross-Site Scripting (reflected)',
            scenario:'The search page echoes your query straight back into the HTML:',
            code:'<p>No results for: <?= $_GET["q"] ?></p>',
            prompt:'Inject JavaScript that would run in a victim\u2019s browser. Enter a payload that executes script.',
            field:'Search query', placeholder:'<script>alert(document.cookie)</script>',
            test:function(v){ return /<script\b[^>]*>[\s\S]*<\/script>/i.test(v) || /<img[^>]+onerror\s*=/i.test(v) || /<svg[^>]+onload\s*=/i.test(v) || /on\w+\s*=\s*["']?[^"']*(alert|document|fetch)/i.test(v); },
            success:'Your script was reflected unescaped and executed. In a real attack this runs in the victim\u2019s session, stealing cookies or acting as them.',
            flag:'flag{reflected_xss_fired}', fix:'Contextually output-encode all user data (HTML-encode by default), set a strict Content-Security-Policy, and use frameworks that auto-escape.'
        },
        {
            id:'cmdi', cat:'A03', title:'OS Command Injection',
            scenario:'A network tools page runs your input in a shell:',
            code:'system("ping -c1 " . $_GET["host"])',
            prompt:'The host field is passed to a shell unsanitised. Chain a second command onto a normal host to read a file.',
            field:'host', placeholder:'8.8.8.8; cat /etc/passwd',
            test:function(v){ return /[;&|`]|\$\(|\|\||&&/.test(v) && /(cat|ls|id|whoami|uname|curl|wget|nc)\b/i.test(v); },
            success:'The shell ran your ping AND your injected command:<br><code>root:x:0:0:root:/root:/bin/bash ...</code><br>Full command execution on the server.',
            flag:'flag{command_injection_rce}', fix:'Never pass user input to a shell. Use language-native libraries (no shell), allow-list input, and if a shell is unavoidable, pass arguments as an array with no shell interpolation.'
        },
        {
            id:'auth', cat:'A07', title:'Identification & Authentication Failures',
            scenario:'An admin panel has no rate limiting and ships with a well-known default credential pair.',
            code:'POST /admin/login   user=admin  pass=????',
            prompt:'Guess the default administrator password that ships with many appliances.',
            field:'Password', placeholder:'try a common default',
            test:function(v){ v=v.trim().toLowerCase(); return ['admin','password','admin123','changeme','123456','default','root'].indexOf(v)!==-1; },
            success:'Access granted. The account used a default/weak password and there was no lockout or MFA to stop guessing.',
            flag:'flag{default_creds_admin}', fix:'Force a password change on first use, ban known-weak passwords, add rate limiting and lockout, and require MFA on administrative accounts.'
        }
    ];

    var solved={}, score=0;

    ready(function(){
        if(!$('#owasp-app')) return;
        render();
    });

    function render(){
        var done=Object.keys(solved).length;
        $('#owasp-progress').innerHTML='<div class="ow-prog-h">Progress</div><div class="ow-prog-bar"><span style="width:'+(done/CHALLENGES.length*100)+'%"></span></div><div class="ow-prog-t">'+done+' of '+CHALLENGES.length+' solved &middot; '+score+' pts</div>';
        $('#owasp-list').innerHTML=CHALLENGES.map(function(c,i){
            var s=solved[c.id];
            return '<div class="ow-card'+(s?' solved':'')+'" id="ow-'+c.id+'">'+
                '<div class="ow-card-h" data-t="'+c.id+'"><span class="ow-cat">'+c.cat+'</span><span class="ow-title">'+esc(c.title)+'</span><span class="ow-state">'+(s?'<i class="fas fa-flag-checkered"></i> solved':'<i class="fas fa-chevron-down"></i>')+'</span></div>'+
                '<div class="ow-body" id="ow-body-'+c.id+'">'+
                    '<p class="ow-scenario">'+esc(c.scenario)+'</p>'+
                    '<pre class="ow-code">'+esc(c.code)+'</pre>'+
                    '<p class="ow-task"><i class="fas fa-crosshairs"></i> '+esc(c.prompt)+'</p>'+
                    '<div class="ow-tryline"><span class="ow-flabel">'+esc(c.field)+'</span><input class="ow-input" id="ow-in-'+c.id+'" type="text" placeholder="'+esc(c.placeholder)+'" spellcheck="false"><button class="ow-go" data-go="'+c.id+'">Attack</button></div>'+
                    '<div class="ow-result" id="ow-res-'+c.id+'"></div>'+
                '</div></div>';
        }).join('');
        $$('#owasp-list .ow-card-h').forEach(function(h){ h.addEventListener('click', function(){ var b=$('#ow-body-'+h.dataset.t); b.classList.toggle('open'); }); });
        $$('#owasp-list .ow-go').forEach(function(b){ b.addEventListener('click', function(e){ e.stopPropagation(); attempt(b.dataset.go); }); });
        $$('#owasp-list .ow-input').forEach(function(inp){ inp.addEventListener('keydown', function(e){ if(e.key==='Enter') attempt(inp.id.replace('ow-in-','')); }); });
        // open first unsolved
        var firstUnsolved=CHALLENGES.find(function(c){return !solved[c.id];});
        if(firstUnsolved){ var fb=$('#ow-body-'+firstUnsolved.id); if(fb) fb.classList.add('open'); }
    }

    function attempt(id){
        var c=CHALLENGES.find(function(x){return x.id===id;}); var inp=$('#ow-in-'+id); var res=$('#ow-res-'+id);
        var v=inp.value;
        if(!v.trim()){ res.className='ow-result show err'; res.innerHTML='Enter a payload first.'; return; }
        if(c.test(v)){
            res.className='ow-result show ok';
            res.innerHTML='<div class="ow-ok-h"><i class="fas fa-check-circle"></i> Exploit succeeded</div><p>'+c.success.replace('{V}', esc(v.trim()))+'</p><div class="ow-flag">'+esc(c.flag)+'</div><div class="ow-fix"><strong>How to fix it:</strong> '+esc(c.fix)+'</div>';
            if(!solved[id]){ solved[id]=true; score+=20; $('#owasp-progress').innerHTML=''; render(); setTimeout(function(){ var b=$('#ow-body-'+id); if(b) b.classList.add('open'); var r=$('#ow-res-'+id); if(r){ r.className='ow-result show ok'; r.innerHTML='<div class="ow-ok-h"><i class="fas fa-check-circle"></i> Solved</div><p>'+c.success.replace('{V}', esc(v.trim()))+'</p><div class="ow-flag">'+esc(c.flag)+'</div><div class="ow-fix"><strong>How to fix it:</strong> '+esc(c.fix)+'</div>'; } }, 30);
                if(Object.keys(solved).length===CHALLENGES.length) toast('All OWASP challenges solved. Score: '+score);
                else toast('Solved: '+c.title);
            }
        } else {
            res.className='ow-result show err';
            res.innerHTML='<i class="fas fa-xmark"></i> That did not trigger the vulnerability. '+hint(c);
        }
    }
    function hint(c){
        var h={ sqli:'Think about closing the quote and adding an always-true OR condition.', idor:'Just change the numeric id to another customer\u2019s value.', xss:'You need an HTML tag that executes JavaScript.', cmdi:'Use a shell metacharacter to chain a second command.', auth:'Try the most common default admin password.' };
        return h[c.id]||'';
    }
    function toast(m){ if(window.SX&&window.SX.toast){window.SX.toast(m,'ok');return;} var d=document.createElement('div'); d.className='ow-toast'; d.textContent=m; document.body.appendChild(d); setTimeout(function(){d.classList.add('show');},10); setTimeout(function(){d.classList.remove('show');setTimeout(function(){d.remove();},300);},2800); }
})();
