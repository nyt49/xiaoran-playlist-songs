const songs = [
  // 甜歌
  { title: "心花開", artist: "李千娜", tags: ["台語", "甜歌", "李千娜"] },
  { title: "Mr.Chu", artist: "Apink", tags: ["韓文", "甜歌", "Apink"] },
  { title: "寵愛", artist: "TFBOYS", tags: ["中文", "甜歌", "推薦", "TFBOYS"] },
  { title: "女孩", artist: "韋禮安", tags: ["中文", "甜歌", "韋禮安"] },
  { title: "泡泡糖", artist: "NCT", tags: ["中文", "甜歌", "NCT"] },
  { title: "湊熱鬧", artist: "BY2", tags: ["中文", "甜歌", "BY2"] },
  { title: "喜歡你", artist: "陳潔怡", tags: ["中文", "甜歌", "陳潔怡"] },
  { title: "日不落", artist: "蔡依林", tags: ["中文", "甜歌", "推薦", "蔡依林"] },
  { title: "愛不釋手", artist: "NCT", tags: ["中文", "甜歌", "NCT"] },
  { title: "蝴蝶少女", artist: "EXO", tags: ["中文", "甜歌", "EXO", "推薦"] },
  { title: "告白氣球", artist: "周杰倫", tags: ["中文", "甜歌", "周杰倫"] },
  { title: "一笑傾城", artist: "汪蘇瀧", tags: ["中文", "甜歌", "汪蘇瀧"] },
  { title: "愛情闖進門", artist: "BY2", tags: ["中文", "甜歌", "BY2"] },
  { title: "淋雨一直走", artist: "張韶涵", tags: ["中文", "甜歌", "張韶涵"] },
  { title: "七彩的微風", artist: "真珠美人魚", tags: ["中文", "甜歌", "推薦", "真珠美人魚"] },
  { title: "戀愛ing", artist: "五月天", tags: ["中文", "甜歌", "五月天"] },
  { title: "Honey", artist: "郭書瑤", tags: ["中文", "甜歌", "郭書瑤"] },
  { title: "青春修煉手冊", artist: "TFBOYS", tags: ["中文", "甜歌", "TFBOYS"] },
  { title: "love more", artist: "畢書盡", tags: ["中文", "甜歌", "畢書盡"] },
  { title: "whatever", artist: "PiXXiE", tags: ["中文", "甜歌", "PiXXiE"] },
  { title: "不靈不靈", artist: "很美味", tags: ["中文", "甜歌", "很美味"] },
  { title: "有點甜", artist: "汪蘇瀧 / BY2", tags: ["中文", "甜歌", "汪蘇瀧", "BY2"] },
  { title: "愛ㄚ愛ㄚ", artist: "BY2", tags: ["中文", "甜歌", "BY2"] },

  // Emo
  { title: "座位", artist: "姚曉棠", tags: ["中文", "Emo", "姚曉棠"] },
  { title: "唯一", artist: "告五人", tags: ["中文", "Emo", "告五人"] },
  { title: "囂張", artist: "en", tags: ["中文", "Emo", "en"] },
  { title: "童話", artist: "光良", tags: ["中文", "Emo", "光良"] },
  { title: "雨愛", artist: "楊丞琳", tags: ["中文", "Emo", "楊丞琳"] },
  { title: "我看過", artist: "周星星", tags: ["中文", "Emo", "周星星"] },
  { title: "想見你", artist: "八三夭", tags: ["中文", "Emo", "八三夭"] },
  { title: "這時煙火", artist: "NCT", tags: ["中文", "Emo", "NCT"] },
  { title: "時間煮雨", artist: "郁可唯", tags: ["中文", "Emo", "郁可唯"] },
  { title: "為心導航", artist: "EXO", tags: ["中文", "Emo", "EXO"] },
  { title: "百年孤寂", artist: "王菲", tags: ["中文", "Emo", "王菲"] },
  { title: "我喜歡你", artist: "芒果醬", tags: ["台語", "Emo", "新歌", "芒果醬"] },
  { title: "我們的明天", artist: "鹿晗", tags: ["中文", "Emo", "鹿晗"] },
  { title: "你懂不懂我", artist: "BY2", tags: ["中文", "Emo", "BY2"] },
  { title: "太陽與地球", artist: "盧廣仲", tags: ["中文", "Emo", "新歌", "盧廣仲"] },
  { title: "我還是愛著你", artist: "MP魔幻力量", tags: ["中文", "Emo", "MP魔幻力量"] },
  { title: "十二月的奇蹟", artist: "EXO", tags: ["中文", "Emo", "EXO"] },
  { title: "每天在擔心", artist: "翁祥", tags: ["中文", "Emo", "翁祥"] },
  { title: "妥協", artist: "en", tags: ["中文", "Emo", "en"] },
  { title: "座位", artist: "姚曉棠", tags: ["中文", "Emo", "姚曉棠"] },
  { title: "如果可以", artist: "韋禮安", tags: ["中文", "Emo", "韋禮安"] },
  { title: "介意", artist: "白峻嘉", tags: ["中文", "Emo", "白峻嘉"] },
  { title: "沒理由", artist: "BY2", tags: ["中文", "Emo", "BY2"] },

  // 其他歌曲
  { title: "致愛", artist: "鹿晗", tags: ["中文", "鹿晗"] },
  { title: "離開的一路上", artist: "理想混蛋", tags: ["中文", "理想混蛋"] },
  { title: "天空海", artist: "NCT", tags: ["中文", "NCT"] },
  { title: "我們青春", artist: "李玉璽", tags: ["中文", "李玉璽"] },
  { title: "小城夏天", artist: "LBI利比", tags: ["中文", "LBI利比"] },
  { title: "Beatbox", artist: "NCT", tags: ["韓文", "NCT"] },
  { title: "彼得潘", artist: "EXO", tags: ["中文", "EXO"] },
  { title: "歐若拉", artist: "張韶涵", tags: ["中文", "張韶涵"] },
  { title: "你並不懂我", artist: "BY2", tags: ["中文", "BY2"] },
  { title: "新少女祈禱", artist: "BY2", tags: ["中文", "BY2"] },
  { title: "你不會一輩子的愛上我", artist: "Tyson Yoshi", tags: ["中文", "推薦", "Tyson Yoshi"] },
  { title: "有沒有", artist: "BY2", tags: ["中文", "BY2"] },
  { title: "無垢", artist: "李浩瑋", tags: ["中文", "新歌", "李浩瑋"] },
  { title: "真心話", artist: "李浩瑋", tags: ["中文", "新歌", "李浩瑋"] },
  { title: "星空", artist: "五月天", tags: ["中文", "五月天"] },
  { title: "天機", artist: "MP魔幻力量 / 阿信", tags: ["中文", "MP魔幻力量", "五月天"] },
  { title: "勢在必行", artist: "陳勢安 / 畢書盡", tags: ["中文", "陳勢安", "畢書盡"] },
  { title: "初雪", artist: "EXO", tags: ["韓文", "EXO"] },
  { title: "小幸運", artist: "田馥甄", tags: ["中文", "田馥甄"] },
  { title: "舅媽", artist: "巴大雄", tags: ["中文", "推薦", "巴大雄"] },
  { title: "Without you", artist: "NCT", tags: ["中文", "NCT"] }
];

