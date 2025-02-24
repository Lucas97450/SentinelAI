chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "storeScanResults") {
      chrome.storage.local.set({ scanResults: message.results }, () => {
          console.log("✅ Résultats stockés avec succès !");
          sendResponse({ status: "success" });
      });
      return true; // Assure que sendResponse est bien utilisé
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "storeScanResults") {
      chrome.storage.local.get({ scanHistory: [] }, (data) => {
          let history = data.scanHistory || [];
          history.push({ date: new Date().toLocaleString(), results: message.results });

          chrome.storage.local.set({ scanHistory: history }, () => {
              console.log("✅ Résultats ajoutés à l'historique !");
              sendResponse({ status: "success" });
          });
      });
      return true;
  }
});

