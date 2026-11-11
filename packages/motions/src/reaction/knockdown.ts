import { Vector3, physicalShapeBounds } from "@automovie/engine";
import type {
  AutoMovieMotionTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanJoints } from "../compose/AutoMovieMotionHumanJoints";
import { AutoMovieMotionHumanLean } from "../compose/AutoMovieMotionHumanLean";
import { AutoMovieMotionHumanRange } from "../compose/AutoMovieMotionHumanRange";
import { AutoMovieMotionHumanRoot } from "../compose/AutoMovieMotionHumanRoot";
import { AutoMovieMotionHumanTarget } from "../compose/AutoMovieMotionHumanTarget";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import { HumanFrame } from "../posture/HumanFrame";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { StrikingBody } from "../striking/StrikingBody";
import type { StrikingContact } from "../striking/StrikingContact";
import { StrikingTarget } from "../striking/StrikingTarget";

/**
 * A knockdown: the legs give way and the body goes down away from the blow,
 * sitting onto the floor and falling back to lie supine.
 *
 * The collapse is a buckle, not a dive: the knees and hips fold while the
 * pelvis goes back and down behind the feet (as in the stepping-response
 * failures of Maki and McIlroy 1997, where a push too large for one step
 * ends in a fall), the seat meets the floor at 0.45 s, about the free-fall
 * time of the pelvis from its height slowed by the buckling legs, and the
 * trunk rolls back until the back rests on the floor by 1.1 s, the arms
 * trailing. The feet stay where they stood until the seat lands; then the
 * seat stays where it landed and the heels slide out as the legs straighten.
 *
 * Each pose rests on the floor without penetrating it: the root's height is
 * solved so the lowest point of the body's own collision shapes touches the
 * floor. The seat and the lie are fitted to the body the same way: the knee
 * at the seat is the one that puts the feet on the floor the seat sits on,
 * and the lying arm's extension and elbow are the ones that lay the arm on
 * the floor beside the body, so any stature sits and lies on the floor
 * exactly. The body goes down away from the blow (the `from` target), turned
 * so its back falls toward that direction.
 *
 * The trunk's recline and the hip's fold at the seat are provisional
 * readings; detailed falls derived from the Euphoria behaviours belong to
 * tier 2 of #3201.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the buckle, its timing, the floor rule and which proportions are provisional.
 * @evidence contracts/development/design.md#principled-representation A law record of the action-law core: a name, an empty cancel table, parameters and a pure plan of postures in world metres and seconds with seat and lie contacts.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the name, the cancel table, the parameters, the timing constants, the plan and the floor rest the knockdown count's tests read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the posture, plan, contact-window, target and collider types; the floor height comes from each body's own shapes.
 */
export namespace knockdown {
  /** The action's name. */
  export const name: HumanActionName = "knockdown";

  /** Cancel table: none; a knocked-down performer stays down for the count. */
  export const interrupts: IHumanActionLaw["interrupts"] = {};

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the blow's target and the lying time's unit and default.
   * @evidence contracts/development/design.md#principled-representation The blow is the interface's motion-target union and the lying time seconds, checked non-negative when planning.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The two values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the interface's target union.
   */
  export interface IParams {
    /** Where the blow came from; a place ahead of the performer when absent. */
    from?: AutoMovieMotionTarget;

    /** How long the body lies after landing, seconds; 1 when absent. */
    seconds?: number;
  }

  /** Seat contact, seconds. */
  export const SEATED: number = 0.45;

  /** Back on the floor, seconds. */
  export const DOWN: number = 1.1;

