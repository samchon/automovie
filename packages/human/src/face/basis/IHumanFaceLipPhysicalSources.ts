import type { IAutoMovieMeshPhysicalSource } from "@automovie/interface";

import type { IHumanFaceMaterialAttachment } from "../structures/IHumanFaceMaterialAttachment";

/**
 * Physical aliases and material interpolation from one complete lip margin.
 * The registration belongs to one figure instance. Material numeric IDs are
 * exact-key ordinals in their separate domain, never native vertex numbers.
 *
 * @author Samchon
 */
export interface IHumanFaceLipPhysicalSources {
  /** Reader identity to its actual domain and nonnegative numeric source ID. */
  sources: ReadonlyMap<string, IAutoMovieMeshPhysicalSource>;

  /** Material domain, then numeric ID, to original source interpolation. */
  materialAttachments: ReadonlyMap<
    string,
    ReadonlyMap<number, IHumanFaceMaterialAttachment>
  >;
}
