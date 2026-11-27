import {
  type IAutoMovieRigSurfaceCurve,
  type IAutoMovieSurfaceCurveRig,
  type IAutoMovieSurfacePoint,
  type IAutoMovieSweepTransport,
  IAutoMovieVector3,
} from "@automovie/interface";

import { transportSweepSpine } from "./transportSweepSpine";

/*
 * Compile a network curve for per-pose evaluation.
 *
 * The curve is the centripetal Catmull-Rom spline through its start node, its
 * through points and its end node, by chord-length share. At a node on a sweep
 * its end direction is the spline's own less its part along the sweep's normal
 * there, so it leaves or reaches the sweep in the sweep's tangent plane. A
 * bridge leaving the curve under the `across` rule takes the declared normal at
 * mid-curve, turning linearly toward each end to the sweep's normal at a sweep
 * node; under the other rules it takes the declared direction. Through points,
 * the normal and the direction ride the curve's bone when it has one, and the
 * nodes are written by their own rig.
 * Parameter props.name: The curve's name, for diagnostics.
 * Parameter props.curve: The curve, only read.
 * Parameter props.from: The start node.
 * Parameter props.to: The end node.
 * Parameter props.bone: Bone index of the through points, normal and direction, or
 * -1 for none.
 * Parameter props.bones: The rig's bone motions, or null for a rig without bones.
 * Returns: The curve's rig.
 * Error from `update` when the curve meets a sweep along its normal or
 * the spline is refused by `transportSweepSpine`.
 */
export const rigSurfaceCurve: (
  props: IAutoMovieRigSurfaceCurve.IProps,
) => IAutoMovieSurfaceCurveRig = (
  props: IAutoMovieRigSurfaceCurve.IProps,
): IAutoMovieSurfaceCurveRig => {
  const { name, curve, from, to, bone, bones } = props;
  const through: IAutoMovieVector3[] = curve.through ?? [];
  const n: number = through.length + 2;
  const transport: IAutoMovieSweepTransport = transportSweepSpine(
    n,
    false,
  );
  const rest: Float64Array = Float64Array.from(
    through.flatMap((p: IAutoMovieVector3): number[] => [p.x, p.y, p.z]),
  );
  // the declared normal and direction at rest, then as turned for the current pose
  const declared: Float64Array = new Float64Array(6);
  if (curve.normal !== undefined)
    declared.set([curve.normal.x, curve.normal.y, curve.normal.z], 0);
  if (curve.direction !== undefined)
    declared.set([curve.direction.x, curve.direction.y, curve.direction.z], 3);
  const turned: Float64Array = declared.slice();
  const scratch: Float64Array = new Float64Array(9);
  const moving: boolean = bone >= 0 && bones !== null;

  // an end on a sweep: the spline's own direction there less its part along the sweep's normal
  const flatten = (
    end: IAutoMovieSurfacePoint,
    u: number,
    target: Float64Array,
  ): void => {
    if (end.probe === null) return;
    transport.tangent(u, scratch, 0);
    const p: number = 6 * end.probe.slot;
    const normal: Float64Array = end.probe.rig.probes;
    const dot: number =
      scratch[0]! * normal[p]! +
      scratch[1]! * normal[p + 1]! +
      scratch[2]! * normal[p + 2]!;
    for (let a: number = 0; a < 3; ++a)
      target[a] = scratch[a]! - normal[p + a]! * dot;
    if (!(Math.hypot(target[0]!, target[1]!, target[2]!) > FLAT))
      throw new Error(`curve ${name} meets a sweep along its normal`);
  };
  const update = (): void => {
    from.write(transport.points, 0);
    to.write(transport.points, 3 * (n - 1));
    for (let k: number = 0; k < through.length; ++k)
      if (moving)
        bones!.apply(bone, rest, 3 * k, transport.points, 3 * (k + 1));
      else
        for (let a: number = 0; a < 3; ++a)
          transport.points[3 * (k + 1) + a] = rest[3 * k + a]!;
    if (moving) {
      bones!.turn(bone, declared, 0, turned, 0);
      bones!.turn(bone, declared, 3, turned, 3);
    }
    transport.start.fill(0);
    transport.end.fill(0);
    transport.update();
    if (from.probe === null && to.probe === null) return;
    flatten(from, 0, transport.start);
    flatten(to, 1, transport.end);
    transport.update();
  };
  // the unit normal at a node: its sweep's, or the declared one off a sweep
  const endNormal = (end: IAutoMovieSurfacePoint, at: number): void => {
    if (end.probe === null)
      for (let a: number = 0; a < 3; ++a) scratch[at + a] = turned[a]!;
    else
      for (let a: number = 0; a < 3; ++a)
        scratch[at + a] = end.probe.rig.probes[6 * end.probe.slot + a]!;
  };
  const normal = (t: number, out: Float64Array, at: number): void => {
    if (curve.normal === undefined)
      throw new Error(
        `curve ${name} needs a normal to be part of this bridge loop`,
      );
    const size: number = Math.hypot(turned[0]!, turned[1]!, turned[2]!);
    // the declared normal holds at mid-curve; toward an end on a sweep it turns to that sweep's own normal there
    for (let a: number = 0; a < 3; ++a) scratch[a] = turned[a]! / size;
    endNormal(t < 0.5 ? from : to, 3);
    if (from.probe === null && t < 0.5)
      for (let a: number = 0; a < 3; ++a) scratch[3 + a] = scratch[a]!;
    if (to.probe === null && t >= 0.5)
      for (let a: number = 0; a < 3; ++a) scratch[3 + a] = scratch[a]!;
    const w: number = t < 0.5 ? t / 0.5 : (t - 0.5) / 0.5;
    for (let a: number = 0; a < 3; ++a)
      out[at + a] =
        t < 0.5
          ? scratch[3 + a]! + (scratch[a]! - scratch[3 + a]!) * w
          : scratch[a]! + (scratch[3 + a]! - scratch[a]!) * w;
    const length: number = Math.hypot(out[at]!, out[at + 1]!, out[at + 2]!);
    for (let a: number = 0; a < 3; ++a) out[at + a] = out[at + a]! / length;
  };
  const direction = (out: Float64Array, at: number): void => {
    if (curve.direction === undefined)
      throw new Error(
        `curve ${name} needs a direction to be part of this bridge loop`,
      );
    const size: number = Math.hypot(turned[3]!, turned[4]!, turned[5]!);
    for (let a: number = 0; a < 3; ++a) out[at + a] = turned[3 + a]! / size;
  };
  return {
    update,
    point: (t: number, out: Float64Array, at: number): void =>
      transport.point(t, out, at),
    normal,
    direction,
  };
};

/*
 * Shortest tangent part a curve keeps in a sweep's tangent plane before it is
 * refused as meeting the sweep along its normal.
 */
const FLAT: number = 1e-9;
