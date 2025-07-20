let tabs = [];
let currentTab = 0;

// Load dns-packet once
let dnsPacketReady = false;
const dnsScript = document.createElement('script');
dnsScript.src = "https://cdn.jsdelivr.net/npm/dns-packet@5.6.1/index.min.js";
dnsScript.onload = () => dnsPacketReady = true;
document.head.appendChild(dnsScript);

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    document.getElementById("loadingScreen").style.display = "none";
    addTab();
    loadBookmarks();
  }, 1000);
});

function isHNSDomain(domain) {
  return !domain.includes(".");
}

function isENSDomain(domain) {
  return domain.endsWith(".eth");
}

async function resolveHNS(domain, type = 'A') {
  while (!dnsPacketReady) {
    await new Promise(r => setTimeout(r, 50));
  }

  const query = dnsPacket.encode({
    type: 'query',
    id: 1,
    flags: dnsPacket.RECURSION_DESIRED,
    questions: [{ type, name: domain }]
  });

  const res = await fetch("https://query.hdns.io/dns-query", {
    method: "POST",
    headers: { "Content-Type": "application/dns-message" },
    body: query
  });

  const buf = await res.arrayBuffer();
  const decoded = dnsPacket.decode(new Uint8Array(buf));
  return decoded.answers || [];
}

async function loadUrl() {
  const input = document.getElementById("urlInput");
  let domain = input.value.trim().toLowerCase();
  if (!domain) return;

  const tab = tabs[currentTab];
  const iframe = tab.iframe;

  let ipAnswers = await resolveHNS(domain, 'A');

  if (ipAnswers.length > 0) {
    const ip = ipAnswers[0].data;
    iframe.src = `http://${ip}`;
    iframe.style.display = "block";
    updatePadlock(domain);
    saveBookmark(domain);
    return;
  }

  // Try TXT record (for IPFS / Skynet)
  const txtAnswers = await resolveHNS(domain, 'TXT');
  const txt = txtAnswers.map(a => a.data).find(text => text.includes('dnslink=/ipfs/'));

  if (txt) {
    const hash = txt.split('=')[1]; // "/ipfs/xyz..."
    iframe.src = `https://ipfs.io${hash}`;
    iframe.style.display = "block";
    updatePadlock(domain);
    saveBookmark(domain);
    return;
  }

  // Fail state
  const error = document.createElement("div");
  error.className = "error";
  error.innerText = "Could not resolve domain.";
  tab.container.innerHTML = "";
  tab.container.appendChild(error);
}

function updatePadlock(domain) {
  document.getElementById("lockIcon").style.visibility =
    isHNSDomain(domain) || isENSDomain(domain) ? "visible" : "hidden";
}

function saveBookmark(domain) {
  let bookmarks = JSON.parse(localStorage.getItem("bookmarks") || "[]");
  if (!bookmarks.includes(domain)) {
    bookmarks.push(domain);
    localStorage.setItem("bookmarks", JSON.stringify(bookmarks));
    loadBookmarks();
  }
}

function addTab() {
  const container = document.createElement("div");
  container.className = "tab active";
  const iframe = document.createElement("iframe");
  iframe.src = "about:blank";
  container.appendChild(iframe);

  const tab = { container, iframe };

  const button = document.createElement("button");
  button.className = "tab-button active";
  button.innerHTML = `Tab <span class="tab-close" onclick="closeTab(${tabs.length})">&times;</span>`;
  button.onclick = () => switchTab(tabs.indexOf(tab));
  tab.button = button;

  document.getElementById("tabBar").insertBefore(button, document.getElementById("tabBar").lastChild);
  document.getElementById("tabs").appendChild(container);

  tabs.push(tab);
  switchTab(tabs.length - 1);
}

window.closeTab = function (index) {
  const tab = tabs[index];
  tab.container.remove();
  tab.button.remove();
  tabs.splice(index, 1);
  if (currentTab >= index) {
    currentTab = Math.max(0, currentTab - 1);
  }
  switchTab(currentTab);
};

function switchTab(index) {
  tabs.forEach((tab, i) => {
    tab.container.classList.toggle("active", i === index);
    tab.button.classList.toggle("active", i === index);
  });
  currentTab = index;
}

function toggleDarkMode() {
  document.documentElement.classList.toggle("dark");
  localStorage.setItem("darkMode", document.documentElement.classList.contains("dark"));
}

function loadBookmarks() {
  const container = document.getElementById("bookmarks");
  container.innerHTML = "";

  let bookmarks = JSON.parse(localStorage.getItem("bookmarks") || "[]");

  bookmarks.forEach((bookmark) => {
    const link = document.createElement("a");
    link.href = "#";
    link.textContent = bookmark;
    link.className = "block text-blue-500 hover:underline";
    link.onclick = () => {
      document.getElementById("urlInput").value = bookmark;
      loadUrl();
    };
    container.appendChild(link);
  });
}
