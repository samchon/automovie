import { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

import { quaternionFromAutoMovieBasis } from "../../math/quaternionFromAutoMovieBasis";
import { AutoMovieSpline } from "./AutoMovieSpline";
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
import { integrateAutoMovieSweepVolume } from "./integrateAutoMovieSweepVolume";
import { interpolateAutoMovieSpline } from "./interpolateAutoMovieSpline";
import { momentAutoMovieSweepSections } from "./momentAutoMovieSweepSections";
import { orientAutoMovieSweep } from "./orientAutoMovieSweep";
import { settleAutoMovieSweepVolume } from "./settleAutoMovieSweepVolume";
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
 * scale stays the rest profile. Shapes before the scale never change with
 * the pose, so they are read once at registration.
 *
 * @param props.sweep The sweep, only read and retained through its compiled surface.
 * @param props.binding Bone indices of its spine points and stations, as `IAutoMovieSweepBinding` names them; omitted, the sweep stays at rest.
 * @param props.preserveVolume Whether posing restores the rest volume at joint stations.
 * @returns The rig, open for registration.
 * @throws Error when `compileAutoMovieSweep` refuses the sweep, the binding does not align with it, or a slot is registered after `seal`; and from `pose` whatever the spine transport refuses.
 *
 * @evidence contracts/common.md#principled-implementation Sweep-based deformation (Hyun et al. 2005, The Visual Computer 21(8-10):542-550): key sections ride their links or turn halfway at joints, the centre curve and orientations are re-interpolated, and the joint section is rescaled to the rest volume; split into its pose-invariant shape and its per-pose frames and scale.
 * @evidence contracts/common.md#clear-and-simple-design The spine, orientation, volume and secant are the kernels `compileAutoMovieSweep`, `measureAutoMovieSweepVolume` and `poseAutoMovieSweep` use, so the rig and the record path compute the same surface.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Bindings that do not align with the sweep are refused, and volume preservation changes only the joint stations' scale.
 * @evidence contracts/common.md#meaningful-documentation States the rest and posed rules, the volume rule and its sources, and every refusal.
 * @evidence contracts/performance.md#efficient-algorithms Compile: one sweep compile, O(1) per registered slot, and for volume preservation the 400 x 256 section moments and the rest volume summed from them. Pose, for N spine points, S stations, F planes, P probes and K scale knots: O(N) transport plus 64 (N - 1) reflections, O(S) orientation, O(F + 3P) plane queries and, with volume preservation, 801 more planes and at most ten volume sums of O(400 + K); nothing allocates.
 * @evidence contracts/performance.md#reuse-equivalent-work Shapes, rest planes, section moments and the rest volume are computed once; a pose recomputes only what bones move.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains the compiled surface, 12 F + S + 6 P numbers twice (current and rest), 14 numbers per probe, and when bound the spine buffers of `transportAutoMovieSweepSpine`, 4 S rest planes and, for volume preservation, 1,200 moments, 801 planes and O(K) profile arrays; all sized by `seal` and released with the rig.
 */
export const rigAutoMovieSweep: (props: {
  sweep: IAutoMovieSweep;
  binding?: { points: number[]; stations: number[][] };
  preserveVolume: boolean;
}) => IAutoMovieSweepRig = (props: {
  sweep: IAutoMovieSweep;
  binding?: { points: number[]; stations: number[][] };
  preserveVolume: boolean;
}): IAutoMovieSweepRig => {
  const { sweep, binding } = props;
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
  // per probe: frame slots of u, u - step and u + step, scale slots likewise, the step span, and four shaped points
  const probeData: number[] = [];
  let sealed: boolean = false;
  const open = (): void => {
    if (sealed) throw new Error("a sweep rig takes no slot after it is sealed");
  };
  const slot = (
    at: Map<number, number>,
    list: number[],
    input: number,
  ): number => {
    open();
    const u: number = Math.min(1, Math.max(0, input));
    let s: number | undefined = at.get(u);
    if (s === undefined) {
      s = list.length;
      list.push(u);
      at.set(u, s);
    }
    return s;
  };
  const frame = (u: number): number => slot(frameAt, frameU, u);
  const scale = (u: number): number => slot(scaleAt, scaleU, u);
  // the section point before the scale profile
  const shaped = (u: number, v: number): IAutoMovieSweepSection.IPoint => {
    const p: IAutoMovieSweepSection.IPoint = surface.section(u, v);
    const k: number = surface.scale(u);
    return { x: p.x / k, y: p.y / k };
  };
  const probe = (u: number, v: number): number => {
    open();
    const step: number = surface.step;
    const a: number = Math.max(0, u - step);
    const b: number = Math.min(1, u + step);
    const points: IAutoMovieSweepSection.IPoint[] = [
      shaped(u, v + step),
      shaped(u, v - step),
      shaped(a, v),
      shaped(b, v),
    ];
    probeData.push(
      frame(u),
      frame(a),
      frame(b),
      scale(u),
      scale(a),
      scale(b),
      b - a,
    );
    for (const p of points) probeData.push(p.x, p.y);
    return probeData.length / 15 - 1;
  };

  const sample = (
    u: number,
    v: number,
    cell: readonly [number, number, number, number],
  ): ((out: Float64Array, at: number) => void) => {
    const f: number = 12 * frame(u);
    const slots: number[] = [];
    const xs: number[] = [];
    const ys: number[] = [];
    if (cell.every((d: number): boolean => d === 0)) {
      const p: IAutoMovieSweepSection.IPoint = shaped(u, v);
      slots.push(scale(u));
      xs.push(p.x);
      ys.push(p.y);
    } else {
      // the trapezoid rule over the cell from half the spacing below to half the spacing above, each axis
      const tent = (below: number, above: number): number[][] => {
        const total: number = below + above;
        return total === 0
          ? [[0, 1]]
          : [
              [-below / 2, below / (2 * total)],
              [0, 0.5],
              [above / 2, above / (2 * total)],
            ];
      };
      const angle: number = 2 * Math.PI * v;
      for (const [du, wu] of tent(cell[0], cell[1])) {
        const at: number = Math.min(1, Math.max(0, u + du!));
        let r: number = 0;
        for (const [dv, wv] of tent(cell[2], cell[3]))
          r += wu! * wv! * surface.profile(at, v + dv!);
        slots.push(scale(at));
        xs.push(r * Math.cos(angle));
        ys.push(r * Math.sin(angle));
      }
    }
    const terms: number = slots.length;
    const slot: Int32Array = Int32Array.from(slots);
    const x: Float64Array = Float64Array.from(xs);
    const y: Float64Array = Float64Array.from(ys);
    return (out: Float64Array, at: number): void => {
      let px: number = 0;
      let py: number = 0;
      for (let k: number = 0; k < terms; ++k) {
        const s: number = rig.scales[slot[k]!]!;
        px += s * x[k]!;
        py += s * y[k]!;
      }
      for (let c: number = 0; c < 3; ++c)
        out[at + c] =
          rig.frames[f + c]! +
          (rig.frames[f + 3 + c]! * px + rig.frames[f + 6 + c]! * py);
    };
  };

  const rig: IAutoMovieSweepRig = {
    surface,
    frame,
    scale,
    probe,
    sample,
    seal: (): void => undefined,
    frames: new Float64Array(0),
    scales: new Float64Array(0),
    probes: new Float64Array(0),
    pose: (): void => undefined,
  };
  let restFrames: Float64Array = new Float64Array(0);
  let restScales: Float64Array = new Float64Array(0);
  // a section point of a probe at a frame and scale slot, written at scratch[o]
  const scratch: Float64Array = new Float64Array(12);
  const place = (
    f: number,
    s: number,
    x: number,
    y: number,
    o: number,
  ): void => {
    const k: number = rig.scales[s]!;
    for (let a: number = 0; a < 3; ++a)
      scratch[o + a] =
        rig.frames[12 * f + a]! +
        k * (x * rig.frames[12 * f + 3 + a]! + y * rig.frames[12 * f + 6 + a]!);
  };
  const probeAll = (): void => {
    for (let p: number = 0; p < probeData.length / 15; ++p) {
      const d: number = 15 * p;
      const span: number = probeData[d + 6]!;
      place(
        probeData[d]!,
        probeData[d + 3]!,
        probeData[d + 7]!,
        probeData[d + 8]!,
        0,
      );
      place(
        probeData[d]!,
        probeData[d + 3]!,
        probeData[d + 9]!,
        probeData[d + 10]!,
        3,
      );
      place(
        probeData[d + 1]!,
        probeData[d + 4]!,
        probeData[d + 11]!,
        probeData[d + 12]!,
        6,
      );
      place(
        probeData[d + 2]!,
        probeData[d + 5]!,
        probeData[d + 13]!,
        probeData[d + 14]!,
        9,
      );
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
      const o: number = 6 * p;
      rig.probes[o] = nx / size;
      rig.probes[o + 1] = ny / size;
      rig.probes[o + 2] = nz / size;
      rig.probes[o + 3] = ax;
      rig.probes[o + 4] = ay;
      rig.probes[o + 5] = az;
    }
  };
  const writeFrame = (
    f: IAutoMovieSweepFrame,
    out: Float64Array,
    at: number,
  ): void => {
    [f.origin, f.x, f.y, f.normal].forEach(
      (v: IAutoMovieVector3, k: number): void => {
        out[at + 3 * k] = v.x;
        out[at + 3 * k + 1] = v.y;
        out[at + 3 * k + 2] = v.z;
      },
    );
  };

  rig.seal = (): void => {
    open();
    sealed = true;
    rig.frames = new Float64Array(12 * frameU.length);
    rig.scales = Float64Array.from(scaleU, (u: number): number =>
      surface.scale(u),
    );
    rig.probes = new Float64Array(6 * (probeData.length / 15));
    frameU.forEach((u: number, s: number): void =>
      writeFrame(surface.frame(u), rig.frames, 12 * s),
    );
    restFrames = rig.frames.slice();
    restScales = rig.scales.slice();
    probeAll();
    if (binding === undefined) return;
    rig.pose = bind(binding);
  };

  // the posed sweep: spine, orientation and, with joint stations, volume
  const bind = (bones: {
    points: number[];
    stations: number[][];
  }): ((motion: IAutoMovieBoneBuffer | null) => void) => {
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
    const volume: ((motion: IAutoMovieBoneBuffer) => void) | null =
      props.preserveVolume && joints.some((j: boolean): boolean => j)
        ? preserve(orientation, joints)
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
      if (volume !== null) volume(motion);
      probeAll();
    };
  };

  // volume preservation: the joint factor settled against the rest volume, then every scale slot from its profile
  const preserve = (
    orientation: IAutoMovieSweepOrientation,
    joints: boolean[],
  ): ((motion: IAutoMovieBoneBuffer) => void) => {
    const moments: Float64Array = momentAutoMovieSweepSections(surface);
    const steps: number = moments.length / 3;
    const planes: Float64Array = new Float64Array(12 * (2 * steps + 1));
    const middles: Float64Array = new Float64Array(steps);
    // the rest volume, from the same moments with the rest planes and scale, as `measureAutoMovieSweepVolume` sums it
    for (let j: number = 0; j <= 2 * steps; ++j)
      writeFrame(surface.frame(j / (2 * steps)), planes, 12 * j);
    for (let i: number = 0; i < steps; ++i)
      middles[i] = surface.scale((i + 0.5) / steps);
    const target: number = integrateAutoMovieSweepVolume(
      moments,
      middles,
      planes,
    );
    const previous: ((u: number) => number) | null =
      sweep.scale === undefined
        ? null
        : interpolateAutoMovieSpline({
            knots: sweep.scale.map((k: IAutoMovieSweep.IKnot): number => k.at),
            values: sweep.scale.map(
              (k: IAutoMovieSweep.IKnot): number => k.value,
            ),
          });
    const knots: Float64Array = Float64Array.from(
      [
        ...new Set([
          0,
          1,
          ...sweep.stations.map(
            (st: IAutoMovieSweep.IStation): number => st.at,
          ),
          ...(sweep.scale ?? []).map(
            (k: IAutoMovieSweep.IKnot): number => k.at,
          ),
        ]),
      ].sort((a: number, b: number): number => a - b),
    );
    const jointAt: Set<number> = new Set(
      sweep.stations
        .filter((_: IAutoMovieSweep.IStation, k: number): boolean => joints[k]!)
        .map((st: IAutoMovieSweep.IStation): number => st.at),
    );
    const base: Float64Array = Float64Array.from(
      knots,
      (at: number): number => previous?.(at) ?? 1,
    );
    const joint: Uint8Array = Uint8Array.from(knots, (at: number): number =>
      jointAt.has(at) ? 1 : 0,
    );
    const values: Float64Array = new Float64Array(knots.length);
    const curvature: Float64Array = new Float64Array(knots.length);
    const work: Float64Array = new Float64Array(7 * knots.length + 17);
    let tension: number = 0;
    const profile = (factor: number): void => {
      for (let k: number = 0; k < knots.length; ++k)
        values[k] = base[k]! * (joint[k] === 1 ? factor : 1);
      tension = AutoMovieSpline.fit(
        knots,
        values,
        knots.length,
        0,
        curvature,
        work,
      );
    };
    const at = (u: number): number =>
      AutoMovieSpline.evaluate(
        knots,
        values,
        curvature,
        knots.length,
        0,
        tension,
        u,
      );
    const volume = (factor: number): number => {
      profile(factor);
      for (let i: number = 0; i < steps; ++i)
        middles[i] = at((i + 0.5) / steps);
      return integrateAutoMovieSweepVolume(moments, middles, planes);
    };
    return (): void => {
      for (let j: number = 0; j <= 2 * steps; ++j)
        orientation.frame(j / (2 * steps), planes, 12 * j);
      profile(settleAutoMovieSweepVolume(target, volume));
      for (let k: number = 0; k < scaleU.length; ++k)
        rig.scales[k] = at(scaleU[k]!);
    };
  };
  return rig;
};
