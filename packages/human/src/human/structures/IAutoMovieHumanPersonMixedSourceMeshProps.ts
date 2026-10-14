import type { IAutoMovieMesh } from "@automovie/interface";

import type { IHumanFaceMaterialAttachment } from "../../face/structures/IHumanFaceMaterialAttachment";
import type { IAutoMovieHumanPersonHeadTransform } from "./IAutoMovieHumanPersonHeadTransform";

/**
 * One generated head part carrying exact native aliases or material seats. Native aliases read final skin samples; registered material seats interpolate their original three parents and represented weights on that same skin. Other vertices receive the generated part's rigid head carry. Native and material domains retain their distinction under the person instance rebase.
 *
 * @evidence contracts/common.md#principled-implementation Exact native skin aliases and registered barycentric material seats address the final performed skin, while remaining generated vertices receive the same rigid head carry.
 * @evidence contracts/common.md#clear-and-simple-design Native sample lookup, material attachment registry and physical-domain names remain explicit because each names a different source identity namespace.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Attachment follows exact canonical parents and weights rather than equal-position welding or neutral coordinates used as an alignment workaround.
 * @evidence contracts/common.md#meaningful-documentation Comments state final person-frame metres, native source domains, optional material seat registration and one canonical-sample lookup.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The generated part native aliases and material-seat operands specify data and signatures; numerical producers own their traversal strategy.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Request equivalence is not implemented by the generated part native aliases and material-seat operands; consuming operations decide dependency-sensitive reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The generated part native aliases and material-seat operands acquire no external resource or running task; their containing value owns ordinary data retention.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonMixedSourceMeshProps {
  /** Actual generated mesh, including source-domain skin aliases. */
  mesh: IAutoMovieMesh;

  /** The same head carry used for its remaining generated vertices. */
  head: IAutoMovieHumanPersonHeadTransform;

  /** Canonical sample ID to the final skin-array vertex; compiled once. */
  samples: ReadonlyMap<number, number>;

  /** Final body-weighted, performed face skin in person-frame metres. */
  positions: readonly number[];

  /** Exact native face surface addressed by material attachment parents. */
  surface?: string;

  /** Geometry-owned physical domain and ID to original triangle seat. */
  materialAttachments?: ReadonlyMap<
    string,
    ReadonlyMap<number, IHumanFaceMaterialAttachment>
  >;

  /** Native skin physical domain of the actual face-producing instance. */
  origin: string;

  /** Shared skin physical domain of the actual person instance. */
  domain: string;
}
