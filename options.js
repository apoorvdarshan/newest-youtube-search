const input = document.querySelector("#api-key");
const status = document.querySelector("#status");

chrome.storage.local.get("youtubeApiKey", ({ youtubeApiKey }) => {
  input.value = youtubeApiKey || "";
});

document.querySelector("#save").addEventListener("click", async () => {
  const youtubeApiKey = input.value.trim();
  await chrome.storage.local.set({ youtubeApiKey });
  status.textContent = youtubeApiKey ? "Saved. Return to YouTube and refresh the results page." : "Key removed.";
});

document.querySelector("#reveal").addEventListener("click", (event) => {
  const visible = input.type === "text";
  input.type = visible ? "password" : "text";
  event.currentTarget.textContent = visible ? "Show" : "Hide";
  event.currentTarget.setAttribute("aria-label", visible ? "Show API key" : "Hide API key");
});
