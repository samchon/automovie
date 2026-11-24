import {
  type AutoMovieArchetype,
  createStageJacket,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanSegment,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanDress,
  AutoMovieMotionHumanGetDressed,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { HumanHand } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { wardrobeFilm } from "../../../features/internal/wardrobeFilm";

/** The rigid custody bound: a worn item's drift on its bone, metres. */
const RIGID: number = 0.001;

/** How still the held-open jacket stays while the partner threads, metres. */
const STILL: number = 0.002;

/** How far the jacket's `wear` socket may lie from the collar, metres: `wardrobe`'s reach tolerance. */
const MISS: number = 0.01;

/** The wearer's collar offset from mid-shoulders in the wearer's heading: `wardrobe`'s own. */
const COLLAR: IAutoMovieVector3 = { x: 0, y: -0.085, z: 0.1 };

/** How long the partner waits before threading, and how long the jacket is held open, seconds. */
const WAIT: number = 3;
const HOLD: number = 4.5;

/** A jacket model. */
type JacketModel = AutoMovieArchetype<
  createStageJacket.Affordance,
  createStageJacket.Dimension
>;

/**
 * Helping a partner into a coat (#4015).
 *
 * Scenarios, the average man coating the small woman and the reverse, with
 * either holding hand, each take clean:
 * 1. The dresser holds the jacket still at the partner's collar while the
 *    partner's hands pass through both sleeve openings.
 * 2. The dresser's grip ends as the jacket is worn; its `wear` socket then
 *    lies on the partner's collar and it rides the partner's chest while
 *    the partner walks off.
 * 3. Naming the dresser as the partner, or a hold of no length, is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the cases, the bounds and the refusals.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the displayed jacket, the partner's hands in each sleeve opening's frame, the partner's shoulders and chest; a jacket moving under the threading hands, a hand missing an opening, a grip outlasting the wear, a collar off the shoulders or a jacket sliding on the chest fails.
 * @evidence contracts/development/testing.md#independent-expectations The sleeve passage is the wardrobe specification's; the collar is `wardrobe`'s own seat; custody passes without a gap, worn rigid within 1 mm.
 * @evidence contracts/development/testing.md#distinguishing-cases Two body pairs, both holding hands, two refusals.
 * @evidence contracts/development/testing.md#execution-ownership In-memory two-performer performances through the public chain.
 */
export function test_motion_get_dressed_coat_partner(): void {
  for (const [dresser, dressed] of [
    ["m-average", "f-small"],
    ["f-small", "m-average"],
  ] as const)
    for (const hand of ["right", "left"] as const) {
      const label: string = `${dresser} coats ${dressed} (${hand} hand)`;
      const b: IAutoMovieMotionHumanBody = motionHumanBody(dressed);
      const model: JacketModel = jacket();
      const film: HumanPerformance = stage(
        motionHumanBody(dresser),
        b,
        model,
        hand,
        "b",
        HOLD,
      );
      assertTakeClean(label, film);
      const coat: IAutoMovieMotionHumanSegment = film
        .segments("a")
        .find(
          (segment: IAutoMovieMotionHumanSegment): boolean =>
            segment.name === "coatPartner",
        )!;
      const ready: number = wardrobeFilm.mark(coat, "collarReady");
      const worn: number = wardrobeFilm.mark(coat, "jacketWorn");
      const sleeves: readonly IAutoMovieMotionHumanSegment[] = film
        .segments("b")
        .filter((segment: IAutoMovieMotionHumanSegment): boolean =>
          segment.plan.events.some(
            (event: IAutoMovieMotionEvent): boolean =>
              event.name === "sleeveReady",
          ),
        );
      TestValidator.equals(
        `${label}: both sleeves are threaded`,
        sleeves.length,
        2,
      );
      const first: number = sleeves[0]!.start;
      const last: number = wardrobeFilm.mark(sleeves[1]!, "sleeveClear");
      TestValidator.predicate(
        `${label}: the threading lies inside the held span`,
        first >= ready && last <= worn,
      );
      const still: number = Vector3.distance(
        film.prop("jacket", first).position,
        film.prop("jacket", last).position,
      );
      TestValidator.predicate(
        `${label}: the jacket is held still while the partner threads (${(still * 1000).toFixed(1)} mm)`,
        still <= STILL,
      );
      (["left", "right"] as const).forEach(
        (side: AutoMovieHumanSide, index: number): void => {
          const span: IAutoMovieMotionHumanSegment = sleeves[index]!;
          const site: IAutoMovieAffordance = model.affordance(
            side === "left" ? "leftSleeveOpening" : "rightSleeveOpening",
          );
          const read: (t: number) => IAutoMovieVector3 = (
            t: number,
          ): IAutoMovieVector3 =>
            wardrobeFilm.localSite(
              film.prop("jacket", t),
              site,
              HumanHand.frame(b, film.bones("b", t), side, "grip").point,
            );
          const from: IAutoMovieVector3 = read(
            wardrobeFilm.mark(span, "sleeveReady"),
          );
          const to: IAutoMovieVector3 = read(
            wardrobeFilm.mark(span, "sleeveClear"),
          );
          TestValidator.predicate(
            `${label}: the ${side} hand passes through its sleeve ${JSON.stringify({ from, to })}`,
            from.z > 0.02 &&
              to.z < -0.05 &&
              [from, to].every(
                (p: IAutoMovieVector3): boolean =>
                  Math.abs(p.x) < site.width! / 2 &&
                  p.y > 0 &&
                  p.y < site.height!,
              ),
          );
        },
      );
      const grip: IAutoMovieMotionHumanContactWindow | undefined =
        coat.plan.contacts.find(
          (window: IAutoMovieMotionHumanContactWindow): boolean =>
            window.kind === "grip" &&
            window.support.kind === "prop" &&
            window.support.subject === "jacket",
        );
      TestValidator.predicate(
        `${label}: the grip ends as the jacket is worn`,
        grip !== undefined &&
          Math.abs(coat.start + grip.to * coat.plan.duration - worn) <= 1e-9,
      );
      const seat: number = Vector3.distance(
        socket(film.prop("jacket", worn), model.affordance("wear")),
        collar(film, worn),
      );
      TestValidator.predicate(
        `${label}: the collar rests on the shoulders (${(seat * 1000).toFixed(1)} mm)`,
        seat <= MISS,
      );
      const start: IAutoMovieRigidTransform = chest(film, worn + 0.01);
      const drifts: readonly number[] = [0.5, 1].map(
        (share: number): number => {
          const t: number = worn + share * (film.duration - worn);
          return Vector3.distance(chest(film, t).position, start.position);
        },
      );
      TestValidator.predicate(
        `${label}: the jacket rides the partner's chest (${drifts.map((d: number): string => (d * 1000).toFixed(2)).join(", ")} mm)`,
        drifts.every((d: number): boolean => d <= RIGID),
      );
    }
  const self: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  for (const [name, partner, hold] of [
    ["partner", "a", HOLD],
    ["hold", "b", 0],
  ] as const)
    TestValidator.predicate(
      `a coat with a bad ${name} is refused`,
      (() => {
        try {
          stage(self, self, jacket(), "right", partner, hold).bones("a", 4);
          return false;
        } catch (error: unknown) {
          return error instanceof HumanRefusal && error.axis === name;
        }
      })(),
    );
}

/** The stage jacket the wardrobe specifications use. */
function jacket(): JacketModel {
  return createStageJacket({
    id: "jacket",
    width: 0.39,
    depth: 0.3,
    sleeveWidth: 0.19,
    sleeveLength: 0.04,
    length: 0.48,
    zipTravel: 0.15,
  });
}

/** The dresser `a` behind the partner `b`, both facing +Z; `a` picks up the jacket and coats `partner`, `b` threads both sleeves and walks off. */
function stage(
  a: IAutoMovieMotionHumanBody,
  b: IAutoMovieMotionHumanBody,
  model: JacketModel,
  hand: AutoMovieHumanSide,
  partner: string,
  hold: number,
): HumanPerformance {
  const sign: number = hand === "left" ? 1 : -1;
  return new HumanPerformance({
    seed: "coat-partner",
    laws: [
      AutoMovieMotionHumanGetDressed.coatPartner,
      AutoMovieMotionHumanDress.wardrobe,
    ],
    performers: [
      {
        subject: "a",
        body: a,
        at: { x: 0, y: 0, z: -0.45 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
      {
        subject: "b",
        body: b,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    props: [
      HumanObject.prop(
        "jacket",
        model,
        wardrobeFilm.placement(0.1 * sign + 0.25 * sign, 1.06, -0.25),
      ),
    ],
    // The partner is placed first, so the dresser reads where the partner
    // stands; the partner threads the jacket where the dresser holds it, at
    // the partner's own collar, without reading the dresser.
    composition: HumanChain.subject("b")
      .stand({ hold: WAIT })
      .registered("wardrobe", {
        kind: "sleeveIn",
        prop: "jacket",
        side: "left",
        held: true,
      })
      .registered("wardrobe", {
        kind: "sleeveIn",
        prop: "jacket",
        side: "right",
        held: true,
      })
      .stand({ hold: 2 })
      .walk({ to: { x: 0.3, y: 0, z: 0.8 }, face: 60 })
      .with(
        HumanChain.extend({
          coatPartner: AutoMovieMotionHumanGetDressed.coatPartner,
        })
          .subject("a")
          .stand({ hold: 0.3 })
          // The dresser stands behind the partner, so it takes the jacket by
          // its back collar; the `hold` handle is on the front.
          .pickUp({ prop: "jacket", handle: "backCollar", hand, lift: 0.02 })
          .coatPartner({ prop: "jacket", partner, hand, hold }),
      ).node,
  });
}

/** A prop socket's world point. */
function socket(
  prop: IAutoMovieRigidTransform,
  site: IAutoMovieAffordance,
): IAutoMovieVector3 {
  return Vector3.add(
    prop.position,
    Quaternion.rotateVector(prop.rotation, site.frame.translation),
  );
}

/** The partner's displayed collar: mid-shoulders plus `wardrobe`'s collar offset in the partner's heading. */
function collar(film: HumanPerformance, t: number): IAutoMovieVector3 {
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = film.bones(
    "b",
    t,
  );
  const left: IAutoMovieVector3 = bones.get("leftUpperArm")!.worldPosition;
  const right: IAutoMovieVector3 = bones.get("rightUpperArm")!.worldPosition;
  const across: IAutoMovieVector3 = Vector3.subtract(left, right);
  const yaw: number = (Math.atan2(-across.z, across.x) * 180) / Math.PI;
  return Vector3.add(
    Vector3.lerp(left, right, 0.5),
    Quaternion.rotateVector(
      Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, yaw),
      COLLAR,
    ),
  );
}

/** The jacket's frame in the partner's displayed chest frame. */
function chest(film: HumanPerformance, t: number): IAutoMovieRigidTransform {
  const bone: IAutoMovieResolvedBone = film.bones("b", t).get("chest")!;
  const prop: IAutoMovieRigidTransform = film.prop("jacket", t);
  const inverse: IAutoMovieQuaternion = Quaternion.inverse(bone.worldRotation);
  return {
    position: Quaternion.rotateVector(
      inverse,
      Vector3.subtract(prop.position, bone.worldPosition),
    ),
    rotation: Quaternion.multiply(inverse, prop.rotation),
  };
}
