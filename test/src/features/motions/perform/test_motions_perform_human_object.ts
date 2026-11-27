import type {
  IAutoMovieMotionHumanObject,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSeated,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { AutoMovieMotionHumanObject } from "@automovie/motions";
import { AutoMovieMotionHumanRefusal } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { testAffordance } from "../../internal/fixtures/testAffordance";

/**
 * How far a placed point or turn may stand from its closed form: a quarter turn
 * of decimetre offsets, far above its rounding.
 */
const PLACE: number = 1e-12;

/** A point. */
const P = (x: number, y: number, z: number): IAutoMovieVector3 => ({ x, y, z });

/** No turn. */
const IDENTITY: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };

/** A quarter turn about `+Z`, taking `+Y` to `-X`. */
const ROLL: IAutoMovieQuaternion = {
  x: 0,
  y: 0,
  z: Math.SQRT1_2,
  w: Math.SQRT1_2,
};

/**
 * `AutoMovieMotionHumanObject` places an object in a performance: `frame` reads a placement,
 * `prop` makes the prop whose named points are its affordances, and `seat`
 * places a seat in the world with its heading, declared fields and footrests.
 *
 * Scenarios:
 *
 * 1. A rigid placement is its own frame; `{ at, yaw: 90 }` turns `+Z` to `+X`
 *    about `+Y`.
 * 2. Each affordance is a named point at its translation, its normal the
 *    affordance's turned `+Y`: under a quarter roll about `+Z`, `-X`. A fixed
 *    placement stays fixed, a moving one is read through `frame`, and a contact
 *    reader places known points only.
 * 3. A seat at (0, 0.45, 0.2) of an object at (1, 0, 2) turned 90 degrees sits at
 *    (1.2, 0.45, 2) facing yaw 90, level, with its depth and back, and names its
 *    carrier and point when the object moves.
 * 4. Footrests are the nearest tread below the seat on each side, the seat's `+X`
 *    the left; a tread above the seat or farther on its side is not one.
 *    Without treads they are the nearest bar's quarter points. A carrier's
 *    footrests retain the winning affordance ID for each side.
 * 5. A tilted seat states its pitch.
 * 6. Refused: a seat the object does not have, an unnamed one among two, and any
 *    seat of an object with none.
 */
