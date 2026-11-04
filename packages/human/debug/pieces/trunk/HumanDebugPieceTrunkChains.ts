import type { IAutoMovieHumanBodyCalibration } from "../../../src/generation/IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanLoftChain } from "../../../src/lofting/IAutoMovieHumanLoftChain";
import type { IHumanDebugDocument } from "../../contracts/IHumanDebugDocument";
import type { IHumanDebugPerson } from "../../people/IHumanDebugPerson";
import { HumanDebugChainLoft } from "../HumanDebugChainLoft";
import type { IHumanDebugPiece } from "../IHumanDebugPiece";
import { HumanDebugTrunkKit } from "./HumanDebugTrunkKit";

/**
 * `trunk.chains`, `trunk.chains:trunk`, `trunk.chains:upper`: the trunk's two chains as the trunk
 * solve alone builds them (`HumanDebugTrunkKit`), lofted alone by `HumanDebugChainLoft`.
 *
 * The person's calibration lends its other records (stature, events, poles); its own `trunk` and
 * `upper` are replaced by the kit's, so the document shows what the trunk's pieces make from the
 * person's inputs without the rest of the body's construction. Without an argument both chains
 * loft together and meet at the axilla vault; the crotch and, for `upper` alone, the vault close
 * as flat lids because their neighbours are cut away.
 */
export const HumanDebugPieceTrunkChains: IHumanDebugPiece = {
  name: "trunk.chains",
  region: "trunk",
  description: "Trunk and upper chains built by the trunk solve alone from the person's inputs, lofted alone",
  arguments: ["trunk", "upper"],
  build: (person: IHumanDebugPerson, argument: string | null): IHumanDebugDocument => {
    if (argument !== null && argument !== "trunk" && argument !== "upper")
      throw new Error("trunk.chains takes trunk, upper or no argument; got " + argument);
    const kit: HumanDebugTrunkKit.IFixed = HumanDebugTrunkKit.of(person);
    const calibration: IAutoMovieHumanBodyCalibration = person.calibration();
    const others: IAutoMovieHumanLoftChain[] = calibration.chains.filter(
      (c: IAutoMovieHumanLoftChain): boolean => c.name !== "trunk" && c.name !== "upper",
    );
    const document: IHumanDebugDocument = HumanDebugChainLoft.build(
      { ...calibration, chains: [...kit.chains, ...others] },
      argument === null ? ["trunk", "upper"] : [argument],
    );
    return {
      parts: document.parts,
      provenance: {
        ...document.provenance,
        piece: "trunk.chains" + (argument === null ? "" : ":" + argument),
        person: person.alias,
        layers: Object.fromEntries(
          kit.chains.map((c: IAutoMovieHumanLoftChain): [string, number] => [c.name, c.layers.length]),
        ),
        samples: kit.chains[0].samples,
        solveMilliseconds: kit.milliseconds,
      },
    };
  },
};
