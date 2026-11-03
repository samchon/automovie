import type { IAutoMovieModel } from "@automovie/interface";

/**
 * Admit real independently emitted patches and convert their declared millimetre
 * coordinates to viewer metres. Body-space output never receives its local frame
 * twice. This adapter does not generate, calibrate, close or repair a surface.
 */
export class HumanComponentModel {
  /** Collect every malformed address, coordinate, triangle and shared-boundary fact before allocating scene resources. */
  public static inspect(parts: readonly HumanComponentModel.IPart[]): HumanComponentModel.IIssue[] {
    const issues: HumanComponentModel.IIssue[] = [];
    const ids: Set<string> = new Set();
    if (parts.length === 0) issues.push({ path: "parts", reason: "At least one actual emitted patch is required" });
    for (const part of parts) {
      const issue: (path: string, reason: string) => void = (path: string, reason: string): void => { issues.push({ path: part.id + "." + path, reason }); };
      if (!/^human\.skin\.[a-zA-Z0-9_.-]+\/\d+$/.test(part.id) || ids.has(part.id)) issue("id", "Patch identities must be unique skin interval paths");
      ids.add(part.id);
      if (part.space !== "body-mm" && part.space !== "local-mm") issue("space", "Coordinates must explicitly name body-mm or local-mm");
      const axes: HumanComponentModel.Point[] = [part.frame.forward, part.frame.up, part.frame.left];
      const finite: (p: readonly number[]) => boolean = (p: readonly number[]): boolean => p.length === 3 && p.every((n: number): boolean => Number.isFinite(n) && Number.isFinite(Math.fround(n / 1000)));
      if (!finite(part.frame.origin) || axes.some((p: HumanComponentModel.Point): boolean => !finite(p))) issue("frame", "Frame coordinates must be finite triples");
      else {
        const dot: (a: HumanComponentModel.Point, b: HumanComponentModel.Point) => number = (a: HumanComponentModel.Point, b: HumanComponentModel.Point): number => a.reduce((sum: number, n: number, k: number): number => sum + n * b[k]!, 0);
        const cross: HumanComponentModel.Point = [axes[0]![1] * axes[1]![2] - axes[0]![2] * axes[1]![1], axes[0]![2] * axes[1]![0] - axes[0]![0] * axes[1]![2], axes[0]![0] * axes[1]![1] - axes[0]![1] * axes[1]![0]];
        if (axes.some((p: HumanComponentModel.Point): boolean => Math.abs(dot(p, p) - 1) > 1e-12) || Math.abs(dot(axes[0]!, axes[1]!)) > 1e-12 || Math.abs(dot(axes[0]!, axes[2]!)) > 1e-12 || Math.abs(dot(axes[1]!, axes[2]!)) > 1e-12 || Math.abs(dot(cross, axes[2]!) - 1) > 1e-12) issue("frame", "Frame axes must be right-handed and orthonormal");
      }
      if (part.points.length < 3 || part.points.some((p: HumanComponentModel.Point): boolean => !finite(p))) issue("points", "Actual mesh needs at least three finite vertex triples");
      else if (part.points.some((p: HumanComponentModel.Point): boolean => !HumanComponentModel.metres(part, p).every((n: number): boolean => Number.isFinite(n) && Number.isFinite(Math.fround(n))))) issue("points", "Placed metre coordinates must remain finite and float32-representable");
      if (part.normals !== undefined && (part.normals.length !== part.points.length || part.normals.some((normal: HumanComponentModel.Point): boolean => normal.length !== 3 || !normal.every(Number.isFinite) || !HumanComponentModel.normal(part, normal).every((n: number): boolean => Number.isFinite(Math.fround(n))) || Math.hypot(...HumanComponentModel.normal(part, normal).map(Math.fround)) === 0))) issue("normals", "Supplied source normals need one finite nonzero float32-representable dimensionless triple per vertex");
      if (part.indices.length === 0 || part.indices.length % 3 !== 0 || part.indices.some((index: number): boolean => !Number.isInteger(index) || index < 0 || index >= part.points.length)) issue("indices", "Triangles must reference admitted source vertices");
      const chain: string = part.id.slice("human.skin.".length, part.id.lastIndexOf("/"));
      for (const curve of part.curves) {
        if (!curve.id.startsWith("human.construction." + chain + "/") || ids.has(curve.id)) issue(curve.id, "Construction identities must be unique and owned by this patch chain");
        ids.add(curve.id);
        if (curve.points.length < (curve.closed ? 3 : 2) || curve.points.some((p: HumanComponentModel.Point): boolean => !finite(p))) issue(curve.id, "Actual source curves need enough finite ordered points");
        if (curve.boundary !== undefined) {
          if (!curve.boundary.owner || curve.boundary.vertices.length !== curve.points.length) issue(curve.id, "Boundary needs its source owner and one mesh address per point");
          else curve.boundary.vertices.forEach((index: number, k: number): void => {
            const point: HumanComponentModel.Point | undefined = part.points[index];
            if (!Number.isInteger(index) || point === undefined || point.some((n: number, axis: number): boolean => n !== curve.points[k]![axis])) issue(curve.id + "/" + k, "Boundary point must equal its declared emitted mesh vertex");
          });
        }
      }
    }
    return issues;
  }

