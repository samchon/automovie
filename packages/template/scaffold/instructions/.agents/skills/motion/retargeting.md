# Retargeting

Recorded, generated or imported motion is retargeted before use, and again when a character's proportions or rig change. Read the accepted source, the [rig characterization](../3d-modeling/rigging.md), the screenplay's decisions and the installed kinematics and import contracts; establish a clip's timing, contacts and meaning from its data rather than its name.

## Establish the source and target meanings

Freeze the source bytes and conversion settings with their skeleton, rest pose, time convention, root trajectory, scale and usage terms, and record the bone, axis, unit and frame correspondence.

Convert imported rotations to the representation the retargeter accepts through supported operations rather than relabeling a clip. Keep the retargeter's warnings and refusals, because a returned clip does not prove contact fidelity, and keep joint limits as the rig defines them.

Set root scale from meaningful dimensions, then confirm facing, root path, reach, foot positions and attached props; an unreachable support is fixed at the rig, staging or path, because a different outcome is a narrative change.

## Preserve contacts and time

Bind supports and grasps to their actual ground or object frame, and check sliding, penetration, floating, reach, support transfer and release through the motion, using [physical feedback](physics.md) for supported correction.

Recheck interpolation, root path and contacts at the actual output times, extrema and cut boundaries, under [frame evaluation](frame-evaluation.md).

Keep an imported clip's interpolation, quaternions, scale and morph weights; when baking or simplifying, compare source and derivative at output times and between-key extrema, because a small key error can move a hand off a prop. [glTF's animation rules](https://github.com/KhronosGroup/glTF/blob/main/specification/2.0/Specification.adoc#animations) describe interchange.

## Accept the actual performance

Compare the source and retargeted progression from matched views and the actual scene cameras, under the [behaviors contract](../contracts/development/behaviors.md), across the whole sequence, with tolerances taken from the production's promise rather than a favorable solver result. Record the accepted motion, rig interpretation and diagnostics with their inputs; a new take or rig change invalidates the affected observations.
