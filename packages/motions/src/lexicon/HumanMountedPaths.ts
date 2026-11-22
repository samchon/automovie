import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanMounted,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { hipJoints } from "../posture/hipJoints";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanMountedFrame } from "./HumanMountedFrame";
import type { HumanMountedSeats } from "./HumanMountedSeats";
import { HumanMountedStirrups } from "./HumanMountedStirrups";
import { HumanMountedStride } from "./HumanMountedStride";
import type { HumanMountedTimeline } from "./HumanMountedTimeline";
import { hangMountedLeg } from "./hangMountedLeg";
import { heelMountedFoot } from "./heelMountedFoot";

/**
 * The paths a mounted performance (`HumanMounted`) prepares between its key
 * postures: where the hips are, how far the carrier strays from its
 * stride-averaged path while the performance is out of the saddle, and which
 * feet must swing over the carrier on their way to the next figure.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the three prepared paths.
 * @evidence contracts/development/design.md#principled-representation World or carrier-frame points and metres, prepared once per plan.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The hips, their pivot and swing, the slack and the feet's arcs with their rise, read by the mounted law.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No carrier is named; its frame and colliders are read through the plan's readers.
 */
export namespace HumanMountedPaths {
  /** How far above the higher end of its way a foot that must swing over the carrier passes, thigh lengths (provisional). */
  export const RISE: number = 0.25;

