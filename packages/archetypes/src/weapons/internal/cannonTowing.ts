import type { AutoMovieArchetype } from "../../core/index";
import type { ArchetypeTowing } from "../../core/internal/ArchetypeTowing";
import { towingAxle } from "../../core/internal/towingAxle";
import type { AutoMovieArchetypeCannon } from "../AutoMovieArchetypeCannon";

/*
 * Declare the field gun's transverse wheel support for limbered towing.
 * Parameter gun: Neutral fieldGun output; its trail coupling is behind its own +Z.
 * Returns: An independent model-space metre axle, permitting rigid pitch while
 * its two wheels stay grounded.
 * For another producer/kind or invalid wheel-axis
 * geometry.
 * If a required wheel-spin affordance is
 * absent.
 */
export function cannonTowing(
  gun: AutoMovieArchetype<AutoMovieArchetypeCannon.Affordance, AutoMovieArchetypeCannon.Dimension>,
): ArchetypeTowing.Support<AutoMovieArchetypeCannon.Affordance> {
  if (gun.archetype !== "cannon" || gun.name !== "fieldGun")
    throw new RangeError(
      "Only the actual two-wheel field gun declares this towing support",
    );
  return {
    kind: "singleAxle",
    axle: towingAxle(gun.affordance("leftSpin"), gun.affordance("rightSpin")),
  };
}
