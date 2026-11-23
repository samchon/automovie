# src/cinematics/IAutoMovieShot.ts#IAutoMovieShot

## @evidence contracts/development/design.md#principled-representation `validateShotArtifact` checks ids, scene/camera references, finite positive duration, unique resolving performance nodes, clip shape and optional metadata, practical surface and surface graphic track shape, plus one clear report for each delivered camera declaring an envelope. Motion-id existence is checked only when a registry is supplied, and carried clearance fields cannot independently establish current geometry freshness.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The shot references its scene, camera and motions by id and keeps camera, object and light motion in three clip lists split by applier, while guide metadata (events, editorial markers, intent, coverage, clearance) rides in optional fields that no solve reads back.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Unsupported channels are refused rather than silently stored. The performing producer refuses blocked or stale clearance evaluation; structural artifact admission inspects carried reports without rerunning that evaluation. Absent optional fields remain absent rather than receiving invented defaults.

## @evidence contracts/development/common.md#meaningful-documentation

States the shot clock, which channels each clip field admits and why, the absent-versus-empty meaning of every optional list, the event order, the coverage and clearance rules, and the duration's range.
