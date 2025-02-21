document.getElementById("scan").addEventListener("click", () => {
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
          resultsDiv.innerHTML = "<h2>Résultats du scan :</h2>";

          if (data.scanResults && data.scanResults.length > 0) {
              data.scanResults.forEach(result => {
                  let p = document.createElement("p");
                  p.textContent = result;
                  p.className = result.includes("⚠️") ? "warning" : "safe";
                  resultsDiv.appendChild(p);
              });
          } else {
              resultsDiv.innerHTML += "<p>Aucun résultat trouvé.</p>";
          }
      });
  }, 2000); // Attendre 2 secondes pour assurer la récupération des données
});

document.getElementById("exportPDF").addEventListener("click", () => {
  chrome.storage.local.get("scanResults", (data) => {
      if (!data.scanResults || data.scanResults.length === 0) {
          alert("Aucun résultat à exporter.");
          return;
      }

      // Vérifier si jsPDF est bien chargé
      if (typeof window.jspdf === "undefined") {
          console.error("❌ jsPDF n'est pas chargé correctement !");
          alert("Erreur : jsPDF ne peut pas être utilisé !");
          return;
      }

      const doc = new window.jspdf.jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
    });

    // Ajouter un titre et un logo
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Rapport d'Analyse Sentinel AI", 10, 20);

    // Ajouter la date du scan
    const date = new Date().toLocaleString();
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Date du scan : ${date}`, 10, 30);

    // Ligne de séparation
    doc.setLineWidth(0.5);
    doc.line(10, 35, 200, 35);

    // Tableau des résultats
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Résultats du Scan :", 10, 45);

    let y = 55;
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");

    data.scanResults.forEach(result => {
        if (result.includes("-")) {
            doc.setTextColor(200, 0, 0); // Rouge pour les alertes
        } else {
            doc.setTextColor(0, 150, 0); // Vert pour les éléments sécurisés
        }
        doc.text(result, 15, y);
        y += 10;

        // Saut de page si nécessaire
        if (y > 270) {
            doc.addPage();
            y = 20;
        }
    });

    // Sauvegarder le PDF
    doc.save(`SentinelAI_Rapport_${Date.now()}.pdf`);
    console.log("📄 PDF exporté avec succès !");
});

  function loadHistory() {
    chrome.storage.local.get("scanHistory", (data) => {
        const historyDiv = document.getElementById("history");
        historyDiv.innerHTML = "";

        if (!data.scanHistory || data.scanHistory.length === 0) {
            historyDiv.innerHTML = "<p>Aucun historique enregistré.</p>";
            return;
        }

        data.scanHistory.forEach(entry => {
            let div = document.createElement("div");
            div.innerHTML = `<strong>${entry.date}</strong>`;
            entry.results.forEach(result => {
                let p = document.createElement("p");
                p.textContent = result;
                p.className = result.includes("⚠️") ? "warning" : "safe";
                div.appendChild(p);
            });
            historyDiv.appendChild(div);
        });
    });
}

document.getElementById("clearHistory").addEventListener("click", () => {
    chrome.storage.local.set({ scanHistory: [] }, () => {
        loadHistory();
        console.log("🗑 Historique effacé !");
    });
});

// Charger l'historique au démarrage
loadHistory();

});

