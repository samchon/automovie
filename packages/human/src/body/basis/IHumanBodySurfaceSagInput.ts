/**
 * One document's existing rest, lean and performed arrays supplied to the surface sag calculation. Arrays share source order; distances are metres and softness remains the existing scalar.
 *
 * @evidence contracts/common.md#principled-implementation Carries matching rest, lean, skinned and hanging arrays with softness, preserving the original per-document sag input.
 * @evidence contracts/common.md#clear-and-simple-design This named record owns only the original per-document sag input; computations remain at the existing consumer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Rest, lean, skinned and hanging arrays must share one source order and document; the softness field is not converted into measured tissue stiffness.
 * @evidence contracts/common.md#meaningful-documentation Native field documentation names the retained members, their ownership and unchanged source meaning.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The source and consuming builder own the represented parts; this record transports their existing registration/evaluation.
 * @evidence contracts/modeling.md#parameter-channels The arrays are internal results of the admitted document and shared source; the softness value preserves its existing tissue-channel meaning, without exposing vertex sculpting.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The existing geometry/appearance consumer owns emitted populations.
 * @evidence contracts/modeling.md#spatial-conventions Position arrays are XYZ metres in the right-handed +Y-up, +Z-anterior, +X-left body basis frame; hanging arrays are unit directions and softness is dimensionless.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Source and assembly owners retain actual boundary construction.
 * @evidenceExclude contracts/modeling.md#rendered-observation The consuming source/assembly owner observes the result.
 * @evidence contracts/anatomy.md#anatomical-source Rest-minus-lean skin difference and softness are the conventional sag proxy consumed by createHumanBodySurfaceSag, not measured adipose boundaries or physiological compliance.
 * @evidenceExclude contracts/anatomy.md#permitted-range Existing source/document admission remains authoritative; this carrier changes no value or bound.
 * @evidence contracts/anatomy.md#parametric-authority The arrays are internal results of the admitted document and shared source; the softness value preserves its existing tissue-channel meaning, without exposing vertex sculpting.
 * @author Samchon
 */
export interface IHumanBodySurfaceSagInput {
  /** Document-rest positions in source order. */
  rest: number[];

  /** Matching lean-shape positions. */
  lean: number[];

  /** Current performed positions before sag. */
  skinned: number[];

  /** Unit rest-down directions after performance, per source vertex. */
  hanging: number[];

  /** Existing dimensionless softness value. */
  softness: number;
}