export function test_motions_perform_human_object(): void {
  // 1. Frames.
  const rigid: IAutoMovieRigidTransform = {
    position: P(1, 2, 3),
    rotation: ROLL,
  };
  const turned: IAutoMovieRigidTransform = AutoMovieMotionHumanObject.frame({
    at: P(1, 0, 2),
    yaw: 90,
  });
  TestValidator.predicate(
    "placements as frames",
    AutoMovieMotionHumanObject.frame(rigid).position === rigid.position &&
      AutoMovieMotionHumanObject.frame(rigid).rotation === ROLL &&
      near(turned.position, P(1, 0, 2)) &&
      near(turn(turned.rotation, P(0, 0, 1)), P(1, 0, 0)),
  );

  // 2. Props.
  const model: IAutoMovieMotionHumanObject.IModel = {
    affordances: [testAffordance("pull", "handle", P(0.1, 0.9, 0), ROLL)],
  };
  const prop: IAutoMovieMotionHumanProp = AutoMovieMotionHumanObject.prop("door", model, {
    ...rigid,
    fixed: true,
  });
  const moving: IAutoMovieMotionHumanProp = AutoMovieMotionHumanObject.prop(
    "cart",
    model,
    rigid,
    (seconds: number) => ({ at: P(seconds, 0, 0), yaw: 90 }),
    (_id: string, seconds: number) => ({
      translation: P(seconds, 1, 0),
      rotation: ROLL,
      scale: P(1, 1, 1),
    }),
  );
  TestValidator.predicate(
    "affordances are named points",
    near(prop.points.pull!.point, P(0.1, 0.9, 0)) &&
      near(prop.points.pull!.normal, P(-1, 0, 0)) &&
      prop.fixed === true &&
      moving.fixed === undefined &&
      prop.motion === undefined &&
      near(moving.motion!(2).position, P(2, 0, 0)) &&
      near(turn(moving.motion!(2).rotation, P(0, 0, 1)), P(1, 0, 0)) &&
      moving.point!("lever", 1) === undefined &&
      near(moving.point!("pull", 3)!.point, P(3, 1, 0)) &&
      near(moving.point!("pull", 3)!.normal, P(-1, 0, 0)),
  );

  // 3. A seat.
  const chair: IAutoMovieMotionHumanObject.IModel = {
    affordances: [
      testAffordance("seat", "seat", P(0, 0.45, 0.2), IDENTITY, {
        depth: 0.4,
        back: 0.1,
      }),
    ],
  };
  const seat: IAutoMovieMotionHumanSeated.ISeat = AutoMovieMotionHumanObject.seat(
    chair,
    { at: P(1, 0, 2), yaw: 90 },
    undefined,
    "chair",
  );
  TestValidator.predicate(
    "a seat in the world",
    near(seat.at, P(1.2, 0.45, 2)) &&
      Math.abs(seat.yaw - 90) <= PLACE &&
      seat.pitch === undefined &&
      seat.roll === undefined &&
      seat.depth === 0.4 &&
      seat.back === 0.1 &&
      seat.carrier === "chair" &&
      seat.point === "seat" &&
      seat.footrests === undefined &&
      AutoMovieMotionHumanObject.seat(chair, { at: P(0, 0, 0), yaw: 0 }).carrier ===
        undefined,
  );

  // 4. Footrests.
  const origin = { at: P(0, 0, 0), yaw: 0 };
  const bike: IAutoMovieMotionHumanObject.IModel = {
    affordances: [
      testAffordance("seat", "seat", P(0, 0.45, 0.2)),
      testAffordance("left", "pedal", P(0.15, 0.1, 0.3)),
      testAffordance("far", "pedal", P(0.15, 0.05, 0.6)),
      testAffordance("right", "pedal", P(-0.15, 0.1, 0.3)),
      testAffordance("high", "stirrup", P(-0.15, 0.6, 0.2)),
    ],
  };
  const stool: IAutoMovieMotionHumanObject.IModel = {
    affordances: [
      testAffordance("seat", "seat", P(0, 0.45, 0.2)),
      testAffordance("rung", "bar", P(0, 0.2, 0.3), IDENTITY, { length: 0.4 }),
    ],
  };
  const carriedBike: IAutoMovieMotionHumanSeated.ISeat = AutoMovieMotionHumanObject.seat(
    bike,
    origin,
    undefined,
    "bike",
  );
  const carriedStool: IAutoMovieMotionHumanSeated.ISeat = AutoMovieMotionHumanObject.seat(
    stool,
    origin,
    undefined,
    "stool",
  );
  const pedals = carriedBike.footrests!;
  const rung = carriedStool.footrests!;
  TestValidator.predicate(
    "footrests",
    near(pedals.left!, P(0.15, 0.1, 0.3)) &&
      near(pedals.right!, P(-0.15, 0.1, 0.3)) &&
      near(rung.left!, P(0.1, 0.2, 0.3)) &&
      near(rung.right!, P(-0.1, 0.2, 0.3)),
  );
  TestValidator.predicate(
    "the chosen tread or shared bar supplies the moving support ID",
    carriedBike.footrestPoints?.left === "left" &&
      carriedBike.footrestPoints.right === "right" &&
      carriedStool.footrestPoints?.left === "rung" &&
      carriedStool.footrestPoints.right === "rung" &&
      AutoMovieMotionHumanObject.seat(bike, origin).footrestPoints === undefined,
  );

  // 5. A tilted seat.
  const tilt: IAutoMovieQuaternion = {
    x: Math.sin(Math.PI / 36),
    y: 0,
    z: 0,
    w: Math.cos(Math.PI / 36),
  };
  TestValidator.predicate(
    "a tilted seat states its pitch",
    AutoMovieMotionHumanObject.seat(
      { affordances: [testAffordance("seat", "seat", P(0, 0.45, 0), tilt)] },
      origin,
    ).pitch !== undefined,
  );

  // 6. Refusals.
  const two: IAutoMovieMotionHumanObject.IModel = {
    affordances: [
      testAffordance("a", "seat", P(0, 0.45, 0)),
      testAffordance("b", "seat", P(0.5, 0.45, 0)),
    ],
  };
  TestValidator.predicate(
    "seats refused",
    refused(() => AutoMovieMotionHumanObject.seat(two, origin), ["a", "b"]) &&
      refused(() => AutoMovieMotionHumanObject.seat(two, origin, "c"), ["a", "b"]) &&
      refused(() => AutoMovieMotionHumanObject.seat({ affordances: [] }, origin), []) &&
      AutoMovieMotionHumanObject.seat(two, origin, "b").at.x === 0.5,
  );
}

/** A vector turned. */
function turn(q: IAutoMovieQuaternion, v: IAutoMovieVector3): IAutoMovieVector3 {
  const tx: number = 2 * (q.y * v.z - q.z * v.y);
  const ty: number = 2 * (q.z * v.x - q.x * v.z);
  const tz: number = 2 * (q.x * v.y - q.y * v.x);
  return {
    x: v.x + q.w * tx + (q.y * tz - q.z * ty),
    y: v.y + q.w * ty + (q.z * tx - q.x * tz),
    z: v.z + q.w * tz + (q.x * ty - q.y * tx),
  };
}

/** Whether two points agree within the placement bound. */
function near(a: IAutoMovieVector3, b: IAutoMovieVector3): boolean {
  return (
    Math.abs(a.x - b.x) <= PLACE &&
    Math.abs(a.y - b.y) <= PLACE &&
    Math.abs(a.z - b.z) <= PLACE
  );
}

/** Whether a task refuses the seat offering the given ones. */
function refused(task: () => unknown, seats: string[]): boolean {
  try {
    task();
    return false;
  } catch (error) {
    return (
      error instanceof AutoMovieMotionHumanRefusal &&
      error.axis === "seat" &&
      error.feasible?.kind === "alternatives" &&
      error.feasible.values.join() === seats.join()
    );
  }
}
