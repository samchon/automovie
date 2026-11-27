import type { AutoMovieArchetypeHolster } from "../../AutoMovieArchetypeHolster";
import {
  AutoMovieArchetypeBand,
  type IAutoMovieArchetypeBand,
} from "../../../core";

import { AutoMovieArchetypeSword } from "../../AutoMovieArchetypeSword";

export namespace HolsterBladesData {
  /*
   * A scabbard maker's rule of fit, read.
   */
  export const WULFLUND: string =
    "Wulflund's wood-core scabbard, made to the sword at about 1.5 cm longer and 2 cm wider than the blade (https://www.wulflund.com/weapons/swords/sword-accessories/scabbard-with-a-wooden-core.html)";

  /*
   * How much longer and wider than its blade a scabbard or a sheath is made,
   * metres: Wulflund's 1.5 and 2 cm.
   */
  export const FIT: Readonly<{ length: number; width: number }> = {
    length: 0.015,
    width: 0.02,
  };

  /*
   * A scabbard's or a sheath's length and width made to one of `createSword`'s
   * read swords, whole.
   */
  export const madeTo = (
    name: string,
    sword: Readonly<Partial<Record<AutoMovieArchetypeSword.Dimension, number>>>,
  ): AutoMovieArchetypeHolster.Fitted => ({
    length: AutoMovieArchetypeBand.metres(
      sword.bladeLength! + FIT.length,
      sword.bladeLength! + FIT.length,
      `${WULFLUND}, on the ${name}'s read ${sword.bladeLength} m blade`,
    ),
    width: AutoMovieArchetypeBand.metres(
      sword.bladeWidth! + FIT.width,
      sword.bladeWidth! + FIT.width,
      `${WULFLUND}, on the ${name}'s read ${sword.bladeWidth} m blade width`,
    ),
  });

  /*
   * A scabbard's or a sheath's length and width made to a blade of one of
   * `createSword`'s kinds, its bands moved out by the fit, provisional where the
   * blade's are.
   */
  export const madeFor = (kind: AutoMovieArchetypeSword.Kind): AutoMovieArchetypeHolster.Fitted => {
    const blade: Readonly<
      Partial<Record<AutoMovieArchetypeSword.Dimension, IAutoMovieArchetypeBand>>
    > = AutoMovieArchetypeSword.BANDS[kind];
    const length: IAutoMovieArchetypeBand = blade.bladeLength!;
    const width: IAutoMovieArchetypeBand = blade.bladeWidth!;
    return {
      length: AutoMovieArchetypeBand.metres(
        length.minimum + FIT.length,
        length.maximum + FIT.length,
        `${WULFLUND}, on ${length.source}`,
        length.provisional,
      ),
      width: AutoMovieArchetypeBand.metres(
        width.minimum + FIT.width,
        width.maximum + FIT.width,
        `${WULFLUND}, on ${width.source}`,
        width.provisional,
      ),
    };
  };
}
