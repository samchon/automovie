# src/render/IAutoMoviePoseKeypointFrame.ts#IAutoMoviePoseKeypointFrame

## @evidence contracts/development/design.md#principled-representation

One record per output frame is the representation of a per-frame signal, and the frame index and beat are the same frame clock and shot-to-beat mapping the caption plan uses, so the two sidecars align frame for frame.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The record holds only the frame index, the beat and the actor list; the clock itself lives once on the sidecar.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Missing scenes or cameras keep the frame with an empty actor list, while unresolved motion, node or skeleton references skip that actor. A missing timeline shot refuses during sequence planning rather than producing an invented frame.

## @evidence contracts/development/common.md#meaningful-documentation

The doc states what one record covers and why the sidecar is per frame rather than run-length, and each member states its meaning.
