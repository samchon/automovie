import type { IAutoMovieHumanFaceBasis } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasis";

import type { IHumanSourceMirror } from "./IHumanSourceMirror.ts";

/**
 * Inputs of the periocular registration: the face whose surfaces it names,
 * the skin's map to generation samples, the base mesh mirror and the
 * provenance it records.
 *
 * @author Samchon
 */
export interface IHumanSourcePeriocularInput {
  /** The face the registration indexes (its skin is surface `Human`). */
  face: IAutoMovieHumanFaceBasis;

  /** Face skin vertex to generation skin sample; base mesh vertices keep their index as samples. */
  faceToG1: Int32Array;

  /**
   * Authoring native ordinal to canonical root sample after active-tree
   * compaction. A negative entry is retired and cannot register a host point.
   * Omission retains the original identity map; coordinates are never fitted.
   */
  nativeToSource?: Int32Array;

  /** Base mesh mirror table. */
  mirror: IHumanSourceMirror;

  /** Generation identity. */
  generation: string;

  /** SHA-256 identities of the generation inputs. */
  sourceSha256: string[];
}
