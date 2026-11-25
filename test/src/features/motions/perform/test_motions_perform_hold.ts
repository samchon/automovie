import type {
  IAutoMovieMotionHumanPerformanceState,
  IAutoMovieMotionHumanProp,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanObject } from "@automovie/motions";
import {
  HumanPerformanceHold,
  HumanRefusal,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { standingPerformanceState } from "../../internal/fixtures/standingPerformanceState";
import { testAffordance } from "../../internal/fixtures/testAffordance";

/**
 * How far a held frame may stand from its closed form: a few rotations, sums
 * and a minimum-jerk blend of decimetre offsets, far above their rounding.
 */
const HELD: number = 1e-9;

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

/** Grip type. */
type IGrip = IAutoMovieMotionHumanPerformanceState.IGrip;

/**
 * `HumanPerformanceHold` reads a prop's world frame as its grips carry it, the
 * holding hand and mount by the same custody, and the offset a span seats its
 * prop at; its kit (`HumanPerformanceHoldKit`) supplies each span's carrier,
 * seat and in-hand offset.
 *
 * A cup rests at (0, 0, 2); a rack at (3, 0, 0) has a peg at (0, 1, 0); a cart
 * drives itself along `+X`. Each hand's prepared course is a straight line.
 *
 * Scenarios:
 *
 * 1. Ungripped, the cup rests; a self-moving cart is where its motion puts it
 *    and has no holder or mount.
 * 2. A right hand moving `(t, 1, 0)` holds the cup from 1 to 2 s at an offset of
 *    0.1 m up, rolled a quarter: at 1.5 s the cup is at (1.5, 1.1, 0) rolled; at
 *    the grip's closing second it still rests; after release it stays where the
 *    hand let it go, (2, 1.1, 0). The holder is the actor's right hand inside
 *    the grip, none after.
 * 3. An in-hand motion sliding the cup 0.2 m along the hand's `+Z` over the grip
 *    adds 0.1 m at its middle.
 * 4. Two hands closing at once hold it between them, and keep that fit at their
 *    shared release; a second hand closing later only steadies.
 * 5. Without a stored offset, a grip seats the cup where it was when the hand
 *    closed; a grip of the same hand continuing an earlier one keeps its
 *    offset.
 * 6. Mounted on the rack's peg at an offset, the cup rides the peg; its mount is
 *    the peg, it has no holder.
 * 7. A hand setting the cup onto the peg at its grip's end brings it there: the
 *    cup meets the seated mount with no step.
 * 8. Refused: a prop not in the performance, and a socket chain revisiting the
 *    cup at the same second.
 */
export async function test_motions_perform_hold(): Promise<void> {
  const cup: IAutoMovieMotionHumanProp = HumanObject.prop(
    "cup",
    { affordances: [testAffordance("rim", "socket", P(0, 0.1, 0))] },
    { at: P(0, 0, 2), yaw: 0 },
  );
  const rack: IAutoMovieMotionHumanProp = HumanObject.prop(
    "rack",
    { affordances: [testAffordance("peg", "hook", P(0, 1, 0))] },
    { at: P(3, 0, 0), yaw: 0 },
  );
  const cart: IAutoMovieMotionHumanProp = HumanObject.prop(
    "cart",
    { affordances: [] },
    { at: P(0, 0, 0), yaw: 0 },
    (seconds: number) => ({ at: P(seconds, 0, -3), yaw: 0 }),
  );
  const { state } = await standingPerformanceState([cup, rack, cart]);
  const line =
    (from: IAutoMovieVector3) =>
    (seconds: number): IAutoMovieRigidTransform => ({
      position: P(from.x + seconds, from.y, from.z),
      rotation: IDENTITY,
    });
  const right: IGrip = {
    subject: "actor",
    side: "right",
    from: 1,
    to: 2,
    hand: line(P(0, 1, 0)),
    offset: { position: P(0, 0.1, 0), rotation: ROLL },
  };
  const holding = (
    ...grips: IGrip[]
  ): IAutoMovieMotionHumanPerformanceState => ({
    ...state,
    grips: new Map([["cup", grips]]),
  });
  const at = (
    self: IAutoMovieMotionHumanPerformanceState,
    seconds: number,
  ): IAutoMovieRigidTransform => HumanPerformanceHold.prop(self, "cup", seconds);

  // 1. Resting and self-moving.
  TestValidator.predicate(
    "a resting and a self-moving prop",
    near(at(holding(), 1).position, P(0, 0, 2)) &&
      near(HumanPerformanceHold.prop(state, "cart", 2).position, P(2, 0, -3)) &&
      HumanPerformanceHold.holder(state, "cart", 2) === undefined &&
      HumanPerformanceHold.mount(state, "cart", 2) === undefined,
  );

  // 2. One hand.
  const one = holding(right);
  const middle: IAutoMovieRigidTransform = at(one, 1.5);
  TestValidator.predicate(
    "carried by one hand",
    near(middle.position, P(1.5, 1.1, 0)) &&
      near(turn(middle.rotation, P(0, 1, 0)), P(-1, 0, 0)) &&
      near(at(one, 1).position, P(0, 0, 2)) &&
      near(at(one, 3).position, P(2, 1.1, 0)) &&
      HumanPerformanceHold.holder(one, "cup", 1.5)?.side === "right" &&
      HumanPerformanceHold.holder(one, "cup", 1.5)?.subject === "actor" &&
      HumanPerformanceHold.holder(one, "cup", 3) === undefined &&
      HumanPerformanceHold.mount(one, "cup", 1.5) === undefined,
  );

  // 3. In-hand motion.
  const sliding = holding({
    ...right,
    offset: { position: P(0, 0.1, 0), rotation: IDENTITY },
    inHand: (share: number): IAutoMovieRigidTransform => ({
      position: P(0, 0, 0.2 * share),
      rotation: IDENTITY,
    }),
  });
  TestValidator.predicate(
    "the in-hand motion composed before the offset",
    near(at(sliding, 1.5).position, P(1.5, 1.1, 0.1)),
  );

  // 4. Two hands.
  const pair = (from: number): IAutoMovieMotionHumanPerformanceState =>
    holding(
      {
        subject: "actor",
        side: "right",
        from: 1,
        to: 2,
        hand: line(P(-1.3, 1, 0)),
        offset: { position: P(0.3, 0, 0), rotation: IDENTITY },
      },
      {
        subject: "actor",
        side: "left",
        from,
        to: 2,
        hand: line(P(-0.7, 1, 0)),
        offset: { position: P(-0.3, 0, 0), rotation: IDENTITY },
      },
    );
  TestValidator.predicate(
    "two hands at once fit the cup between them",
    near(at(pair(1), 1.5).position, P(0.5, 1, 0)) &&
      near(at(pair(1), 3).position, P(1, 1, 0)) &&
      near(at(pair(1.2), 1.5).position, P(0.5, 1, 0)),
  );
  const steadied = holding(
    {
      subject: "actor",
      side: "right",
      from: 1,
      to: 2,
      hand: line(P(-1, 1, 0)),
      offset: { position: P(0, 0, 0), rotation: IDENTITY },
    },
    {
      subject: "actor",
      side: "left",
      from: 1.2,
      to: 2,
      hand: line(P(-1, 1, 1)),
      offset: { position: P(0, 0, 0), rotation: IDENTITY },
    },
  );
  TestValidator.predicate(
    "a later hand only steadies",
    near(at(steadied, 1.5).position, P(0.5, 1, 0)),
  );

  // 5. Seats.
  const unseated: IGrip = {
    subject: "actor",
    side: "right",
    from: 1,
    to: 2,
    hand: line(P(0, 1, 0)),
  };
  const seated: IAutoMovieRigidTransform = HumanPerformanceHold.seat(
    holding(unseated),
    "cup",
    [unseated],
    unseated,
  );
  const continued: IGrip = {
    subject: "actor",
    side: "right",
    from: 2,
    to: 3,
    hand: line(P(0, 1, 0)),
  };
  TestValidator.predicate(
    "a grip seats where it closed, or keeps the hand's offset",
    near(seated.position, P(-1, -1, 2)) &&
      near(
        HumanPerformanceHold.seat(
          holding(right, continued),
          "cup",
          [right, continued],
          continued,
        ).position,
        P(0, 0.1, 0),
      ),
  );

  // 6. A mount.
  const peg: IGrip = {
    subject: "rack",
    side: "right",
    mount: { prop: "rack", point: "peg" },
    from: -Infinity,
    to: Infinity,
    offset: { position: P(0, 0.05, 0), rotation: IDENTITY },
  };
  const mounted = holding(peg);
  TestValidator.predicate(
    "riding the rack's peg",
    near(at(mounted, 1).position, P(3, 1.05, 0)) &&
      HumanPerformanceHold.mount(mounted, "cup", 1)?.point === "peg" &&
      HumanPerformanceHold.holder(mounted, "cup", 1) === undefined,
  );

  // 7. Set onto the peg.
  const onto: IGrip = {
    ...peg,
    mount: { prop: "rack", point: "peg", seated: true },
    from: 2,
  };
  const setting = holding(right, onto);
  TestValidator.predicate(
    "brought onto the socket without a step",
    near(at(setting, 1.999999).position, at(setting, 2.000001).position, 1e-5) &&
      near(at(setting, 2.5).position, P(3, 1.05, 0)) &&
      near(at(setting, 1).position, P(0, 0, 2)),
  );

  // 8. Refusals.
  TestValidator.predicate(
    "refused reads",
    refused(() => HumanPerformanceHold.prop(state, "ghost", 1), "prop") &&
      refused(
        () =>
          HumanPerformanceHold.frame(
            mounted,
            "cup",
            1,
            undefined,
            new Map([["cup", new Set([1])]]),
          ),
        "props.cup.mounted",
      ),
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

/** Whether two points agree within a bound. */
function near(
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
  bound: number = HELD,
): boolean {
  return (
    Math.abs(a.x - b.x) <= bound &&
    Math.abs(a.y - b.y) <= bound &&
    Math.abs(a.z - b.z) <= bound
  );
}

/** Whether a task refuses on the axis. */
function refused(task: () => unknown, axis: string): boolean {
  try {
    task();
    return false;
  } catch (error) {
    return error instanceof HumanRefusal && error.axis === axis;
  }
}
