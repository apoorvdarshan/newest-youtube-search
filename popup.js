const input = document.querySelector("#api-key");
const status = document.querySelector("#status");
const enabledInput = document.querySelector("#extension-enabled");
const stateCopy = document.querySelector("#state-copy");

function setEnabledUi(enabled) {
  enabledInput.checked = enabled;
  stateCopy.textContent = enabled ? "Newest-first search is on." : "YouTube search stays untouched.";
}

chrome.storage.local.get(["youtubeApiKey", "extensionEnabled"], ({ youtubeApiKey, extensionEnabled }) => {
  input.value = youtubeApiKey || "";
  setEnabledUi(extensionEnabled !== false);
  if (youtubeApiKey) status.textContent = "Connected — refresh YouTube to apply changes.";
});

enabledInput.addEventListener("change", async () => {
  const extensionEnabled = enabledInput.checked;
  await chrome.storage.local.set({ extensionEnabled });
  setEnabledUi(extensionEnabled);
  status.textContent = extensionEnabled ? "Enabled. Refresh YouTube to apply changes." : "Disabled. YouTube is restored.";
});

document.querySelector("#save").addEventListener("click", async () => {
  const youtubeApiKey = input.value.trim();
  await chrome.storage.local.set({ youtubeApiKey });
  status.textContent = youtubeApiKey ? "Saved. Refresh your YouTube search." : "Key removed.";
});

document.querySelector("#reveal").addEventListener("click", (event) => {
  const hidden = input.type === "password";
  input.type = hidden ? "text" : "password";
  event.currentTarget.textContent = hidden ? "Hide" : "Show";
  event.currentTarget.setAttribute("aria-label", hidden ? "Hide API key" : "Show API key");
});
