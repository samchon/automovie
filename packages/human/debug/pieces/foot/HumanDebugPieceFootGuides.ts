import type { AutoMovieHumanFootGuide } from "../../../src/generation/foot/AutoMovieHumanFootGuide";
import type { IHumanDebugDocument } from "../../contracts/IHumanDebugDocument";
import type { IHumanDebugPerson } from "../../people/IHumanDebugPerson";
import { HumanDebugPieceMesh } from "../HumanDebugPieceMesh";
import type { IHumanDebugPiece } from "../IHumanDebugPiece";
import { HumanDebugFootKit } from "./HumanDebugFootKit";

/**
 * `foot.guides`: the left foot's five guides, one part each: a 1.2 mm horizontal ribbon along the
 * guide sampled at 161 stations from the web ring to the ankle ring, carrying the same samples as
 * its curve. The guide names are the keys of the foot body's own guide record.
 */
export const HumanDebugPieceFootGuides: IHumanDebugPiece = {
  name: "foot.guides",
  region: "foot",
  description: "Left foot's five guides as ribbons and curves over the fan's stations",
  arguments: [],
  build: (person: IHumanDebugPerson): IHumanDebugDocument => {
    const f: HumanDebugFootKit.IFixed = HumanDebugFootKit.fixed(person);
    return {
      parts: Object.entries(f.guides).map(
        ([name, guide]: [string, AutoMovieHumanFootGuide.IGuide]): IHumanDebugDocument.IPart => {
          const line: IHumanDebugDocument.Point[] = HumanDebugFootKit.guide(f, guide);
          const chain: string = "foot.left.guide." + name;
          return HumanDebugPieceMesh.part(
            "human.skin." + chain + "/0",
            HumanDebugPieceMesh.ribbon(line, [0, 1, 0], 1.2),
            [{ id: "human.construction." + chain + "/g0", closed: false, points: line }],
          );
        },
      ),
      provenance: { piece: "foot.guides", dimensions: f.dimensions, person: person.alias },
    };
  },
};
