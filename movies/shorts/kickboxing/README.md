# Kickboxing

A 180-second AutoMovie production: one championship-level kickboxing round filmed as a single take, finished by A's right Brazilian kick at 150 seconds, the real-time ten-count and A's celebration. [PROJECT.md](PROJECT.md) holds the commission and scope; the [screenplay](docs/body/screenplay/kickboxing.md) decides every exchange.

## Run

Use Node.js 22.23.2 or later from the repository workspace.

```bash
pnpm --filter kickboxing dev     # Viewer at http://127.0.0.1:5199/
pnpm --filter kickboxing lint
pnpm --filter kickboxing build
pnpm --filter kickboxing test
```

While editing, keep one compile checker running, `pnpm ttsc --watch --noEmit` in `test/`, and read type errors from it, as [development](.agents/skills/development/SKILL.md) sets.

Mounting the film prepares two Human skeletons (the fighters share one) and measures every contact, which takes minutes on a loaded machine; the status line reports progress. `?rig=1` shows the review skeleton of all three bodies; `?film=kickboxing&start=140&end=160&rate=0.5&play=1` plays an interval.

## Render

With the Viewer running and `CHROME_PATH` set to Chrome or Chromium:

```bash
pnpm --filter kickboxing render --film kickboxing http://127.0.0.1:5199/
pnpm --filter kickboxing render --film kickboxing --at 61.2,150 http://127.0.0.1:5199/?rig=1
```

The video mode captures 5400 frames at 1280x720 and 30 fps through the frame cache, writes the picture-only `media/automovie/kickboxing/videos/film.mp4` with `capture-report.json`, then decodes the whole file and writes `decode-report.json`. The film carries no soundtrack: video diffusion generates the audio from the screenplay's sound lines, as [audio](.agents/skills/audio/SKILL.md) sets. Still mode writes PNGs to `media/automovie/kickboxing/frames/` or `--out`.

## Stills

```bash
pnpm --filter kickboxing capture --film kickboxing --from 150 --to 160
```

`capture` draws film frames in Node without the Viewer, at 5 stills per second by default, into a contact sheet per 10-second segment under `media/automovie/kickboxing/frames/capture/`; its source comment lists every option. Review sheets per [segments](.agents/skills/motion/segments.md).

## Source

The source follows the scaffold's [layout](.agents/skills/development/layout.md):

| Folder | Owns |
| --- | --- |
| `src/laws/kickboxing`, `officiating`, `cinematography` | Pure laws from the research: technique table and timing, defenses and the outcome table, legality, range, footwork and steps, body-frame shapes, the referee's positioning and signals, the count, the coverage law |
| `src/entities` | Fighters A and B from their settings records (one `Fighter` class, two profiles), the referee, the ring, the camera, the lights and the bell; capabilities return intent chains such as `a.jab().cross().hook().lowKick()` |
| `src/interactions` | Exchanges that align answers to strikes, phases that fill a screenplay window, the schedule laws, the fighters' performance with the engine's relational fit onto actual colliders, contact receipts and audits, the referee's and camera's tracks |
| `src/consequences` | Marks, sweat and blood spray, only from measured contacts |
| `src/composition` | Twelve scene compositions, one per screenplay scene, the ring stage and the film |
| `test/features` | Millisecond logic units mirroring those paths, on polygon-man bodies |

Production acceptance (Viewer, stills, render, decode) is recorded in [docs/acceptance/kickboxing.md](docs/acceptance/kickboxing.md).

## Video-generation prompts

[Video prompts](docs/prompts/videos/source-bindings.md) prepare restyling requests for a video generator from the rendered motion. They authorize no upload, generation or paid call.
