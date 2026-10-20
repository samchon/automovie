/**
 * What a walkable/standable surface _is_ in the set: semantic labeling for the space layer, not geometry. A `floor` is the ground plane of a room or lot; a `platform` is a raised standable top (a table, a stage, a crate lid); a `ramp` is a sloped connector whose height varies along one axis. The closed union keeps structured output on the rails the way every other `AutoMovie*` enum does; new kinds (stairs beyond the ramp approximation, water, …) are additive.
 *
 * @evidence contracts/common.md#principled-implementation Closed floor, platform and ramp labels describe supported set-surface roles while polygon and height law independently define their actual geometry.
 * @evidence contracts/common.md#clear-and-simple-design Semantic kind stays separate from terrain shape and walkability so one label cannot silently infer dimensions or physical traversal rules.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A ramp label does not synthesize stairs or a slope; the authored height rule supplies geometry and supported validators decide traversal.
 * @evidence contracts/common.md#meaningful-documentation Defines floor, raised platform and sloped-connector meaning and their separation from geometry.
 */
export type AutoMovieSurfaceKind = "floor" | "platform" | "ramp";
