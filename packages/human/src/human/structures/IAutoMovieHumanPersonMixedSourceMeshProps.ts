import type { IAutoMovieMesh } from "@automovie/interface";

import type { IHumanFaceMaterialAttachment } from "../../face/structures/IHumanFaceMaterialAttachment";
import type { IAutoMovieHumanPersonHeadTransform } from "./IAutoMovieHumanPersonHeadTransform";

/**
 * One generated head part carrying exact native aliases or material seats.
 * Native aliases read final skin samples; registered material seats interpolate
 * their original three parents and represented weights on that same skin.
 * Other vertices receive the generated part's rigid head carry. Native and
 * material domains retain their distinction under the person instance rebase.
 *
 * @evidence contracts/common.md#principled-implementation Actual native correspondence or original material parent seats pair evaluated skin coordinates with the generated part that uses them.
 * @evidence contracts/common.md#clear-and-simple-design Mesh, rigid carry, canonical lookup, final skin and exact material seats identify one placement.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source aliases are identified by domain/ID rather than positions or part-name patterns.
 * @evidence contracts/common.md#meaningful-documentation Separates skin attachment coordinates from the generated part's rigid vertices.
 * @evidence contracts/modeling.md#spatial-conventions Input mesh uses head-frame metres; skin positions and placed output use person-frame metres.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Part and joint owners define the tissue; this record transports their shared point identities.
 * @evidenceExclude contracts/anatomy.md#permitted-range The source and pose owners admit geometry.
 * @evidenceExclude contracts/anatomy.md#parametric-authority This record adds no authoring value.
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
  materialAttachments?: ReadonlyMap<string, ReadonlyMap<number, IHumanFaceMaterialAttachment>>;

  /** Native skin physical domain of the actual face-producing instance. */
  origin: string;

  /** Shared skin physical domain of the actual person instance. */
  domain: string;
}
