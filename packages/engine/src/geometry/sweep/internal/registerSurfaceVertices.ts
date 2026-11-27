import type {
  IAutoMovieSurfaceRegistry,
  IAutoMovieSurfaceSample,
  IAutoMovieSweepRig,
} from "@automovie/interface";

/*
 * Create the vertex registry of a surface rig.
 *
 * A point is one vertex per identity. Points other than sweep points get their
 * writer when first registered. A sweep point records, on each side along `u`
 * and `v`, the finest spacing to a neighbouring sample that any sampling of it
 * reports, and `finalize` makes its writer from that cell with
 * `IAutoMovieSweepRig.sample`, a side none reached mirroring the other and an
 * axis none spans having no extent, so the point does not depend on which patch
 * sampled it first. Its writer slot is held in registration order, so writers
 * still run after everything they read. After resolving every sweep writer,
 * finalization binds dependent geometric node writers and probes once, before
 * sweep sealing. This field is independent of later control pins. Registering
 * or binding after finalization, or finalizing twice, is refused.
 * Parameter sweepRig: The rig of a sweep by name.
 * Returns: The empty registry.
 */
export const registerSurfaceVertices: (
  sweepRig: (name: string) => IAutoMovieSweepRig,
) => IAutoMovieSurfaceRegistry = (
  sweepRig: (name: string) => IAutoMovieSweepRig,
): IAutoMovieSurfaceRegistry => {
  const index: Map<string, number> = new Map();
  const writers: Array<(targets: Float64Array) => void> = [];
  let vertices: number = 0;
  let finalized: boolean = false;
  const bindings: Array<{
    key: string;
    bind: (sample: IAutoMovieSurfaceRegistry.ISweep | null) => void;
  }> = [];
  function open(): void {
    if (finalized) throw new Error("surface registry is already finalized");
  }
  function reserve(key: string): number {
    open();
    const i: number = vertices++;
    index.set(key, i);
    return i;
  }
  function vertex(
    key: string,
    make: () => (out: Float64Array, at: number) => void,
  ): number {
    open();
    let i: number | undefined = index.get(key);
    if (i === undefined) {
      const write: (out: Float64Array, at: number) => void = make();
      const at: number = 3 * (i = reserve(key));
      writers.push((targets: Float64Array): void => write(targets, at));
    }
    return i;
  }
  const pending: Map<string, IPending> = new Map();
  function admit(sample: IAutoMovieSurfaceSample): number {
    open();
    const point: IAutoMovieSurfaceSample["point"] = sample.point;
    if (point === null) return vertex(sample.key, sample.writer);
    let entry: IPending | undefined = pending.get(sample.key);
    if (entry === undefined) {
      const at: number = 3 * reserve(sample.key);
      const created: IPending = {
        sweep: point.sweep,
        u: point.u,
        v: point.v,
        cell: [Infinity, Infinity, Infinity, Infinity],
        write: (): void => undefined,
      };
      writers.push((targets: Float64Array): void => created.write(targets, at));
      pending.set(sample.key, (entry = created));
    }
    for (let k: number = 0; k < 4; ++k)
      entry.cell[k] = Math.min(entry.cell[k]!, point.cell[k]!);
    return index.get(sample.key)!;
  }
  function finalize(): void {
    open();
    finalized = true;
    try {
      for (const entry of pending.values()) {
        const cell: [number, number, number, number] = [0, 0, 0, 0];
        for (const axis of [0, 2]) {
          const below: number = entry.cell[axis]!;
          const above: number = entry.cell[axis + 1]!;
          // An unbounded side keeps the initial Infinity sentinel.
          cell[axis] =
            below !== Infinity ? below : above !== Infinity ? above : 0;
          cell[axis + 1] = above !== Infinity ? above : cell[axis]!;
        }
        entry.cell = cell;
        entry.write = sweepRig(entry.sweep).sample(entry.u, entry.v, cell);
      }
      for (const request of bindings)
        request.bind(pending.get(request.key) ?? null);
    } finally {
      bindings.length = 0;
      pending.clear();
    }
  }
  function bindSweep(
    key: string,
    bind: (sample: IAutoMovieSurfaceRegistry.ISweep | null) => void,
  ): void {
    open();
    bindings.push({ key, bind });
  }
  function existing(key: string, what: string): number {
    const i: number | undefined = index.get(key);
    if (i === undefined) throw new Error(`${what} names a point no patch made`);
    return i;
  }
  return {
    writers,
    count: (): number => vertices,
    reserve,
    vertex,
    admit,
    finalize,
    bindSweep,
    existing,
  };
};

/*
 * A sweep point awaiting its writer: the sweep, domain point, the finest
 * spacing reported on each side, and the writer once made.
 */
interface IPending {
  sweep: string;
  u: number;
  v: number;
  cell: [number, number, number, number];
  write: (out: Float64Array, at: number) => void;
}
