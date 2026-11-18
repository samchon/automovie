# Retargeting

Retarget external motion before use and after proportion or rig changes. Read the source, [rig](../3d-modeling/rigging.md), screenplay and installed [import and kinematics APIs](../automovie/SKILL.md#reading-a-package). Derive timing, contacts and meaning from clip data.

## Source and target meanings

Freeze source and conversion settings. Record skeleton, rest pose, time convention, root path, scale, rights and bone, axis, unit and frame maps. Run motion diffusion's clip checks first for generated or captured clips.

Convert rotations using supported operations. Preserve warnings, refusals and rig limits.

Set root scale from meaningful dimensions, then confirm facing, root path, reach, foot positions and attached props. Fix an unreachable support at the rig, staging or path, because a different outcome is a narrative change.

## Contacts and time

Bind supports and grasps to their actual ground or object frame, and check sliding, penetration, floating, reach, support transfer and release through the motion, using [physical feedback](physical-feedback.md) for supported correction.

Follow [frame evaluation](frame-evaluation.md) to check interpolation, root path and contacts at output times, extrema and cuts. Preserve interpolation, quaternions, scale and morph weights. Compare baked or simplified clips at output times and between-key extrema. See [glTF animation](https://github.com/KhronosGroup/glTF/blob/main/specification/2.0/Specification.adoc#animations) for interchange.

## Acceptance

Under the [behaviors contract](../contracts/development/behaviors.md), compare the whole source and result from matched and scene views. Use tolerances from the commission. Record the accepted clip, rig, diagnostics and inputs. Recheck after clip or rig changes.
