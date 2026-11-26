# Passes

A pass specifies what a still draws.

## Choosing a pass

| Pass | Answers |
| --- | --- |
| The finished picture from the delivery's renderer | How the result looks to its audience |
| The construction that generated a surface | Why the surface has its shape |
| A structural pass of only one quantity, such as depth, normals or a mask | What that quantity is across the picture |
| An overlay on the picture | Where joints, contacts, targets and paths are |
| The guide channel itself, read through the receiver's input path | What a receiver is given |

Verify the structural quantity's range and convention. Inspect optional fields only for their required uses.

## Matched passes

Draw passes from the same subjects, camera, time and evaluated state. Preserve motion state and restore the scene and renderer state after each pass.

An overlay shares its underlying pass's camera. Label marks drawn through surfaces.

## Marking what a measurement found

Draw measured defect locations in a reserved color and identify the finding in the legend. The measurement owner supplies locations as marks, so adding a finding requires no new pass.

Draw each kind of thing in one color throughout a capture. Show labels to establish identity, and hide them where they cover what is judged.

A marked still shows where a measurement fired, never that the unmarked rest is right.
