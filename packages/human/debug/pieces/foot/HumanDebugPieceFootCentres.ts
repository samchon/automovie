import type { IHumanDebugDocument } from "../../contracts/IHumanDebugDocument";
import type { IHumanDebugPerson } from "../../people/IHumanDebugPerson";
import { HumanDebugPieceMesh } from "../HumanDebugPieceMesh";
import type { IHumanDebugPiece } from "../IHumanDebugPiece";
import { HumanDebugFootKit } from "./HumanDebugFootKit";

/**
 * `foot.centres`: the left foot's centres from `AutoMovieHumanFootBones` as 2.5 mm markers in three
 * parts: the ankle centre with both malleoli, the metatarsal heads with the ball, and every toe
 * joint, with each toe's joints also one curve from its head to its tip.
 */
export const HumanDebugPieceFootCentres: IHumanDebugPiece = {
  name: "foot.centres",
  region: "foot",
  description: "Left foot centres: ankle and malleoli, metatarsal heads and ball, toe joints",
  arguments: [],
  build: (person: IHumanDebugPerson): IHumanDebugDocument => {
    const f: HumanDebugFootKit.IFixed = HumanDebugFootKit.fixed(person);
    const b: HumanDebugFootKit.IFixed["centres"]["bones"] = f.centres.bones;
    const toes: IHumanDebugDocument.Point[][] = b.toes.map(
      (joints: IHumanDebugDocument.Point[]): IHumanDebugDocument.Point[] =>
        joints.map((p: IHumanDebugDocument.Point): IHumanDebugDocument.Point => [p[0], p[1], p[2]]),
    );
    return {
      parts: [
        HumanDebugPieceMesh.part(
          "human.skin.foot.left.centres.ankle/0",
          HumanDebugPieceMesh.markers([b.ankle, b.malleoli.lateral, b.malleoli.medial], 2.5),
        ),
        HumanDebugPieceMesh.part(
          "human.skin.foot.left.centres.heads/0",
          HumanDebugPieceMesh.markers([...b.heads, b.ball], 2.5),
        ),
        HumanDebugPieceMesh.part(
          "human.skin.foot.left.centres.joints/0",
          HumanDebugPieceMesh.markers(toes.flat(), 2.5),
          toes.flatMap((joints: IHumanDebugDocument.Point[], i: number): IHumanDebugDocument.ICurve[] =>
            joints.length < 2
              ? []
              : [{ id: "human.construction.foot.left.centres.joints/toe" + (i + 1), closed: false, points: joints }],
          ),
        ),
      ],
      provenance: { piece: "foot.centres", dimensions: f.dimensions, person: person.alias },
    };
  },
};
