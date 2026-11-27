# Passes

A pass specifies what a still draws.

## Choosing a pass

| Pass | Answers |
| --- | --- |
| Finished picture from the delivery renderer | Audience view |
| The construction that generated a surface | Why the surface has its shape |
| Structural pass such as depth, normals or a mask | One quantity across frame |
| An overlay on the picture | Where joints, contacts, targets and paths are |
| Guide channel read through its receiver | The input a receiver sees |

Verify the structural quantity's range and convention. Inspect optional fields only for their required uses.

## Matched passes

Draw passes from the same subjects, camera, time and evaluated state. Preserve motion state and restore the scene and renderer state after each pass.

An overlay shares its underlying pass's camera. Label marks drawn through surfaces.

## Marking what a measurement found

Draw measured defect locations in a reserved color and identify the finding in the legend. The measurement owner supplies locations as marks, so adding a finding requires no new pass.

Draw each kind of thing in one color throughout a capture. Show labels to establish identity, and hide them where they cover what is judged.

A marked still shows where a measurement fired, never that the unmarked rest is right.
