import { AutoMovieEngineQuaternion, AutoMovieEngineVector3, AutoMovieEngineSwivelArcs, AutoMovieEngineKinematics } from "@automovie/engine";
import type {
  IAutoMovieAngleRange,
  IAutoMovieAxisFrame,
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMovieQuaternion,
  IAutoMovieRestFrame,
  IAutoMovieSwivelArcs,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanBendEnclosure } from "./AutoMovieMotionHumanBendEnclosure";
import { motionHumanBendStrain } from "./motionHumanBendStrain";

/*
 * A certified lower bound, over an interval of swivels, of the hand turn's
 * unmade excess: how far the forearm's twist and the wrist's flexion and
 * abduction the hand's turn asks lie past their reserved ranges, the sum the
 * strain adds to `UNMADE` for a place whose turn the forearm and the wrist
 * cannot make (`motionHumanBendStrain`). Where it is positive over a
 * whole arc every place there is unmade, so its strain is at least `UNMADE`
 * plus it.
 *
 * Derivation. A candidate's lower-arm world rotation is `W(ψ) = P · U(ψ) · L ·
 * M`, with the shoulder's parent frame `P`, the upper arm's bone-local rotation
 * `U(ψ)` at swivel `ψ`, the lower arm's rest `L` and the branch's one hinge
 * rotation `M`. `U(ψ)` is a fixed rotation turned about a fixed axis by `ψ`
 * (the swivel parameterisation of Tolani, Goswami and Badler 2000), so the
 * quaternion of the turn the hand asks, `q(ψ) = W(ψ)⁻¹ · R`, is linear in
 * `cos(ψ/2)` and `sin(ψ/2)`, and every entry of its rotation matrix is linear
 * in `cos ψ` and `sin ψ`; each is fitted exactly from three swivels and checked
 * at two more.
 *
 * - The forearm's twist. The strain splits `q` into a swing and a twist about the
 *   forearm's axis `t` (Dobrowolski's swing-twist, `swingTwist`) and reads the
 *   twist's signed angle, `wrap(2 atan2(q_v · t̂, q_w))` for a unit axis. The
 *   vector `(q_w, q_v · t̂)` of two half-angle sinusoids is enclosed by
 *   `AutoMovieMotionHumanBendEnclosure.outer` on the half swivels; where it may
 *   come within `FLOOR` of the origin the twist is undefined (the swing's half
 *   turn) and nothing is certified.
 * - The wrist. The swing `S` turns `t` to `d = q t` about an axis perpendicular
 *   to `t`, so `Sᵀ t = 2 (t · d) t − d`. On a hand whose basis composes its
 *   twist proximally, `Rz(τ) Ry(a) Rx(f)`, with its twist axis along `t` (`σ`
 *   the sign the handedness and the axes' sense give), the decomposition reads
 *   flexion `atan2(m21, m22)` and abduction `atan2(−m20, cos)` from the entries
 *   `m2j = σ (Sᵀ t) · e_j`, which are `−σ d · e_abd`, `t · d` and `−σ d ·
 *   e_flex`: flexion is `atan2(−σ d · e_abd, t · d)` and abduction `asin(σ d ·
 *   e_flex)`, each of sinusoids of the full swivel, enclosed by `outer` and
 *   `middle`.
 * - Each reading may be either chart (`alternateRigJointAngles`: the outer angle
 *   a half turn on, the middle one reflected about its right angle) and any
 *   full-turn alias after the rest frame's lift, so each excess is the least
 *   over both charts' intervals and every shift
 *   (`AutoMovieMotionHumanBendEnclosure.excess`), the excess being convex in
 *   the angle.
 *
 * A hand whose basis is not of that form, or a branch whose rotation fails the
 * premise, bounds the wrist's share by 0 and the twist's alone stands; an arc
 * where the twist itself is not certified is bounded by 0.
 */
export namespace AutoMovieMotionHumanBendUnmadeBound {
  /*
   * The fixed terms of the hand's turn the bound reads.
   */
  export interface IProps {
    /*
     * The shoulder's parent world rotation, the chain's upper world rotation.
     */
    parent: IAutoMovieQuaternion;

    /*
     * The lower arm's rest rotation in the upper arm's frame.
     */
    rest: IAutoMovieQuaternion;

