# Modularization

Use the same part and group structure for every source.

## Parts and groups

Name parts by how the object is assembled and moves. Let each part own its shape and let groups reference their members.

Use a group's frame as its subtree's physical pivot and its rotation limit as the subtree's range of motion. Link branches with a driver. Transform rigid members and [rig](rigging.md) deforming members.

## Frames and connections

Place members in their parent's frame. Keep one unit and frame inside each declaration. Convert at a named boundary.

Define each shared connection with its continuity, contact or clearance once. Have both parts consume it.

## Source modules

Give each part or group one generating definition, including its dimensions, frames and placements. Reuse it for repetition and reflection. Derive dependent geometry, attachments and diagnostics from their owners.

Map logical parts to source controls, generating subdomains and charts without duplicating geometry. Use one binding and material coordinate field across sewn boundaries. Touching parts may keep separate sheets.

Propagate edits through dependencies and reuse equivalent work. Invalidate affected bindings on shape or chart edits and inverse binds on joint or rest-frame edits. Keep unaffected bone identities on repartition.

Explain non-obvious calculation premises in comments under the project's development and [writing](../documentation/SKILL.md) rules.
