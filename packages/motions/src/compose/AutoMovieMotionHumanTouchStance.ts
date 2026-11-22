import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieMotionHumanChannel,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanLeanInto,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionHumanRange,
  IAutoMovieMotionHumanReach,
  IAutoMovieMotionHumanRise,
  IAutoMovieMotionHumanTouchStance,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { AutoMovieMotionHumanLeanInto } from "./AutoMovieMotionHumanLeanInto";
import { AutoMovieMotionHumanLeg } from "./AutoMovieMotionHumanLeg";
import { AutoMovieMotionHumanRange } from "./AutoMovieMotionHumanRange";
import { AutoMovieMotionHumanReach } from "./AutoMovieMotionHumanReach";
import { AutoMovieMotionHumanRise } from "./AutoMovieMotionHumanRise";

/**
 * What the body behind the arm does so a hand reaches a region its arm
 * alone does not: the shoulder girdle lifted and a rise onto the toes for a
 * region above the shoulder, then a lean from the hips for what is still
 * beyond the arm.
 *
 * A person reaching up to a taller person's face, or to a shelf, lifts the
 * shoulder with the arm (the scapula turns up as the arm is raised, Inman,
 * Saunders and Abbott 1944) and then raises the heels, because leaning
 * forward lowers the shoulder and takes it away from a place above it. Each
 * moves by the least angle that brings the wrist within the kept share of
 * the arm, and no further than the shoulder needs to come level with the
 * wrist or than its limit (`GIRDLE`, `RAISE`). What remains is leaned into
 * (`AutoMovieMotionHumanLeanInto`). A region off to the side that the forward
 * lean leaves out of reach is turned toward first: the trunk twists about
 * its long axis by the heading's angle to the line from the shoulder to the
 * wrist, shared by the lumbar and thoracic spine within their twist ranges,
 * as a person turns the chest toward a hand reaching across the body. The
 * lean, solved again on the turned trunk, refuses a region still out of
 * reach at its limit.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two movements, their order, why the rise comes first, what bounds each and who refuses.
 * @evidence contracts/development/design.md#principled-representation A girdle angle, a heel angle and a lean solved once from the wrist's place on the posture, the body's three ways of closing a reach without a step.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The two limits, the props, the solved stance and its solver; read by the touch law.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The wrist is the caller's own goal and the rise and the lean are their owners', so no region, effector or body is named here.
 */
export namespace AutoMovieMotionHumanTouchStance {
  /** The most the heels rise, degrees (provisional, the kiss law's limit: past it the foot stands on the toes' tips). */
  export const RAISE: number = 35;

  /** The share of the shoulder girdle's range of elevation a reach lifts it by at most (provisional: Inman, Saunders and Abbott 1944 give the scapula a third of the arm's elevation; the share was not read from a source). */
  export const GIRDLE: IAutoMovieMotionHumanRange.Level = "half";

