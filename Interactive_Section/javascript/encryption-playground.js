document.addEventListener('DOMContentLoaded', function() {
            // Tab switching logic
            const tabs = document.querySelectorAll('.algorithm-tab');
            tabs.forEach(tab => {
                tab.addEventListener('click', function() {
                    const algorithm = this.getAttribute('data-algorithm');

                    // Update active tab
                    tabs.forEach(t => t.classList.remove('active'));
                    this.classList.add('active');

                    // Update active content
                    document.querySelectorAll('.algorithm-content').forEach(content => {
                        content.classList.remove('active');
                    });

                    document.getElementById(`${algorithm}-content`).classList.add('active');
                    document.getElementById(`${algorithm}-visual`).classList.add('active');
                });
            });

            // Caesar Cipher Implementation
            document.getElementById('caesar-go').addEventListener('click', function() {
                const text = document.getElementById('caesar-text').value;
                const shift = parseInt(document.getElementById('caesar-shift').value);
                const action = document.querySelector('input[name="caesar-action"]:checked').value;

                const result = caesarCipher(text, shift, action);
                document.getElementById('caesar-output').innerHTML = `<pre>${result}</pre>`;

                // Update visualization with the actual content
                updateCaesarVisualization(text.substring(0, 5).toUpperCase(), shift);
            });

            // Vigenere Cipher Implementation
            document.getElementById('vigenere-go').addEventListener('click', function() {
                const text = document.getElementById('vigenere-text').value;
                const key = document.getElementById('vigenere-key').value;
                const action = document.querySelector('input[name="vigenere-action"]:checked').value;

                const result = vigenereCipher(text, key, action);
                document.getElementById('vigenere-output').innerHTML = `<pre>${result}</pre>`;

                // Update visualization
                updateVigenereVisualization(text.substring(0, 5).toUpperCase(), key.toUpperCase());
            });

            // AES Implementation
            document.getElementById('aes-go').addEventListener('click', function() {
                const text = document.getElementById('aes-text').value;
                const key = document.getElementById('aes-key').value;
                const action = document.querySelector('input[name="aes-action"]:checked').value;

                try {
                    const result = aesEncryptDecrypt(text, key, action);
                    document.getElementById('aes-output').innerHTML = `<pre>${result}</pre>`;
                } catch (error) {
                    document.getElementById('aes-output').innerHTML = `<pre style="color: #dc3545;">Error: ${error.message}</pre>`;
                }
            });

            // Update AES key length display
            document.getElementById('aes-key').addEventListener('input', function() {
                const keyLength = this.value.length;
                let aesType = "";

                if (keyLength <= 16) {
                    aesType = "AES-128";
                } else if (keyLength <= 24) {
                    aesType = "AES-192";
                } else {
                    aesType = "AES-256";
                }

                document.querySelector('#aes-key-length span').textContent = keyLength;
                document.querySelector('#aes-key-length').innerHTML = `Current key length: <span>${keyLength}</span> characters (${aesType})`;
            });

            // RSA Implementation
            let rsaKeys = null;
            let rsaEncryptedMessage = null;

            document.getElementById('rsa-generate').addEventListener('click', function() {
                rsaKeys = generateRSAKeys();
                document.getElementById('rsa-public-key').innerHTML = `<pre>e: ${rsaKeys.publicKey.e}\nn: ${rsaKeys.publicKey.n}</pre>`;
                document.getElementById('rsa-private-key').innerHTML = `<pre>d: ${rsaKeys.privateKey.d}\nn: ${rsaKeys.privateKey.n}</pre>`;
            });

            document.getElementById('rsa-encrypt').addEventListener('click', function() {
                if (!rsaKeys) {
                    document.getElementById('rsa-output').innerHTML = `<pre style="color: #dc3545;">Please generate keys first</pre>`;
                    return;
                }

                const text = document.getElementById('rsa-text').value;
                try {
                    rsaEncryptedMessage = rsaEncrypt(text, rsaKeys.publicKey);
                    document.getElementById('rsa-output').innerHTML = `<pre>${rsaEncryptedMessage}</pre>`;
                } catch (error) {
                    document.getElementById('rsa-output').innerHTML = `<pre style="color: #dc3545;">Error: ${error.message}</pre>`;
                }
            });

            document.getElementById('rsa-decrypt').addEventListener('click', function() {
                if (!rsaKeys || !rsaEncryptedMessage) {
                    document.getElementById('rsa-output').innerHTML = `<pre style="color: #dc3545;">Please encrypt a message first</pre>`;
                    return;
                }

                try {
                    const decrypted = rsaDecrypt(rsaEncryptedMessage, rsaKeys.privateKey);
                    document.getElementById('rsa-output').innerHTML = `<pre>${decrypted}</pre>`;
                } catch (error) {
                    document.getElementById('rsa-output').innerHTML = `<pre style="color: #dc3545;">Error: ${error.message}</pre>`;
                }
            });

            // Base64 Implementation
            document.getElementById('base64-go').addEventListener('click', function() {
                const text = document.getElementById('base64-text').value;
                const action = document.querySelector('input[name="base64-action"]:checked').value;

                try {
                    const result = action === 'encode' ? btoa(text) : atob(text);
                    document.getElementById('base64-output').innerHTML = `<pre>${result}</pre>`;
                } catch (error) {
                    document.getElementById('base64-output').innerHTML = `<pre style="color: #dc3545;">Error: ${error.message}</pre>`;
                }
            });

            // Generate initial RSA keys
            document.getElementById('rsa-generate').click();

            // Caesar Cipher Function
            function caesarCipher(text, shift, action) {
                // Adjust shift for decryption
                if (action === 'decrypt') {
                    shift = (26 - shift) % 26;
                }

                return text.split('').map(char => {
                    const code = char.charCodeAt(0);

                    // Uppercase letters (A-Z: 65-90)
                    if (code >= 65 && code <= 90) {
                        return String.fromCharCode(((code - 65 + shift) % 26) + 65);
                    }
                    // Lowercase letters (a-z: 97-122)
                    else if (code >= 97 && code <= 122) {
                        return String.fromCharCode(((code - 97 + shift) % 26) + 97);
                    }
                    // Non-alphabetic characters
                    else {
                        return char;
                    }
                }).join('');
            }

            // Update Caesar Visualization
            function updateCaesarVisualization(text, shift) {
                const visualContainer = document.getElementById('caesar-visual-example');
                visualContainer.innerHTML = '';

                for (let i = 0; i < text.length; i++) {
                    const char = text[i];
                    const code = char.charCodeAt(0);

                    if (code >= 65 && code <= 90) {
                        const encryptedChar = String.fromCharCode(((code - 65 + shift) % 26) + 65);

                        const charBlock = document.createElement('div');
                        charBlock.className = 'char-block';
                        charBlock.innerHTML = `
                            <div class="char-original">${char}</div>
                            <div class="char-binary">→ ${encryptedChar}</div>
                        `;

                        visualContainer.appendChild(charBlock);
                    }
                }
            }

            // Vigenere Cipher Function
            function vigenereCipher(text, key, action) {
                if (!key) {
                    return "Error: Key cannot be empty";
                }

                // Expand the key to match text length
                let expandedKey = '';
                for (let i = 0; i < text.length; i++) {
                    expandedKey += key[i % key.length];
                }

                return text.split('').map((char, i) => {
                    const charCode = char.charCodeAt(0);
                    const keyChar = expandedKey[i].toUpperCase();
                    const keyCode = keyChar.charCodeAt(0) - 65;  // A=0, B=1, etc.

                    // Process only alphabetic characters
                    if ((charCode >= 65 && charCode <= 90) || (charCode >= 97 && charCode <= 122)) {
                        const isUpperCase = charCode >= 65 && charCode <= 90;
                        const base = isUpperCase ? 65 : 97;

                        if (action === 'encrypt') {
                            return String.fromCharCode(((charCode - base + keyCode) % 26) + base);
                        } else {
                            return String.fromCharCode(((charCode - base - keyCode + 26) % 26) + base);
                        }
                    } else {
                        return char; // Non-alphabetic character
                    }
                }).join('');
            }

            // Update Vigenere Visualization
            function updateVigenereVisualization(text, key) {
                const visualContainer = document.getElementById('vigenere-visual-example');
                visualContainer.innerHTML = '';

                // Expand the key to match text length
                let expandedKey = '';
                for (let i = 0; i < text.length; i++) {
                    expandedKey += key[i % key.length];
                }

                for (let i = 0; i < text.length; i++) {
                    const char = text[i];
                    const keyChar = expandedKey[i];
                    const charCode = char.charCodeAt(0);
                    const keyCode = keyChar.charCodeAt(0) - 65;  // A=0, B=1, etc.

                    if (charCode >= 65 && charCode <= 90) {
                        const encryptedChar = String.fromCharCode(((charCode - 65 + keyCode) % 26) + 65);

                        const charBlock = document.createElement('div');
                        charBlock.className = 'char-block';
                        charBlock.innerHTML = `
                            <div class="char-original">${char} (+${keyChar})</div>
                            <div class="char-binary">→ ${encryptedChar}</div>
                        `;

                        visualContainer.appendChild(charBlock);
                    }
                }
            }

            // AES Encryption/Decryption Function
            function aesEncryptDecrypt(text, key, action) {
                // This is a simplified version for educational purposes
                // In a real implementation, use Web Crypto API or a library

                // For demonstration, we'll use a basic symmetric substitution
                const substitution = {};
                let seed = 0;

                // Create a deterministic substitution map based on the key
                for (let i = 0; i < key.length; i++) {
                    seed += key.charCodeAt(i);
                }

                for (let i = 0; i < 256; i++) {
                    substitution[String.fromCharCode(i)] = String.fromCharCode((i + seed) % 256);
                }

                if (action === 'encrypt') {
                    return text.split('').map(char => {
                        return substitution[char] || char;
                    }).join('');
                } else {
                    // Create reverse mapping for decryption
                    const reverseSubstitution = {};
                    for (const [char, subChar] of Object.entries(substitution)) {
                        reverseSubstitution[subChar] = char;
                    }

                    return text.split('').map(char => {
                        return reverseSubstitution[char] || char;
                    }).join('');
                }
            }

            // RSA Key Generation Function
            function generateRSAKeys() {
                // This is a simplified RSA implementation for demonstration
                // In real applications, use a proper cryptographic library

                // Generate two "prime" numbers (not actually prime but simplified)
                const p = 61;
                const q = 53;
                const n = p * q;
                const phi = (p - 1) * (q - 1);

                // Choose e (public exponent)
                const e = 17;  // Common value, relatively prime to phi

                // Calculate d (private exponent) such that (d * e) % phi = 1
                let d = 0;
                for (let i = 0; i < phi; i++) {
                    if ((i * e) % phi === 1) {
                        d = i;
                        break;
                    }
                }

                return {
                    publicKey: { e, n },
                    privateKey: { d, n }
                };
            }

            // RSA Encryption Function
            function rsaEncrypt(text, publicKey) {
                // Convert text to numbers (a simple approach)
                const numbers = text.split('').map(char => char.charCodeAt(0));

                // Encrypt each number
                const encrypted = numbers.map(num => {
                    // c = m^e mod n (simplified for small numbers)
                    let result = 1;
                    for (let i = 0; i < publicKey.e; i++) {
                        result = (result * num) % publicKey.n;
                    }
                    return result;
                });

                return encrypted.join(',');
            }

            // RSA Decryption Function
            function rsaDecrypt(encryptedText, privateKey) {
                // Parse encrypted values
                const encrypted = encryptedText.split(',').map(Number);

                // Decrypt each number
                const decrypted = encrypted.map(num => {
                    // m = c^d mod n (simplified for small numbers)
                    let result = 1;
                    for (let i = 0; i < privateKey.d; i++) {
                        result = (result * num) % privateKey.n;
                    }
                    return String.fromCharCode(result);
                });

                return decrypted.join('');
            }

            // Mobile menu toggle
            const menuBtn = document.querySelector('.mobile-menu-btn');
            const navLinks = document.querySelector('.nav-links');

            if (menuBtn) {
                menuBtn.addEventListener('click', function () {
                    navLinks.classList.toggle('active');
                });
            }

            // Close menu when clicking on a link
            const links = document.querySelectorAll('.nav-links a');
            links.forEach(link => {
                link.addEventListener('click', () => {
                    navLinks.classList.remove('active');
                });
            });
        });
