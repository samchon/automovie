import {
  createClimbingRope,
  createExerciseMat,
  createPlyoBox,
  createTightrope,
} from "@automovie/archetypes";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanRope,
  IAutoMovieMotionHumanSegment,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanClimb,
  HumanChain,
  HumanObject,
  HumanPerformance,
} from "@automovie/motions";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { motionHumanRefusal } from "../../../features/internal/motionHumanRefusal";

/** A gripping or locked part's largest distance from the rope's axis, metres: the rope's radius and a palm's half thickness. */
const ON_LINE: number = 0.06;

/** How near a descent ends to the floor, metres. */
const FLOOR: number = 0.03;

/** The descent's speed bound, metres per second. */
const SPEED: number = 0.8;

/** The hanging rope's anchor and length, metres. */
const ANCHOR: number = 6;

/** The strung wire's height, metres: within reach from the box the traverse starts on. */
const WIRE: number = 2.1;

/** The swing's landing mat's centre, metres along the swing. */
const LANDING: number = 1.5;

/** The climb's rise, metres. */
const RISE: number = 1.2;

/** One staged rope take. */
interface IStage {
  /** The performer's floor point. */
  at: IAutoMovieVector3;

  /** The performer's yaw, degrees. */
  yaw: number;

  /** The chain. */
  chain: IAutoMovieMotionHumanChain;
}

/**
 * Rope crossings (#3978).
 *
 * Scenarios, on the average man and the small woman:
 * 1. A climb of a hanging rope grips and locks on the line at every stance
 *    and rises to the asked height; a rise past the anchor is refused.
 * 2. The descent after it keeps every hand move within the speed bound and
 *    ends with both feet on the floor.
 * 3. A hanging traverse of a strung wire moves the hands along it to the far
 *    point; a monkey crawl hooks both feet over it; a traverse past the
 *    wire's end is refused.
 * 4. A swing from a box releases and lands on a floor mat; a landing beyond
 *    any release's reach is refused.
 * Every take passes the shipped verdicts.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each crossing, the checks and the refusals.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the displayed hands and feet against the rope's axis, the floor and the landing, and the take through the shipped verdicts.
 * @evidence contracts/development/testing.md#independent-expectations The line, the boxes and the bounds are the props' own and named here.
 * @evidence contracts/development/testing.md#distinguishing-cases Climb, descend, both traverses and the swing, each with its refusal, on two bodies.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances through the public chain.
 */
