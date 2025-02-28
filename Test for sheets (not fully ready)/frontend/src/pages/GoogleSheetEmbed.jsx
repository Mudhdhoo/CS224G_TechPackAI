// frontend/src/pages/GoogleSheetEmbed.jsx
import React from 'react';

export default function GoogleSheetEmbed() {
  // Example: "https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit?usp=sharing"
  //const embedUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQMj9JN7Kn76epsJlEiEpeZN39s0j4_6qd2995N5Ulpd4M_f92k7Psbw2ckysIKaP27SPDHxSQZcbvT/pubhtml";
  const embedUrl ="https://docs.google.com/spreadsheets/d/1jfPQ6k-8A-dD-8X6Mu5SwQsoKtQOWGDEoZalidI6Wec/edit?usp=sharing"

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <h2>Live Google Sheet</h2>
      <iframe
        src={embedUrl}
        width="100%"
        height="600"
        style={{ border: 'none' }}
        title="Live Google Sheet"
      />
    </div>
  );
}
