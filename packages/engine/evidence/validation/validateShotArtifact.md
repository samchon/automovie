# src/validation/validateShotArtifact.ts#validateShotArtifact

## @evidence contracts/development/implementation.md#principled-implementation

Admit shot/scene/camera references, performances, motion clips, polygon body cue, practical surface track, flame cue, surface graphic track and font source shape and staged-node references, metadata and delivered-camera clearance correspondence. A bound flame must name one of the shot's light clips, because the compiled shot carries its binding as the clip of that id and render reads the flame's luminance from it; a feed layer must name a staged camera other than the shot's own.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Clip shape and metadata/light owners supply leaf checks while this entry owns scene cross references.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A null motion registry defers compiled-motion existence; performance/object-clip walks report absent slots rather than silently skipping them. Clearance rows remain metadata rather than recomputed sweeps.

## @evidence contracts/development/common.md#meaningful-documentation

Documents the structural shot boundary and optional motion and staged skeleton lookups.

## @evidence contracts/development/implementation.md#efficient-algorithms

Performance, clip, node, camera and coverage records drive scans, maps and track-buffer validation. With a skeleton resolver, cue admission also indexes each targeted rig and traverses the ancestor path of each targeted bone.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Request-local id sets and light-kind maps share scene lookup work across shot fields. Cues on the same subject share one skeleton lookup and parent index.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only report rows escape; borrowed artifacts/registries remain caller-owned and no playback host is started.
