async function resolveHNS() {
  const domain = document.getElementById("domainInput").value.trim();
  const errorDiv = document.getElementById("error");
  const iframe = document.getElementById("viewer");
  errorDiv.textContent = "";
  iframe.srcdoc = "";

  if (!domain) {
    errorDiv.textContent = "Please enter a domain.";
    return;
  }

  try {
    // Build DNS query for A record
    const pkt = dnsPacket.encode({
      type: "query",
      id: 1,
      flags: dnsPacket.RECURSION_DESIRED,
      questions: [{ type: "A", name: domain }]
    });

    const response = await fetch("https://query.hdns.io/dns-query ", {
      method: "POST",
      headers: {
        "Content-Type": "application/dns-message",
        Accept: "application/dns-message"
      },
      body: pkt
    });

    const buffer = await response.arrayBuffer();
    const result = dnsPacket.decode(buffer);

    const aRecords = result.answers.filter(a => a.type === "A");
    if (aRecords.length > 0) {
      const ip = aRecords[0].data;
      iframe.src = `http://${ip}`;
      return;
    }

    // Try TXT record for IPFS
    const txtPkt = dnsPacket.encode({
      type: "query",
      id: 2,
      flags: dnsPacket.RECURSION_DESIRED,
      questions: [{ type: "TXT", name: domain }]
    });

    const txtResponse = await fetch("https://query.hdns.io/dns-query ", {
      method: "POST",
      headers: {
        "Content-Type": "application/dns-message",
        Accept: "application/dns-message"
      },
      body: txtPkt
    });

    const txtBuffer = await txtResponse.arrayBuffer();
    const txtResult = dnsPacket.decode(txtBuffer);

    const txtRecords = txtResult.answers
      .filter(a => a.type === "TXT")
      .map(a => a.data)
      .flat()
      .join("");

    const dnslinkMatch = txtRecords.match(/dnslink=([^"]+)/);
    if (dnslinkMatch) {
      const ipfsHash = dnslinkMatch[1];
      iframe.src = `https://ipfs.io ${ipfsHash}`;
      return;
    }

    errorDiv.textContent = "Domain could not be resolved.";
  } catch (err) {
    console.error(err);
    errorDiv.textContent = "Error resolving domain.";
  }
}
