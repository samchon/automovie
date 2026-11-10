import { AutoMovieHumanF1Body } from "../../src/generation/AutoMovieHumanF1Body";
import type { AutoMovieHumanF1BodyAssembly } from "../../src/generation/AutoMovieHumanF1BodyAssembly";
import type { IHumanDebugDocument } from "../contracts/IHumanDebugDocument";
import type { IHumanDebugPerson } from "../people/IHumanDebugPerson";
import type { IHumanDebugPiece } from "./IHumanDebugPiece";

/**
 * The public no-argument F1 realization through the existing hardware viewer.
 * Select `person=f1&piece=f1.fixed`; the ordinary parameter-driven subject is
 * a separate route. Generation errors propagate to the page and capture route.
 * The producer owns absolute ISB millimetres, with +Z right. This adapter
 * reflects Z once into the document's +Z-left body frame and reverses each
 * display triangle for that reflection. The ordinary document adapter then
 * converts millimetres to metres and the existing viewer derives normals.
 * No reference acquisition, CPU renderer, fallback skin or additional fitting is used.
 */
export const HumanDebugPieceF1Body: IHumanDebugPiece = {
  name: "f1.fixed",
  region: "body",
  description: "The public fixed-coordinate F1 body, generated without reference files and displayed through the ordinary mesh viewer.",
  arguments: [],

  /** Generate once and retain the public skin and exact seam facts for inspection. */
  build(person: IHumanDebugPerson, argument: string | null): IHumanDebugDocument {
    if (person.alias !== "f1" || argument !== null)
      throw new Error("f1.fixed takes person=f1 and no piece argument");
    const started: number = performance.now();
    const body: AutoMovieHumanF1BodyAssembly.IFixed = AutoMovieHumanF1Body.create();
    const generationMs: number = performance.now() - started;
    const points: IHumanDebugDocument.Point[] = [];
    for (let i: number = 0; i < body.mesh.positions.length; i += 3)
      points.push([body.mesh.positions[i]!, body.mesh.positions[i + 1]!, -body.mesh.positions[i + 2]!]);

    // Reflection reverses orientation; change only the displayed index copy.
    const indices: number[] = [];
    for (let i: number = 0; i < body.mesh.indices.length; i += 3)
      indices.push(body.mesh.indices[i]!, body.mesh.indices[i + 2]!, body.mesh.indices[i + 1]!);
    return {
      parts: [{
        id: "human.skin.f1.fixed/0",
        space: "body-mm",
        frame: { origin: [0, 0, 0], forward: [1, 0, 0], up: [0, 1, 0], left: [0, 0, 1] },
        points,
        indices,
        curves: [],
      }],
      provenance: {
        piece: "f1.fixed",
        person: person.alias,
        producer: "AutoMovieHumanF1Body.create()",
        stage: "fixed-coordinate public F1 realization",
        generationMs,
        milliseconds: body.milliseconds,
        sources: body.sources,
        seams: body.seams,
        skin: body.skin,
        display: "ISB world mm to body mm by one Z reflection and corresponding display winding; document assembly converts to metres",
        curves: "surface-only observation; generating curves are not included in this adapter",
      },
    };
  },
};
