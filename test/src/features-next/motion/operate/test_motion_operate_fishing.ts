import {
  AutoMovieArchetypeCourse,
  createLure,
  createRowboat,
  createSpinningRod,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanHookSet,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanTether,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanOperate,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

const { hookSet } = AutoMovieMotionHumanOperate;

/** Where the lure is cast, world metres: a spot on the water ahead. */
const TARGET: IAutoMovieVector3 = { x: 0, y: 0, z: 12 };

/** How near the lure lands to the target, metres (provisional: a fair cast). */
const LANDING: number = 0.5;

/** How near the lure leaves the rod's tip, and the line's ends lie on their points, metres: the contact bound. */
const TIP: number = 0.01;

/** The line paid in per handle turn, metres: a reel inside the producer's band. */
const RETRIEVE: number = 0.8;

/** The handle turns of the retrieve. */
const TURNS: number = 3;

/** The line out once cast, metres: the tip's reach to the target with a little slack. */
const LINE: number = 13;

/** The hook set's lift and time. */
const SET: IAutoMovieMotionHumanHookSet = {
  rod: "rod",
  angle: 40,
  duration: 0.25,
};

/** How near the tip's rise is to the authored lift, degrees (provisional). */
const RISE: number = 3;

/** How still the rod stays in the rod hand while the other hand reels, metres: the rigid custody bound. */
const STILL: number = 0.001;

/** The rod model. */
type Rod = ReturnType<typeof createSpinningRod>;

/**
 * Casting a lure, reeling it in and setting the hook (#3998).
 *
 * Scenarios, on the average man and the small woman, each take clean:
 * 1. The lure, set on the rod's tip, leaves it at the throw's release and
 *    lands within 0.5 m of the target 12 m ahead, the rod staying in the rod
 *    hand after the release.
 * 2. The line runs from the tip to the lure's eye throughout.
 * 3. Three turns of the reel's handle by the free hand shorten the line by
 *    three turns' retrieve and draw the lure in with it, while the rod
 *    stays in the rod hand.
 * 4. The hook set lifts the tip by the authored 40 degrees in the
 *    authored 0.25 s.
 * 5. From a rowboat drifting at 0.8 m/s, the angler standing on its
 *    floorboards casts the lure to within 0.5 m of the same target.
 * 6. A target far beyond any cast is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the cases and the bounds.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the displayed lure, tip and line, the reel's travel and the rod in the rod hand; a lure leaving from the hand, a short or wide cast, a line off its ends, a retrieve that does not shorten the line by the turns, a rod slipping in the hand, a slow or small set or an admitted unreachable target fails.
 * @evidence contracts/development/testing.md#independent-expectations The target, the turns, the retrieve and the lift are authored; the line shortens by turns times retrieve.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies, the cast, the retrieve, the set and the refusal.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances through the public chain.
 */
export function test_motion_operate_fishing(): void {
  for (const name of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    const rod: Rod = createSpinningRod({ id: "rod", retrieve: RETRIEVE });
    const film: HumanPerformance = fish(body, rod, TARGET);
    assertTakeClean(`${name} fishes`, film);
    const cast: IAutoMovieMotionHumanSegment = segment(film, "throwObject");
    const release: number = mark(cast, "release");
    const off: number = Vector3.distance(
      film.prop("lure", release).position,
      point(film.prop("rod", release), rod, "tip"),
    );
    TestValidator.predicate(
      `${name}: the lure leaves the rod's tip at the release (${(off * 1000).toFixed(1)} mm)`,
      off <= TIP,
    );
    const kept: number = Math.max(
      ...[0.25, 0.5, 0.75, 1].map((share: number): number =>
        Vector3.distance(
          inHand(film, release + share * (cast.end - release)),
          inHand(film, release),
        ),
      ),
    );
    TestValidator.predicate(
      `${name}: the rod stays in the rod hand after the release (${(kept * 1000).toFixed(2)} mm)`,
      kept <= STILL,
    );
    const reel: IAutoMovieMotionHumanSegment = segment(film, "operate");
    const landed: IAutoMovieVector3 = film.prop("lure", reel.start).position;
    const miss: number = Math.hypot(landed.x - TARGET.x, landed.z - TARGET.z);
    TestValidator.predicate(
      `${name}: the lure lands ${miss.toFixed(2)} m from the target`,
      miss <= LANDING,
    );
    const ends: number = Math.max(
      ...[release, reel.start, (reel.start + reel.end) / 2, reel.end].map(
        (t: number): number => {
          const line: IAutoMovieMotionHumanTether.ISpan = film.tether(
            "rod",
            "line",
            t,
          );
          return Math.max(
            Vector3.distance(line.from, point(film.prop("rod", t), rod, "tip")),
            Vector3.distance(line.to, film.prop("lure", t).position),
          );
        },
      ),
    );
    TestValidator.predicate(
      `${name}: the line runs from the tip to the lure (${(ends * 1000).toFixed(1)} mm)`,
      ends <= TIP,
    );
    const before: IAutoMovieMotionHumanTether.ISpan = film.tether(
      "rod",
      "line",
      reel.start,
    );
    const after: IAutoMovieMotionHumanTether.ISpan = film.tether(
      "rod",
      "line",
      reel.end,
    );
    const turned: number =
      (film.state("rod", reel.end)["crank"] ?? 0) -
      (film.state("rod", reel.start)["crank"] ?? 0);
    TestValidator.predicate(
      `${name}: the handle turns ${(turned / 360).toFixed(2)} times and the line shortens ${(before.length - after.length).toFixed(2)} m`,
      Math.abs(turned - 360 * TURNS) <= 1 &&
        Math.abs(before.length - after.length - TURNS * RETRIEVE) <= TIP,
    );
    TestValidator.predicate(
      `${name}: the lure is drawn in with the line`,
      after.taut &&
        Math.abs(Vector3.distance(after.from, after.to) - after.length) <= TIP,
    );
    const held: number = Math.max(
      ...[0.25, 0.5, 0.75, 1].map((share: number): number =>
        Vector3.distance(
          inHand(film, reel.start + share * (reel.end - reel.start)),
          inHand(film, reel.start),
        ),
      ),
    );
    TestValidator.predicate(
      `${name}: the rod stays in the rod hand while reeling (${(held * 1000).toFixed(2)} mm)`,
      held <= STILL,
    );
    const set: IAutoMovieMotionHumanSegment = segment(film, "hookSet");
    const done: number = mark(set, "set");
    const rise: number =
      elevation(film.prop("rod", done)) -
      elevation(film.prop("rod", set.start));
    TestValidator.predicate(
      `${name}: the hook set lifts the tip ${rise.toFixed(1)} degrees in ${(done - set.start).toFixed(2)} s`,
      Math.abs(rise - SET.angle) <= RISE &&
        Math.abs(done - set.start - SET.duration) <= 1e-6,
    );
  }
  // From a rowboat drifting along +X, the angler standing on its floorboards.
  const boat: HumanPerformance = aboard(
    motionHumanBody("m-average"),
    createSpinningRod({ id: "rod", retrieve: RETRIEVE }),
  );
  assertTakeClean("casting from a moving boat", boat);
  const afloat: IAutoMovieMotionHumanSegment = segment(boat, "throwObject");
  const splash: IAutoMovieVector3 = boat.prop("lure", afloat.end + 2).position;
  TestValidator.predicate(
    `from a moving boat the lure lands ${Math.hypot(splash.x - TARGET.x, splash.z - TARGET.z).toFixed(2)} m from the target`,
    Math.hypot(splash.x - TARGET.x, splash.z - TARGET.z) <= LANDING,
  );
  TestValidator.predicate(
    "a target far beyond any cast is refused",
    (() => {
      try {
        fish(motionHumanBody("m-average"), createSpinningRod({ id: "rod" }), {
          x: 0,
          y: 0,
          z: 400,
        }).bones("a", 3);
        return false;
      } catch (error: unknown) {
        return error instanceof HumanRefusal;
      }
    })(),
  );
}

/** `a` takes up the rod with the lure on its tip, casts at the target, reels three turns and sets the hook. */
function fish(
  body: IAutoMovieMotionHumanBody,
  rod: Rod,
  target: IAutoMovieVector3,
): HumanPerformance {
  const lure: ReturnType<typeof createLure> = createLure({ id: "lure" });
  const tip: IAutoMovieRigidTransform = {
    position: rod.affordance("tip").frame.translation,
    rotation: rod.affordance("tip").frame.rotation,
  };
  const line: IAutoMovieMotionHumanTether = {
    id: "line",
    from: "tip",
    to: { prop: "lure", point: "eye" },
    length: {
      kind: "driven",
      metres: LINE,
      articulation: { prop: "rod", point: "crank" },
      per: RETRIEVE / 360,
    },
  };
  return new HumanPerformance({
    seed: "fishing",
    laws: [hookSet],
    props: [
      // The rod stands in a rack, its grip at hip height.
      {
        ...HumanObject.prop("rod", rod, {
          at: { x: 0.3, y: 0.85, z: 0.3 },
          yaw: 0,
        }),
        tethers: [line],
      },
      {
        ...HumanObject.prop("lure", lure, tip),
        mounted: {
          prop: "rod",
          point: "tip",
          offset: {
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0, w: 1 },
          },
        },
      },
    ],
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("a")
      .pickUp({ prop: "rod", handle: "grip", hand: "right", lift: 0.1 })
      .throwObject({
        target: { kind: "point", at: target, frame: "world" },
        hand: "right",
        prop: "lure",
        implement: { prop: "rod", point: "tip" },
      })
      .stand({ hold: 1 })
      .operate({
        kind: {
          kind: "knob",
          at: { kind: "prop", subject: "rod", point: "handle" },
          turn: 360 * TURNS,
        },
        hand: "left",
      })
      .registered(hookSet.name, SET).node,
  });
}

