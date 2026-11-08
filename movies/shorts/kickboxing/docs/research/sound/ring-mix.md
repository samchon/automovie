# Ring mix

The owner heard the earlier soundtrack as noise: a 24-second breath recording started on every strike, so dozens of copies overlapped. This study records how the film bounds its cues and the targets the decoded mix must meet.

## Practice {#practice}

- Game engines bound concurrency: each sound group has a voice limit, and a new instance is dropped or steals the oldest while the limit is reached ([Unreal Engine sound concurrency](https://dev.epicgames.com/documentation/en-us/unreal-engine/API/Runtime/Engine/FSoundConcurrencySettings?lang=en-US)).
- A cue starts at its audible onset and ends with its event and decay; beds and effects duck under speech so the line stays intelligible ([Netflix sound mix specifications](https://backlothelp.netflix.com/hc/en-us/articles/360001794307-Netflix-Sound-Mix-Specifications-Best-Practices-v1-5)).

## Law {#law}

- Every cue carries its source offset and its output duration. An effect lasts from its onset to 30 dB under its peak, measured on the file's 50 ms RMS envelope: impact 0.35 s, step 0.10 s, air 0.25 s, fall 0.30 s. Words and the bell play their whole take.
- Effort is heard on kicks only, as one 0.60 s exhale cut from the breath recording (1.40 to 2.00 s), one per fighter at a time.
- One step, air or breath instance per fighter sounds at a time, and at most four foreground cues sound at once; words and the bell are never dropped, then impacts and falls, air, breath and steps in that order.
- The arena crowd is a continuous bed at about -9 dB, split into consecutive cues that continue through the recording; while a word sounds, its segment drops a further 18 dB.

## Measurable targets {#targets}

- Every count word rises at least 12 dB over the bed in the decoded mix: its RMS over the word's take against the bed's RMS in the half second before it.
- No more than four droppable foreground cues sound at once; with words and the bell, the overlap stays at most five.
