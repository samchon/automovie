# Construction

## Skeleton And Rest Form

Build the skeleton first, on the shared humanoid skeleton and rest frame, and generate every part from it. Never reconcile independently sourced geometry at run time.

The rest form is the T-pose, joints straight and no flesh folded. Convert each posture-dependent measurement to it explicitly, such as the lateral chest, axilla, and shoulder top of the raised arm.

## Lofting

Build continuous skin from curve networks: closed sections along an axis or bone chain, steered by silhouette guides and feature curves. Trunk sections lie level because anthropometry measures them level. The face is a curve network of loops around the eyes and mouth and feature lines, filled by patches. Choose separate meshes' representations by [Crafting](../3d-modeling/crafting.md#representation), such as textured cards for hair where their silhouette and motion hold.

Block out a part's gross form before relief, bony landmarks, or aesthetic detail, at the scales body, region, masses, and borders.

## Parts And Junctions

A part is a region of one continuous mass. Cut only where the section is a simple tube, such as mid upper arm, mid thigh, wrist, ankle, and neck; the shoulder, armpit, hip, and groin stay inside the trunk because muscles cross them. Eyeballs, teeth, tongue, nails, and hair are separate meshes, and the ear is a separate part.

Apply [Modularization](../3d-modeling/modularization.md) to the source and the generated person.

Refine each part alone, join parts only at junctions built on their control cages, subdivide the joined cage once, and judge the joined person.

Within a profile every identity shares one topology and one published UV layout.

## Core Boundary

A capability any generated or imported model could use, such as skeleton axes, skinning, morph targets, materials, or general geometry, belongs in core; anatomy, measurements, proportions, and the Human parameter vocabulary belong in Human. When core lacks one, change core on the Human branch in its own commits, never work around it in Human.
