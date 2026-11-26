import type {
  AutoMovieHumanSide,
  AutoMovieMotionHumanActionName,
  IAutoMovieMotionClock,
  IAutoMovieMotionClockInstant,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanClimbStairs,
  IAutoMovieMotionHumanClimbStairsFlight,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionManner,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../actions/stand";
import { standUpright } from "../actions/standUpright";
import { walk } from "../gait/internal/walk";
import { walkRoot } from "../actions/walkRoot";
import { HumanSupportCarry } from "../carrier/HumanSupportCarry";
import { swungArms } from "../carrier/swungArms";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanLean } from "../compose/AutoMovieMotionHumanLean";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import { hipJoints } from "../posture/hipJoints";
import { humanPostureHeading } from "../posture/humanPostureHeading";
import { lowerHumanPosture } from "../posture/lowerHumanPosture";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { climbStairsBounds } from "./stairs/climbStairsBounds";
import { climbStairsCarry } from "./stairs/climbStairsCarry";
import { climbStairsFeet } from "./stairs/climbStairsFeet";
import { climbStairsFlight } from "./stairs/climbStairsFlight";
import { climbStairsPelvis } from "./stairs/climbStairsPelvis";
import { climbStairsPlants } from "./stairs/climbStairsPlants";
import { climbStairsPrints } from "./stairs/climbStairsPrints";
import { climbStairsProfile } from "./stairs/climbStairsProfile";
import { climbStairsRail } from "./stairs/climbStairsRail";
import { climbStairsRocker } from "./stairs/climbStairsRocker";
import { climbStairsSwing } from "./stairs/climbStairsSwing";
import { climbStairsToes } from "./stairs/climbStairsToes";
import { climbStairsWeight } from "./stairs/climbStairsWeight";

/**
 * Climbing a flight of stairs up or down from standing before its first nosing,
 * step over step (one foot per tread) or step by step (both feet on each
 * tread), ending with both feet on the last tread.
 *
 * The flight lies ahead along the heading: its first nosing `start` metres
 * ahead of the toes, `count` treads of `riser` and `tread` metres, rising for
 * `up` and falling below the floor for `down`. The goals are footprints: each
 * foot lands with the middle of its sole on the middle of its tread, at its
 * standing lateral place; a sole too long to keep `EDGE` from both edges there
 * hangs its heel over the nosing ascending and its toes over the next one
 * descending, as a long foot stands on a short tread, and on the landing stands
 * `EDGE` past the last nosing. A swinging foot takes the shortest path over the
 * flight that keeps every point of its sole above the surface under it and
 * `CLEARANCE` above each edge it passes (`AutoMovieMotionHumanClearance`):
 * ascending it lifts beside the riser and follows the line of the nosings,
 * descending it moves forward and lowers once its heel is past the nosing; it
 * lifts over the floor's contact height before it travels along the flight. The
 * pelvis moves between the stances on minimum-jerk progress over the middle of
 * the two feet, half a step behind them over the floor (`climbStairsPelvis`).
 * Its height at a stance is the highest from which both legs reach their feet,
 * so the lower foot's leg is straight and the upper one's bent; it changes
 * while a foot swings and holds in double support, and is lowered wherever
 * either leg, planted or swinging, could not reach its foot.
 *
 * The trunk inclines forward by `ASCENT_LEAN` going up and by a walk's
 * inclination going down, shared between the pelvis and the spine by the
 * lumbopelvic rhythm and tipped about the hips, since the trunk flexes forward
 * more in stair ascent than in level walking (McFadyen and Winter 1988, J
 * Biomech 21:733).
 *
 * The cadence is 90 steps a minute (Mian, Narici, Minetti and Baltzopoulos
 * 2007, Gait Posture 26:463), scaled by the square root of the hip height
 * (Alexander 1984) and by the manner's tempo; each swing takes 0.8 of a step
 * and the double support the rest (provisional). Risers from 100 to 180 mm and
 * treads from 280 mm are the 2010 ADA ranges (504.2), the defaults 170 and 280
 * mm; a riser above 0.35 of the hip height or a tread shorter than 0.6 of the
 * foot is refused with the body's feasible range (provisional limits). Events:
 * `toeOff<n>` and `treadContact<n>` per step, numbered from 1. A foot on a
 * tread bears on the prop `on` names, or on the fixed floor frame when no prop
 * is named; a foot on the floor before the flight bears on the ground. The
 * treads repeat the settled stance's flat feet, while the feet leave the floor
 * from where the entry put them.
 *
 * An optional handrail names the gripping hand and a bar on the fixed stair
 * prop. The grip bears along that axis, then releases before the final stance.
 * A following walk can turn on the landing.
 */
