import { Vector3, getConstraint } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieJointConstraint,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanTouch,
  IAutoMovieMotionHumanTouchContacts,
  IAutoMovieMotionHumanTouchStance,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { readHumanBone } from "../body/readHumanBone";
import { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
import { AutoMovieMotionHumanTouchStance } from "../compose/AutoMovieMotionHumanTouchStance";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import { HumanArmTrajectoryPace } from "../posture/HumanArmTrajectoryPace";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/** The alternatives of `GirdlesAtBone`'s site. */
type GirdlesAtBone = "leftShoulder" | "rightShoulder";

/** The alternatives of `GirdlesBoundsEnd`'s site. */
type GirdlesBoundsEnd = "min" | "max";

/**
 * Shoulder assistance and transport timing for hands holding distinct body
 * sites across each other.
 */
export namespace touchCrossedSupport {
  /** The endpoint branch and the minimum unscaled duration of its transport. */
  export interface IAttempt {
    /** Whether the primary arm passes below and the second arm above. */
    assist: boolean;
    /** The free transport time of the achieved wrist path, in seconds. */
    reach: number;
  }

  /** Build and admit a touch on the specified branch. */
  type Build = (
    context: Context,
    attempt?: IAttempt,
  ) => IAutoMovieMotionHumanActionPlan;

  /** A touch and its initial body and clock. */
  type Context =
    IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanTouch.IParams>;

  /** The two wrist positions in world metres. */
  type Wrists = readonly [IAutoMovieVector3, IAutoMovieVector3];

  /** Joint angles in the rig's flexion, abduction and twist order, in degrees. */
  type Angles = readonly [number, number, number];

  /** The branch a crossing reaches on and its plan. */
  interface IAssisted {
    /** Whether the primary arm passes below and the second arm above. */
    assist: boolean;

    /** The plan built on that branch. */
    plan: IAutoMovieMotionHumanActionPlan;
  }

  /**
   * Plan a supported crossing on the entry shoulders first. A refused crossing
   * can use the opposite shoulder-girdle limits.
   */
  export function plan(
    context: Context,
    build: Build,
  ): IAutoMovieMotionHumanActionPlan {
    const p: IAutoMovieMotionHumanTouch.IParams = context.params;
    const rests: readonly IAutoMovieMotionHumanTouchContacts.IDeclared[] =
      p.rests ?? [];
    if (
      p.target.kind !== "self" ||
      p.other?.kind !== "self" ||
      p.prop !== undefined ||
      (p.clear ?? 0) > 0 ||
      (p.kind !== "squeeze" && p.kind !== "hold" && p.kind !== "press") ||
      !rests.some(
        (r: IAutoMovieMotionHumanTouchContacts.IDeclared): boolean =>
          r.hand === "first" &&
          (r.on === "leftLowerArm" || r.on === "leftUpperArm"),
      ) ||
      !rests.some(
        (r: IAutoMovieMotionHumanTouchContacts.IDeclared): boolean =>
          r.hand === "other" &&
          (r.on === "rightLowerArm" || r.on === "rightUpperArm"),
      )
    )
      return build(context);

    // The crossing on the entry shoulders, then on the opposite girdle
    // limits: the law's two candidates in its order, the first that reaches
    // taken (`AutoMovieMotionHumanTouchStance.choose`).
    const chosen: IAssisted = AutoMovieMotionHumanTouchStance.choose<
      boolean,
      IAssisted
    >({
      candidates: [false, true],
      reach: (assist: boolean): IAssisted => ({
        assist,
        plan: build(context, { assist, reach: 0 }),
      }),
    });
    const assist: boolean = chosen.assist;
    const first: IAutoMovieMotionHumanActionPlan = chosen.plan;

    const event = (name: string): number =>
      first.duration *
      first.events.find((e: IAutoMovieMotionEvent): boolean => e.name === name)!
        .share;
    const ready: number = event("ready");
    const relax: number = event("relax");
    const bones: ReadonlySet<AutoMovieHumanoidBone> = new Set([
      "rightHand",
      "leftHand",
    ]);
    const wrists = (seconds: number): Wrists => {
      const posture: IAutoMovieMotionHumanPosture = first.posture(seconds);
      const placed: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        poseBones(
          context.body,
          resolveHumanPosture(context.body, posture),
          undefined,
          bones,
        );
      return [
        placed.get("rightHand")!.worldPosition,
        placed.get("leftHand")!.worldPosition,
      ];
    };
    const longest = (start: number, end: number): number => {
      const steps: number = Math.ceil(
        (end - start) / HumanArmTrajectoryPace.STEP,
      );
      const arcs: [number, number] = [0, 0];
      let before: Wrists = wrists(start);
      for (let i: number = 1; i <= steps; ++i) {
        const after: Wrists = wrists(start + ((end - start) * i) / steps);
        arcs[0] += Vector3.distance(before[0], after[0]);
        arcs[1] += Vector3.distance(before[1], after[1]);
        before = after;
      }
      return Math.max(...arcs);
    };
    const reach: number = AutoMovieMotionHumanTiming.transport(
      Math.max(longest(0, ready), longest(relax, first.duration)),
    );
    return reach * AutoMovieMotionManner(context, p.manner).tempo > ready
      ? build(context, { assist, reach })
      : first;
  }

  /**
   * The shoulder boundary configurations for opposite over- and under-arm
   * passages, approached with the existing reach envelope.
   */
  export function girdles(
    body: IAutoMovieMotionHumanBody,
    primary: AutoMovieHumanSide,
  ): NonNullable<IAutoMovieMotionHumanTouchStance.IProps["girdles"]> {
    const bounds = (side: AutoMovieHumanSide): Angles => {
      const bone: AutoMovieHumanoidBone = `${side}Shoulder`;
      const range: IAutoMovieJointConstraint | null = getConstraint(
        bone,
        readHumanBone(body, bone)?.constraint ?? null,
      );
      const end: GirdlesBoundsEnd = side === primary ? "min" : "max";
      return [range?.flexion?.[end] ?? 0, range?.abduction?.[end] ?? 0, 0];
    };
    const left: Angles = bounds("left");
    const right: Angles = bounds("right");
    return (
      posture: IAutoMovieMotionHumanPosture,
      share: number,
    ): IAutoMovieMotionHumanPosture => {
      const at = (bone: GirdlesAtBone, end: Angles): Angles => {
        const was: Angles = posture.joints[bone] ?? [0, 0, 0];
        return [
          was[0] + share * (end[0] - was[0]),
          was[1] + share * (end[1] - was[1]),
          was[2],
        ];
      };
      return {
        ...posture,
        joints: {
          ...posture.joints,
          leftShoulder: at("leftShoulder", left),
          rightShoulder: at("rightShoulder", right),
        },
      };
    };
  }
}
