console.log("🚀 Lancement du scan SentinelAI...");

// 📌 Stockage des résultats
let scanResults = [];

// 🔍 Vérification HTTPS
if (window.location.protocol === "https:") {
    scanResults.push("✅ HTTPS activé.");
} else {
    scanResults.push("❌ Le site n'utilise pas HTTPS !");
}

// 🍪 Scan des cookies
document.cookie.split(";").forEach(cookie => {
    if (!cookie.includes("Secure")) {
        scanResults.push(`❌ Cookie non sécurisé détecté : ${cookie.trim()}`);
    }
});

// 🛑 Vérification des Headers de Sécurité
fetch(window.location.href).then(response => {
    let securityHeaders = [
        "Content-Security-Policy",
        "X-Frame-Options",
        "X-XSS-Protection",
        "Strict-Transport-Security"
    ];

    securityHeaders.forEach(header => {
        if (!response.headers.get(header)) {
            scanResults.push(`⚠️ Header de sécurité manquant : ${header}`);
        }
    });

    // 📥 Stockage des résultats
    chrome.storage.local.set({ scanResults }, () => {
        console.log("📥 Résultats stockés :", scanResults);
    });
}).catch(err => {
    console.error("❌ Erreur lors du scan des headers :", err);
});