    /*
     * The hand's world rotation the goal asks.
     */
    rotation: IAutoMovieQuaternion;

    /*
     * The forearm's twist axis, as the strain reads it.
     */
    axis: IAutoMovieVector3;

    /*
     * The forearm's twist range, degrees; absent, the twist has no excess.
     */
    range: IAutoMovieAngleRange | null | undefined;

    /*
     * The hand's clinical axes, as the strain decomposes the swing on them;
     * absent, the wrist has no excess.
     */
    handAxes: IAutoMovieJointAxes | undefined;

    /*
     * The hand's rest frame.
     */
    handFrame: IAutoMovieRestFrame | undefined;

    /*
     * The hand's range; null, the wrist has no excess.
     */
    handRange: IAutoMovieJointConstraint | null;
  }

  /*
   * Prepare the unmade-excess bound of one sweep.
   * Parameter props: The fixed hand terms.
   * Returns: Given a branch's upper-arm rotation by swivel and its hinge
   * rotation, the bound's reader over `[low, high]` degrees; null where no
   * term can have an excess.
   */
  export function prepare(
    props: IProps,
  ):
    | ((
        upper: (swivel: number) => IAutoMovieQuaternion,
        lower: IAutoMovieQuaternion,
      ) => (low: number, high: number) => number)
    | null {
    const unit: IAutoMovieVector3 = AutoMovieEngineVector3.normalize(props.axis);
    const twistReserve: IReserve | null = reserved(props.range);
    const scaled: boolean = Math.abs(AutoMovieEngineVector3.length(props.axis) - 1) <= 1e-12;
    const wrist: IWrist | null = wristOf(props, unit);
    if ((twistReserve === null || !scaled) && wrist === null) return null;
    return (
      upper: (swivel: number) => IAutoMovieQuaternion,
      lower: IAutoMovieQuaternion,
    ): ((low: number, high: number) => number) => {
      const turn: (swivel: number) => IAutoMovieQuaternion = (
        swivel: number,
      ): IAutoMovieQuaternion =>
        AutoMovieEngineQuaternion.multiply(
          AutoMovieEngineQuaternion.inverse(
            AutoMovieEngineQuaternion.multiply(
              AutoMovieEngineQuaternion.multiply(
                AutoMovieEngineQuaternion.multiply(props.parent, upper(swivel)),
                props.rest,
              ),
              lower,
            ),
          ),
          props.rotation,
        );

      // The twist's vector, sinusoids of the half swivel.
      const halves: IAutoMovieQuaternion[] = [0, 180, 360].map(turn);
      const w: IAutoMovieSwivelArcs.ISinusoid = fit(
        halves.map((q: IAutoMovieQuaternion): number => q.w),
      );
      const s: IAutoMovieSwivelArcs.ISinusoid = fit(
        halves.map((q: IAutoMovieQuaternion): number => dot(q, unit)),
      );
      for (const swivel of [45, 225]) {
        const q: IAutoMovieQuaternion = turn(swivel);
        const fw: number = AutoMovieMotionHumanBendEnclosure.at(w, swivel / 2);
        const fs: number = AutoMovieMotionHumanBendEnclosure.at(s, swivel / 2);
        const gap: number = Math.min(
          Math.abs(fw - q.w) + Math.abs(fs - dot(q, unit)),
          Math.abs(fw + q.w) + Math.abs(fs + dot(q, unit)),
        );
        if (!(gap <= PREMISE)) return NONE;
      }

      // Where the forearm's axis turns to, sinusoids of the full swivel.
      let pointing: IPointing | null = null;
      if (wrist !== null) {
        const sampled: IAutoMovieVector3[] = [0, 90, 180].map(
          (swivel: number): IAutoMovieVector3 =>
            AutoMovieEngineQuaternion.rotateVector(turn(swivel), unit),
        );
        const along: (
          axis: IAutoMovieVector3,
        ) => IAutoMovieSwivelArcs.ISinusoid = (
          axis: IAutoMovieVector3,
        ): IAutoMovieSwivelArcs.ISinusoid =>
          fit(
            sampled.map((d: IAutoMovieVector3): number => AutoMovieEngineVector3.dot(d, axis)),
          );
        const read: IPointing = {
          flexion: along(wrist.flexion),
          abduction: along(wrist.abduction),
          cosine: along(unit),
        };
        let held: boolean = true;
        for (const swivel of [45, 225]) {
          const d: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
            turn(swivel),
            unit,
          );
          const gap: number =
            Math.abs(
              AutoMovieMotionHumanBendEnclosure.at(read.flexion, swivel) -
                AutoMovieEngineVector3.dot(d, wrist.flexion),
            ) +
            Math.abs(
              AutoMovieMotionHumanBendEnclosure.at(read.abduction, swivel) -
                AutoMovieEngineVector3.dot(d, wrist.abduction),
            ) +
            Math.abs(
              AutoMovieMotionHumanBendEnclosure.at(read.cosine, swivel) -
                AutoMovieEngineVector3.dot(d, unit),
            );
          if (!(gap <= PREMISE)) held = false;
        }
        if (held) pointing = read;
      }

      return (low: number, high: number): number => {
        // The twist must be defined over the arc for the swing to be one.
        const half: AutoMovieMotionHumanBendEnclosure.IInterval | null =
          AutoMovieMotionHumanBendEnclosure.outer(s, w, 1, low / 2, high / 2);
        if (half === null) return 0;
        let sum: number = 0;
        if (twistReserve !== null && scaled)
          sum += AutoMovieMotionHumanBendEnclosure.excess(
            [2 * half[0], 2 * half[1]],
            twistReserve.lo,
            twistReserve.hi,
          );
        if (pointing !== null && wrist !== null) {
          const flexion: AutoMovieMotionHumanBendEnclosure.IInterval | null =
            AutoMovieMotionHumanBendEnclosure.outer(
              AutoMovieEngineSwivelArcs.scaled(pointing.abduction, -wrist.sigma),
              pointing.cosine,
              1,
              low,
              high,
            );
          const abduction: AutoMovieMotionHumanBendEnclosure.IInterval | null =
            AutoMovieMotionHumanBendEnclosure.middle(
              AutoMovieEngineSwivelArcs.scaled(pointing.flexion, wrist.sigma),
              low,
              high,
            );
          if (flexion !== null && abduction !== null) {
            if (wrist.flexionReserve !== null)
              sum += charted(
                flexion,
                false,
                wrist.frame?.flexion,
                wrist.flexionReserve,
              );
            if (wrist.abductionReserve !== null)
              sum += charted(
                abduction,
                true,
                wrist.frame?.abduction,
                wrist.abductionReserve,
              );
          }
        }
        return sum;
      };
    };
  }
}

