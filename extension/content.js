console.log("🚀 SentinelAI : Scan Cybersécurité avancé lancé !");

if (!window.hasRun) {
    window.hasRun = true;

    let scanResults = [];

    // 1️⃣ 🔒 Vérification HTTPS & Certificat SSL
    if (window.location.protocol !== "https:") {
        scanResults.push("❌ Le site n'utilise pas HTTPS ! Risque d'interception des données.");
    } else {
        scanResults.push("✅ HTTPS activé.");
    }

    // 2️⃣ 🛡 Vérification avancée des en-têtes HTTP
    fetch(window.location.href, { method: "HEAD" })
        .then(response => {
            let securityHeaders = {
                "Strict-Transport-Security": "❌ Pas de HSTS : risque d'attaque man-in-the-middle.",
                "Content-Security-Policy": "❌ Pas de CSP : protection XSS absente.",
                "X-Frame-Options": "❌ Protection Clickjacking absente.",
                "X-Content-Type-Options": "❌ Protection MIME absente.",
                "Referrer-Policy": "⚠️ Politique de référent trop permissive.",
                "Permissions-Policy": "⚠️ Permissions API Web non limitées."
            };

            Object.keys(securityHeaders).forEach(header => {
                if (!response.headers.get(header)) {
                    scanResults.push(securityHeaders[header]);
                } else {
                    scanResults.push(`✅ ${header} détecté.`);
                }
            });
        })
        .catch(error => console.warn("⚠️ Impossible de vérifier les en-têtes HTTP :", error));

    // 3️⃣ 👀 Détection des scripts suspects (Minage Crypto, Keyloggers, Trackers)
    let maliciousScripts = ["coinhive.com", "jsecoin.com", "tracking.com", "keylogger.js"];
    document.querySelectorAll("script").forEach(script => {
        if (script.src) {
            let domain = new URL(script.src).hostname;
            if (maliciousScripts.includes(domain)) {
                scanResults.push(`❌ Script malveillant détecté : ${script.src}`);
            }
        }
    });

    // 4️⃣ 🍪 Vérification des cookies non sécurisés
    document.cookie.split(";").forEach(cookie => {
        if (!cookie.includes("Secure") || !cookie.includes("HttpOnly") || !cookie.includes("SameSite")) {
            scanResults.push(`❌ Cookie non sécurisé détecté : ${cookie.trim()}`);
        }
    });

    // 5️⃣ 🖼 Détection des iframes suspectes
    document.querySelectorAll("iframe").forEach(iframe => {
        try {
            let iframeOrigin = new URL(iframe.src).origin;
            if (iframe.style.display === "none" || iframe.style.opacity === "0") {
                scanResults.push(`❌ Iframe cachée détectée : ${iframe.src}`);
            } else if (iframeOrigin !== window.location.origin) {
                scanResults.push(`❌ Iframe externe dangereuse : ${iframe.src}`);
            }
        } catch (error) {
            scanResults.push("⚠️ Iframe non analysable (CORS bloqué).");
        }
    });

    // 6️⃣ 🚨 Vérification des liens externes vers des sites dangereux
    let blacklistedDomains = ["phishing.com", "malware.com", "scam-site.org"];
    document.querySelectorAll("a").forEach(link => {
        if (link.href.startsWith("http") && !link.href.includes(window.location.hostname)) {
            let domain = new URL(link.href).hostname;
            if (blacklistedDomains.includes(domain)) {
                scanResults.push(`❌ Lien dangereux détecté : ${link.href}`);
            }
        }
    });

    // 7️⃣ 📡 Analyse des API Web utilisées (WebRTC, Geolocation)
    if (navigator.geolocation) {
        scanResults.push("⚠️ API de géolocalisation utilisée.");
    }
    if (navigator.mediaDevices) {
        scanResults.push("⚠️ Accès aux médias détecté (caméra/micro).");
    }

    // 8️⃣ ⏳ Détection des technologies obsolètes
    let outdatedLibraries = {
        "jquery": "❌ Version ancienne de jQuery détectée. Risque de vulnérabilités.",
        "bootstrap": "⚠️ Ancienne version de Bootstrap détectée."
    };
    Object.keys(outdatedLibraries).forEach(lib => {
        if (window[lib] && window[lib].fn && window[lib].fn.jquery) {
            scanResults.push(outdatedLibraries[lib]);
        }
    });

    // 9️⃣ ⚡ Vérification du temps de réponse
    let startTime = performance.now();
    fetch(window.location.href).then(() => {
        let loadTime = (performance.now() - startTime).toFixed(2);
        scanResults.push(loadTime > 3000 ? `❌ Site lent (${loadTime} ms)` : `✅ Site rapide (${loadTime} ms)`);
    });

    // 🔟 📊 Poids de la page & requêtes réseau
    let pageSize = (document.documentElement.innerHTML.length / 1024).toFixed(2);
    let requestCount = performance.getEntriesByType("resource").length;
    scanResults.push(`📊 Poids de la page : ${pageSize} KB`);
    scanResults.push(`📊 Nombre de requêtes réseau : ${requestCount}`);

    scanResults.push("✅ Scan Sécurité terminé !");

    chrome.runtime.sendMessage({ action: "storeScanResults", results: scanResults }, () => {
        console.log("📤 Résultats envoyés au background.js !");
    });
}
