# src/planCaptionSidecar.ts#planCaptionSidecar

## @evidence contracts/development/implementation.md#principled-implementation

Frames come from frameTimes, the independently computed binary64 i/fps schedule the render plan uses, and a forward-only playbackCursor resolves each instant to the live shot. Division can round, but the positive clock gives the non-decreasing queries the cursor requires; grouping consecutive equal beats into half-open spans covers every scheduled frame exactly once.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Timeline layout and live-shot resolution stay in the engine, the beat index in `beatCaptions`, and serialization in `renderCaptionSidecar`; this function owns only sampling, grouping and the join, so the sidecar cannot drift from the render's frame schedule.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The `shot:` prefix is the interface's documented shot-to-beat naming, not a fixture case, read through `shotBeat`, which the pose-keypoint plan shares, and no sequence or beat is special-cased.

## @evidence contracts/development/common.md#meaningful-documentation

The doc states the clock and schedule shared with the render, the transition rule, the shot-to-beat mapping, the null states, every refusal, and that the host writes the file.

## @evidence contracts/development/implementation.md#efficient-algorithms

For S supplied shots, F output frames, E cut entries and N script-tree nodes, timeline indexing, caption indexing and the cursor sweep take O(S+F+E+N) work. The schedule holds F times, the returned range list can also reach F entries, and each range joins the beat index once without retaining a separate playback-sample array.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The planner computes one sidecar per call from caller-supplied values and coordinates no phases; a host that also plans the render recomputes the shared schedule, which is cheap arithmetic.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The frame schedule, cursor and beat index are local and released on return; the returned sidecar, owned by the caller, holds one entry per run of consecutive frames of one beat, at most F.
