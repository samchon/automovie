import { AutoMovieArchetypeBand, type IAutoMovieArchetypeBand } from "../core";
import type { AutoMovieArchetypeHolster } from "./AutoMovieArchetypeHolster";
import { AutoMovieArchetypeSword } from "./AutoMovieArchetypeSword";

/** A scabbard maker's rule of fit, read. */
const WULFLUND: string =
  "Wulflund's wood-core scabbard, made to the sword at about 1.5 cm longer and 2 cm wider than the blade (https://www.wulflund.com/weapons/swords/sword-accessories/scabbard-with-a-wooden-core.html)";

/**
 * How much longer and wider than its blade a scabbard or a sheath is made,
 * metres: Wulflund's 1.5 and 2 cm.
 */
const FIT: Readonly<{ length: number; width: number }> = {
  length: 0.015,
  width: 0.02,
};

/**
 * A scabbard's or a sheath's length and width made to one of `createSword`'s
 * read swords, whole.
 */
const madeTo = (
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

/**
 * A scabbard's or a sheath's length and width made to a blade of one of
 * `createSword`'s kinds, its bands moved out by the fit, provisional where the
 * blade's are.
 */
const madeFor = (kind: AutoMovieArchetypeSword.Kind): AutoMovieArchetypeHolster.Fitted => {
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

/**
 * The blades of `createHolster` by kind, the default first, each made with
 * Wulflund's fit: a read sword's figures whole, or a kind's blade bands moved
 * out, provisional where the blade's are.
 */
export const HOLSTER_BLADES: Readonly<{
  scabbard: Readonly<Record<AutoMovieArchetypeHolster.ScabbardBlade, AutoMovieArchetypeHolster.Fitted>>;
  sheath: Readonly<Record<AutoMovieArchetypeHolster.SheathBlade, AutoMovieArchetypeHolster.Fitted>>;
}> = {
  scabbard: {
    crecy: madeTo("Crecy", AutoMovieArchetypeSword.MODELS.longsword!.crecy!),
    regent: madeTo("Regent", AutoMovieArchetypeSword.MODELS.longsword!.regent!),
    knight: madeTo("Knight", AutoMovieArchetypeSword.MODELS.armingSword!.knight!),
    poitiers: madeTo("Poitiers", AutoMovieArchetypeSword.MODELS.armingSword!.poitiers!),
    sabre: madeFor("sabre"),
    katana: madeFor("katana"),
    rapier: madeFor("rapier"),
  },
  sheath: {
    dagger: madeFor("dagger"),
    knife: madeFor("knife"),
  },
};
