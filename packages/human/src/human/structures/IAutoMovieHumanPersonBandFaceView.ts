import type { IAutoMovieHumanFaceBasis } from "../../face/structures/IAutoMovieHumanFaceBasis";

/**
 * The face producer's transient view with one extra body-side neck-band surface. Selected body triangles copy neutral metre positions, face target/attachment rows and available corner UVs into first-use local vertex order. bodyVertices maps each local row back to body skin; unchanged face records remain borrowed. This surface/region is evaluated and read back without being emitted, since body geometry owns those triangles.
 *
 * @evidence contracts/common.md#principled-implementation One explicit transient surface and body index map let existing face channels/articulation evaluate continued body-side band support.
 * @evidence contracts/common.md#clear-and-simple-design Canonical face basis plus one surface identity/local-to-body table separate numerical face production from body emission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Transient face evaluation does not emit duplicate band skin or replace source registration, and copied/borrowed records are not claimed deeply frozen by this interface.
 * @evidence contracts/common.md#meaningful-documentation Prose states first-use source remapping, metre positions, optional UV availability and never-emitted ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This view carrier runs no support selection, geometry copying or face evaluation; its compiler owns those algorithms.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Reusing the transient compiled view is builder behavior, not a cache implemented by this record.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The schema acquires no source task or renderer; containing compiled generations own copied band arrays and borrowed face records.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonBandFaceView {
  /** The face view with the band surface added. */
  basis: IAutoMovieHumanFaceBasis;

  /** The id of the never-emitted band surface and of its one region. */
  surface: string;

  /** Body skin vertex of each band surface vertex, in surface order. */
  bodyVertices: number[];
}
