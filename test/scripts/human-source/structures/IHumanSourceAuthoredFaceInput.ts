import type { IAutoMovieHumanFaceBasis } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasis";

import type { IHumanSourceAuthoredSkin } from "./IHumanSourceAuthoredSkin.ts";

/** Current source geometry/rows and historical metadata whose exact lineage survives.
 * @author Samchon
 */
export interface IHumanSourceAuthoredFaceInput {
  face: IAutoMovieHumanFaceBasis;
  skin: IHumanSourceAuthoredSkin;
  /** Content identity supplied by the single generation publisher. */
  generation: string;
  /** Endpoint rows already authored on the new head view, never old copied rows. */
  targets: Record<string, number[]>;
  /** Current head regions, with material ownership regenerated from source cells. */
  regions: IAutoMovieHumanFaceBasis["surfaces"][number]["regions"];
}
