import { createBarbell, createRack } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanSegment,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanWorkout,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { HumanFoot, HumanHand } from "@automovie/motions/internal";

import { everydayTake } from "../../internal/everydayTake";
import { motionComplaints } from "../../internal/motionComplaints";
import { motionHumanBody } from "../../internal/motionHumanBody";
import { nclose } from "../../internal/nclose";
import { qclose } from "../../internal/qclose";
import { vclose } from "../../internal/vclose";

/** A loaded routine covered by the bar and body playback witness. */
type Lift =
  | "snatch"
  | "cleanAndJerk"
  | "frontSquat"
  | "deadlift"
  | "overheadPress";

/** A figure the lifts are checked on. */
type Specimen = "f-small" | "m-average";

/** The bar handle the carrying hand holds. */
type Handle = "gripRight" | "gripLeft";

/** The carrying hand's offset to its socket and the other hand's miss. */
interface IGrip {
  /** The right grip socket in the right hand's frame, metres. */
  primary: IAutoMovieVector3;

  /** The left fist's distance from the left grip socket, metres. */
  secondary: number;
}

/** One built take and what its checks read. */
interface ITake {
  /** The figure. */
  body: IAutoMovieMotionHumanBody;

  /** The barbell model. */
  bar: ReturnType<typeof createBarbell>;

  /** The performance. */
  film: HumanPerformance;

  /** The rack's world rest point. */
  rest: IAutoMovieVector3;
}

/** Existing prop and planted-contact tolerances, in metres. */
const GRIP: number = 0.01;
const PLANT: number = 0.005;

/** The exact keyed film seconds measured for each movement. */
const MARKS: Record<Lift, readonly string[]> = {
  snatch: ["loadReady", "extension1", "catch1", "overhead1"],
  cleanAndJerk: [
    "loadReady",
    "extension1",
    "catch1",
    "rack1",
    "jerkDip1",
    "jerkDrive1",
    "jerkCatch1",
    "jerkOverhead1",
    "resetRack1",
  ],
  frontSquat: ["loadReady", "bottom1", "top1"],
  deadlift: ["loadReady", "bottom1", "stood1"],
  overheadPress: ["loadReady", "lockout1", "rack1"],
};

/**
 * A loaded workout preserves its actual bar, the grip and both foot plants.
 *
 * Scenarios:
 *
 * 1. Show separate rack and overhead receives, squat, deadlift and press for small
 *    and average figures, then put each competition bar on a rack.
 * 2. Refuse coincident handles and a grip the small figure cannot fit, even when
 *    the requested separation is admitted by the bar archetype.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the film actions, distinct outcomes and mechanical contacts.
 * @evidence contracts/development/testing.md#behavioral-verification Uses the public chain, prop playback and displayed skeleton at the actual phase and placement events.
 * @evidence contracts/development/testing.md#independent-expectations The bar's sockets and the figure's actual grip define the 10 mm bound. The floor witness allows 5 mm, as other exercise tests do. The IWF's lift definitions distinguish the shoulder and overhead phases. The receiving rack's own world socket determines the final resting frame.
 * @evidence contracts/development/testing.md#distinguishing-cases Checks two body proportions, a deep snatch catch, the clean's separate rack and overhead receive, loaded squat, deadlift and press, and two refused handle requests.
 * @evidence contracts/development/testing.md#execution-ownership Builds in-memory Human performance over a real seeded barbell model, without a render host.
 */
export function test_motion_support_competition_lift_support(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const name of ["f-small", "m-average"] as const) {
    try {
      for (const kind of Object.keys(MARKS) as Lift[])
        accept(checks, name, kind);
    } catch (error: unknown) {
      checks.check(`${String(name)}: ${everydayTake.describe(error)}`, false);
    }
  }

  for (const [grip, handle, expected] of [
    [1.2, "gripRight", "reach"],
    [0.5, "gripLeft", "affordance"],
  ] as const) {
    try {
      let refusal: unknown;
      try {
        take("f-small", "cleanAndJerk", grip, handle);
      } catch (error) {
        refusal = error;
      }
      checks.check(
        `the two-hand request ${grip} / ${handle} is refused at planning`,
        refusal instanceof HumanRefusal &&
          refusal.kind === expected &&
          refusal.axis === "load",
      );
    } catch (error: unknown) {
      checks.check(
        `${String(grip)} ${String(handle)} ${String(expected)}: ${everydayTake.describe(error)}`,
        false,
      );
    }
  }
  checks.assert("support competition lift support");
}

