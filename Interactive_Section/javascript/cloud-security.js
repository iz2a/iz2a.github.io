/* ==========================================================================
   Cloud Security Sandbox  (2026, rebuilt)
   A browser-only cloud posture lab modeled on AWS Security Hub / CSPM tools.
   The visitor hardens a newly deployed environment across five domains; every
   control maps to a real best practice (CIS AWS Foundations, least privilege,
   defense in depth) and feeds a live findings report with severities and
   remediation. No alerts, no fake output.
   ========================================================================== */
(function () {
    'use strict';
    function ready(fn){ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',fn); else fn(); }
    var $=function(s,r){return (r||document).querySelector(s);};
    var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));};

    /* ---- state: findings raised per domain ---- */
    var STATE = { iam:null, sg:null, s3:null, log:null, ir:null };

    /* severity weights for the posture score */
    var SEV = { critical:'#d64545', high:'#e8833a', medium:'#e0a94a', low:'#3d8bbe', pass:'#2e9e6b' };

    function finding(sev, title, detail, remediation){
        return { sev:sev, title:title, detail:detail, remediation:remediation };
    }

    /* ============================ IAM ============================ */
    function scoreIAM(){
        var f=[];
        var name=($('#iam-role-name').value||'').trim();
        var svc=$('#iam-service').value;
        var perm=(document.querySelector('input[name="iam-perm"]:checked')||{}).value;
        var mfa=$('#iam-mfa').checked;
        var wildcard=$('#iam-wildcard').checked;
        var cond=$('#iam-condition').value;

        if(!name){ return {error:'Enter a role name to evaluate the policy.'}; }
        if(!perm){ return {error:'Choose a permission level.'}; }

        // least privilege
        if(perm==='admin'){ f.push(finding('critical','Over-privileged role',
            'The role grants full administrative access ('+svc+':*). A compromise of this role compromises the whole account.',
            'Grant only the specific actions the workload needs. Start from zero and add actions as required.')); }
        else if(perm==='write'){ f.push(finding('low','Read/write access granted',
            'Read and write is reasonable for a workload that must modify '+svc+' resources, but confirm it needs write.',
            'If the workload only reads data, downgrade to read-only.')); }
        else { f.push(finding('pass','Least privilege: read-only',
            'The role is scoped to read-only actions on '+svc+', which follows least privilege.', null)); }

        // wildcards in resource
        if(wildcard){ f.push(finding('high','Wildcard resource ("Resource": "*")',
            'The policy applies to every resource in the account rather than specific ARNs.',
            'Scope the policy to explicit resource ARNs, for example a single bucket or table.')); }
        else { f.push(finding('pass','Scoped resources',
            'The policy targets specific resource ARNs rather than "*".', null)); }

        // MFA
        if(mfa){ f.push(finding('pass','MFA condition present',
            'The policy requires multi-factor authentication (aws:MultiFactorAuthPresent).', null)); }
        else { f.push(finding('medium','No MFA condition',
            'Sensitive actions can be performed without multi-factor authentication.',
            'Add a condition requiring aws:MultiFactorAuthPresent = true for privileged actions.')); }

        // conditions
        if(cond==='none'){ f.push(finding('low','No request conditions',
            'The policy has no conditions limiting where or how it can be used.',
            'Constrain by source IP (aws:SourceIp), VPC endpoint, or time where practical.')); }
        else { f.push(finding('pass','Request condition applied',
            'Access is constrained by '+cond+'.', null)); }

        return { findings:f, policy:buildPolicyJSON(name,svc,perm,wildcard,mfa,cond) };
    }

    function buildPolicyJSON(name,svc,perm,wildcard,mfa,cond){
        var actions = perm==='read' ? [svc+':Get*', svc+':List*', svc+':Describe*']
                    : perm==='write' ? [svc+':Get*', svc+':List*', svc+':Put*', svc+':Update*']
                    : [svc+':*'];
        var stmt = { Effect:'Allow', Action:actions, Resource: wildcard ? '*' : 'arn:aws:'+svc+':::'+name.toLowerCase().replace(/[^a-z0-9]+/g,'-')+'/*' };
        var condition={};
        if(mfa) condition['Bool']={'aws:MultiFactorAuthPresent':'true'};
        if(cond==='sourceip') condition['IpAddress']={'aws:SourceIp':'10.0.0.0/16'};
        if(cond==='timeofday') condition['DateGreaterThan']={'aws:CurrentTime':'2026-01-01T08:00:00Z'};
        if(Object.keys(condition).length) stmt.Condition=condition;
        return JSON.stringify({ Version:'2012-10-17', Statement:[stmt] }, null, 2);
    }

    /* ===================== SECURITY GROUPS ===================== */
    var sgRules=[]; // {tier,proto,port,source,desc}
    var DANGER_PORTS={22:'SSH',3389:'RDP',3306:'MySQL',5432:'PostgreSQL',27017:'MongoDB',6379:'Redis',9200:'Elasticsearch',1433:'MSSQL'};

    function evalSG(){
        var f=[];
        if(!sgRules.length){ return {error:'Add at least one inbound rule to evaluate the security groups.'}; }
        sgRules.forEach(function(r){
            var open = /0\.0\.0\.0\/0/.test(r.source);
            var svc = DANGER_PORTS[r.port];
            if(open && svc && (r.port==22||r.port==3389)){
                f.push(finding('critical', svc+' open to the internet',
                    'Port '+r.port+' ('+svc+') on the '+r.tier+' tier accepts connections from 0.0.0.0/0. This is a top cause of cloud compromise.',
                    'Restrict '+svc+' to a bastion host, VPN CIDR, or use SSM Session Manager instead of opening the port.'));
            } else if(open && svc){
                f.push(finding('high', svc+' database exposed to the internet',
                    'Port '+r.port+' ('+svc+') on the '+r.tier+' tier is reachable from any address. Databases should never be internet facing.',
                    'Limit the source to the application tier security group only.'));
            } else if(open && (r.port==80||r.port==443)){
                f.push(finding('pass','Public web port '+r.port,
                    'Port '+r.port+' open to the internet is expected for a public web tier.', null));
            } else if(open){
                f.push(finding('medium','Port '+r.port+' open to the internet',
                    'The '+r.tier+' tier exposes port '+r.port+' to 0.0.0.0/0.',
                    'Confirm this port must be public; otherwise restrict the source range.'));
            } else {
                f.push(finding('pass','Scoped rule on port '+r.port,
                    r.tier+' tier allows port '+r.port+' only from '+r.source+'.', null));
            }
        });
        return { findings:f };
    }

    /* ===================== S3 / STORAGE ===================== */
    function scoreS3(){
        var f=[];
        var blockPublic=$('#s3-block-public').checked;
        var enc=$('#s3-encryption').value;
        var versioning=$('#s3-versioning').checked;
        var logging=$('#s3-logging').checked;
        var tls=$('#s3-tls').checked;

        if(!blockPublic){ f.push(finding('critical','Public access not blocked',
            'S3 Block Public Access is off, so bucket policies or ACLs could expose data publicly. This is the most common cloud data breach.',
            'Enable S3 Block Public Access at the account and bucket level.')); }
        else { f.push(finding('pass','Block Public Access enabled','The bucket cannot be made public by ACL or policy.',null)); }

        if(enc==='none'){ f.push(finding('high','No encryption at rest',
            'Objects are stored unencrypted.','Enable default encryption with SSE-S3 or, for sensitive data, SSE-KMS.')); }
        else if(enc==='sse-s3'){ f.push(finding('low','SSE-S3 encryption',
            'Server-side encryption with S3-managed keys is on. Adequate for most data.',
            'For regulated or sensitive data, use SSE-KMS for key control and audit.')); }
        else { f.push(finding('pass','SSE-KMS encryption','Encryption at rest uses KMS with full key audit and rotation.',null)); }

        if(!tls){ f.push(finding('medium','No TLS-only policy',
            'The bucket accepts plaintext HTTP requests.','Add a bucket policy denying requests where aws:SecureTransport is false.')); }
        else { f.push(finding('pass','TLS enforced','A policy denies non-HTTPS access (aws:SecureTransport).',null)); }

        if(!versioning){ f.push(finding('low','Versioning disabled',
            'Overwritten or deleted objects cannot be recovered, and ransomware could destroy data.',
            'Enable versioning, ideally with MFA delete for critical buckets.')); }
        else { f.push(finding('pass','Versioning enabled','Object versions are retained for recovery.',null)); }

        if(!logging){ f.push(finding('low','Access logging disabled',
            'There is no record of who accessed the bucket.','Enable server access logging or log S3 data events in CloudTrail.')); }
        else { f.push(finding('pass','Access logging enabled','Bucket access is logged for audit.',null)); }

        return { findings:f };
    }

    /* ===================== LOGGING & MONITORING ===================== */
    function scoreLog(){
        var f=[];
        var map=[['log-cloudtrail','CloudTrail','critical','Management and API activity is not recorded, so there is no audit trail.','Enable a multi-region CloudTrail trail with log file validation.'],
                 ['log-flow','VPC Flow Logs','medium','Network traffic metadata is not captured, hindering investigations.','Enable VPC Flow Logs to CloudWatch or S3.'],
                 ['log-guardduty','GuardDuty','high','No managed threat detection is watching the account.','Enable GuardDuty in all regions.'],
                 ['log-config','AWS Config','medium','Resource configuration changes are not tracked against rules.','Enable AWS Config with the CIS conformance pack.']];
        map.forEach(function(m){
            if($('#'+m[0]).checked){ f.push(finding('pass',m[1]+' enabled',m[1]+' is active.',null)); }
            else { f.push(finding(m[2],m[1]+' disabled',m[3],m[4])); }
        });
        var alertOn=$('#log-alert').value;
        if(alertOn==='none'){ f.push(finding('medium','No alerting configured',
            'Findings are generated but nobody is notified.','Route GuardDuty and Config findings to SNS or a SIEM with on-call paging.')); }
        else { f.push(finding('pass','Alerting configured','High-severity findings notify '+alertOn+'.',null)); }
        return { findings:f };
    }

    /* ===================== INCIDENT RESPONSE ===================== */
    var IR_STEPS=[
        {id:'rotate', text:'Deactivate and rotate the exposed access key', correct:true, order:1},
        {id:'scope', text:'Review CloudTrail for actions taken with the key', correct:true, order:2},
        {id:'revoke', text:'Revoke active sessions and temporary credentials derived from it', correct:true, order:3},
        {id:'contain', text:'Quarantine any resources the key created or modified', correct:true, order:4},
        {id:'ignore', text:'Wait to see if the key is actually misused', correct:false},
        {id:'delete_ct', text:'Delete the CloudTrail logs to reduce noise', correct:false},
        {id:'email', text:'Email the key owner and take no further action', correct:false}
    ];

    /* ===================== REPORT ===================== */
    function allFindings(){
        var all=[];
        ['iam','sg','s3','log','ir'].forEach(function(k){ if(STATE[k]&&STATE[k].findings) all=all.concat(STATE[k].findings); });
        return all;
    }
    function posture(){
        var all=allFindings();
        if(!all.length) return null;
        var weight={critical:0,high:0,medium:0,low:0,pass:0};
        all.forEach(function(x){ weight[x.sev]++; });
        // score: start 100, subtract by severity
        var score=100 - (weight.critical*25 + weight.high*12 + weight.medium*5 + weight.low*2);
        score=Math.max(0,Math.min(100,score));
        return {score:score, weight:weight, total:all.length};
    }
    function grade(s){ return s>=90?'A':s>=80?'B':s>=70?'C':s>=55?'D':'F'; }

    function renderReport(){
        var box=$('#csp-report'); if(!box) return;
        var p=posture();
        if(!p){ box.innerHTML='<div class="csp-empty">Run the checks in each tab. Findings and your overall posture score will appear here.</div>'; return; }
        var all=allFindings().slice().sort(function(a,b){
            var o={critical:0,high:1,medium:2,low:3,pass:4}; return o[a.sev]-o[b.sev];
        });
        var head=''+
            '<div class="csp-scorecard">'+
                '<div class="csp-grade" style="background:'+(p.score>=80?SEV.pass:p.score>=55?SEV.medium:SEV.critical)+'">'+grade(p.score)+'</div>'+
                '<div class="csp-score-meta"><div class="csp-score-n">'+p.score+'<span>/100</span></div><div class="csp-score-l">Cloud posture score</div></div>'+
                '<div class="csp-sevcounts">'+
                    ['critical','high','medium','low'].map(function(s){return '<span class="csp-sevpill" style="--c:'+SEV[s]+'">'+p.weight[s]+' '+s+'</span>';}).join('')+
                    '<span class="csp-sevpill" style="--c:'+SEV.pass+'">'+p.weight.pass+' passed</span>'+
                '</div>'+
            '</div>';
        var rows=all.map(function(x){
            return '<div class="csp-finding sev-'+x.sev+'">'+
                '<div class="csp-fsev" style="background:'+SEV[x.sev]+'">'+(x.sev==='pass'?'PASS':x.sev.toUpperCase())+'</div>'+
                '<div class="csp-fbody"><div class="csp-ftitle">'+x.title+'</div>'+
                '<div class="csp-fdetail">'+x.detail+'</div>'+
                (x.remediation?'<div class="csp-frem"><strong>Remediation:</strong> '+x.remediation+'</div>':'')+
                '</div></div>';
        }).join('');
        box.innerHTML=head+'<div class="csp-findings">'+rows+'</div>';
    }

    /* ===================== WIRING ===================== */
    ready(function(){
        if(!$('#cloud-sandbox')) return;

        // tabs
        $$('.cs-tab').forEach(function(t){
            t.addEventListener('click', function(){
                $$('.cs-tab').forEach(function(x){x.classList.remove('active');});
                $$('.cs-panel').forEach(function(x){x.classList.remove('active');});
                t.classList.add('active');
                var pane=$('#cs-'+t.dataset.tab); if(pane) pane.classList.add('active');
            });
        });

        // IAM
        $('#iam-eval').addEventListener('click', function(){
            var r=scoreIAM();
            var out=$('#iam-result');
            if(r.error){ out.innerHTML='<div class="cs-note">'+r.error+'</div>'; return; }
            STATE.iam=r;
            out.innerHTML='<div class="cs-policy"><div class="cs-policy-h">Generated IAM policy</div><pre>'+escapeHtml(r.policy)+'</pre></div>'+miniFindings(r.findings);
            renderReport(); markDone('iam');
        });

        // Security groups
        $('#sg-add').addEventListener('click', function(){
            var tier=$('#sg-tier').value, port=parseInt($('#sg-port').value,10), source=$('#sg-source').value, proto=$('#sg-proto').value;
            if(!port){ $('#sg-msg').textContent='Enter a port number.'; return; }
            $('#sg-msg').textContent='';
            sgRules.push({tier:tier,port:port,source:source,proto:proto});
            renderSGRules(); STATE.sg=evalSG(); renderReport(); markDone('sg');
        });
        function renderSGRules(){
            var t=$('#sg-rules');
            if(!sgRules.length){ t.innerHTML='<div class="cs-note">No rules yet.</div>'; return; }
            t.innerHTML='<table class="cs-table"><thead><tr><th>Tier</th><th>Proto</th><th>Port</th><th>Source</th><th></th></tr></thead><tbody>'+
                sgRules.map(function(r,i){
                    var danger=/0\.0\.0\.0\/0/.test(r.source)&&DANGER_PORTS[r.port];
                    return '<tr class="'+(danger?'cs-row-danger':'')+'"><td>'+r.tier+'</td><td>'+r.proto+'</td><td>'+r.port+(DANGER_PORTS[r.port]?' <span class="cs-svc">'+DANGER_PORTS[r.port]+'</span>':'')+'</td><td>'+r.source+'</td>'+
                    '<td><button class="cs-x" data-i="'+i+'">remove</button></td></tr>';
                }).join('')+'</tbody></table>';
            $$('#sg-rules .cs-x').forEach(function(b){ b.addEventListener('click',function(){ sgRules.splice(+b.dataset.i,1); renderSGRules(); STATE.sg=sgRules.length?evalSG():null; renderReport(); }); });
        }
        renderSGRules();

        // S3
        $('#s3-eval').addEventListener('click', function(){
            STATE.s3=scoreS3();
            $('#s3-result').innerHTML=miniFindings(STATE.s3.findings);
            renderReport(); markDone('s3');
        });

        // Logging
        $('#log-eval').addEventListener('click', function(){
            STATE.log=scoreLog();
            $('#log-result').innerHTML=miniFindings(STATE.log.findings);
            renderReport(); markDone('log');
        });

        // Incident response: render selectable ordered steps
        renderIR();
        function renderIR(){
            var box=$('#ir-steps');
            box.innerHTML=IR_STEPS.map(function(s){
                return '<label class="ir-opt"><input type="checkbox" value="'+s.id+'"><span>'+s.text+'</span></label>';
            }).join('');
        }
        $('#ir-eval').addEventListener('click', function(){
            var picked=$$('#ir-steps input:checked').map(function(i){return i.value;});
            var f=[];
            var correct=IR_STEPS.filter(function(s){return s.correct;}).map(function(s){return s.id;});
            // wrong actions chosen
            IR_STEPS.forEach(function(s){
                if(!s.correct && picked.indexOf(s.id)!==-1){
                    f.push(finding('high','Incorrect action: '+s.text.toLowerCase(),
                        'This step does not help contain an exposed access key and can make things worse.',
                        'Focus on deactivating the key, scoping the blast radius from CloudTrail, and revoking derived sessions.'));
                }
            });
            var missing=correct.filter(function(c){return picked.indexOf(c)===-1;});
            missing.forEach(function(c){
                var st=IR_STEPS.find(function(s){return s.id===c;});
                f.push(finding('medium','Missed step: '+st.text.toLowerCase(),'This containment step was not selected.','Include it in your response runbook.'));
            });
            if(!f.length){ f.push(finding('pass','Exposed key handled correctly','You deactivated the key, scoped the impact, revoked derived sessions and quarantined affected resources, in the right spirit.',null)); }
            STATE.ir={findings:f}; 
            $('#ir-result').innerHTML=miniFindings(f);
            renderReport(); markDone('ir');
        });

        function markDone(k){ var el=$('.cs-tab[data-tab="'+k+'"] .cs-check'); if(el) el.style.display='inline'; }
        renderReport();
    });

    function miniFindings(f){
        return '<div class="cs-mini">'+f.map(function(x){
            return '<div class="cs-minirow sev-'+x.sev+'"><span class="cs-minisev" style="background:'+SEV[x.sev]+'">'+(x.sev==='pass'?'\u2713':'!')+'</span>'+
            '<span class="cs-minititle">'+x.title+'</span></div>';
        }).join('')+'</div>';
    }
    function escapeHtml(s){ return String(s).replace(/[&<>]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;'}[c];}); }
})();
