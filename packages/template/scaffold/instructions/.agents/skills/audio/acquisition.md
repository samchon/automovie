# Audio acquisition

Audio is acquired only for a requested voice preview or a [commissioned soundtrack](SKILL.md#commissioned-soundtrack); a generated film's sound needs none of it.

Audio generation and recording happen outside deterministic replay. Read the installed packages' contracts for admitted formats and mixing, and this production's host, before wiring audio into a render; a decoder's presence does not mean the delivery entry uses it. Setup and secrets follow [source layout](../development/layout.md).

## Choose a source

Use the user's supplied recordings or chosen provider first, and [research](../story/planning/research.md) reference sounds when needed. Otherwise compare an existing recording or licensed library, a hosted speech or audio service, and local generation against the required language, performance, privacy, cost, hardware and turnaround, using existing connectors and command-line tools before writing acquisition code.

Check each asset's license for commercial use, adaptation, attribution and delivery; permission to synchronize sound with a film differs from permission to publish its raw files, and a free download grants neither.

## Adopt a take

Keep accepted bytes and their record under [media records](../production/media-records.md#records); a regeneration is a new take until the user has heard it. Convert to the installed decoder's admitted format while keeping the original.

For a commissioned soundtrack, keep an accepted music take's tempo map and cue sheet beside it: they are the anchors the screenplay's music events and the scenes' timing cite.

Measure durations and trims from the accepted bytes, place dialogue, captions, cuts and cues against them, and when a line does not fit, edit the take, script or shot intentionally and have the user listen to the result.

## Have it heard

Measure what decoded bytes show, such as duration, silence, clipping and loudness, and ask the user to listen to each adopted take for words, pronunciation, performance and noise. For a commissioned soundtrack, ask the user to listen to the delivered audio with its picture for intelligibility, missing cues, transitions and the ending.

A waveform, timing report or successful render does not establish that the intended recording is audible. Fix acquisition, identity, timing or wiring at its owner.
