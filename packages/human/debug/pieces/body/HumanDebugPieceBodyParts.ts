import { AutoMovieHumanDigitWalk } from "../../../src/generation/limb/AutoMovieHumanDigitWalk";
import type { AutoMovieHumanSiteViewPart } from "../../../src/generation/limb/AutoMovieHumanSiteViewPart";
import { AutoMovieHumanWalkPart } from "../../../src/generation/limb/AutoMovieHumanWalkPart";
import { AutoMovieHumanTrunkViewPart } from "../../../src/generation/trunk/AutoMovieHumanTrunkViewPart";
import type { IAutoMovieHumanBodyCalibration } from "../../../src/generation/IAutoMovieHumanBodyCalibration";
import type { IAutoMovieLoftChain } from "@automovie/engine";
import type { IHumanDebugDocument } from "../../contracts/IHumanDebugDocument";
import type { IHumanDebugPerson } from "../../people/IHumanDebugPerson";
import { HumanDebugChainLoft } from "../HumanDebugChainLoft";
import type { IHumanDebugPiece } from "../IHumanDebugPiece";
import { HumanDebugBodyFixtures } from "./HumanDebugBodyFixtures";

/**
 * The body lane's standalone view parts (#3047 to #3051) lofted alone from
 * fixed inputs (`HumanDebugBodyFixtures`), through the production surface
 * and construction (`HumanDebugChainLoft`), so each part's sections, guides
 * and domes are seen before it is wired into a person:
 *
 * - `trunk`: the trunk base at ANSUR II's female means, closed at the
 *   perineum, open at its top (drawn closed by the loft's lid there, the
 *   cut a part view shows).
 * - `finger`: a made three-phalanx digit as one walk, its joints turned and
 *   its tip a G2 dome.
 * - `limb`: a made two-bone walk with a C2 knee turn.
 *
 * The person is not read: these parts' laws are pending, and the view shows
 * the construction's own behaviour.
 */
export const HumanDebugPieceBodyParts: IHumanDebugPiece = {
  name: "body.parts",
  region: "body",
  description: "The body lane's standalone view parts (trunk base, a digit walk, a limb walk) lofted alone from fixed inputs.",
  arguments: ["trunk", "finger", "limb"],
  build(_person: IHumanDebugPerson, argument: string | null): IHumanDebugDocument {
    const which: string = argument ?? "trunk";
    const result: AutoMovieHumanSiteViewPart.IResult =
      which === "trunk"
        ? AutoMovieHumanTrunkViewPart.create(HumanDebugBodyFixtures.TRUNK)
        : which === "finger"
          ? AutoMovieHumanDigitWalk.create(HumanDebugBodyFixtures.finger())
          : which === "limb"
            ? AutoMovieHumanWalkPart.create(HumanDebugBodyFixtures.limb())
            : ((): never => {
                throw new Error(`body.parts takes trunk, finger or limb, not ${which}`);
              })();
    const chain: IAutoMovieLoftChain | null = result.loft?.chain ?? null;
    if (chain === null) throw new Error(`body.parts:${which} made no chain: ${JSON.stringify(result.diagnostics)}`);
    const calibration: IAutoMovieHumanBodyCalibration = {
      stature: 1628.5,
      chains: [chain],
      events: [],
      poles: [],
      apertures: [],
      eyes: [],
      diagnostics: [...result.diagnostics],
    };
    const document: IHumanDebugDocument = HumanDebugChainLoft.build(calibration, [chain.name]);
    return { ...document, provenance: { ...document.provenance, piece: `body.parts:${which}`, diagnostics: result.diagnostics } };
  },
};
