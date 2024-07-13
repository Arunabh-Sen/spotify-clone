console.log("Let's write some JS");

let songs;
let currFolder;
let currentAudio = null;
let playButton = null;
let currentSongIndex = 0;

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

async function getSongs(folder) {
    currFolder = folder;
    try {
        let response = await fetch(`http://127.0.0.1:3000/${folder}/`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        let text = await response.text();
        let div = document.createElement("div");
        div.innerHTML = text;
        let as = div.getElementsByTagName("a");
        let songList = [];
        for (let index = 0; index < as.length; index++) {
            const element = as[index];
            if (element.href.endsWith(".mp3")) {
                songList.push(decodeURIComponent(element.href.split(`/${folder}/`)[1]));
            }
        }
        return songList;
    } catch (error) {
        console.error('Error fetching songs:', error);
        return []; // Return empty array in case of error
    }
}

function playMusic(track, autoPlay = true) {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0; // Reset the current audio
        currentAudio.removeEventListener('ended', playNext);
    }
    currentAudio = new Audio(`/${currFolder}/${track}`);
    if (autoPlay) {
        currentAudio.play();
        playButton.src = "pause.svg";
    } else {
        playButton.src = "play.svg";
    }
    document.querySelector(".songinfo").innerHTML = track;
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";

    currentAudio.addEventListener("loadedmetadata", () => {
        let duration = formatTime(currentAudio.duration);
        document.querySelector(".songtime").innerHTML = `00:00 / ${duration}`;
    });

    currentAudio.addEventListener("timeupdate", () => {
        let currentTime = currentAudio.currentTime;
        let duration = currentAudio.duration || 0;
        let percentage = (currentTime / duration) * 100;
        document.querySelector(".circle").style.left = `${percentage}%`;

        let currentTimeFormatted = formatTime(currentTime);
        let durationFormatted = formatTime(duration);
        document.querySelector(".songtime").innerHTML = `${currentTimeFormatted} / ${durationFormatted}`;
    });

    currentAudio.addEventListener('ended', playNext);
}

function playNext() {
    if ((currentSongIndex + 1) < songs.length) {
        currentSongIndex++;
        playMusic(songs[currentSongIndex]);
    }
    // Optionally handle the case when playlist ends here
    // else {
    //     currentSongIndex = 0;
    //     currentAudio = null;
    //     playButton.src = "play.svg";
    // }
}

async function main() {
    songs = await getSongs("songs/indian");

    let songUL = document.querySelector(".songList ul");
    songUL.innerHTML = "";
    for (const song of songs) {
        let displayName = song.replace(".mp3", "").replaceAll("%20", " ");
        songUL.innerHTML += `<li>
                            <img class="invert" src="music.svg" alt="">
                            <div class="info">
                                <div>${displayName}</div>
                            </div>
                            <div class="playnow">
                                <span>Play Now</span>
                                <img class="invert" src="play.svg" alt="">
                            </div> 
                        </li>`;
    }

    Array.from(document.querySelectorAll(".songList li")).forEach((e, index) => {
        e.addEventListener("click", () => {
            let songName = e.querySelector(".info div").innerText.trim();
            console.log(songName);
            currentSongIndex = index;
            playMusic(`${songName}.mp3`);  // Adding the extension back when playing the song
        });
    });

    playButton = document.getElementById("play");
    playButton.addEventListener("click", () => {
        if (currentAudio && currentAudio.paused) {
            currentAudio.play();
            playButton.src = "pause.svg";
        } else if (currentAudio) {
            currentAudio.pause();
            playButton.src = "play.svg";
        }
        document.querySelector(".songtime").innerHTML = `${formatTime(currentAudio.currentTime)} / ${formatTime(currentAudio.duration || 0)}`;
        document.querySelector(".circle").style.left = `${(currentAudio.currentTime / currentAudio.duration) * 100}%`;
    });

    // Add an event listener to seekbar
    document.querySelector(".seekbar").addEventListener("click", (e) => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = `${percent}%`;
        currentAudio.currentTime = ((currentAudio.duration) * percent) / 100;
    });

    if (songs.length > 0) {
        playMusic(songs[0], false);
    }

    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    let previous = document.getElementById("previous");
    let next = document.getElementById("next");

    previous.addEventListener("click", () => {
        console.log("Previous clicked");
        if ((currentSongIndex - 1) >= 0) {
            currentSongIndex--;
            playMusic(songs[currentSongIndex]);
        }
    });

    next.addEventListener("click", () => {
        console.log("Next clicked");
        if ((currentSongIndex + 1) < songs.length) {
            currentSongIndex++;
            playMusic(songs[currentSongIndex]);
        }
    });

    document.querySelector(".range input").addEventListener("change", (e) => {
        console.log(e, e.target, e.target.value);
        currentAudio.volume = parseInt(e.target.value) / 100;
    });

    // Load the playlist whenever the card is clicked
    Array.from(document.getElementsByClassName("card")).forEach((e) => {
        e.addEventListener("click", async (item) => {
            console.log(item.target, item.currentTarget.dataset);
            let newSongs = await getSongs(`songs/${item.currentTarget.dataset.folder}`);
            songUL.innerHTML = "";
            currentSongIndex = 0;
            for (const song of newSongs) {
                let displayName = song.replace(".mp3", "").replaceAll("%20", " ");
                songUL.innerHTML += `<li>
                                    <img class="invert" src="music.svg" alt="">
                                    <div class="info">
                                        <div>${displayName}</div>
                                    </div>
                                    <div class="playnow">
                                        <span>Play Now</span>
                                        <img class="invert" src="play.svg" alt="">
                                    </div> 
                                </li>`;
            }

            Array.from(document.querySelectorAll(".songList li")).forEach((e, index) => {
                e.addEventListener("click", () => {
                    let songName = e.querySelector(".info div").innerText.trim();
                    console.log(songName);
                    currentSongIndex = index;
                    playMusic(`${songName}.mp3`);  // Adding the extension back when playing the song
                });
            });

            songs = newSongs;
        });
    });
}

main();
