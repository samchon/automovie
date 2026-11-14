# Control channels

A motion hint reaches its receiver through control channels rendered from the performance. A complete hint can be delivered without a generator; report its compatibility as unverified rather than run an uncommissioned job. [Video](../video/SKILL.md) decides which channels the chosen model takes; this document owns rendering them from the performance.

## Render what the receiver takes

Render only the channels the actual receiver needs, such as the hint video, pose, depth, normal, edge or a semantic mask, and read the installed packages' documentation for what each really outputs. A mode name or a plausible image does not establish another tool's expected representation. When no installed path produces an essential channel, follow [installed packages](../development/reuse.md#installed-packages).

Light the hint video so each form is shaded, because some models read less motion from a flat, single-color form than from a shaded one.

Render from the scene the masks and handles a [request](../video/requests.md) asks for, such as the mask of the region and frames the request locks and the handle frames past each boundary, because the scene knows each silhouette and contact exactly where an estimate from pictures would guess.

## Dense passes

A dense pass, such as the hint video or depth, carries a form's shape as well as its place, so a general control at full strength returns the coarse form's boxes and the polygon man's smooth surface. Give a general control pose for people and edge or a weakened depth, at reduced strength or blurred, for other forms, because these carry the place with less of the shape; keep dense passes for what must keep its exact shape.

An adapter trained on gray layouts is the exception: it takes the whole hint video at full strength and replaces its forms, as its documentation states.

## Keep channels aligned

Give time-matched channels one frame format, camera, crop and time mapping, resolved through [frame evaluation](frame-evaluation.md), and keep them [matched as passes](../visual-debugging/passes.md#keep-passes-matched) of one evaluated performance and view. A matching frame count does not prove matching poses or events.

Read each pass's limits: depth range and clipping, normal convention, and whether a mask has stable semantic identities or only positional colors. A structural pass keeps its values free of exposure, tone mapping or overlays.

## Hand off

Keep accepted control files, mappings, palettes and sidecars with their content digests under the film's [media records](../production/media-records.md) folder, apart from any viewing encode, because lossy encoding, color conversion and transitions change depth values and invent mask colors.

Inspect stills of the complete sequence at matched frames, including contacts, cuts and the ending, then the files through the receiver's input path when one is selected. Hand them with their observed limits to [assembly](../production/assembly.md) or [video generation](../video/generation.md).
