import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The head-frame point every facial construction is written in.
 *
 * It is the engine's vector under a name that says which space it is in:
 * millimetres in the head frame, +Z anterior, owned by whoever supplied it.
 * The alias exists so a reader of a curve or a patch sees the space rather than
 * a bare triple.
 *
 * @evidence contracts/common.md#principled-implementation The alias reuses IAutoMovieVector3's XYZ record while declaring the head-frame millimetre convention; units and orientation remain documented premises rather than a branded runtime conversion.
 * @evidence contracts/common.md#clear-and-simple-design A direct alias preserves engine vector interoperability and gives facial curve/patch signatures their coordinate context without another wrapper object.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The alias performs no scaling, projection, anatomical measurement inference, or specimen-specific coordinate compensation.
 * @evidence contracts/common.md#meaningful-documentation The comment supplies millimetres, the head frame, anterior-positive Z, and caller ownership beyond the underlying vector shape.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased coordinate alias selects no algorithm or processing strategy.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This alias coordinates no requests or computed results and defines no equivalence cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The alias allocates and retains no point; supplying curve and patch producers own their records.
 *
 * @author Samchon
 */
export type Point = IAutoMovieVector3;
