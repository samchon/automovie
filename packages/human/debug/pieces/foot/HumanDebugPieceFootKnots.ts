import { AutoMovieHumanFootKnots } from "../../../src/generation/foot/AutoMovieHumanFootKnots";
import type { IHumanDebugDocument } from "../../contracts/IHumanDebugDocument";
import type { IHumanDebugPerson } from "../../people/IHumanDebugPerson";
import { HumanDebugPieceMesh } from "../HumanDebugPieceMesh";
import type { IHumanDebugPiece } from "../IHumanDebugPiece";
import { HumanDebugFootKit } from "./HumanDebugFootKit";

/**
 * `foot.knots`: the knots of every guide region of the left foot, one part per region of `AutoMovieHumanFootKnots`.
 *
 * Each part is a 1.5 mm marker at every knot `AutoMovieHumanFootKnots.knots` returns for the region in the foot frame, with
 * the knots joined in order as one curve, so a region shows alone and its knot order reads. The
 * heel corner and the Achilles region are drawn for both sides (lateral +1, medial -1).
 */
export const HumanDebugPieceFootKnots: IHumanDebugPiece = {
  name: "foot.knots",
  region: "foot",
  description: "Left foot guide-region knots, one part per region, from the person's foot dimensions",
  arguments: [],
  build: (person: IHumanDebugPerson): IHumanDebugDocument => {
    const f: HumanDebugFootKit.IFixed = HumanDebugFootKit.fixed(person);
    const regions: [string, IHumanDebugDocument.Point[]][] = Object.values(AutoMovieHumanFootKnots.GUIDES)
      .flat()
      .map((r: AutoMovieHumanFootKnots.Region): [string, IHumanDebugDocument.Point[]] => [
        r[0]!.toUpperCase() + r.slice(1),
        AutoMovieHumanFootKnots.knots(r, f.frame, f.line),
      ]);
    return {
      parts: regions.map(([name, knots]: [string, IHumanDebugDocument.Point[]]): IHumanDebugDocument.IPart => {
        const chain: string = "foot.left.knots." + name;
        return HumanDebugPieceMesh.part(
          "human.skin." + chain + "/0",
          HumanDebugPieceMesh.markers(knots, 1.5),
          knots.length < 2 ? [] : [{ id: "human.construction." + chain + "/knots", closed: false, points: knots }],
        );
      }),
      provenance: { piece: "foot.knots", dimensions: f.dimensions, person: person.alias },
    };
  },
};
