import type {
  IAutoMovieMotionHumanProp,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanObject } from "@automovie/motions";
import {
  HumanPerformanceSite,
  HumanRefusal,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { drivenDoorState } from "../../internal/fixtures/drivenDoorState";
import { standingPerformanceState } from "../../internal/fixtures/standingPerformanceState";
import { testAffordance } from "../../internal/fixtures/testAffordance";

/**
 * How far a site may stand from its closed form: a quarter turn of a metre, far
 * above its rounding.
 */
const SITE: number = 1e-12;

/** A point. */
const P = (x: number, y: number, z: number): IAutoMovieVector3 => ({ x, y, z });

/** A quarter turn about `+Z`, taking `+Y` to `-X`. */
const ROLL: IAutoMovieQuaternion = {
  x: 0,
  y: 0,
  z: Math.SQRT1_2,
  w: Math.SQRT1_2,
};

/**
 * `HumanPerformanceSite` places a prop's named point in the world at a second:
 * where the prop itself places a part it moves, else the prop's displayed frame
 * composed with the point's frame on the posed or resting prop.
 *
 * Scenarios:
 *
 * 1. A crate turned 90 degrees about `+Y` at the origin has a tag at (1, 0, 0)
 *    rolled a quarter about `+Z`: the site is at (0, 0, -1), and its turn, the
 *    crate's then the tag's, takes `+Y` to `+Z`.
 * 2. A cart whose contacts the cart itself places reads the placed point and its
 *    turn.
 * 3. A door whose hinge an action drives to 10 degrees by 2 s has its handle at
 *    (10, 1, 0): the posed point, not the rest one.
 * 4. An unknown prop is refused on `support`, an unknown point on `point`.
 */
export async function test_motions_perform_site(): Promise<void> {
  const crate: IAutoMovieMotionHumanProp = HumanObject.prop(
    "crate",
    { affordances: [testAffordance("tag", "handle", P(1, 0, 0), ROLL)] },
    { at: P(0, 0, 0), yaw: 90 },
  );
  const cart: IAutoMovieMotionHumanProp = HumanObject.prop(
    "cart",
    { affordances: [testAffordance("pedal", "pedal", P(0, 0.3, 0))] },
    { at: P(5, 0, 0), yaw: 0 },
    undefined,
    (_id: string, seconds: number) => ({
      translation: P(5 + seconds, 0.3, 0),
      rotation: ROLL,
      scale: P(1, 1, 1),
    }),
  );
  const { state } = await standingPerformanceState([crate, cart]);

  // 1. A turned point on a turned prop.
  const tag: IAutoMovieRigidTransform = HumanPerformanceSite(
    state,
    "crate",
    "tag",
    0.5,
  );
  TestValidator.predicate(
    "the prop's frame then the point's",
    near(tag.position, P(0, 0, -1)) &&
      near(turn(tag.rotation, P(0, 1, 0)), P(0, 0, 1)),
  );

  // 2. A placed part.
  const pedal: IAutoMovieRigidTransform = HumanPerformanceSite(
    state,
    "cart",
    "pedal",
    1,
  );
  TestValidator.predicate(
    "a part the prop places",
    near(pedal.position, P(6, 0.3, 0)) &&
      near(turn(pedal.rotation, P(0, 1, 0)), P(-1, 0, 0)),
  );

  // 3. A posed point.
  const { self } = await drivenDoorState([
    {
      start: 1,
      end: 3,
      duration: 2,
      drives: [
        {
          prop: "door",
          articulation: "hinge",
          from: 0,
          to: 1,
          travel: (seconds: number): number => 10 * seconds,
        },
      ],
    },
  ]);
  TestValidator.predicate(
    "a posed point",
    near(HumanPerformanceSite(self, "door", "pull", 2).position, P(10, 1, 0)),
  );

  // 4. Refusals.
  TestValidator.predicate(
    "unknown props and points",
    refused(() => HumanPerformanceSite(state, "ghost", "tag", 0), "support") &&
      refused(() => HumanPerformanceSite(state, "crate", "lid", 0), "point"),
  );
}

/** A vector turned. */
function turn(
  q: IAutoMovieQuaternion,
  v: IAutoMovieVector3,
): IAutoMovieVector3 {
  const tx: number = 2 * (q.y * v.z - q.z * v.y);
  const ty: number = 2 * (q.z * v.x - q.x * v.z);
  const tz: number = 2 * (q.x * v.y - q.y * v.x);
  return {
    x: v.x + q.w * tx + (q.y * tz - q.z * ty),
    y: v.y + q.w * ty + (q.z * tx - q.x * tz),
    z: v.z + q.w * tz + (q.x * ty - q.y * tx),
  };
}

/** Whether two points agree within the site bound. */
function near(a: IAutoMovieVector3, b: IAutoMovieVector3): boolean {
  return (
    Math.abs(a.x - b.x) <= SITE &&
    Math.abs(a.y - b.y) <= SITE &&
    Math.abs(a.z - b.z) <= SITE
  );
}

/** Whether a task refuses on the axis. */
function refused(task: () => unknown, axis: string): boolean {
  try {
    task();
    return false;
  } catch (error) {
    return (
      error instanceof HumanRefusal &&
      error.axis === axis &&
      error.kind === "affordance"
    );
  }
}
