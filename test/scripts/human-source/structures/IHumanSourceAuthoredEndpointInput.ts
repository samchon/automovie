import type { IHumanSourceCut } from "./IHumanSourceCut.ts";
import type { IHumanSourceCompactedTopology } from "./IHumanSourceCompactedTopology.ts";
import type { IHumanSourceAuthoredPacket } from "./IHumanSourceAuthoredPacket.ts";
import type { IHumanSourceDeltaReader } from "./IHumanSourceDeltaReader.ts";

/** Current provider endpoint or explicitly carried original native residual.
 * @author Samchon
 */
export interface IHumanSourceAuthoredEndpointInput {
  /** Original endpoint identity used in source provenance and refusals. */
  name: string;

  /** Original native domain and immutable cut lineage. */
  original: IHumanSourceCut;

  /** Current compacted source and its retained original-native correspondence. */
  root: IHumanSourceCompactedTopology;

  /** Current provider's explicit support weights for appended native points. */
  packet: IHumanSourceAuthoredPacket;

  /** Verified current provider differences in canonical root metres. */
  reader: IHumanSourceDeltaReader;

  /** Historical sparse [original source ID, dx, dy, dz] metre rows. */
  originalRows: readonly number[];

  /** Verified upstream state identity; omission explicitly selects residual carry. */
  recipe?: string;

  /** Recovered extraction shift subtracted from the recipe delta, metres. */
  shiftMetres?: readonly number[];
}