/** Check authored and displayed support, joint and bar events in one take. */
function accept(
  checks: motionComplaints.IGatherer,
  name: Specimen,
  kind: Lift,
): void {
  const { body, bar, film, rest } = take(
    name,
    kind,
    kind === "snatch" ? 0.85 : 0.5,
    "gripRight",
  );
  const segment: IAutoMovieMotionHumanSegment = film
    .segments("actor")
    .find(
      (part: IAutoMovieMotionHumanSegment): boolean => part.name === "workout",
    )!;
  const label: string = `${name} ${kind}`;
  const read = (name: string): number => mark(segment, name);
  const ready: number = read("loadReady");
  const grip: IAutoMovieMotionHumanContactWindow | undefined =
    segment.plan.contacts.find(
      (window): boolean => window.part === "leftHand" && window.kind === "grip",
    );
  checks.check(
    `${label} only the right hand carries the prop`,
    grip?.support.kind === "prop" &&
      grip.support.subject === "bar" &&
      grip.support.carries === false &&
      nclose(segment.start + grip.from * segment.plan.duration, ready),
  );

  const feet = (at: number): IAutoMovieVector3[] => {
    const bones: ReturnType<HumanPerformance["bones"]> = film.bones(
      "actor",
      at,
    );
    return (["left", "right"] as const).flatMap((side) => {
      const foot = bones.get(`${side}Foot`)!;
      return (["heel", "ball", "toe"] as const).map((socket) =>
        HumanFoot.point(body, side, socket, {
          ankle: foot.worldPosition,
          rotation: foot.worldRotation,
        }),
      );
    });
  };
  const contact = (
    bones: ReturnType<HumanPerformance["bones"]>,
    prop: IAutoMovieRigidTransform,
  ): IGrip => {
    const point = (side: AutoMovieHumanSide): IAutoMovieVector3 =>
      Vector3.add(
        prop.position,
        Quaternion.rotateVector(
          prop.rotation,
          bar.affordance(side === "left" ? "gripLeft" : "gripRight").frame
            .translation,
        ),
      );
    const right = bones.get("rightHand")!;
    return {
      primary: Quaternion.rotateVector(
        Quaternion.inverse(right.worldRotation),
        Vector3.subtract(point("right"), right.worldPosition),
      ),
      secondary: Vector3.distance(
        point("left"),
        HumanHand.frame(body, bones, "left", "grip", "fist").point,
      ),
    };
  };
  const referenceFeet: IAutoMovieVector3[] = feet(ready);
  const rightOffset: IAutoMovieVector3 = contact(
    film.bones("actor", ready),
    film.prop("bar", ready),
  ).primary;
  const events: number[] = MARKS[kind].map(read);
  for (const sample of [
    ...events,
    ...events.slice(1).map((time, i) => (time + events[i]!) / 2),
  ]) {
    const bones: ReturnType<HumanPerformance["bones"]> = film.bones(
      "actor",
      sample,
    );
    const prop: IAutoMovieRigidTransform = film.prop("bar", sample);
    const held = contact(bones, prop);
    checks.check(
      `${label} fitted bar grip at ${sample.toFixed(3)} s (${held.secondary.toFixed(4)} m)`,
      held.secondary <= GRIP && vclose(held.primary, rightOffset),
    );
    checks.check(
      `${label} both visible soles remain on their marks at ${sample.toFixed(3)} s`,
      feet(sample).every(
        (foot, i) => foot.y >= -PLANT && vclose(foot, referenceFeet[i]!, PLANT),
      ),
    );
  }

  const hip = (name: string): number =>
    film.bones("actor", read(name)).get("hips")!.worldPosition.y;
  const height = (name: string): number =>
    film.prop("bar", read(name)).position.y;
  const head = (name: string): number =>
    film.bones("actor", read(name)).get("head")!.worldPosition.y;
  const lean = (name: string): number =>
    Quaternion.rotateVector(
      film.bones("actor", read(name)).get("chest")!.worldRotation,
      { x: 0, y: 1, z: 0 },
    ).z;
  if (kind === "snatch" || kind === "cleanAndJerk") {
    const overhead: string = kind === "snatch" ? "overhead1" : "jerkOverhead1";
    const catchName: string = kind === "snatch" ? "catch1" : "jerkCatch1";
    checks.check(
      `${label} lowers the hips under the catch and stands to settle`,
      read("loadReady") < read("extension1") &&
        read("extension1") < read("catch1") &&
        read(catchName) < read(overhead) &&
        hip(catchName) < hip(overhead) &&
        height("loadReady") < height(catchName) &&
        head(catchName) < height(catchName) &&
        head(overhead) < height(overhead) &&
        height(catchName) < height(overhead) &&
        lean(catchName) > lean(overhead),
    );
    if (kind === "cleanAndJerk")
      checks.check(
        `${label} shoulders receive the first catch before the separate jerk`,
        read("catch1") < read("rack1") &&
          read("rack1") < read("jerkDip1") &&
          read("jerkDip1") < read("jerkDrive1") &&
          read("jerkDrive1") < read("jerkCatch1") &&
          height("catch1") < head("catch1") &&
          height("rack1") < head("rack1"),
      );
    const putDown: IAutoMovieMotionHumanSegment = film
      .segments("actor")
      .find(
        (part: IAutoMovieMotionHumanSegment): boolean =>
          part.name === "putDown",
      )!;
    const placed: number = mark(putDown, "placed");
    const arrived: IAutoMovieRigidTransform = film.prop("bar", placed);
    const settled: IAutoMovieRigidTransform = film.prop(
      "bar",
      putDown.end + 0.15,
    );
    checks.check(
      `${label} transfers the same bar to the authored rest frame before fingers open`,
      placed < mark(putDown, "release") &&
        vclose(arrived.position, rest) &&
        qclose(arrived.rotation, Quaternion.identity()) &&
        vclose(settled.position, arrived.position) &&
        qclose(settled.rotation, arrived.rotation) &&
        vclose(
          film.prop("bar", placed - 0.005).position,
          arrived.position,
          GRIP,
        ),
    );
  } else if (kind === "overheadPress") {
    checks.check(
      `${label} the bar rises without a squat and returns to the rack`,
      height("lockout1") > height("rack1") &&
        nclose(hip("lockout1"), hip("rack1"), PLANT),
    );
  } else {
    const settled: string = kind === "frontSquat" ? "top1" : "stood1";
    checks.check(
      `${label} hip and bar rise as the trunk recovers`,
      height(settled) > height("bottom1") &&
        hip(settled) > hip("bottom1") &&
        lean("bottom1") > lean(settled),
    );
  }
}

