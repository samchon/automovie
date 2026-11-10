# Render the motion hint's control channels

Use this when delivering a motion hint or rendering the control channels a video model takes. A complete hint can be delivered without a generator; report its compatibility as unverified rather than run an uncommissioned job. [Video](../video/SKILL.md) decides which channels the chosen model takes; this document owns rendering them from the performance.

## Render what the receiver takes

Render only the channels the actual receiver needs, such as the hint video, pose, depth, normal, outline or a semantic mask, and read the installed packages' documentation for what each really outputs. A mode name or a plausible image does not establish another tool's expected representation. When no installed path produces an essential channel, follow [installed packages](../development/SKILL.md#installed-packages).

## Keep channels aligned

Give time-matched channels one frame format, camera, crop and time mapping, resolved through [frame evaluation](timeline.md), and capture each from the same evaluated performance and view; switching render mode must not advance or restart motion. A matching frame count does not prove matching poses or events. Read each pass's limits: depth range and clipping, normal convention, and whether a mask has stable semantic identities or only positional colors. A structural pass keeps its values free of exposure, tone mapping or overlays. Return borrowed scene and renderer state after each pass.

## Hand off

Keep accepted control files, mappings, palettes and sidecars with their content digests under the film's [media](../production/media.md) folder, apart from any viewing encode, because lossy encoding, color conversion and transitions change depth values and invent mask colors. Inspect stills of the complete sequence at matched frames, including contacts, cuts and the ending, then the files through the receiver's input path when one is selected. Hand them with their observed limits to [assembly](../production/finishing.md) or [video generation](../video/generation.md).
