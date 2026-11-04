import type { IAutoMovieModel } from "@automovie/interface";

import type { IHumanDebugDocument } from "../contracts/IHumanDebugDocument";

/**
 * Admit a component document and convert its millimetre coordinates to viewer metres.
 *
 * Admission lists every malformed id, coordinate, triangle and curve before anything is allocated,
 * so a broken piece names all its faults at once. A `local-mm` part is placed by its frame once;
 * a `body-mm` part never receives a frame. Nothing is generated, closed or repaired here.
 */
export namespace HumanDebugDocumentModel {
  /**
   * Every fault of a document.
   *
   * @param parts The document's parts.
   * @returns One line per fault; empty when the document is admitted.
   */
  export function inspect(parts: readonly IHumanDebugDocument.IPart[]): string[] {
    const issues: string[] = [];
    const ids: Set<string> = new Set();
    const finite: (p: readonly number[]) => boolean = (p: readonly number[]): boolean =>
      p.length === 3 && p.every(Number.isFinite);
    if (parts.length === 0) issues.push("parts: the document has no part");
    for (const part of parts) {
      if (!/^human\.skin\.[A-Za-z0-9_.-]+\/\d+$/.test(part.id) || ids.has(part.id))
        issues.push(part.id + ": part ids are unique human.skin.<chain>/<k>");
      ids.add(part.id);
      if (part.points.length < 3 || !part.points.every(finite))
        issues.push(part.id + ".points: at least three finite triples");
      if (part.normals !== undefined && (part.normals.length !== part.points.length || !part.normals.every(finite)))
        issues.push(part.id + ".normals: one finite triple per vertex");
      if (
        part.indices.length === 0 ||
        part.indices.length % 3 !== 0 ||
        part.indices.some((index: number): boolean => !Number.isInteger(index) || index < 0 || index >= part.points.length)
      )
        issues.push(part.id + ".indices: triangles over the part's vertices");
      const chain: string = part.id.slice("human.skin.".length, part.id.lastIndexOf("/"));
      for (const curve of part.curves) {
        if (!curve.id.startsWith("human.construction." + chain + "/") || ids.has(curve.id))
          issues.push(curve.id + ": curve ids are unique and owned by the part's chain " + chain);
        ids.add(curve.id);
        if (curve.points.length < (curve.closed ? 3 : 2) || !curve.points.every(finite))
          issues.push(curve.id + ": enough finite ordered points");
      }
    }
    return issues;
  }

  /**
   * The engine model and curves of an admitted document, in metres.
   *
   * @param document The document.
   * @returns The model with no skeleton or materials, and the curves; a malformed document throws with every fault.
   */
  export function assemble(document: IHumanDebugDocument): {
    model: IAutoMovieModel;
    curves: IHumanDebugDocument.ICurve[];
  } {
    const issues: string[] = inspect(document.parts);
    if (issues.length !== 0) throw new Error("Malformed piece document:\n" + issues.join("\n"));
    const model: IAutoMovieModel = {
      id: "human.debug.piece",
      name: "Human piece",
      origin: "generated",
      skeleton: null,
      body: null,
      asset: null,
      materials: [],
      parts: [],
    };
    const curves: IHumanDebugDocument.ICurve[] = [];
    for (const part of document.parts) {
      model.parts.push({
        id: part.id,
        name: part.id,
        attachedBone: null,
        material: null,
        transform: null,
        geometry: {
          type: "mesh",
          mesh: {
            positions: part.points.flatMap((p: IHumanDebugDocument.Point): number[] => metres(part, p)),
            indices: [...part.indices],
            normals: part.normals?.flatMap((n: IHumanDebugDocument.Point): number[] => direction(part, n)) ?? null,
            uvs: null,
            skin: null,
          },
        },
      });
      for (const curve of part.curves)
        curves.push({
          ...curve,
          points: curve.points.map((p: IHumanDebugDocument.Point): IHumanDebugDocument.Point => metres(part, p)),
        });
    }
    return { model, curves };
  }

  /** A point placed by the part's frame when local, then converted from mm to metres. */
  function metres(part: IHumanDebugDocument.IPart, p: IHumanDebugDocument.Point): IHumanDebugDocument.Point {
    if (part.space === "body-mm") return [p[0] / 1000, p[1] / 1000, p[2] / 1000];
    const f: IHumanDebugDocument.IFrame = part.frame;
    return [0, 1, 2].map(
      (k: number): number => (f.origin[k]! + p[0] * f.forward[k]! + p[1] * f.up[k]! + p[2] * f.left[k]!) / 1000,
    ) as IHumanDebugDocument.Point;
  }

  /** A direction rotated by the part's frame when local; normals take no translation or scale. */
  function direction(part: IHumanDebugDocument.IPart, n: IHumanDebugDocument.Point): IHumanDebugDocument.Point {
    if (part.space === "body-mm") return [n[0], n[1], n[2]];
    const f: IHumanDebugDocument.IFrame = part.frame;
    return [0, 1, 2].map(
      (k: number): number => n[0] * f.forward[k]! + n[1] * f.up[k]! + n[2] * f.left[k]!,
    ) as IHumanDebugDocument.Point;
  }
}
