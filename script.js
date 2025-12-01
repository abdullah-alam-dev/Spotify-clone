let currentSong = new Audio();
let songs = [];
let Folder;
let currentIndex = 0; // keep track of the current song index

// ---------------- getSongs ----------------
async function getSongs(currfolder) {
  Folder = currfolder;
  let a = await fetch(`http://127.0.0.1:5500/${Folder}/`);
  let response = await a.text();
  let div = document.createElement("div");
  div.innerHTML = response;

  let as = div.getElementsByTagName("a");

  // Clear old songs before pushing new ones
  songs = [];

  for (let i = 0; i < as.length; i++) {
    const element = as[i];
    if (element.href.endsWith(".mp3")) {
      let name = element.href.split(`/${Folder}/`)[1];
      songs.push(name);
    }
  }

  // Show all the songs in the playlist
  let songUL = document.querySelector(".songList ul");
  songUL.innerHTML = "";
  for (const song of songs) {
    songUL.innerHTML += `
      <li>
        <i class="fa-solid fa-music song-icon"></i>
        <div class="info">
          <div class="title">${cleanTrackName(song)}</div>
          <div class="artist">Abdullah</div>
        </div>
        <div class="playnow">
          <span>Play Now</span>
          <i class="fa-solid fa-circle-play"></i>
        </div>
      </li>`;
  }

  // Attach click event for each song
  Array.from(
    document.querySelector(".songList").getElementsByTagName("li")
  ).forEach((e, i) => {
    e.addEventListener("click", () => {
      playMusic(i); // play by index
    });
  });

  // play/pause button
  let playBtn = document.getElementById("play");
  playBtn.addEventListener("click", () => {
    if (currentSong.paused) {
      currentSong.play();
      playBtn.classList.remove("fa-circle-play");
      playBtn.classList.add("fa-pause");
    } else {
      currentSong.pause();
      playBtn.classList.remove("fa-pause");
      playBtn.classList.add("fa-circle-play");
    }
  });

  return songs; // ✅ important fix
}

// ---------------- Helpers ----------------
function secondsToMinutesSeconds(seconds) {
  if (isNaN(seconds) || seconds < 0) {
    return "00:00";
  }
  let minutes = Math.floor(seconds / 60);
  let secs = Math.floor(seconds % 60);
  if (minutes < 10) minutes = "0" + minutes;
  if (secs < 10) secs = "0" + secs;
  return minutes + ":" + secs;
}

function cleanTrackName(track) {
  let decoded = decodeURIComponent(track);
  return decoded.replace("_ Density & Time", "").trim();
}

// ---------------- playMusic ----------------
function playMusic(index, pause = false) {
  if (index < 0 || index >= songs.length) return;

  currentIndex = index; // update global index
  const track = songs[index];

  currentSong.src = `/${Folder}/` + track;
  document.querySelector(".songinfo").innerHTML = cleanTrackName(track);

  currentSong.addEventListener(
    "loadedmetadata",
    () => {
      // Update duration
      document.querySelector(".songtime").innerHTML =
        "00:00 / " + secondsToMinutesSeconds(currentSong.duration);

      const playBtn = document.getElementById("play");
      if (!pause) {
        currentSong.play();
        playBtn.classList.remove("fa-circle-play");
        playBtn.classList.add("fa-pause");
      } else {
        currentSong.pause();
        playBtn.classList.remove("fa-pause");
        playBtn.classList.add("fa-circle-play");
      }
    },
    { once: true }
  );
}

// ---------------- displayAlbums ----------------
async function displayAlbums() {
  console.log("displaying albums");

  let a = await fetch(`http://127.0.0.1:5500/songs/`);
  let response = await a.text();

  let div = document.createElement("div");
  div.innerHTML = response;

  let anchors = div.getElementsByTagName("a");
  let cardContainer = document.querySelector(".cardContainer");
  let array = Array.from(anchors);

  for (let index = 0; index < array.length; index++) {
    const e = array[index];
    if (e.href.includes("/songs") && !e.href.includes(".htaccess")) {
      let parts = e.href.split("/").filter(Boolean);
      let folder = parts[parts.length - 1]; // ✅ get the last part

      // skip the base "songs" link
      if (folder === "songs") continue;

      try {
        let a = await fetch(`http://127.0.0.1:5500/songs/${folder}/info.json`);
        let info = await a.json();

        cardContainer.innerHTML += `
          <div data-folder="${folder}" class="card">
            <div class="play_btn">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="black" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" stroke-width="1.5" stroke-linejoin="round"/>
              </svg>
            </div>
            <img src="/songs/${folder}/cover.jpg" alt=""/>
            <h2>${info.title}</h2>
            <p>${info.description}</p>
          </div>`;
      } catch (err) {
        console.error(`Failed to load info.json for folder: ${folder}`, err);
      }
    }
  }

  // add click event to cards
  Array.from(document.getElementsByClassName("card")).forEach((e) => {
    e.addEventListener("click", async (item) => {
      console.log("Fetching Songs");
      songs = await getSongs(`songs/${item.currentTarget.dataset.folder}`);
      if (songs.length) {
        playMusic(0); // ✅ play first song by index
      }
    });
  });
}

// ---------------- main ----------------
async function main() {
  await getSongs("songs/ncs");

  // play first song by default
  if (songs.length) playMusic(0, true);
  await displayAlbums();

  // update songtime + seekbar
  currentSong.addEventListener("timeupdate", () => {
    document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(
      currentSong.currentTime
    )} / ${secondsToMinutesSeconds(currentSong.duration)}`;

    let percent = (currentSong.currentTime / currentSong.duration) * 100;
    document.querySelector(".seekbar .circle").style.left = percent + "%";
  });

  // seekbar click
  document.querySelector(".seekbar").addEventListener("click", (e) => {
    let percent = e.offsetX / e.target.getBoundingClientRect().width;
    currentSong.currentTime = currentSong.duration * percent;
  });

  // hamburger menu
  document.querySelector(".hamburger").addEventListener("click", () => {
    document.querySelector(".left").style.left = "0";
  });
  document.querySelector(".close").addEventListener("click", () => {
    document.querySelector(".left").style.left = "-100%";
  });

  // previous button
  document.querySelector("#previous").addEventListener("click", () => {
    if (!songs.length) return;
    if (currentIndex > 0) {
      playMusic(currentIndex - 1);
    } else {
      playMusic(0);
    }
  });

  // next button
  document.querySelector("#next").addEventListener("click", () => {
    if (!songs.length) return;
    if (currentIndex < songs.length - 1) {
      playMusic(currentIndex + 1);
    } else {
      playMusic(songs.length - 1);
    }
  });

  // volume
  document
    .querySelector(".range")
    .getElementsByTagName("input")[0]
    .addEventListener("change", (e) => {
      currentSong.volume = parseInt(e.target.value) / 1000;
    });




    // Add event listener to mute the track
// Add event listener to mute the track
document.querySelector(".volume i").addEventListener("click", e => {
    console.log(e.target);
    console.log("changing", e.target.className);

    if (e.target.classList.contains("fa-volume-high")) {
        // Change to mute icon
        e.target.classList.remove("fa-volume-high");
        e.target.classList.add("fa-volume-xmark");

        // Mute audio
        currentSong.volume = 0;
        document.querySelector(".range input").value = 0;
    } 
    else {
        // Change back to volume icon
        e.target.classList.remove("fa-volume-xmark");
        e.target.classList.add("fa-volume-high");

        // Restore volume
        currentSong.volume = 1;
        document.querySelector(".range input").value = 100;
    }
});

}

main();










