import type { IHumanDebugDocument } from "../../contracts/IHumanDebugDocument";
import type { IHumanDebugPerson } from "../../people/IHumanDebugPerson";
import { HumanDebugPieceMesh } from "../HumanDebugPieceMesh";
import type { IHumanDebugPiece } from "../IHumanDebugPiece";
import { HumanDebugFootKit } from "./HumanDebugFootKit";

/**
 * `foot.body`: the left foot's body from its sections alone (`AutoMovieHumanFootBody`), without the
 * toes, webs or loft, and the five toes each swept along its own line, as six parts; the body's
 * every tenth station ring is a closed curve of the body part.
 */
export const HumanDebugPieceFootBody: IHumanDebugPiece = {
  name: "foot.body",
  region: "foot",
  description: "Left foot body from its sections and the five toes from their spans, before lofting",
  arguments: [],
  build: (person: IHumanDebugPerson): IHumanDebugDocument => {
    const f: HumanDebugFootKit.IFixed = HumanDebugFootKit.fixed(person);
    const rings: IHumanDebugDocument.Point[][] = HumanDebugFootKit.body(f);
    const body: IHumanDebugDocument.IPart = HumanDebugPieceMesh.part(
      "human.skin.foot.left.body/0",
      HumanDebugPieceMesh.grid(rings, true),
      rings.flatMap((ring: IHumanDebugDocument.Point[], k: number): IHumanDebugDocument.ICurve[] =>
        k % 10 === 0 ? [{ id: "human.construction.foot.left.body/" + k, closed: true, points: ring }] : [],
      ),
    );
    const toes: IHumanDebugDocument.IPart[] = f.centres.lines.map(
      (_: unknown, i: number): IHumanDebugDocument.IPart =>
        HumanDebugPieceMesh.part(
          "human.skin.foot.left.toe" + (i + 1) + "/0",
          HumanDebugPieceMesh.grid(HumanDebugFootKit.toe(f, i), true),
        ),
    );
    return {
      parts: [body, ...toes],
      provenance: { piece: "foot.body", dimensions: f.dimensions, person: person.alias },
    };
  },
};
