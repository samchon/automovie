import type { AutoMovieHumanBodyBoneId } from "../anatomy/identity/AutoMovieHumanBodyBoneId";
import type { IAutoMovieHumanBodyAtlasRegistration } from "../anatomy/atlas/IAutoMovieHumanBodyAtlasRegistration";
import type { IAutoMovieHumanBodyAtlasSource } from "../anatomy/atlas/IAutoMovieHumanBodyAtlasSource";
import type { IAutoMovieHumanBodyUnvalidatedGeometry } from "../anatomy/generated/IAutoMovieHumanBodyUnvalidatedGeometry";

/**
 * Provenance of one acquired atlas inspection member in a static primitive.
 *
 * Its source part ID joins the common actual accessor partition; the bone ID
 * retains anatomical identity independently of material naming. Source mesh
 * digest concerns the registered reference, not the final posed Float32 mesh.
 *
 * @evidence contracts/common.md#principled-implementation Exact member identity joins source provenance to the common geometry partition without duplicating its interval formula.
 * @evidence contracts/common.md#clear-and-simple-design One record carries one part's source and reference qualification.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Atlas shape and provenance cannot supply a clinical resolved label.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes bone identity, source member and registered reference digest from final geometry.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyAtlasPartQualification {
  /** Exact source model member ID, including the person's body prefix. */
  id: string;

  /** Acquired anatomical bone identity. */
  part: AutoMovieHumanBodyBoneId;

  /** Original source bytes, attribution, rights and acquisition account. */
  source: IAutoMovieHumanBodyAtlasSource;

  /** Exact reference basis, shape, carrier and authored placement limitations. */
  registration: IAutoMovieHumanBodyAtlasRegistration;

  /** Verified source registered mesh digest, distinct from posed asset bytes. */
  compiledMeshSha256: string;

  /** The atlas supplies no independently validated personal anatomical part. */
  partResolution: IAutoMovieHumanBodyUnvalidatedGeometry;
}
