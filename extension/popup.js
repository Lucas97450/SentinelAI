document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ DOM chargé !");

    const scanButton = document.getElementById("fullAudit");
    const exportPDFButton = document.getElementById("exportPDF");
    const getFixesButton = document.getElementById("getFixes");
    const aiFixesDiv = document.getElementById("aiFixes");

    // 🚀 Lancer l'audit de sécurité
    scanButton.addEventListener("click", () => {
        console.log("🔍 Lancement du scan...");
        aiFixesDiv.innerHTML = "<p>📡 Scan en cours...</p>";

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                files: ["content.js"]
            });
        });

        setTimeout(() => {
            chrome.storage.local.get("scanResults", (data) => {
                console.log("📥 Résultats récupérés :", data.scanResults);
                const resultsDiv = document.getElementById("results");
                resultsDiv.innerHTML = "<h2>📊 Résultats de l'Audit :</h2>";

                if (data.scanResults) {
                    data.scanResults.forEach(result => {
                        let p = document.createElement("p");
                        p.textContent = result;

                        if (result.includes("❌")) p.className = "danger";
                        else if (result.includes("⚠️")) p.className = "warning";
                        else p.className = "safe";

                        resultsDiv.appendChild(p);
                    });
                } else {
                    resultsDiv.innerHTML += "<p>Aucun problème détecté.</p>";
                }
            });
        }, 3000);
    });

    // 🔹 GÉNÉRER UN RAPPORT IA OPENAI
    getFixesButton.addEventListener("click", async () => {
        console.log("🚀 IA en cours d'analyse...");
        aiFixesDiv.innerHTML = "<p>📄 Génération du rapport en cours...</p>";

        chrome.storage.local.get(["scanResults", "openaiKey"], async (data) => {
            if (!data.openaiKey) {
                aiFixesDiv.innerHTML = "<p>❌ Clé API manquante ! Ajoutez-la dans les paramètres.</p>";
                return;
            }

            if (!data.scanResults || data.scanResults.length === 0) {
                aiFixesDiv.innerHTML = "<p>✅ Aucune faille détectée.</p>";
                return;
            }

            const formattedIssues = data.scanResults.map(issue => `- ${issue}`).join("\n");

            const fullPrompt = `
            Tu es un expert en cybersécurité. Voici une liste de failles :
            ${formattedIssues}

            🔹 Pour chaque faille, donne :
            - **Criticité** (Faible, Moyenne, Critique)
            - **Pourquoi elle est dangereuse**
            - **Correctif simple avec code si nécessaire**
            - **Comment tester la correction**
            🔹 Réponds de manière concise et efficace.`;

            try {
                const response = await fetch("https://api.openai.com/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${data.openaiKey}`
                    },
                    body: JSON.stringify({
                        model: "gpt-4",
                        messages: [{ role: "user", content: fullPrompt }],
                        max_tokens: 700
                    })
                });

                if (!response.ok) throw new Error(`Erreur API OpenAI: ${response.statusText}`);

                const dataAI = await response.json();
                const answer = dataAI.choices?.[0]?.message?.content || "❌ Réponse IA vide.";

                chrome.storage.local.set({ aiFixes: answer }, () => {
                    aiFixesDiv.innerHTML = "<p>✅ Rapport généré et prêt à être exporté !</p>";
                });

            } catch (err) {
                aiFixesDiv.innerHTML = "<p>❌ Erreur avec OpenAI.</p>";
                console.error("🚨 Erreur OpenAI :", err);
            }
        });
    });

    // 📄 EXPORTER EN PDF
    exportPDFButton.addEventListener("click", () => {
        chrome.storage.local.get(["scanResults", "aiFixes"], (data) => {
            if (!data.scanResults || data.scanResults.length === 0) {
                alert("❌ Aucun résultat à exporter.");
                return;
            }
    
            if (typeof window.jspdf === "undefined") {
                alert("❌ Erreur : jsPDF non chargé !");
                return;
            }
    
            const doc = new window.jspdf.jsPDF();
            doc.setFont("helvetica", "bold");
            doc.setFontSize(18);
            doc.text("🔍 Rapport d'Audit SentinelAI", 10, 20);
    
            const date = new Date().toLocaleString();
            doc.setFontSize(12);
            doc.setFont("helvetica", "normal");
            doc.text(`Date du scan : ${date}`, 10, 30);
    
            doc.setLineWidth(0.5);
            doc.line(10, 35, 200, 35);
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.text("📋 Résultats du Scan :", 10, 45);
    
            let y = 55;
            doc.setFontSize(12);
            doc.setFont("helvetica", "normal");
    
            data.scanResults.forEach(result => {
                if (result.includes("❌")) doc.setTextColor(200, 0, 0);
                else if (result.includes("⚠️")) doc.setTextColor(255, 140, 0);
                else doc.setTextColor(0, 150, 0);
    
                doc.text(result, 15, y);
                y += 10;
    
                if (y > 270) {
                    doc.addPage();
                    y = 20;
                }
            });
    
            if (data.aiFixes) {
                doc.addPage();
                doc.setFontSize(14);
                doc.setFont("helvetica", "bold");
                doc.setTextColor(0, 0, 0);
                doc.text("🛠️ Conseils de l'IA :", 10, 20);
    
                doc.setFontSize(12);
                doc.setFont("helvetica", "normal");
                let splitText = doc.splitTextToSize(data.aiFixes, 180);
                doc.text(splitText, 10, 30);
            }
    
            // ✅ Correction pour le téléchargement
            doc.save("SentinelAI_Rapport.pdf");
    
            console.log("📄 Rapport PDF exporté !");
        });
    });
    
    // 🔑 ENREGISTRER LA CLÉ API
    document.getElementById("saveApiKey").addEventListener("click", function () {
        const apiKey = document.getElementById("apiKeyInput").value.trim();

        if (apiKey) {
            chrome.storage.local.set({ openaiKey: apiKey }, function () {
                alert("✅ Clé API enregistrée avec succès !");
            });
        } else {
            alert("❌ Veuillez entrer une clé API valide !");
        }
    });
});
