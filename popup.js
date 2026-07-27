const input = document.querySelector("#api-key");
const status = document.querySelector("#status");

chrome.storage.local.get("youtubeApiKey", ({ youtubeApiKey }) => {
  input.value = youtubeApiKey || "";
  if (youtubeApiKey) status.textContent = "Connected — refresh YouTube to apply changes.";
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
