import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieMotionHumanActionKey,
  IAutoMovieAffordance,
  IAutoMovieMotionClockInstant,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanDanceCourse,
  IAutoMovieMotionHumanDanceFootKey,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanStiltWalk,
  IAutoMovieMotionPropWear,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanInterrupt } from "../../compose/AutoMovieMotionHumanInterrupt";
import { HumanBound } from "../../law/HumanBound";
import { HumanRefusal } from "../../law/HumanRefusal";
import { DanceFootwork } from "../DanceFootwork";
import { ExerciseKey } from "../ExerciseKey";

/**
 * A walk on stilts. Each foot stands strapped on its stilt's platform and
 * carries the stilt with it, so the stilts' tips are the only floor contacts;
 * the feet bear on the platforms' height as on a raised floor. The steps are
 * short, `STEP` hip heights, on the stance's own wide base, one every `PERIOD`
 * seconds with the foot in the air over `SWING` of it, lifted `LIFT` metres so
 * the tip clears the floor; the hips ride over the feet and the arms are held a
 * little out for balance. Standing still is stepping in place: a stop at the
 * start steps each foot where it stands.
 *
 * Refused: a stilt with no `foot` or `tip`, and an entry foot not standing on
 * its stilt's platform.
 */
export namespace stiltWalk {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionKey = "stiltWalk";

  /** Cancel table: from the last step, into another stilt walk. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] =
    AutoMovieMotionHumanInterrupt.table({
      stiltWalk: ["fromRelax", "smooth"],
    });

  /**
   * A step, hip heights (provisional: shorter than a walk's on the stilts'
   * longer lever).
   */
  export const STEP: number = 0.35;

  /** Seconds a step (provisional). */
  export const PERIOD: number = 0.8;

  /** The share of a step the stepping foot is up (provisional). */
  export const SWING: number = 0.5;

  /** How high a stepping stilt's tip lifts, metres (provisional). */
  export const LIFT: number = 0.08;

  /** How far an entry foot may stand off its platform, metres. */
  export const ON: number = 0.06;

  /** A stilt walk's steps. */
  export interface IPacing {
    /** The natural step, `STEP` hip heights, metres. */
    step: number;

    /** The steps, at least two, enough to cover the way by default. */
    steps: number;

    /** Each stride, metres. */
    stride: number;

    /** The walk's seconds: a `PERIOD` a step and half of one to settle. */
    duration: number;
  }

