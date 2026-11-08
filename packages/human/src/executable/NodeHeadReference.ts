import fs from "node:fs";
import type { IAutoMovieModel } from "@automovie/interface";
import type { AutoMovieHumanHeadFrankfort } from "../generation/head/AutoMovieHumanHeadFrankfort";
import { HumanInspectionReferenceMesh } from "../inspection/HumanInspectionReferenceMesh";
import { HumanNodePaths } from "./HumanNodePaths";

type V3 = [number, number, number];

/**
 * The reference's head for the head view-curve renderer's diagnostic overlay,
 * read and registered into the Frankfort head frame for comparison only;
 * nothing here feeds generation.
 */
export namespace NodeHeadReference {
  /** The registered points and the registration's own measurements. */
  export interface IRegistered {
    /** Reference vertices in the head frame, mm. */
    points: V3[];

    /** Measurements of the registration and of the reference head, mm. */
    measures: Record<string, number>;
  }

  /**
   * The reference's vertices above `floor` in world mm with Z to the
   * subject's right (the native artifact is metres, +X forward, +Y up, +Z
   * anatomical left). A display selection, not a measurement.
   */
  export function load(floor: number): V3[] {
    const model: IAutoMovieModel = JSON.parse(fs.readFileSync(HumanNodePaths.resolve("test/.shots/f1/reference-model.json"), "utf8"));
    const out: V3[] = [];
    for (const part of HumanInspectionReferenceMesh(model).parts) {
      if (part.geometry.type !== "mesh") continue;
      const p: ArrayLike<number> = part.geometry.mesh.positions;
      for (let i: number = 0; i + 2 < p.length; i += 3) {
        const y: number = p[i + 1]! * 1000;
        // Within 140 mm of the midsagittal plane: the head and neck without the shoulders.
        if (y > floor && Math.abs(p[i + 2]! * 1000) < 140) out.push([p[i]! * 1000, y, -p[i + 2]! * 1000]);
      }
    }
    return out;
  }

  /**
   * Diagnostic registration by the reference head's own extremes, translation
   * only (the reference's FH tilt is unresolved and recorded as such): its
   * vertex (highest point) onto this head's vertex height; its lateral centre
   * (midpoint of the extreme half breadths within 10 mm of 0.6 of this head's
   * tragion-vertex height, clear of the ears) onto Z = 0; and its sagittal
   * g-op midpoint (front and back
   * extremes of the midsagittal band |Z| < 6 mm within 4 mm of this head's
   * glabella height) onto the midpoint of this head's g and op. Because the
   * AP shift reads this head's own g and op places, an AP error of those
   * places is hidden in the overlay; the measures record the reference's own
   * lengths for comparison with the inputs.
   */
  export function register(points: V3[], head: AutoMovieHumanHeadFrankfort.IOutput): IRegistered {
    if (points.length < 100) return { points: [], measures: {} };
    const P: Record<AutoMovieHumanHeadFrankfort.Name, V3> = head.points;
    const top: number = points.reduce((m: number, p: V3): number => Math.max(m, p[1]), -Infinity);
    const dy: number = P.v[1] - top;
    const near: (y: number, band: number) => V3[] = (y: number, band: number): V3[] => points.filter((p: V3): boolean => Math.abs(p[1] + dy - y) < band);
    // The lateral centre is read on a band clear of the ears (0.6 of the tragion-vertex height).
    const euBand: V3[] = near(0.6 * P.v[1], 10);
    const zMax: number = Math.max(...euBand.map((p: V3): number => p[2]));
    const zMin: number = Math.min(...euBand.map((p: V3): number => p[2]));
    const dz: number = -(zMax + zMin) / 2;
    const gBand: V3[] = near(P.g[1], 4).filter((p: V3): boolean => Math.abs(p[2] + dz) < 6);
    const xMax: number = Math.max(...gBand.map((p: V3): number => p[0]));
    const xMin: number = Math.min(...gBand.map((p: V3): number => p[0]));
    const dx: number = (P.g[0] + P.op[0]) / 2 - (xMax + xMin) / 2;
    const placed: V3[] = points.map((p: V3): V3 => [p[0] + dx, p[1] + dy, p[2] + dz]);
    const lowest: number = placed.filter((p: V3): boolean => p[0] > 40 && Math.abs(p[2]) < 10).reduce((m: number, p: V3): number => Math.min(m, p[1]), Infinity);
    const breadth: number = placed.filter((p: V3): boolean => p[1] > 0).reduce((m: number, p: V3): number => Math.max(m, Math.abs(p[2])), 0) * 2;
    return {
      points: placed,
      measures: {
        shiftX: dx,
        shiftY: dy,
        shiftZ: dz,
        referenceGOpAtGlabellaHeight: xMax - xMin,
        inputGOp: head.dims.length,
        referenceBreadthAboveFH: breadth,
        inputEuEu: head.dims.breadth,
        referenceEuBandBreadth: zMax - zMin,
        referenceVertexHeightWorld: top,
        referenceLowestFrontMidlineY: lowest,
        modelMentonY: P.me[1],
      },
    };
  }

