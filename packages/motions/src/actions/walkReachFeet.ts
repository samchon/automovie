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
