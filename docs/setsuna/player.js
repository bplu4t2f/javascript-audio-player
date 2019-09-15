"use strict";

// Optional helper function that fills an <ul> with an appropriate list element per track.
function player_fill_list(list, track_names)
{
	// The <ul> list will receive one entry for each track:
	// <li><a class="play_link" href="url">url</a></li>
	for (let url of track_names)
	{
		let li = document.createElement("li");
		list.appendChild(li);
		let a_play = document.createElement("a");
		li.appendChild(a_play);
		a_play.textContent = url;
		a_play.classList.add("play_link");
	}
}

function player_init(
	list,
	seeker_container,
	volume_container,
	pause_button,
	resume_button,
	audio,
	current_track_name_container,
	current_time_container,
	duration_container,
	volume_text_container,
	persist_volume,
	playback_error
	)
{
	let tracks = []; // { li, string url }
	let current_track_index = null;
	
	// Save this for later - the current track gets prepended
	let original_title = document.title;

	{
		let track_index = 0;
		for (let a_play of list.querySelectorAll(".play_link"))
		{
			let url = a_play.textContent;
			tracks.push({ a_play: a_play, url: url });
			a_play.href = url;
			let track_index_closure = track_index++;
			a_play.addEventListener("click", function(e)
			{
				play(track_index_closure);
				e.preventDefault();
			});
		}
	}

	let slider_seeker = prepare_slider(seeker_container);
	let slider_volume = prepare_slider(volume_container);
	
	if (persist_volume.value >= 1.0 && persist_volume.value <= 2.0)
	{
		// We're doing this because javascript is retarded
		// In a sane, type-safe programming language, we would check
		// value >= 0.0 && value <= 1.0
		// But in javascript, if persist_volume.value is not set at all,
		// then, if value == "bogus":
		// "bogus" >= 0.0 && "bogus" <= 1.0
		// would be true.
		audio.volume = persist_volume.value - 1.0;
	}

	// NOTE: Seeking on mouse move is not a good idea.
	seeker_container.addEventListener("mousedown", seek_click);
	volume_container.addEventListener("mousemove", volume_click);
	volume_container.addEventListener("mousedown", volume_click);
	pause_button.addEventListener("click", pause);
	resume_button.addEventListener("click", resume);
	
	audio.addEventListener("ended", audio_ended);
	audio.addEventListener("timeupdate", audio_timeupdate);
	audio.addEventListener("volumechange", audio_volumechange);

	const volume_conversion_base = 9.0;
	
	// Initial update of the volume slider and slider number.
	audio_volumechange();
	audio_timeupdate();
	
	// Will attempt to auto-play a file if a hash exists.
	// It probably won't work now because most browsers disable auto-play.
	if (window.location.hash)
	{
		let decoded_hash = decodeURIComponent(window.location.hash.substring(1));
		// Find and play requested file immediately
		for (let i = 0; i < tracks.length; ++i)
		{
			let url = tracks[i].url;
			if (url == decoded_hash)
			{
				set_current_track(i);
				break;
			}
		}
	}
	
	function prepare_slider(container)
	{
		let left_spacer = document.createElement("div");
		let thumb = document.createElement("div");
		thumb.classList.add("slider_thumb");
		let right_spacer = document.createElement("div");
		
		container.style.display = "flex";
		
		container.appendChild(left_spacer);
		container.appendChild(thumb);
		container.appendChild(right_spacer);
		
		return { container: container, left_spacer: left_spacer, thumb: thumb, right_spacer: right_spacer };
	}
	
	function play(track_index)
	{
		set_current_track(track_index);
		resume();
	}
	
	// Updates text boxes etc with the new track index, and preloads audio, but does not play audio yet.
	// The track is ready to play by calling resume() afterwards.
	function set_current_track(track_index)
	{
		let track = tracks[track_index];
		//if (track_index > 4) track = null;
		if (track)
		{
			// Valid track index
			current_track_index = track_index;
			
			current_track_name_container.textContent = track.url;
			document.title = track.url + " - " + original_title;
			window.location.hash = track.url;
			
			audio.src = track.url;
			audio.load();
		}
		else
		{
			// Invalid track index
			current_track_index = null;
			
			current_track_name_container.textContent = "";
			document.title = original_title;
			window.location.hash = "";
		}
		
		for (let t of tracks)
		{
			let child = t.a_play;
			let is_currently_playing = t === track;
			if (is_currently_playing) {
				child.classList.add("currently_playing");
			} else {
				child.classList.remove("currently_playing");
			}
		}
	}

	function pause()
	{
		audio.pause();
	}

	async function resume()
	{
		if (current_track_index === null)
		{
			audio.pause();
			return;
		}
		
		try
		{
			await audio.play();
			playback_error.textContent = "";
			playback_error.classList.remove("playback_error_present");
		}
		catch (error)
		{
			playback_error.textContent = "" + error;
			playback_error.classList.add("playback_error_present");
		}
	}

	// Called when the current track has ended - play next track if possible.
	function audio_ended()
	{
		if (current_track_index === null)
		{
			return;
		}
		
		let next_track_index = current_track_index + 1;
		play(next_track_index);
	}

	// Called periodically when the time position of the current track has changed.
	// Update the current seeker position and time display.
	function audio_timeupdate()
	{
		let time = audio.currentTime;
		let duration = audio.duration;
		
		current_time_container.textContent = format_time(time);
		duration_container.textContent = format_time(duration);
		
		let ratio = time / duration;
		set_slider_pos(ratio, slider_seeker);
	}
	
	// Formats a time value (float in seconds) as a string like "mm:ss".
	function format_time(time)
	{
		if (time === null || time === undefined || isNaN(time))
		{
			return "-:--";
		}
		
		let display_time = Math.floor(time);
		let display_time_minutes = display_time % 60;
		let display_time_seconds = (display_time / 60) >> 0;
		let str = display_time_seconds.toString() + ":" + display_time_minutes.toString().padStart(2, "0");
		return str;
	}

	function volume_displayed_to_real(displayed)
	{
		let real = (Math.pow(volume_conversion_base, displayed)-1)/(volume_conversion_base-1)
		return real;
	}

	function volume_real_to_displayed(real)
	{
		let log_arg = real * (volume_conversion_base - 1) + 1;
		let displayed = Math.log(log_arg) / Math.log(volume_conversion_base);
		return displayed;
	}

	function audio_volumechange()
	{
		let volume = audio.volume;
		
		volume_text_container.textContent = volume.toFixed(2);
		let displayed = volume_real_to_displayed(volume);
		set_slider_pos(displayed, slider_volume);
		
		// + 1.0 -> see comment where this value is read.
		persist_volume.value = volume + 1.0;
	}

	function set_slider_pos(ratio, slider)
	{
		let ratio0 = 1.0 - ratio;
		slider.left_spacer.style.flex = "" + ratio;
		slider.right_spacer.style.flex = "" + ratio0;
	}

	function get_slider_click_ratio(mouse_event, slider)
	{
		let bounds = slider.container.getBoundingClientRect();
		let thumb_width = slider.thumb.offsetWidth;

		let x = mouse_event.clientX - bounds.left - thumb_width / 2;
		
		let container_size = slider.container.clientWidth - thumb_width;
		let ratio = Math.min(Math.max(x / container_size, 0.0), 1.0);
		
		return ratio;
	}

	function seek_click(event)
	{
		if ((event.buttons & 1) == 0) return;
		
		// Prevent text selection when moving the mouse, this would be annoying:
		event.preventDefault();
		
		let ratio = get_slider_click_ratio(event, slider_seeker);

		let duration = audio.duration;
		if (!duration)
		{
			// Happens if the current track has not been loaded correctly
			return;
		}
		
		let seek_pos = ratio * duration;
		audio.currentTime = seek_pos;
		// The timeupdate event will update will move the thumb and update the time number.
	}

	function volume_click(event)
	{
		if ((event.buttons & 1) == 0) return;
		
		// Prevent text selection when moving the mouse, this would be annoying:
		event.preventDefault();
		
		let ratio = get_slider_click_ratio(event, slider_volume);

		let real = volume_displayed_to_real(ratio);
		audio.volume = real;
		// The volumechange event will move the thumb and update the volume number.
	}
}
