import {
  HUMANOID_REST_FRAME,
  Quaternion,
  Vector3,
  toRigAngle,
} from "@automovie/engine";
import type {
  IAutoMovieAngleRange,
  IAutoMovieJointAxes,
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanArmGeometry as G } from "./HumanArmGeometry";

/** The two admitted unit axes that affect wrist span. */
type WristAxes = Pick<IAutoMovieJointAxes, "flexion" | "twist">;

/**
 * The native wrist's inner reach radius. A flexion hinge with locked abduction
 * and a distal forearm twist has a proven radius. Other rigs use zero, the
 * lower bound valid without those assumptions.
 *
 * @param setup The native arm setup.
 * @returns The conservative minimum wrist radius, metres.
 */
export function HumanArmWristShell(
  setup: IAutoMovieMotionHumanArmGeometry.ISetup,
): number {
  const flexion: IAutoMovieAngleRange | null | undefined =
    setup.constraint.lower?.flexion;
  if (flexion === null || flexion === undefined || setup.free[4]) return 0;
  const bone: IAutoMovieMotionHumanArmGeometry.ISetup["bones"]["lower"] =
    setup.bones.lower;
  const frame = HUMANOID_REST_FRAME[bone];
  const fixed: number = G.clamped(setup, bone, [0, 0, 0])[1];
  if (toRigAngle(fixed, frame?.abduction) !== 0) return 0;
  const basis: IAutoMovieJointAxes = setup.basis(bone, "wrist reach shell");
  if (
    basis.rotationOrder !== "flexion-abduction-twist" &&
    basis.twistPlacement !== "distal"
  )
    return 0;
  const from: number = toRigAngle(flexion.min, frame?.flexion)!;
  const to: number = toRigAngle(flexion.max, frame?.flexion)!;
  return HumanArmWristShell.radius(
    Quaternion.rotateVector(
      Quaternion.inverse(setup.rest.lower.rotation),
      setup.rest.lower.translation,
    ),
    setup.rest.hand.translation,
    basis,
    { min: Math.min(from, to), max: Math.max(from, to) },
  );
}

/** The radius primitive of a bounded two-bone wrist shell. */
export namespace HumanArmWristShell {
  /**
   * The hinge's squared span is a sinusoid of its angle (Tolani, Goswami and
   * Badler 2000, section 3.2). Read its two end stops and any interior minimum.
   * Distal twist can move the wrist by at most twice its perpendicular distance
   * to the twist axis, which the reverse triangle inequality subtracts from the
   * hinge-only radius.
   *
   * @param upper The upper arm's offset in the lower arm's rest frame.
   * @param lower The wrist's offset in the same frame.
   * @param axes The unit flexion and distal-twist axes.
   * @param range The flexion stops, degrees relative to rest.
   * @returns The lower bound on the wrist radius, metres.
   */
  export function radius(
    upper: IAutoMovieVector3,
    lower: IAutoMovieVector3,
    axes: WristAxes,
    range: IAutoMovieAngleRange,
  ): number {
    const along: IAutoMovieVector3 = Vector3.scale(
      axes.flexion,
      Vector3.dot(axes.flexion, lower),
    );
    const moving: IAutoMovieVector3 = Vector3.subtract(lower, along);
    const fixed: IAutoMovieVector3 = Vector3.add(upper, along);
    const constant: number =
      Vector3.dot(fixed, fixed) + Vector3.dot(moving, moving);
    const cosine: number = 2 * Vector3.dot(fixed, moving);
    const sine: number =
      2 * Vector3.dot(fixed, Vector3.cross(axes.flexion, moving));
    const radian: number = Math.PI / 180;
    const first: number = range.min * radian;
    const last: number = range.max * radian;
    const period: number = 2 * Math.PI;
    const phase: number = Math.atan2(sine, cosine) + Math.PI;
    const nearest: number =
      phase + period * Math.ceil((first - phase) / period);
    const at = (t: number): number => cosine * Math.cos(t) + sine * Math.sin(t);
    const least: number =
      nearest <= last
        ? -Math.hypot(cosine, sine)
        : Math.min(at(first), at(last));
    const travel: number = 2 * Vector3.length(Vector3.cross(lower, axes.twist));
    return Math.max(0, Math.sqrt(Math.max(0, constant + least)) - travel);
  }
}