  /**
   * Solve the stance of a stroke.
   *
   * @param props The body, the standing posture, the feet, the hand, the share and the wrist's goal.
   * @returns The stance.
   * @throws {HumanRefusal} When the wrist is beyond the kept share at the lean's limit, on the first read of the lean.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the result and the refusal; the namespace states the movements.
   * @evidence contracts/development/implementation.md#principled-implementation The wrist's distance beyond the kept share falls monotonically while the shoulder rises toward the wrist's height, so the least girdle angle, then the least heel angle, is its bisected root; each is taken only for a wrist above the shoulder that it brings nearer, and the lean is solved on the risen posture.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The reach at a girdle and a heel angle, one rule for the least of either (`least`), the lean, the primitives.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A region the rise does not bring nearer keeps the heels down; nothing is clamped, the lean refuses what remains.
   * @evidence contracts/development/implementation.md#efficient-algorithms Retains every original girdle/heel endpoint, bisection and three-progress reach probe. One fixed shoulder demand serves them, and each three-progress operation shares exact FK prerequisites without full bone output. Runtime lean/lowering borrow current-person metadata; speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Rise, LeanInto and raw lowering retain their original owners; Reach.prepareCheck binds only static body/limb names. Every original wrist callback/check still executes in order with its current posture, while dynamic workspaces stay local to that reach/write.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned stance owns props, fixed solved angles/feet and lean metadata until release. Every three-progress FK getter and runtime loan releases on synchronous return or throw; no sampled root, pose, wrist or query history enters plan state.
   */
  export function solve(
    props: IAutoMovieMotionHumanTouchStance.IProps,
  ): IAutoMovieMotionHumanTouchStance.IStance {
    const { body, standing, feet } = props;
    const shoulder: "leftShoulder" | "rightShoulder" = `${props.side}Shoulder`;
    const checkReach: ReturnType<
      typeof AutoMovieMotionHumanReach.prepareCheck
    > = AutoMovieMotionHumanReach.prepareCheck(body, `${props.side}Arm`);

    // A posture with the working girdle lifted and the heels raised.
    const moved: (
      posture: IAutoMovieMotionHumanPosture,
      girdle: number,
      degrees: number,
      ankles?: IAutoMovieMotionHumanRise.Stance,
      share?: number,
    ) => IAutoMovieMotionHumanPosture = (
      posture: IAutoMovieMotionHumanPosture,
      girdle: number,
      degrees: number,
      ankles: IAutoMovieMotionHumanRise.Stance | undefined = feet,
      share: number = 1,
    ): IAutoMovieMotionHumanPosture => {
      posture = props.girdles?.(posture, share) ?? posture;
      const was: readonly [number, number, number] = posture.joints[
        shoulder
      ] ?? [0, 0, 0];
      return {
        ...posture,
        root:
          ankles === undefined || degrees === 0
            ? posture.root
            : Vector3.add(
                posture.root,
                AutoMovieMotionHumanRise.lift(body, ankles, degrees),
              ),
        joints:
          girdle === 0
            ? posture.joints
            : {
                ...posture.joints,
                [shoulder]: [was[0], was[1] + girdle, was[2]],
              },
      };
    };

    // The trunk turned about its long axis, the lumbar and the thoracic spine
    // each taking the share of the turn their own twist range holds.
    const twisted = (
      posture: IAutoMovieMotionHumanPosture,
      degrees: number,
    ): IAutoMovieMotionHumanPosture => {
      if (degrees === 0) return posture;
      const motion: IAutoMovieMotionHumanRange.Motion =
        degrees > 0 ? "external" : "internal";
      const spans: readonly number[] = TWISTED.map(
        (bone: TwistedBone): number =>
          AutoMovieMotionHumanRange.degrees(bone, motion, "full"),
      );
      const total: number = spans.reduce(
        (sum: number, span: number): number => sum + span,
        0,
      );
      const joints: IAutoMovieMotionHumanPosture["joints"] = {
        ...posture.joints,
      };
      TWISTED.forEach((bone: TwistedBone, k: number): void => {
        const was: readonly [number, number, number] = joints[bone] ?? [0, 0, 0];
        joints[bone] = [was[0], was[1], was[2] + (degrees * spans[k]!) / total];
      });
      return { ...posture, joints };
    };

    // The turn toward a wrist off to the side: the heading's angle to the
    // line from the shoulder to the wrist across the floor, positive toward
    // the left as the spine's twist is, within the two bones' whole range.
    const toward = (posture: IAutoMovieMotionHumanPosture): number => {
      const wrist: IAutoMovieVector3 = props.wrist(posture, 0);
      const from: IAutoMovieVector3 = checkReach(
        posture,
        wrist,
        prepareHumanPoseResolution(),
      ).root;
      const yaw: number = (posture.yaw * Math.PI) / 180;
      const dx: number = wrist.x - from.x;
      const dz: number = wrist.z - from.z;
      const left: number = dx * Math.cos(yaw) - dz * Math.sin(yaw);
      const ahead: number = dx * Math.sin(yaw) + dz * Math.cos(yaw);
      const angle: number = (Math.atan2(left, ahead) * 180) / Math.PI;
      const range: number = TWISTED.reduce(
        (sum: number, bone: TwistedBone): number =>
          sum +
          Math.abs(
            AutoMovieMotionHumanRange.degrees(
              bone,
              angle > 0 ? "external" : "internal",
              "full",
            ),
          ),
        0,
      );
      return Math.max(-range, Math.min(range, angle));
    };

    // The worst of the stroke's start, middle and end on a posture: how far
    // the wrist lies beyond the kept share, and how far above the shoulder.
    const probes: readonly number[] = props.fixed === true ? [0] : [0, 0.5, 1];
    const reach: (posture: IAutoMovieMotionHumanPosture) => IReach = (
      posture: IAutoMovieMotionHumanPosture,
    ): IReach => {
      const resolution: ReturnType<typeof prepareHumanPoseResolution> =
        prepareHumanPoseResolution();
      let worst: IReach = { beyond: -Infinity, above: 0 };
      for (const progress of probes) {
        const wrist: IAutoMovieVector3 = props.wrist(posture, progress);
        const check: IAutoMovieMotionHumanReach.ICheck = checkReach(
          posture,
          wrist,
          resolution,
        );
        const beyond: number = check.distance - props.share * check.length;
        if (beyond > worst.beyond)
          worst = { beyond, above: wrist.y - check.root.y };
      }
      return worst;
    };

    // The girdle first, as it rises with the arm, then the heels.
    const girdle: number = least(
      AutoMovieMotionHumanRange.degrees(shoulder, "abduction", GIRDLE),
      (degrees: number): IReach => reach(moved(standing, degrees, 0)),
    );
    const raise: number =
      feet === undefined
        ? 0
        : least(
            RAISE,
            (degrees: number): IReach =>
              reach(moved(standing, girdle, degrees)),
          );

    const upright: IAutoMovieMotionHumanPosture = moved(standing, girdle, raise);
    const leanOn = (
      posture: IAutoMovieMotionHumanPosture,
    ): IAutoMovieMotionHumanLeanInto.ILean =>
      AutoMovieMotionHumanLeanInto.solve({
        body,
        standing: posture,
        ...(props.balance === true ? { balance: true } : {}),
        side: props.side,
        share: props.share,
        wrist: props.wrist,
        ...(props.arm === undefined ? {} : { arm: props.arm }),
        refuse: props.refuse,
      });

    // The forward lean first; a wrist it leaves out of reach to the side is
    // turned toward by the trunk, by the heading's angle to the line from
    // the shoulder to the wrist (`turn`), and the lean is solved again on the
    // turned trunk, which refuses what is still out of reach.
    let turn: number = 0;
    let lean: IAutoMovieMotionHumanLeanInto.ILean = leanOn(upright);
    let arrival: number;
    try {
      arrival = lean.pitch(upright, 0);
    } catch (error) {
      turn = toward(upright);
      if (
        turn === 0 ||
        !(error instanceof HumanRefusal) ||
        error.kind !== "reach" ||
        error.axis !== "target"
      )
        throw error;
      lean = leanOn(twisted(upright, turn));
      arrival = lean.pitch(twisted(upright, turn), 0);
    }
    const risen: IAutoMovieMotionHumanPosture = twisted(upright, turn);
    const leaning: boolean =
      arrival > 0 ||
      probes
        .slice(1)
        .some((progress: number): boolean => lean.pitch(risen, progress) > 0);
    const tipped: IAutoMovieMotionHumanPosture = lean.tip(risen, arrival);
    const reached: IAutoMovieMotionHumanPosture = feet !== undefined && raise > 0
      ? planted(tipped, feet, raise)
      : leaning ? { ...tipped, root: resolveHumanPosture.lower(body, tipped).root } : risen;
    return {
      girdle,
      raise,
      leaning,
      risen,
      reached,
      primitives: (
        clock: IAutoMovieMotionClock,
        correction?: IAutoMovieMotionHumanTouchStance.ICorrection,
      ): IAutoMovieMotionHumanPrimitive[] => {
        if (props.girdles === undefined && girdle === 0 && raise === 0 && turn === 0 && props.fixed !== true && correction === undefined)
          return leaning ? [lean.primitive(clock)] : [];
        if (props.girdles === undefined && girdle === 0 && raise === 0 && turn === 0 && !leaning) return correction === undefined
          ? [] : [{ channels: [correction.channel], from: 0, to: clock.duration, write: correction.write }];
        const share: (seconds: number) => number = (seconds: number): number =>
          clock.envelope(["start", "ready"], ["relax", "end"], seconds);
        const channels: AutoMovieMotionHumanChannel[] = raise > 0
          ? ["root", "trunk", "leftLeg", "rightLeg"]
          : leaning ? ["root", "trunk"] : ["trunk"];
        if (correction !== undefined && !channels.includes(correction.channel))
          channels.push(correction.channel);
        return [
          {
            channels,
            from: 0,
            to: clock.duration,
            write: (
              posture: IAutoMovieMotionHumanPosture,
              seconds: number,
              _before?: IAutoMovieMotionHumanPrimitive.Reader,
              resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
              projection?: Parameters<IAutoMovieMotionHumanPrimitive["write"]>[4],
            ): IAutoMovieMotionHumanPosture => {
              const k: number = share(seconds);
              const degrees: number = raise * (props.heels?.(clock, seconds) ?? k);
              const ankles: IAutoMovieMotionHumanRise.Stance | undefined =
                degrees === 0 ? undefined : props.placements?.(posture) ?? feet;
              const up: IAutoMovieMotionHumanPosture = twisted(
                moved(posture, girdle * k, degrees, ankles, k),
                turn * k,
              );

              // The lean is read at the full rise, so its angle does not
              // change with the share of the rise shown.
              const leaned: IAutoMovieMotionHumanPosture = leaning
                ? lean.tip(
                    up,
                    k *
                      (props.fixed === true
                        ? arrival
                        : lean.pitch(
                            twisted(moved(posture, girdle, raise, ankles), turn),
                            clock.progress("strokeStart", "strokeEnd", seconds),
                            resolution,
                          )),
                  )
                : up;
              const settled: IAutoMovieMotionHumanPosture = ankles !== undefined
                ? planted(leaned, ankles, degrees, resolution)
                : leaning
                  ? {
                      ...leaned,
                      root: resolveHumanPosture.lower(
                        body,
                        leaned,
                        undefined,
                        resolution,
                      ).root,
                    }
                  : leaned;
              return correction === undefined ? settled
                : correction.write(settled, seconds, _before, resolution, projection);
            },
          },
        ];
      },
    };

    /** Fits the same raised feet for the planned key and for display. */
    function planted(
      posture: IAutoMovieMotionHumanPosture,
      ankles: IAutoMovieMotionHumanRise.Stance,
      degrees: number,
      resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    ): IAutoMovieMotionHumanPosture {
      const left: IAutoMovieHumanLimbGoal = AutoMovieMotionHumanLeg.goal(
        body, posture, "left", AutoMovieMotionHumanRise.foot(body, "left", ankles.left, degrees), true,
      );
      const right: IAutoMovieHumanLimbGoal = AutoMovieMotionHumanLeg.goal(
        body, posture, "right", AutoMovieMotionHumanRise.foot(body, "right", ankles.right, degrees), true,
      );
      const raised: IAutoMovieMotionHumanPosture = {
        ...posture,
        joints: { ...posture.joints, leftToes: [degrees, 0, 0], rightToes: [degrees, 0, 0] },
        limbs: { ...posture.limbs, leftLeg: left, rightLeg: right },
      };
      return { ...raised, root: resolveHumanPosture.lower(body, raised, undefined, resolution).root };
    }
  }
}

