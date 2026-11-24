import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanWallClimb,
  IAutoMovieVector3,
} from "@automovie/interface";
import { AutoMovieMotionHumanClimb, HumanChain } from "@automovie/motions";
import { HumanHand } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { collectTakeClean } from "../../../features/internal/collectTakeClean";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { motionHumanLaw } from "../../../features/internal/motionHumanLaw";
import { motionHumanStance } from "../../../features/internal/motionHumanStance";

/** The 10 mm displayed hold tolerance in the wall-climb specification. */
const CONTACT: number = 0.01;

/**
 * An explicit climb release gives one foot a free interval while two hands
 * and the other foot hold their places.
 *
 * Scenarios:
 * 1. The right foot releases, remains unassigned at a named stance, and
 *    reaches a separate raised foothold at the next named stance.
 * 2. At the free stance the two displayed grip sockets still reach their
 *    authored fixed holds within 10 mm.
 * 3. The route authoring refuses release of a second limb before acquisition.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the staged route, named contact gap and refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Exercises authored partial stances through the public support planner and reads both the declared contact gap and actual displayed hold geometry.
 * @evidence contracts/development/testing.md#independent-expectations The route specifies which limb releases and the named fixed hold coordinates are the measurement targets. The wall fixture uses the existing 10 mm acceptance bound. This case does not measure a released limb's load or finger contact.
 * @evidence contracts/development/testing.md#distinguishing-cases A free route key is distinct from both assigned keys, and two consecutive releases are invalid even when each individual limb has a hold.
 * @evidence contracts/development/testing.md#execution-ownership The discoverable in-memory unit runs one staged polygon-body performance and one rejected route.
 */
export function test_motion_climb_wall_release(): void {
  const failures: string[] = [];
  for (const key of BODIES)
    try {
      take(key, failures);
    } catch (error) {
      failures.push(
        `${key}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  TestValidator.equals("wall release", failures, []);
}

/** The two canonical bodies. */
const BODIES: readonly BodyKey[] = ["m-average", "f-small"];

/** A canonical body's key. */
type BodyKey = "m-average" | "f-small";

/**
 * The take on one body, its verdicts recorded.
 *
 * @param key The body.
 * @param failures Where a verdict fault is recorded.
 */
function take(key: BodyKey, failures: string[]): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody(key);
  const stance: motionHumanLaw.Bones = motionHumanStance(body);
  const left: IAutoMovieVector3 = stance.get("leftToes")!.worldPosition;
  const right: IAutoMovieVector3 = stance.get("rightToes")!.worldPosition;
  const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
  const out: IAutoMovieVector3 = { x: 0, y: 0, z: -1 };
  const height: number = body.measure.hipHeight + body.measure.upperArm;
  const raised: IAutoMovieVector3 = {
    x: right.x,
    y: body.measure.footLength / 3,
    z: right.z + body.measure.footLength / 2,
  };
  const wall: IAutoMovieMotionHumanProp = {
    subject: "wall",
    fixed: true,
    frame: { position: { x: 0, y: 0, z: 0 }, rotation: Quaternion.identity() },
    points: {
      leftGrip: {
        point: {
          x: body.measure.shoulderHalfWidth,
          y: height,
          z: body.measure.forearm,
        },
        normal: out,
      },
      rightGrip: {
        point: {
          x: -body.measure.shoulderHalfWidth,
          y: height,
          z: body.measure.forearm,
        },
        normal: out,
      },
      leftStart: { point: { ...left, y: 0 }, normal: up },
      rightStart: { point: { ...right, y: 0 }, normal: up },
      raised: { point: raised, normal: up },
    },
  };
  /** One fixed target read by the public route helper. */
  const hold = (point: string): IAutoMovieMotionHumanWallClimb.Hold => ({
    kind: "prop",
    subject: wall.subject,
    point,
  });
  const route: IAutoMovieMotionHumanWallClimb = {
    start: {
      leftHand: hold("leftGrip"),
      rightHand: hold("rightGrip"),
      leftFoot: hold("leftStart"),
      rightFoot: hold("rightStart"),
    },
    moves: [
      { limb: "rightFoot", to: null, seconds: 0.5, event: "free" },
      {
        limb: "rightFoot",
        to: hold("raised"),
        seconds: 0.5,
        event: "acquired",
      },
    ],
  };
  const film: motionHumanLaw.IFilm = motionHumanLaw.perform(
    "exercise-climb",
    [{ subject: "a", body }],
    HumanChain.subject("a").support(
      AutoMovieMotionHumanClimb.wallClimbSupport(route),
    ),
    [wall],
  );
  collectTakeClean(`${key} wall release`, film.performance, failures);
  const segment: IAutoMovieMotionHumanSegment =
    film.performance.segments("a")[0]!;
  const free: number = motionHumanLaw.event(film, "free");
  const acquired: number = motionHumanLaw.event(film, "acquired");
  const freeShare: number = (free - segment.start) / segment.plan.duration;
  const freeBones: motionHumanLaw.Bones = film.bones("a", free);
  TestValidator.predicate(
    "the named free interval releases the right foot before the next acquisition",
    free < acquired &&
      !segment.plan.contacts.some(
        (window: IAutoMovieMotionHumanContactWindow): boolean =>
          window.part === "rightFoot" &&
          window.from <= freeShare &&
          freeShare <= window.to,
      ),
  );
  for (const side of ["left", "right"] as const) {
    const grip: IAutoMovieVector3 = HumanHand.frame(
      body,
      freeBones,
      side,
      "grip",
    ).point;
    TestValidator.predicate(
      `${side} displayed grip stays within 10 mm of its wall hold through the release`,
      Vector3.distance(grip, wall.points[`${side}Grip`]!.point) <= CONTACT,
    );
  }
  TestValidator.predicate(
    "the released foot reaches the next hold",
    Vector3.distance(
      film.bones("a", acquired).get("rightToes")!.worldPosition,
      raised,
    ) <= CONTACT,
  );
  TestValidator.error(
    "releasing a second limb before acquisition is refused",
    (): void => {
      AutoMovieMotionHumanClimb.wallClimbSupport({
        ...route,
        moves: [route.moves[0]!, { limb: "leftHand", to: null }],
      });
    },
  );
}
