import { IAutoMovieSurfaceConstruction } from "./IAutoMovieSurfaceConstruction";
import { IAutoMovieSurfaceCurveRig } from "./IAutoMovieSurfaceCurveRig";
import { IAutoMovieSurfaceNetwork } from "./IAutoMovieSurfaceNetwork";
import { IAutoMovieSweepRig } from "./IAutoMovieSweepRig";

/**
 * Register observation writers while a network rig is still open, then read them after its girth solve and final rest evaluation.
 *
 * Sweep observations use the same zero-cell writer as unsampled sweep nodes; spine observations read the same registered section frame; network curves use the actual tangent-constrained curve rig as patch boundaries, including its resolved geometric endpoint cells. Those curves are not raw zero-cell sweep observations. Feature observations read the compiled field's own smooth domain course. No observation enters the cage registry, changes a sampling cell or adds a vertex.
 *
 * @param props Network, shared rig lookups and optional segment counts
 * @returns A one-use reader producing caller-owned rest polylines; subsequent reads and requests without counts return an empty array
 * @throws Error for missing, invalid or unknown counts or any sweep/curve refusal
 *
 * @evidence contracts/common.md#principled-implementation Registers the actual sweep, frame and curve evaluator writers before sealing and reads them after all constraints; feature coordinates come from the same compiled feature spline as the displacement.
 * @evidence contracts/common.md#clear-and-simple-design Separates observation registration from its final read without adding another curve or surface implementation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Sweep observation writers use zero-size cells and never enter the cage registry; network-curve observations read the actual curve rig. Neither changes registry cells or topology.
 * @evidence contracts/common.md#meaningful-documentation States registration/read ordering, shared evaluators, filtering distinction and ownership.
 * @evidence contracts/performance.md#efficient-algorithms O(N) registration and reads for N requested points, plus the same surface queries used by the rig; allocates one writer per point until the final read.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the rig's compiled sweep/curve and feature coefficients; no geometric representation is refitted for display.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The final read clears its O(N) temporary observation writers. Their registered frame and scale slots remain bounded by the requested samples and belong to the returned rig, whose pose updates still refresh them until that rig is released. Packed rest polylines are a separate caller-owned snapshot.
 */
export function prepareAutoMovieSurfaceConstruction(props: {
  network: IAutoMovieSurfaceNetwork;
  sweepRig: (name: string) => IAutoMovieSweepRig;
  curveRig: (
    name: string,
    curve: IAutoMovieSurfaceNetwork.ICurve,
  ) => IAutoMovieSurfaceCurveRig;
  samples?: IAutoMovieSurfaceConstruction.ISamples;
}): () => IAutoMovieSurfaceConstruction[] {
  const samples: IAutoMovieSurfaceConstruction.ISamples | undefined =
    props.samples;
  if (samples === undefined) return (): IAutoMovieSurfaceConstruction[] => [];
  const kinds: readonly (keyof IAutoMovieSurfaceConstruction.ISamples)[] = [
    "station",
    "line",
    "feature",
    "curve",
  ];
  for (const kind of kinds) {
    const count: number = samples[kind];
    if (!Number.isSafeInteger(count) || count < (kind === "station" ? 3 : 1))
      throw new Error(
        `construction ${kind} count must be a positive safe integer${kind === "station" ? " of at least three" : ""}`,
      );
  }
  for (const key of Object.keys(samples))
    if (
      !kinds.some(
        (kind: keyof IAutoMovieSurfaceConstruction.ISamples): boolean =>
          kind === key,
      )
    )
      throw new Error(`unknown construction sample count ${key}`);
  const entries: IEntry[] = [];
  function add(kind: IAutoMovieSurfaceConstruction["kind"], name: string, closed: boolean, count: number, make: (t: number) => (out: Float64Array, at: number) => void): void {
    entries.push({
      kind,
      name,
      closed,
      writers: Array.from(
        { length: count + (closed ? 0 : 1) },
        (_: unknown, i: number): IWriter => make(i / count),
      ),
    });
  }
  for (const [name, sweep] of Object.entries(props.network.sweeps)) {
    const rig: IAutoMovieSweepRig = props.sweepRig(name);
    function point(u: number, v: number): ((out: Float64Array, at: number) => void) { return rig.sample(u, v, [0, 0, 0, 0]); }
    add("spine", name, false, samples.line, (u: number): IWriter => {
      const frame: number = 12 * rig.frame(u);
      return (out: Float64Array, at: number): void => {
        for (let c: number = 0; c < 3; ++c)
          out[at + c] = rig.frames[frame + c]!;
      };
    });
    for (const station of sweep.stations)
      add(
        "station",
        name,
        true,
        samples.station,
        (v: number): IWriter => point(station.at, v),
      );
    for (const guide of sweep.guides ?? [])
      add(
        "guide",
        name,
        false,
        samples.line,
        (u: number): IWriter => point(u, guide.angle / (2 * Math.PI)),
      );
    for (let index: number = 0; index < (sweep.features?.length ?? 0); ++index)
      add(
        "feature",
        name,
        false,
        samples.feature *
          Math.max(1, sweep.features![index]!.points.length - 1),
        (t: number): IWriter => {
          const domain: { u: number; v: number } = rig.surface.feature(
            index,
            t,
          );
          return point(domain.u, domain.v);
        },
      );
  }
  for (const [name, curve] of Object.entries(props.network.curves ?? {})) {
    const rig: IAutoMovieSurfaceCurveRig = props.curveRig(name, curve);
    add(
      "curve",
      name,
      false,
      samples.curve,
      (t: number): IWriter =>
        (out: Float64Array, at: number): void =>
          rig.point(t, out, at),
    );
  }
  return (): IAutoMovieSurfaceConstruction[] => {
    const result: IAutoMovieSurfaceConstruction[] = entries.map(
      (entry: IEntry): IAutoMovieSurfaceConstruction => {
        const points: Float64Array = new Float64Array(3 * entry.writers.length);
        entry.writers.forEach((write: IWriter, i: number): void =>
          write(points, 3 * i),
        );
        return {
          kind: entry.kind,
          name: entry.name,
          closed: entry.closed,
          points: Array.from(points),
        };
      },
    );
    entries.length = 0;
    return result;
  };
}

/** One pre-registered point writer. */
type IWriter = (out: Float64Array, at: number) => void;

/** One observation's metadata and generating writers. */
interface IEntry {
  kind: IAutoMovieSurfaceConstruction["kind"];
  name: string;
  closed: boolean;
  writers: IWriter[];
}
