import { createKerb } from "@automovie/archetypes";
import {
  physicalShapeBounds,
  physicalShapePairDistance,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanAuditMotion,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMoviePhysicalShapeBounds,
  IAutoMovieResolvedBone,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanCrossing,
  AutoMovieMotionHumanGait,
  HumanChain,
  HumanObject,
  HumanPerformance,
} from "@automovie/motions";
import {
  AutoMovieMotionHumanAuditContinuity,
  HumanColliders,
  HumanFoot,
  HumanObstacle,
} from "@automovie/motions/internal";

import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { motionHumanRepeat } from "../../../features/internal/motionHumanRepeat";

/** The wall's centre line along the path, metres. */
const WALL: number = -4;

/** The wall's thickness, metres. */
const THICKNESS: number = 0.7;

/** The low doorway's clear width, metres. */
const WIDTH: number = 0.85;

/** How far below the performer's stature the low doorway's lintel is, metres. */
const DUCK: number = 0.18;

/** Seconds read on each side of a join for its continuity. */
const JOIN: number = 0.25;

/** Samples per second compared between the two independent takes. */
const REPEAT: number = 4;

/** The skin give a displayed segment may press into a prop, metres: the motion audits' built contact skin of 10 mm. */
const SKIN: number = 0.01;

/**
 * Play one continuous chase take over three named obstacles and into the
 * next beat: a walk, a step over a kerb, a walk, a palm-supported vault
 * over a raised step, a ducked passage through a low doorway, a walk and a
 * stand, all through the public chain.
 *
 * Scenarios:
 * 1. An average man and a small woman each play the whole take.
 * 2. Every displayed body segment that does not bear on a prop stays out of
 *    the kerb and the step by no more than the audits' skin give, and every
 *    segment inside the wall's depth stays inside the doorway's clear box.
 * 3. The crossings keep their own supports: a foot on the kerb's far side
 *    after the step and a palm on the step's top during the vault.
 * 4. Every joint centre's displayed path is continuous across each join,
 *    read on the displayed bones a quarter second either side of it.
 * 5. A second, independently built take shows the same bones when the first
 *    is sampled backwards, so absolute seeks repeat.
 * 6. The take ends standing beyond the doorway.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the composed take, both bodies and the six expectations.
 * @evidence contracts/development/testing.md#behavioral-verification Reads displayed colliders against the props' native shapes and the wall's opening, the published support windows, the continuity audit of displayed joints and two independent films.
 * @evidence contracts/development/testing.md#independent-expectations The clearance bound is the motion audits' built skin give and the doorway box comes from the authored wall; continuity uses the audit's 5 mm resolution; repeatability uses the 1e-9 determinism bound.
 * @evidence contracts/development/testing.md#distinguishing-cases Two statures through grounded, supported and lowered crossings in one film; each path's refusal and single-crossing cases stay with test_motion_crossing_named_crossing and test_motion_mechanism_reduced_opening.
 * @evidence contracts/development/testing.md#execution-ownership An in-memory HumanPerformance through the public HumanChain with installed laws.
 */
