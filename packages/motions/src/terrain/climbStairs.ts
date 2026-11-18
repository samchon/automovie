import { minimumJerk } from "@automovie/engine";
import type {
  AutoMovieMotionHumanActionName,
  IAutoMovieMotionClock,
  IAutoMovieMotionClockInstant,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanClearance,
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
import { walk } from "../actions/walk";
import { walkRoot } from "../actions/walkRoot";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanClearance } from "../compose/AutoMovieMotionHumanClearance";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionHumanLean } from "../compose/AutoMovieMotionHumanLean";
import { AutoMovieMotionHumanLeg } from "../compose/AutoMovieMotionHumanLeg";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { climbStairsFeet } from "./climbStairsFeet";
import { climbStairsFlight } from "./climbStairsFlight";
import { climbStairsPelvis } from "./climbStairsPelvis";
import { climbStairsProfile } from "./climbStairsProfile";

/** Offset decay time of a cut out of the arrived climb, seconds (a deliberate change of the whole body's action, `AutoMovieMotionHumanInterrupt.BLENDS.deliberate`). */
const BLEND: number = AutoMovieMotionHumanInterrupt.BLENDS.deliberate;

/**
 * Climbing a flight of stairs up or down from standing before its first
 * nosing, step over step (one foot per tread) or step by step (both feet on
 * each tread), ending with both feet on the last tread.
 *
 * The flight lies ahead along the heading: its first nosing `start` metres
 * ahead of the toes, `count` treads of `riser` and `tread` metres, rising for
 * `up` and falling below the floor for `down`. The goals are footprints: each
 * foot lands with the middle of its sole on the middle of its tread, at its
 * standing lateral place; a sole too long to keep `EDGE` from both edges
 * there hangs its heel over the nosing ascending and its toes over the next
 * one descending, as a long foot stands on a short tread, and on the landing
 * stands `EDGE` past the last nosing. A swinging foot
 * takes the shortest path over the flight that keeps every point of its sole
 * above the surface under it and `CLEARANCE` above each edge it passes
 * (`AutoMovieMotionHumanClearance`): ascending it lifts beside the riser and
 * follows the line of the nosings, descending it moves forward and lowers
 * once its heel is past the nosing. The pelvis moves between the stances on
 * minimum-jerk progress over the middle of the two feet, half a step behind
 * them over the floor (`climbStairsPelvis`). Its height at a
 * stance is the highest from which both legs reach their feet, so the lower
 * foot's leg is straight and the upper one's bent; it changes while a foot
 * swings and holds in double support, and is lowered wherever either leg,
 * planted or swinging, could not reach its foot.
 *
 * The trunk inclines forward by `ASCENT_LEAN` going up and by a walk's
 * inclination going down, shared between the pelvis and the spine by the
 * lumbopelvic rhythm and tipped about the hips, since the trunk flexes
 * forward more in stair ascent than in level walking (McFadyen and Winter
 * 1988, J Biomech 21:733).
 *
 * The cadence is 90 steps a minute (Mian, Narici, Minetti and Baltzopoulos
 * 2007, Gait Posture 26:463), scaled by the square root of the hip height
 * (Alexander 1984) and by the manner's tempo; each swing takes 0.8 of a step
 * and the double support the rest (provisional). Risers from 100 to 180 mm and
 * treads from 280 mm are the 2010 ADA ranges (504.2), the defaults 170 and
 * 280 mm; a riser above 0.35 of the hip height or a tread shorter than 0.6
 * of the foot is refused with the body's feasible range (provisional limits).
 * Events: `toeOff<n>` and `treadContact<n>` per step, numbered from 1. A foot
 * on a tread bears on the prop `on` names, or on the fixed floor frame when
 * no prop is named; a foot on the floor before the flight bears on the
 * ground. The treads repeat the settled stance's flat feet, while the feet
 * leave the floor from where the entry put them.
 *
 * Not yet: handrail use (no `bar` affordance exists, A8), landing turns,
 * ramps and slopes, which belong to the walk on a sloped support.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the flight, the footprints, the swing rule, the timing with sources, the refusals and what is missing.
 * @evidence contracts/development/design.md#principled-representation A law record composed of one body row over a step schedule on one clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the name, the cancel table, the parameters, the constants, the plan and the surface height its capture reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The flight is the author's architecture; every footprint is read from it and the body's measure.
 */
