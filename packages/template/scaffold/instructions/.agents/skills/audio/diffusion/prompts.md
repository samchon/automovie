# Audio prompts

Keep requested speech, reference transcript and performance instructions distinct. Follow the chosen [model's](models.md) syntax.

## Speech

### Spoken text

Give the exact lines in the requested language. Resolve ambiguous numbers, dates and abbreviations into their intended spoken reading, keeping captions tied to the screenplay's wording.

Use pronunciation dictionaries, aliases or phonemes only in the languages and forms the endpoint supports. A language setting can control normalization without changing a voice's accent, so verify its role in the model's documentation.

### Voice design

Specify the lasting language, regional pronunciation, pitch, resonance, texture and age cues that distinguish the voice. Specify intonation and emphasis separately.

Keep each accepted voice description with its request. Use a reference when preserving an existing voice.

### Performance and dialogue

Direct the line's intent, emotion, pace and emphasis from the screenplay. Keep sustained delivery separate from momentary breaths, laughter and pauses, and scope a change to the turn or words it affects.

Use the documented instruction input or inline notation. A stage direction or speaker name pasted into ordinary spoken text may be read aloud, and pause tags or phoneme syntax from another model or version may not be supported.

Bind each speaker to its voice or reference and preserve turn order through the endpoint's speaker roles. Generate an exchange together where supported; use overlaps only where the model supports them.

Set duration through documented controls, then measure the bytes. Prompted pace and punctuation guide delivery but do not lock picture timing; fit accepted speech under [take adoption](../acquisition.md#take-adoption).

### First take

Compare voices on identical complete lines with difficult names and required emotions. Decode the results and have the user [listen](../listening.md#user-listening) before batching.

Adopt the accepted take under [take adoption](../acquisition.md#take-adoption), with the request's text, controls and inputs in its record. An accepted designed voice can become the cloning reference for later lines; a seed alone does not preserve identity.

## Effects and ambience

Describe source, action, attack, decay, texture, distance and room. State whether the cue is isolated, recurring or continuous.

Keep effects separate from dialogue unless the model supports a combined request, and bind picture references in their documented role.

## Music

For commissioned music, name its role, genre, leading instruments, mood, energy and arrangement. Specify a full mix or an isolated part where supported, and whether it is instrumental; a music model need not generate intelligible lyrics.

Use a tempo target as direction, then keep the accepted take's tempo map under [take adoption](../acquisition.md#take-adoption). Continue or repair from surrounding accepted audio where supported, so the new passage fits its musical context.