  /**
   * The middle of a posture's hip joints.
   *
   * @param body The body.
   * @param posture The posture.
   * @returns The point, in the posture's frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the point.
   * @evidence contracts/development/implementation.md#principled-implementation The two hip joints the root and attitude place (`hipJoints`), averaged.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure One call.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure read.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function hips(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
  ): IAutoMovieVector3 {
    const joints: Record<AutoMovieHumanSide, IAutoMovieVector3> = hipJoints(
      body,
      posture.root,
      resolveHumanPosture.heading(posture),
      posture.joints.hips,
    );
    return Vector3.lerp(joints.left, joints.right, 0.5);
  }

  /**
   * The point the hips swing about between two keys: the middle of the ankles when both feet stay planted where they are in both keys, as on their stirrups; none otherwise.
   *
   * @param from The earlier key.
   * @param to The later key.
   * @returns The pivot, or none.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States when a pivot exists.
   * @evidence contracts/development/implementation.md#principled-implementation Both legs planted in both keys with their ankles within a millimetre.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure One check per leg.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure read.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function pivot(
    from: IAutoMovieMotionHumanPosture,
    to: IAutoMovieMotionHumanPosture,
  ): IAutoMovieVector3 | undefined {
    const ankles: IAutoMovieVector3[] = [];
    for (const side of ["left", "right"] as const) {
      const a: IAutoMovieHumanLimbGoal | undefined = from.limbs[`${side}Leg`];
      const b: IAutoMovieHumanLimbGoal | undefined = to.limbs[`${side}Leg`];
      if (
        a?.planted !== true ||
        b?.planted !== true ||
        Vector3.distance(a.point, b.point) > 1e-3
      )
        return undefined;
      ankles.push(b.point);
    }
    return Vector3.lerp(ankles[0]!, ankles[1]!, 0.5);
  }

  /**
   * The hips a share of the way between two keys: straight, or about a pivot, the direction turned and the distance from the pivot blended, so the hips never come nearer to or further from the feet than at both ends.
   *
   * @param from The earlier hips.
   * @param to The later hips.
   * @param about The pivot, or none for a straight way.
   * @param share 0 to 1.
   * @returns The hips.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States both ways and what the swing preserves.
   * @evidence contracts/development/implementation.md#principled-implementation Polar interpolation about the pivot: the unit directions blended and renormalised, the radii blended linearly.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure One branch.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Opposite directions fall back to the straight way.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure read.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function swing(
    from: IAutoMovieVector3,
    to: IAutoMovieVector3,
    about: IAutoMovieVector3 | undefined,
    share: number,
  ): IAutoMovieVector3 {
    if (about === undefined) return Vector3.lerp(from, to, share);
    const a: IAutoMovieVector3 = Vector3.subtract(from, about);
    const b: IAutoMovieVector3 = Vector3.subtract(to, about);
    const ra: number = Vector3.length(a);
    const rb: number = Vector3.length(b);
    const turned: IAutoMovieVector3 = Vector3.lerp(
      Vector3.scale(a, 1 / ra),
      Vector3.scale(b, 1 / rb),
      share,
    );
    const length: number = Vector3.length(turned);
    if (length < 1e-6) return Vector3.lerp(from, to, share);
    return Vector3.add(
      about,
      Vector3.scale(turned, (ra + (rb - ra) * share) / length),
    );
  }

  /**
   * A posture whose planted feet bearing on their balls are turned toes-down where the shank would lean past the ankle's range (`heelMountedFoot`).
   *
   * @param body The body.
   * @param posture The posture, in any frame.
   * @returns The posture, its planted leg goals turned where needed.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States which legs are turned.
   * @evidence contracts/development/implementation.md#principled-implementation The posture's own hip joints (`hipJoints`) and each planted leg through `heelMountedFoot`.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure One pass over two legs.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A leg goal attached to a bone or not planted is left as it is.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure read per sample.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function heels(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
  ): IAutoMovieMotionHumanPosture {
    const joints: Record<AutoMovieHumanSide, IAutoMovieVector3> = hipJoints(
      body,
      posture.root,
      resolveHumanPosture.heading(posture),
      posture.joints.hips,
    );
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...posture.limbs };
    for (const side of ["left", "right"] as const) {
      const goal: IAutoMovieHumanLimbGoal | undefined = limbs[`${side}Leg`];
      if (goal?.planted === true && goal.on === undefined)
        limbs[`${side}Leg`] = heelMountedFoot(body, side, goal, joints[side]);
    }
    return { ...posture, limbs };
  }

  /**
   * A posture without arm goals: the arms posed by their joints, so a hand's hold blends from where those joints put it.
   *
   * @param posture The posture.
   * @returns The posture without its arm goals.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is dropped and why.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation Two deletions.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure One copy.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure read.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function unarmed(
    posture: IAutoMovieMotionHumanPosture,
  ): IAutoMovieMotionHumanPosture {
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...posture.limbs };
    delete limbs.leftArm;
    delete limbs.rightArm;
    return { ...posture, limbs };
  }

  /**
   * Where a figure's held contacts are at a film second, in the carrier frame then: the points the hands must keep in reach.
   *
   * @param support The carrier.
   * @param figure The figure.
   * @param now The carrier frame at the second.
   * @param film Film seconds.
   * @returns Each holding hand's contact point, in the carrier frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the points and their frame.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation One inverse transform per hand.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure One loop over two hands.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure read.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function grips(
    support: IAutoMovieMotionHumanPropReader,
    figure: IAutoMovieMotionHumanMounted.IFigure,
    now: IAutoMovieRigidTransform,
    film: number,
  ): Partial<Record<AutoMovieHumanSide, IAutoMovieVector3>> {
    const out: Partial<Record<AutoMovieHumanSide, IAutoMovieVector3>> = {};
    for (const side of ["left", "right"] as const) {
      const id: string | undefined = figure.supports?.[`${side}Hand`];
      if (id !== undefined)
        out[side] = Quaternion.rotateVector(
          Quaternion.inverse(now.rotation),
          Vector3.subtract(
            HumanMountedFrame.contact(support, id, film),
            now.position,
          ),
        );
    }
    return out;
  }

  /**
   * Whether a figure names its supports: a figure that names any is held by those alone, so a foot it does not name leaves its stirrup in the figure's transfer (its window closes where the transfer starts) and hangs; a figure that names none keeps the entry's feet as they were.
   *
   * @param figure The figure.
   * @returns True when it names any support.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the test.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation One read.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure One expression.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure read.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function names(figure: IAutoMovieMotionHumanMounted.IFigure): boolean {
    return (
      figure.supports !== undefined && Object.keys(figure.supports).length !== 0
    );
  }

  /**
   * The entered seat for a figure: the entry as it was, or, where the figure names the stirrups it keeps, the entry with each planted foot it does not name hanging free (`hangMountedLeg`), a stirrup lost.
   *
   * @param body The body.
   * @param entry The entered posture, in the carrier frame.
   * @param figure The entered figure.
   * @param planted Whether each entry foot stands on something.
   * @returns The figure's key posture.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States when a foot hangs.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation One choice per leg.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure One loop over two legs.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A figure that names no stirrup keeps the entry's feet as they were.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure read.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function entered(
    body: IAutoMovieMotionHumanBody,
    entry: IAutoMovieMotionHumanPosture,
    figure: IAutoMovieMotionHumanMounted.IFigure,
    planted: Readonly<Record<AutoMovieHumanSide, boolean>>,
  ): IAutoMovieMotionHumanPosture {
    if (!names(figure)) return entry;
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...entry.limbs };
    for (const side of ["left", "right"] as const)
      if (planted[side] && figure.supports?.[`${side}Foot`] === undefined)
        limbs[`${side}Leg`] = hangMountedLeg(body, entry, side);
    return { ...entry, limbs };
  }

  /**
   * The contact window a figure's supporting part holds on the carrier: a grip for a hand, a plant for a sole (on its stirrup's own frame when one is named), a knee bearing on its region, the right thigh bearing over its bar.
   *
   * @param part The supporting part.
   * @param on The carrier's subject id.
   * @param point The carrier's point the part rests on, when the figure names one.
   * @returns The window over the whole performance, which the clock then cuts.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each part's window.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation A table read.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure One choice per part.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure read.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a new window.
   */
  export function window(
    part: HumanMountedSeats.Part,
    on: string,
    point?: string,
  ): IAutoMovieMotionHumanContactWindow {
    const support: IAutoMovieMotionHumanContactWindow["support"] = {
      kind: "prop",
      subject: on,
    };
    if (part === "leftHand" || part === "rightHand")
      return { part, kind: "grip", from: 0, to: 1, support };
    // A sole on a named stirrup rides the stirrup's own frame, which swings
    // on the moving horse, not the horse's; the ball is what bears on the
    // tread, the point a leg aid turns the foot about, so it is the contact.
    if (part === "leftFoot" || part === "rightFoot")
      return {
        part,
        kind: "plant",
        from: 0,
        to: 1,
        support:
          point === undefined ? support : { kind: "prop", subject: on, point },
        socket: "ball",
      };
    if (part === "leftKnee")
      return {
        part: "leftLowerLeg",
        kind: "bear",
        from: 0,
        to: 1,
        support,
        region: "kneeLeft",
      };
    if (part === "rightKnee")
      return {
        part: "rightLowerLeg",
        kind: "bear",
        from: 0,
        to: 1,
        support,
        region: "kneeRight",
      };
    return { part: "rightUpperLeg", kind: "bear", from: 0, to: 1, support };
  }