// 預定義的分類
const MOOD_TAGS = ["甜歌", "Emo"];
const CAT_TAGS = ["推薦", "新歌"];
const LANG_TAGS = ["中文", "台語", "韓文"];

// ===== 狀態 =====
const activeTypes = new Set();
const activeLanguages = new Set();
const activeArtists = new Set();
let searchQuery = "";

const songGrid = document.getElementById("songGrid");
const songCount = document.getElementById("songCount");
const clearBtn = document.getElementById("clearBtn");
const searchInput = document.getElementById("searchInput");
const activeFiltersLabel = document.getElementById("activeFiltersLabel");
const bubblesContainer = document.getElementById("bubblesContainer");
const typeButtonsContainer = document.getElementById("categoryButtons");
const languageButtonsContainer = document.getElementById("languageButtons");
const artistButtonsContainer = document.getElementById("artistButtons");
const TYPE_TAGS = [...MOOD_TAGS, ...CAT_TAGS];

function getSongArtists(song) {
  return song.artist.split(/\s*\/\s*/).map(name => name.trim()).filter(Boolean);
}

function getAllArtists() {
  return [...new Set(songs.flatMap(getSongArtists))]
    .sort((a, b) => a.localeCompare(b, "zh-Hant"));
}

function createBubbles() {
  if (!bubblesContainer) return;
  const emojis = ["🍒", "✦", "♡"];
  for (let i = 0; i < 16; i++) {
    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    bubble.style.left = (Math.random() * 100) + "%";
    bubble.style.fontSize = (0.75 + Math.random() * 0.8) + "rem";
    bubble.style.animationDuration = (16 + Math.random() * 16) + "s";
    bubble.style.animationDelay = (Math.random() * 16) + "s";
    bubblesContainer.appendChild(bubble);
  }
}

