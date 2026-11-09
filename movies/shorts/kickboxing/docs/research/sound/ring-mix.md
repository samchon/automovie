# Ring mix

The owner heard the earlier soundtrack as noise: a 24-second breath recording started on every strike at full length, so hundreds of copies overlapped into a wall over the crowd, and only six of the ten count words rose 12 dB over the bed. This study records how the film bounds its cues and the targets the decoded mix must meet.

## Practice {#practice}

- Game engines bound concurrency: each sound group has a voice limit, and a new instance is dropped or steals the oldest while the limit is reached ([Unreal Engine sound concurrency](https://dev.epicgames.com/documentation/en-us/unreal-engine/API/Runtime/Engine/FSoundConcurrencySettings?lang=en-US)).
- A cue starts at its audible onset and ends with its event and decay; beds and effects duck under speech so the line stays intelligible ([Netflix sound mix specifications](https://backlothelp.netflix.com/hc/en-us/articles/360001794307-Netflix-Sound-Mix-Specifications-Best-Practices-v1-5)).
- Kickboxing and Muay Thai coaches teach a sharp exhale on every strike, timed with its extension; with a mouthguard it comes out as a short hiss or grunt through closed teeth or the nose ([Fairtex](https://fairtexstore.com/blogs/news/what-s-the-right-way-to-breathe-during-muay-thai-strikes), [Muay Thai Guy](https://muay-thai-guy.com/blog/muay-thai-grunt), [Evolve MMA](https://evolve-mma.com/blog/6-easy-ways-to-improve-your-striking/)).

## Law {#law}

- Every cue carries its source offset and its output duration, and none reads past its file or the film. A one-shot lasts from its onset to the end of its last 50 ms RMS window within 30 dB of the file's loudest: impact 0.30 to 0.35 s, step 0.10 s, air 0.25 s, fall 0.30 s, the words 0.50 to 2.05 s. The bell plays its whole 2.1 s ring.
- Every thrown strike carries the striker's exhale, never a feint: a 0.20 s hiss cut from the front of the breath recording's third burst (1.44 to 1.64 s, its onset through its -13 dB peak to 6 dB under it, on a 10 ms RMS envelope), its peak on the contact, at gain 0.15 (about -16.5 dB, 15 dB under a landed impact).
- Breath is otherwise heard only where the story motivates it, as one 0.60 s exhale cut from the breath recording (1.40 to 2.00 s): once after a combination of three or more strikes, after the last strike's hiss, once when the fallen fighter lands and every 2.5 s while he lies, and every second while the winner celebrates. No breath covers a spoken word, and each fighter breathes once at a time.
- One instance per source (a fighter's feet, breath, or the air past his head) sounds at a time; at most two impacts, one canvas landing, two rushes of air, two footfalls and two breaths at once; at most four foreground cues at once. Words and the bell are never dropped; the rest are dropped first to last: steps, then strike hiss and air, then motivated breath, then impacts and falls.
- The arena crowd is a continuous bed at gain 0.35 (about -9 dB), split into consecutive cues that continue through the recording and cross by the mixer's 4 ms edge fade. It ducks 18 dB (about -27 dB) from half a second before each word to its end, held across gaps under half a second so the count is one ducked span. It rises 6 dB (about -3 dB) from the knockout's fall to two seconds after the landing and through the celebration. A duck wins over a rise.

## Measurable targets {#targets}

- Every count word rises at least 12 dB over the bed in the decoded mix: its RMS over the word's cue against the mix's RMS in the half second before it, leaving out other words' cues (`SoundMix.words`).
- No more than four droppable foreground cues sound at once; with words and the bell, the overlap stays at most six (`SoundCues.overlap`).
