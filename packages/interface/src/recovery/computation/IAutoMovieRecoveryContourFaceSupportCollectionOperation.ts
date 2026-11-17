
/**
 * Union original triangle incidence at every sampled contour vertex or crossed source edge. The resulting support can include adjacent faces and is not a semantic region or an exact generating patch.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Union original triangle incidence at every sampled contour vertex or crossed source edge. The resulting support can include adjacent faces and is not a semantic region or an exact generating patch.
 * @evidence contracts/development/design.md#principled-representation Union original triangle incidence at every sampled contour vertex or crossed source edge. The resulting support can include adjacent faces and is not a semantic region or an exact generating patch.
 * @evidence contracts/development/design.md#minimal-and-owned-surface collectRecoveryContourFaceSupport share IAutoMovieRecoveryContourFaceSupportCollectionOperation's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */

export namespace IAutoMovieRecoveryContourFaceSupportCollectionOperation {
/**
 * Union original triangle incidence at every sampled contour vertex or crossed source edge. The resulting support can include adjacent faces and is not a semantic region or an exact generating patch.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Union original triangle incidence at every sampled contour vertex or crossed source edge. The resulting support can include adjacent faces and is not a semantic region or an exact generating patch.
 * @evidence contracts/development/design.md#principled-representation Union original triangle incidence at every sampled contour vertex or crossed source edge. The resulting support can include adjacent faces and is not a semantic region or an exact generating patch.
 * @evidence contracts/development/design.md#minimal-and-owned-surface collectRecoveryContourFaceSupport share IAutoMovieRecoveryContourFaceSupportCollectionOperation's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */

export type Operation = (points: readonly {
 /** Original first endpoint index of this source edge, in the paired source vertex array. */
a: number;
 /** Original second endpoint index of this source edge, in the paired source vertex array. */
b: number }[],
vertexFaces: ReadonlyMap<number, ReadonlySet<number>>,
faceEdges: ReadonlyMap<string, ReadonlySet<number>>,
edgeKey: (a: number, b: number) => string) => Set<number>;
}