export namespace climbStairs {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionName = "climbStairs";

  /**
   * The legs and trunk carry the climb while the head, arms and hands remain
   * free.
   */
  export const yields: IAutoMovieMotionHumanActionLaw["yields"] = walk.yields;

  /**
   * Cancel table: the climb ends into standing or walking once both feet are on
   * the last tread.
   */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    stand: [
      {
        window: ["arrived", 1],
        kind: "inertialize",
        entry: 0,
        blend: climbStairsBounds.BLEND,
      },
    ],
    walk: [
      {
        window: ["arrived", 1],
        kind: "inertialize",
        entry: 0,
        blend: climbStairsBounds.BLEND,
      },
    ],
  };

  /**
   * How far above an edge a swinging sole passes it, metres (provisional; the
   * issue's 20 mm toe clearance is the bound the capture checks).
   */
  export const CLEARANCE: number = 0.05;

  /**
   * The least distance along the flight a planted sole's heel and toe keep from
   * an edge, metres (provisional).
   */
  export const EDGE: number = 0.025;

  /** Steps a minute (Mian et al. 2007). */
  export const CADENCE: number = 90;

  /** The share of a step the foot swings (provisional). */
  export const SWING: number = 0.8;

  /** The flight's surface height under a point (`climbStairsFlight.surface`). */
  export const surface: typeof climbStairsFlight.surface =
    climbStairsFlight.surface;

  /** The flight a set of parameters describes (`climbStairsFlight.flight`). */
  export const flight: typeof climbStairsFlight.flight =
    climbStairsFlight.flight;
  /** The record of `IPrintsItemEntry`'s site. */
  type IPrintsItemEntry = { print: IPrint; step: number };

  /**
   * Plan a climb.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {Error} When `flight` refuses the stairs.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanClimbStairs.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const body: IAutoMovieMotionHumanBody = context.body;
    const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
    const p: IAutoMovieMotionHumanClimbStairs.IParams = context.params;
    const lead: AutoMovieHumanSide = p.lead ?? "right";
    // The feet leave the floor from the entry; the treads repeat the
    // settled stance's flat feet (`stand.footprints`).
    const stood: stand.IFootprints = stand.footprints(context);
    const standing: IAutoMovieMotionHumanPosture = stood.standing;
    const entered: Record<
      AutoMovieHumanSide,
      IAutoMovieMotionHumanFoot.IPlacement
    > = stood.entered;
    const flats: Record<
      AutoMovieHumanSide,
      IAutoMovieMotionHumanFoot.IPlacement
    > = stood.settled;
    const yaw: number = standing.yaw;
    const stairs: IAutoMovieMotionHumanClimbStairsFlight.IFlight = flight(
      body,
      standing,
      p,
    );
    const framed: HumanFrame.IPrepared = HumanFrame.prepare(stairs.frame);
    const sign: number = stairs.direction === "up" ? 1 : -1;
    const modifiers: IAutoMovieMotionManner.IModifiers = AutoMovieMotionManner(
      context,
      p.manner,
    );

    // Footprints: the settled flat sole on its tread at the standing lateral place.
    const footing: climbStairsPrints.IPrints = climbStairsPrints.prepare(
      body,
      entered,
      flats,
      stairs,
      framed,
      sign,
      EDGE,
    );
    const goals: climbStairsPrints.IPrints["goals"] = footing.goals;
    const print: climbStairsPrints.IPrints["print"] = footing.print;

    // The height asked of a swinging ankle along the flight: every sole
    // point on or above the surface under it, and `CLEARANCE` above an edge
    // it is passing.
    const profile: (z: number) => number = climbStairsProfile(
      stairs,
      EDGE - climbStairsBounds.EDGE_MARGIN,
      CLEARANCE,
    );
    const required: (side: AutoMovieHumanSide) => (z: number) => number = (
      side: AutoMovieHumanSide,
    ): ((z: number) => number) => footing.required(side, profile);

    // The step schedule: which foot goes to which tread, in order.
    const steps: climbStairsPrints.IStep[] = climbStairsPrints.schedule(
      p.pattern ?? "stepOverStep",
      stairs.count,
      lead,
    );

    // The clock: a step period per swing, the swing at its end, and a settle.
    const period: number =
      (60 / CADENCE) * Math.sqrt(m.hipHeight / walkRoot.REFERENCE_HIP);
    const instants: IAutoMovieMotionClockInstant[] = [];
    steps.forEach((_: unknown, j: number): void => {
      instants.push(
        { name: `toeOff${j + 1}`, seconds: (j + 1 - SWING) * period },
        { name: `treadContact${j + 1}`, seconds: (j + 1) * period },
      );
    });
    instants.push({ name: "arrived", seconds: steps.length * period });
    const clock: IAutoMovieMotionClock = AutoMovieMotionManner.time(
      AutoMovieMotionClock(
        (steps.length + climbStairsBounds.SETTLE) * period,
        instants,
      ),
      modifiers,
      { holds: [] },
    );
    const duration: number = clock.duration;
    const rightLoad: (seconds: number) => number = climbStairsWeight(
      steps.map(
        (step: (typeof steps)[number]): AutoMovieHumanSide => step.side,
      ),
      clock,
    );

    // The stances: both feet after each step, and the root over their
    // middle as high as both legs reach from it.
    function reached(
      posture: IAutoMovieMotionHumanPosture,
      feet: Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.IPlacement>,
      resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
    ): IAutoMovieVector3 {
      return lowerHumanPosture(
        body,
        {
          ...posture,
          limbs: {
            ...posture.limbs,
            leftLeg: goals.left(posture, feet.left, true),
            rightLeg: goals.right(posture, feet.right, true),
          },
        },
        undefined,
        resolution,
      ).root;
    }
    const stance: IAutoMovieVector3[] = [standing.root];
    const now: Record<AutoMovieHumanSide, IPrint> = {
      left: print("left", 0),
      right: print("right", 0),
    };
    const prints: Record<AutoMovieHumanSide, IPrintsItemEntry[]> = {
      left: [{ print: now.left, step: 0 }],
      right: [{ print: now.right, step: 0 }],
    };
    {
      const resolution: ReturnType<typeof prepareHumanPoseResolution> =
        prepareHumanPoseResolution();
      for (const [index, { side, level }] of steps.entries()) {
        const footprint: IPrint = print(side, level);
        now[side] = footprint;
        prints[side].push({ print: footprint, step: index + 1 });
        const root: IAutoMovieVector3 = stand.root(
          body,
          { left: now.left.placement.ankle, right: now.right.placement.ankle },
          yaw,
        );
        stance.push(
          reached(
            {
              ...standing,
              root: {
                ...root,
                y:
                  root.y +
                  Math.abs(
                    now.left.placement.ankle.y - now.right.placement.ankle.y,
                  ) /
                    2,
              },
            },
            { left: now.left.placement, right: now.right.placement },
            resolution,
          ),
        );
      }
    }

    // A swinging foot's path over the flight, lifted before it travels.
    const swing: ReturnType<typeof climbStairsSwing> = climbStairsSwing(
      framed,
      required,
    );
    const footAt: ReturnType<typeof climbStairsFeet> = climbStairsFeet(
      prints,
      clock,
      swing,
    );
    const rock: ReturnType<typeof climbStairsRocker> = climbStairsRocker(
      body,
      prints,
    );
    const rootAt: (seconds: number) => IAutoMovieVector3 = climbStairsPelvis(
      stance,
      clock,
      steps.length,
      duration,
    );

    // The trunk inclines forward over the climb, more ascending than on the
    // level, and is shared by the pelvis and the spine.
    const inclined: ReturnType<typeof HumanTrunk.incline> = HumanTrunk.incline(
      standUpright(body).joints,
      p.direction === "down" ? walk.LEAN : climbStairsBounds.ASCENT_LEAN,
    );
    const contact: Record<AutoMovieHumanSide, IAutoMovieVector3> = {
      left: HumanFoot.offset(body, "left", "mtp"),
      right: HumanFoot.offset(body, "right", "mtp"),
    };
    // The pelvis and both feet at a second, the root as high as both legs
    // reach (`lowerHumanPosture`, closed form) and the hips under it.
    const frameAt: climbStairsToes.IScope["frameAt"] = (
      posture: IAutoMovieMotionHumanPosture,
      seconds: number,
      read: ReturnType<typeof prepareHumanPoseResolution>,
    ): climbStairsToes.IFrame => {
      const placed: IAutoMovieMotionHumanPosture =
        AutoMovieMotionHumanLean.pivot(
          body,
          {
            ...posture,
            root: rootAt(seconds),
            yaw,
            joints: { ...posture.joints, ...inclined.joints },
          },
          { pitch: inclined.pitch, roll: 0 },
        );
      // The root stays where the swinging leg reaches its foot too, so the
      // foot keeps its clearing path.
      const feet: Record<AutoMovieHumanSide, ReturnType<typeof footAt>> = {
        left: footAt("left", seconds),
        right: footAt("right", seconds),
      };
      const root: IAutoMovieVector3 = reached(
        placed,
        { left: feet.left.placement, right: feet.right.placement },
        read,
      );
      const hips: ReturnType<typeof hipJoints> = hipJoints(
        body,
        root,
        humanPostureHeading(placed),
        placed.joints.hips,
        read(),
      );
      return { placed, feet, root, hips };
    };
    const flexions: Record<AutoMovieHumanSide, (seconds: number) => number[]> =
      climbStairsToes({
        duration,
        clock,
        steps,
        frameAt,
        rightLoad,
        rock,
        standing,
      });
    const climb: IAutoMovieMotionHumanPrimitive = {
      channels: ["root", "trunk", "leftLeg", "rightLeg"],
      reads: ["root", "trunk", "leftLeg", "rightLeg"],
      from: 0,
      to: duration,
      write: (
        posture: IAutoMovieMotionHumanPosture,
        seconds: number,
        _before?: IAutoMovieMotionHumanPrimitive.Reader,
        resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
      ): IAutoMovieMotionHumanPosture => {
        const { placed, feet, root }: climbStairsToes.IFrame = frameAt(
          posture,
          seconds,
          prepareHumanPoseResolution(resolution),
        );
        const limbs: IAutoMovieMotionHumanPosture["limbs"] = {
          ...posture.limbs,
        };
        const joints: IAutoMovieMotionHumanPosture["joints"] = {
          ...placed.joints,
        };
        for (const side of ["left", "right"] as const) {
          // The heel risen about the ball by the toes' prepared extension.
          const flexion: number = Math.max(0, flexions[side](seconds)[0]!);
          const placement: IAutoMovieMotionHumanFoot.IPlacement =
            climbStairsToes.place(body, side, feet[side].placement, flexion);
          if (flexion !== 0) joints[`${side}Toes`] = [flexion, 0, 0];
          limbs[`${side}Leg`] = {
            ...goals[side]({ root, yaw }, placement, feet[side].planted),
            contact: contact[side],
          };
        }
        return { ...placed, root, joints, limbs };
      },
    };

    // Plant windows between each foot's swings, on the floor or on the flight.
    const contacts: IAutoMovieMotionHumanContactWindow[] = climbStairsPlants(
      prints,
      clock,
      duration,
      {
        floor: stairs.frame.origin.y,
        riser: stairs.riser,
        sign,
        ...(p.on === undefined ? {} : { on: p.on }),
      },
    );

    const plan: IAutoMovieMotionHumanActionPlan =
      composeAutoMovieMotionHumanAction({
        base: AutoMovieMotionHumanBase.still(duration, standing, contacts),
        clock,
        contact: "arrived",
        primitives: [climb],
      });
    const railed: IAutoMovieMotionHumanActionPlan =
      p.rail === undefined ? plan : climbStairsRail(context, plan, p.rail);

    // A flight on a moving prop is planned where it stood at the start and
    // carried by the prop. A rider already on it (an escalator's inclined
    // steps) is carried whole from the start, as a walk on a moving support
    // is; one boarding it from the floor (a turning disc's raised deck) is
    // carried footprint by footprint, a floor print staying in the world and
    // a tread print riding from its touchdown (`climbStairsCarry`).
    const moved: IAutoMovieMotionHumanActionPlan =
      p.on === undefined || context.prop(p.on).prop.motion === undefined
        ? railed
        : climbStairsCarry.boarded(context)
          ? HumanSupportCarry.on(context, railed, p.on)
          : climbStairsCarry(context, railed, p.on);
    // The arms the climb leaves hanging are let out of the thighs the steps
    // raise and spread under them (`swungArms`); a hand on the rail is the
    // rail's.
    return swungArms(
      moved,
      body,
      (["left", "right"] as const).filter(
        (side: AutoMovieHumanSide): boolean => p.rail?.hand !== side,
      ),
    );
  }

  /** A footprint: the foot's placement and the tread it is on, 0 for the floor. */
  type IPrint = climbStairsPrints.IPrint;
}
