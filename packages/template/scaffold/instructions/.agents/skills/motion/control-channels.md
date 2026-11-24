# Control channels

A motion hint reaches its receiver through control channels rendered from the performance. [Video](../video/SKILL.md) decides which channels the chosen model takes.

## Channels to render

<!-- @source [DiffusionRenderer](https://arxiv.org/abs/2501.18590) uses geometry and material buffers as rendering inputs. -->

Render only the receiver's required channels. Use outlines for edge inputs and scene-projected points for exact tracks.

The installed material channel is the `albedo` pass: each surface's base color, unlit and on black. It carries only what the forms' materials hold, so it serves only a film that switched on its [detail options](../development/entities.md#detail). No installed pass produces roughness or metalness.

Read the installed packages' documentation for what each channel outputs, because a mode name or a plausible image does not establish the representation another tool expects. When no installed path produces an essential channel, tell the user.

Light coarse forms to show volume. Use [entity colors](../development/entities.md#coarse-first) and omit overlays, textures and lettering. Authored surface graphics, flat lettering included, draw only in the beauty, mask and `graphics` passes. The mask gives flames, screens and lettering their own ids, depth carries open flames, and a lantern's globe hides its flame from every pass but beauty.

Render from the scene any control mask a video request asks for, never estimate it from pictures.

## Dense channels

<!-- @source [LooseControl](https://arxiv.org/html/2312.03079v1) studies coarse depth constraints. [Cosmos-Transfer1](https://arxiv.org/abs/2503.14492) demonstrates control weights that vary across space and time. -->

Dense conditioning carries both placement and shape. Higher adherence preserves more coarse geometry.

Start with pose for people, reduced or blurred depth for other forms and full strength for exact shape. Test on takes. Gray-layout adapters take the whole hint and may still drift.

## Channel alignment

Resolve format, camera, crop and time through [frame evaluation](frame-evaluation.md). Draw [matched passes](../visual-debugging/passes.md#matched-passes) from the same performance and view. Verify pose and event alignment.

Read each channel's limits: depth range and clipping, normal convention, and whether a mask has stable semantic identities or only positional colors. Keep the values of a depth, normal or mask channel free of exposure, tone mapping and overlays.

Compare each rendered channel with the adapter's annotator on the same hint frame. Report mismatches. Until fixed, use the annotator's depth from the hint and retain the rendered pose for the faceless figure.

## Handoff

Render the channels as guide passes with the README render command's `--passes` option. Use them only under the [render report check](../production/media-records.md#render-reports), and render again on a mismatch. Keep mappings, palettes and sidecars under [media records](../production/media-records.md). Keep viewing encodes separate to preserve numeric depth and mask colors.

Inspect matched frames across the whole sequence under [capture times](../visual-debugging/capture.md#times). Check the receiver's input path. Report observed limits to [assembly](../production/assembly.md) or [generation](../video/generation.md). Without a commissioned generator, report compatibility as unverified.
