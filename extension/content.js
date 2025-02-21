console.log("✅ SentinelAI : content.js injecté !");

if (!window.hasRun) {
    window.hasRun = true; // Empêche l'exécution multiple

    let scanResults = [];

    if (window.location.protocol !== "https:") {
        scanResults.push("⚠️ Le site utilise HTTP, il n'est pas sécurisé !");
    } else {
        scanResults.push("✅ Le site utilise HTTPS.");
    }

    document.querySelectorAll("form").forEach(form => {
        if (form.action.startsWith("http://")) {
            scanResults.push("⚠️ Formulaire non sécurisé détecté : " + form.action);
        }
    });

    document.querySelectorAll("script").forEach(script => {
        if (script.src.startsWith("http://")) {
            scanResults.push("⚠️ Script non sécurisé chargé : " + script.src);
        }
    });

    document.querySelectorAll("iframe").forEach(iframe => {
        try {
            let iframeOrigin = new URL(iframe.src).origin;
            if (iframeOrigin !== window.location.origin) {
                scanResults.push("⚠️ Iframe externe détectée : " + iframe.src);
            }
        } catch (error) {
            scanResults.push("⚠️ Impossible de vérifier une iframe (CORS)");
        }
    });

    scanResults.push("✅ Scan terminé !");

    chrome.runtime.sendMessage({ action: "storeScanResults", results: scanResults }, () => {
        console.log("📤 Résultats envoyés au background.js !");
    });
}