export function test_motion_gait_traversal_take(): void {
  const all: motionComplaints.IGatherer = motionComplaints();
  const kerb: IAutoMovieMotionHumanProp = HumanObject.prop(
    "kerb",
    createKerb({ kind: "kerb", height: 0.12 }),
    { fixed: true, at: { x: 0, y: 0, z: 0 }, yaw: 0 },
  );
  const step: IAutoMovieMotionHumanProp = HumanObject.prop(
    "step",
    createKerb({ kind: "step" }),
    { fixed: true, at: { x: 0, y: 0, z: -2 }, yaw: 0 },
  );
  const top: number = step.affordances!.find(
    (affordance: IAutoMovieAffordance): boolean => affordance.id === "top",
  )!.frame.translation.y;
  for (const name of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    const height: number = body.measure.stature - DUCK;
    let film: HumanPerformance;
    try {
      film = take(body, kerb, step, height);
    } catch (error) {
      all.check(`${name}: the whole take admits: ${String(error)}`, false);
      continue;
    }
    const segments: readonly IAutoMovieMotionHumanSegment[] =
      film.segments("a");
    all.check(
      `${name}: the take plays its authored beats in order`,
      segments
        .map((segment: IAutoMovieMotionHumanSegment): string => segment.name)
        .join(",") ===
        "stand,walk,crossObstacle,walk,crossObstacle,passThrough,walk,stand",
    );

    // Displayed clearance at 30 frames a second over the whole take.
    let worstProp: IWorst = { depth: 0, bone: "", time: 0 };
    let worstWall: IWorst = { depth: 0, bone: "", time: 0 };
    const frames: number = Math.ceil(film.duration * 30);
    for (let i: number = 0; i <= frames; i++) {
      const time: number = (i * film.duration) / frames;
      const bones: ReturnType<HumanPerformance["bones"]> = film.bones(
        "a",
        time,
      );
      for (const piece of HumanColliders.placed(body, bones)) {
        for (const shape of piece.shapes) {
          const box: IAutoMoviePhysicalShapeBounds.IResult =
            physicalShapeBounds(piece.pose, shape);
          if (
            box.max.z > WALL - THICKNESS / 2 &&
            box.min.z < WALL + THICKNESS / 2
          ) {
            const depth: number = Math.max(
              -WIDTH / 2 - box.min.x,
              box.max.x - WIDTH / 2,
              box.max.y - height,
            );
            if (depth > worstWall.depth)
              worstWall = { depth, bone: piece.bone, time };
          }
          for (const prop of [kerb, step]) {
            if (bears(segments, prop.subject, piece.bone, time)) continue;
            for (const solid of prop.shapes ?? []) {
              const depth: number = -physicalShapePairDistance(
                piece.pose,
                shape,
                prop.frame,
                solid,
              );
              if (depth > worstProp.depth)
                worstProp = {
                  depth,
                  bone: `${piece.bone} in ${prop.subject}`,
                  time,
                };
            }
          }
        }
      }
    }
    all.check(
      `${name}: no free segment enters a prop beyond the skin give, deepest ${worstProp.depth.toFixed(4)} m (${worstProp.bone} at ${worstProp.time.toFixed(3)} s)`,
      worstProp.depth <= SKIN,
    );
    all.check(
      `${name}: the ducked body stays inside the doorway, worst ${worstWall.depth.toFixed(4)} m (${worstWall.bone} at ${worstWall.time.toFixed(3)} s)`,
      worstWall.depth <= 1e-6,
    );

    // Each crossing keeps its own support.
    const vault: IAutoMovieMotionHumanSegment | undefined = segments[4];
    const palm: IAutoMovieMotionHumanContactWindow | undefined =
      vault?.plan.contacts.find(
        (window: IAutoMovieMotionHumanContactWindow): boolean =>
          window.part === "leftHand" &&
          window.support.kind === "prop" &&
          window.support.subject === "step",
      );
    all.check(
      `${name}: the vault bears a palm on the step`,
      palm !== undefined,
    );
    if (vault !== undefined && palm !== undefined) {
      const middle: number =
        vault.start + ((palm.from + palm.to) / 2) * vault.plan.duration;
      const hand: IAutoMovieResolvedBone = film
        .bones("a", middle)
        .get("leftHand")!;
      all.check(
        `${name}: the displayed left wrist is over the step's top at mid-palm`,
        hand.worldPosition.y > top && hand.worldPosition.y < top + 0.2,
      );
    }
    const stepped: IAutoMovieMotionHumanSegment | undefined = segments[2];
    if (stepped !== undefined) {
      const after: ReturnType<HumanPerformance["bones"]> = film.bones(
        "a",
        stepped.end,
      );
      all.check(
        `${name}: both soles are past the kerb after the step`,
        (["left", "right"] as const).every(
          (side: AutoMovieHumanSide): boolean =>
            HumanFoot.sockets(body, after, side)[2]!.point.z < 0,
        ),
      );
    }

    // Each join, read on the displayed bones around the cut.
    for (const join of segments
      .slice(1)
      .map((segment: IAutoMovieMotionHumanSegment): number => segment.start)) {
      const near: IAutoMovieMotionHumanAuditMotion = {
        duration: 2 * JOIN,
        bones: (
          subject: string,
          seconds: number,
        ): ReturnType<HumanPerformance["bones"]> =>
          film.bones(subject, join - JOIN + seconds),
        segments: (): readonly IAutoMovieMotionHumanAuditMotion.ISpan[] => [],
      };
      const reading: ReturnType<
        typeof AutoMovieMotionHumanAuditContinuity.measure
      >["jump"] = AutoMovieMotionHumanAuditContinuity.measure(
        near,
        "a",
        24,
      ).jump;
      const jump: number = reading.value;
      all.check(
        `${name}: every joint's path is continuous across the join at ${join.toFixed(3)} s, jump ${jump.toFixed(4)} m at ${String(reading.where)} ${(join - JOIN + reading.seconds).toFixed(3)} s`,
        jump <= 0.005,
      );
    }
    const repeat: string[] = motionHumanRepeat(
      film,
      take(body, kerb, step, height),
      "a",
      REPEAT,
    );
    all.check(
      `${name}: an independent take repeats under backward seeks: ${repeat.slice(0, 3).join("; ")}`,
      repeat.length === 0,
    );
    const end: ReturnType<HumanPerformance["bones"]> = film.bones(
      "a",
      film.duration,
    );
    all.check(
      `${name}: the take ends standing beyond the doorway`,
      end.get("hips")!.worldPosition.z < WALL - THICKNESS &&
        end.get("head")!.worldPosition.y > 0.8 * body.measure.stature,
    );
  }
  all.assert("one continuous take crosses three named obstacles");
}

