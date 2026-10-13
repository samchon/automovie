import type { IAutoMovieHumanBodyAtlasRegistration } from "../anatomy/atlas/IAutoMovieHumanBodyAtlasRegistration";
import type { IAutoMovieHumanBodyAtlasSource } from "../anatomy/atlas/IAutoMovieHumanBodyAtlasSource";
import type { IAutoMovieHumanBodyUnvalidatedGeometry } from "../anatomy/generated/IAutoMovieHumanBodyUnvalidatedGeometry";
import type { AutoMovieHumanBodyBoneId } from "../anatomy/identity/AutoMovieHumanBodyBoneId";

/**
 * Provenance of one acquired atlas inspection member in a static primitive.
 *
 * Its source part ID joins the common accessor partition; the bone ID retains anatomical identity independently of material naming. The source mesh digest concerns the registered reference rather than the final posed Float32 mesh.
 *
 * @evidence contracts/common.md#principled-implementation Emitted member ID and bone identity accompany original source rights, reference basis/shape/carrier registration, verified source mesh digest and unresolved personal part status.
 * @evidence contracts/common.md#clear-and-simple-design Each atlas receipt binds provenance to one generic source member without defining another interval or anatomy document.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A registered reference digest cannot identify final posed bytes or upgrade reference placement into independently validated personal anatomy.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish body-prefixed emitted identity, anatomical owner, acquisition rights, reference registration and the digest's source scope.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Atlas member typing computes no mesh hash, placement or part validation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The member receipt schema implements no cache of source acquisition or export matching.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This type acquires no atlas source bytes, writer or mesh-processing task.
 *
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
