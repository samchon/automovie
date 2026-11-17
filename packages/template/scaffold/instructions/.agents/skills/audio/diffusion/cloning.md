# Voice cloning

Voice cloning uses reference audio to condition a speaker's identity. For new words, use reference-conditioned text-to-speech; for an existing delivery, use performance conversion. Voice design from description belongs to [prompts](prompts.md#voice-design).

## Reference and transcript

Choose a checkpoint whose documentation supports cloning in the required language, and check reference permission under [source choice](../acquisition.md#source-choice).

Use a clean single-speaker reference whose delivery fits the task; continuation can carry its emotion, pace and recording character. Trim at complete phrase boundaries and retain the padding the model requires.

Meet the model's reference length and format requirements. When the chosen mode takes a transcript, match the reference's spoken words; that transcript is separate from the new words to generate. Check any automatic transcription before using it as conditioning.

## New speech

Bind each character to its accepted reference bytes. Reference-only cloning and transcript-conditioned continuation use different information, so follow the checkpoint's recommended conditioning for the task; omitting a transcript can change quality, not merely save transcription.

Write new lines and delivery controls under [prompts](prompts.md), and verify a [first take](prompts.md#first-take) before a batch. Reuse the accepted reference for later lines; even a fixed reference can vary between requests.

Record the reference digest, conditioning mode and transcript where used with each take under [media records](../../production/media-records.md#records). Reference-based inference and fine-tuning are separate tasks; adapting model weights additionally needs training recordings and its own verification.

## Performance conversion

When the words and delivery already work but the voice drifts, convert the existing speech to the accepted voice. [Separate](../film-sound.md#separation) dialogue from the mix first so music and effects are not converted with it.

Compare duration and word boundaries with the source, and have the user [listen](../acquisition.md#listening) for retained expression, voice identity and artifacts. Replace the dialogue stem, recheck synchronization under [partial repair](../../video/finishing.md#partial-repair), and finish the affected [mix](../film-sound.md).
