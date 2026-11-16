import type { IAutoMovieVector3 } from "@automovie/interface";

import type { walkFoot } from "./walkFoot";
import type { walkReach } from "./walkReach";

/**
 * Read final stance endpoints only when a grounded result consumes them.
 * Bearing stances are already fitted by the root solve; non-bearing stances
 * are needed at swing boundaries but are replaced by swing goals otherwise.
 *
 * @param held The root solver's final bearing endpoints and contact offsets.
 * @param bearing Which stances participated in that root solve.
 * @param complete Fit the remaining stances at the same final root once.
 * @returns Both exact endpoint and contact records, with deferred inactive reads.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States which endpoints are ready, why inactive ones can be deferred and what completes them.
 * @evidence contracts/development/implementation.md#principled-implementation Demand changes only when the original final stance fit runs; reading any inactive endpoint or contact completes those same fixed-root fits before returning their exact values.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Four record getters share one completion guard over the root solver's own output records.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No endpoint is approximated or replaced, and a failed fit publishes no completed guard.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant getter overhead; a query that consumes only bearing endpoints performs no inactive final fit, while a boundary reader completes them once.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Every getter belongs to one fixed final root and its unchanged scheduled feet, sharing only that root's exact completed stance work.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One returned ground result retains its two endpoint records, bearing flags and one completion callback until the query releases it; it retains no time history or global entry.
 */
export function walkReachFeet(
  held: Pick<walkReach.IGround, "feet" | "contacts">,
  bearing: Readonly<Record<"left" | "right", boolean>>,
  complete: () => void,
): Pick<walkReach.IGround, "feet" | "contacts"> {
  let pending: boolean = true;
  const ensure: (side: "left" | "right") => void = (side: "left" | "right"): void => {
    if (bearing[side] || !pending) return;
    complete();
    pending = false;
  };
  return {
    feet: {
      get left(): walkFoot.IEnd { ensure("left"); return held.feet.left; },
      get right(): walkFoot.IEnd { ensure("right"); return held.feet.right; },
    },
    contacts: {
      get left(): IAutoMovieVector3 { ensure("left"); return held.contacts.left; },
      get right(): IAutoMovieVector3 { ensure("right"); return held.contacts.right; },
    },
  };
}