  /**
   * The root height that rests a posture on the floor: its lowest collision
   * point at zero.
   *
   * @param body The body.
   * @param posture The posture, its root height ignored.
   * @returns The root height, metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the rule, the ignored input and the unit.
   * @evidence contracts/development/implementation.md#principled-implementation Forward kinematics of the posture with its root at zero height, then the lowest point of every collision shape's exact world bounds (`physicalShapeBounds`), negated.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One trunk resolution and one pass over the shapes.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None; the height follows from the body's own shapes.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in bones and shapes.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function rest(body: IHumanBody, posture: IHumanPosture): number {
    const bones = StrikingBody.trunk(body, {
      ...posture,
      root: { ...posture.root, y: 0 },
    });
    let lowest: number = Infinity;
    for (const c of StrikingBody.colliders(body, bones))
      lowest = Math.min(lowest, bottom(c));
    return -lowest;
  }

  /**
   * Plan a knockdown.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {Error} When the lying time is negative.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States its input, its plan and its refusal.
   * @evidence contracts/development/implementation.md#principled-implementation Overlapping minimum-jerk sit and roll-back profiles over one pose function, the root height solved each posture by the floor rest and the root's travel by the pose's own ankles and hips, so the feet and then the seat stay in place on any body.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Fits the body and reads the blow's heading once, then evaluates each posture in closed form.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A negative lying time throws; the knee and the lying arm are solved on the body's shapes instead of stated, and the recline and the hip's fold are named provisional values.
   * @evidence contracts/development/implementation.md#efficient-algorithms One trunk resolution and one pass over the shapes per posture, and three bisections of 16 steps per plan.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The fit and the standing and seated measures are computed once per plan; the heading away from the blow once per run, dropped on settle.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds the fit, two measures and one cached heading, the last cleared by settle and all released with the plan.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const body = context.body;
    const lie: number = context.params.seconds ?? 1;
    if (!(lie >= 0)) throw new Error("A knockdown lies a non-negative time");
    const entry: IHumanPosture = context.entry.posture;
    const clock: AutoMovieMotionClock.IClock = AutoMovieMotionClock.of(
      DOWN + lie,
      [
        { name: "rolling", seconds: ROLLING * SEATED },
        { name: "seated", seconds: SEATED },
        { name: "stroke", seconds: SEATED },
        { name: "down", seconds: DOWN },
        { name: "relax", seconds: DOWN },
      ],
    );
    const duration: number = clock.duration;
    const sit = (seconds: number): number =>
      clock.progress(AutoMovieMotionClock.START, "seated", seconds);
    const back = (seconds: number): number =>
      clock.progress("rolling", "down", seconds);

    // The angles this body needs to rest on the floor, and where its ankles
    // and hips are along its heading standing and seated: the feet stay where
    // they stood until the seat lands, and the seat stays where it landed.
    const fitted: IFit = fit(body, back(SEATED));
    const at = (seconds: number): IMeasure =>
      measure(body, fold(fitted, sit(seconds), back(seconds)));
    const standing: IMeasure = at(0);
    const seated: IMeasure = at(SEATED);

    // The heading that faces the blow, so the back falls away from it.
    let cached: number | undefined;
    const heading = (): number => {
      if (cached !== undefined) return cached;
      const away: IAutoMovieVector3 = AutoMovieMotionHumanTarget.away(
        AutoMovieMotionHumanTarget.resolve(
          context,
          context.params.from,
          context.start - StrikingTarget.LOOK,
          entry,
          AutoMovieMotionHumanTarget.DEFAULTS.ahead,
        ),
        entry.root,
        entry.yaw,
      );
      cached = (Math.atan2(-away.x, -away.z) * 180) / Math.PI;
      return cached;
    };

    const flat = (yaw: number, forward: number): IAutoMovieVector3 =>
      HumanFrame.point(
        { origin: { x: 0, y: 0, z: 0 }, yaw },
        { x: 0, y: 0, z: forward },
      );
    return composeAutoMovieMotionHumanAction({
      base: {
        ...AutoMovieMotionHumanBase.still(
          duration,
          {
            root: entry.root,
            yaw: entry.yaw,
            pitch: 0,
            roll: 0,
            joints: {},
            limbs: {},
          },
          [
            {
              part: "seat",
              kind: "seat",
              from: SEATED / duration,
              to: DOWN / duration,
              support: { kind: "ground" },
            },
            {
              part: "back",
              kind: "lie",
              from: DOWN / duration,
              to: 1,
              support: { kind: "ground" },
            },
          ],
        ),
        settle: (): void => {
          cached = undefined;
        },
      },
      clock,
      primitives: [
        // The pelvis goes back and down behind the feet until the seat
        // lands, the body turning to face the blow; then the seat stays and
        // the heels slide out as the back rolls down. The height rests the
        // pose of each second on the floor.
        AutoMovieMotionHumanRoot.travel({
          from: 0,
          to: duration,
          offset: (seconds: number): AutoMovieMotionHumanRoot.IOffset => {
            const turn: number = angle(heading() - entry.yaw);
            const now: IMeasure = at(seconds);
            const landed: boolean = seconds >= SEATED;
            const world: IAutoMovieVector3 = Vector3.add(
              Vector3.subtract(
                flat(entry.yaw, standing.ankle),
                flat(
                  entry.yaw + turn * sit(seconds),
                  (landed ? seated : now).ankle,
                ),
              ),
              flat(entry.yaw + turn, landed ? seated.hips - now.hips : 0),
            );
            return {
              point: {
                ...HumanFrame.local(
                  { origin: { x: 0, y: 0, z: 0 }, yaw: entry.yaw },
                  world,
                ),
                y: now.floor - entry.root.y,
              },
              yaw: turn * sit(seconds),
            };
          },
        }),
        // The trunk reclines as the seat goes down and rolls back to the
        // floor.
        AutoMovieMotionHumanLean.tilt({
          from: 0,
          to: duration,
          angles: (seconds: number): AutoMovieMotionHumanLean.IAngles => ({
            pitch: fold(fitted, sit(seconds), back(seconds)).pitch,
            roll: 0,
          }),
        }),
        // The knees and hips fold until the feet and the seat share the
        // floor, then straighten to lie; the arms trail and come to rest on
        // the floor beside the body.
        AutoMovieMotionHumanJoints.add({
          channels: ["head", "leftLeg", "rightLeg", "leftArm", "rightArm"],
          from: 0,
          to: duration,
          delta: (seconds: number): AutoMovieMotionHumanJoints.Angles =>
            fold(fitted, sit(seconds), back(seconds)).joints,
        }),
      ],
    });
  }

  /** The trunk's pitch and the joints of the fall at one instant. */
  interface IFold {
    pitch: number;
    joints: AutoMovieMotionHumanJoints.Angles;
  }

