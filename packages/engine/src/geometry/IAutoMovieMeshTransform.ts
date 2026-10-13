import { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

/**
 * A placement of a rigid mesh: per-axis scale first, then a unit-quaternion
 * rotation, then a translation, as `transformAutoMovieMesh` applies it.
 *
 * Normals take the inverse transpose of the scale and rotation, and a scale
 * with a negative product flips triangle winding. UVs ride along unchanged, so
 * a scaled placement leaves metric texture coordinates measuring the unscaled
 * surface. `transformAutoMovieMesh` throws on a non-finite field, a rotation
 * whose norm differs from one by more than 1e-6, and a zero scale component.
 *
 * @evidence contracts/common.md#principled-implementation Scale, rotate, translate is the standard affine order for a rigid member, and `transformAutoMovieMesh` follows it with inverse-transpose normals and a winding flip for a mirroring scale, so outward faces stay outward under every admitted placement.
 * @evidence contracts/common.md#clear-and-simple-design Three optional fields each defaulting to identity, so a member that only needs moving names only its translation; the record is shared by mesh parts, portrait optics and face-preserving placement.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A non-unit rotation is refused rather than normalized and a collapsing scale is refused rather than clamped, so a malformed placement cannot silently produce a different pose.
 * @evidence contracts/common.md#meaningful-documentation States the application order, each field's unit and default, the normal and winding rules, the UV consequence of scaling, and every refusal with its tolerance.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A placement record; applying it is one linear pass answered on `transformAutoMovieMesh`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Supplied by the caller per placement; the transform itself does no work that could be shared.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Holds the caller's vector and quaternion by reference; the placed mesh copies nothing from it but the arithmetic result.
 * @author Samchon
 */
export interface IAutoMovieMeshTransform {
  /** Metres added after scale and rotation; omitted means no translation. */
  translation?: IAutoMovieVector3;

  /**
   * Unit quaternion applied after scale; omitted means identity. A norm off by
   * more than 1e-6 is refused.
   */
  rotation?: IAutoMovieQuaternion;

  /**
   * Nonzero per-axis factors applied first; omitted means unit scale. A
   * negative product mirrors the mesh and flips its winding.
   */
  scale?: IAutoMovieVector3;
}
