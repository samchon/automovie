# Passes

A pass is what a cell draws of its subject. This document owns choosing passes, keeping them matched and marking what a measurement found.

## Choose by the question

| Question | Pass |
| --- | --- |
| How the result looks to its audience | The finished picture from the delivery's renderer |
| Why a surface has its shape | The construction that generated it |
| What one quantity is across the picture | A structural pass that draws only that quantity, such as depth, normals or a mask |
| Where joints, contacts, targets and paths are | An overlay of them on the picture |
| What a receiver is given | The guide pass itself, read through the receiver's input path |

Use a structural pass only for the quantity it documents, and read its range and convention before reading its colors. A plausible image does not establish that a pass holds what its name says. Fields such as skin weights or curvature are judged only where a production's models need them, as [inspecting a form](../3d-modeling/inspection.md#fields-judged-only-where-needed) decides.

## Keep passes matched

Draw every pass of a set from the same evaluated state, at the same subjects, views and times, so two passes of one cell differ only in what they draw. Switching pass must not advance or restart motion, and each pass returns the scene and renderer state it borrowed.

A layer drawn over another shares its camera exactly. A layer drawn through a surface says so in its caption, because a line seen through a surface reads as lying on it.

## Mark what a measurement found

A measurement that finds a defect knows where it is. Draw that place on the subject in a color the pass uses for nothing else, with a legend naming each color's finding, so the reviewer looks at the defect instead of searching the picture for a number from a report. The measurement's owner hands the place to the instrument as plain data, a mark of its own kind, so a new finding needs no new pass.

Draw each kind of thing in one color throughout a capture. Show labels to establish identity, and hide them where they cover what is judged.

A marked still shows where a measurement fired, never that the unmarked rest is right.
