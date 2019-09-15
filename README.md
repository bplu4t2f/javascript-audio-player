# javascript-audio-player
Small library that uses the audio element to create a simple audio player website

See these example pages:

https://bplu4t2f.github.io/javascript-audio-player/mini/  
https://bplu4t2f.github.io/javascript-audio-player/laputa/  
https://bplu4t2f.github.io/javascript-audio-player/setsuna/  
https://bplu4t2f.github.io/javascript-audio-player/winters_end/  

NOTE:  
Due to obvious copyright issues, only the **first 3 tracks** on each page work -- they have been replaced by some random junk

## Usage notes

*player.js* contains the function `player_init`. You give it a bunch of DOM elements when you want to load the player (for example in a `DOMContentLoaded` event).

First, you give it a container with `.play_link` selectable elements, each of which contains the URL to the target file. Something like this will do:

```
<ul id="list">
  <li class="separator">Disc 1</li>
  <li><a class='play_link'>1.01 Beginning of the End.mp3</a></li>
  <li><a class='play_link'>1.02 Loss.mp3</a></li>
  <li><a class='play_link'>1.03 Voyage.mp3</a></li>
  ...
</ul>
```

If you only have an array of file names that you want to play, you may use the auxiliary function `player_fill_list` with an empty `ul`; this function will create that list for you.

In addition to that, you need to pass a bunch of DOM elements that the player needs for its controls, like pause button, seeker, or current track name.

Here is a minimal set of player controls you need to provide, as used in the *mini* example:

```
<p>
  <button id="pause_button">Pause</button>
  <button id="resume_button">Resume</button>
</p>

<p>Current track: <span id="current_track_name"></span></p>

<div id="seeker_container" class="slider_container"></div>
<p>Time: <span id="current_time"></span> / <span id="duration"></span></p>

<div id="volume_container" class="slider_container"></div>
<p>Volume: <span id="volume_text"></span></p>

<p id="playback_error"></p>

<audio id="the_audio"></audio>
<input type="hidden" id="persist_volume"/>
```

In order to make the **seeker** and **volume slider** visible, you need to provide some CSS that gives the `slider_container` a reasonable width and height, and that makes `slider_thumb` visible by giving it a width and some color. For example:

```
.slider_container {
border: 1px solid #000000;
max-width: 20em;
height: 1.5em;
}

.slider_thumb {
background-color: #000000;
width: 1.5em;
}
```

The above HTML and CSS snipptes will produce something like the [mini demo](https://bplu4t2f.github.io/javascript-audio-player/mini/).
