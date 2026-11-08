import type { IAutoMovieModel, IAutoMovieModelPart } from "@automovie/interface";

import type { AutoMovieHumanArmSegmentFrames } from "../generation/arm/AutoMovieHumanArmSegmentFrames";
import type { CaptureModel } from "../inspection/CaptureModel";
import { HumanInspectionReferenceMesh } from "../inspection/HumanInspectionReferenceMesh";
import { NodeArmReference } from "./NodeArmReference";

type V3 = CaptureModel.Vec3;

/**
 * The reference's left arm as registered triangles for the capture's
 * original stage, diagnostic only. It keeps the arm experiment's selection
 * and registration (`NodeArmReference`: vertices more than 210 mm lateral and
 * above 700 mm, scaled into calibration millimetres, Z negated into the ISB
 * convention, then each reference segment turned onto this chain's segment
 * axis by its own slice-centroid axis) and adds only the triangles whose
 * three vertices are selected, so the reference reads as a surface rather
 * than a point cloud. Nothing here feeds generation.
 */
export namespace NodeCaptureArmReference {
  /** Register the reference arm into `frames`, or say why it is unavailable. */
  export function register(model: IAutoMovieModel, scale: number, frames: AutoMovieHumanArmSegmentFrames.IOutput): CaptureModel.IReference {
    let parts: IAutoMovieModelPart[];
    try {
      parts = HumanInspectionReferenceMesh(model).parts;
    } catch (error: unknown) {
      return { status: "unavailable", cause: `reference artifact refused: ${error instanceof Error ? error.message : String(error)}` };
    }
    const points: V3[] = [];
    const indices: number[] = [];
    for (const part of parts) {
      if (part.geometry.type !== "mesh") continue;
      const p: ArrayLike<number> = part.geometry.mesh.positions;
      const tri: ArrayLike<number> | null = part.geometry.mesh.indices;
      if (tri === null) continue;
      const slot: Int32Array = new Int32Array(p.length / 3).fill(-1);
      for (let i: number = 0; i + 2 < p.length; i += 3) {
        const x: number = p[i]! * 1000 * scale;
        const y: number = p[i + 1]! * 1000 * scale;
        const z: number = p[i + 2]! * 1000 * scale;
        if (z > 210 * scale && y > 700 * scale) {
          slot[i / 3] = points.length;
          points.push([x, y, -z]);
        }
      }
      for (let i: number = 0; i + 2 < tri.length; i += 3) {
        const a: number = slot[tri[i]!]!;
        const b: number = slot[tri[i + 1]!]!;
        const c: number = slot[tri[i + 2]!]!;
        if (a >= 0 && b >= 0 && c >= 0) indices.push(a, b, c);
      }
    }
    const registered: NodeArmReference.IRegistered = NodeArmReference.register(points, frames);
    if (registered.points.length !== points.length || indices.length === 0)
      return { status: "unavailable", cause: `reference arm registration returned ${registered.points.length} of ${points.length} points and ${indices.length / 3} triangles` };
    return {
      status: "available",
      mesh: { positions: registered.points.flat(), indices },
      measures: registered.measures,
      method: "NodeArmReference: arm vertices selected by display box, each reference segment turned onto this chain's segment axis by its slice-centroid axis about the elbow; roll unresolved; diagnostic only",
    };
  }
}