/** The spine's bones a turn of the trunk toward a wrist off to the side twists: the lumbar and the thoracic spine. */
const TWISTED: readonly TwistedBone[] = ["spine", "chest"];

/** A spine bone the trunk's turn twists. */
type TwistedBone = "spine" | "chest";

/** A wrist's place against the arm on a posture, metres: beyond the kept share of the arm's length, and above the shoulder joint. */
interface IReach {
  /** How far the wrist lies beyond the kept share; not positive within it. */
  beyond: number;

  /** How far the wrist lies above the shoulder joint; negative below it. */
  above: number;
}

/**
 * The least angle of one freedom that closes a reach upward, degrees: 0 when
 * the wrist is within the share, not above the shoulder, or no nearer at the
 * limit; the limit when even it leaves the wrist beyond the share and above
 * the shoulder; otherwise the bisected angle at which the wrist comes within
 * the share, or, when the limit does not bring it there, at which the
 * shoulder comes level with the wrist, since above that the freedom would
 * take the shoulder away again.
 */
function least(limit: number, at: (degrees: number) => IReach): number {
  const none: IReach = at(0);
  if (!(none.beyond > 0 && none.above > 0)) return 0;
  const top: IReach = at(limit);
  if (!(top.beyond < none.beyond)) return 0;
  const enough: (reach: IReach) => boolean = (reach: IReach): boolean =>
    top.beyond <= 0 ? reach.beyond <= 0 : reach.above <= 0;
  if (!enough(top)) return limit;
  let low: number = 0;
  let high: number = limit;
  while (high - low > 0.01) {
    const middle: number = (low + high) / 2;
    if (enough(at(middle))) high = middle;
    else low = middle;
  }
  return high;
}
