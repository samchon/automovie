import { HUMAN_OBSERVATION_VIEWS } from "./HUMAN_OBSERVATION_VIEWS.js";

/**
 * Named direction around a Y-up human facing positive Z.
 * Left and right belong to the figure; positive X is its anatomical left.
 *
 * @evidence contracts/common.md#principled-implementation The union derives from the canonical front, oblique, profile, back and pole view names; placeHumanObservationCamera owns their degree directions and pole guard.
 * @evidence contracts/common.md#clear-and-simple-design Body and face use one canonical view population rather than separate consumer-specific orientation aliases.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts View names encode the declared display frame, not inferred anatomical registration from a photograph. Pole views use the runtime's disclosed near-pole guard rather than exact singular eye placement.
 * @evidence contracts/common.md#meaningful-documentation The comment fixes Y-up, positive-Z front and the figure's left/right convention so callers do not reverse profile names.
 * @evidence contracts/performance.md#efficient-algorithms The literal union adds no processing; native camera placement and any framing traversal belong to its consumers.
 * @evidence contracts/performance.md#reuse-equivalent-work Canonical direction names are shared while actual target, distance and framing remain request-specific. Equal view names do not identify equivalent captures without those inputs.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The type stores no camera, image or task; consumers own their camera and captured artifact lifetimes.
 */
export type HumanObservationView = (typeof HUMAN_OBSERVATION_VIEWS)[number];