/* ==========================================================================
   Password analyzer + generator (absorbed from the Password Security lab).
   Wires the existing Password tab: live strength scoring, criteria checklist,
   entropy-based crack-time estimate, actionable feedback, and a generator.
   ========================================================================== */
(function () {
    'use strict';
    function ready(fn){ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',fn); else fn(); }
    ready(function(){
        var input=document.getElementById('password-input'); if(!input) return;
        var crit={ length:document.getElementById('criteria-length'), uppercase:document.getElementById('criteria-uppercase'), lowercase:document.getElementById('criteria-lowercase'), numbers:document.getElementById('criteria-numbers'), special:document.getElementById('criteria-special') };
        var fill=document.getElementById('strength-meter-fill'), text=document.getElementById('strength-text'), fb=document.getElementById('feedback-list'), result=document.getElementById('strength-result');
        var toggle=document.getElementById('toggle-password');
        var COMMON=['password','123456','qwerty','admin','letmein','welcome','iloveyou','monkey','dragon','abc123','111111','password1','123456789'];

        function setCrit(el,ok){ if(!el)return; el.className='criteria-item '+(ok?'criteria-met':'criteria-unmet'); var i=el.querySelector('i'); if(i) i.className=ok?'fas fa-check-circle':'fas fa-times-circle'; }
        function charsetSize(p){ var n=0; if(/[a-z]/.test(p))n+=26; if(/[A-Z]/.test(p))n+=26; if(/[0-9]/.test(p))n+=10; if(/[^A-Za-z0-9]/.test(p))n+=33; return n||1; }
        function crackTime(p){ var bits=p.length*Math.log2(charsetSize(p)); var guesses=Math.pow(2,bits)/2; var perSec=1e10; var secs=guesses/perSec;
            if(secs<1) return 'instantly'; var u=[['year',31557600],['day',86400],['hour',3600],['minute',60],['second',1]];
            for(var i=0;i<u.length;i++){ if(secs>=u[i][1]){ var v=secs/u[i][1]; if(v>1e6) return 'centuries'; return Math.round(v).toLocaleString()+' '+u[i][0]+(Math.round(v)!==1?'s':''); } } return 'instantly'; }

        function evaluate(){
            var p=input.value||''; var c={ length:p.length>=8, uppercase:/[A-Z]/.test(p), lowercase:/[a-z]/.test(p), numbers:/[0-9]/.test(p), special:/[^A-Za-z0-9]/.test(p) };
            Object.keys(c).forEach(function(k){ setCrit(crit[k], c[k]); });
            if(result) result.style.display='block';
            var met=Object.keys(c).filter(function(k){return c[k];}).length;
            var longBonus = p.length>=12 ? 1 : 0; var extraLong = p.length>=16 ? 1 : 0;
            var score=met+longBonus+extraLong; // 0..7
            var isCommon=COMMON.indexOf(p.toLowerCase())!==-1 || COMMON.some(function(w){return p.toLowerCase().indexOf(w)!==-1 && p.length<12;});
            if(isCommon) score=Math.min(score,1);
            var pct=Math.min(100, Math.round(score/7*100));
            var label,color;
            if(p.length===0){ label='';color='#e3e7ec';pct=0; }
            else if(score<=2){ label='Weak';color='#d64545'; }
            else if(score<=3){ label='Fair';color='#e8833a'; }
            else if(score<=4){ label='Good';color='#e0a94a'; }
            else if(score<=5){ label='Strong';color='#3d8bbe'; }
            else { label='Very strong';color='#1f7a4d'; }
            if(fill){ fill.style.width=pct+'%'; fill.style.background=color; }
            if(text){ text.textContent=p.length?(label+' \u2014 would take about '+crackTime(p)+' to crack'):''; text.style.color=color; }
            if(fb){ var tips=[];
                if(isCommon) tips.push('This is a very common or breached password. Never use it.');
                if(!c.length) tips.push('Use at least 8 characters; 12 or more is much better.');
                if(p.length&&p.length<12) tips.push('Longer passwords beat complex short ones. Aim for a 12+ character passphrase.');
                if(!c.uppercase||!c.lowercase) tips.push('Mix uppercase and lowercase letters.');
                if(!c.numbers) tips.push('Add numbers.');
                if(!c.special) tips.push('Add special characters.');
                if(!tips.length) tips.push('Great password. Store it in a password manager and enable MFA.');
                fb.innerHTML=tips.map(function(t){return '<li>'+t.replace(/[<>]/g,'')+'</li>';}).join('');
            }
        }
        input.addEventListener('input', evaluate);
        var testBtn=document.getElementById('test-password'); if(testBtn) testBtn.addEventListener('click', evaluate);
        if(toggle) toggle.addEventListener('click', function(){ input.type=input.type==='password'?'text':'password'; var i=toggle.querySelector('i'); if(i) i.className=input.type==='password'?'fas fa-eye':'fas fa-eye-slash'; });

        // generator injected into the password panel
        var host=document.getElementById('password-content');
        if(host && !document.getElementById('pw-gen')){
            var g=document.createElement('div'); g.className='card'; g.id='pw-gen'; g.style.marginTop='20px';
            g.innerHTML='<h2 class="card-title"><i class="fas fa-key"></i> Password generator</h2>'+
                '<div class="form-group"><label class="form-label">Length: <span id="pw-len-v">16</span></label><input type="range" id="pw-len" min="8" max="40" value="16" style="width:100%;"></div>'+
                '<div style="display:flex;flex-wrap:wrap;gap:14px;margin:10px 0;">'+
                '<label><input type="checkbox" id="pw-up" checked> Uppercase</label><label><input type="checkbox" id="pw-lo" checked> Lowercase</label><label><input type="checkbox" id="pw-nu" checked> Numbers</label><label><input type="checkbox" id="pw-sp" checked> Symbols</label></div>'+
                '<button id="pw-make" class="btn btn-block">Generate</button>'+
                '<div id="pw-made" style="display:none;margin-top:14px;align-items:center;gap:10px;"><code id="pw-made-v" style="flex:1;background:#0f1720;color:#7cffb2;padding:12px;border-radius:8px;font-family:monospace;word-break:break-all;"></code> <button id="pw-copy" class="btn">Copy</button></div>';
            host.appendChild(g);
            var lenEl=document.getElementById('pw-len'), lenV=document.getElementById('pw-len-v');
            lenEl.addEventListener('input', function(){ lenV.textContent=lenEl.value; });
            document.getElementById('pw-make').addEventListener('click', function(){
                var sets=''; if(document.getElementById('pw-up').checked)sets+='ABCDEFGHJKLMNPQRSTUVWXYZ'; if(document.getElementById('pw-lo').checked)sets+='abcdefghijkmnopqrstuvwxyz'; if(document.getElementById('pw-nu').checked)sets+='23456789'; if(document.getElementById('pw-sp').checked)sets+='!@#$%^&*()-_=+[]{}';
                if(!sets){ sets='abcdefghijkmnopqrstuvwxyz'; }
                var n=parseInt(lenEl.value,10), out=''; var arr=new Uint32Array(n); (window.crypto||window.msCrypto).getRandomValues(arr);
                for(var i=0;i<n;i++){ out+=sets[arr[i]%sets.length]; }
                document.getElementById('pw-made').style.display='flex'; document.getElementById('pw-made-v').textContent=out;
                input.value=out; input.type='text'; evaluate();
            });
            document.getElementById('pw-copy').addEventListener('click', function(){ var v=document.getElementById('pw-made-v').textContent; if(navigator.clipboard) navigator.clipboard.writeText(v); });
        }
    });
})();
