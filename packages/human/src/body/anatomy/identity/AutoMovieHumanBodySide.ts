/**
 * Anatomical left and right in the person's own frame.
 *
 * Model and camera coordinates may be mirrored during viewing; a part's side follows the person and must never be inferred from screen X. Both sides remain separately measurable, while a midline sacrum has neither side.
 *
 * @evidence contracts/common.md#principled-implementation Left/right refer to the person's anatomical frame independently of model/camera mirroring.
 * @evidence contracts/common.md#clear-and-simple-design One shared side union qualifies separately measurable paired structures while midline structures remain unpaired.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Screen X never supplies anatomical laterality or merges bilateral measurement ownership.
 * @evidence contracts/common.md#meaningful-documentation The prose explains person-relative side, mirrored viewing and midline absence.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Laterality labels perform no coordinate conversion or anatomical classification algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A shared side vocabulary contains no pose or measurement-result cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The two literal labels retain no camera, paired geometry or task.
 * @author Samchon
 */
export type AutoMovieHumanBodySide = "left" | "right";
