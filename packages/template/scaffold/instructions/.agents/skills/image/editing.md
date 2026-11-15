# Editing

How to change part of an accepted image and keep the rest.

## Instruction edits

Ask for one change per round, list what must stay, and restate the subject's defining traits and that it is not redesigned in every round, because constraints left unsaid drift. Check each intermediate result before the next round. Repeated rounds blur and oversharpen the image, so when detail starts to go, start again from the frozen canon references.

## Masks and markup

Hosted models differ: some treat a mask as guidance rather than a boundary and apply it, or a markup drawing such as a circle around what to change, to the first input image only, and some take no mask, as the chosen model's documentation says. An open inpainting model repaints exactly where the mask is white: blur the mask's edge so the seam does not show, and inpaint at a higher resolution than the region has in the image. Outpainting extends a frame, such as to a new aspect, the same way.

## Compositing back

Every route can change pixels outside the region it was asked to change. Where everything else must stay identical, composite the approved change back over the original rather than accept the whole regenerated image.
