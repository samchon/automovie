import { IAutoMovieSurfaceRegistry } from "./IAutoMovieSurfaceRegistry";
import { IAutoMovieSurfaceSample } from "./IAutoMovieSurfaceSample";
import { IAutoMovieSweepRig } from "./IAutoMovieSweepRig";

/**
 * Create the vertex registry of a surface rig.
 *
 * A point is one vertex per identity. Points other than sweep points get
 * their writer when first registered. A sweep point records, on each side
 * along `u` and `v`, the finest spacing to a neighbouring sample that any
 * sampling of it reports, and `finalize` makes its writer from that cell
 * with `IAutoMovieSweepRig.sample`, a side none reached mirroring the other
 * and an axis none spans having no extent, so the point does not depend on
 * which patch sampled it first. Its writer slot is held in registration
 * order, so writers still run after everything they read.
 *
 * @param sweepRig The rig of a sweep by name.
 * @returns The empty registry.
 *
 * @evidence contracts/common.md#principled-implementation Identity welding with an order-independent cell per sweep point: the trapezoid average over the point's actual neighbourhood.
 * @evidence contracts/common.md#clear-and-simple-design Registration and finalization in one place; the network rig only names identities and samples.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No proximity welding, and an unknown identity is refused by `existing`.
 * @evidence contracts/common.md#meaningful-documentation States the identity rule, the cell rule and why writers keep their order.
 * @evidence contracts/performance.md#efficient-algorithms O(1) map work per registration and O(1) per sweep point to finalize.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A registry; a shared point is evaluated once per pose because it is registered once.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains one index entry and one writer per vertex and one pending record per sweep point, released with the rig.
 */
export const registerAutoMovieSurfaceVertices: (sweepRig: (name: string) => IAutoMovieSweepRig) => IAutoMovieSurfaceRegistry = (
  sweepRig: (name: string) => IAutoMovieSweepRig,
): IAutoMovieSurfaceRegistry => {
  const index: Map<string, number> = new Map();
  const writers: Array<(targets: Float64Array) => void> = [];
  let vertices: number = 0;
  const reserve = (key: string): number => {
    const i: number = vertices++;
    index.set(key, i);
    return i;
  };
  const vertex = (key: string, make: () => (out: Float64Array, at: number) => void): number => {
    let i: number | undefined = index.get(key);
    if (i === undefined) {
      const write: (out: Float64Array, at: number) => void = make();
      const at: number = 3 * (i = reserve(key));
      writers.push((targets: Float64Array): void => write(targets, at));
    }
    return i;
  };
  const pending: Map<string, IPending> = new Map();
  const admit = (sample: IAutoMovieSurfaceSample): number => {
    const point: IAutoMovieSurfaceSample["point"] = sample.point;
    if (point === null) return vertex(sample.key, sample.writer);
    let entry: IPending | undefined = pending.get(sample.key);
    if (entry === undefined) {
      const at: number = 3 * reserve(sample.key);
      const created: IPending = { sweep: point.sweep, u: point.u, v: point.v, cell: [Infinity, Infinity, Infinity, Infinity], write: (): void => undefined };
      writers.push((targets: Float64Array): void => created.write(targets, at));
      pending.set(sample.key, (entry = created));
    }
    for (let k: number = 0; k < 4; ++k) entry.cell[k] = Math.min(entry.cell[k]!, point.cell[k]!);
    return index.get(sample.key)!;
  };
  const finalize = (): void => {
    for (const entry of pending.values()) {
      const cell: [number, number, number, number] = [0, 0, 0, 0];
      for (const axis of [0, 2]) {
        const below: number = entry.cell[axis]!;
        const above: number = entry.cell[axis + 1]!;
        cell[axis] = Number.isFinite(below) ? below : Number.isFinite(above) ? above : 0;
        cell[axis + 1] = Number.isFinite(above) ? above : cell[axis]!;
      }
      entry.write = sweepRig(entry.sweep).sample(entry.u, entry.v, cell);
    }
  };
  const existing = (key: string, what: string): number => {
    const i: number | undefined = index.get(key);
    if (i === undefined) throw new Error(`${what} names a point no patch made`);
    return i;
  };
  return { writers, count: (): number => vertices, reserve, vertex, admit, finalize, existing };
};

/** A sweep point awaiting its writer: the sweep, domain point, the finest spacing reported on each side, and the writer once made. */
interface IPending {
  sweep: string;
  u: number;
  v: number;
  cell: [number, number, number, number];
  write: (out: Float64Array, at: number) => void;
}
