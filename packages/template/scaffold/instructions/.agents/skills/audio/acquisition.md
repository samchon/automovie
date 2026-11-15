# Audio acquisition

Acquisition finds a source for audio the video model does not make, checks its rights and adopts its takes. It serves a requested voice preview, [speech made apart from a take](generated-sound.md), a direct 3D film's dialogue, the beds and score [film sound](film-sound.md) needs, and a [commissioned soundtrack](soundtrack.md).

Audio is generated and recorded outside deterministic replay. Before wiring audio into a render, read the installed packages' contracts for admitted formats and mixing, and this production's host, because a decoder's presence does not mean the delivery entry uses it. Setup and secrets follow [source layout](../development/source-layout.md).

## Source choice

Use the user's recordings or chosen provider first, and [research](../story/planning/research.md) reference sounds when needed. Otherwise compare an existing recording or licensed library, a hosted speech or audio service, and [local speech](#local-speech) or other local generation, against the required language, performance, privacy, cost, hardware and turnaround, using existing connectors and command-line tools before writing acquisition code.

Check each asset's terms, on every layer [media records](../production/media-records.md#records) lists, for commercial use, adaptation, attribution and delivery. Permission to synchronize sound with a film differs from permission to publish its raw files, and a free download grants neither; a recorded song needs both a synchronization license for the composition and a master-use license for the recording. Clone or design a voice after a real person only with that person's recorded consent, and through the provider's own voice verification where it has one.

## Generating speech

Generate one take of a few full lines in the production's language and voice, measure it and have the user listen to it before any batch. Generate a scene's exchange in one request where the speech model takes several speakers, so the turns keep their timing together. Pin each voice with its accepted reference audio and record the model, seed and settings with every take, expecting variation between runs all the same.

## Take adoption

Keep accepted bytes and their record under [media records](../production/media-records.md#records); a regeneration is a new take until the user has heard it. Convert the take to a format the installed packages admit, at the film's sample rate, keeping the original.

Measure durations and trims from the accepted bytes, and place dialogue, captions, cuts and cues against them. When a line does not fit, edit the take, script or shot deliberately and have the user listen to the result.

For a commissioned soundtrack, keep an accepted music take's tempo map beside it, because the screenplay's music events and the scenes' timing cite it. A cue sheet is made later, from the locked cut, under [assembly](../production/assembly.md#repair-and-delivery).

## Listening

Measure what the decoded bytes show, such as duration, silence, clipping and loudness, and ask the user to listen to each adopted take for words, pronunciation, performance and noise. A waveform, timing report or successful render does not show that the intended recording is audible. The [commissioned soundtrack](soundtrack.md) sets the other listenings; in the delivered audio the user listens for intelligibility, missing cues, transitions and the ending.

## Local speech

Speech, such as a voice preview, can be generated on the local machine. [VoxCPM](https://github.com/OpenBMB/VoxCPM) is one option; its README, [installation guide](https://voxcpm.readthedocs.io/en/latest/installation.html) and [quick start](https://voxcpm.readthedocs.io/en/latest/quickstart.html) own model versions, platform requirements and interfaces. Choose a model against the requested language, performance and the actual machine.

Before installing one, get the user's approval for the environment location, dependencies, model downloads and storage, including downloads the first inference triggers; an existing approval covering that setup is enough. Install it in an isolated environment outside the JavaScript dependencies, record the setup in [project context](../production/project-context.md) and document its commands in the README.

## Voice preview

Make a preview only when the user wants to hear the voices before video generation, with [local speech](#local-speech) or another speech service, adding [sound effects](sound-effects.md) only when the user asks for them too. Ask the user to play it alongside the motion hint and listen. A preview is never delivered or required, and the video prompt still carries the film's sound.
