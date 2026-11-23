# src/construction/IAutoMovieConstructionJointedAxis.ts#IAutoMovieConstructionJointedAxis

## @evidence contracts/development/design.md#principled-representation

A limb is straight along each bone and turns at each joint about the joint's hinge axis; the quintic smoothstep of the angle is C2 at both ends of the turn, so the frames and the sections they carry are C2 along the whole course, where a natural spline through the centres rings beside each joint.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Centres, half lengths and the initial up fix the base frame; an optional explicit material roll changes only its in-plane orientation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A turn that overruns its segment is refused, never shortened; a straight joint (parallel segments) has no turn.

## @evidence contracts/development/common.md#meaningful-documentation

States the course, the turn law and its continuity, the station, the corner cut, the carried axes and the admission rules.
