import type { IAutoMovieArchetypeBand } from "../../../core";
import { AutoMovieArchetypeBand } from "../../../core";
import { AutoMovieArchetypeUnits } from "../../../core";
import { AutoMovieArchetypeFirearm } from "../../internal/AutoMovieArchetypeFirearm";

/*
 * The Graz test of a flintlock pistol.
 */
export const GRAZ_PISTOL: string =
  "Krenn, Kalaus and Hall, Material History Review 42 (1995), p. 104, Table 1, flintlock pistol STP 1128 (Ferlach, about 1700): barrel 332 mm, 1.16 kg, ball 13.5 mm and 14.45 g, charge 5.00 g, 385 m/s at the muzzle, electrically ignited (https://journals.lib.unb.ca/index.php/MCR/article/download/17669/18944): borrowed from it";

/*
 * The double-action revolver Gun Tests measured, whose figures a revolver
 * lacking them borrows with the Single Action Army's.
 */
export const GP100: string =
  "Gun Tests, Ruger GP100 No. 1707 .357 Magnum: 5.5 in high, 1.55 in minimum width, trigger span 3.5 in single action (https://www.gun-tests.com/handguns/revolvers/ruger-gp100-no-1707-357-magnum/)";

/*
 * The maker's guide that gives the trigger's reach by backstrap and its travel.
 */
export const TRIGGER: string =
  "GLOCK Gen4 Buyer's Guide, p. 4, trigger distance 70, 72 and 74 mm without, with the medium and with the large backstrap, and trigger travel about 12.5 mm (https://www.krale.shop/media/blfa_files/Glock_Generation_4_Models_manual_exploded_view_EN-min_2.pdf)";

/*
 * Dimensions no maker publishes.
 */
export const UNPUBLISHED: string = "not published by either maker; an estimate";

/*
 * The bands of the dimensions a model leaves, the same for both frames: each
 * drawn only for a model that does not give it.
 */
export const SHARED: Readonly<
  Record<
    | "width"
    | "triggerReach"
    | "triggerTravel"
    | "gripDepth"
    | "muzzleVelocity"
    | "lockTime",
    IAutoMovieArchetypeBand
  >
> = {
  width: AutoMovieArchetypeBand.metres(
    0.0255,
    0.0255,
    "slide width: SIG SAUER publishes only the overall width; the one slide width read, GLOCK's 25.5 mm on the G17 and G19 Gen5 (https://eu.glock.com/en/products/pistols/g17-gen5), applied",
    true,
  ),
  triggerReach: AutoMovieArchetypeBand.metres(
    0.07,
    0.074,
    `${TRIGGER}: SIG SAUER publishes no trigger distance; the GLOCKs' read range applied`,
    true,
  ),
  triggerTravel: AutoMovieArchetypeBand.metres(
    0.0125,
    0.0125,
    `${TRIGGER}: no Gen5 or SIG SAUER figure is published; the Gen4 figure applied`,
    true,
  ),
  gripDepth: AutoMovieArchetypeBand.metres(
    0.048,
    0.055,
    `grip depth from front strap to backstrap, ${UNPUBLISHED}`,
    true,
  ),
  muzzleVelocity: AutoMovieArchetypeBand.of(
    "m/s",
    1198 * AutoMovieArchetypeUnits.FOOT,
    1198 * AutoMovieArchetypeUnits.FOOT,
    "SIG SAUER's 9mm +P 124 gr Elite Ball M17 FMJ, 1,198 fps from its 4.0 in test barrel (https://www.sigsauer.com/9mm-p-124gr-elite-ball-m17-fmj-box-50.html); the GLOCKs' borrowed from it because GLOCK publishes no velocity (searched: GLOCK's product pages and Gen4 guide; records-firearms-rifles.md)",
    true,
  ),
  lockTime: AutoMovieArchetypeFirearm.BORROWED,
};