  /**
   * The reference's points in the head frame by the newest `node:head-measure`
   * receipt's own Frankfort frame (origin the tragia's midpoint, its FH axes,
   * all in the native frame), so the overlay compares like with like; null
   * without a receipt. Diagnostic only.
   */
  export function frankfort(points: V3[]): IRegistered | null {
    const dir: string = HumanNodePaths.resolve("packages/human/.shots/f1_head");
    const receipts: string[] = fs.existsSync(dir) ? fs.readdirSync(dir).filter((name: string): boolean => name.startsWith("measure-")).sort((a: string, b: string): number => a.localeCompare(b)) : [];
    const newest: string | undefined = receipts[receipts.length - 1];
    if (newest === undefined) return null;
    const receipt: { frame: { origin: V3; X: V3; Y: V3; Z: V3 } } = JSON.parse(fs.readFileSync(`${dir}/${newest}/head.json`, "utf8"));
    const { origin, X, Y, Z } = receipt.frame;
    const dot: (a: V3, b: V3) => number = (a: V3, b: V3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    // The loaded points carry Z negated (to the subject's right); the receipt's frame is in the native frame.
    const out: V3[] = points.map((p: V3): V3 => {
      const d: V3 = [p[0] - origin[0], p[1] - origin[1], -p[2] - origin[2]];
      return [dot(d, X), dot(d, Y), dot(d, Z)];
    });
    return { points: out, measures: { receiptFrameOriginY: origin[1] } };
  }

  /**
   * The reference's points in her own upright frame, her tragia's midpoint
   * (the newest receipt's origin) at the origin and her native axes kept
   * (+X forward, +Y up, +Z right): the registration of her neck by its own
   * segment axes (her trunk stands upright), where the Frankfort
   * registration reads her head's 5.5 degree pitch as a rotation of her
   * neck. The model stands with FH level, so its head frame is upright here.
   * Null without a receipt. Diagnostic only.
   */
  export function upright(points: V3[]): IRegistered | null {
    const dir: string = HumanNodePaths.resolve("packages/human/.shots/f1_head");
    const receipts: string[] = fs.existsSync(dir) ? fs.readdirSync(dir).filter((name: string): boolean => name.startsWith("measure-")).sort((a: string, b: string): number => a.localeCompare(b)) : [];
    const newest: string | undefined = receipts[receipts.length - 1];
    if (newest === undefined) return null;
    const origin: V3 = (JSON.parse(fs.readFileSync(`${dir}/${newest}/head.json`, "utf8")) as { frame: { origin: V3 } }).frame.origin;
    // The loaded points carry Z negated; the receipt's origin and axes are native, so the native point is (x, y, -z), as `frankfort` reads it: her upright frame is that native point less the origin, the Frankfort registration's frame before its rotation (`AutoMovieHumanHeadF1Pose`).
    return { points: points.map((p: V3): V3 => [p[0] - origin[0], p[1] - origin[1], -p[2] - origin[2]]), measures: { receiptFrameOriginY: origin[1] } };
  }
}