/** Build a public loaded workout with an optional placement phase. */
function take(name: Specimen, kind: Lift, grip: number, handle: Handle): ITake {
  const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
  const stature: number = body.measure.stature;
  const bar: ReturnType<typeof createBarbell> = createBarbell({
    kind: name === "f-small" ? "womens" : "mens",
    grip,
    load: 5,
  });
  const contact: IAutoMovieVector3 =
    bar.affordance("gripRight").frame.translation;
  const hold = HumanChain.subject("actor")
    .stand({ hold: 0.3, sway: 0 })
    .pickUp({ prop: "bar", handle: "gripRight" })
    .registered("workout", {
      kind,
      count: 1,
      load: { prop: "bar", handle, other: "gripLeft" },
    });
  const rack: ReturnType<typeof createRack> = createRack({
    rest: Math.max(0.9, 0.54 * stature),
  });
  const frame: IAutoMovieRigidTransform = {
    position: { x: 0, y: 0, z: 0.32 },
    rotation: Quaternion.identity(),
  };
  const rest: IAutoMovieVector3 = Vector3.add(
    frame.position,
    rack.affordance("rest").frame.translation,
  );
  const film: HumanPerformance = new HumanPerformance({
    seed: "athletics/lift-baseline",
    laws: [AutoMovieMotionHumanWorkout.workout],
    performers: [
      {
        subject: "actor",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    props: [
      HumanObject.prop("bar", bar, {
        position: Vector3.subtract(
          { x: -0.12 * stature, y: 0.56 * stature, z: 0.12 * stature },
          contact,
        ),
        rotation: Quaternion.identity(),
      }),
      HumanObject.prop("rack", rack, frame),
    ],
    composition: (kind === "snatch" || kind === "cleanAndJerk"
      ? hold
          .putDown({ prop: "bar", onto: { prop: "rack", point: "rest" } })
          .stand({ hold: 0.3, sway: 0 })
      : hold
    ).node,
  });
  return { body, bar, film, rest };
}

/** Read the action's named event on the scene clock. */
function mark(segment: IAutoMovieMotionHumanSegment, label: string): number {
  const event = segment.plan.events.find(
    (item): boolean => item.name === label,
  );
  if (event === undefined)
    throw new Error(`The ${segment.name} has no ${label} event.`);
  return segment.start + event.share * segment.plan.duration;
}
