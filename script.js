let tabs = [];
let currentTab = 0;

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

async function resolveDomain(domain) {
  const url = `https://doh.nathan.wtf/dns-query?name=${domain}&type=A`;
  const response = await fetch(url, {
    headers: { accept: "application/dns-json" }
  });
  const data = await response.json();
  if (data.Answer && data.Answer.length > 0) {
    return data.Answer[0].data;
  }
  return null;
}

async function loadUrl() {
  const input = document.getElementById("urlInput");
  let domain = input.value.trim().toLowerCase();

  if (!domain) return;

  const ip = await resolveDomain(domain);
  const tab = tabs[currentTab];
  const iframe = tab.iframe;

  if (ip) {
    iframe.src = `https://${ip}`;
    iframe.style.display = "block";
    document.getElementById("lockIcon").style.visibility = isHNSDomain(domain) || isENSDomain(domain) ? "visible" : "hidden";

    if (!localStorage.getItem("bookmarks")) {
      localStorage.setItem("bookmarks", JSON.stringify([]));
    }

    let bookmarks = JSON.parse(localStorage.getItem("bookmarks"));
    if (!bookmarks.includes(domain)) {
      bookmarks.push(domain);
      localStorage.setItem("bookmarks", JSON.stringify(bookmarks));
      loadBookmarks();
    }
  } else {
    const error = document.createElement("div");
    error.className = "error";
    error.innerText = "Could not resolve domain.";
    tab.container.innerHTML = "";
    tab.container.appendChild(error);
  }
}

function addTab() {
  const container = document.createElement("div");
  container.className = "tab active";
  const iframe = document.createElement("iframe");
  iframe.src = "about:blank";
  container.appendChild(iframe);

  const closeTab = () => {
    const index = tabs.indexOf(tab);
    if (index > -1) {
      tabs.splice(index, 1);
      if (currentTab >= index) {
        currentTab = Math.max(0, currentTab - 1);
      }
      switchTab(currentTab);
    }
  };

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

window.closeTab = function(index) {
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

  bookmarks.forEach((bookmark, index) => {
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