  /**
   * Pace a stilt walk over a way.
   *
   * @param length The way's level length, metres.
   * @param hip The walker's hip height, metres.
   * @param asked The steps asked, if any.
   * @returns The pacing.
   * @throws {HumanRefusal} When the steps are no whole number.
   */
  export function pacing(
    length: number,
    hip: number,
    asked: number | undefined,
  ): IPacing {
    const step: number = STEP * hip;
    const steps: number = HumanBound.whole(
      "steps",
      asked ?? Math.max(2, Math.ceil(length / step) + 1),
    );
    return {
      step,
      steps,
      stride: length / Math.max(1, steps - 1),
      duration: steps * PERIOD + PERIOD / 2,
    };
  }
  /**
   * Plan a stilt walk.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When a stilt lacks its foot or tip, an entry foot is
   *   off its platform, or the step count is not a positive whole number.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanStiltWalk.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const p: IAutoMovieMotionHumanStiltWalk.IParams = context.params;
    const body: IAutoMovieMotionHumanBody = context.body;
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    const ankle: number = body.rest.get("leftFoot")!.y;
    const top: Record<AutoMovieHumanSide, number> = {
      left: platform(context, p.stilts.left, "left", ankle),
      right: platform(context, p.stilts.right, "right", ankle),
    };

    // The way: from the feet's middle to the stop, short steps.
    const start: IAutoMovieVector3 = Vector3.lerp(
      context.entry.feet.left.ankle,
      context.entry.feet.right.ankle,
      0.5,
    );
    const way: IAutoMovieVector3 = {
      x: p.to.x - start.x,
      y: 0,
      z: p.to.z - start.z,
    };
    const length: number = Vector3.length(way);
    const along: IAutoMovieVector3 =
      length > 1e-6
        ? Vector3.normalize(way)
        : Quaternion.rotateVector(
            Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, entry.yaw),
            {
              x: 0,
              y: 0,
              z: 1,
            },
          );
    const { steps, stride, duration }: stiltWalk.IPacing = pacing(
      length,
      body.measure.hipHeight,
      p.steps,
    );
    const keys: Record<
      AutoMovieHumanSide,
      IAutoMovieMotionHumanDanceFootKey[]
    > = {
      left: [stood(context, "left")],
      right: [stood(context, "right")],
    };
    const instants: IAutoMovieMotionClockInstant[] = [];
    // Footfall k: the right foot first, each foot passing the other by a
    // stride, the last one closing beside it.
    const advanced: Record<AutoMovieHumanSide, number> = { left: 0, right: 0 };
    for (let k: number = 1; k <= steps; k++) {
      const side: AutoMovieHumanSide = k % 2 === 1 ? "right" : "left";
      const reach: number = Math.min(length, k * stride);
      advanced[side] = reach;
      const at: number = (k - 1) * PERIOD + SWING * PERIOD;
      const list: IAutoMovieMotionHumanDanceFootKey[] = keys[side];
      const last: IAutoMovieMotionHumanDanceFootKey = list[list.length - 1]!;
      last.leave = Math.max(last.at, at - SWING * PERIOD);
      const from: IAutoMovieMotionHumanFoot.IPlacement = keys[side][0]!.place;
      list.push({
        at,
        leave: Infinity,
        place: {
          ankle: Vector3.add(from.ankle, Vector3.scale(along, reach)),
          rotation: from.rotation,
        },
        bears: true,
        clearance: LIFT,
      });
      instants.push({ name: `step${k}`, seconds: at });
    }
    for (const side of ["left", "right"] as const)
      keys[side][keys[side].length - 1]!.leave = duration;
    instants.push({ name: "relax", seconds: duration - PERIOD / 2 });

    const arms: IAutoMovieMotionHumanPosture["joints"] = ExerciseKey.from(
      body,
      {},
      { shoulder: 15, raise: 35, elbow: 30 },
    ).joints;
    const course: IAutoMovieMotionHumanDanceCourse = {
      duration,
      left: keys.left,
      right: keys.right,
      hips: (): IAutoMovieVector3 => entry.root,
      yaw: (): number => entry.yaw,
      joints: (): IAutoMovieMotionHumanPosture["joints"] => arms,
      instants,
    };
    // The feet bear at the platforms' height; each stilt is strapped on its
    // foot, riding it from the start as a worn prop.
    const plan: IAutoMovieMotionHumanActionPlan = DanceFootwork.compose(
      body,
      entry,
      { ...course, hips: DanceFootwork.over(body, context.entry, course, 0) },
      { kind: "ground", height: (top.left + top.right) / 2 },
    );
    const wears: IAutoMovieMotionPropWear[] = (["left", "right"] as const).map(
      (side: AutoMovieHumanSide): IAutoMovieMotionPropWear => ({
        prop: p.stilts[side],
        bone: side === "left" ? "leftFoot" : "rightFoot",
        from: 0,
      }),
    );
    return { ...plan, wears };
  }

  /** The entry stance's key. */
  function stood(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanStiltWalk.IParams>,
    side: AutoMovieHumanSide,
  ): IAutoMovieMotionHumanDanceFootKey {
    return {
      at: 0,
      leave: Infinity,
      place: {
        ankle: context.entry.feet[side].ankle,
        rotation: context.entry.feet[side].rotation,
      },
      bears: true,
      clearance: 0,
    };
  }

  /** A stilt's platform height, checked under its foot. */
  function platform(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanStiltWalk.IParams>,
    subject: string,
    side: AutoMovieHumanSide,
    ankle: number,
  ): number {
    const read: IAutoMovieMotionHumanPropReader = context.prop(subject);
    const placed: IAutoMovieRigidTransform = read.frame(context.start);
    const find: (id: string) => IAutoMovieVector3 = (
      id: string,
    ): IAutoMovieVector3 => {
      const found: IAutoMovieAffordance | undefined = (
        read.prop.affordances ?? []
      ).find((a: IAutoMovieAffordance): boolean => a.id === id);
      if (found === undefined)
        throw new HumanRefusal({
          kind: "affordance",
          axis: "stilts",
          value: subject,
          reason: `${subject} declares no ${id}`,
          fix: "wear stilts that declare a foot platform and a tip",
        });
      return Vector3.add(
        placed.position,
        Quaternion.rotateVector(placed.rotation, found.frame.translation),
      );
    };
    const foot: IAutoMovieVector3 = find("foot");
    find("tip");
    const at: IAutoMovieVector3 = context.entry.feet[side].ankle;
    const off: number = Math.hypot(at.x - foot.x, at.z - foot.z);
    const high: number = Math.abs(at.y - ankle - foot.y);
    if (off > ON + 0.1 || high > ON)
      throw new HumanRefusal({
        kind: "base",
        axis: "stilts",
        value: subject,
        reason: `the ${side} foot stands ${(off * 1000).toFixed(0)} mm beside and ${(high * 1000).toFixed(0)} mm off its stilt's platform`,
        fix: "stand on the stilts before walking on them",
      });
    return foot.y;
  }
}
