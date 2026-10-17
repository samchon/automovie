# Construction

Generate every person through code and formulas. The package holds no mesh, morph target, landmark index, or baked data; small named constants citing primary sources are allowed, and the build guard rejects the rest. Genitals and nipples are not modeled.

## Skeleton And Rest Form

Build the skeleton first, on the shared humanoid skeleton and rest frame, and generate every part from it. Never reconcile independently sourced geometry at run time.

The rest form is the T-pose, joints straight and no flesh folded. Convert each posture-dependent measurement to it explicitly, such as the lateral chest, axilla, and shoulder top of the raised arm.

## Lofting

Work from the whole body through regions, masses and borders, generating gross form before relief, bony landmarks or aesthetic detail. Inspect front, side and top generating curves at every scale with their neighbors, then correct every curve cause the round found in one change before lofting.

Build continuous skin from curve networks: closed sections along an axis or bone chain, steered by silhouette guides and feature curves. Apply [Lofting](../3d-modeling/lofting.md) to the section family and its fitting. Trunk sections lie level because anthropometry measures them level.

The face is a curve network of loops around the eyes and mouth and feature lines, filled by patches.

## Parts And Junctions

A part is a region of one continuous mass. Cut only where the section is a simple tube, such as mid upper arm, mid thigh, wrist, ankle, and neck; the shoulder, armpit, hip, and groin stay inside the trunk because muscles cross them. Eyeballs, teeth, tongue, nails, and hair are separate meshes, and the ear is a separate part.

Choose separate meshes' representations by [Crafting](../3d-modeling/crafting.md#representation), such as textured cards for hair where their silhouette and motion hold.

Apply [Modularization](../3d-modeling/modularization.md) to the source and generated person: refine each part alone, preserve shared boundary and continuity definitions when joining, and judge the joined person. When using subdivision, build junctions on shared control cages and subdivide the joined cage once.

Within a profile every identity shares one topology and one published UV layout.

## Core Boundary

A capability any generated or imported model could use, such as skeleton axes, skinning, morph targets, materials, or general geometry, belongs in core; anatomy, measurements, proportions, and the Human parameter vocabulary belong in Human. Add missing shared capabilities to core rather than working around them in Human.
