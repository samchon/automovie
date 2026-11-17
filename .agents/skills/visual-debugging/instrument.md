# Instrument

The instrument draws, plans, records and compares the stills of a capture. This page owns what it offers against this skill's requirements and what it leaves out by decision; the [`render` README](../../../packages/render/README.md) owns the request keys and maps each to the requirement it serves.

- [Drawing](#drawing)
- [Capture output](#capture-output)
- [Left out by decision](#left-out-by-decision)
- [Hosts](#hosts)

## Drawing

### One request, one picture

A request is plain text: named values that an inspector page's address, a command line and a component's props carry under the same names, read by one reader in `render`. The same text gives the same picture in every host, and the instrument writes a request back as text, so a view worked out on the page repeats as a capture.

### Selection by identity

Objects and marks are named by paths, the names from the scene down joined by `/`. One pattern grammar selects, hides, labels, colors and frames them, which serves the [selections](capture.md#subject) a judgment needs. A pattern that selects nothing is refused.

A sweep expands a pattern into units and plans each unit alone and with the neighbors whose boxes lie within a stated margin; a unit with no neighbor is drawn once.

### Marks

A mark is plain data that any owner hands over: a path, a kind with its legend label and color, one shape from a closed set (points, a polyline, segments or arrows), a flag for an anomaly, and the object it follows. A new kind of finding therefore [needs no new pass](passes.md#marking-what-a-measurement-found).

The instrument itself measures mesh edges and mesh defects and samples trails. The engine supplies marks for any articulated body, each flagged where it breaks its bound: bones and joints, contact forces, the center of mass against the base of support, range-of-motion overshoot, slip of a planted contact and mesh clearance.

A capture asks for marks by kind, and a kind the subject does not supply is refused before drawing. Two kinds never share a color in one picture, a flagged mark takes the flag color, and the legend counts the marks of each kind. Labels do not overlap, and a label dropped for lack of room is reported.

### Views and passes

A view is one of three things:

- the subject's delivery camera;
- a fixed camera given by a point and its target, optionally orthographic at a stated scale and with a stated roll;
- a name, either one of the subject's own views or a named direction fitted to what is drawn.

A named direction may be orthographic for scale-true lengths, and may frame only a selected part or only the flagged marks.

A named direction is fitted over every second the capture plans, so one camera holds across times and travel reads as travel. Asked to follow, it is fitted at each drawn second alone: a traveling subject stays large in every cell, but times share no camera and the travel is read from trails.

The record keeps the camera each cell resolved to and the fixed view text that draws it again. A later round copies that text as is, so the [comparison](comparison.md#matched-cells) pairs cells drawn through the same camera even when what is drawn changes.

A pass is a shade plus the marks drawn over it: a guide pass, a clay shade for form without color, or a shade by the side each face shows. Surfaces can be left out so the marks stand alone, cut by a section plane, or drawn through by the marks. Mark width is stated in output pixels, so a mark survives reduction into a sheet cell. The passes of one capture share each view's camera.

### Motion

Motion is read from stills in [time order](capture.md#times): the marks a subject hands over for each drawn second, and trails that draw where selected objects travel over a window of seconds around the drawn one, with a tick per sample and the drawn second emphasized.

## Capture output

### Plan

A capture is planned as a list of cells before anything is drawn: each fixed by selection, time, view and pass, in that order, with a stable name. Times are an even sampling moved onto the subject's own frames, five a second unless stated, or exact seconds, joined by every frame within a stated window around each event, three frames on each side unless stated.

The plan refuses, naming the cause:

- a view the subject does not offer;
- a mark kind the subject does not supply;
- a sweep that matches nothing;
- a time outside the subject;
- two cells that would take one name.

### Reader budget

Sheets are laid out for the reader budget that [Stills and sheets](capture.md#stills-and-sheets) states, with 1568 px and 200 px as the defaults. Each cell's caption sits in a strip under it that is counted against the longest edge and never taken from the cell, and a still is never enlarged. Cells are reduced by averaging, or by the nearest pixel where a review reads exact pixel values.

### Record

A capture writes its stills, sheets and one record into its own folder, or into a named round beneath it. The record is first written as unfinished, listing every file the capture is about to write, and rewritten as complete once the last file is written. A folder holding a file no record of it lists is refused untouched, and an interrupted capture is replaced by the next run.

The complete record keeps the source revision, the request as text, the reader budget and layout, the planned times and event windows, and one row per planned cell. A drawn cell's row holds its file, content hash, backend and resolved camera, and the paths each of its selection, hide, label, color and focus patterns matched, listed by their topmost paths with a count. A failed cell's row holds its cause, and the sheet shows a marked cell in its place.

### Comparison

A capture compared against an earlier round pairs cells as [comparison](comparison.md#matched-cells) requires: selection, second, view and pass agree and the resolved cameras do not differ. A pair drawn by one backend is measured pixel by pixel at a stated tolerance, with a difference image for a changed pair. The comparison sheets show each pair's earlier still, its later still and their difference.

### Video files

An encoded or generated file is sampled from its own frames. Its cuts are detected at a stated score threshold, FFmpeg's default of 10 on its 0 to 100 scale unless stated, and every frame within the window around each cut and event is extracted by index, captioned by frame and second. Compared against the source's round, its cells pair by second. The record lists every detected cut with its score, so a file without cuts records zero at the threshold used.

## Left out by decision

| Capability | Reason |
| --- | --- |
| Field shades and raking light rigs | Coarse models are judged by silhouette and construction |
| Ghost poses | A sheet of stills in time order is the onion skin, and trails carry the motion inside one still |
| Round comparison inside the page | The capture writes comparison sheets, which are read as stills |
| Sound | Outside the product's scope for 3D hints |

The field shades are skin weight heat maps, texture-coordinate checkers and curvature shades. A production that needs such a field hands it over as marks, as [inspecting a form](../3d-modeling/inspection.md#fields-judged-only-where-needed) says.

## Hosts

### The inspector page

A production's development page is the `viewer` package's inspector, mounted over the same subjects module that the capture command draws, so the page offers exactly the subjects a capture can take; the [`viewer` README](../../../packages/viewer/README.md#inspector-page) owns its mount. The page's state is one request: every panel edits it, the address carries it, and the page shows the capture command that repeats the picture. An address the grammar refuses opens the request that asks for nothing and shows the refusal.

A package or folder without a page of its own, such as one holding motion cases, gets the same page from the `automovie` command's inspect mode. It serves the inspector over any module that exports its subjects, refuses a request the capture would refuse before serving, and prints the address whose query is the request.

### The capture command

The `automovie` command of the `cli` package captures from a production's folder; the [`render` README](../../../packages/render/README.md#request-keys) lists its options with the request keys. It takes the same keys as a page's address, plus its own: which subject module to draw or which video file to sample, the root folder, and whether the browser draws in software or on the GPU.

A drawn subject comes from the production's own draw-only page, built with the production's bundler and drawn in headless Chromium, so the stills come from the same function the page uses. Software drawing is the default, because it removes GPU driver variation; the record names the backend either way. A video file is sampled through FFmpeg, from the production's own copy or one the environment names, and its clock and raster are read from the file.

The record's revision is the production's commit, marked when the working tree differs from it. The command exits with a failure when any cell was not drawn, and it prints every such cell with its cause and every unmatched or changed pair of a comparison.