  /**
   * How far the carrier contact rises or falls from its stride-averaged path while the performance is out of the saddle, read in world height so the course's own travel does not count.
   *
   * @param carrier The carrier frame reader.
   * @param start The performance's start, film seconds.
   * @param clock The performance's clock.
   * @param figures The figures.
   * @param stride The stride, seconds; none gives 0.
   * @returns The greatest departure, metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is measured, over which spans and in which direction.
   * @evidence contracts/development/implementation.md#principled-implementation The contact's height against `HumanMountedStride.level`'s average, sampled `2 SAMPLES` times a stride over each out-of-saddle figure's transfer and hold.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure One loop per figure.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Seated figures are not read; a performance with no stride has no slack.
   * @evidence contracts/development/implementation.md#efficient-algorithms Sixteen samples a stride, each `SAMPLES` plus one carrier readings.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Read once per plan.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function slack(
    carrier: HumanMountedFrame.Reader,
    start: number,
    clock: HumanMountedTimeline,
    figures: readonly IAutoMovieMotionHumanMounted.IFigure[],
    stride: number | undefined,
  ): number {
    let most: number = 0;
    if (stride === undefined) return most;
    figures.forEach(
      (figure: IAutoMovieMotionHumanMounted.IFigure, i: number): void => {
        if (!HumanMountedStirrups.free(figure.seat)) return;
        const from: number = start + clock.starts[i]!;
        const span: number =
          clock.arrivals[i]! - clock.starts[i]! + figure.seconds;
        const count: number = Math.ceil(
          (2 * HumanMountedStride.SAMPLES * span) / stride,
        );
        for (let k: number = 0; k <= count; ++k) {
          const at: number = from + (k / count) * span;
          const level: IAutoMovieVector3 = HumanMountedStride.level(
            carrier,
            at,
            { x: 0, y: 0, z: 0 },
            stride,
          );
          most = Math.max(most, Math.abs(carrier(at).position.y - level.y));
        }
      },
    );
    return most;
  }

  /**
   * The feet that swing over the carrier into each figure: a foot whose straight way to its next place would pass through the carrier's colliders passes instead through a point above the higher end, `RISE` thighs up, midway along; a foot kept on the same stirrup stays on it.
   *
   * @param seats The seats' context, for the body and the colliders.
   * @param entry The entered posture in the carrier frame.
   * @param keys Each figure's key posture.
   * @param figures The figures.
   * @param planted Whether each entry foot stands on something.
   * @returns For each figure, the waypoint of each foot that swings.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States when a foot swings and through which point.
   * @evidence contracts/development/implementation.md#principled-implementation Four collider distance queries along the straight way against the shank's radius; the waypoint is the middle of a quadratic arc the law adds to the blended ankle.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure One loop per figure and side.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A foot kept on its stirrup never leaves it.
   * @evidence contracts/development/implementation.md#efficient-algorithms At most four collider queries per foot per figure.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Read once per plan.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one small record per figure.
   */
  export function arcs(
    seats: HumanMountedSeats.IContext,
    entry: IAutoMovieMotionHumanPosture,
    keys: readonly IAutoMovieMotionHumanPosture[],
    figures: readonly IAutoMovieMotionHumanMounted.IFigure[],
    planted: Readonly<Record<AutoMovieHumanSide, boolean>>,
  ): Partial<Record<AutoMovieHumanSide, IAutoMovieVector3>>[] {
    const m: IAutoMovieMotionHumanBody["measure"] = seats.body.measure;
    return keys.map(
      (
        key: IAutoMovieMotionHumanPosture,
        i: number,
      ): Partial<Record<AutoMovieHumanSide, IAutoMovieVector3>> => {
        const out: Partial<Record<AutoMovieHumanSide, IAutoMovieVector3>> = {};
        for (const side of ["left", "right"] as const) {
          const a: IAutoMovieVector3 | undefined = (
            i === 0 ? entry : keys[i - 1]!
          ).limbs[`${side}Leg`]?.point;
          const b: IAutoMovieVector3 | undefined =
            key.limbs[`${side}Leg`]?.point;
          const was: string | undefined =
            i === 0
              ? planted[side]
                ? figures[0]!.supports?.[`${side}Foot`]
                : undefined
              : figures[i - 1]!.supports?.[`${side}Foot`];
          if (
            a === undefined ||
            b === undefined ||
            Vector3.distance(a, b) < 1e-6 ||
            (was !== undefined && was === figures[i]!.supports?.[`${side}Foot`])
          )
            continue;
          let clear: boolean = true;
          for (let k: number = 0; k < 4 && clear; ++k)
            clear =
              seats.clear(
                Vector3.lerp(a, b, k / 4),
                Vector3.lerp(a, b, (k + 1) / 4),
              ) >= m.shankRadius;
          if (!clear)
            out[side] = {
              x: b.x,
              y: Math.max(a.y, b.y) + RISE * m.thigh,
              z: (a.z + b.z) / 2,
            };
        }
        return out;
      },
    );
  }
}
