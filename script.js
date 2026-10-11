
"use strict";

// A small helper to find an HTML element by its ID.
const $ = (id) => document.getElementById(id);

// Read saved data. If storage is unavailable or invalid,
// start with the supplied default value.
function loadData(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch (error) {
    return fallback;
  }
}

// Save data in this browser.
function saveData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    alert("Browser storage is full or unavailable. Try fewer or smaller photos.");
    return false;
  }
}

// Create a date and time string in the user's local timezone.
function toLocalDateTime(date) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset)
    .toISOString()
    .slice(0, 16);
}

// Load the previously saved meeting date.
// If there is none, use a date seven days from now.
const defaultMeeting = new Date();
defaultMeeting.setDate(defaultMeeting.getDate() + 7);

let meetingDate =
  loadData("uwm-meeting", null) ||
  toLocalDateTime(defaultMeeting);

// Load saved notes and photos.
let notes = loadData("uwm-notes", []);
let photos = loadData("uwm-photos", []);

// Keep only valid arrays if the stored data is unexpected.
if (!Array.isArray(notes)) notes = [];
if (!Array.isArray(photos)) photos = [];

// Connect the date picker to our saved meeting date.
$("meeting-date").value = meetingDate;

// Calculate the countdown.
function updateCountdown() {
  const target = new Date(meetingDate).getTime();
  const now = Date.now();

  // Stop if the date is invalid.
  if (!Number.isFinite(target)) {
    $("countdown-message").textContent =
      "Please choose a valid meeting date.";
    return;
  }

  // Difference is measured in milliseconds.
  const difference = target - now;

  // If the date has passed, show zeroes.
  if (difference <= 0) {
    $("days").textContent = "00";
    $("hours").textContent = "00";
    $("minutes").textContent = "00";
    $("seconds").textContent = "00";

    $("countdown-message").textContent =
      "The moment is here! Make a beautiful memory. ♡";
    return;
  }

  // Convert milliseconds into whole days.
  const days = Math.floor(difference / 86400000);

  // Remove full days, then calculate remaining hours.
  const hours = Math.floor(
    (difference % 86400000) / 3600000
  );

  // Calculate remaining minutes.
  const minutes = Math.floor(
    (difference % 3600000) / 60000
  );

  // Calculate remaining seconds.
  const seconds = Math.floor(
    (difference % 60000) / 1000
  );

  // Update the visible numbers.
  $("days").textContent = days;
  $("hours").textContent = String(hours).padStart(2, "0");
  $("minutes").textContent = String(minutes).padStart(2, "0");
  $("seconds").textContent = String(seconds).padStart(2, "0");

  $("countdown-message").textContent =
    "Our next chapter is getting closer ♡";
}

// Save a newly selected meeting date.
$("date-form").addEventListener("submit", function (event) {
  event.preventDefault();

  const selected = $("meeting-date").value;

  if (!selected || !Number.isFinite(new Date(selected).getTime())) {
    alert("Please select a valid meeting date and time.");
    return;
  }

  meetingDate = selected;

  if (saveData("uwm-meeting", meetingDate)) {
    updateCountdown();
    alert("Your meeting date has been saved! ♡");
  }
});

// Refresh the countdown every second.
updateCountdown();
setInterval(updateCountdown, 1000);

// Generate a demo invitation code.
// This does NOT create a real shared couple account.
$("create-code").addEventListener("click", function () {
  const code = Math.random().toString(36)
    .slice(2, 8)
    .toUpperCase();

  $("my-code").textContent = "Your demo code: " + code;

  $("connection-message").textContent =
    "Demo only: this code exists in this browser and cannot connect another device yet.";
});

// Show a clear message when a code is entered.
$("join-form").addEventListener("submit", function (event) {
  event.preventDefault();

  const code = $("partner-code").value.trim();

  if (!code) {
    $("connection-message").textContent =
      "Please enter an invitation code.";
    return;
  }

  $("connection-message").textContent =
    "The invitation screen is ready, but real partner connection needs Firebase.";
});

