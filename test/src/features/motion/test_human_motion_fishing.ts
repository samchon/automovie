import { createFishingRod, createLure } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanHookSet,
  IAutoMovieMotionHumanSegment,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
  hookSet,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../internal/assertTakeClean";
import { motionHumanBody } from "../internal/motionHumanBody";

/** Where the lure is cast, world metres: a spot on the water ahead. */
const TARGET: IAutoMovieVector3 = { x: 0, y: 0, z: 12 };

/** How near the lure lands to the target, metres (provisional: a fair cast). */
const LANDING: number = 0.5;

/** How near the lure leaves the rod's tip, metres: the contact bound. */
const TIP: number = 0.01;

/** The hook set's lift and time. */
const SET: IAutoMovieMotionHumanHookSet = { rod: "rod", angle: 40, seconds: 0.25 };

/** How near the tip's rise is to the authored lift, degrees (provisional). */
const RISE: number = 3;

/**
 * Casting a lure and setting the hook (#3998).
 *
 * Scenarios, on the average man and the small woman, each take clean:
 * 1. The lure, set on the rod's tip, leaves it at the throw's release and
 *    lands within 0.5 m of the target 12 m ahead.
 * 2. The hook set lifts the tip by the authored 40 degrees in the
 *    authored 0.25 s.
 * 3. A target far beyond any cast is refused.
 *
 * The line between the tip and the lure and the reel's retrieve need a
 * span between two props and a reel's crank, which no model has yet.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the cases, the bounds and what is pending.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the displayed lure against the displayed tip at the release and at its landing, and the rod's displayed elevation over the hook set; a lure leaving from the hand, a short or wide cast, a slow or small set or an admitted unreachable target fails.
 * @evidence contracts/development/testing.md#independent-expectations The target and the lift are authored; the tip is the rod's own contact.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies, the cast, the set and the refusal.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances through the public chain.
 */
export function test_human_motion_fishing(): void {
  for (const name of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    const film: HumanPerformance = angle(body, TARGET);
    assertTakeClean(`${name} casts`, film);
    const cast: IAutoMovieMotionHumanSegment = film
      .segments("a")
      .find((s: IAutoMovieMotionHumanSegment): boolean => s.name === "throwObject")!;
    const release: number = mark(cast, "release");
    const off: number = Vector3.distance(film.prop("lure", release).position, tip(film, release));
    TestValidator.predicate(
      `${name}: the lure leaves the rod's tip at the release (${(off * 1000).toFixed(1)} mm)`,
      off <= TIP,
    );
    const landed: IAutoMovieVector3 = film.prop("lure", film.duration).position;
    const miss: number = Math.hypot(landed.x - TARGET.x, landed.z - TARGET.z);
    TestValidator.predicate(
      `${name}: the lure lands ${miss.toFixed(2)} m from the target`,
      miss <= LANDING,
    );
    const set: IAutoMovieMotionHumanSegment = film
      .segments("a")
      .find((s: IAutoMovieMotionHumanSegment): boolean => s.name === "hookSet")!;
    const done: number = mark(set, "set");
    const rise: number = elevation(film.prop("rod", done)) - elevation(film.prop("rod", set.start));
    TestValidator.predicate(
      `${name}: the hook set lifts the tip ${rise.toFixed(1)} degrees in ${(done - set.start).toFixed(2)} s`,
      Math.abs(rise - SET.angle) <= RISE && Math.abs(done - set.start - SET.seconds) <= 1e-6,
    );
  }
  TestValidator.predicate(
    "a target far beyond any cast is refused",
    (() => {
      try {
        angle(motionHumanBody("m-average"), { x: 0, y: 0, z: 400 }).bones("a", 3);
        return false;
      } catch (error: unknown) {
        return error instanceof HumanRefusal;
      }
    })(),
  );
}

/** `a` takes up the rod with the lure on its tip, casts at the target, waits and sets the hook. */
function angle(body: IAutoMovieMotionHumanBody, target: IAutoMovieVector3): HumanPerformance {
  const rod: ReturnType<typeof createFishingRod> = createFishingRod({ id: "rod" });
  const lure: ReturnType<typeof createLure> = createLure({ id: "lure" });
  const tipFrame: IAutoMovieRigidTransform = {
    position: rod.affordance("tip").frame.translation,
    rotation: rod.affordance("tip").frame.rotation,
  };
  return new HumanPerformance({
    seed: "fishing",
    laws: [hookSet],
    props: [
      HumanObject.prop("rod", rod, { at: { x: 0.35, y: 0, z: 0.3 }, yaw: 0 }),
      {
        ...HumanObject.prop("lure", lure, { position: tipFrame.position, rotation: tipFrame.rotation }),
        mounted: {
          prop: "rod",
          point: "tip",
          offset: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0, w: 1 } },
        },
      },
    ],
    performers: [{ subject: "a", body, at: { x: 0, y: 0, z: 0 }, yaw: 0, proficiency: { level: "trained" } }],
    composition: HumanChain.subject("a")
      .pickUp({ prop: "rod", handle: "grip", hand: "right", lift: 0.1 })
      .throwObject({
        at: { kind: "point", at: target, frame: "world" },
        hand: "right",
        prop: "lure",
        implement: { prop: "rod", point: "tip" },
      })
      .stand({ seconds: 1 })
      .registered(hookSet.name, SET).node,
  });
}

/** The rod's displayed tip. */
function tip(film: HumanPerformance, t: number): IAutoMovieVector3 {
  const rod: IAutoMovieRigidTransform = film.prop("rod", t);
  const model: ReturnType<typeof createFishingRod> = createFishingRod({ id: "rod" });
  return Vector3.add(rod.position, Quaternion.rotateVector(rod.rotation, model.affordance("tip").frame.translation));
}

/** The rod's elevation above the horizontal, degrees. */
function elevation(rod: IAutoMovieRigidTransform): number {
  const along: IAutoMovieVector3 = Quaternion.rotateVector(rod.rotation, { x: 0, y: 1, z: 0 });
  return (Math.asin(Math.max(-1, Math.min(1, along.y))) * 180) / Math.PI;
}

/** The film second of a segment's named event. */
function mark(segment: IAutoMovieMotionHumanSegment, name: string): number {
  return (
    segment.start +
    segment.plan.duration *
      segment.plan.events.find((event: IAutoMovieMotionEvent): boolean => event.name === name)!.share
  );
}
