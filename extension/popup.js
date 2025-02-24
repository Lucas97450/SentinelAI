document.getElementById("fullAudit").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          files: ["content.js"]
      });
  });

  setTimeout(() => {
      chrome.storage.local.get("scanResults", (data) => {
          console.log("📥 Récupération des résultats :", data.scanResults);
          const resultsDiv = document.getElementById("results");
          resultsDiv.innerHTML = "<h2>📊 Résultats de l'Audit :</h2>";

          if (data.scanResults) {
              data.scanResults.forEach(result => {
                  let p = document.createElement("p");

                  if (result.includes("❌")) {
                      p.className = "danger";
                  } else if (result.includes("⚠️")) {
                      p.className = "warning";
                  } else {
                      p.className = "safe";
                  }

                  p.textContent = result;
                  resultsDiv.appendChild(p);
              });
          } else {
              resultsDiv.innerHTML += "<p>Aucun problème détecté.</p>";
          }
      });
  }, 3000); // Attendre que les données soient bien récupérées
});

// 📄 Export du scan en PDF
document.getElementById("exportPDF").addEventListener("click", () => {
  chrome.storage.local.get("scanResults", (data) => {
      if (!data.scanResults || data.scanResults.length === 0) {
          alert("Aucun résultat à exporter.");
          return;
      }

      if (typeof window.jspdf === "undefined") {
          alert("Erreur : jsPDF ne peut pas être utilisé !");
          return;
      }

      const doc = new window.jspdf.jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4"
      });

      // Ajout d'un titre et de la date
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("🔍 Rapport d'Audit SentinelAI", 10, 20);
      const date = new Date().toLocaleString();
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`Date du scan : ${date}`, 10, 30);

      // Ligne de séparation
      doc.setLineWidth(0.5);
      doc.line(10, 35, 200, 35);

      // Ajout des résultats
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("📋 Résultats du Scan :", 10, 45);

      let y = 55;
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");

      data.scanResults.forEach(result => {
          if (result.includes("❌")) {
              doc.setTextColor(200, 0, 0); // Rouge pour les erreurs
          } else if (result.includes("⚠️")) {
              doc.setTextColor(255, 140, 0); // Orange pour avertissements
          } else {
              doc.setTextColor(0, 150, 0); // Vert pour sécurisé
          }
          doc.text(result, 15, y);
          y += 10;

          // Gérer les sauts de page
          if (y > 270) {
              doc.addPage();
              y = 20;
          }
      });

      // Sauvegarde du fichier
      doc.save(`SentinelAI_Rapport_${Date.now()}.pdf`);
      console.log("📄 Rapport PDF exporté !");
  });
});

document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ DOM chargé !");

    const aiFixesDiv = document.getElementById("aiFixes");

    document.getElementById("getFixes").addEventListener("click", async () => {
        console.log("🚀 IA en cours d'analyse...");
        aiFixesDiv.innerHTML = "<p>🔍 Analyse des failles en cours...</p>";

        chrome.storage.local.get("openaiKey", async (data) => {
            if (!data.openaiKey) {
                aiFixesDiv.innerHTML = "<p>❌ Clé API manquante ! Ajoutez-la dans les paramètres.</p>";
                return;
            }

            const OPENAI_API_KEY = data.openaiKey;

            chrome.storage.local.get("scanResults", async (scanData) => {
                if (!scanData.scanResults || scanData.scanResults.length === 0) {
                    aiFixesDiv.innerHTML = "<p>✅ Aucune faille détectée.</p>";
                    return;
                }

                const formattedIssues = scanData.scanResults.map(issue => `- ${issue}`).join("\n");

                const fullPrompt = `
                Tu es un expert en cybersécurité. Voici une liste de failles :
                ${formattedIssues}

                🔹 Pour chaque faille, donne une réponse simple :
                1️⃣ **Criticité** (Faible, Moyenne, Critique)
                2️⃣ **Risque**.
                ton texte dois etre très bien structuré et dois etre lisible 
                sur mobile, les section bien séparés et bien lisibles s'il t plait 
                j'insiste sur la lisibilité enleve le texte inutile. Utilises des bulletpoints.
                `;

                console.log("📤 Envoi de la requête OpenAI...");

                try {
                    const response = await fetch("https://api.openai.com/v1/chat/completions", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${OPENAI_API_KEY}`
                        },
                        body: JSON.stringify({
                            model: "gpt-4",
                            messages: [{ role: "user", content: fullPrompt }],
                            max_tokens: 700
                        })
                    });

                    if (!response.ok) {
                        throw new Error(`Erreur API OpenAI: ${response.status} ${response.statusText}`);
                    }

                    const dataAI = await response.json();
                    console.log("📥 Réponse OpenAI :", dataAI);

                    const answer = dataAI.choices?.[0]?.message?.content || "❌ Réponse vide de l'IA.";

                    aiFixesDiv.innerHTML = `<p>${answer}</p>`;
                } catch (err) {
                    aiFixesDiv.innerHTML = "<p>❌ Erreur avec OpenAI.</p>";
                    console.error("🚨 Erreur OpenAI :", err);
                }
            });
        });
    });
});

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





function showAIResponse(text) {
  const aiFixes = document.getElementById("aiFixes");
  aiFixes.textContent = text;
  aiFixes.style.opacity = "0";
  setTimeout(() => {
      aiFixes.style.opacity = "1";
  }, 200);
}
