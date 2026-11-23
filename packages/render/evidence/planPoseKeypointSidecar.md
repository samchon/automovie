# src/planPoseKeypointSidecar.ts#planPoseKeypointSidecar

## @evidence contracts/development/implementation.md#principled-implementation

Frames use frameTimes' independently computed binary64 i/fps schedule, and each frame's shot is `playbackShownLayer` of `playbackLayersAt`, the shot the picture shows most of, so the poses follow the shot on screen through a fade or a dissolve. Motion sampling, projection and fog use engine functions. Camera depth is projectToNdc's pre-divide depth, unaffected by the discarded frustum-scaled coordinates, so unit frustum arguments preserve that depth; root-sampled fog approximates depth variation across each actor.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The planner owns only the frame walk and the per-actor record, the clock, shot resolution, sampling, projection and fog are the engine's, and the beat label is `shotBeat`, shared with the caption plan.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Unresolvable references contribute nothing rather than a placeholder, `atmosphere` is omitted for a fogless scene rather than written as a default, and no shot, actor or fixture is special-cased.

## @evidence contracts/development/common.md#meaningful-documentation

The doc states the clock, how each frame's shot and each actor's pose are resolved, what is skipped rather than refused, when and how `atmosphere` is derived, every refusal, and who writes the file, and each property states its role and unit.

## @evidence contracts/development/implementation.md#efficient-algorithms

Initial maps index all supplied shots, scenes, motions and skeletons, including unused extras, while timeline work costs O(E) and per-frame layer resolution O(F log E) for E cut entries and F output samples. Each first-live shot scans its scene's cameras and indexes that scene's nodes; different shots sharing a scene rebuild that node index. Every frame scans its live shot's performances, and each resolved actor pays sampleMotion's key/joint/expression work plus resolvePoseKeypoints' forward kinematics, joint projection and camera-clip sampling. Fog requests sample the camera again per actor. These delegated populations drive cost beyond a constant per-performance bound, and none of the input arrays or output populations is capped here.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A shot's staging, its scene, camera and node index, is resolved once per call and shared by all its frames, which is equivalent because the inputs are immutable for the call and the staging depends only on the shot's `scene` and `camera` ids; the cache is dropped on return.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Call-local maps reference every supplied shot, scene, motion and skeleton; at most one staging entry per supplied shot also holds a camera and node map, which can repeat one scene's node population across shots. The F-time schedule, motion samples and projection intermediates become collectable when their calls finish. The caller retains every returned frame, actor and keypoint, with no frame or population cap here; no native handle or background task is acquired.
