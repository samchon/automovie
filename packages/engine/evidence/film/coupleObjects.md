# src/film/coupleObjects.ts#coupleObjects

## @evidence contracts/development/implementation.md#principled-implementation

Builds the child-to-parent coupling graph, orders it by a depth-first post-order so every parent bakes before its riders, and reports a back edge as a cycle; a chained parent's frame is sampled by the same per-channel latest-start authority as playback, which keeps a rider attached to the parent the viewer draws, including before a late coupling and across a handoff.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns coupling order, cycle refusal, mount validation and id uniqueness, delegating bakes/events to compileAttach/handoffEvents. One private adapter lends a genuine immutable rig only when the admitted caller explicitly supplies its producer, keeping raw default behavior and existing lookup sites.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No node, bone or clip id is special-cased; chain selection reads what a clip carries and when it starts rather than its id suffix, and a cycle or rig-less mount is refused instead of baked frozen.

## @evidence contracts/development/implementation.md#efficient-algorithms

Graph/order/grouping are linear in nodes/edges; per-child job sorting adds summed O(J log J). Each bake retains S actual motion samples: raw FK spans B bones, while an explicit parent snapshot pays static preparation once and computes only attachment ancestry per sample with ordered pose admission. Chained-parent sampling and recursion remain unchanged; speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Parent baked clips remain shared by riders. Existing skeleton/axis/frame lookups still run at their original per-job sites; an explicit producer snapshots those actual fixed values only for that synchronous bake, and no callback answer, pose, time sample or target result is cached across jobs or calls.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The graph, order, grouping maps and per-parent clip lists live for one call and are released on return or throw; the returned arrays hold one clip per coupling, the handoff events of each `attachTo`, and one violation per refusal.

## @evidence contracts/development/common.md#meaningful-documentation

States coupling precedence/events, mount admission, chained-parent sampling, cycle refusal, bake order/ids and the optional actual static-rig producer versus raw-default boundary.