export namespace climbStairs {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionName = "climbStairs";

  /** Cancel table: the climb ends into standing or walking once both feet are on the last tread. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    stand: [
      { window: ["arrived", 1], kind: "inertialize", entry: 0, blend: BLEND },
    ],
    walk: [
      { window: ["arrived", 1], kind: "inertialize", entry: 0, blend: BLEND },
    ],
  };

  /** How far above an edge a swinging sole passes it, metres (provisional; the issue's 20 mm toe clearance is the bound the capture checks). */
  export const CLEARANCE: number = 0.05;

  /** The least distance along the flight a planted sole's heel and toe keep from an edge, metres (provisional). */
  export const EDGE: number = 0.025;

  /** Steps a minute (Mian et al. 2007). */
  export const CADENCE: number = 90;

  /** The share of a step the foot swings (provisional). */
  export const SWING: number = 0.8;

  /** The flight's surface height under a point (`climbStairsFlight.surface`). */
  export const surface: typeof climbStairsFlight.surface = climbStairsFlight.surface;

  /** The flight a set of parameters describes (`climbStairsFlight.flight`). */
  export const flight: typeof climbStairsFlight.flight = climbStairsFlight.flight;

  /**
   * Plan a climb.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {Error} When `flight` refuses the stairs.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The namespace states the architecture, footprint and clearance rule, timing and refusals; this plan retains those rules and prepares fixed geometry.
   * @evidence contracts/development/implementation.md#principled-implementation The same tread footprints and shortest clearance paths drive each foot, with unchanged stance lowering and lumbopelvic trunk inclination.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Fixed sole geometry, footprint/edge preparation, step clock, stance heights and prepared foot/pelvis readers precede the body primitive.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No riser, tread, clearance, contact time, gait period or reach constraint changes.
   * @evidence contracts/development/implementation.md#efficient-algorithms Preparation scales with authored steps and clearance-path construction; pose reads select foot and pelvis intervals logarithmically and retain the same leg lowering/goal computations. Two fixed-rotation goal readers share actual footprint heading, knee/rest and toe-contact prerequisites, with ordinary goal fallback whenever the actual rotation changes.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The fixed body and flight share sole offsets, each side/level footprint, edge-clearance heights and toe contacts; the final clock fixes every prepared interval. Synchronous stance-height construction borrows one exact FK workspace across all actual steps, and playback borrows only its current composite observation's source.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Plan-owned footprints, edges, stance heights and readers grow with step count and release with the climb. The stance-construction FK workspace ends with that block, and neither it nor playback's current loan enters retained numeric heights or a query history.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanClimbStairs.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const body: IAutoMovieMotionHumanBody = context.body;
    const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
    const p: IAutoMovieMotionHumanClimbStairs.IParams = context.params;
    const lead: "left" | "right" = p.lead ?? "right";
    const trail: "left" | "right" = lead === "left" ? "right" : "left";
    // The feet leave the floor from the entry; the treads repeat the
    // settled stance's flat feet (`stand.footprints`).
    const stood: stand.IFootprints = stand.footprints(context);
    const standing: IAutoMovieMotionHumanPosture = stood.standing;
    const entered: Record<"left" | "right", IAutoMovieMotionHumanFoot.IPlacement> = stood.entered;
    const flats: Record<"left" | "right", IAutoMovieMotionHumanFoot.IPlacement> = stood.settled;
    const yaw: number = standing.yaw;
    const stairs: IAutoMovieMotionHumanClimbStairsFlight.IFlight = flight(body, standing, p);
    const framed: HumanFrame.IPrepared = HumanFrame.prepare(stairs.frame);
    const sign: number = stairs.direction === "up" ? 1 : -1;
    const modifiers: IAutoMovieMotionManner.IModifiers =
      AutoMovieMotionManner.of(context, p.manner);

    // Footprints: the settled flat sole on its tread at the standing lateral place.
    const flat: (side: "left" | "right") => IAutoMovieMotionHumanFoot.IPlacement = (side: "left" | "right"): IAutoMovieMotionHumanFoot.IPlacement => flats[side];
    const goals: Record<"left" | "right", ReturnType<typeof AutoMovieMotionHumanLeg.preparePlacement>> = {
      left: AutoMovieMotionHumanLeg.preparePlacement(body, "left", flats.left.rotation),
      right: AutoMovieMotionHumanLeg.preparePlacement(body, "right", flats.right.rotation),
    };
    // The sole's heel, ball and toe about the ankle of a flat foot, along
    // the flight and in height.
    function soleOf(
      side: "left" | "right",
    ): IAutoMovieMotionHumanClearance.IPoint[] {
      return (["heel", "ball", "toe"] as const).map((point: "heel" | "ball" | "toe"): IAutoMovieMotionHumanClearance.IPoint => {
        const at: IAutoMovieVector3 = HumanFoot.point(
          body,
          side,
          point,
          flat(side),
        );
        return {
          z:
            framed.local(at).z -
            framed.local(flat(side).ankle).z,
          y: at.y - flat(side).ankle.y,
        };
      });
    }
    const soles: Record<"left" | "right", IAutoMovieMotionHumanClearance.IPoint[]> = {
      left: soleOf("left"), right: soleOf("right"),
    };
    const sole: (side: "left" | "right") => IAutoMovieMotionHumanClearance.IPoint[] = (side: "left" | "right"): IAutoMovieMotionHumanClearance.IPoint[] => soles[side];
    const printOf: (side: "left" | "right", level: number) => IPrint = (side: "left" | "right", level: number): IPrint => {
      if (level === 0) return { placement: entered[side], level: 0 };
      const [heel, , toe]: IAutoMovieMotionHumanClearance.IPoint[] = sole(side);
      const length: number = toe!.z - heel!.z;
      const edge: number = stairs.first + (level - 1) * stairs.tread;
      // The last tread is the landing: it has no far edge to keep from.
      const heelAt: number =
        length <= stairs.tread - 2 * EDGE
          ? edge + (stairs.tread - length) / 2
          : level === stairs.count
            ? edge + EDGE
            : sign > 0
              ? edge - EDGE
              : edge + stairs.tread + EDGE - length;
      const ankle: IAutoMovieVector3 = flat(side).ankle;
      return {
        placement: {
          ankle: framed.point({
            x: framed.local(ankle).x,
            y: ankle.y + sign * level * stairs.riser,
            z: heelAt - heel!.z,
          }),
          rotation: flat(side).rotation,
        },
        level,
      };
    };
    const footprints: Record<"left" | "right", Map<number, IPrint>> = {
      left: new Map(), right: new Map(),
    };
    const print: (side: "left" | "right", level: number) => IPrint = (side: "left" | "right", level: number): IPrint => {
      let out: IPrint | undefined = footprints[side].get(level);
      if (out === undefined) footprints[side].set(level, (out = printOf(side, level)));
      return out;
    };

    // The height asked of a swinging ankle along the flight: every sole
    // point on or above the surface under it, and `CLEARANCE` above an edge
    // it is passing.
    const profile: (z: number) => number =
      climbStairsProfile(stairs, EDGE - EDGE_MARGIN, CLEARANCE);
    const required: (side: "left" | "right") => (z: number) => number =
      (side: "left" | "right"): ((z: number) => number) => {
        const points: readonly IAutoMovieMotionHumanClearance.IPoint[] = sole(side);
        return (z: number): number => {
          let height: number = -Infinity;
          for (const point of points)
            height = Math.max(height, profile(z + point.z) - point.y);
          return height;
        };
      };

    // The step schedule: which foot goes to which tread, in order.
    const steps: { side: "left" | "right"; level: number }[] = [];
    if ((p.pattern ?? "stepOverStep") === "stepOverStep") {
      for (let i: number = 1; i <= stairs.count; i++)
        steps.push({ side: i % 2 === 1 ? lead : trail, level: i });
      steps.push({
        side: stairs.count % 2 === 1 ? trail : lead,
        level: stairs.count,
      });
    } else
      for (let i: number = 1; i <= stairs.count; i++)
        steps.push({ side: lead, level: i }, { side: trail, level: i });

    // The clock: a step period per swing, the swing at its end, and a settle.
    const period: number = (60 / CADENCE) * Math.sqrt(m.hipHeight / walkRoot.REFERENCE_HIP);
    const instants: IAutoMovieMotionClockInstant[] = [];
    steps.forEach((_: unknown, j: number): void => {
      instants.push(
        { name: `toeOff${j + 1}`, seconds: (j + 1 - SWING) * period },
        { name: `treadContact${j + 1}`, seconds: (j + 1) * period },
      );
    });
    instants.push({ name: "arrived", seconds: steps.length * period });
    const clock: IAutoMovieMotionClock = AutoMovieMotionManner.time(
      AutoMovieMotionClock.of((steps.length + SETTLE) * period, instants),
      modifiers,
      { holds: [] },
    );
    const duration: number = clock.duration;

    // Each foot's prints in order, with the step that brings it there.
    const prints: Record<"left" | "right", { print: IPrint; step: number }[]> =
      {
        left: [{ print: print("left", 0), step: 0 }],
        right: [{ print: print("right", 0), step: 0 }],
      };
    steps.forEach((s: (typeof steps)[number], j: number): void => {
      prints[s.side].push({ print: print(s.side, s.level), step: j + 1 });
    });

    // The stances: both feet after each step, and the root over their
    // middle as high as both legs reach from it.
    function reached(
      posture: IAutoMovieMotionHumanPosture,
      feet: Record<"left" | "right", IAutoMovieMotionHumanFoot.IPlacement>,
      resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
    ): IAutoMovieVector3 {
      return resolveHumanPosture.lower(body, {
        ...posture,
        limbs: {
          ...posture.limbs,
          leftLeg: goals.left(posture, feet.left, true),
          rightLeg: goals.right(posture, feet.right, true),
        },
      }, undefined, resolution).root;
    }
    const stance: IAutoMovieVector3[] = [standing.root];
    {
      const resolution: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution();
      const now: Record<"left" | "right", IPrint> = {
        left: print("left", 0),
        right: print("right", 0),
      };
      for (const s of steps) {
        now[s.side] = print(s.side, s.level);
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

    // A swinging foot's path: the shortest one over the flight's profile,
    // travelled on minimum-jerk progress.
    function swing(
      side: "left" | "right",
      a: IAutoMovieMotionHumanFoot.IPlacement,
      b: IAutoMovieMotionHumanFoot.IPlacement,
    ): (s: number) => IAutoMovieMotionHumanFoot.IPlacement {
      const from: IAutoMovieVector3 = framed.local(a.ankle);
      const to: IAutoMovieVector3 = framed.local(b.ankle);
      const across: number = to.x - from.x;
      const forward: number = Math.max(1e-9, to.z - from.z);
      const path: ReturnType<typeof AutoMovieMotionHumanClearance.path> = AutoMovieMotionHumanClearance.path(
        { z: from.z, y: a.ankle.y },
        { z: to.z, y: b.ankle.y },
        required(side),
      );
      return (s: number): IAutoMovieMotionHumanFoot.IPlacement => {
        const at: IAutoMovieMotionHumanClearance.IPoint = path(minimumJerk.share(Math.min(1, Math.max(0, s))));
        return {
          ankle: framed.point({
            x:
              from.x +
              (across * (at.z - from.z)) / forward,
            y: at.y,
            z: at.z,
          }),
          rotation: b.rotation,
        };
      };
    }
    const footAt: ReturnType<typeof climbStairsFeet> =
      climbStairsFeet(prints, clock, swing);
    const rootAt: (seconds: number) => IAutoMovieVector3 = climbStairsPelvis.of(
      stance,
      clock,
      steps.length,
      duration,
    );

    // The trunk inclines forward over the climb, more ascending than on the
    // level, and is shared by the pelvis and the spine.
    const inclined: ReturnType<typeof HumanTrunk.incline> = HumanTrunk.incline(
      standUpright.of(body).joints,
      p.direction === "down" ? walk.LEAN : ASCENT_LEAN,
    );
    const contact: Record<"left" | "right", IAutoMovieVector3> = {
      left: HumanFoot.offset(body, "left", "mtp"),
      right: HumanFoot.offset(body, "right", "mtp"),
    };
    const climb: IAutoMovieMotionHumanPrimitive = {
      channels: ["root", "trunk", "leftLeg", "rightLeg"],
      reads: ["root", "trunk", "leftLeg", "rightLeg"],
      from: 0,
      to: duration,
      write: (posture: IAutoMovieMotionHumanPosture, seconds: number, _before?: IAutoMovieMotionHumanPrimitive.Reader, resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2]): IAutoMovieMotionHumanPosture => {
        const placed: IAutoMovieMotionHumanPosture = AutoMovieMotionHumanLean.pivot(
          body,
          {
            ...posture,
            root: rootAt(seconds),
            yaw,
            joints: { ...posture.joints, ...inclined.joints },
          },
          { pitch: inclined.pitch, roll: 0 },
        );
        // The root stays where the swinging leg reaches its foot too, so
        // the foot keeps its clearing path.
        const feet: Record<"left" | "right", ReturnType<typeof footAt>> = {
          left: footAt("left", seconds),
          right: footAt("right", seconds),
        };
        const root: IAutoMovieVector3 = reached(placed, {
          left: feet.left.placement,
          right: feet.right.placement,
        }, resolution);
        // A swinging foot keeps its ball on the path: where the ankle's
        // range keeps the sole from lying flat (a deep step up), the heel
        // rises about the ball and the forefoot leads onto the tread.
        const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...posture.limbs };
        for (const side of ["left", "right"] as const)
          limbs[`${side}Leg`] = {
            ...goals[side](
              { root, yaw },
              feet[side].placement,
              feet[side].planted,
            ),
            contact: contact[side],
          };
        return { ...placed, root, limbs };
      },
    };

    // Plant windows between each foot's swings, on the floor or on the flight.
    const contacts: IAutoMovieMotionHumanContactWindow[] = [];
    for (const side of ["left", "right"] as const) {
      const list: (typeof prints)["left"] = prints[side];
      for (let i: number = 0; i < list.length; i++) {
        const level: number = list[i]!.print.level;
        const from: number =
          i === 0 ? 0 : clock.at(`treadContact${list[i]!.step}`) / duration;
        const to: number =
          i + 1 < list.length
            ? clock.at(`toeOff${list[i + 1]!.step}`) / duration
            : 1;
        contacts.push({
          part: side === "left" ? "leftFoot" : "rightFoot",
          kind: "plant",
          from,
          to,
          support:
            level === 0
              ? { kind: "ground" }
              : p.on === undefined
                ? { kind: "ground", height: stairs.frame.origin.y + sign * level * stairs.riser }
                : { kind: "prop", subject: p.on },
        });
      }
    }

    return composeAutoMovieMotionHumanAction({
      base: AutoMovieMotionHumanBase.still(duration, standing, contacts),
      clock,
      contact: "arrived",
      primitives: [climb],
    });
  }

  /** A footprint: the foot's placement and the tread it is on, 0 for the floor. */
  interface IPrint {
    /** The ankle and foot rotation, world metres. */
    placement: IAutoMovieMotionHumanFoot.IPlacement;

    /** The tread, 1 the first; 0 for the floor before the flight. */
    level: number;
  }
}

/** The trunk's forward inclination ascending stairs, degrees (provisional: more than a walk's, McFadyen and Winter 1988, J Biomech 21:733). */
const ASCENT_LEAN: number = 8;

/** How much narrower than `EDGE` the band around a nosing that asks for clearance is, metres: a planted sole held `EDGE` from the nosing lies outside the band, not on its edge. */
const EDGE_MARGIN: number = 0.003;

/** Step periods the climb holds both feet on the last tread after arriving (provisional). */
const SETTLE: number = 0.3;