/*
 * The reserved interval of a range: its ends drawn in by the strain's `RESERVE`
 * share of its width.
 */
interface IReserve {
  /*
   * The reserved start, degrees.
   */
  lo: number;

  /*
   * The reserved end, degrees.
   */
  hi: number;
}
/*
 * The alternatives of `WristSigma`'s site.
 */
type WristSigma = 1 | -1;

/*
 * The hand's admitted basis, read in the swing's frame, and its reserves.
 */
interface IWrist {
  /*
   * The flexion axis.
   */
  flexion: IAutoMovieVector3;

  /*
   * The abduction axis.
   */
  abduction: IAutoMovieVector3;

  /*
   * The sign of the handed twist axis along the forearm's axis.
   */
  sigma: WristSigma;

  /*
   * The hand's rest frame.
   */
  frame: IAutoMovieRestFrame | undefined;

  /*
   * The flexion's reserved interval, or null where it has no range.
   */
  flexionReserve: IReserve | null;

  /*
   * The abduction's reserved interval, or null where it has no range.
   */
  abductionReserve: IReserve | null;
}

/*
 * Where the forearm's axis turns to, as sinusoids of the swivel: along the
 * hand's flexion and abduction axes and along itself.
 */
interface IPointing {
  /*
   * Along the flexion axis.
   */
  flexion: IAutoMovieSwivelArcs.ISinusoid;

  /*
   * Along the abduction axis.
   */
  abduction: IAutoMovieSwivelArcs.ISinusoid;

  /*
   * Along the forearm's own axis.
   */
  cosine: IAutoMovieSwivelArcs.ISinusoid;
}

/*
 * The reader of a branch no bound is certified on.
 */
