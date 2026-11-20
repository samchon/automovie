import {
  createSeat,
  createStageFootwear,
  createStageJacket,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanFoot,
  HumanHand,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
  wardrobe,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

const CAST = ["m-average", "f-small"] as const;
type Cast = (typeof CAST)[number];

/**
 * A held stage wardrobe prop uses the same geometry when worn or set down.
 *
 * Scenarios:
 * 1. Both apertures of an actual jacket admit its wearer's hands. The held
 *    jacket is released to the chest and its visible zipper runs both ways.
 * 2. A seated performer gets footwear onto their raised foot, stands with it,
 *    and puts it down after a reverse pass. Two different actors and opposite
 *    feet exercise the underlying chair support and fit.
 * 3. Props without a required opening refuse through the public entry.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the jacket, closure, shoe and sock and their actual custody frames.
 * @evidence contracts/development/testing.md#behavioral-verification Runs installed HumanPerformance, registered motion and concrete archetype producers for the complete wearable exchange.
 * @evidence contracts/development/testing.md#independent-expectations Converts the displayed hand and foot geometry through the posed model, and reads closure travel from the visible slider, independently of a stored target pose.
 * @evidence contracts/development/testing.md#distinguishing-cases Observes actual signed passages, opposed fits, a reversed closure, the worn and released frames, and named rejection.
 * @evidence contracts/development/testing.md#execution-ownership The focused public-entry feature test owns its performers, models and in-memory scene.
 */
export function test_human_motion_wardrobe_custody(): void {
  const failures: string[] = [];
  for (const [label, run] of [
    ["jacket, m-average", () => jacket("m-average", "left")],
    ["jacket, f-small", () => jacket("f-small", "right")],
    ["shoe, m-average", () => footwear("m-average", "right", "shoe")],
    ["sock, f-small", () => footwear("f-small", "left", "sock")],
    ["missing opening", unavailable],
  ] as const) {
    try {
      run();
    } catch (error) {
      failures.push(label + ": " + (error as Error).message);
    }
  }
  TestValidator.equals(
    "all wardrobe geometries and custody paths",
    failures,
    [],
  );
}

/** Stage two sleeves while retaining the same jacket through the closure. */
function jacket(cast: Cast, hand: AutoMovieHumanSide): void {
  const body = motionHumanBody(cast);
  const sign: number = hand === "left" ? 1 : -1;
  const other: AutoMovieHumanSide = hand === "left" ? "right" : "left";
  const model = createStageJacket({
    id: "jacket",
    width: 0.39,
    depth: 0.3,
    sleeveWidth: 0.19,
    sleeveLength: 0.04,
    length: 0.48,
    zipTravel: 0.15,
  });
  const performance: HumanPerformance = stage(
    body,
    [HumanObject.prop("jacket", model, placement(0.1 * sign, 1.06, 0.24))],
    HumanChain.subject("actor")
      .stand({ seconds: 0.3 })
      .pickUp({ prop: "jacket", handle: "hold", hand, lift: 0.02 })
      .registered("wardrobe", { kind: "jacketOn", prop: "jacket", hand })
      .registered("wardrobe", { kind: "sleeveIn", prop: "jacket", side: hand })
      .registered("wardrobe", { kind: "closeZip", prop: "jacket", side: other })
      .stand({ seconds: 0.24 })
      .registered("wardrobe", { kind: "openZip", prop: "jacket", side: other })
      .registered("wardrobe", { kind: "sleeveOut", prop: "jacket", side: hand })
      .registered("wardrobe", {
        kind: "sleeveOut",
        prop: "jacket",
        side: other,
      })
      .pickUp({ prop: "jacket", handle: "hold", hand, lift: 0 })
      .putDown({
        prop: "jacket",
        at: { x: 0.1 * sign, y: 1.06, z: 0.24 },
        hand,
      })
      .walk({ to: Vector3.create(sign * 0.65, 0, 0.4) }).node,
  );
  const segments = performance.segments("actor");
  const motions = segments.filter(
    (entry: IAutoMovieMotionHumanSegment): boolean =>
      entry.plan.events.some((event): boolean => event.name === "sleeveReady"),
  );
  for (const [index, side] of [other, hand, hand, other].entries()) {
    const span: IAutoMovieMotionHumanSegment = motions[index]!;
    const site: IAutoMovieAffordance = model.affordance(
      side === "left" ? "leftSleeveOpening" : "rightSleeveOpening",
    );
    const read = (t: number): IAutoMovieVector3 =>
      localSite(
        performance.prop("jacket", t),
        site,
        HumanHand.frame(body, performance.bones("actor", t), side, "grip")
          .point,
      );
    const a: IAutoMovieVector3 = read(mark(span, "sleeveReady"));
    const b: IAutoMovieVector3 = read(mark(span, "sleeveClear"));
    const passage: IAutoMovieVector3 = read(mark(span, "sleeveOpening"));
    const [from, to]: readonly [IAutoMovieVector3, IAutoMovieVector3] =
      index >= 2 ? [b, a] : [a, b];
    TestValidator.predicate(
      "the real hand passes opposite sides of " +
        site.id +
        " " +
        JSON.stringify({ from, passage, to }),
      from.z > 0.02 &&
        to.z < -0.05 &&
        Math.abs(passage.z) < 0.015 &&
        [from, passage, to].every(
          (p) =>
            Math.abs(p.x) < site.width! / 2 && p.y > 0 && p.y < site.height!,
        ),
    );
  }

  const wear: number = mark(motions[0]!, "jacketWorn");
  const heldFrame: IAutoMovieRigidTransform = performance.prop(
    "jacket",
    wear - 0.001,
  );
  const wornFrame: IAutoMovieRigidTransform = performance.prop(
    "jacket",
    wear + 0.001,
  );
  TestValidator.predicate(
    "the hand-to-chest transfer keeps the displayed garment pose",
    Vector3.distance(heldFrame.position, wornFrame.position) < 0.002 &&
      Quaternion.angle(heldFrame.rotation, wornFrame.rotation) < 0.005,
  );
  const operations = segments.filter(
    (span: IAutoMovieMotionHumanSegment): boolean =>
      span.plan.drives?.some((key): boolean => key.articulation === "zip") ===
      true,
  );
  const endClose: number = mark(operations[0]!, "strokeEnd");
  const endOpen: number = mark(operations[1]!, "strokeEnd");
  const closed: number = performance.state("jacket", endClose).zip!;
  TestValidator.predicate(
    "the closure pulls the visible zip and returns it",
    Math.abs(closed - 0.15) <= 1e-8 &&
      model.articulate({ zip: closed }).affordance("zip").frame.translation.y -
        model.affordance("zip").frame.translation.y >
        0.14 &&
      Math.abs(performance.state("jacket", endOpen).zip!) <= 1e-8,
  );
  const fit: IAutoMovieRigidTransform = relative(
    performance,
    "jacket",
    "chest",
    wear + 0.002,
  );
  const later: IAutoMovieRigidTransform = relative(
    performance,
    "jacket",
    "chest",
    endClose,
  );
  TestValidator.predicate(
    "one jacket follows the chest after transfer",
    Vector3.distance(fit.position, later.position) <= 0.001 &&
      Quaternion.angle(fit.rotation, later.rotation) <= 1e-4,
  );
  setDown(performance, "jacket", { x: 0.1 * sign, y: 1.06, z: 0.24 });
}

/** Change independently sized footwear while preserving the chair and opposite foot. */
function footwear(
  cast: Cast,
  side: AutoMovieHumanSide,
  kind: createStageFootwear.Kind,
): void {
  const hand: AutoMovieHumanSide = side === "right" ? "left" : "right";
  const sign: number = hand === "left" ? 1 : -1;
  const body = motionHumanBody(cast);
  const model = createStageFootwear({
    id: "footwear",
    kind,
    length: 0.34,
    width: 0.15,
    height: 0.045,
  });
  const chair = createSeat({
    kind: "office",
    seatHeight: cast === "f-small" ? 0.39 : 0.43,
  });
  const chairAt: IAutoMovieRigidTransform = placement(0, 0, -0.25);
  const touch: IAutoMovieRigidTransform = placement(sign * 0.34, 0.73, 0.25);
  const performance: HumanPerformance = stage(
    body,
    [
      HumanObject.prop("footwear", model, touch),
      HumanObject.prop("chair", chair, chairAt),
    ],
    HumanChain.subject("actor")
      .pickUp({ prop: "footwear", handle: "hold", hand, lift: 0.04 })
      .sit({ seat: HumanObject.seat(chair, chairAt), seconds: 0.8 })
      .registered("wardrobe", {
        kind: "footwearOn",
        prop: "footwear",
        side,
        hand,
      })
      .rise({})
      .stand({ seconds: 0.35 })
      .sit({ seat: HumanObject.seat(chair, chairAt), seconds: 0.8 })
      .registered("wardrobe", {
        kind: "footwearOff",
        prop: "footwear",
        side,
        hand,
      })
      .rise({})
      .putDown({ prop: "footwear", at: touch.position, hand }).node,
  );
  const segments = performance.segments("actor");
  const forward: IAutoMovieMotionHumanSegment = segments.find((span) =>
    span.plan.events.some((event) => event.name === "footwearWorn"),
  )!;
  const reverse: IAutoMovieMotionHumanSegment = segments.find((span) =>
    span.plan.events.some((event) => event.name === "footwearClear"),
  )!;
  const opening: IAutoMovieAffordance = model.affordance("opening");
  const footInOpening = (time: number): IAutoMovieVector3[] => {
    const sockets = HumanFoot.sockets(
      body,
      performance.bones("actor", time),
      side,
    );
    return [sockets[0]!, sockets[2]!].map(
      ({ point }): IAutoMovieVector3 =>
        localSite(performance.prop("footwear", time), opening, point),
    );
  };
  const before: number = mark(forward, "footwearReady");
  const on: number = mark(forward, "footwearWorn");
  const done: number = mark(reverse, "footwearClear");
  const handover = mark(reverse, "footwearReady");
  for (const boundary of [on, handover]) {
    const before: IAutoMovieRigidTransform = performance.prop(
      "footwear",
      boundary - 0.001,
    );
    const after: IAutoMovieRigidTransform = performance.prop(
      "footwear",
      boundary + 0.001,
    );
    TestValidator.predicate(
      "footwear keeps its pose across custody",
      Vector3.distance(before.position, after.position) < 0.002 &&
        Quaternion.angle(before.rotation, after.rotation) < 0.005,
    );
  }
  const entering = footInOpening(before);
  const fitted = footInOpening(on);
  const leaving = footInOpening(done);
  const mouth = footInOpening(mark(forward, "footwearOpening"));
  TestValidator.predicate(
    "the real heel and toe pass into the opening and back out " +
      JSON.stringify({ entering, fitted, leaving, mouth }),
    entering.every((p) => p.z > 0.01) &&
      fitted.every((p) => p.z < -0.015) &&
      leaving.every((p) => p.z > 0.01) &&
      mouth.every(
        (p) =>
          Math.abs(p.z) < 0.015 &&
          Math.abs(p.x) < opening.width! / 2 &&
          p.y > 0 &&
          p.y < opening.height!,
      ),
  );
  const foot = side === "left" ? "leftFoot" : "rightFoot";
  const worn: IAutoMovieRigidTransform = relative(
    performance,
    "footwear",
    foot,
    on + 0.003,
  );
  const raised: IAutoMovieRigidTransform = relative(
    performance,
    "footwear",
    foot,
    reverse.start - 0.05,
  );
  TestValidator.predicate(
    "the same footwear follows the foot through stand and seat",
    Vector3.distance(worn.position, raised.position) < 0.001 &&
      Quaternion.angle(worn.rotation, raised.rotation) < 1e-4,
  );
  setDown(performance, "footwear", touch.position);
}

/** Read the released pose and prove that its final frame stays on the set. */
function setDown(
  film: HumanPerformance,
  prop: string,
  destination: IAutoMovieVector3,
): void {
  const span = film
    .segments("actor")
    .find((segment) =>
      segment.plan.events.some((event) => event.name === "placed"),
    )!;
  const released: IAutoMovieRigidTransform = film.prop(
    prop,
    mark(span, "release") + 0.005,
  );
  const final: IAutoMovieRigidTransform = film.prop(prop, film.duration);
  const miss: number = Vector3.distance(final.position, destination);
  TestValidator.predicate(
    prop +
      " stays at the staged release frame (placement error " +
      miss +
      " m)",
    miss < 0.075 &&
      Vector3.distance(final.position, released.position) < 0.001 &&
      Quaternion.angle(final.rotation, released.rotation) < 1e-4,
  );
}

/** Verify unavailable clothing geometry produces a named refusal. */
function unavailable(): void {
  const shoe = createStageFootwear({
    id: "shoe",
    kind: "shoe",
    length: 0.34,
    width: 0.15,
    height: 0.045,
  });
  let error: unknown;
  try {
    stage(
      motionHumanBody("m-average"),
      [HumanObject.prop("shoe", shoe, placement(-0.34, 0.73, 0.25))],
      HumanChain.subject("actor")
        .pickUp({ prop: "shoe", handle: "hold", hand: "right", lift: 0.04 })
        .registered("wardrobe", {
          kind: "jacketOn",
          prop: "shoe",
          hand: "right",
        }).node,
    ).bones("actor", 0.3);
  } catch (caught) {
    error = caught;
  }
  TestValidator.predicate(
    "the prop cannot substitute unrelated geometry",
    error instanceof HumanRefusal &&
      error.axis === "opening" &&
      error.value === "leftSleeveOpening",
  );
}

/** Compile installed action records on an ordinary authored actor. */
function stage(
  body: ReturnType<typeof motionHumanBody>,
  props: IAutoMovieMotionHumanProp[],
  composition: ReturnType<typeof HumanChain.subject>["node"],
): HumanPerformance {
  return new HumanPerformance({
    seed: "native-wardrobe",
    laws: [wardrobe as IAutoMovieMotionHumanActionLaw],
    props,
    composition,
    performers: [
      {
        subject: "actor",
        body,
        at: Vector3.create(0, 0, 0),
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
  });
}

/** World transform of a prop entering a scene without motion. */
function placement(x: number, y: number, z: number): IAutoMovieRigidTransform {
  return {
    position: Vector3.create(x, y, z),
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  };
}

/** Project the actual world point into a socket's local geometry. */
function localSite(
  prop: IAutoMovieRigidTransform,
  site: IAutoMovieAffordance,
  p: IAutoMovieVector3,
): IAutoMovieVector3 {
  return Quaternion.rotateVector(
    Quaternion.inverse(site.frame.rotation),
    Vector3.subtract(
      Quaternion.rotateVector(
        Quaternion.inverse(prop.rotation),
        Vector3.subtract(p, prop.position),
      ),
      site.frame.translation,
    ),
  );
}

/** Read the relative attachment from both independently displayed world frames. */
function relative(
  film: HumanPerformance,
  prop: string,
  bone: "chest" | "leftFoot" | "rightFoot",
  time: number,
): IAutoMovieRigidTransform {
  const frame = film.bones("actor", time).get(bone)!;
  const source: IAutoMovieRigidTransform = film.prop(prop, time);
  const inverse = Quaternion.inverse(frame.worldRotation);
  return {
    position: Quaternion.rotateVector(
      inverse,
      Vector3.subtract(source.position, frame.worldPosition),
    ),
    rotation: Quaternion.multiply(inverse, source.rotation),
  };
}

/** Resolve a named action event as a film second. */
function mark(span: IAutoMovieMotionHumanSegment, name: string): number {
  return (
    span.start +
    span.plan.events.find((event): boolean => event.name === name)!.share *
      span.plan.duration
  );
}
