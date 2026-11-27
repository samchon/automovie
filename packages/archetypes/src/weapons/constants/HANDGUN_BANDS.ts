import {
  AutoMovieArchetypeBand,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../../core";
import { AutoMovieArchetypeFirearm } from "../internal/AutoMovieArchetypeFirearm";
import { HANDGUN_MODELS } from "./HANDGUN_MODELS";
import type { AutoMovieArchetypeHandgun } from "../AutoMovieArchetypeHandgun";

/** The Graz test of a flintlock pistol. */
const GRAZ_PISTOL: string =
  "Krenn, Kalaus and Hall, Material History Review 42 (1995), p. 104, Table 1, flintlock pistol STP 1128 (Ferlach, about 1700): barrel 332 mm, 1.16 kg, ball 13.5 mm and 14.45 g, charge 5.00 g, 385 m/s at the muzzle, electrically ignited (https://journals.lib.unb.ca/index.php/MCR/article/download/17669/18944): borrowed from it";

/**
 * A band of a self-loading pistol's lent to a revolver or a flintlock pistol,
 * whose own was not found, with what was searched.
 *
 * @param band The pistols' band.
 * @param what What is borrowed.
 * @returns The same range, provisional, labelled with its lender and the
 *   search.
 */
function borrowed(
  band: IAutoMovieArchetypeBand,
  what: string,
): IAutoMovieArchetypeBand {
  return AutoMovieArchetypeBand.of(
    band.unit,
    band.minimum,
    band.maximum,
    `borrowed from the self-loading pistols' ${what} (${band.source}) because no revolver's or flintlock pistol's was found (searched: Colt's 1993 manual, Ruger's spec sheets, Gun Tests, Smith & Wesson's pages, Museums Victoria, Royal Museums Greenwich; records-firearms-revolver.md, records-firearms-flintlock.md)`,
    true,
  );
}

/**
 * The double-action revolver Gun Tests measured, whose figures a revolver
 * lacking them borrows with the Single Action Army's.
 */
const GP100: string =
  "Gun Tests, Ruger GP100 No. 1707 .357 Magnum: 5.5 in high, 1.55 in minimum width, trigger span 3.5 in single action (https://www.gun-tests.com/handguns/revolvers/ruger-gp100-no-1707-357-magnum/)";

/** The maker's guide that gives the trigger's reach by backstrap and its travel. */
const TRIGGER: string =
  "GLOCK Gen4 Buyer's Guide, p. 4, trigger distance 70, 72 and 74 mm without, with the medium and with the large backstrap, and trigger travel about 12.5 mm (https://www.krale.shop/media/blfa_files/Glock_Generation_4_Models_manual_exploded_view_EN-min_2.pdf)";

/** Dimensions no maker publishes. */
const UNPUBLISHED: string = "not published by either maker; an estimate";

/**
 * The bands of the dimensions a model leaves, the same for both frames: each
 * drawn only for a model that does not give it.
 */
const SHARED: Readonly<
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

/**
 * The band of each free dimension of `createHandgun` a model leaves, by frame,
 * with the sources they are read at: kept apart from the producer, with its
 * models, so each file stays within its size.
 */
export const HANDGUN_BANDS: Readonly<
  Record<
    AutoMovieArchetypeHandgun.Frame,
    Readonly<Partial<Record<AutoMovieArchetypeHandgun.Dimension, IAutoMovieArchetypeBand>>>
  >
> = {
  fullSize: SHARED,
  compact: SHARED,
  revolver: {
    height: AutoMovieArchetypeBand.metres(
      5.5 * AutoMovieArchetypeUnits.INCH,
      HANDGUN_MODELS.revolver!.saa75!.height!,
      `borrowed from ${GP100} and the Single Action Army's, because Ruger's Vaquero 5104 sheet gives none (searched: Ruger's spec sheets and manual; records-firearms-revolver.md)`,
      true,
    ),
    width: AutoMovieArchetypeBand.metres(
      1.55 * AutoMovieArchetypeUnits.INCH,
      HANDGUN_MODELS.revolver!.saa75!.width!,
      `borrowed from ${GP100} and the Single Action Army's, because Ruger's Vaquero 5104 sheet gives none (searched: Ruger's spec sheets and manual; records-firearms-revolver.md)`,
      true,
    ),
    triggerReach: AutoMovieArchetypeBand.metres(
      HANDGUN_MODELS.revolver!.saa75!.triggerReach!,
      3.5 * AutoMovieArchetypeUnits.INCH,
      `borrowed from ${GP100} and the Single Action Army's, because Ruger's Vaquero 5104 sheet gives none (searched: Ruger's spec sheets and manual; records-firearms-revolver.md)`,
      true,
    ),
    triggerTravel: borrowed(SHARED.triggerTravel, "trigger travel"),
    gripDepth: borrowed(SHARED.gripDepth, "grip depth estimate"),
    muzzleVelocity: AutoMovieArchetypeBand.of(
      "m/s",
      725 * AutoMovieArchetypeUnits.FOOT,
      725 * AutoMovieArchetypeUnits.FOOT,
      "borrowed from Hornady's .45 Colt 255 gr Cowboy, 725 fps from a 4.75 in barrel (https://www.hornady.com/ammunition/handgun/45-colt-255-gr-cowboy), because no velocity from the Single Action Army's 7.5 in or the Vaquero's 5.5 in barrel was found (searched: Colt, Ruger, Gun Tests' load tables; records-firearms-revolver.md)",
      true,
    ),
    lockTime: AutoMovieArchetypeFirearm.BORROWED,
  },
  flintlock: {
    triggerReach: borrowed(SHARED.triggerReach, "trigger reach"),
    triggerTravel: borrowed(SHARED.triggerTravel, "trigger travel"),
    gripDepth: borrowed(SHARED.gripDepth, "grip depth estimate"),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      1.16,
      1.16,
      `${GRAZ_PISTOL}, because no record weighs a Light Dragoon or Sea Service pistol (searched: Museums Victoria, Royal Museums Greenwich; records-firearms-flintlock.md)`,
      true,
    ),
    muzzleVelocity: AutoMovieArchetypeBand.of(
      "m/s",
      385,
      385,
      `${GRAZ_PISTOL}, because no measured velocity of a British service pistol was found (searched: Griffiths 1856, Robins 1805; records-firearms-flintlock.md)`,
      true,
    ),
    lockTime: AutoMovieArchetypeFirearm.FLINTLOCK_TIME,
    ball: AutoMovieArchetypeBand.metres(
      0.0135,
      0.0135,
      `${GRAZ_PISTOL}, because no record gives the British pistols' ball (searched: Museums Victoria, Royal Museums Greenwich; records-firearms-flintlock.md)`,
      true,
    ),
  },
};
