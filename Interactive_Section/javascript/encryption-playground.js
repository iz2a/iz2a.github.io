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