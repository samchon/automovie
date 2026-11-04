import type { IHumanDebugDocument } from "../../contracts/IHumanDebugDocument";
import type { IHumanDebugPerson } from "../../people/IHumanDebugPerson";
import { HumanDebugPieceMesh } from "../HumanDebugPieceMesh";
import type { IHumanDebugPiece } from "../IHumanDebugPiece";
import { HumanDebugFootKit } from "./HumanDebugFootKit";

/**
 * `foot.arcs`: the left foot's five section pieces (dorsal-lateral, lateral border, sole contact,
 * medial arch, dorsal-medial), each swept alone over 81 stations between its two guide jets, one
 * part each; every tenth station's arc is a curve of its part.
 */
export const HumanDebugPieceFootArcs: IHumanDebugPiece = {
  name: "foot.arcs",
  region: "foot",
  description: "Left foot's five section pieces, each swept alone between its two guides",
  arguments: [],
  build: (person: IHumanDebugPerson): IHumanDebugDocument => {
    const f: HumanDebugFootKit.IFixed = HumanDebugFootKit.fixed(person);
    const arcs: HumanDebugFootKit.Arc[] = ["dorsalLateral", "lateralPlantar", "sole", "arch", "dorsalMedial"];
    return {
      parts: arcs.map((arc: HumanDebugFootKit.Arc): IHumanDebugDocument.IPart => {
        const rows: IHumanDebugDocument.Point[][] = HumanDebugFootKit.sweep(f, arc);
        const chain: string = "foot.left.arc." + arc;
        return HumanDebugPieceMesh.part(
          "human.skin." + chain + "/0",
          HumanDebugPieceMesh.grid(rows, false),
          rows.flatMap((row: IHumanDebugDocument.Point[], k: number): IHumanDebugDocument.ICurve[] =>
            k % 10 === 0 ? [{ id: "human.construction." + chain + "/" + k, closed: false, points: row }] : [],
          ),
        );
      }),
      provenance: { piece: "foot.arcs", dimensions: f.dimensions, person: person.alias },
    };
  },
};
