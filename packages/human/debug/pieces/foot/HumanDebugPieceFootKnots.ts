import { AutoMovieHumanFootAchilles } from "../../../src/generation/foot/AutoMovieHumanFootAchilles";
import { AutoMovieHumanFootContactLateralBall } from "../../../src/generation/foot/AutoMovieHumanFootContactLateralBall";
import { AutoMovieHumanFootContactLateralHeel } from "../../../src/generation/foot/AutoMovieHumanFootContactLateralHeel";
import { AutoMovieHumanFootContactLateralMidfoot } from "../../../src/generation/foot/AutoMovieHumanFootContactLateralMidfoot";
import { AutoMovieHumanFootContactMedialBall } from "../../../src/generation/foot/AutoMovieHumanFootContactMedialBall";
import { AutoMovieHumanFootContactMedialHeel } from "../../../src/generation/foot/AutoMovieHumanFootContactMedialHeel";
import { AutoMovieHumanFootContactMedialMidfoot } from "../../../src/generation/foot/AutoMovieHumanFootContactMedialMidfoot";
import { AutoMovieHumanFootCrestAnkle } from "../../../src/generation/foot/AutoMovieHumanFootCrestAnkle";
import { AutoMovieHumanFootCrestForefoot } from "../../../src/generation/foot/AutoMovieHumanFootCrestForefoot";
import { AutoMovieHumanFootHeelCorner } from "../../../src/generation/foot/AutoMovieHumanFootHeelCorner";
import { AutoMovieHumanFootLateralColumn } from "../../../src/generation/foot/AutoMovieHumanFootLateralColumn";
import { AutoMovieHumanFootLateralForefoot } from "../../../src/generation/foot/AutoMovieHumanFootLateralForefoot";
import { AutoMovieHumanFootLateralHeel } from "../../../src/generation/foot/AutoMovieHumanFootLateralHeel";
import { AutoMovieHumanFootMedialColumn } from "../../../src/generation/foot/AutoMovieHumanFootMedialColumn";
import { AutoMovieHumanFootMedialForefoot } from "../../../src/generation/foot/AutoMovieHumanFootMedialForefoot";
import { AutoMovieHumanFootMedialNavicular } from "../../../src/generation/foot/AutoMovieHumanFootMedialNavicular";
import type { IHumanDebugDocument } from "../../contracts/IHumanDebugDocument";
import type { IHumanDebugPerson } from "../../people/IHumanDebugPerson";
import { HumanDebugPieceMesh } from "../HumanDebugPieceMesh";
import type { IHumanDebugPiece } from "../IHumanDebugPiece";
import { HumanDebugFootKit } from "./HumanDebugFootKit";

/**
 * `foot.knots`: the knots of every guide region of the left foot, one part per region file.
 *
 * Each part is a 1.5 mm marker at every knot the region's own file returns in the foot frame, with
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
    const regions: [string, IHumanDebugDocument.Point[]][] = [
      ["CrestForefoot", AutoMovieHumanFootCrestForefoot.knots(f.frame)],
      ["CrestAnkle", AutoMovieHumanFootCrestAnkle.knots(f.frame)],
      ["LateralForefoot", AutoMovieHumanFootLateralForefoot.knots(f.frame, f.line)],
      ["LateralHeel", AutoMovieHumanFootLateralHeel.knots(f.frame, f.line)],
      ["LateralColumn", AutoMovieHumanFootLateralColumn.knots(f.frame, f.line)],
      ["MedialForefoot", AutoMovieHumanFootMedialForefoot.knots(f.frame, f.line)],
      ["MedialNavicular", AutoMovieHumanFootMedialNavicular.knots(f.frame, f.line)],
      ["MedialColumn", AutoMovieHumanFootMedialColumn.knots(f.frame, f.line)],
      ["ContactLateralBall", AutoMovieHumanFootContactLateralBall.knots(f.frame)],
      ["ContactLateralMidfoot", AutoMovieHumanFootContactLateralMidfoot.knots(f.frame)],
      ["ContactLateralHeel", AutoMovieHumanFootContactLateralHeel.knots(f.frame)],
      ["ContactMedialBall", AutoMovieHumanFootContactMedialBall.knots(f.frame)],
      ["ContactMedialMidfoot", AutoMovieHumanFootContactMedialMidfoot.knots(f.frame)],
      ["ContactMedialHeel", AutoMovieHumanFootContactMedialHeel.knots(f.frame)],
      ["HeelCornerLateral", AutoMovieHumanFootHeelCorner.knots(f.frame, 1)],
      ["HeelCornerMedial", AutoMovieHumanFootHeelCorner.knots(f.frame, -1)],
      ["AchillesLateral", AutoMovieHumanFootAchilles.knots(f.frame, 1)],
      ["AchillesMedial", AutoMovieHumanFootAchilles.knots(f.frame, -1)],
    ];
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
