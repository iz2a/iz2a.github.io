 // Utility to create SHA-256 hash
        async function sha256(message) {
            const msgBuffer = new TextEncoder().encode(message);
            const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            return hashHex;
        }

        // Blockchain implementation
        class BlockchainSimulator {
            constructor() {
                this.blockchain = [];
                this.pendingTransactions = [];
                this.difficulty = 2;
                this.miningInProgress = false;

                // Initialize blockchain with genesis block
                this.createGenesisBlock();

                // Setup UI events
                this.setupEventListeners();

                // Render initial state
                this.renderBlockchain();
                this.renderPendingTransactions();
            }

            // Create the first block (genesis)
            async createGenesisBlock() {
                const genesisBlock = {
                    index: 0,
                    timestamp: new Date('2023-01-01T00:00:00Z').toISOString(),
                    transactions: [{ from: 'SYSTEM', to: 'Genesis', amount: 'N/A', timestamp: new Date('2023-01-01T00:00:00Z').toISOString() }],
                    previousHash: '0000000000000000000000000000000000000000000000000000000000000000',
                    hash: '',
                    nonce: 0
                };

                genesisBlock.hash = await this.calculateBlockHash(genesisBlock);
                this.blockchain.push(genesisBlock);
            }

            // Calculate a block's hash
            async calculateBlockHash(block) {
                const { index, timestamp, transactions, previousHash, nonce } = block;
                const blockString = JSON.stringify({ index, timestamp, transactions, previousHash, nonce });
                return await sha256(blockString);
            }

            // Add a new transaction to pending pool
            async addTransaction(from, to, amount) {
                if (!from || !to || !amount) {
                    throw new Error('Please fill in all transaction fields');
                }

                const transaction = {
                    from,
                    to,
                    amount,
                    timestamp: new Date().toISOString(),
                    signature: await this.generateSignature(from, to, amount)
                };

                this.pendingTransactions.push(transaction);
                this.renderPendingTransactions();

                return transaction;
            }

            // Generate a fake signature for demonstration
            async generateSignature(from, to, amount) {
                const data = `${from}${to}${amount}${Date.now()}`;
                const fullHash = await sha256(data);
                return fullHash.substring(0, 16); // Use first 16 chars as the signature
            }

            // Mine a new block with pending transactions
            async mineBlock() {
                if (this.pendingTransactions.length === 0) {
                    throw new Error('No pending transactions to add to a block');
                }

                if (this.miningInProgress) {
                    throw new Error('Mining already in progress');
                }

                this.miningInProgress = true;
                document.getElementById('mining-info').style.display = 'block';
                document.getElementById('mine-button').disabled = true;

                const previousBlock = this.blockchain[this.blockchain.length - 1];
                const newBlockIndex = previousBlock.index + 1;

                const newBlock = {
                    index: newBlockIndex,
                    timestamp: new Date().toISOString(),
                    transactions: [...this.pendingTransactions],
                    previousHash: previousBlock.hash,
                    hash: '',
                    nonce: 0
                };

                try {
                    // Mine the block to find a valid hash
                    const minedBlock = await this.findValidBlockHash(newBlock);
                    this.blockchain.push(minedBlock);
                    this.pendingTransactions = [];

                    // Update UI
                    this.renderBlockchain();
                    this.renderPendingTransactions();

                    document.getElementById('mining-info').style.display = 'none';
                    document.getElementById('mine-button').disabled = false;
                    this.miningInProgress = false;

                    return minedBlock;
                } catch (error) {
                    console.error('Mining error:', error);
                    document.getElementById('mining-info').style.display = 'none';
                    document.getElementById('mine-button').disabled = false;
                    this.miningInProgress = false;
                    throw error;
                }
            }

            // Find a valid hash with the required number of leading zeros
            async findValidBlockHash(block) {
                let { nonce } = block;
                let hash = '';
                const prefix = '0'.repeat(this.difficulty);
                const updateInterval = 50; // Update UI every 50 iterations

                while (!hash.startsWith(prefix)) {
                    nonce++;
                    const newBlock = { ...block, nonce };
                    hash = await this.calculateBlockHash(newBlock);

                    // Update UI occasionally to show mining progress
                    if (nonce % updateInterval === 0) {
                        document.getElementById('mining-details').innerHTML = `
                            <div>Current nonce: ${nonce}</div>
                            <div>Current hash: <span class="hash"><span class="hash-prefix">${hash.substring(0, this.difficulty)}</span>${hash.substring(this.difficulty)}</span></div>
                            <div>Target: ${prefix}...</div>
                        `;

                        // Small delay to allow UI updates
                        await new Promise(resolve => setTimeout(resolve, 0));
                    }
                }

                return { ...block, hash, nonce };
            }

            // Set mining difficulty
            setDifficulty(difficulty) {
                this.difficulty = parseInt(difficulty);
            }

            // Render the blockchain
            renderBlockchain() {
                const container = document.getElementById('blockchain-blocks');
                container.innerHTML = '';

                // Render blocks in reverse order (newest first)
                for (let i = this.blockchain.length - 1; i >= 0; i--) {
                    const block = this.blockchain[i];
                    const blockElement = document.createElement('div');
                    blockElement.className = 'block animate-in';
                    blockElement.setAttribute('data-index', block.index);

                    const hashPrefix = block.hash.substring(0, this.difficulty);
                    const hashRest = block.hash.substring(this.difficulty);

                    blockElement.innerHTML = `
                        <div class="block-header">
                            <div><strong>Block #${block.index}</strong></div>
                            <div>${new Date(block.timestamp).toLocaleString()}</div>
                        </div>
                        <div><strong>Hash:</strong> <span class="hash"><span class="hash-prefix">${hashPrefix}</span>${hashRest}</span></div>
                        <div><strong>Previous Hash:</strong> <span class="hash">${block.previousHash.substring(0, 15)}...</span></div>
                        <div class="block-details">
                            <div><strong>Transactions (${block.transactions.length}):</strong></div>
                            <div id="block-transactions-${block.index}">
                                ${block.transactions.map(tx => `
                                    <div class="transaction">
                                        <div class="transaction-header">
                                            <div>${tx.from} → ${tx.to}</div>
                                            <div>${tx.amount}</div>
                                        </div>
                                        ${tx.signature ? `<div><small>Signature: ${tx.signature}</small></div>` : ''}
                                    </div>
                                `).join('')}
                            </div>
                            <div><strong>Nonce:</strong> ${block.nonce}</div>
                        </div>
                    `;

                    // Add click event to toggle block details
                    blockElement.addEventListener('click', () => {
                        // Remove active class from all blocks
                        document.querySelectorAll('.block').forEach(el => {
                            el.classList.remove('active');
                        });

                        // Add active class to clicked block
                        blockElement.classList.add('active');
                    });

                    container.appendChild(blockElement);
                }
            }

            // Render pending transactions
            renderPendingTransactions() {
                const tableBody = document.getElementById('pending-transactions-body');
                const emptyMessage = document.getElementById('no-pending-transactions');

                tableBody.innerHTML = '';

                if (this.pendingTransactions.length === 0) {
                    document.getElementById('pending-transactions-table').style.display = 'none';
                    emptyMessage.style.display = 'block';
                    document.getElementById('mine-button').disabled = true;
                } else {
                    document.getElementById('pending-transactions-table').style.display = 'table';
                    emptyMessage.style.display = 'none';
                    document.getElementById('mine-button').disabled = false;

                    this.pendingTransactions.forEach(tx => {
                        const row = document.createElement('tr');
                        row.className = 'animate-in';
                        row.innerHTML = `
                            <td>${tx.from}</td>
                            <td>${tx.to}</td>
                            <td>${tx.amount}</td>
                            <td>${new Date(tx.timestamp).toLocaleString()}</td>
                        `;
                        tableBody.appendChild(row);
                    });
                }
            }

            // Setup UI event listeners
            setupEventListeners() {
                // Tab switching
                document.querySelectorAll('.tab').forEach(tab => {
                    tab.addEventListener('click', () => {
                        // Update active tab
                        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                        tab.classList.add('active');

                        // Show corresponding content
                        const tabId = tab.getAttribute('data-tab');
                        document.querySelectorAll('.tab-content').forEach(content => {
                            content.classList.remove('active');
                        });
                        document.getElementById(`${tabId}-tab`).classList.add('active');
                    });
                });

                // Add transaction button
                document.getElementById('add-transaction-button').addEventListener('click', async () => {
                    const from = document.getElementById('from').value;
                    const to = document.getElementById('to').value;
                    const amount = document.getElementById('amount').value;

                    try {
                        await this.addTransaction(from, to, amount);

                        // Show success message
                        const successAlert = document.getElementById('success-alert');
                        successAlert.textContent = 'Transaction added successfully!';
                        successAlert.style.display = 'block';

                        // Hide error message if visible
                        document.getElementById('error-alert').style.display = 'none';

                        // Clear form
                        document.getElementById('from').value = '';
                        document.getElementById('to').value = '';
                        document.getElementById('amount').value = '';

                        // Auto-hide success message after 3 seconds
                        setTimeout(() => {
                            successAlert.style.display = 'none';
                        }, 3000);
                    } catch (error) {
                        // Show error message
                        const errorAlert = document.getElementById('error-alert');
                        errorAlert.textContent = error.message;
                        errorAlert.style.display = 'block';

                        // Hide success message if visible
                        document.getElementById('success-alert').style.display = 'none';
                    }
                });

                // Mine block button
                document.getElementById('mine-button').addEventListener('click', async () => {
                    try {
                        await this.mineBlock();

                        // Switch to blockchain tab to show the new block
                        document.querySelectorAll('.tab')[0].click();

                        // Highlight the newest block
                        setTimeout(() => {
                            const blocks = document.querySelectorAll('.block');
                            if (blocks.length > 0) {
                                blocks[0].click();
                            }
                        }, 100);
                    } catch (error) {
                        console.error('Mining error:', error);
                    }
                });

                // Difficulty selector
                document.getElementById('difficulty').addEventListener('change', (e) => {
                    this.setDifficulty(e.target.value);
                });
            }
        }

        // Initialize blockchain simulator when page is loaded
        document.addEventListener('DOMContentLoaded', () => {
            window.blockchainSimulator = new BlockchainSimulator();
        });
