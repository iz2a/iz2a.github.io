        document.addEventListener('DOMContentLoaded', function() {
            // Mobile menu toggle
            const menuBtn = document.querySelector('.mobile-menu-btn');
            const navLinks = document.querySelector('.nav-links');

            if (menuBtn) {
                menuBtn.addEventListener('click', function() {
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

            // File uploader functionality
            const uploadArea = document.getElementById('upload-area');
            const fileInput = document.getElementById('file-input');
            const fileList = document.getElementById('file-list');
            const convertBtn = document.getElementById('convert-btn');
            const fromFormatSelect = document.getElementById('from-format');
            const toFormatSelect = document.getElementById('to-format');
            const progressContainer = document.getElementById('progress-container');
            const progressBar = document.getElementById('progress-bar');
            const progressText = document.getElementById('progress-text');
            const resultContainer = document.getElementById('result-container');
            const downloadLinks = document.getElementById('download-links');
            const uploadBtn = document.querySelector('.upload-btn');
            const notification = document.getElementById('notification');
            const notificationMessage = document.getElementById('notification-message');
            const scrollTopBtn = document.getElementById('scroll-top');

            // Files array
            let files = [];

            // Format tabs
            const formatTabs = document.querySelectorAll('.format-tab');
            const formatContents = document.querySelectorAll('.format-content');

            formatTabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    const format = tab.getAttribute('data-format');

                    // Remove active class from all tabs and contents
                    formatTabs.forEach(t => t.classList.remove('active'));
                    formatContents.forEach(c => c.classList.remove('active'));

                    // Add active class to clicked tab and corresponding content
                    tab.classList.add('active');
                    document.querySelector(`.format-content[data-format="${format}"]`).classList.add('active');
                });
            });

            // Scroll to top button
            window.addEventListener('scroll', () => {
                if (window.pageYOffset > 300) {
                    scrollTopBtn.classList.add('show');
                } else {
                    scrollTopBtn.classList.remove('show');
                }
            });

            scrollTopBtn.addEventListener('click', () => {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });

            // Show notification
            function showNotification(message, type = 'success') {
                notificationMessage.textContent = message;
                notification.className = 'notification show ' + type;

                const icon = notification.querySelector('.notification-icon');
                if (type === 'success') {
                    icon.className = 'notification-icon fas fa-check-circle';
                } else if (type === 'error') {
                    icon.className = 'notification-icon fas fa-exclamation-circle';
                }

                setTimeout(() => {
                    notification.className = 'notification';
                }, 5000);
            }

            // Format file size
            function formatFileSize(bytes) {
                if (bytes < 1024) return bytes + ' bytes';
                else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
                else return (bytes / 1048576).toFixed(1) + ' MB';
            }

            // Get file icon based on extension
            function getFileIcon(extension) {
                const icons = {
                    'doc': 'fas fa-file-word',
                    'docx': 'fas fa-file-word',
                    'pdf': 'fas fa-file-pdf',
                    'txt': 'fas fa-file-alt',
                    'jpg': 'fas fa-file-image',
                    'jpeg': 'fas fa-file-image',
                    'png': 'fas fa-file-image',
                    'gif': 'fas fa-file-image',
                    'xls': 'fas fa-file-excel',
                    'xlsx': 'fas fa-file-excel',
                    'csv': 'fas fa-file-csv',
                    'mp3': 'fas fa-file-audio',
                    'wav': 'fas fa-file-audio',
                    'mp4': 'fas fa-file-video',
                    'mov': 'fas fa-file-video',
                    'zip': 'fas fa-file-archive',
                    'rar': 'fas fa-file-archive',
                    '7z': 'fas fa-file-archive',
                    'json': 'fas fa-file-code',
                    'xml': 'fas fa-file-code',
                    'html': 'fas fa-file-code',
                    'htm': 'fas fa-file-code'
                };

                return icons[extension] || 'fas fa-file';
            }

            // Add files to the list
            function addFilesToList(newFiles) {
                Array.from(newFiles).forEach(file => {
                    // Check file size limit (100MB)
                    if (file.size > 104857600) {
                        showNotification(`File ${file.name} is too large. Maximum size is 100MB.`, 'error');
                        return;
                    }

                    // Add file to array
                    files.push(file);

                    // Create file item element
                    const fileItem = document.createElement('div');
                    fileItem.className = 'file-item';

                    // Get file extension
                    const extension = file.name.split('.').pop().toLowerCase();

                    fileItem.innerHTML = `
                        <div class="file-name">
                            <i class="${getFileIcon(extension)} file-icon"></i>
                            <span>${file.name}</span>
                            <span class="file-size">${formatFileSize(file.size)}</span>
                        </div>
                        <button class="file-remove" data-index="${files.length - 1}">
                            <i class="fas fa-times"></i>
                        </button>
                    `;

                    fileList.appendChild(fileItem);
                });

                // Enable convert button if files exist and formats are selected
                updateConvertButton();
            }

            // Update convert button state
            function updateConvertButton() {
                convertBtn.disabled = !(files.length > 0 && fromFormatSelect.value && toFormatSelect.value);
            }

            // Upload area click handler
            uploadBtn.addEventListener('click', () => {
                fileInput.click();
            });

            uploadArea.addEventListener('click', () => {
                fileInput.click();
            });

            // File input change handler
            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    addFilesToList(e.target.files);
                    fileInput.value = '';  // Reset input
                }
            });

            // Drag and drop handlers
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('drag-over');
            });

            uploadArea.addEventListener('dragleave', () => {
                uploadArea.classList.remove('drag-over');
            });

            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('drag-over');

                if (e.dataTransfer.files.length > 0) {
                    addFilesToList(e.dataTransfer.files);
                }
            });

            // Remove file
            fileList.addEventListener('click', (e) => {
                if (e.target.closest('.file-remove')) {
                    const button = e.target.closest('.file-remove');
                    const index = parseInt(button.getAttribute('data-index'));

                    // Remove file from array
                    files.splice(index, 1);

                    // Remove file item from list
                    button.closest('.file-item').remove();

                    // Re-index remaining file remove buttons
                    document.querySelectorAll('.file-remove').forEach((btn, i) => {
                        btn.setAttribute('data-index', i);
                    });

                    // Update convert button state
                    updateConvertButton();
                }
            });

            // Format select change handler
            fromFormatSelect.addEventListener('change', updateConvertButton);
            toFormatSelect.addEventListener('change', updateConvertButton);

            // Convert button click handler
            convertBtn.addEventListener('click', () => {
                if (files.length === 0) {
                    showNotification('Please select at least one file to convert.', 'error');
                    return;
                }

                if (!fromFormatSelect.value || !toFormatSelect.value) {
                    showNotification('Please select both input and output formats.', 'error');
                    return;
                }

                // Show progress container
                progressContainer.style.display = 'block';
                resultContainer.style.display = 'none';
                convertBtn.disabled = true;

                // Simulate conversion process
                let progress = 0;
                const totalFiles = files.length;
                let convertedFiles = 0;

                const progressInterval = setInterval(() => {
                    progress += 5;
                    progressBar.style.width = `${progress}%`;
                    progressText.textContent = `Converting... ${progress}%`;

                    if (progress >= 100) {
                        clearInterval(progressInterval);

                        // Process next file or finish conversion
                        convertedFiles++;

                        if (convertedFiles < totalFiles) {
                            // Reset progress for next file
                            progress = 0;
                            progressBar.style.width = '0%';
                            progressText.textContent = `Converting file ${convertedFiles + 1} of ${totalFiles}... 0%`;
                        } else {
                            // All files converted
                            finishConversion();
                        }
                    }
                }, 100);
            });

            // Finish conversion
            function finishConversion() {
                // Hide progress container
                progressContainer.style.display = 'none';

                // Generate download links
                downloadLinks.innerHTML = '';

                files.forEach(file => {
                    const originalName = file.name.split('.')[0];
                    const newExtension = toFormatSelect.value;

                    const link = document.createElement('a');
                    link.className = 'download-link';
                    link.href = '#'; // In a real app, this would be the URL to the converted file
                    link.download = `${originalName}.${newExtension}`;
                    link.innerHTML = `
                        <i class="fas fa-download download-icon"></i>
                        <span>${originalName}.${newExtension}</span>
                    `;

                    // Add click event to simulate download
                    link.addEventListener('click', (e) => {
                        e.preventDefault();
                        showNotification(`Download started for ${originalName}.${newExtension}`);

                        // In a real application, this would initiate the actual download
                        // For demonstration purposes, we're just showing a notification
                    });

                    downloadLinks.appendChild(link);
                });

                // Show result container
                resultContainer.style.display = 'block';

                // Reset convert button
                convertBtn.disabled = false;

                // Show success notification
                showNotification('Files converted successfully!');
            }

            // Populate "from format" based on file selection
            function updateFromFormat(file) {
                const extension = file.name.split('.').pop().toLowerCase();

                // Check if the format is supported
                const options = fromFormatSelect.querySelectorAll('option');
                for (let option of options) {
                    if (option.value.toLowerCase() === extension) {
                        fromFormatSelect.value = extension;
                        break;
                    }
                }

                updateConvertButton();
            }
        });