// Draw all saved love notes on the page.
function renderNotes() {
  const list = $("notes-list");

  // Remove the previous display.
  list.replaceChildren();

  if (notes.length === 0) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "Your first little note can go here. ♡";
    list.appendChild(empty);
    return;
  }

  notes.forEach(function (note, index) {
    const card = document.createElement("article");
    card.className = "note";

    const text = document.createElement("p");

    // textContent prevents user-entered HTML from running.
    text.textContent = note;

    const remove = document.createElement("button");
    remove.className = "delete-button";
    remove.type = "button";
    remove.textContent = "Remove note";

    remove.addEventListener("click", function () {
      notes.splice(index, 1);

      if (saveData("uwm-notes", notes)) {
        renderNotes();
      }
    });

    card.append(text, remove);
    list.appendChild(card);
  });
}

// Save a new note when the form is submitted.
$("note-form").addEventListener("submit", function (event) {
  event.preventDefault();

  const text = $("note-input").value.trim();

  if (!text) return;

  notes.unshift(text);

  if (saveData("uwm-notes", notes)) {
    $("note-input").value = "";
    renderNotes();
  } else {
    notes.shift();
  }
});

// Display saved photos.
function renderPhotos() {
  const list = $("photos-list");
  list.replaceChildren();

  if (photos.length === 0) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "Your favorite moments will live here. ♡";
    list.appendChild(empty);
    return;
  }

  photos.forEach(function (photo, index) {
    const card = document.createElement("article");
    card.className = "photo-card";

    const img = document.createElement("img");
    img.src = photo.data;
    img.alt = photo.name || "A saved memory";

    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "Remove photo";

    remove.addEventListener("click", function () {
      const oldPhotos = photos;
      photos = photos.filter((item, i) => i !== index);

      if (saveData("uwm-photos", photos)) {
        renderPhotos();
      } else {
        photos = oldPhotos;
      }
    });

    card.append(img, remove);
    list.appendChild(card);
  });
}

// Turn uploaded photos into data URLs so the demo can save them.
$("photo-input").addEventListener("change", async function (event) {
  const files = Array.from(event.target.files || []);

  // Limit each upload batch to five images, each at most 1 MB.
  const selected = files.slice(0, 5);
  const validFiles = selected.filter(function (file) {
    return file.type.startsWith("image/") &&
      file.size <= 1024 * 1024;
  });

  if (validFiles.length !== files.length) {
    alert("Only the first five images are considered. Each image must be 1 MB or smaller.");
  }

  const added = [];

  for (const file of validFiles) {
    try {
      const data = await new Promise(function (resolve, reject) {
        const reader = new FileReader();

        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);

        reader.readAsDataURL(file);
      });

      added.push({
        name: file.name,
        data: data
      });
    } catch (error) {
      alert("One of the photos could not be read.");
    }
  }

  const oldPhotos = photos;
  photos = photos.concat(added);

  if (saveData("uwm-photos", photos)) {
    renderPhotos();
  } else {
    photos = oldPhotos;
  }

  // Allow the same photo to be selected again later.
  event.target.value = "";
});

// Make decorative hearts appear at random positions.
function createHeart() {
  const heart = document.createElement("span");

  heart.className = "floating-heart";
  heart.textContent = Math.random() > 0.5 ? "♡" : "♥";

  heart.style.left = Math.random() * 100 + "%";
  heart.style.fontSize = (14 + Math.random() * 20) + "px";
  heart.style.animationDuration = (7 + Math.random() * 7) + "s";

  $("hearts").appendChild(heart);

  // Remove old hearts after their animation ends.
  heart.addEventListener("animationend", function () {
    heart.remove();
  });
}

// Restore saved content on page load.
renderNotes();
renderPhotos();

// Create one decorative heart every 900 milliseconds.
setInterval(createHeart, 900);