function getFilteredSongs() {
  const query = searchQuery.trim().toLocaleLowerCase();
  return songs.filter(song => {
    const typeMatch = activeTypes.size === 0 || song.tags.some(tag => activeTypes.has(tag));
    const languageMatch = activeLanguages.size === 0 || song.tags.some(tag => activeLanguages.has(tag));
    const artistNames = getSongArtists(song);
    const artistMatch = activeArtists.size === 0 || artistNames.some(artist => activeArtists.has(artist));
    const searchMatch = !query ||
      song.title.toLocaleLowerCase().includes(query) ||
      song.artist.toLocaleLowerCase().includes(query);
    return typeMatch && languageMatch && artistMatch && searchMatch;
  });
}

function updateButtonGroup(container, values, counts, selectedSet) {
  container.innerHTML = "";
  values.forEach(value => {
    const count = counts[value] || 0;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "filter-btn" + (selectedSet.has(value) ? " active" : "");
    button.dataset.tag = value;
    button.textContent = value + " (" + count + ")";
    button.setAttribute("aria-pressed", String(selectedSet.has(value)));
    if (count === 0 && !selectedSet.has(value)) button.classList.add("unavailable");
    container.appendChild(button);
  });
}

function renderFilters() {
  const filteredSongs = getFilteredSongs();
  const tagCounts = {};
  const artistCounts = {};

  filteredSongs.forEach(song => {
    song.tags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
    getSongArtists(song).forEach(artist => {
      artistCounts[artist] = (artistCounts[artist] || 0) + 1;
    });
  });

  updateButtonGroup(typeButtonsContainer, TYPE_TAGS, tagCounts, activeTypes);
  updateButtonGroup(languageButtonsContainer, LANG_TAGS, tagCounts, activeLanguages);
  updateButtonGroup(artistButtonsContainer, getAllArtists(), artistCounts, activeArtists);
}

function toggleType(tag) {
  if (activeTypes.has(tag)) activeTypes.delete(tag);
  else activeTypes.add(tag);
  renderAll();
}

function toggleLanguage(tag) {
  if (activeLanguages.has(tag)) activeLanguages.delete(tag);
  else activeLanguages.add(tag);
  renderAll();
}

function toggleArtist(artist) {
  if (activeArtists.has(artist)) activeArtists.delete(artist);
  else activeArtists.add(artist);
  renderAll();
}

function updateActiveFiltersLabel() {
  const parts = [];
  if (activeLanguages.size) parts.push("語言：" + [...activeLanguages].join("、"));
  if (activeTypes.size) parts.push("類型：" + [...activeTypes].join("、"));
  if (activeArtists.size) parts.push("歌手：" + [...activeArtists].join("、"));
  if (searchQuery.trim()) parts.push("搜尋：「" + searchQuery.trim() + "」");
  activeFiltersLabel.textContent = parts.length ? parts.join("　") : "尚未選擇任何分類";
}

function getTitleLength(title) {
  const normalized = /^[\x00-\x7F\s]*$/.test(title) ? title.replace(/\s+/g, "") : title;
  return Array.from(normalized).length;
}

