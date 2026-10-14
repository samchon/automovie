import { portraitSkinParameters } from "../portraitSkinParameters";

/**
 * Optional scalar skin settings. Both sides use the same authored amounts but
 * follow their own live anatomical bindings and performance. Omitted values
 * take the documented parameter defaults; zero laxity and expression creasing
 * leave the underlying surface exactly unchanged. This is visible morphology,
 * not a biological age predictor or a viscoelastic simulation.
 *
 * @evidence contracts/common.md#principled-implementation A partial record derives its keys from the fifteen-entry portraitSkinParameters catalogue; resolvePortraitSkinShape admits finite authored ranges and supplies the same declared defaults used by the procedural producer.
 * @evidence contracts/common.md#clear-and-simple-design Catalogue identity owns the optional scalar vocabulary; live landmark bindings and wrinkle/laxity construction stay with createPortraitSkinLayer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Parameter ranges and default amounts are authored morphology conventions rather than measured ageing or tissue mechanics; actual relief depends on the consumer's available surface and anatomical bindings.
 * @evidence contracts/common.md#meaningful-documentation The prose explains omission, bilateral amount sharing, live bindings and the zero-activation convention without claiming a biological model.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This mapped type executes no resolution or geometry construction; the resolver and layer producer own those costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This type schedules no work; both resolution and geometry reuse the shared parameter catalogue.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This type retains no task or external handle; ordinary input records belong to their caller.
 *
 * @author Samchon
 */
export type IPortraitSkinShape = Partial<
  Record<(typeof portraitSkinParameters)[number]["id"], number>
>;
