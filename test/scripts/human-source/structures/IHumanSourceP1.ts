import type { IHumanSourceP1Pair } from "./IHumanSourceP1Pair.ts";
import type { IHumanSourceEndpointDomain } from "./IHumanSourceEndpointDomain.ts";

/**
 * The P1 representation: the current two-basis structure with both skins
 * bound to the generation's one frozen cut through `sourcePartition`, so the
 * runtime seam joins identical source samples. Basis ids are new.
 *
 * @author Samchon
 */
export interface IHumanSourceP1 extends IHumanSourceP1Pair {
  /** Assembly checks, written to the reproduction record. */
  checks: Record<string, number | boolean | string>;

  /** How the face contact lip margin chains were joined (`buildHumanSourceLipMarginChain`), for the generation manifest. */
  marginChain: Record<string, unknown>;

  /** Source-declared skin/part/landmark membership and current alias owner. */
  endpointDomains: IHumanSourceEndpointDomain[];
}
