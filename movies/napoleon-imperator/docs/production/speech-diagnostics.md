# Episode 1 speech diagnostics

This local inspection covers candidate audio, not listening or acting acceptance. All takes retain `candidate-unheard`. ASR can misrecognize words and its timestamps are approximate. Lexical differences and low-energy intervals identify passages to inspect; they do not establish an audio defect.

Run: `2026-10-29T16:26:52.828374+00:00`. Complete: `True`. Input population: 27 takes. Source SHA-256: `694c7f781924d01ddc3cbed78e2a989eb2a38a975c9696caad4c30787e7df91a`.

Model: `openai/whisper-tiny.en` at `87c7102498dcde7456f24cfd30239ca606ed9063`. CPU threads: 4. No expected text, prompt, prior transcript or voice reference is supplied to the recognizer. Resampling from the saved PCM to 16 kHz occurs only in memory.

The [machine-readable report](speech-diagnostics.json) retains every actual word and take-relative timestamp, digest, measurement, decoding parameter, difference span and failure. Deletion candidates have no recognized time; use neighboring recognized words from that report. A 20 ms RMS window below -45 dBFS contributes to low-energy intervals of at least 0.5 s.

Word edits retain homophones such as `corps` / `core` and name spellings; they are not a pronunciation verdict. Zero-duration word timestamps and words spanning pauses can occur in Whisper alignment. Previous inspection results, parameters and limitations are retained in `previousInspections`.

| Take | Seconds | Word edits | Raw recognition |
| --- | ---: | ---: | --- |
| line-001 | 2.08 | 0 | Out of the way, they're coming! |
| line-002 | 1.28 | 0 | How far are we going? |
| line-003 | 3.04 | 1 | Orders to concentrate the core. Take them. |
| line-004 | 3.36 | 0 | No report of their arrival yet. Wait for word. |
| line-005 | 6.40 | 0 | If we stay scattered, the enemy will take us one by one. Let us ask to withdraw together. |
| line-006 | 3.04 | 1 | My outposts have been pushed back to. |
| line-007 | 4.64 | 2 | Marshall Lannis, you write it. We are of one mind. |
| line-008 | 2.24 | 0 | I shall make clear that you both agree. |
| line-009 | 1.92 | 1 | So, what do you think? |
| line-010 | 4.00 | 1 | Sire. My core can face twice its number. |
| line-011 | 3.36 | 0 | You asked me to write it, and now I am the only one asking. |
| line-012 | 1.60 | 1 | He asked about my core. |
| line-013 | 2.88 | 2 | Marshall Salt, I challenge you to a duel. |
| line-014 | 3.20 | 0 | We must bring the army together. We shall withdraw. |
| line-015 | 3.84 | 0 | Move the army back. Send the orders to withdraw. |
| line-016 | 0.96 | 2 | Yes, I am. |
| line-017 | 4.80 | 0 | We go down this way and cut the road. Each column will take its assigned route. |
| line-018 | 1.60 | 0 | Read that part again. |
| line-019 | 2.08 | 0 | Long live the emperor! |
| line-020 | 3.68 | 0 | I sent you a challenge. I thought you knew how to use a sword. |
| line-021 | 2.40 | 0 | We have more important business today. |
| line-022 | 1.60 | 0 | You contemptible man! |
| line-023 | 1.28 | 0 | Pass some this way! |
| line-024 | 3.68 | 0 | Put the men who are here into the line. We cannot wait for the rest. |
| line-025 | 4.48 | 0 | Strike the center. We must take the ground they have left. |
| line-026 | 1.44 | 2 | Yes, I said... |
| line-027 | 23.36 | 4 | Our first story stops on the night of victory. The quarrel over the duel comes from an account. Teabaugh said he heard from Lance's aid. The guard cavalry sequence follows Raps later memoir within a narrow scope. We reconstructed the conversations and the lives of unnamed soldiers. Please remember that these memoirs are not recordings of that day. Beside tonight's cheering, we have left a place for those who did not return. |

References: [model card](https://huggingface.co/openai/whisper-tiny.en), [Whisper API](https://huggingface.co/docs/transformers/model_doc/whisper).

Regenerate this diagnostic with the isolated runtime and its existing `HF_HOME`: `python scripts/inspect-speech.py --threads 4`. This writes only the two diagnostic reports; it does not regenerate or adopt audio.
