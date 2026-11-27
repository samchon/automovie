# Instrument

The [render README](../../../packages/render/README.md) documents request keys.

## Drawing

### One request, one picture

The inspector URL, CLI and component props use the same text request parsed by `render`. Copy its serialized request to reproduce a view in another host.

### Selection by identity

Use scene paths joined with `/` to [select](capture.md#subject), hide, label, color or frame objects and marks. An empty match is refused.

A sweep expands a pattern into units and plans each unit alone and with the neighbors whose boxes lie within a stated margin; a unit with no neighbor is drawn once.

### Marks

Owners supply [marks](passes.md#marking-what-a-measurement-found) as paths, kinds, legend labels, colors, points, polylines, segments or arrows, anomaly flags and followed objects.

The instrument measures mesh edges, defects and trails. The engine supplies articulated marks for bones, joints, contact forces, balance, range of motion, contact slip and clearance. Flag failed bounds.

Refuse unsupported mark kinds before drawing. Give each kind a distinct color and count. Flagged marks use the flag color. Keep labels apart and report dropped labels.

### Views and passes

A view is one of three things:

- the subject's delivery camera;
- a fixed camera given by its point and target
  - An orthographic camera may specify scale and roll.
- a subject's own view name or a named direction fitted to the drawing

A named direction may be orthographic for scale-true lengths, and may frame only a selected part or only the flagged marks.

A named direction uses one camera fitted across the planned times. A follow view fits each time separately. Use trails to track travel in follow views.

Reuse each recorded camera's fixed request text in later [comparisons](comparison.md#matched-cells).

A pass combines shade and marks. It can hide or section surfaces or draw marks through them. Set mark width in output pixels. Keep the same camera across passes of a view.

### Motion

Read stills in [time order](capture.md#times). Trails mark selected paths with a tick per sample and highlight the captured instant.

## Capture output

### Plan

Plan cells before drawing, ordered by selection, time, view and pass, with stable names. Use five samples a second snapped to source frames by default, or exact times. Include all frames in each event window, three before and after by default.

The plan refuses, naming the cause:

- a view the subject does not offer;
- a mark kind the subject does not supply;
- a sweep that matches nothing;
- a time outside the subject;
- two cells that would take one name.

### Reader budget

Follow the [reader budget](capture.md#stills-and-sheets). Default to a 1568 px longest edge and 200 px minimum cell edge. Captions count toward sheet size outside the cell. Downsample by averaging or nearest pixel for exact values. Keep stills at or below source size.

### Record

Write stills, sheets and record in the capture or round folder. List files before writing and mark complete after the last write. Refuse folders with unlisted files. Replace interrupted captures on rerun.

Record revision, request, budget, layout, times and event windows. Per drawn cell, record path, hash, backend, camera and topmost matches and counts for each pattern. Record and mark failed cells with their cause.

### Comparison

Match cells under [comparison](comparison.md#matched-cells). Compare same-backend pixels at the stated tolerance. Show the earlier still, later still and difference for each changed pair.

### Video files

Sample the video itself. Detect cuts at the configured FFmpeg threshold (default 10/100). Extract cut and event windows by frame index. Label frame and second. Match source cells by second. Record cut scores or zero cuts.

## Left out by decision

| Capability | Reason |
| --- | --- |
| Field shades and raking lights | Coarse form by silhouette and structure |
| Ghost poses | Use time-ordered stills and trails |
| In-page comparison | The capture writes sheets for still inspection |
| Sound | Outside the product's scope for 3D hints |

Supply skin weights, UVs and curvature as marks when needed under [form inspection](../3d-modeling/inspection.md#fields-judged-only-where-needed).

## Hosts

### The inspector page

Mount the [viewer inspector](../../../packages/viewer/README.md#inspector-page) over the same subject module as capture.

The page's state is one request: every panel edits it, the address carries it, and the page shows the capture command that repeats the picture. An address the grammar refuses opens the request that asks for nothing and shows the refusal.

Use the CLI's inspect mode for modules without their own page. It validates the request and prints the inspector URL.

### The capture command

Run `automovie` in the production folder. Use the [request keys](../../../packages/render/README.md#request-keys) and select the subject module or video, root and browser backend.

Draw the production's own bundled page in headless Chromium. Default to software rendering and record the backend. Sample video via FFmpeg from the production's file or the environment-named path, using its clock and size.

Record the production commit and whether the working tree differs from it. Exit with failure for any missing cell. Print failures and causes, and list unmatched or changed pairs.
