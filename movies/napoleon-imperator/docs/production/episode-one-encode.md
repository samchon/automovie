# Episode 1 complete encode verification

The complete repaired episode exists as an MP4. This record verifies encoding, decoded extent, sampled encoded pictures and actual native video controls; it does not grant final audiovisual acceptance. Continuous audience viewing and listening to the selected speech and complete soundtrack remain unperformed. [Independent review 2](episode-one-review-2.md) records the separate current-source and sampled-performance judgment.

## Actual artifact

The [MP4](../../public/outputs/episode-one/runs/2026-10-30T05-39-06-671Z-883b5595c1fe-da92a05b/the-road-gives-way.mp4) belongs to run `2026-10-30T05-39-06-671Z-883b5595c1fe-da92a05b` and runtime identity `883b5595c1fe2d281df40f3b04b1c704544c0af001999952e3d07e61b0c3a954`. Its 23,322,699 bytes have SHA-256 `084aa663f78b47b3758d63c1a9bfcdb013ac6b8626ebe026ce76eacbd1bbc47e`. The capture completed all 9,217 frames through the same public viewer capture path as the reviewed inspection, with unchanged inputs. Its original baseline, encoder log, capture observations and completion output inventory remain untouched in the run directory.

| Observed property | Result |
| --- | --- |
| Picture | H.264 High, progressive yuv420p, 1280 by 720, 24 fps |
| Video extent | 9,217 decoded frames; native duration 384.041667 seconds |
| Sound | AAC-LC, 48 kHz stereo; actual average bitrate reported as 106 kb/s |
| Decoded sound extent | 18,434,048 frames, 384.0426667 seconds |
| Source PCM extent | 18,434,000 frames; delivered decode has 48 extra samples, 1 millisecond |
| Decoded sound peak | 0.826385498046875 |
| Source versus delivered audio | Difference RMS 0.0011908848770168076 over their common extent; lossy AAC is not byte-identical PCM |

FFmpeg 7.1 decoded the entire video and audio with `-xerror -err_detect explode`, exit 0, final progress marker and all 9,217 video frames. The [separate verification folder](../../public/outputs/episode-one/verification/2026-10-30T05-39-06-671Z-883b5595c1fe-da92a05b-bf35c7e0) retains the complete decode log/progress, delivered audio decode, exact inspection scripts, extracted pictures, native playback observations and their receipts. Its inventory identifies 156 files by size and SHA-256 and excludes the inventory itself. The inventory's SHA-256 is `38ce0f45527baeedc9792b9c7205ce47bf895912497a63055d380a0c0f5c5d6d`. These files were written outside the original capture run so its completion inventory remains true.

The [durable observation package](observations/encoded-episode-one/README.md) preserves that complete follow-up population, original inventory and capture records losslessly, with every expanded member verified. It also exposes the actual encoded-frame/audio record and native ending directly. The local MP4 remains separately retained at the exact digest above.

## Encoded images and playback

The verification extracted the MP4's actual entry, middle and exit frame for each of all 44 shots, 132 pictures. Entry and exit include both adjacent frames of every one of the 43 joins. Their frame indices, timestamps, PNG digests and source comparisons are in `verification.json`. Mean RGB error against the original probe population was 1.3962 on a 0–255 scale; median RGB RMSE was 2.0469 and the maximum was 4.9587 at the author-card entry. These are encoding comparisons, not an artistic pass threshold.

The writer opened all 12 sheets containing the complete encoded sample population, then the full-resolution author-card entry and middle, the original author-card entry and the native ending screenshot. The inspected output retains the chapter progression, source qualifications, standard transfer, wounded return, night sequence and complete commentary text. No new sampled truncation or corruption was established. This is sampled image inspection rather than continuous motion, every-frame contact proof or a judgment of timing with audible sound.

The MP4 was opened directly at its actual local HTTP URL in Chrome's native video document. Metadata reported 1280 by 720, 384.041667 seconds, ready state 4 and no media error. Actual playback decoded 16 frames with zero dropped or corrupted frames, advancing past half a second. Pause held exactly at 0.515727 seconds. Seeking to 383.941667 seconds displayed the full commentary card with native controls, ready state 4 and no media error. No page error occurred. This playback was muted and does not establish hearing or continuous audience viewing.

A preceding inspection-harness attempt created a video element in an `about:blank` document and timed out waiting for metadata. Its failed harness and explicit failure record remain in the separate verification folder. Request and console details were not captured, so its underlying cause is not established. Using the actual native video document succeeded without changing the film, media or production source.

## Remaining acceptance

All 27 speech selections remain `candidate-unheard`, including the explicit provisional line-026 alternative. Hear every selected take and the complete delivered mix with picture before judging pronunciation, names, acting, intelligibility, masking, pauses, required reading and humming, effects and synchronization. In particular, the wine event uses the procedural murmur recipe; its suitability as a wordless tune is unaccepted. Continuous whole viewing must also judge fine contacts, tactical cross-cuts, urgency and the empty place at the ending. Neither ASR, decoded audio measurements, sampled visual success nor native controls answer those experience questions.
