import type { IHumanDebugDocument } from "../contracts/IHumanDebugDocument";
import type { IHumanDebugPerson } from "../people/IHumanDebugPerson";
import { HumanDebugChainLoft } from "./HumanDebugChainLoft";
import type { IHumanDebugPiece } from "./IHumanDebugPiece";

/**
 * `chains:<globs>`: any chains of the person lofted alone, such as `chains:leg.left` or
 * `chains:arm.left,hand.left.*,finger.left.*,thumb.left`.
 *
 * The argument is a comma list of globs over whole chain names, lofted by `HumanDebugChainLoft`
 * from the person's calibration by the current source.
 */
export const HumanDebugPieceChains: IHumanDebugPiece = {
  name: "chains",
  region: "body",
  description: "Named chains of the person lofted alone from the current source's calibration",
  arguments: [],
  build: (person: IHumanDebugPerson, argument: string | null): IHumanDebugDocument => {
    if (argument === null || argument === "")
      throw new Error("Name the chains: piece=chains:<glob>,<glob>");
    const document: IHumanDebugDocument = HumanDebugChainLoft.build(
      person.calibration(),
      argument.split(","),
    );
    return {
      parts: document.parts,
      provenance: { ...document.provenance, piece: "chains:" + argument, person: person.alias },
    };
  },
};
