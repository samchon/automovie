import {
  createDiscus,
  createHammerThrow,
  createJavelin,
  createPlyoBox,
  createShot,
  createThrowingCircle,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieComposition,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFieldThrow,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAcrobatics,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { HumanFoot } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/** The planted-contact bound, metres (the campaign's 5 mm). */
const PLANT: number = 0.005;

/** The tolerance on the recorded result, metres: a landing mark read to a decimetre. */
const MARK: number = 0.1;

/**
 * Throw the shot, the discus and the hammer from a circle and the javelin
 * out of a run, each to its recorded result.
 *
 * Scenarios:
 * 1. For each circle event the thrower picks the implement up, turns over
 *    both feet (each ball held within 5 mm while the body turns), and lets
 *    the implement go at `release`: it rides the hand within 10 mm before
 *    and has left it a quarter second after.
 * 2. The released implement comes down at the authored distance from the
 *    circle's inside edge within 0.1 m: the event's recorded result.
 * 3. A thrower standing across the circle's rim fouls and is refused on `area`;
 *    a shot put farther than the event's release speed allows is refused on
 *    `distance`.
 * 4. A javelin cut from a run at the left foot's footfall lands at its
 *    distance from the arc.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the events, the supports, the release, the result and the refusals with their bounds.
 * @evidence contracts/development/testing.md#behavioral-verification Composes pick-up and throw through the public chain over real implements and throwing places and reads the displayed feet, hands and implement flights.
 * @evidence contracts/development/testing.md#independent-expectations The circle and the arc are the archetype's, the result is measured from the circle's inside edge or the arc as the rules measure it, and the 5 mm, 10 mm and 0.1 m bounds are the campaign's contact, grip and marking tolerances.
 * @evidence contracts/development/testing.md#distinguishing-cases Three circle events, a runway event, a foul and an unreachable distance.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances on the shared Human fixture, without a render or external process.
 */
export function test_motion_throw_catch_field_throws(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const cases: readonly ICase[] = [
    {
      event: "shot",
      implement: createShot({ kind: "men" }),
      handle: "grip",
      distance: 9,
    },
    {
      event: "discus",
      implement: createDiscus({ kind: "men" }),
      handle: "grip",
      distance: 25,
    },
    {
      event: "hammer",
      implement: createHammerThrow({ kind: "men" }),
      handle: "handle",
      distance: 30,
    },
  ];
  for (const c of cases) {
    const area: ReturnType<typeof createThrowingCircle> = createThrowingCircle({
      event: c.event,
    });
    const film: HumanPerformance = take(body, c, area, { x: 0, y: 0, z: 0 });
    assertTakeClean("field throws", film);
    const toss: IAutoMovieMotionHumanSegment = film
      .segments("a")
      .find(
        (s: IAutoMovieMotionHumanSegment): boolean => s.name === "fieldThrow",
      )!;
    const release: number =
      toss.start +
      toss.plan.events.find((e): boolean => e.name === "release")!.share *
        toss.plan.duration;

    // 1. Supports and the hand's custody.
    for (const side of ["left", "right"] as const) {
      const slip: number = Vector3.distance(
        ball(film, body, toss.start + 1e-3, side),
        ball(film, body, release - 1e-3, side),
      );
      TestValidator.predicate(
        `${c.event} ${side} ball holds through the turn (${(slip * 1000).toFixed(1)} mm)`,
        slip <= PLANT,
      );
    }
    const seat0: IAutoMovieVector3 = seat(film, toss.start + 0.01);
    TestValidator.predicate(
      `${c.event} rides the hand to the release and leaves it`,
      Vector3.distance(seat(film, release - 0.01), seat0) <= 0.01 &&
        Vector3.distance(seat(film, release + 0.25), seat0) > 0.05,
    );

    // 2. The recorded result.
    const landed: IAutoMovieVector3 = landing(film, release);
    const radius: number = area.affordance("circle").width! / 2;
    const result: number = Math.hypot(landed.x, landed.z) - radius;
    TestValidator.predicate(
      `${c.event} lands at its distance (${result.toFixed(2)} of ${c.distance} m)`,
      Math.abs(result - c.distance) <= MARK,
    );
  }

  // 3. A foul and an unreachable distance.
  const shot: ICase = cases[0]!;
  const circle: ReturnType<typeof createThrowingCircle> = createThrowingCircle({
    event: "shot",
  });
  const refused: (
    c: ICase,
    at: IAutoMovieVector3,
  ) => HumanRefusal | undefined = (
    c: ICase,
    at: IAutoMovieVector3,
  ): HumanRefusal | undefined => {
    try {
      take(body, c, circle, at);
    } catch (error) {
      if (error instanceof HumanRefusal) return error;
      throw error;
    }
    return undefined;
  };
  const foul: HumanRefusal | undefined = refused(shot, { x: 0, y: 0, z: 1.3 });
  TestValidator.predicate(
    "a thrower standing across the rim fouls",
    foul?.axis === "area",
  );
  TestValidator.predicate(
    "a put past the shot's release speed is refused",
    refused({ ...shot, distance: 40 }, { x: 0, y: 0, z: 0 })?.axis ===
      "distance",
  );
  // 4. A javelin out of a run, to its distance from the arc.
  const javelin: ICase = {
    event: "javelin",
    implement: createJavelin({ kind: "men" }),
    handle: "grip",
    distance: 40,
  };
  const plain: HumanPerformance = runUp(body, javelin, 100, undefined);
  const run: IAutoMovieMotionHumanSegment = plain
    .segments("a")
    .find((s: IAutoMovieMotionHumanSegment): boolean => s.name === "run")!;
  let cut: string = "";
  let toe: number = 0;
  for (const event of run.plan.events) {
    if (!event.name.startsWith("leftHeelStrike")) continue;
    const at: number = run.start + event.share * run.plan.duration + 1e-3;
    const z: number = socket(plain, body, at, "left", "toe").z;
    if (Math.abs(z - 12) < Math.abs(toe - 12)) {
      toe = z;
      cut = event.name;
    }
  }
  const arc: number = toe + 0.5;
  const thrown: HumanPerformance = runUp(body, javelin, arc, cut);
  const toss: IAutoMovieMotionHumanSegment = thrown
    .segments("a")
    .find(
      (s: IAutoMovieMotionHumanSegment): boolean => s.name === "fieldThrow",
    )!;
  const release: number =
    toss.start +
    toss.plan.events.find((e): boolean => e.name === "release")!.share *
      toss.plan.duration;
  const landed: IAutoMovieVector3 = landing(thrown, release);
  // The arc's centre lies its 8 m radius behind the arc's middle.
  const result: number = Math.hypot(landed.x, landed.z - (arc - 8)) - 8;
  TestValidator.predicate(
    `the javelin lands at its distance from the arc (${result.toFixed(2)} of 40 m)`,
    Math.abs(result - javelin.distance) <= MARK,
  );
}

/** A javelin thrower running down the runway, cut into the throw at a footfall when given. */
function runUp(
  body: IAutoMovieMotionHumanBody,
  c: ICase,
  arc: number,
  cut: string | undefined,
): HumanPerformance {
  const running: ReturnType<typeof HumanChain.subject> = HumanChain.subject("a")
    .stand({ hold: 0.3, sway: 0 })
    .pickUp({ prop: "implement", handle: c.handle, hand: "right" })
    .run({ to: { x: 0, y: 0, z: 30 }, pace: "run" });
  return new HumanPerformance({
    seed: "javelin",
    laws: [AutoMovieMotionHumanAcrobatics.HumanGymnastics.fieldThrow],
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    props: [
      // The javelin held upright beside the right hand, its grip at the
      // hand's height.
      HumanObject.prop("implement", c.implement, {
        position: Vector3.subtract(
          { x: -0.3, y: 0.95, z: 0.2 },
          createJavelin({ kind: "men" }).affordance("grip").frame.translation,
        ),
        rotation: Quaternion.identity(),
      }),
      HumanObject.prop("area", createThrowingCircle({ event: "javelin" }), {
        at: { x: 0, y: 0, z: arc },
        yaw: 0,
      }),
    ],
    composition:
      cut === undefined
        ? running.node
        : running.until({ event: cut }).registered("fieldThrow", {
            event: c.event,
            implement: "implement",
            area: "area",
            distance: c.distance,
          }).node,
  });
}

/** A throwing implement's model. */
type Implement =
  | ReturnType<typeof createShot>
  | ReturnType<typeof createDiscus>
  | ReturnType<typeof createHammerThrow>
  | ReturnType<typeof createJavelin>;

/** One throw to stage. */
interface ICase {
  /** The event. */
  event: IAutoMovieMotionHumanFieldThrow.Event;

  /** The implement model. */
  implement: Implement;

  /** The implement's affordance the right hand takes. */
  handle: string;

  /** The authored result, metres. */
  distance: number;
}

/** A thrower standing in the circle at `at`, taking the implement off a box beside them and throwing it. */
function take(
  body: IAutoMovieMotionHumanBody,
  c: ICase,
  area: ReturnType<typeof createThrowingCircle>,
  at: IAutoMovieVector3,
): HumanPerformance {
  const box: ReturnType<typeof createPlyoBox> = createPlyoBox({
    height: 0.762,
  });
  const top: number = box.affordance("surface").frame.translation.y;
  // Facing -Z, the thrower's right is +X: the shot and the discus lie on a
  // box there, the hammer stands on its head with its handle at hand height.
  const implement: IAutoMovieMotionHumanProp = HumanObject.prop(
    "implement",
    c.implement,
    {
      position:
        c.event === "hammer"
          ? { x: at.x + 0.3, y: 0, z: at.z - 0.1 }
          : { x: at.x + 0.35, y: top, z: at.z - 0.1 },
      rotation: Quaternion.identity(),
    },
  );
  const node: IAutoMovieComposition = HumanChain.subject("a")
    .stand({ hold: 0.3, sway: 0 })
    .pickUp({ prop: "implement", handle: c.handle, hand: "right" })
    .registered("fieldThrow", {
      event: c.event,
      implement: "implement",
      area: "area",
      distance: c.distance,
    }).node;
  return new HumanPerformance({
    seed: "field-throw",
    laws: [AutoMovieMotionHumanAcrobatics.HumanGymnastics.fieldThrow],
    performers: [
      {
        subject: "a",
        body,
        at,
        yaw: 180,
        proficiency: { level: "trained" },
      },
    ],
    props: [
      implement,
      HumanObject.prop("box", box, {
        at: {
          x: at.x + 0.35 + (c.event === "hammer" ? 1 : 0),
          y: 0,
          z: at.z - 0.1,
        },
        yaw: 0,
      }),
      HumanObject.prop("area", area, { at: { x: 0, y: 0, z: 0 }, yaw: 0 }),
    ],
    composition: node,
  });
}

/** The implement's origin in the right hand's frame, from the hand bone. */
function seat(film: HumanPerformance, time: number): IAutoMovieVector3 {
  const hand: IAutoMovieResolvedBone = film.bones("a", time).get("rightHand")!;
  return Quaternion.rotateVector(
    Quaternion.inverse(hand.worldRotation),
    Vector3.subtract(film.prop("implement", time).position, hand.worldPosition),
  );
}

/** Where the implement's origin first comes down to the floor after the release, sampled every 5 ms. */
function landing(film: HumanPerformance, release: number): IAutoMovieVector3 {
  let last: IAutoMovieVector3 = film.prop("implement", release).position;
  for (let t: number = release + 0.005; t < release + 10; t += 0.005) {
    const now: IAutoMovieVector3 = film.prop("implement", t).position;
    if (now.y <= 0) {
      const u: number = last.y / (last.y - now.y);
      return Vector3.lerp(last, now, u);
    }
    last = now;
  }
  return last;
}

/** A displayed foot socket at a film second. */
function socket(
  film: HumanPerformance,
  body: IAutoMovieMotionHumanBody,
  time: number,
  side: AutoMovieHumanSide,
  point: Parameters<typeof HumanFoot.point>[2],
): IAutoMovieVector3 {
  const foot: IAutoMovieResolvedBone = film
    .bones("a", time)
    .get(`${side}Foot`)!;
  return HumanFoot.point(body, side, point, {
    ankle: foot.worldPosition,
    rotation: foot.worldRotation,
  });
}

/** A displayed ball of the foot at a film second. */
function ball(
  film: HumanPerformance,
  body: IAutoMovieMotionHumanBody,
  time: number,
  side: AutoMovieHumanSide,
): IAutoMovieVector3 {
  const foot: IAutoMovieResolvedBone = film
    .bones("a", time)
    .get(`${side}Foot`)!;
  return HumanFoot.point(body, side, "ball", {
    ankle: foot.worldPosition,
    rotation: foot.worldRotation,
  });
}
