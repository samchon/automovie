# Prepare a usable motion hint

Use this when delivering a motion-video hint or preparing visual controls for a selected generator. A complete hint can be delivered without a generator; report its compatibility as unverified rather than run an uncommissioned job. [Generation](generation.md) submits inputs and adopts takes; it does not produce the performance.

## Choose the controls

Select only the inputs the actual receiver needs, such as motion video, reference images, pose, depth, normal, outline or semantic mask, and read the installed viewer, engine and render contracts for what each really outputs. A mode name or a plausible image does not establish another tool's expected representation. If no path produces an essential control, repair the integration or report the missing capability; never rename another image to match it.

## Keep channels aligned

Give time-matched channels one frame format, camera, crop and time mapping, resolved through the [timeline](../motion/timeline.md), and capture each from the same evaluated performance and view; switching render mode must not advance or restart motion. A matching frame count does not prove matching poses or events. Read each pass's limits: depth range and clipping, normal convention, and whether a mask has stable semantic identities or only positional colors. A structural pass keeps its values free of exposure, tone mapping or overlays. Return borrowed scene and renderer state after each pass.

## Hand off

Keep accepted control files, mappings, palettes and sidecars with their content identities, apart from any viewing encode, because lossy encoding, color conversion and transitions change depth values and invent mask colors. Inspect the complete sequence at matched frames, including contacts, cuts and the ending, then the files through the receiver's input path when one is selected. Hand them with their observed limits to [finishing](finishing.md) or [generation](generation.md).
