# src/cinematics/IAutoMovieCameraFrameEntry.ts#IAutoMovieCameraFrameEntry

## @evidence contracts/development/design.md#principled-representation

Pairs the authored action with its subject resolved once by `performShot`'s `framedSubject`, so `compileCameraMove` solves distance, aim and path from measured geometry and never resolves a target id itself; the premise that entries arrive sorted and non-overlapping holds because `performShot` refuses overlapping same-camera frame spans before building the list.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two fields, the action that states framing, move and timing and the subject that states where and how large, which is exactly what one keyed span of the camera clip needs; coverage reuses the pair by extension and adds only its intent.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No camera, subject kind or move is special-cased in the pairing; a group, a node, a bone and a camera subject all arrive as the same framed-subject shape.

## @evidence contracts/development/common.md#meaningful-documentation

States the consumer, the producer, the order and non-overlap the producer guarantees, and the coverage extension.
