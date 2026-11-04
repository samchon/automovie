# Screenshots

The Human debug viewer serves `http://127.0.0.1:5197`. It is the package's one shared viewer under development's [Scripts And Shared Checkouts](../development/SKILL.md#scripts-and-shared-checkouts): when none answers, start it from `packages/human` with `pnpm debug`, detached from the shell that starts it, and read its queue at `/human-debug/status.json`. Its [README](../../../packages/human/debug/README.md) owns every route, URL variable, header and piece.

The viewer strips types and draws even while its type-check watch, which the README calls its compile collector, reports errors, showing the watch's latest cycle in its compile panel and in each frame's `x-human-compile` header. Its watch is `pnpm ttsc --noEmit --watch -p tsconfig.debug.json` from `packages/human`, beside the test watch of development's [Type Checking](../development/validation.md#type-checking); read its state beside every capture. An open page keeps the source it loaded until it is reloaded.

| Use | Path under the viewer endpoint |
| --- | --- |
| Interactive page | `/debug.html?person=f1`, one piece alone with `&piece=<name>` |
| PNG | `/human-debug/images/<name>.png?person=f1&<variables>&fresh=<nonce>` |
| Every part of a person | `/human-debug/batch/<person>.json?round=<name>` |
| View curves over a reference | `/debug.html?reference=f1` with the README's view-comparison variables |

## Frames

- The surface alone is `curves=none`, the curves alone `parts=none`, and hair or underwear hide with `hide=<pattern>`.
- A registered piece (`piece=<name>`) builds alone from the person's inputs, so it is judged without the whole body.
- Give every new frame a unique `fresh` nonce, and accept it as new only when `x-human-cache` is `new-requested-frame`.
- Keep its `x-human-captured-utc`, `x-human-png-sha256` and `x-human-source-sha256` headers. The source hash is taken when the page loads its modules, so a later save does not change a frame already made, and `x-human-load-attempts` above 1 shows a save during loading.

## References

Reference outputs live in `test/.shots/<alias>/`, selected by `test/.shots/manifest.json`: `captures.json` indexes the original photographs, `recovery/screenshots/index.json` the Recovery renders, and `hermite-curves.json.gz` holds the saved curves. The view comparison reads the private section pack under `.references/curves/<alias>/`.