const NONE: (low: number, high: number) => number = (): number => 0;

/*
 * The largest disagreement of a fitted value with the turn's own the premise
 * admits: rounding of the quaternion products, far below what moves an angle by
 * `SLACK` at `FLOOR`.
 */
const PREMISE: number = 1e-12;

/*
 * A range's reserved interval, or null for no range.
 */
function reserved(
  range: IAutoMovieAngleRange | null | undefined,
): IReserve | null {
  if (range === null || range === undefined) return null;
  const reserve: number =
    motionHumanBendStrain.RESERVE * (range.max - range.min);
  return { lo: range.min + reserve, hi: range.max - reserve };
}

/*
 * The hand's basis where the swing identity reads it: proximal twist along the
 * forearm's axis; null otherwise.
 */
function wristOf(
  props: AutoMovieMotionHumanBendUnmadeBound.IProps,
  unit: IAutoMovieVector3,
): IWrist | null {
  if (props.handAxes === undefined || props.handRange === null) return null;
  const basis: IAutoMovieJointAxes = AutoMovieEngineKinematics.normalizeJointAxes(
    props.handAxes,
    "AutoMovieMotionHumanBendUnmadeBound axes",
  );
  if (basis.rotationOrder === "flexion-abduction-twist") return null;
  if (basis.twistPlacement === "distal") return null;
  if (!(AutoMovieEngineVector3.length(AutoMovieEngineVector3.cross(basis.twist, unit)) <= 1e-12)) return null;
  const handed: number =
    AutoMovieEngineVector3.dot(basis.twist, AutoMovieEngineVector3.cross(basis.flexion, basis.abduction)) >= 0
      ? 1
      : -1;
  const flexionReserve: IReserve | null = reserved(props.handRange.flexion);
  const abductionReserve: IReserve | null = reserved(props.handRange.abduction);
  if (flexionReserve === null && abductionReserve === null) return null;
  return {
    flexion: basis.flexion,
    abduction: basis.abduction,
    sigma: handed * AutoMovieEngineVector3.dot(basis.twist, unit) > 0 ? 1 : -1,
    frame: props.handFrame,
    flexionReserve,
    abductionReserve,
  };
}

/*
 * A sinusoid fitted from its values at the parameter's 0, 90 and 180 degrees.
 */
function fit(values: number[]): IAutoMovieSwivelArcs.ISinusoid {
  return AutoMovieEngineSwivelArcs.fitted(values[0]!, values[1]!, values[2]!);
}

/*
 * The quaternion's vector part along a unit axis.
 */
function dot(q: IAutoMovieQuaternion, unit: IAutoMovieVector3): number {
  return q.x * unit.x + q.y * unit.y + q.z * unit.z;
}

/*
 * The least excess of an axis over both charts and every alias after the rest
 * frame's lift.
 */
function charted(
  rig: AutoMovieMotionHumanBendEnclosure.IInterval,
  middle: boolean,
  frame: IAutoMovieAxisFrame | undefined,
  reserve: IReserve,
): number {
  const alternate: AutoMovieMotionHumanBendEnclosure.IInterval = middle
    ? [180 - rig[1], 180 - rig[0]]
    : [rig[0] + 180, rig[1] + 180];
  return Math.min(
    AutoMovieMotionHumanBendEnclosure.excess(
      lifted(rig, frame),
      reserve.lo,
      reserve.hi,
    ),
    AutoMovieMotionHumanBendEnclosure.excess(
      lifted(alternate, frame),
      reserve.lo,
      reserve.hi,
    ),
  );
}

/*
 * A rest-relative interval as clinical degrees, `sign · rig + neutral`,
 * ordered.
 */
function lifted(
  rig: AutoMovieMotionHumanBendEnclosure.IInterval,
  frame: IAutoMovieAxisFrame | undefined,
): AutoMovieMotionHumanBendEnclosure.IInterval {
  if (frame === undefined) return rig;
  const ends: AutoMovieMotionHumanBendEnclosure.IInterval = [
    frame.sign * rig[0] + frame.neutral,
    frame.sign * rig[1] + frame.neutral,
  ];
  return [Math.min(ends[0], ends[1]), Math.max(ends[0], ends[1])];
}
