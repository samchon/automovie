/**
 * How one requested lid tissue shell fits the lid it was built in.
 *
 * A lid has a thickness at each cage station: the height of its skin above
 * the ocular exterior. A shell's requested dimensions need a certain share of
 * that thickness. `minimumMarginMetres` is the smallest remaining room over
 * the actual inner-face source or conforming-overlay samples, negative where
 * the request exceeds the lid. The
 * generated shell retains the requested offset and thickness;
 * readHumanFacePeriocularTissueSpace uses this record to refuse insufficient
 * room rather than truncating the shell to fit.
 *
 *
 * @evidence contracts/common.md#principled-implementation Actual inner-face source/overlay samples retain their unchanged floor-room count and minimum signed margin.
 * @evidence contracts/common.md#clear-and-simple-design The tissue producer measures requested dimensions and the space reader uses that complete record for room refusal.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Insufficient room does not truncate thickness/offset or replace full actual-shell contact.
 * @evidence contracts/common.md#meaningful-documentation Fields identify actual read samples, negative-room population and metre minimum.
 * @evidenceExclude contracts/performance.md#efficient-algorithms IHumanFacePeriocularTissueFit is an erased geometry/source contract; its concrete producer or reader owns actual algorithms and population traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work IHumanFacePeriocularTissueFit declares correspondence only; its concrete owner decides geometry copies, shared readings and invalidation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IHumanFacePeriocularTissueFit acquires no runtime buffer, handle or task; concrete builders/readers own referenced arrays and optional callback retention.
 *
 * @author Samchon
 */
export interface IHumanFacePeriocularTissueFit {
  /** Actual emitted source/overlay samples whose inner-face room was read. */
  stations: number;

  /** Read samples where the requested inner face falls below its ocular floor. */
  shortStations: number;

  /** Smallest sample's remaining room above the authored ocular floor, metres. */
  minimumMarginMetres: number;
}
