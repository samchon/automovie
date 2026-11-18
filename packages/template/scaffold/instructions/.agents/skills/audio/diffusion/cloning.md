# Voice cloning

Voice cloning uses reference audio to condition a speaker's identity. For new words, use reference-conditioned text-to-speech; for an existing delivery, use performance conversion. Voice design from description belongs to [prompts](prompts.md#voice-design).

## Reference and transcript

Choose a checkpoint whose documentation supports cloning in the required language, and check reference permission under [source choice](../acquisition.md#source-choice).

Use a clean single-speaker reference whose delivery fits the task; continuation can carry its emotion, pace and recording character. Trim at complete phrase boundaries and retain the padding the model requires.

Match reference length and format to the model. Verify any reference transcript against the reference audio. Keep it separate from the new words.

## New speech

Bind each character to its accepted reference bytes. Use the checkpoint's recommended reference-only or transcript-conditioned input for the task.

Write new lines and delivery controls under [prompts](prompts.md), and verify a [first take](prompts.md#first-take) before a batch. Reuse the accepted reference for later lines; even a fixed reference can vary between requests.

Record reference digest, conditioning mode and transcript when used under [media records](../../production/media-records.md#records). Fine-tuning also needs training recordings and separate verification.

## Performance conversion

When the words and delivery already work but the voice drifts, convert the existing speech to the accepted voice. [Separate](../film-sound.md#separation) dialogue from the mix first so music and effects are not converted with it.

Compare duration and word boundaries with the source, and have the user [listen](../acquisition.md#listening) for retained expression, voice identity and artifacts. Replace the dialogue stem, recheck synchronization under [partial repair](../../video/finishing.md#partial-repair), and finish the affected [mix](../film-sound.md).
