
/**
 * Select complete saved scalar slabs intersecting a declared physical window. Scalars are millimetres along the observation's normalized sweep direction. Positive overlap uses before < upper and after > lower; merely touching the window does not select a slab. Endpoints are never moved or newly inserted. The retained whole slabs may extend beyond the window, and report those bounds.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Selected adjacent saved-plane interval ordinals in deterministic source order. Requested physical scalar window [lower,upper], or null when no window restricts selection.
 * @evidence contracts/development/design.md#principled-representation Selected adjacent saved-plane interval ordinals in deterministic source order.
 * @evidence contracts/development/design.md#minimal-and-owned-surface RecoveryAtlasObservationPublish, RecoveryAtlasObservationSource, selectRecoveryScalarIntervals share IAutoMovieRecoveryScalarIntervalsSelectionOperation's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Requested physical scalar window [lower,upper], or null when no window restricts selection.
 */

export namespace IAutoMovieRecoveryScalarIntervalsSelectionOperation {
/**
 * Select complete saved scalar slabs intersecting a declared physical window. Scalars are millimetres along the observation's normalized sweep direction. Positive overlap uses before < upper and after > lower; merely touching the window does not select a slab. Endpoints are never moved or newly inserted. The retained whole slabs may extend beyond the window, and report those bounds.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Selected adjacent saved-plane interval ordinals in deterministic source order. Requested physical scalar window [lower,upper], or null when no window restricts selection.
 * @evidence contracts/development/design.md#principled-representation Selected adjacent saved-plane interval ordinals in deterministic source order.
 * @evidence contracts/development/design.md#minimal-and-owned-surface RecoveryAtlasObservationPublish, RecoveryAtlasObservationSource, selectRecoveryScalarIntervals share IAutoMovieRecoveryScalarIntervalsSelectionOperation's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Requested physical scalar window [lower,upper], or null when no window restricts selection.
 */

export type Operation = (levelsMm: readonly number[],
order: readonly number[],
windowMm?: readonly [number, number]) => {
 
 /** Selected adjacent saved-plane interval ordinals in deterministic source order. */
intervals: number[];
 
 /** Requested physical scalar window [lower,upper], or null when no window restricts selection. */
windowMm: [number, number] | null;
 
 /** Bounds of the full selected slab population in millimetres, or null for an empty selection. */
wholeSlabBoundsMm: [number, number] | null;
 
 /** Number of complete source intervals outside the requested scalar window. */
excludedIntervals: number;
};
}

