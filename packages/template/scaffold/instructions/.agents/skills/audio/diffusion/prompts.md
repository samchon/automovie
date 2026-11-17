# Audio prompts

An audio request carries the screenplay's words and sound decisions into the chosen model. Keep spoken text, reference transcript and performance instructions distinct. The chosen model's guide, linked from [models](models.md), owns syntax and takes precedence over these defaults.

## Speech

### Spoken text

Give the exact lines in the requested language. Resolve ambiguous numbers, dates and abbreviations into their intended spoken reading, keeping captions tied to the screenplay's wording.

Use pronunciation dictionaries, aliases or phonemes only in the languages and forms the endpoint supports. A language setting can control normalization without changing a voice's accent, so verify its role in the model's documentation.

### Voice design

Describe the lasting traits the character needs: language and regional pronunciation, pitch, resonance, texture and perceived age. Distinguish regional accent from intonation or emphasis. A neutral voice can take a short description; add detail only where it distinguishes the intended voice.

Keep the accepted description with its request record. For an existing voice, supply its reference by cloning rather than recreate its identity through a new description.

### Performance and dialogue

Direct the line's intent, emotion, pace and emphasis from the screenplay. Keep sustained delivery separate from momentary breaths, laughter and pauses, and scope a change to the turn or words it affects.

Use the documented instruction input or inline notation. A stage direction or speaker name pasted into ordinary spoken text may be read aloud, and pause tags or phoneme syntax from another model or version may not be supported.

Bind each speaker to its voice or reference and preserve turn order through the endpoint's speaker roles. Generate an exchange together where supported; use overlaps only where the model supports them.

Set duration through documented controls, then measure the bytes. Prompted pace and punctuation guide delivery but do not lock picture timing; fit accepted speech under [take adoption](../acquisition.md#take-adoption).

### First take

Compare candidate voices on the same complete lines, with text suited to their intended performance. Include difficult names and the required emotional range before a batch; a very short catchphrase may hide instability. Decode the result and have the user [listen](../acquisition.md#listening).

Adopt the accepted take under [take adoption](../acquisition.md#take-adoption), with the request's text, controls and inputs in its record. An accepted designed voice can become the cloning reference for later lines; a seed alone does not preserve identity.

## Effects and ambience

Turn the sound cue into an audible source and action, then describe its attack, decay, texture, distance and room character. State whether it is an isolated event, repeating texture or continuous ambience; a dramatic scene description alone leaves the sound unspecified.

Keep effects separate from dialogue unless the model supports a combined request, and bind picture references in their documented role.

## Music

For commissioned music, name its role, genre, leading instruments, mood, energy and arrangement. Specify a full mix or an isolated part where supported, and whether it is instrumental; a music model need not generate intelligible lyrics.

Use a tempo target as direction, then keep the accepted take's tempo map under [take adoption](../acquisition.md#take-adoption). Continue or repair from surrounding accepted audio where supported, so the new passage fits its musical context.
