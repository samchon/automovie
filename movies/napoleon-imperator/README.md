# The Napoleon Chronicle

This English document edition maintains the historical screenplay adaptation. Read the final audiovisual screenplay in [docs/body/screenplay](docs/body/screenplay). Its supporting canon, treatments and executable scripts remain in [docs/body](docs/body); creative requirements are in [docs/instructions](docs/instructions).

The [project brief](PROJECT.md) owns the document edition and the separately commissioned episode 1 video. The [source manifest](docs/translation/korean-source-manifest.json) identifies the exact Korean input captured before translation, and the [source archive](docs/translation/korean-source.zip) preserves its original bytes, including line endings. The baseline commit preserves the readable Korean edition. Retained references and source comments remain historical material; their Korean approvals do not approve the English edition.

The English document edition is the current film source. Episode 1 is commissioned with stick figures, minimal object forms and local VoxCPM speech. A runnable [local production viewer](http://127.0.0.1:5187/) displays the retained 44-shot candidate. Its [whole MP4 and technical verification](docs/production/episode-one-encode.md) are available, but the [current directing inspection](docs/production/episode-one-visual-review-3.md) found weak dialogue attention, tactical orientation and emphasis in the ending. A combined canonical screenplay, consumed shooting plan and runtime repair is in progress. Earlier [review 1](docs/production/episode-one-review-1.md) and [review 2](docs/production/episode-one-review-2.md) retain their original editions and limits; neither approves this unfinished repair. [Local speech setup](docs/production/local-speech.md) and [candidate diagnostics](docs/production/speech-diagnostics.md) identify the retained generation and its limits. Historical source-analysis links may refer to records retained in the original writing workspace rather than this edition.

## Run the production viewer

From this repository's root, install the workspace and prepare the fixed edit with the adopted local Python runtime, then start the viewer:

```powershell
pnpm install
& 'D:/github/samchon/.automovie-runtime/voxcpm/Scripts/python.exe' movies/napoleon-imperator/scripts/prepare-film.py
pnpm --filter @automovie/napoleon-imperator dev
```

Open `http://127.0.0.1:5187/`. Its controls play or pause the saved mix, seek output time, select a shot and change the inspection camera. The [campaign record](docs/production/campaign.md) tracks actual checks and remaining work. The user adopted the existing speech without agent audition; the recordings remain unheard by the agent, and missing audition does not block this production. Preserve original generation provenance while checking current words, speakers, order, actual timing and mix wiring. Keep the viewer operational while refining performance and restore a broken path before other work.

The source reads `public/film.json` and retained media from `public/audio/001-road`. Capture uses the separate Vite SSR bundle of the production's public-package integration, avoiding a retained source-runner mirror during encoding. Build it with `pnpm --filter @automovie/napoleon-imperator capture:build`; `pnpm --filter @automovie/napoleon-imperator capture --probe` captures a representative integration probe while the viewer server runs. The full capture omits `--probe` and writes under `public/outputs/episode-one`. A generated file is not delivery approval; inspect the complete encoded artifact and its actual tracks and extent.

The [translation checks](docs/translation/validation.md) record the completed scope and its limits.

Further planning, writing, expression revision and narrative evidence use the [screenwriting task guide](.agents/skills/screenwriting/SKILL.md). Independent review, contract questions and graph configuration retain their own roles.

The [current revision record](docs/analysis/script-revision.md) covers the whole scripts and screenplay inspection, repairs through their actual parents, and current review limits. [Continuing this edition](docs/analysis/script-revision.md#continuing-this-edition) maps each change to its owner, consumers and required workflow. Historical translation checks describe their original edition.
