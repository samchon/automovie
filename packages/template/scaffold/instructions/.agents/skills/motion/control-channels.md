# Control channels

A motion hint reaches its receiver through control channels rendered from the performance. A complete hint can be delivered without a generator; report its compatibility as unverified rather than run an uncommissioned job. [Video](../video/SKILL.md) decides which channels the chosen model takes; this document owns rendering them from the performance.

## Render what the receiver takes

Render only the channels the actual receiver needs, such as the hint video, pose, depth, normal, outline or a semantic mask, and read the installed packages' documentation for what each really outputs. A mode name or a plausible image does not establish another tool's expected representation. When no installed path produces an essential channel, follow [installed packages](../development/reuse.md#installed-packages).

## Keep channels aligned

Give time-matched channels one frame format, camera, crop and time mapping, resolved through [frame evaluation](frame-evaluation.md), and keep them [matched as passes](../visual-debugging/passes.md#keep-passes-matched) of one evaluated performance and view. A matching frame count does not prove matching poses or events.

Read each pass's limits: depth range and clipping, normal convention, and whether a mask has stable semantic identities or only positional colors. A structural pass keeps its values free of exposure, tone mapping or overlays.

## Hand off

Keep accepted control files, mappings, palettes and sidecars with their content digests under the film's [media records](../production/media-records.md) folder, apart from any viewing encode, because lossy encoding, color conversion and transitions change depth values and invent mask colors.

Inspect stills of the complete sequence at matched frames, including contacts, cuts and the ending, then the files through the receiver's input path when one is selected. Hand them with their observed limits to [assembly](../production/assembly.md) or [video generation](../video/generation.md).
