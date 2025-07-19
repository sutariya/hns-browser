let tabs = [];
let currentTab = 0;

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    document.getElementById("loadingScreen").style.display = "none";
    addTab();
    loadBookmarks();

    // Focus input
    const input = document.getElementById("urlInput");
    if (input) input.focus();
  }, 1000);
});

function isHNSDomain(domain) {
  return !domain.includes(".");
}

function isENSDomain(domain) {
  return domain.endsWith(".eth");
}

async function loadUrl() {
  const input = document.getElementById("urlInput");
  let domain = input.value.trim().toLowerCase();

  if (!domain) return;

  const url = getResolvedURL(domain);
  window.open(url, "_blank");
}

function getResolvedURL(domain) {
  if (isHNSDomain(domain)) {
    return `https://${domain}.hns.to`;
  } else if (isENSDomain(domain)) {
    return `https://${domain}.eth.limo`;
  } else {
    return domain.includes("://") ? domain : `https://${domain}`;
  }
}

function addTab() {
  const container = document.createElement("div");
  container.className = "tab active";
  const iframe = document.createElement("iframe");
  iframe.src = "about:blank";
  iframe.style.zIndex = "0";
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
    link.className = "block px-2 py-1 text-blue-500 hover:underline whitespace-nowrap";
    link.onclick = (e) => {
      e.preventDefault();
      document.getElementById("urlInput").value = bookmark;
      loadUrl();
    };
    container.appendChild(link);
  });
}