/** `a` stands on a rowboat's floorboards as it drifts along +X, takes up the rod lying in the boat and casts at the target. */
function aboard(body: IAutoMovieMotionHumanBody, rod: Rod): HumanPerformance {
  const hull: ReturnType<typeof createRowboat> = createRowboat({ id: "boat" });
  const course: AutoMovieArchetypeCourse.IPlan = AutoMovieArchetypeCourse.plan(
    "boat",
    {
      start: { x: -2, z: 0, heading: 90 },
      legs: [{ kind: "straight", length: 12 }],
      cruise: 0.8,
      acceleration: 0.4,
      deceleration: 0.4,
    },
  );
  const motion: (seconds: number) => IAutoMovieRigidTransform = (
    seconds: number,
  ): IAutoMovieRigidTransform => ({
    position: course.at(seconds).placement.translation,
    rotation: course.at(seconds).placement.rotation,
  });
  const origin: IAutoMovieRigidTransform = motion(0);
  const local: (p: IAutoMovieVector3) => IAutoMovieVector3 = (
    p: IAutoMovieVector3,
  ): IAutoMovieVector3 =>
    Vector3.add(origin.position, Quaternion.rotateVector(origin.rotation, p));
  const floor: IAutoMovieVector3 = local(
    hull.affordance("floor").frame.translation,
  );
  const rack: IAutoMovieRigidTransform = {
    position: { x: 0.3, y: 0.85, z: 0.3 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  };
  const tip: IAutoMovieRigidTransform = {
    position: rod.affordance("tip").frame.translation,
    rotation: rod.affordance("tip").frame.rotation,
  };
  return new HumanPerformance({
    seed: "fishing-boat",
    props: [
      HumanObject.prop("boat", hull, origin, motion),
      {
        ...HumanObject.prop("rod", rod, {
          position: Vector3.add(floor, rack.position),
          rotation: rack.rotation,
        }),
        mounted: { prop: "boat", point: "floor", offset: rack },
      },
      {
        ...HumanObject.prop("lure", createLure({ id: "lure" }), tip),
        mounted: {
          prop: "rod",
          point: "tip",
          offset: {
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0, w: 1 },
          },
        },
      },
    ],
    performers: [
      {
        subject: "a",
        body,
        at: floor,
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("a")
      .stand({ hold: 0.5, on: { prop: "boat" } })
      .pickUp({ prop: "rod", handle: "grip", hand: "right", lift: 0.1 })
      .throwObject({
        target: { kind: "point", at: TARGET, frame: "world" },
        hand: "right",
        prop: "lure",
        implement: { prop: "rod", point: "tip" },
      })
      .stand({ hold: 3 }).node,
  });
}

/** The first segment of an action. */
function segment(
  film: HumanPerformance,
  name: string,
): IAutoMovieMotionHumanSegment {
  return film
    .segments("a")
    .find((s: IAutoMovieMotionHumanSegment): boolean => s.name === name)!;
}

/** A displayed prop's named point. */
function point(
  frame: IAutoMovieRigidTransform,
  rod: Rod,
  id: createSpinningRod.Affordance,
): IAutoMovieVector3 {
  return Vector3.add(
    frame.position,
    Quaternion.rotateVector(
      frame.rotation,
      rod.affordance(id).frame.translation,
    ),
  );
}

/** The rod's position in the displayed right hand's frame. */
function inHand(film: HumanPerformance, t: number): IAutoMovieVector3 {
  const hand: IAutoMovieResolvedBone = film.bones("a", t).get("rightHand")!;
  return Quaternion.rotateVector(
    Quaternion.inverse(hand.worldRotation),
    Vector3.subtract(film.prop("rod", t).position, hand.worldPosition),
  );
}

/** The rod's elevation above the horizontal, degrees. */
function elevation(rod: IAutoMovieRigidTransform): number {
  const along: IAutoMovieVector3 = Quaternion.rotateVector(rod.rotation, {
    x: 0,
    y: 1,
    z: 0,
  });
  return (Math.asin(Math.max(-1, Math.min(1, along.y))) * 180) / Math.PI;
}

/** The film second of a segment's named event. */
function mark(segment: IAutoMovieMotionHumanSegment, name: string): number {
  return (
    segment.start +
    segment.plan.duration *
      segment.plan.events.find(
        (event: IAutoMovieMotionEvent): boolean => event.name === name,
      )!.share
  );
}
