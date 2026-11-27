import {
  AutoMovieArchetypeBand,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../../core";
import { AutoMovieArchetypeFirearm } from "../internal/AutoMovieArchetypeFirearm";
import { HANDGUN_MODELS } from "./HANDGUN_MODELS";
import type { AutoMovieArchetypeHandgun } from "../AutoMovieArchetypeHandgun";
import * as HandgunBandsData from "./internal/HandgunBandsData";

/*
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
  fullSize: HandgunBandsData.SHARED,
  compact: HandgunBandsData.SHARED,
  revolver: {
    height: AutoMovieArchetypeBand.metres(
      5.5 * AutoMovieArchetypeUnits.INCH,
      HANDGUN_MODELS.revolver!.saa75!.height!,
      `borrowed from ${HandgunBandsData.GP100} and the Single Action Army's, because Ruger's Vaquero 5104 sheet gives none (searched: Ruger's spec sheets and manual; records-firearms-revolver.md)`,
      true,
    ),
    width: AutoMovieArchetypeBand.metres(
      1.55 * AutoMovieArchetypeUnits.INCH,
      HANDGUN_MODELS.revolver!.saa75!.width!,
      `borrowed from ${HandgunBandsData.GP100} and the Single Action Army's, because Ruger's Vaquero 5104 sheet gives none (searched: Ruger's spec sheets and manual; records-firearms-revolver.md)`,
      true,
    ),
    triggerReach: AutoMovieArchetypeBand.metres(
      HANDGUN_MODELS.revolver!.saa75!.triggerReach!,
      3.5 * AutoMovieArchetypeUnits.INCH,
      `borrowed from ${HandgunBandsData.GP100} and the Single Action Army's, because Ruger's Vaquero 5104 sheet gives none (searched: Ruger's spec sheets and manual; records-firearms-revolver.md)`,
      true,
    ),
    triggerTravel: borrowed(HandgunBandsData.SHARED.triggerTravel, "trigger travel"),
    gripDepth: borrowed(HandgunBandsData.SHARED.gripDepth, "grip depth estimate"),
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
    triggerReach: borrowed(HandgunBandsData.SHARED.triggerReach, "trigger reach"),
    triggerTravel: borrowed(HandgunBandsData.SHARED.triggerTravel, "trigger travel"),
    gripDepth: borrowed(HandgunBandsData.SHARED.gripDepth, "grip depth estimate"),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      1.16,
      1.16,
      `${HandgunBandsData.GRAZ_PISTOL}, because no record weighs a Light Dragoon or Sea Service pistol (searched: Museums Victoria, Royal Museums Greenwich; records-firearms-flintlock.md)`,
      true,
    ),
    muzzleVelocity: AutoMovieArchetypeBand.of(
      "m/s",
      385,
      385,
      `${HandgunBandsData.GRAZ_PISTOL}, because no measured velocity of a British service pistol was found (searched: Griffiths 1856, Robins 1805; records-firearms-flintlock.md)`,
      true,
    ),
    lockTime: AutoMovieArchetypeFirearm.FLINTLOCK_TIME,
    ball: AutoMovieArchetypeBand.metres(
      0.0135,
      0.0135,
      `${HandgunBandsData.GRAZ_PISTOL}, because no record gives the British pistols' ball (searched: Museums Victoria, Royal Museums Greenwich; records-firearms-flintlock.md)`,
      true,
    ),
  },
};

/*
 * A band of a self-loading pistol's lent to a revolver or a flintlock pistol,
 * whose own was not found, with what was searched.
 * Parameter band: The pistols' band.
 * Parameter what: What is borrowed.
 * Returns: The same range, provisional, labelled with its lender and the
 * search.
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
