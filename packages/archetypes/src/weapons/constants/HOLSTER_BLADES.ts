import "../../core";
import type { AutoMovieArchetypeHolster } from "../AutoMovieArchetypeHolster";
import { AutoMovieArchetypeSword } from "../AutoMovieArchetypeSword";
import { HolsterBladesData } from "./internal/HolsterBladesData";

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
    crecy: HolsterBladesData.madeTo("Crecy", AutoMovieArchetypeSword.MODELS.longsword!.crecy!),
    regent: HolsterBladesData.madeTo("Regent", AutoMovieArchetypeSword.MODELS.longsword!.regent!),
    knight: HolsterBladesData.madeTo("Knight", AutoMovieArchetypeSword.MODELS.armingSword!.knight!),
    poitiers: HolsterBladesData.madeTo("Poitiers", AutoMovieArchetypeSword.MODELS.armingSword!.poitiers!),
    sabre: HolsterBladesData.madeFor("sabre"),
    katana: HolsterBladesData.madeFor("katana"),
    rapier: HolsterBladesData.madeFor("rapier"),
  },
  sheath: {
    dagger: HolsterBladesData.madeFor("dagger"),
    knife: HolsterBladesData.madeFor("knife"),
  },
};
