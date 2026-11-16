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
 * @param complete Fit the requested remaining stance at the same final root once.
 * @returns Both exact endpoint and contact records, with deferred inactive reads.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States which endpoints are ready, why inactive ones can be deferred and what completes them.
 * @evidence contracts/development/implementation.md#principled-implementation Demand changes only when the original final stance fit runs; reading an inactive endpoint or contact completes that same side's independent fixed-root fit before returning its exact value.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Each side's endpoint/contact getter pair shares one completion guard over the root solver's own output records.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No endpoint is approximated or replaced, and a failed fit publishes no completed guard.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant getter overhead; a query that consumes only bearing endpoints performs no inactive final fit, while a boundary reader fits each actually requested inactive side at most once.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Every getter belongs to one fixed final root and its unchanged scheduled feet, sharing only that root's exact completed stance work.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One returned ground result retains two endpoint records, bearing flags, two completion bits and one callback until the query releases it; it retains no time history or global entry.
 */
export function walkReachFeet(
  held: Pick<walkReach.IGround, "feet" | "contacts">,
  bearing: Readonly<Record<"left" | "right", boolean>>,
  complete: (side: "left" | "right") => void,
): Pick<walkReach.IGround, "feet" | "contacts"> {
  const pending: Record<"left" | "right", boolean> = { left: true, right: true };
  const ensure: (side: "left" | "right") => void = (side: "left" | "right"): void => {
    if (bearing[side] || !pending[side]) return;
    complete(side);
    pending[side] = false;
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