function escapeHTML(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderSongs() {
  const filtered = getFilteredSongs()
    .map((song, originalIndex) => ({ song: song, originalIndex: originalIndex }))
    .sort((a, b) =>
      getTitleLength(a.song.title) - getTitleLength(b.song.title) ||
      a.originalIndex - b.originalIndex
    )
    .map(item => item.song);

  songCount.textContent = "共 " + filtered.length + " 首歌曲";

  if (filtered.length === 0) {
    songGrid.innerHTML = '<div class="no-results"><span class="emoji">🍒</span>找不到符合的歌曲，換個關鍵字試試看吧！</div>';
    return;
  }

  songGrid.innerHTML = filtered.map(song => {
    const displayTags = song.tags.filter(tag => [...MOOD_TAGS, ...CAT_TAGS, ...LANG_TAGS].includes(tag));
    const tagHTML = displayTags.map(tag =>
      '<span class="song-tag tag-' + escapeHTML(tag) + '">' + escapeHTML(tag) + '</span>'
    ).join("");

    return '<article class="song-card">' +
      '<div class="song-title-container">' +
      '<div class="song-title">' + escapeHTML(song.title) + '</div>' +
      '<button class="copy-btn" type="button" title="複製歌名" aria-label="複製歌名：' + escapeHTML(song.title) + '" data-song="' + escapeHTML(song.title) + '">📋</button>' +
      '</div><div class="song-artist">' + escapeHTML(song.artist) + '</div>' +
      '<div class="song-tags">' + tagHTML + '</div></article>';
  }).join("");
}

function renderAll() {
  renderSongs();
  renderFilters();
  updateActiveFiltersLabel();
}

typeButtonsContainer.addEventListener("click", event => {
  const button = event.target.closest(".filter-btn");
  if (button) toggleType(button.dataset.tag);
});

languageButtonsContainer.addEventListener("click", event => {
  const button = event.target.closest(".filter-btn");
  if (button) toggleLanguage(button.dataset.tag);
});

artistButtonsContainer.addEventListener("click", event => {
  const button = event.target.closest(".filter-btn");
  if (button) toggleArtist(button.dataset.tag);
});

clearBtn.addEventListener("click", () => {
  activeTypes.clear();
  activeLanguages.clear();
  activeArtists.clear();
  searchQuery = "";
  searchInput.value = "";
  renderAll();
});

searchInput.addEventListener("input", event => {
  searchQuery = event.target.value;
  renderAll();
});

const randomSongBtn = document.getElementById("randomSongBtn");
const randomSongModal = document.getElementById("randomSongModal");
const randomSongBtnNext = document.getElementById("randomSongBtnNext");
const randomSongBtnClose = document.getElementById("randomSongBtnClose");

function getRandomSong() {
  const eligibleSongs = getFilteredSongs();
  const pool = eligibleSongs.length ? eligibleSongs : songs;
  return pool[Math.floor(Math.random() * pool.length)];
}

function displayRandomSong(song) {
  document.getElementById("randomSongTitle").textContent = song.title;
  document.getElementById("randomSongArtist").textContent = song.artist;
  const tagsContainer = document.getElementById("randomSongTags");
  tagsContainer.innerHTML = song.tags
    .filter(tag => [...MOOD_TAGS, ...CAT_TAGS, ...LANG_TAGS].includes(tag))
    .map(tag => '<span class="random-song-tag tag-' + escapeHTML(tag) + '">' + escapeHTML(tag) + '</span>')
    .join("");
  randomSongModal.classList.add("active");
}

randomSongBtn.addEventListener("click", () => displayRandomSong(getRandomSong()));
randomSongBtnNext.addEventListener("click", () => displayRandomSong(getRandomSong()));
randomSongBtnClose.addEventListener("click", () => randomSongModal.classList.remove("active"));
randomSongModal.addEventListener("click", event => {
  if (event.target === randomSongModal) randomSongModal.classList.remove("active");
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape") randomSongModal.classList.remove("active");
});

document.addEventListener("click", async event => {
  const button = event.target.closest(".copy-btn");
  if (!button) return;
  const originalText = button.textContent;
  try {
    await navigator.clipboard.writeText(button.dataset.song);
    button.textContent = "✓";
  } catch (error) {
    button.textContent = "複製失敗";
    console.error("複製失敗：", error);
  }
  setTimeout(() => { button.textContent = originalText; }, 1400);
});

function init() {
  createBubbles();
  renderAll();
}

init();