  /** Build a static semantic model and the same source curves, preserving source buffers and triangle order. */
  public static assemble(parts: readonly HumanComponentModel.IPart[]): HumanComponentModel.IResult {
    const issues: HumanComponentModel.IIssue[] = HumanComponentModel.inspect(parts);
    if (issues.length !== 0) throw new Error(JSON.stringify(issues));
    const curves: HumanComponentModel.ICurve[] = [];
    const bounds: Map<string, HumanComponentModel.IBounds> = new Map();
    const model: IAutoMovieModel = { id: "human.components", name: "Human components", origin: "generated", skeleton: null, body: null, asset: null, materials: [], parts: [] };
    for (const part of parts) {
      const points: HumanComponentModel.Point[] = part.points.map((p: HumanComponentModel.Point): HumanComponentModel.Point => HumanComponentModel.metres(part, p));
      const box: HumanComponentModel.IBounds = { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] };
      for (const p of points) for (let k: number = 0; k < 3; k++) { box.min[k] = Math.min(box.min[k]!, p[k]!); box.max[k] = Math.max(box.max[k]!, p[k]!); }
      bounds.set(part.id, box);
      const normals: number[] | null = part.normals?.map((normal: HumanComponentModel.Point): HumanComponentModel.Point => HumanComponentModel.normal(part, normal)).flat() ?? null;
      model.parts.push({ id: part.id, name: part.id, attachedBone: null, material: null, transform: null, geometry: { type: "mesh", mesh: { positions: points.flat(), indices: [...part.indices], normals, uvs: null, skin: null } } });
      for (const curve of part.curves) curves.push({ ...curve, points: curve.points.map((p: HumanComponentModel.Point): HumanComponentModel.Point => HumanComponentModel.metres(part, p)) });
    }
    return { model, curves, bounds };
  }

  /** Select actual component bounds by exact mesh identity; unmatched identities refuse instead of framing a whole person. */
  public static selection(result: HumanComponentModel.IResult, ids: readonly string[]): HumanComponentModel.IBounds {
    if (ids.length === 0) throw new Error("Select at least one emitted component");
    const out: HumanComponentModel.IBounds = { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] };
    for (const id of ids) {
      const box: HumanComponentModel.IBounds | undefined = result.bounds.get(id);
      if (box === undefined) throw new Error("Unknown emitted component " + id);
      for (let k: number = 0; k < 3; k++) { out.min[k] = Math.min(out.min[k]!, box.min[k]!); out.max[k] = Math.max(out.max[k]!, box.max[k]!); }
    }
    return out;
  }

  /** Apply a producer's local placement only to explicitly local output, then convert millimetres once. */
  private static metres(part: HumanComponentModel.IPart, point: HumanComponentModel.Point): HumanComponentModel.Point {
    return point.map((n: number, k: number): number => (part.space === "body-mm" ? n : part.frame.origin[k]! + point[0] * part.frame.forward[k]! + point[1] * part.frame.up[k]! + point[2] * part.frame.left[k]!) / 1000) as HumanComponentModel.Point;
  }

  /** Rotate an original direction once; normals receive neither translation nor millimetre scaling. */
  private static normal(part: HumanComponentModel.IPart, normal: HumanComponentModel.Point): HumanComponentModel.Point {
    return part.space === "body-mm" ? [...normal] : normal.map((_: number, axis: number): number => normal[0] * part.frame.forward[axis]! + normal[1] * part.frame.up[axis]! + normal[2] * part.frame.left[axis]!) as HumanComponentModel.Point;
  }
}

/** Explicit producer-to-development-view boundary; no whole-person result or rig is fabricated. */
export namespace HumanComponentModel {
  /** Three coordinates in the unit stated by their owner. */
  export type Point = [number, number, number];
  /** Actual part placement in body millimetres with right-handed unit axes. */
  export interface IFrame {
    /** Body origin, mm. */
    origin: Point;
    /** Forward axis. */
    forward: Point;
    /** Up axis. */
    up: Point;
    /** Left axis. */
    left: Point;
  }
  /** Ordered points emitted from the actual generating curve. */
  export interface ICurve {
    /** Stable producer identity. */
    id: string;
    /** Periodic closure is explicit. */
    closed: boolean;
    /** Same coordinate space as the mesh. */
    points: Point[];
    /** Shared connection identity, when this curve is a mesh boundary. */
    boundary?: {
      /** Actual source owner. */
      owner: string;
      /** Exact source vertex addresses in curve order. */
      vertices: number[];
    };
  }
  /** An actual emitted open patch, never a clipped or masked whole head. */
  export interface IPart {
    /** Source isolation identity. */
    id: string;
    /** Whether the producer already applied its frame. */
    space: "body-mm" | "local-mm";
    /** Producer placement/provenance. */
    frame: IFrame;
    /** Actual evaluated vertices. */
    points: Point[];
    /** Unchanged source triangle indices. */
    indices: number[];
    /** Optional original dimensionless vertex normals, in the same frame; absence requests geometry-derived display normals. */
    normals?: Point[];
    /** Actual generating sections and shared boundaries. */
    curves: ICurve[];
  }
  /** One precise refused input fact. */
  export interface IIssue {
    /** Source address. */
    path: string;
    /** Failed invariant. */
    reason: string;
  }
  /** Axis-aligned metre box derived only from actual surface vertices. */
  export interface IBounds {
    /** Minimum metre coordinates. */
    min: Point;
    /** Maximum metre coordinates. */
    max: Point;
  }
  /** Admitted static model and independent generating lines with their source identities. */
  export interface IResult {
    /** Generic renderer input, with skeleton null. */
    model: IAutoMovieModel;
    /** Actual curves converted by the same placement. */
    curves: ICurve[];
    /** Per-component surface boxes in metres. */
    bounds: Map<string, IBounds>;
  }
}
