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
