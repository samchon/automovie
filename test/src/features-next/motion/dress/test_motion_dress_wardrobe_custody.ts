import {
  type AutoMovieArchetype,
  createStageFootwear,
  createStageJacket,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionPropDrive,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { HumanHand } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { wardrobeFilm } from "../../../features/internal/wardrobeFilm";

/** One labelled case of the specification. */
type WardrobeCase = readonly [string, () => void];

/** The jacket on two casts and mirrored hands, and the refused substitute. */
const CASES: readonly WardrobeCase[] = [
  ["jacket, m-average", (): void => jacket("m-average", "left")],
  ["jacket, f-small", (): void => jacket("f-small", "right")],
  ["missing opening", (): void => unavailable()],
];

/**
 * A held open-front jacket uses the same geometry when worn or set down.
 *
 * Scenarios:
 * 1. Both apertures of an actual jacket admit its wearer's hands. The held
 *    jacket is released to the chest and its visible zipper runs both ways.
 * 2. A prop without the required sleeve opening refuses through the public
 *    entry.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the jacket, closure and its actual custody frames, and the refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Runs installed HumanPerformance, registered motion and concrete archetype producers for the complete wearable exchange.
 * @evidence contracts/development/testing.md#independent-expectations Converts the displayed hand geometry through the posed model, and reads closure travel from the visible slider, independently of a stored target pose.
 * @evidence contracts/development/testing.md#distinguishing-cases Observes actual signed passages, mirrored hands, a reversed closure, the worn and released frames, and named rejection; footwear is test_motion_dress_wardrobe_footwear's.
 * @evidence contracts/development/testing.md#execution-ownership The focused public-entry feature test owns its performers, models and in-memory scene.
 */
export function test_motion_dress_wardrobe_custody(): void {
  const failures: string[] = [];
  for (const [label, run] of CASES) {
    try {
      run();
    } catch (error: unknown) {
      failures.push(
        label + ": " + (error instanceof Error ? error.message : String(error)),
      );
    }
  }
  TestValidator.equals("jacket geometry and custody paths", failures, []);
}
/** Stage two sleeves while retaining the same jacket through the closure. */
function jacket(cast: motionHumanBody.Name, hand: AutoMovieHumanSide): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody(cast);
  const sign: number = hand === "left" ? 1 : -1;
  const other: AutoMovieHumanSide = hand === "left" ? "right" : "left";
  const model: AutoMovieArchetype<
    createStageJacket.Affordance,
    createStageJacket.Dimension
  > = createStageJacket({
    id: "jacket",
    width: 0.39,
    depth: 0.3,
    sleeveWidth: 0.19,
    sleeveLength: 0.04,
    length: 0.48,
    zipTravel: 0.15,
  });
  const performance: HumanPerformance = wardrobeFilm.stage(
    body,
    [
      HumanObject.prop(
        "jacket",
        model,
        wardrobeFilm.placement(0.1 * sign, 1.06, 0.24),
      ),
    ],
    HumanChain.subject("actor")
      .stand({ hold: 0.3 })
      .pickUp({ prop: "jacket", handle: "hold", hand, lift: 0.02 })
      .registered("wardrobe", { kind: "jacketOn", prop: "jacket", hand })
      .registered("wardrobe", { kind: "sleeveIn", prop: "jacket", side: hand })
      .registered("wardrobe", { kind: "closeZip", prop: "jacket", side: other })
      .stand({ hold: 0.24 })
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
        to: { x: 0.1 * sign, y: 1.06, z: 0.24 },
        hand,
      })
      .walk({ to: Vector3.create(sign * 0.65, 0, 0.4) }).node,
  );
  const segments: readonly IAutoMovieMotionHumanSegment[] =
    performance.segments("actor");
  const motions: IAutoMovieMotionHumanSegment[] = segments.filter(
    (entry: IAutoMovieMotionHumanSegment): boolean =>
      entry.plan.events.some(
        (event: IAutoMovieMotionEvent): boolean => event.name === "sleeveReady",
      ),
  );
  for (const [index, side] of [other, hand, hand, other].entries()) {
    const span: IAutoMovieMotionHumanSegment = motions[index]!;
    const site: IAutoMovieAffordance = model.affordance(
      side === "left" ? "leftSleeveOpening" : "rightSleeveOpening",
    );
    const read: (t: number) => IAutoMovieVector3 = (
      t: number,
    ): IAutoMovieVector3 =>
      wardrobeFilm.localSite(
        performance.prop("jacket", t),
        site,
        HumanHand.frame(body, performance.bones("actor", t), side, "grip")
          .point,
      );
    const a: IAutoMovieVector3 = read(wardrobeFilm.mark(span, "sleeveReady"));
    const b: IAutoMovieVector3 = read(wardrobeFilm.mark(span, "sleeveClear"));
    const passage: IAutoMovieVector3 = read(
      wardrobeFilm.mark(span, "sleeveOpening"),
    );
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

  const wear: number = wardrobeFilm.mark(motions[0]!, "jacketWorn");
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
  const operations: IAutoMovieMotionHumanSegment[] = segments.filter(
    (span: IAutoMovieMotionHumanSegment): boolean =>
      span.plan.drives?.some(
        (key: IAutoMovieMotionPropDrive): boolean => key.articulation === "zip",
      ) === true,
  );
  const endClose: number = wardrobeFilm.mark(operations[0]!, "strokeEnd");
  const endOpen: number = wardrobeFilm.mark(operations[1]!, "strokeEnd");
  const closed: number = performance.state("jacket", endClose).zip!;
  TestValidator.predicate(
    "the closure pulls the visible zip and returns it",
    Math.abs(closed - 0.15) <= 1e-8 &&
      model.articulate({ zip: closed }).affordance("zip").frame.translation.y -
        model.affordance("zip").frame.translation.y >
        0.14 &&
      Math.abs(performance.state("jacket", endOpen).zip!) <= 1e-8,
  );
  const fit: IAutoMovieRigidTransform = wardrobeFilm.relative(
    performance,
    "jacket",
    "chest",
    wear + 0.002,
  );
  const later: IAutoMovieRigidTransform = wardrobeFilm.relative(
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
  wardrobeFilm.setDown(performance, "jacket", {
    x: 0.1 * sign,
    y: 1.06,
    z: 0.24,
  });
}

/** Verify unavailable clothing geometry produces a named refusal. */
function unavailable(): void {
  const shoe: AutoMovieArchetype<
    createStageFootwear.Affordance,
    createStageFootwear.Dimension
  > = createStageFootwear({
    id: "shoe",
    kind: "shoe",
    length: 0.34,
    width: 0.15,
    height: 0.045,
  });
  let error: unknown;
  try {
    wardrobeFilm
      .stage(
        motionHumanBody("m-average"),
        [
          HumanObject.prop(
            "shoe",
            shoe,
            wardrobeFilm.placement(-0.34, 0.73, 0.25),
          ),
        ],
        HumanChain.subject("actor")
          .pickUp({ prop: "shoe", handle: "hold", hand: "right", lift: 0.04 })
          .registered("wardrobe", {
            kind: "jacketOn",
            prop: "shoe",
            hand: "right",
          }).node,
      )
      .bones("actor", 0.3);
  } catch (caught: unknown) {
    error = caught;
  }
  TestValidator.predicate(
    "the prop cannot substitute unrelated geometry",
    error instanceof HumanRefusal &&
      error.axis === "opening" &&
      error.value === "leftSleeveOpening",
  );
}
