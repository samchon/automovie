# Capture requests

The inspector URL and the CLI accept the same capture request keys. In a command, write a key as `--<key>`. Quote values with spaces, wildcards or semicolon-separated views in PowerShell.

## Times and views

| Key | What it selects |
| --- | --- |
| `subject` | The film or other subject to draw |
| `at` | One or more exact seconds, separated by commas |
| `from`, `to`, `rate` | Even samples snapped to source frames, five per second by default |
| `events`, `window` | Consecutive source frames around each event, three on either side by default |
| `threshold` | Video cut score for FFmpeg scene detection, 10 by default |
| `views` | A semicolon-separated list of delivery, fixed or named cameras |
| `passes` | Multiple shades drawn with the same camera |

The default view is `film`. A fixed view uses `x,y,z:tx,ty,tz` for the eye and target, with optional `@ortho=<metres per pixel>` or `@up=x,y,z`. A named view such as `front` fits the drawn geometry. Add `@ortho` for an orthographic view, `@focus=<pattern>` for a part or `@flagged` for marked findings. Add `@follow` to fit independently at each second. Reuse a recorded cell's fixed camera text to repeat its framing.

## Drawn content

| Key | What it selects |
| --- | --- |
| `parts`, `hide` | Objects and marks by path pattern |
| `shade`, `surface` | Shade such as `clay` or `faces`, and whether to draw surfaces |
| `marks`, `sliver` | Marks by kind and optional `edge` overlay for triangle edges |
| `section` | A world-space section for inspection |
| `xray`, `stroke` | Whether marks draw through surfaces, and their width in pixels |
| `label` | Names of matching objects and marks, with overlapping labels skipped |
| `color` | `pattern=rrggbb` overrides for matching objects and mark kinds |
| `trail`, `reach`, `ticks` | A path pattern, seconds on each side and samples per second |
| `sweep`, `margin` | Each matched unit alone and with neighbours within the margin in metres |

## Still sheets and comparison

| Key | What it controls |
| --- | --- |
| `longest`, `smallest` | Reader's longest edge and minimum cell edge, 1568 and 200 pixels by default |
| `reduction` | Area or nearest-pixel reduction into cells |
| `round`, `compare` | The new named round and the earlier round to compare against |
| `tolerance` | Per-channel difference from 0 to 255 that counts as unchanged in a comparison |

## Command options

| Option | What it controls |
| --- | --- |
| `--module` | Subject module for `capture`, `inspect` or `render` |
| `--props` | JSON file passed to the subject module |
| `--file` | Encoded video for `capture` or file `review` |
| `--out` | Destination for capture, render or review records and media |
| `--backend` | Software rendering by default or `gpu` for capture and render |
| `--timeout-ms` | Per-call browser timeout for capture and render, 120000 ms by default |
| `--port` | Inspector server port |
| `--background` | `scene` by default or `transparent` for a straight-alpha render without audio |
| `--url`, `--seconds` | Inspector URL and wall-clock duration for a playback recording |
| `--at`, `--from`, `--to` | A film second or a half-open time range in file review |
| `--mark` | A review receipt to reopen or bind to a new file position |
| `--note` | The reviewer's observation at the selected position |
| `--reviewer`, `--decision`, `--viewed` | The reviewer, decision and observation method for file review |

For capture, `--module` is required when no `--file` is supplied. The default output is `media/capture/<subject>/` for capture, `media/automovie/<subject>/videos/` for render and `media/automovie/review/` for playback review.

With `render --passes`, guide passes other than `beauty` are drawn at each frame into `controls/` beside the video. A transparent render writes `film.mov` under `media/automovie/<subject>/transparent/` by default. It draws only the beauty pass.

The [CLI reference](https://samchon.github.io/automovie/reference/cli/) lists the commands and environment variables.