/** The deepest entry found so far. */
interface IWorst {
  /** Depth, metres. */
  depth: number;

  /** The entering bone, with the prop. */
  bone: string;

  /** When, film seconds. */
  time: number;
}

/** Build the take. */
function take(
  body: IAutoMovieMotionHumanBody,
  kerb: IAutoMovieMotionHumanProp,
  step: IAutoMovieMotionHumanProp,
  height: number,
): HumanPerformance {
  return new HumanPerformance({
    seed: "traversal-take",
    props: [kerb, step],
    laws: [
      AutoMovieMotionHumanCrossing.HumanTraversal.crossObstacle,
      AutoMovieMotionHumanGait.HumanTravelDoor.passThrough,
    ],
    obstacles: [
      HumanObstacle.wall(
        "wall",
        { x: -3, y: 0, z: WALL },
        { x: 3, y: 0, z: WALL },
        THICKNESS,
        height + 0.5,
        [
          {
            id: "low",
            at: { x: 0, y: 0, z: WALL },
            across: { x: 1, y: 0, z: 0 },
            width: WIDTH,
            height,
          },
        ],
      ),
    ],
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: 1.6 },
        yaw: 180,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("a")
      .stand({ hold: 0.28, sway: 0 })
      .walk({ to: { x: 0, y: 0, z: 0.42 }, face: 180, pace: "slow" })
      .registered("crossObstacle", { kind: "step", obstacle: "kerb" })
      .walk({ to: { x: 0, y: 0, z: -1.25 }, face: 180, pace: "slow" })
      .registered("crossObstacle", {
        kind: "vault",
        over: { prop: "step", point: "top" },
      })
      .registered("passThrough", {
        through: "wall",
        aperture: "low",
        mode: "duck",
      })
      .walk({ to: { x: 0, y: 0, z: -6.4 }, pace: "slow" })
      .stand({ hold: 0.3 }).node,
  });
}

/** Whether the bone is a hand or foot inside a window that bears on the prop at this film second. */
function bears(
  segments: readonly IAutoMovieMotionHumanSegment[],
  subject: string,
  bone: AutoMovieHumanoidBone,
  time: number,
): boolean {
  const foot: boolean = bone.endsWith("Foot") || bone.endsWith("Toes");
  const hand: boolean = /Hand$|Thumb|Index|Middle|Ring|Little/.test(bone);
  if (!foot && !hand) return false;
  const part: IAutoMovieMotionHumanContactWindow["part"] = `${bone.startsWith("left") ? "left" : "right"}${foot ? "Foot" : "Hand"}`;
  return segments.some(
    (segment: IAutoMovieMotionHumanSegment): boolean =>
      time >= segment.start &&
      time <= segment.end &&
      segment.plan.contacts.some(
        (window: IAutoMovieMotionHumanContactWindow): boolean => {
          const share: number = (time - segment.start) / segment.plan.duration;
          return (
            window.part === part &&
            window.support.kind === "prop" &&
            window.support.subject === subject &&
            share >= window.from &&
            share <= window.to
          );
        },
      ),
  );
}