  /**
   * The angles one body needs to rest on the floor, degrees: the knee that
   * puts the feet on the floor the seat sits on, and the upper arm and the
   * elbow that lay the arm on the floor the back lies on.
   */
  interface IFit {
    knee: number;
    arm: number;
    elbow: number;
  }

  /**
   * A fold on the floor with the root at the origin: the root height that
   * rests it, and how far ahead of the root its ankles and its hips are,
   * metres.
   */
  interface IMeasure {
    floor: number;
    ankle: number;
    hips: number;
  }

  /**
   * The fall's pose at a share of the sit and a share of the roll back: the
   * seat is the trunk reclined over folded hips and knees, and the lie is
   * the trunk on its back with the legs nearly straight.
   */
  function fold(fitted: IFit, sit: number, back: number): IFold {
    const seat: number = sit * (1 - back);
    const hip: number = ANGLES.hip * seat + 0.9 * ANGLES.lying * back;
    const knee: number = fitted.knee * seat + ANGLES.lying * back;
    const arm: number = ANGLES.lift * (1 - back) + fitted.arm * back;
    const elbow: number = ANGLES.elbow * (1 - back) + fitted.elbow * back;
    return {
      pitch: -(ANGLES.recline * seat + 88 * back),
      joints: {
        neck: [ANGLES.neck * back, 0, 0],
        leftUpperLeg: [hip, 5, 0],
        rightUpperLeg: [hip, 5, 0],
        leftLowerLeg: [knee, 0, 0],
        rightLowerLeg: [knee, 0, 0],
        leftUpperArm: [arm, ANGLES.open, 0],
        rightUpperArm: [arm, ANGLES.open, 0],
        leftLowerArm: [elbow, 0, 0],
        rightLowerArm: [elbow, 0, 0],
      },
    };
  }

  /** The body's shapes in a fold, the root at the origin and facing +Z. */
  function shapes(
    body: IHumanBody,
    folded: IFold,
  ): {
    bones: ReturnType<typeof StrikingBody.trunk>;
    colliders: StrikingContact.ICollider[];
  } {
    const bones = StrikingBody.trunk(body, {
      root: { x: 0, y: 0, z: 0 },
      yaw: 0,
      pitch: folded.pitch,
      roll: 0,
      joints: folded.joints,
      limbs: {},
    });
    return { bones, colliders: StrikingBody.colliders(body, bones) };
  }

  /** The lowest height of the shapes whose bone matches. */
  function lowest(
    colliders: readonly StrikingContact.ICollider[],
    of: (bone: string) => boolean,
  ): number {
    let low: number = Infinity;
    for (const c of colliders) if (of(c.name)) low = Math.min(low, bottom(c));
    return low;
  }

  /** Measures a fold. */
  function measure(body: IHumanBody, folded: IFold): IMeasure {
    const { bones, colliders } = shapes(body, folded);
    return {
      floor: -lowest(colliders, () => true),
      ankle:
        (bones.get("leftFoot")!.worldPosition.z +
          bones.get("rightFoot")!.worldPosition.z) /
        2,
      hips: bones.get("hips")!.worldPosition.z,
    };
  }

