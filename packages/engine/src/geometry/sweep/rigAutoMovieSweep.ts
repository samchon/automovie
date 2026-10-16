import { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

import { quaternionFromAutoMovieBasis } from "../../math/quaternionFromAutoMovieBasis";
import { AutoMovieSweepRotation } from "./AutoMovieSweepRotation";
import { IAutoMovieBoneBuffer } from "./IAutoMovieBoneBuffer";
import { IAutoMovieSweep } from "./IAutoMovieSweep";
import { IAutoMovieSweepFrame } from "./IAutoMovieSweepFrame";
import { IAutoMovieSweepOrientation } from "./IAutoMovieSweepOrientation";
import { IAutoMovieSweepRig } from "./IAutoMovieSweepRig";
import { IAutoMovieSweepSection } from "./IAutoMovieSweepSection";
import { IAutoMovieSweepSurface } from "./IAutoMovieSweepSurface";
import { IAutoMovieSweepTransport } from "./IAutoMovieSweepTransport";
import { compileAutoMovieSweep } from "./compileAutoMovieSweep";
import { orientAutoMovieSweep } from "./orientAutoMovieSweep";
import { preserveAutoMovieSweepVolume } from "./preserveAutoMovieSweepVolume";
import { sampleAutoMovieParameterSweep } from "./sampleAutoMovieParameterSweep";
import { transportAutoMovieSweepSpine } from "./transportAutoMovieSweepSpine";

/**
 * Compile one sweep of a surface rig: its rest surface, and, when it rides
 * bones, the buffers that re-sweep it per pose as `poseAutoMovieSweep` does.
 *
 * At rest every slot reads the compiled rest surface. Posed, each spine point
 * moves with its bone, the starting direction and any end tangents turn with
 * the first or last point's bone, and the spine is re-transported in place;
 * each station's rest plane turns with its bone, or takes the spherical
 * midpoint of its two bones' turns, and the orientation is recomputed; every
 * registered plane is then read from it. With volume preservation and joint
 * stations, the scale profile gains a knot at every station and rest scale
 * knot, the rest scale times a joint factor at joint stations and times 1
 * elsewhere, and `settleAutoMovieSweepVolume` finds the factor whose volume,
 * from the rest section moments and this pose's frames by
 * `integrateAutoMovieSweepVolume`, equals the rest volume. Without either the
 * scale stays the rest profile. A girth factor set by `girth` then multiplies
 * every scale slot, at rest and after settling, so the settled volume is the
 * rest volume before that correction. Shapes before scale come directly from the shared shape evaluator and are
 * read once at registration; no scaled result is divided back into a shape.
 * Parameter-correspondence cells average actual signed section coordinates; radial cells retain radius averaging about their authored direction. Valid Cartesian cancellation at the origin is allowed.
 * Unrepresentable nonzero cell averages, scaled samples and girth products
 * are refused. Girth admission stages every factor, product and probe before committing.
 *
 * @param props.sweep The sweep, only read and retained through its compiled surface.
 * @param props.binding Bone indices of its spine points and stations, as `IAutoMovieSweepBinding` names them; omitted, the sweep stays at rest.
 * @param props.preserveVolume Whether posing restores the rest volume at joint stations.
 * @returns The rig, open for registration.
 * @throws Error when `compileAutoMovieSweep` refuses the sweep, the binding does not align with it, a slot is registered after `seal`, or a probe cell is negative or nonfinite; and from `pose` whatever the spine transport refuses.
 *
 * @evidence contracts/common.md#principled-implementation Sweep-based deformation (Hyun et al. 2005, The Visual Computer 21(8-10):542-550): key sections ride their links or turn halfway at joints, the centre curve and orientations are re-interpolated, and the joint section is rescaled to the rest volume; split into its pose-invariant shape and its per-pose frames and scale.
 * @evidence contracts/common.md#clear-and-simple-design The spine, orientation, volume and secant are the kernels `compileAutoMovieSweep`, `measureAutoMovieSweepVolume` and `poseAutoMovieSweep` use, so the rig and the record path compute the same surface.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Bindings that do not align with the sweep are refused, and volume preservation changes only the joint stations' scale.
 * @evidence contracts/common.md#meaningful-documentation States the rest and posed rules, the volume rule and its sources, and every refusal.
 * @evidence contracts/performance.md#efficient-algorithms Compile: one sweep compile, O(1) per registered slot, and for volume preservation the 400 x 256 section moments and the rest volume summed from them. Pose, for N spine points, S stations, F registered planes, L registered scale slots, P probes and K scale knots: O(N) transport plus 64 (N - 1) reflections, O(S) orientation, O(F) plane queries and O(P) four-point probe writes and, with volume preservation, 801 more planes and at most ten volume sums of O(400 + K), plus O(L) scale refresh; nothing allocates. Each probe registers four sample writers, up to 36 shape reads, at most three frame slots and nine scale slots before deduplication. These differentiate the same fixed footprint at four neighbouring parameters; they do not differentiate changes of footprint size across the network.
 * @evidence contracts/performance.md#reuse-equivalent-work Shapes, rest planes, section moments and the rest volume are computed once; a pose recomputes only what bones move.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains the compiled surface, registered frame/scale parameter maps, 24 F frame numbers, 5 L current/rest/girth/staging scale numbers and 12 P current/staging probe outputs, plus four dynamic sample writers and one span per probe. Each writer retains one frame slot and one to three weighted scale terms. Bound rigs retain spine/rotation buffers; volume preservation owns its documented moments and staging arrays. Registration ends at seal and all storage is released with the rig.
 */
export const rigAutoMovieSweep: (props: {
  sweep: IAutoMovieSweep;
  binding?: {
    points: number[];
    stations: number[][];
  };
  preserveVolume: boolean;
}) => IAutoMovieSweepRig = (props: {
  sweep: IAutoMovieSweep;
  binding?: {
    points: number[];
    stations: number[][];
  };
  preserveVolume: boolean;
}): IAutoMovieSweepRig => {
  const { sweep, binding }: typeof props = props;
  const surface: IAutoMovieSweepSurface = compileAutoMovieSweep(sweep);
  if (binding !== undefined) {
    if (binding.points.length !== sweep.spine.points.length)
      throw new Error("sweep binding needs one bone per spine point");
    if (binding.stations.length !== sweep.stations.length)
      throw new Error("sweep binding needs one bone or joint per station");
  }
  const frameAt: Map<number, number> = new Map();
  const scaleAt: Map<number, number> = new Map();
  const frameU: number[] = [];
  const scaleU: number[] = [];
  // Four writers share one fixed cell per probe; their frame/scale slots are deduplicated with all other samples.
  const probeWriters: IProbe[] = [];
  let sealed: boolean = false;
  function open(): void {
    if (sealed) throw new Error("a sweep rig takes no slot after it is sealed");
  }
  function slot(
    at: Map<number, number>,
    list: number[],
    input: number,
  ): number {
    open();
    const u: number = Math.min(1, Math.max(0, input));
    let s: number | undefined = at.get(u);
    if (s === undefined) {
      s = list.length;
      list.push(u);
      at.set(u, s);
    }
    return s;
  }
  function frame(u: number): number {
    return slot(frameAt, frameU, u);
  }
  function scale(u: number): number {
    return slot(scaleAt, scaleU, u);
  }
  function probe(
    u: number,
    v: number,
    cell: readonly [number, number, number, number] = [0, 0, 0, 0],
  ): number {
    open();
    if (
      !cell.every(
        (value: number): boolean => Number.isFinite(value) && value >= 0,
      )
    )
      throw new Error("a sweep probe cell must be finite and nonnegative");
    const step: number = surface.step;
    const a: number = Math.max(0, u - step);
    const b: number = Math.min(1, u + step);
    const slot: number = probeWriters.length;
    probeWriters.push({
      points: [
        sample(u, v + step, cell),
        sample(u, v - step, cell),
        sample(a, v, cell),
        sample(b, v, cell),
      ],
      span: b - a,
    });
    return slot;
  }

  function sample(
    u: number,
    v: number,
    cell: readonly [number, number, number, number],
  ): (out: Float64Array, at: number) => void {
    const f: number = 12 * frame(u);
    if (sweep.correspondence === "parameter")
      return sampleAutoMovieParameterSweep({
        surface,
        u,
        v,
        cell,
        frame: f,
        scale,
        readScale: (slot: number): number =>
          (probeScales ?? rig.scales)[probeScaleOffset + slot]!,
        frames: (): Float64Array => rig.frames,
      });
    const slots: number[] = [];
    const xs: number[] = [];
    const ys: number[] = [];
    if (cell.every((d: number): boolean => d === 0)) {
      const p: IAutoMovieSweepSection.IPoint = surface.shape(u, v);
      slots.push(scale(u));
      xs.push(p.x);
      ys.push(p.y);
    } else {
      // the trapezoid rule over the cell from half the spacing below to half the spacing above, each axis
      function tent(below: number, above: number): number[][] {
        const total: number = below + above;
        return total === 0
          ? [[0, 1]]
          : [
              [-below / 2, below / (2 * total)],
              [0, 0.5],
              [above / 2, above / (2 * total)],
            ];
      }
      const angle: number = 2 * Math.PI * v;
      for (const [du, wu] of tent(cell[0], cell[1])) {
        const at: number = Math.min(1, Math.max(0, u + du!));
        let r: number = 0;
        let positive: boolean = false;
        for (const [dv, wv] of tent(cell[2], cell[3])) {
          const value: number = surface.profile(at, v + dv!);
          positive ||= wu! > 0 && wv! > 0 && value > 0;
          r += wu! * wv! * value;
        }
        if (!Number.isFinite(r) || r < 0 || (positive && r === 0))
          throw new Error("averaged sweep radius is not representable");
        slots.push(scale(at));
        xs.push(r * Math.cos(angle));
        ys.push(r * Math.sin(angle));
      }
    }
    const terms: number = slots.length;
    const slot: Int32Array = Int32Array.from(slots);
    const x: Float64Array = Float64Array.from(xs);
    const y: Float64Array = Float64Array.from(ys);
    const positive: boolean =
      xs.some((value: number): boolean => value !== 0) ||
      ys.some((value: number): boolean => value !== 0);
    return (out: Float64Array, at: number): void => {
      let px: number = 0;
      let py: number = 0;
      for (let k: number = 0; k < terms; ++k) {
        const s: number = (probeScales ?? rig.scales)[
          probeScaleOffset + slot[k]!
        ]!;
        px += s * x[k]!;
        py += s * y[k]!;
      }
      if (
        !Number.isFinite(px) ||
        !Number.isFinite(py) ||
        (positive && px === 0 && py === 0)
      )
        throw new Error("scaled sweep sample is not representable");
      for (let c: number = 0; c < 3; ++c)
        out[at + c] =
          rig.frames[f + c]! +
          (rig.frames[f + 3 + c]! * px + rig.frames[f + 6 + c]! * py);
    };
  }
  const rig: IAutoMovieSweepRig = {
    surface,
    frame,
    scale,
    probe,
    sample,
    seal: (): void => undefined,
    girth: (): void => undefined,
    frames: new Float64Array(0),
    scales: new Float64Array(0),
    probes: new Float64Array(0),
    pose: (): void => undefined,
  };
  let restFrames: Float64Array = new Float64Array(0);
  // the girth factor of each scale slot, 1 until a network sets it
  let girth: Float64Array = new Float64Array(0);
  let restScales: Float64Array = new Float64Array(0);
  let girthWork: Float64Array = new Float64Array(0);
  let probeWork: Float64Array = new Float64Array(0);
  // Dynamic probe writers read this private staged view, without publishing scales.
  let probeScales: Float64Array | null = null;
  let probeScaleOffset: number = 0;
  const scratch: Float64Array = new Float64Array(12);
  function probeAll(
    scales: Float64Array = rig.scales,
    offset: number = 0,
    out: Float64Array = rig.probes,
  ): void {
    const previous: Float64Array | null = probeScales;
    const previousOffset: number = probeScaleOffset;
    probeScales = scales;
    probeScaleOffset = offset;
    try {
      for (let p: number = 0; p < probeWriters.length; ++p) {
        const definition: IProbe = probeWriters[p]!;
        const span: number = definition.span;
        for (let k: number = 0; k < 4; ++k)
          definition.points[k]!(scratch, 3 * k);
        // around: the v difference; along: the u difference over its span
        const rx: number = scratch[0]! - scratch[3]!;
        const ry: number = scratch[1]! - scratch[4]!;
        const rz: number = scratch[2]! - scratch[5]!;
        const ax: number = (scratch[9]! - scratch[6]!) / span;
        const ay: number = (scratch[10]! - scratch[7]!) / span;
        const az: number = (scratch[11]! - scratch[8]!) / span;
        const nx: number = ry * az - rz * ay;
        const ny: number = rz * ax - rx * az;
        const nz: number = rx * ay - ry * ax;
        const size: number = Math.hypot(nx, ny, nz);
        if (
          !(size > 0) ||
          !Number.isFinite(size) ||
          !Number.isFinite(ax) ||
          !Number.isFinite(ay) ||
          !Number.isFinite(az)
        )
          throw new Error("sweep probe is not representable");
        const o: number = 6 * p;
        out[o] = nx / size;
        out[o + 1] = ny / size;
        out[o + 2] = nz / size;
        out[o + 3] = ax;
        out[o + 4] = ay;
        out[o + 5] = az;
      }
    } finally {
      probeScales = previous;
      probeScaleOffset = previousOffset;
    }
  }
  function writeFrame(
    f: IAutoMovieSweepFrame,
    out: Float64Array,
    at: number,
  ): void {
    [f.origin, f.x, f.y, f.normal].forEach(
      (v: IAutoMovieVector3, k: number): void => {
        out[at + 3 * k] = v.x;
        out[at + 3 * k + 1] = v.y;
        out[at + 3 * k + 2] = v.z;
      },
    );
  }
  rig.seal = (): void => {
    open();
    sealed = true;
    rig.frames = new Float64Array(12 * frameU.length);
    rig.scales = Float64Array.from(scaleU, (u: number): number =>
      surface.scale(u),
    );
    rig.probes = new Float64Array(6 * probeWriters.length);
    frameU.forEach((u: number, s: number): void =>
      writeFrame(surface.frame(u), rig.frames, 12 * s),
    );
    restFrames = rig.frames.slice();
    restScales = rig.scales.slice();
    girth = new Float64Array(scaleU.length).fill(1);
    girthWork = new Float64Array(2 * scaleU.length);
    probeWork = new Float64Array(rig.probes.length);
    probeAll();
    if (binding === undefined) return;
    rig.pose = bind(binding);
  };
  rig.girth = (factor: (u: number) => number): void => {
    if (!sealed)
      throw new Error(
        "a sweep rig takes a girth factor only after it is sealed",
      );
    for (let k: number = 0; k < scaleU.length; ++k) {
      const g: number = factor(scaleU[k]!);
      if (!(Number.isFinite(g) && g > 0))
        throw new Error(
          `girth factor at u ${scaleU[k]} is not positive and finite`,
        );
      const value: number = surface.scale(scaleU[k]!) * g;
      if (!(value > 0) || !Number.isFinite(value))
        throw new Error("girth scale is not positive and finite");
      girthWork[k] = g;
      girthWork[scaleU.length + k] = value;
    }
    probeAll(girthWork, scaleU.length, probeWork);
    for (let k: number = 0; k < scaleU.length; ++k) {
      girth[k] = girthWork[k]!;
      restScales[k] = girthWork[scaleU.length + k]!;
    }
    rig.scales.set(restScales);
    rig.probes.set(probeWork);
  };
  // the posed sweep: spine, orientation and, with joint stations, volume
  function bind(bones: {
    points: number[];
    stations: number[][];
  }): (motion: IAutoMovieBoneBuffer | null) => void {
    const n: number = sweep.spine.points.length;
    const s: number = sweep.stations.length;
    const transport: IAutoMovieSweepTransport = transportAutoMovieSweepSpine(
      n,
      true,
    );
    const knots: Float64Array = Float64Array.from(
      sweep.stations,
      (st: IAutoMovieSweep.IStation): number => st.at,
    );
    const orientation: IAutoMovieSweepOrientation = orientAutoMovieSweep({
      transport,
      knots,
      fixed: sweep.orientation === "fixed",
    });
    orientation.given.fill(1);
    const rest: Float64Array = Float64Array.from(
      sweep.spine.points.flatMap((p: IAutoMovieVector3): number[] => [
        p.x,
        p.y,
        p.z,
      ]),
    );
    const ends: Float64Array = new Float64Array(9);
    ends.set(
      [sweep.spine.normal.x, sweep.spine.normal.y, sweep.spine.normal.z],
      0,
    );
    const start: IAutoMovieVector3 | undefined = sweep.spine.tangents?.start;
    const end: IAutoMovieVector3 | undefined = sweep.spine.tangents?.end;
    if (start !== undefined) ends.set([start.x, start.y, start.z], 3);
    if (end !== undefined) ends.set([end.x, end.y, end.z], 6);
    const planes: Float64Array = new Float64Array(4 * s);
    sweep.stations.forEach((st: IAutoMovieSweep.IStation, k: number): void => {
      const f: IAutoMovieSweepFrame = surface.frame(st.at);
      const q: IAutoMovieQuaternion = quaternionFromAutoMovieBasis(
        f.x,
        f.y,
        f.normal,
      );
      planes.set([q.x, q.y, q.z, q.w], 4 * k);
    });
    const turned: Float64Array = new Float64Array(8);
    const joints: boolean[] = bones.stations.map(
      (b: number[]): boolean => b.length === 2,
    );
    const volume: (() => void) | null =
      props.preserveVolume && joints.some((j: boolean): boolean => j)
        ? preserveAutoMovieSweepVolume({
            surface,
            orientation,
            joints,
            scaleU,
            girth,
            scales: rig.scales,
            writeFrame,
          })
        : null;
    return (motion: IAutoMovieBoneBuffer | null): void => {
      if (motion === null) {
        rig.frames.set(restFrames);
        rig.scales.set(restScales);
        probeAll();
        return;
      }
      for (let k: number = 0; k < n; ++k)
        motion.apply(bones.points[k]!, rest, 3 * k, transport.points, 3 * k);
      const first: number = bones.points[0]!;
      const last: number = bones.points[n - 1]!;
      motion.turn(first, ends, 0, transport.normal, 0);
      motion.turn(first, ends, 3, transport.start, 0);
      motion.turn(last, ends, 6, transport.end, 0);
      transport.update();
      for (let k: number = 0; k < s; ++k) {
        const pair: number[] = bones.stations[k]!;
        for (let j: number = 0; j < pair.length; ++j) {
          AutoMovieSweepRotation.multiply(
            motion.rotations,
            4 * pair[j]!,
            planes,
            4 * k,
            turned,
            4 * j,
          );
          AutoMovieSweepRotation.normalize(turned, 4 * j);
        }
        if (pair.length === 2)
          AutoMovieSweepRotation.slerp(
            turned,
            0,
            turned,
            4,
            0.5,
            orientation.rotations,
            4 * k,
          );
        else
          for (let a: number = 0; a < 4; ++a)
            orientation.rotations[4 * k + a] = turned[a]!;
      }
      orientation.update();
      for (let f: number = 0; f < frameU.length; ++f)
        orientation.frame(frameU[f]!, rig.frames, 12 * f);
      if (volume !== null) volume();
      probeAll();
    };
  }
  return rig;
};

/** One fixed-footprint differential probe; writers own only precompiled sampling terms. */
interface IProbe {
  points: Array<(out: Float64Array, at: number) => void>;
  span: number;
}
