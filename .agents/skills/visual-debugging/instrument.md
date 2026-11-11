# Instrument

The instrument is what draws, plans, records and compares the stills of a capture. This document owns what it offers against this skill's requirements and what it leaves out by decision; the [`render` README](../../../packages/render/README.md) owns the request keys that ask for each part and maps every key to the requirement it serves.

## One request, one picture

A request is plain text: named values that an inspector page's address, a command line and a component's props all carry under the same names, read by one reader in `render`. The same text gives the same picture in every host, and the instrument writes a request back as the text that repeats it, so a view worked out on the page repeats as a capture.

## Selection by identity

Objects and marks are named by paths, the names from the scene down joined by `/`. One pattern grammar selects, hides, labels, colours and frames them, so the [selections](capture.md#subject) a judgment needs are written once and reused by every host. A pattern that selects nothing is refused, because an empty selection draws a still with no defect in it.

A sweep expands a pattern into units and plans each unit alone and with the neighbours whose boxes lie within a stated margin; a unit with no neighbour is drawn once.

## Marks

A mark is plain data that any owner hands over: a path, a kind with its legend label and colour, one shape from a closed set of points, a polyline, segments or arrows, a flag for an anomaly, and the object it follows. A new kind of finding therefore needs no new pass; its producer hands it over as marks. The instrument measures mesh edges and mesh defects and samples trails itself, and the engine turns its own measurements into marks for any articulated body: bones and joints, contact forces, the centre of mass against the base of support, range-of-motion overshoot, slip of a planted contact and mesh clearance, each flagged where it breaks its bound.

A capture asks for marks by kind, and a kind the subject does not supply is refused before drawing. Two kinds never share a colour in one picture, a flagged mark takes the flag colour, and the legend counts the marks of each kind. Labels are placed so they do not overlap, and a label dropped for lack of room is reported rather than hidden.

## Views and passes

A view is the subject's delivery camera, a fixed camera given by a point and its target, or a name: one of the subject's own views or a named direction fitted to what is drawn, optionally orthographic for scale-true lengths and framing only a selected part or only the flagged marks. The record keeps the camera each view resolved to, which a later round reuses as the [comparison](comparison.md#match-the-cells) requires.

A pass is a shade plus the marks drawn over it: a guide pass, a clay shade for form without colour, or a shade by the side each face shows; surfaces can be left out so the marks stand alone, cut by a section plane, or drawn through by the marks. Mark width is stated in output pixels, so a mark survives reduction into a sheet cell. Several passes of one capture share each view's camera.

## Motion

Motion is read from stills: the marks a subject hands over for each drawn second, and trails that draw where selected objects travel over a window of seconds around the drawn one, with a tick per sample and the drawn second emphasised. A sheet of stills in time order with these marks carries the movement, as the [Times](capture.md#times) rules ask.

## Plan

A capture is planned as a list of cells before anything is drawn: each fixed by selection, time, view and pass, in the order selection, time, view, pass, with a stable name. Times are an even sampling moved onto the subject's own frames, five a second unless stated, or exact seconds, joined by every frame within a stated window around each event, three frames on each side unless stated. The plan refuses, naming the cause, a view the subject does not offer, a mark kind it does not supply, a sweep that matches nothing, a time outside the subject and two cells that would take one name.

## Reader budget

Sheets are laid out for the reader budget that [Stills and sheets](capture.md#stills-and-sheets) states, with 1568 px and 200 px as the defaults. Every sheet stays within the longest edge, every cell reaches the smallest, each cell's caption sits in a strip under it that is counted against the longest edge and never taken from the cell, a still is never enlarged, and cells that do not fit one sheet spread over more sheets rather than shrink. Cells are reduced by averaging, or by the nearest pixel where a review reads exact pixel values.

## Record

A capture writes its stills, sheets and one record into its own folder, or into a named round beneath it. The record is first written as unfinished, listing every file the capture is about to write, and rewritten as complete once the last file is written. A folder holding a file no record of it lists is refused untouched, and an interrupted capture is replaced by the next run. The complete record keeps the source revision, the request as text, the reader budget and layout, the planned times and event windows, and one row per planned cell: a drawn cell with its file, content hash, backend and resolved camera, and the paths each of its selection, hide, label, colour and focus patterns matched, listed by their topmost paths with a count, or a failed cell with its cause, which the sheet shows as a marked cell in its place.

## Comparison

A capture compared against an earlier round pairs cells as [comparison](comparison.md#match-the-cells) requires: selection, second, view and pass agree and the resolved cameras do not differ. A pair drawn by one backend is measured pixel by pixel at a stated tolerance, with a difference image for a changed pair; a pair from different backends is set side by side. A cell either round lacks or failed to draw is reported unmatched with its cause. The comparison sheets show each pair's earlier still, its later still and their difference.

## Video files

An encoded or generated file is sampled from its own frames: its cuts are detected at a stated score threshold, FFmpeg's default of 10 on its 0 to 100 scale unless stated, and every frame within the window around each cut and event is extracted by index, captioned by frame and second. Compared against the source's round, its cells pair by second, and a second the file lacks stays unmatched with its cause. The record lists every detected cut with its score, so a file without cuts records zero at the threshold used.

## Left out by decision

| Capability | Reason |
| --- | --- |
| Skin weight heat maps, texture-coordinate checkers, curvature shades and raking light rigs | Coarse models are judged by silhouette and construction; a production that needs such a field hands it over as marks, as [inspecting a form](../3d-modeling/inspection.md#fields-judged-only-where-needed) says |
| Ghost poses | A sheet of stills in time order is the onion skin, and trails carry the motion inside one still |
| Round comparison inside the page | The capture writes comparison sheets, which are read as stills |
| Sound | Outside the product's scope for 3D hints |

## The inspector page

A production's development page is the `viewer` package's inspector, mounted over the same subjects module that the capture command draws, so the page offers exactly the subjects a capture can take; the [`viewer` README](../../../packages/viewer/README.md#inspector-page) owns its mount. The page's state is one request: every panel edits it, the canvas draws it through `render`'s scene, the address carries it as the request text, and the page shows the capture command that repeats the picture. An address the grammar refuses opens the request that asks for nothing and shows the refusal, so a mistyped link is seen rather than silently drawn as something else.

A package or folder without a page of its own, such as one holding motion cases, gets the same page from the `automovie` command's inspect mode: it serves the inspector over any module that exports its subjects, refuses a request the capture would refuse before serving, and prints the address whose query is the request.

## The capture command

The `automovie` command of the `cli` package captures from a production's folder; the [`render` README](../../../packages/render/README.md#request-keys) lists its options with the request keys. It takes the same keys as a page's address, plus a few of its own: which subject module to draw or which video file to sample, the root folder, and whether the browser draws in software or on the GPU.

A drawn subject comes from the production's own draw-only page, built with the production's bundler and drawn in headless Chromium, so the stills come from the same function the page uses. Software drawing is the default, because it removes GPU driver variation; the record names the backend either way. A video file is sampled through FFmpeg, from the production's own copy or one the environment names, and its clock and raster are read from the file.

The record's revision is the production's commit, marked when the working tree differs from it. The command exits with a failure when any cell was not drawn, because an undrawn cell is unverified evidence, and it prints every such cell with its cause and every unmatched or changed pair of a comparison.