  /**
   * Fits the fall to a body by bisection on its own shapes. The knee is the
   * one at which the lower legs and the feet reach down as far as the seat
   * does, at the instant the seat lands; the upper arm's extension and then
   * the elbow's flexion are the ones at which the arm reaches down as far as
   * the rest of the lying body. A joint whose range ends first stays at its
   * end.
   */
  function fit(body: IHumanBody, landed: number): IFit {
    const gap = (
      fitted: IFit,
      back: number,
      part: (bone: string) => boolean,
      support: (bone: string) => boolean,
    ): number => {
      const { colliders } = shapes(body, fold(fitted, 1, back));
      return lowest(colliders, part) - lowest(colliders, support);
    };
    // The value in [above, below] at which the gap closes; the gap is
    // positive at `above` and falls toward `below`.
    const solve = (
      above: number,
      below: number,
      of: (value: number) => number,
    ): number => {
      if (of(above) <= 0) return above;
      if (of(below) >= 0) return below;
      let high: number = above;
      let low: number = below;
      for (let i: number = 0; i < 16; ++i) {
        const mid: number = (high + low) / 2;
        if (of(mid) > 0) high = mid;
        else low = mid;
      }
      return (high + low) / 2;
    };
    const fitted: IFit = { knee: 0, arm: ANGLES.lift, elbow: 0 };
    fitted.knee = solve(
      0,
      AutoMovieMotionHumanRange.degrees("leftLowerLeg", "flexion", "full"),
      (knee: number): number => gap({ ...fitted, knee }, landed, SHANK, SEAT),
    );
    fitted.arm = solve(
      ANGLES.lift,
      AutoMovieMotionHumanRange.limit("leftUpperArm", "extension") ?? 0,
      (arm: number): number => gap({ ...fitted, arm }, 1, UPPER_ARM, BODY),
    );
    // A straight arm that slopes down to the elbow carries the forearm below
    // the floor, and the elbow's flexion lifts it back: the gap grows with
    // the flexion, so the ends swap.
    fitted.elbow = solve(90, 0, (elbow: number): number =>
      gap({ ...fitted, elbow }, 1, FOREARM, BODY),
    );
    return fitted;
  }

  /** The shapes of the seat: the pelvis and the thighs. */
  const SEAT = (bone: string): boolean =>
    bone === "hips" || bone.endsWith("UpperLeg");

  /** The shapes below the knee. */
  const SHANK = (bone: string): boolean => /(LowerLeg|Foot|Toes)$/.test(bone);

  /** The shapes of the upper arm. */
  const UPPER_ARM = (bone: string): boolean => bone.endsWith("UpperArm");

  /** The shapes below the elbow. */
  const FOREARM = (bone: string): boolean =>
    /(LowerArm|Hand|Thumb|Index|Middle|Ring|Little)/.test(bone);

  /** Every shape that is not an arm's. */
  const BODY = (bone: string): boolean => !UPPER_ARM(bone) && !FOREARM(bone);

  /** When the trunk starts rolling back, as a share of the time to the seat. */
  const ROLLING: number = 0.6;

  /**
   * The fall's angles, degrees, each a level of its range (provisional): the
   * trunk's recline and the hip's fold as the seat lands, the knee as the
   * body lies, the neck's tuck as the back rolls down, and the trailing arm's
   * forward lift, opening and elbow.
   */
  const ANGLES = {
    recline: AutoMovieMotionHumanRange.lean("half"),
    hip: AutoMovieMotionHumanRange.degrees("leftUpperLeg", "flexion", {
      level: "deep",
      scale: 1.1,
    }),
    lying: AutoMovieMotionHumanRange.degrees(
      "leftLowerLeg",
      "flexion",
      "slight",
    ),
    neck: AutoMovieMotionHumanRange.degrees("neck", "flexion", "half"),
    lift: AutoMovieMotionHumanRange.degrees("leftUpperArm", "flexion", {
      level: "slight",
      scale: 0.5,
    }),
    open: AutoMovieMotionHumanRange.degrees(
      "leftUpperArm",
      "abduction",
      "slight",
    ),
    elbow: AutoMovieMotionHumanRange.degrees("leftLowerArm", "flexion", {
      level: "light",
      scale: 0.8,
    }),
  };

  /** A heading difference wrapped into (-180, 180]. */
  function angle(degrees: number): number {
    return ((((degrees + 180) % 360) + 360) % 360) - 180;
  }

  /** The lowest world height of a collider. */
  function bottom(c: StrikingContact.ICollider): number {
    return physicalShapeBounds(c.pose, c.shape).min.y;
  }
}
