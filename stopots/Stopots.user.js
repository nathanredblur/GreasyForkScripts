// ==UserScript==
// @name         WebSocket Stop Game Helper
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Intercepta mensajes de WebSocket y ayuda a jugar Stop
// @author       You
// @match        https://stopots.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // Configuración
    const CONFIG = {
        logToConsole: true,
        logToStorage: true,
        showNotifications: false,
        filterMessages: true
    };

    // Variables globales
    let interceptedMessages = [];
    let currentLetter = null;
    let currentCategories = [];
    let gamePanel = null;

    // Función para parsear mensajes con formato 42[...]
    function parseSocketIOMessage(data) {
        try {
            if (typeof data === 'string' && data.startsWith('42[')) {
                const jsonPart = data.substring(2);
                return JSON.parse(jsonPart);
            }
            return null;
        } catch (e) {
            return null;
        }
    }

    // Función para identificar tipos de mensajes
    function identifyMessageType(parsedData) {
        if (!Array.isArray(parsedData) || parsedData.length === 0) return 'unknown';

        const firstElement = parsedData[0];

        if (firstElement === "14" && parsedData.length === 4) {
            return 'game_action';
        }

        if (firstElement === "15" && parsedData.length === 2 && Array.isArray(parsedData[1])) {
            return 'categories_list';
        }

        return 'other';
    }

    // Función para crear el panel de juego
    function createGamePanel() {
        if (gamePanel) return gamePanel;

        gamePanel = document.createElement('div');
        gamePanel.id = 'stop-game-panel';
        gamePanel.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                width: 350px;
                background: #ffffff;
                border: 2px solid #4CAF50;
                border-radius: 10px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                z-index: 10000;
                font-family: Arial, sans-serif;
                font-size: 14px;
            ">
                <div style="
                    background: #4CAF50;
                    color: white;
                    height: 10px;
                    padding: 15px;
                    border-radius: 8px 8px 0 0;
                    font-weight: bold;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                ">
                    <span>🎮 Stop Game Helper</span>
                    <button id="close-panel" style="
                        background: none;
                        border: none;
                        color: white;
                        font-size: 18px;
                        cursor: pointer;
                        padding: 0;
                        width: 24px;
                        height: 24px;
                    ">×</button>
                </div>

                <div style="padding: 20px;">
                    <div id="game-info" style="
                        background: #f0f8ff;
                        color: #000;
                        padding: 15px;
                        border-radius: 5px;
                        margin-bottom: 15px;
                        border-left: 4px solid #2196F3;
                    ">
                        <div style="font-weight: bold; margin-bottom: 10px;">📝 Información del Juego:</div>
                        <div id="letter-info">Esperando letra...</div>
                        <div id="categories-info">Esperando categorías...</div>
                    </div>

                    <div id="prompt-section" style="display: none;">
                        <div style="font-weight: bold; margin-bottom: 10px;">📋 Prompt para ChatGPT:</div>
                        <textarea id="prompt-text" readonly style="
                            width: 100%;
                            height: 120px;
                            padding: 10px;
                            border: 1px solid #ddd;
                            border-radius: 5px;
                            font-size: 12px;
                            resize: vertical;
                            box-sizing: border-box;
                        "></textarea>
                        <button id="copy-prompt" style="
                            background: #2196F3;
                            color: white;
                            border: none;
                            padding: 8px 15px;
                            border-radius: 5px;
                            cursor: pointer;
                            margin-top: 10px;
                            font-size: 12px;
                        ">📋 Copiar Prompt</button>
                    </div>

                    <div style="margin-top: 20px;">
                        <div style="font-weight: bold; margin-bottom: 10px;">🤖 Respuestas de ChatGPT:</div>
                        <textarea id="json-input" placeholder="Pega aquí el JSON con las respuestas de ChatGPT..." style="
                            width: 100%;
                            height: 100px;
                            padding: 10px;
                            border: 1px solid #ddd;
                            border-radius: 5px;
                            font-size: 12px;
                            resize: vertical;
                            box-sizing: border-box;
                        "></textarea>
                        <button id="fill-answers" style="
                            background: #FF9800;
                            color: white;
                            border: none;
                            padding: 8px 15px;
                            border-radius: 5px;
                            cursor: pointer;
                            margin-top: 10px;
                            font-size: 12px;
                        ">🚀 Llenar Respuestas</button>
                    </div>

                    <div id="status" style="
                        margin-top: 15px;
                        padding: 10px;
                        border-radius: 5px;
                        font-size: 12px;
                        display: none;
                    "></div>
                </div>
            </div>
        `;

        document.body.appendChild(gamePanel);
        setupPanelEvents();
        return gamePanel;
    }

    // Función para configurar eventos del panel
    function setupPanelEvents() {
        const closeBtn = document.getElementById('close-panel');
        const copyBtn = document.getElementById('copy-prompt');
        const fillBtn = document.getElementById('fill-answers');

        closeBtn.addEventListener('click', () => {
            gamePanel.style.display = 'none';
        });

        copyBtn.addEventListener('click', () => {
            const promptText = document.getElementById('prompt-text');
            promptText.select();
            document.execCommand('copy');
            showStatus('✅ Prompt copiado al portapapeles', 'success');
        });

        fillBtn.addEventListener('click', () => {
            const jsonInput = document.getElementById('json-input');
            try {
                const respuestas = JSON.parse(jsonInput.value);
                llenarCamposStop(respuestas);
                showStatus('✅ Respuestas aplicadas correctamente', 'success');
                jsonInput.value = '';
            } catch (e) {
                showStatus('❌ Error: JSON inválido', 'error');
            }
        });
    }

    // Función para mostrar estado
    function showStatus(message, type) {
        const status = document.getElementById('status');
        status.textContent = message;
        status.style.display = 'block';
        status.style.background = type === 'success' ? '#d4edda' : '#f8d7da';
        status.style.color = type === 'success' ? '#155724' : '#721c24';
        status.style.border = `1px solid ${type === 'success' ? '#c3e6cb' : '#f5c6cb'}`;

        setTimeout(() => {
            status.style.display = 'none';
        }, 3000);
    }

    // Función para actualizar la información del juego
    function updateGameInfo() {
        if (!gamePanel) return;

        const letterInfo = document.getElementById('letter-info');
        const categoriesInfo = document.getElementById('categories-info');
        const promptSection = document.getElementById('prompt-section');
        const promptText = document.getElementById('prompt-text');

        if (currentLetter) {
            letterInfo.innerHTML = `<strong>🔤 Letra:</strong> ${currentLetter}`;
        }

        if (currentCategories.length > 0) {
            categoriesInfo.innerHTML = `<strong>📂 Categorías:</strong> ${currentCategories.length} categorías detectadas`;
        }

        if (currentLetter && currentCategories.length > 0) {
            const categoriesList = currentCategories.map(cat => `"${cat}"`).join(', ');
            const prompt = `Juguemos Stop/Basta. La letra es "${currentLetter}" y las categorías son: ${categoriesList}.

Por favor, dame una respuesta para cada categoría que empiece con la letra "${currentLetter}".

Responde SOLO con un JSON válido en este formato exacto:
{
    "Categoría1": "respuesta1",
    "Categoría2": "respuesta2",
    ...
}

No agregues explicaciones, solo el JSON.`;

            promptText.value = prompt;
            promptSection.style.display = 'block';
        }
    }

    // Función para llenar campos (la que proporcionaste)
    function llenarCamposStop(respuestas) {
        const labels = document.querySelectorAll('label');

        labels.forEach(label => {
            const spanCategoria = label.querySelector('span');
            if (!spanCategoria) return;

            let categoria = spanCategoria.childNodes[0].textContent.trim();

            const input = label.querySelector('input[type="text"]');
            if (!input) return;

            let respuesta = respuestas[categoria];

            if (respuesta) {
                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                    window.HTMLInputElement.prototype,
                    'value'
                ).set;

                nativeInputValueSetter.call(input, respuesta);

                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));

                console.log(`✓ ${categoria}: ${respuesta}`);
            } else {
                console.log(`✗ ${categoria}: No encontrada`);
            }
        });
    }

    // Función para procesar mensajes interceptados
    function processMessage(direction, url, rawData, parsedData, messageType) {
        const timestamp = new Date().toISOString();
        const message = {
            timestamp,
            direction,
            url,
            rawData,
            parsedData,
            messageType
        };

        interceptedMessages.push(message);

        // Procesar según el tipo de mensaje
        if (messageType === 'game_action' && direction === 'incoming') {
            currentLetter = parsedData[1];
            console.log(`🎮 Nueva letra detectada: ${currentLetter}`);

            // Crear panel si no existe
            if (!gamePanel) {
                createGamePanel();
            } else {
                gamePanel.style.display = 'block';
            }

            updateGameInfo();
        } else if (messageType === 'categories_list' && direction === 'incoming') {
            currentCategories = parsedData[1];
            console.log(`📋 Nuevas categorías detectadas:`, currentCategories);

            // Crear panel si no existe
            if (!gamePanel) {
                createGamePanel();
            } else {
                gamePanel.style.display = 'block';
            }

            updateGameInfo();
        }

        if (CONFIG.logToConsole) {
            const emoji = direction === 'incoming' ? '📨' : '📤';
            const typeEmoji = messageType === 'game_action' ? '🎮' :
                             messageType === 'categories_list' ? '📋' : '📄';

            console.group(`${emoji} ${typeEmoji} WebSocket ${direction} - ${messageType}`);
            console.log('🕐 Timestamp:', timestamp);
            console.log('🌐 URL:', url);
            console.log('📝 Raw Data:', rawData);
            console.log('🔍 Parsed Data:', parsedData);
            console.groupEnd();
        }
    }

    // Interceptor principal de WebSocket
    function setupWebSocketInterceptor() {
        const originalWebSocket = window.WebSocket;

        if (!originalWebSocket) {
            console.warn('WebSocket no disponible');
            return;
        }

        window.WebSocket = function(url, protocols) {
            console.log('🔌 Nueva conexión WebSocket detectada:', url);
            const ws = new originalWebSocket(url, protocols);

            // Interceptar mensajes entrantes
            ws.addEventListener('message', function(event) {
                const rawData = event.data;
                const parsedData = parseSocketIOMessage(rawData);

                if (parsedData) {
                    const messageType = identifyMessageType(parsedData);

                    if (!CONFIG.filterMessages || messageType === 'game_action' || messageType === 'categories_list') {
                        processMessage('incoming', url, rawData, parsedData, messageType);
                    }
                }
            });

            // Interceptar mensajes salientes
            const originalSend = ws.send;
            ws.send = function(data) {
                const parsedData = parseSocketIOMessage(data);

                if (parsedData) {
                    const messageType = identifyMessageType(parsedData);

                    if (!CONFIG.filterMessages || messageType === 'game_action' || messageType === 'categories_list') {
                        processMessage('outgoing', url, data, parsedData, messageType);
                    }
                }

                return originalSend.call(this, data);
            };

            return ws;
        };

        // Preservar propiedades del WebSocket original
        Object.setPrototypeOf(window.WebSocket, originalWebSocket);
        Object.defineProperty(window.WebSocket, 'prototype', {
            value: originalWebSocket.prototype,
            writable: false
        });
    }

    // Funciones de utilidad para la consola
    window.showStopPanel = function() {
        if (!gamePanel) {
            createGamePanel();
        } else {
            gamePanel.style.display = 'block';
        }
    };

    window.hideStopPanel = function() {
        if (gamePanel) {
            gamePanel.style.display = 'none';
        }
    };

    window.getCurrentGameInfo = function() {
        return {
            letter: currentLetter,
            categories: currentCategories
        };
    };

    // Configurar el interceptor
    setupWebSocketInterceptor();

    console.log('✅ Stop Game Helper activado');
    console.log('📖 Comandos disponibles:');
    console.log('  - showStopPanel(): Mostrar panel de juego');
    console.log('  - hideStopPanel(): Ocultar panel de juego');
    console.log('  - getCurrentGameInfo(): Ver información actual del juego');

})();
