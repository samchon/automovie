# src/render/capture/IAutoMovieCaptureRecord.ts#IAutoMovieCaptureRecord

## @evidence contracts/development/design.md#principled-representation

A union keyed by `state`: a running capture records only what it owns, a complete one everything that repeats it. The request is kept as the named text values that repeat it, every planned cell has a row, and a drawn and an undrawn row are separate members.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Each member answers a requirement of the skill quoted above or is read by the next run (`files`) or a comparison (`rows`), `video` lists a file's cuts as `.agents/skills/visual-debugging/capture.md` asks frames around every cut, `diagnostics` records observations at the captured times, and `section` keeps what only the subject's owner judges, such as a motion case's verdicts, so the record of one capture stays one file in a folder that refuses foreign files; the subject keeps its clock and raster but not its drawables, which the request's selections already name.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An undrawn cell has no file, hash, camera or resolution instead of empty ones, and an unstated backend, camera or resolution is null.

## @evidence contracts/development/common.md#meaningful-documentation

States when each state is written and why, which skill requirements the members answer, and what the next run reads.
