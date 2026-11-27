import "../../core";
import type { AutoMovieArchetypeHolster } from "../AutoMovieArchetypeHolster";
import { AutoMovieArchetypeSword } from "../AutoMovieArchetypeSword";
import { madeTo, madeFor } from "./internal/HolsterBladesData";

/*
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