export function test_motion_climb_rope(): void {
  const all: motionComplaints.IGatherer = motionComplaints();
  const hanging: IAutoMovieMotionHumanProp = HumanObject.prop(
    "rope",
    createClimbingRope({ anchor: ANCHOR, length: ANCHOR - 0.2 }),
    { at: { x: 0, y: 0, z: 0.3 }, yaw: 0, fixed: true },
  );
  const wire: IAutoMovieMotionHumanProp = HumanObject.prop(
    "wire",
    createTightrope({ height: WIRE, span: 6 }),
    { at: { x: 0, y: 0, z: 0 }, yaw: 0, fixed: true },
  );
  const box = createPlyoBox({ kind: "wood" });
  const top: number = box.affordances.find((a) => a.id === "surface")!.frame
    .translation.y;
  const from: IAutoMovieMotionHumanProp = HumanObject.prop("from", box, {
    at: { x: 0, y: 0, z: -2 },
    yaw: 0,
    fixed: true,
  });
  // The swing lands on a floor mat below the take-off box; the far one is beyond any release.
  const mat = createExerciseMat({ kind: "gym" });
  const matTop: number = mat.affordances.find((a) => a.id === "surface")!.frame
    .translation.y;
  const to: IAutoMovieMotionHumanProp = HumanObject.prop("to", mat, {
    at: { x: 0, y: 0, z: LANDING },
    yaw: 0,
    fixed: true,
  });
  const far: IAutoMovieMotionHumanProp = HumanObject.prop("far", mat, {
    at: { x: 0, y: 0, z: 9 },
    yaw: 0,
    fixed: true,
  });
  // The box the traverse starts on, under the wire's start.
  const stool: IAutoMovieMotionHumanProp = HumanObject.prop("stool", box, {
    at: { x: -1.5, y: 0, z: 0 },
    yaw: 0,
    fixed: true,
  });
  const swingRope: IAutoMovieMotionHumanProp = HumanObject.prop(
    "swingRope",
    createClimbingRope({ anchor: ANCHOR, length: ANCHOR - top - 0.6 }),
    { at: { x: 0, y: 0, z: 0 }, yaw: 0, fixed: true },
  );
  const props: IAutoMovieMotionHumanProp[] = [
    hanging,
    wire,
    from,
    to,
    far,
    stool,
    swingRope,
  ];
  for (const fit of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(fit);
    const perform = (stage: IStage): HumanPerformance =>
      new HumanPerformance({
        seed: "rope",
        performers: [
          {
            subject: "a",
            body,
            at: stage.at,
            yaw: stage.yaw,
            proficiency: { level: "trained" },
          },
        ],
        props,
        laws: [AutoMovieMotionHumanClimb.rope.rope],
        composition: stage.chain.node,
      });
    const rope = (
      p: IAutoMovieMotionHumanRope.IParams,
    ): IAutoMovieMotionHumanChain =>
      HumanChain.subject("a").registered("rope", p);

    // 1-2. Climb, then descend at the bound.
    try {
      const take: HumanPerformance = perform({
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        chain: rope({
          kind: "climb",
          rope: "rope",
          line: "line",
          rise: RISE,
        }).registered("rope", {
          kind: "descend",
          rope: "rope",
          line: "line",
          speed: SPEED,
        }),
      });
      assertTakeClean(`${fit} rope climb and descent`, take);
      const [climb, descend]: IAutoMovieMotionHumanSegment[] = ropes(take);
      const line: (point: IAutoMovieVector3) => number = (
        point: IAutoMovieVector3,
      ): number => Math.hypot(point.x - 0, point.z - 0.3);
      for (const [segment, label] of [
        [climb!, "climb"],
        [descend!, "descent"],
      ] as const)
        for (const at of instants(segment, /^(grip|lock|hand|onRope)/)) {
          const bones = take.bones("a", at);
          for (const part of ["leftHand", "rightHand"] as const)
            all.check(
              `${fit} ${label}: the ${part} grips the rope at ${at.toFixed(2)} s (${line(bones.get(part)!.worldPosition).toFixed(3)} m off its axis)`,
              line(bones.get(part)!.worldPosition) <= ON_LINE,
            );
        }
      const hands = (t: number): number =>
        Math.max(
          ...(["leftHand", "rightHand"] as const).map(
            (b: AutoMovieHumanoidBone): number =>
              take.bones("a", t).get(b)!.worldPosition.y,
          ),
        );
      const start: number = hands(climb!.start);
      all.check(
        `${fit} climb rises at least ${RISE} m less a step (${(hands(climb!.end) - start).toFixed(3)} m)`,
        hands(climb!.end) - start >= RISE - 0.5,
      );
      const moves: number[] = instants(descend!, /.*/);
      for (let i: number = 1; i < moves.length; i++) {
        const drop: number = hands(moves[i - 1]!) - hands(moves[i]!);
        const seconds: number = moves[i]! - moves[i - 1]!;
        all.check(
          `${fit} descent keeps its hands within ${SPEED} m/s (${(drop / seconds).toFixed(3)} m/s)`,
          drop / seconds <= SPEED + 1e-6,
        );
      }
      const end = take.bones("a", descend!.end);
      all.check(
        `${fit} descent ends on the floor`,
        (["leftToes", "rightToes"] as const).every(
          (b: AutoMovieHumanoidBone): boolean =>
            end.get(b)!.worldPosition.y <= FLOOR,
        ),
      );
    } catch (error: unknown) {
      all.check(`${fit} rope climb and descent: ${String(error)}`, false);
    }
    all.check(
      `${fit} a rise past the anchor is refused`,
      motionHumanRefusal(
        () =>
          perform({
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            chain: rope({
              kind: "climb",
              rope: "rope",
              line: "line",
              rise: ANCHOR,
            }),
          }).bones("a", 1),
        { kind: "reach", axis: "rise", act: "rope" },
      ),
    );

    // 3. Traverses of the strung wire.
    for (const style of ["hang", "monkey"] as const)
      try {
        const take: HumanPerformance = perform({
          at: { x: -1.5, y: top, z: 0 },
          yaw: 90,
          chain: rope({
            kind: "traverse",
            rope: "wire",
            line: "bar",
            along: 2,
            style,
          }),
        });
        assertTakeClean(`${fit} ${style} traverse`, take);
        const [crossing]: IAutoMovieMotionHumanSegment[] = ropes(take);
        const end = take.bones("a", crossing!.end);
        const reached: number = Math.max(
          end.get("leftHand")!.worldPosition.x,
          end.get("rightHand")!.worldPosition.x,
        );
        all.check(
          `${fit} ${style} traverse reaches the far point (${reached.toFixed(3)} m)`,
          Math.abs(reached - 0.5) <= 0.1,
        );
        for (const at of instants(crossing!, /^(hang|move)/)) {
          const bones = take.bones("a", at);
          const off = (b: AutoMovieHumanoidBone): number =>
            Math.hypot(
              bones.get(b)!.worldPosition.y - WIRE,
              bones.get(b)!.worldPosition.z,
            );
          all.check(
            `${fit} ${style}: both hands on the wire at ${at.toFixed(2)} s`,
            off("leftHand") <= ON_LINE && off("rightHand") <= ON_LINE,
          );
          if (style === "monkey" && instants(crossing!, /^move/).includes(at))
            all.check(
              `${fit} monkey: both feet hooked on the wire at ${at.toFixed(2)} s`,
              off("leftFoot") <= ON_LINE * 2 && off("rightFoot") <= ON_LINE * 2,
            );
        }
      } catch (error: unknown) {
        all.check(`${fit} ${style} traverse: ${String(error)}`, false);
      }
    all.check(
      `${fit} a traverse past the wire's end is refused`,
      motionHumanRefusal(
        () =>
          perform({
            at: { x: -1.5, y: top, z: 0 },
            yaw: 90,
            chain: rope({
              kind: "traverse",
              rope: "wire",
              line: "bar",
              along: 8,
            }),
          }).bones("a", 1),
        { kind: "reach", axis: "along", act: "rope" },
      ),
    );

    // 4. The swing to the far box.
    try {
      const take: HumanPerformance = perform({
        at: { x: 0, y: top, z: -2 },
        yaw: 0,
        chain: rope({
          kind: "swing",
          rope: "swingRope",
          line: "line",
          landing: "to",
          surface: "surface",
        }),
      });
      assertTakeClean(`${fit} rope swing`, take);
      const [swing]: IAutoMovieMotionHumanSegment[] = ropes(take);
      const end = take.bones("a", swing!.end);
      all.check(
        `${fit} swing lands both feet on the mat`,
        (["leftToes", "rightToes"] as const).every(
          (b: AutoMovieHumanoidBone): boolean =>
            Math.abs(end.get(b)!.worldPosition.y - matTop) <= FLOOR &&
            Math.abs(end.get(b)!.worldPosition.z - LANDING) <= 0.4,
        ),
      );
    } catch (error: unknown) {
      all.check(`${fit} rope swing: ${String(error)}`, false);
    }
    all.check(
      `${fit} a landing no release reaches is refused`,
      motionHumanRefusal(
        () =>
          perform({
            at: { x: 0, y: top, z: -2 },
            yaw: 0,
            chain: rope({
              kind: "swing",
              rope: "swingRope",
              line: "line",
              landing: "far",
              surface: "surface",
            }),
          }).bones("a", 1),
        { kind: "reach", axis: "landing", act: "rope" },
      ),
    );
  }
  all.assert("rope");
}

/** The take's rope segments, in order. */
function ropes(take: HumanPerformance): IAutoMovieMotionHumanSegment[] {
  return take
    .segments("a")
    .filter(
      (s: IAutoMovieMotionHumanSegment): boolean => s.law.name === "rope",
    );
}

/** A segment's event instants whose names match, film seconds. */
function instants(
  segment: IAutoMovieMotionHumanSegment,
  name: RegExp,
): number[] {
  return segment.plan.events
    .filter((event: IAutoMovieMotionEvent): boolean => name.test(event.name))
    .map(
      (event: IAutoMovieMotionEvent): number =>
        segment.start + event.share * (segment.end - segment.start),
    );
}
