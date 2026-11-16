# Audio models

These models differ in how they create a voice, take a reference and preserve a performance. The user may choose another. Verify the selected checkpoint under [model documentation](SKILL.md#model-documentation).

Choose against the requested language, reference material, performance and rights. Check the exact checkpoint's terms under [source choice](../acquisition.md#source-choice); code and weights can have different licenses.

## Voice cloning

[VoxCPM2](https://github.com/OpenBMB/VoxCPM) designs voices from text, clones from reference audio, or continues a reference with its transcript. It supports Korean among 30 languages, with Apache-2.0 code and weights. Earlier VoxCPM releases have different language coverage.

[Qwen3-TTS](https://github.com/QwenLM/Qwen3-TTS) separates **Base** checkpoints for reference cloning, **VoiceDesign** for descriptions, and **CustomVoice** for provided speakers. Its ten languages include Korean; the releases use Apache-2.0. Choose Base when cloning an arbitrary reference.

[CosyVoice3](https://github.com/QwenAudio/CosyVoice) offers cross-language reference cloning and performance instructions. The [Fun-CosyVoice3-0.5B-2512 checkpoint](https://huggingface.co/FunAudioLLM/Fun-CosyVoice3-0.5B-2512) supports Korean among nine languages under Apache-2.0. Its [examples](https://github.com/QwenAudio/CosyVoice/blob/main/example.py) distinguish instruction and reference modes.

[GPT-SoVITS](https://github.com/RVC-Boss/GPT-SoVITS) offers reference synthesis and few-shot voice adaptation, including Korean. Adaptation adds preparation of training recordings. The repository is MIT; check pretrained components and recordings separately.

[Chatterbox](https://github.com/resemble-ai/chatterbox) provides multilingual reference cloning including Korean; Turbo and Nano target English with smaller models. Its repository declares the research retired and unmaintained since August 2026, retaining MIT code. Account for maintenance before adoption.

[XTTS-v2](https://huggingface.co/coqui/XTTS-v2) clones from one or several references across 17 languages including Korean. Its weights use the Coqui Public Model License. The maintained [TTS code fork](https://github.com/idiap/coqui-ai-TTS) does not relicense them.

## Voice design and dialogue

[MOSS-TTS](https://github.com/OpenMOSS/MOSS-TTS) has separate long-speech, dialogue, voice-design, realtime and effects models. Its [v1.5 speech checkpoint](https://huggingface.co/OpenMOSS-Team/MOSS-TTS-v1.5) supports reference cloning and duration control across 31 languages including Korean under Apache-2.0. Choose the family member for the task.

[MOSS-TTSD](https://github.com/OpenMOSS/MOSS-TTSD) uses speaker-bound references and transcript prefixes for continued dialogue. Its speaker and language support belong to that release, separately from the single-speaker model.

[Fish Drama 3](https://huggingface.co/fishaudio/drama-3) generates multiple characters and long content with reference voices and local revisions. [S2-Pro](https://github.com/fishaudio/fish-speech) is a smaller previous generation.

Its [direction guide](https://docs.fish.audio/features/text-to-speech/drama-3) distinguishes line delivery, momentary sounds and word-scoped changes. Use that release's notation rather than another model's tags.

Drama 3's license file uses Fish Audio Community terms while model metadata still labels research terms; inspect the downloaded revision. S2-Pro retains research terms.

[Higgs TTS 3](https://huggingface.co/bosonai/higgs-tts-3-4b) offers conversational reference cloning and inline performance controls, including Korean. Its custom license has a creator-use grant with attribution conditions, separate from hosted or product use. The older Higgs repository is not its runtime.

## Emotion and continuation

[IndexTTS-2.5](https://github.com/index-tts/index-tts) separates speaker and emotion references, with speed and pronunciation controls. It lists Chinese, English, Japanese, Spanish and Arabic, not Korean. Read its Bilibili Model Use License and check which duration controls the selected release implements.

[F5-TTS](https://github.com/SWivid/F5-TTS) uses flow matching for reference-and-transcript continuation. Its [inference guide](https://github.com/SWivid/F5-TTS/blob/main/src/f5_tts/infer/README.md) covers reference trimming, punctuation and number readings. Code is MIT, but official [weights](https://huggingface.co/SWivid/F5-TTS) are CC-BY-NC-4.0; community checkpoints need separate evidence.

## Converting a performance

[OpenVoice V2](https://github.com/myshell-ai/OpenVoice) separates base speech synthesis from tone-color conversion, supporting six languages including Korean under MIT. Use [performance conversion](cloning.md#performance-conversion) when an existing delivery should guide the result; reference-conditioned TTS can choose new timing.

## Other roles

[VibeVoice](https://github.com/microsoft/VibeVoice) separates ASR and realtime synthesis from its original TTS release, whose code Microsoft removed. An available recognizer or experimental speaker does not establish arbitrary-reference cloning. Follow the selected component's documentation.

[ElevenLabs](https://elevenlabs.io/docs/overview/capabilities/text-to-speech/best-practices) offers hosted speech with model-specific pronunciation and delivery controls. Its [voice-design guide](https://elevenlabs.io/docs/eleven-creative/voices/voice-design) separates voice traits from preview text, while [voice changer](https://elevenlabs.io/docs/overview/capabilities/voice-changer) converts an existing performance.

[Gemini TTS](https://aistudio.google.com/docs/speech-generation#prompting-guide) separates the spoken transcript, turn-level delivery and momentary vocal events. Its current endpoint's structured input differs from earlier prompt-only examples; verify the endpoint before reusing a recipe.

## Effects and ambience

[Stable Audio 3](https://github.com/Stability-AI/stable-audio-3) generates instrumental music and effects under Stability's Community License. Its [prompt guide](https://stability.ai/guides/stable-audio-3-prompt-guide) covers sources, acoustic character, stems, audio variations and continuation; it is not intended for intelligible vocals.

[MOSS-SoundEffect](https://github.com/OpenMOSS/MOSS-TTS) is another purpose-built effects model. Hand generated cues to [sound effects](../sound-effects.md).

[MMAudio](https://github.com/hkchengrex/MMAudio) takes picture and text for short effects and ambience, not dialogue or a continuous scene bed. Code is MIT and checkpoints CC-BY-NC-4.0. Scene continuity belongs to [film sound](../film-sound.md).
