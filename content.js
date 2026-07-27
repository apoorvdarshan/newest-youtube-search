(() => {
  let apiSearchStartedFor = "";

  function searchQuery() {
    return new URL(location.href).searchParams.get("search_query") || "";
  }

  function publishedLabel(isoDate) {
    return new Intl.RelativeTimeFormat(undefined, { numeric: "auto" }).format(
      Math.round((new Date(isoDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000)), "day"
    );
  }

  function renderApiResults(items, query) {
    document.querySelector("#yt-api-date-results")?.remove();
    const target = document.querySelector("ytd-section-list-renderer");
    const template = document.querySelector("ytd-video-renderer");
    if (!target || !template) return;
    const panel = document.createElement("section");
    panel.id = "yt-api-date-results";
    panel.setAttribute("aria-label", `Newest YouTube results for ${query}`);
    for (const { id, snippet } of items) {
      // Clone YouTube's own result-card structure so the API list stays visually native.
      const video = template.cloneNode(true);
      const url = `/watch?v=${encodeURIComponent(id.videoId)}`;
      const image = snippet.thumbnails.medium?.url || snippet.thumbnails.default.url;
      video.querySelectorAll("a#thumbnail, a#video-title").forEach((link) => { link.href = url; });
      video.querySelectorAll("img").forEach((img) => { img.src = image; img.srcset = ""; });
      const title = video.querySelector("#video-title");
      if (title) title.textContent = snippet.title;
      const channel = video.querySelector("ytd-channel-name a, #channel-name a");
      if (channel) channel.textContent = snippet.channelTitle;
      const metadata = video.querySelector("#metadata-line");
      if (metadata) metadata.textContent = publishedLabel(snippet.publishedAt);
      const description = video.querySelector("#description-text");
      if (description) description.textContent = snippet.description || "";
      panel.appendChild(video);
    }
    target.before(panel);
    target.style.display = "none";
  }

  function restoreYouTubeResults() {
    document.querySelector("#yt-api-date-results")?.remove();
    const results = document.querySelector("ytd-section-list-renderer");
    if (results) results.style.display = "";
  }

  async function loadTrueNewestResults() {
    const query = searchQuery();
    if (!query || apiSearchStartedFor === query) return;
    const { youtubeApiKey, extensionEnabled } = await chrome.storage.local.get(["youtubeApiKey", "extensionEnabled"]);
    if (!youtubeApiKey || extensionEnabled === false) return;
    apiSearchStartedFor = query;
    try {
      const params = new URLSearchParams({ part: "snippet", type: "video", order: "date", maxResults: "50", q: query, key: youtubeApiKey });
      const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
      if (!response.ok) throw new Error("API request failed");
      const { items } = await response.json();
      renderApiResults(items || [], query);
    } catch {
      apiSearchStartedFor = "";
      console.warn("Newest extension: API search failed. Check the saved API key.");
    }
  }

  function relativeDateToTime(text) {
    const value = text.toLowerCase().replace(/,/g, "").trim();
    const match = value.match(/(\d+)\s+(second|minute|hour|day|week|month|year)s?\s+ago/);
    if (!match) return null;
    const amount = Number(match[1]);
    const unit = match[2];
    const ms = {
      second: 1000,
      minute: 60 * 1000,
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30.44 * 24 * 60 * 60 * 1000,
      year: 365.25 * 24 * 60 * 60 * 1000
    }[unit];
    return Date.now() - amount * ms;
  }

  function resultItems() {
    // YouTube groups standard search videos in nested item sections. Querying all
    // cards is more resilient than assuming they are direct children of #contents.
    return [...document.querySelectorAll("ytd-search ytd-video-renderer")];
  }

  function dateFor(item) {
    const metadata = item.querySelector("#metadata-line");
    if (!metadata) return null;
    for (const span of metadata.querySelectorAll("span")) {
      const time = relativeDateToTime(span.textContent);
      if (time) return time;
    }
    return null;
  }

  function sortLoaded(newestFirst) {
    const items = resultItems();
    const sortable = items
      .map((item, index) => ({ item, index, time: dateFor(item) }))
      .filter(({ time }) => time !== null);
    if (sortable.length < 2) {
      setNote("Load more video results first.");
      return;
    }
    // Preserve YouTube's separate result sections, but sort each section's video
    // cards by the published-date text shown on the card.
    const groups = new Map();
    for (const entry of sortable) {
      const parent = entry.item.parentElement;
      if (!groups.has(parent)) groups.set(parent, []);
      groups.get(parent).push(entry);
    }
    let sortedCount = 0;
    for (const [parent, group] of groups) {
      group.sort((a, b) => newestFirst ? b.time - a.time : a.time - b.time);
      for (const { item } of group) parent.appendChild(item);
      sortedCount += group.length;
    }
    setNote(`Sorted ${sortedCount} loaded videos ${newestFirst ? "newest first" : "oldest first"}.`);
  }

  document.addEventListener("yt-navigate-finish", () => {
    apiSearchStartedFor = "";
    restoreYouTubeResults();
    loadTrueNewestResults();
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local" || !changes.extensionEnabled) return;
    apiSearchStartedFor = "";
    if (changes.extensionEnabled.newValue === false) restoreYouTubeResults();
    else loadTrueNewestResults();
  });
  loadTrueNewestResults();
})();
