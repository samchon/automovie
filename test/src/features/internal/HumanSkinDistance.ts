import { buildAutoMovieMeshQueryHierarchy } from "../../../../packages/engine/src/geometry/buildAutoMovieMeshQueryHierarchy";
import type { IAutoMovieMeshQueryHierarchy } from "../../../../packages/engine/src/geometry/IAutoMovieMeshQueryHierarchy";
import { HumanAnatomy as A } from "./HumanAnatomy";

/** A triangle ordinal and its actual enclosing box, in calibration millimetres. */
interface IEntry extends IAutoMovieMeshQueryHierarchy.IEntry {
  /** Offset of the triangle's first index in the immutable skin. */
  at: number;
}

/**
 * Nearest distances on one immutable generated skin, without spatial-cell
 * replication. Each triangle occurs in exactly one leaf, even when its box is
 * arbitrarily large. The existing point-triangle reader decides the distance;
 * boxes only prune candidates farther than the current best. Degenerate or
 * unresolved triangle arithmetic refuses rather than manufacturing a zero
 * distance. The caller owns
 * this index for the skin's lifetime and must rebuild after any geometry change.
 */
export class HumanSkinDistance {
  /** One resident entry per triangle; the shared builder partitions references. */
  private readonly root: IAutoMovieMeshQueryHierarchy<IEntry>;

  /** Validate complete finite geometry before compiling its bounding hierarchy. */
  public constructor(private readonly skin: A.ISkin) {
    const findings: string[] = [];
    if (skin.P.length % 3 !== 0 || skin.I.length % 3 !== 0)
      findings.push(this.diagnostic(undefined, "incomplete geometry", { positionCount: skin.P.length, indexCount: skin.I.length, expected: "multiples of three", units: "count" }));
    for (let vertex: number = 0; 3 * vertex + 2 < skin.P.length; vertex++) {
      const coordinates: A.V3 = A.point(skin, vertex);
      if (!coordinates.every(Number.isFinite))
        findings.push(this.diagnostic(undefined, "non-finite vertex", { vertex, coordinates, expected: "finite coordinates", units: "mm" }));
    }
    const entries: IEntry[] = [];
    for (let at: number = 0; at < skin.I.length; at += 3) {
      const low: number[] = [Infinity, Infinity, Infinity];
      const high: number[] = [-Infinity, -Infinity, -Infinity];
      let valid: boolean = true;
      for (let corner: number = 0; corner < 3; corner++) {
        const vertex: number | undefined = skin.I[at + corner];
        if (vertex === undefined || 3 * vertex + 2 >= skin.P.length) {
          findings.push(this.diagnostic(at, "missing vertex", { corner, vertex: vertex ?? "missing index", expected: `vertex index below ${Math.floor(skin.P.length / 3)}`, units: "index" }));
          valid = false;
          continue;
        }
        for (let axis: number = 0; axis < 3; axis++) {
          const value: number = skin.P[3 * vertex + axis]!;
          low[axis] = Math.min(low[axis]!, value);
          high[axis] = Math.max(high[axis]!, value);
        }
      }
      if (!valid) continue;
      const a: A.V3 = A.point(skin, skin.I[at]!);
      const b: A.V3 = A.point(skin, skin.I[at + 1]!);
      const c: A.V3 = A.point(skin, skin.I[at + 2]!);
      const area: number = Math.hypot(...A.cross(A.sub(b, a), A.sub(c, a)));
      if (!(area > 0) || !Number.isFinite(area)) {
        findings.push(this.diagnostic(at, "non-positive or unresolved triangle area", { observedArea: area / 2, expected: "positive finite area", units: "mm^2" }));
        continue;
      }
      entries.push({ at, low, high, centre: low.map((value: number, axis: number): number => value / 2 + high[axis]! / 2) });
    }
    if (findings.length !== 0)
      throw new HumanSkinDistance.MeasurementError(findings.join("\n"));
    this.root = buildAutoMovieMeshQueryHierarchy(entries);
  }

  /**
   * Return the actual nearest distance, including distances beyond an old grid's
   * neighbourhood. An empty skin returns Infinity and an unresolved arithmetic
   * result throws, so neither can become a successful symmetry reading.
   */
  public read(point: A.V3): number {
    if (!point.every(Number.isFinite))
      throw new HumanSkinDistance.MeasurementError(this.diagnostic(undefined, "non-finite query", { point, expected: "finite query coordinates", units: "mm" }));
    let best: number = Infinity;

    /** Box distance is a geometric lower bound, never an approximate answer. */
    const lower: (box: Pick<IEntry, "low" | "high">) => number = (box: Pick<IEntry, "low" | "high">): number => {
      const x: number = Math.max(box.low[0]! - point[0], 0, point[0] - box.high[0]!);
      const y: number = Math.max(box.low[1]! - point[1], 0, point[1] - box.high[1]!);
      const z: number = Math.max(box.low[2]! - point[2], 0, point[2] - box.high[2]!);
      return Math.hypot(x, y, z);
    };

    /** Visit nearer boxes first, retaining every possible nearest triangle. */
    const visit: (node: IAutoMovieMeshQueryHierarchy<IEntry>) => void = (node: IAutoMovieMeshQueryHierarchy<IEntry>): void => {
      if (lower(node) > best) return;
      if ("triangles" in node) {
        for (const entry of node.triangles) {
          if (lower(entry) > best) continue;
          const distance: number = A.triangleDistance(point,
            A.point(this.skin, this.skin.I[entry.at]!),
            A.point(this.skin, this.skin.I[entry.at + 1]!),
            A.point(this.skin, this.skin.I[entry.at + 2]!));
          if (!Number.isFinite(distance))
            throw new HumanSkinDistance.MeasurementError(this.diagnostic(entry.at, "unresolved distance arithmetic", { point, observed: distance, expected: "finite nonnegative distance", units: "mm" }));
          best = Math.min(best, distance);
        }
        return;
      }
      const first: IAutoMovieMeshQueryHierarchy<IEntry> = lower(node.left) <= lower(node.right) ? node.left : node.right;
      const second: IAutoMovieMeshQueryHierarchy<IEntry> = first === node.left ? node.right : node.left;
      visit(first);
      visit(second);
    };
    visit(this.root);
    return best;
  }

  /** Attribute a refusal to the original skin, chain and exact triangle geometry. */
  private diagnostic(at: number | undefined, issue: string, measurement: Record<string, unknown>): string {
    const indices: number[] = at === undefined ? [] : Array.from(this.skin.I.slice(at, at + 3));
    const triangle: number | undefined = at === undefined ? undefined : at / 3;
    const chain: string = triangle === undefined ? "skin" : this.skin.chains[this.skin.tri[triangle]!] ?? "unassigned";
    const coordinates: (A.V3 | string)[] = indices.map((vertex: number): A.V3 | string => 3 * vertex + 2 < this.skin.P.length ? A.point(this.skin, vertex) : "missing vertex");
    return JSON.stringify({ person: this.skin.name, component: "HumanSkinDistance", chain, triangle: triangle ?? "not applicable", indices, coordinates, issue, ...measurement }, (_key: string, value: unknown): unknown => typeof value === "number" && !Number.isFinite(value) ? String(value) : value);
  }
}

export namespace HumanSkinDistance {
  /** Only this expected measurement refusal may become an unavailable anatomy row. */
  export class MeasurementError extends RangeError {}
}
