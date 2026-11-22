import { type Archetype, createMedal } from "@automovie/archetypes";
import { Quaternion, Vector3, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSegment,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain, HumanObject, HumanPerformance, dressPartner } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../internal/assertTakeClean";
import { motionHumanBody } from "../internal/motionHumanBody";

/** The rigid custody bound: a worn item's drift on its bone, metres. */
const RIGID: number = 0.001;

/** How near the medal's worn face lies to the breastbone, metres: the contact bound. */
const SEAT: number = 0.01;

/** A medal model. */
type Medal = Archetype<createMedal.Affordance, createMedal.Dimension>;

/**
 * A medal ceremony (#4015): the presenter hangs a ribbon medal on a
 * partner who bows to receive it.
 *
 * Scenarios, the average man decorating the small woman and the reverse,
 * each take clean:
 * 1. The medal's worn face lies on the partner's breastbone once worn.
 * 2. It rides the partner's chest through the rest of the take as the
 *    partner straightens and turns.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the scene, the cases and the bounds.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the displayed medal's worn face against the partner's displayed breastbone and chest; a medal off the chest or sliding on it fails.
 * @evidence contracts/development/testing.md#independent-expectations The contact bound and the rigid custody bound of the dressing specifications.
 * @evidence contracts/development/testing.md#distinguishing-cases Both body pairs.
 * @evidence contracts/development/testing.md#execution-ownership In-memory two-performer performances through the public chain.
 */
export function test_human_motion_medal_ceremony(): void {
  for (const [presenter, receiver] of [
    ["m-average", "f-small"],
    ["f-small", "m-average"],
  ] as const) {
    const label: string = `${presenter} decorates ${receiver}`;
    const b: IAutoMovieMotionHumanBody = motionHumanBody(receiver);
    const medal: Medal = createMedal({ id: "medal" });
    const film: HumanPerformance = ceremony(motionHumanBody(presenter), b, medal);
    assertTakeClean(label, film);
    const dress: IAutoMovieMotionHumanSegment = film
      .segments("a")
      .find((s: IAutoMovieMotionHumanSegment): boolean => s.name === "dressPartner")!;
    const worn: number = mark(dress, "stroke");
    const face: IAutoMovieVector3 = point(film.prop("medal", worn + 0.01), medal);
    const region: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.place(
      b.surfaces.regions.sternum,
      film.bones("b", worn + 0.01).get(b.surfaces.regions.sternum.bone)!,
    ).point;
    TestValidator.predicate(
      `${label}: the medal's face lies on the breastbone (${(Vector3.distance(face, region) * 1000).toFixed(0)} mm)`,
      Vector3.distance(face, region) <= SEAT,
    );
    const first: IAutoMovieVector3 = local(film, worn + 0.01);
    const drifts: readonly number[] = [0.5, 1].map((share: number): number =>
      Vector3.distance(local(film, worn + share * (film.duration - worn)), first),
    );
    TestValidator.predicate(
      `${label}: the medal rides the chest (${drifts.map((d: number): string => (d * 1000).toFixed(2)).join(", ")} mm)`,
      drifts.every((d: number): boolean => d <= RIGID),
    );
  }
}

/** `a` faces `b`, picks up the medal and hangs it on `b`'s breastbone while `b` bows, then `b` straightens and turns. */
function ceremony(a: IAutoMovieMotionHumanBody, b: IAutoMovieMotionHumanBody, medal: Medal): HumanPerformance {
  return new HumanPerformance({
    seed: "medal-ceremony",
    laws: [dressPartner],
    performers: [
      { subject: "a", body: a, at: { x: 0, y: 0, z: 0 }, yaw: 0, proficiency: { level: "trained" } },
      { subject: "b", body: b, at: { x: 0, y: 0, z: 0.6 }, yaw: 180, proficiency: { level: "trained" } },
    ],
    props: [
      HumanObject.prop("medal", medal, {
        position: { x: -0.25, y: 1.1, z: 0.2 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
      }),
    ],
    composition: HumanChain.extend({ dressPartner })
      .subject("a")
      .pickUp({ prop: "medal", handle: "hold", hand: "right", lift: 0.05 })
      .dressPartner({ prop: "medal", partner: "b", region: "sternum", point: "wear" })
      .with(
        HumanChain.subject("b")
          .gesture({ kind: "bow" })
          .stand({ seconds: 3 })
          .walk({ to: { x: 0, y: 0, z: 0.6 }, face: 120 }),
      ).node,
  });
}

/** The medal's displayed worn face. */
function point(frame: IAutoMovieRigidTransform, medal: Medal): IAutoMovieVector3 {
  return Vector3.add(frame.position, Quaternion.rotateVector(frame.rotation, medal.affordance("wear").frame.translation));
}

/** The medal's position in the partner's displayed chest frame. */
function local(film: HumanPerformance, t: number): IAutoMovieVector3 {
  const bone: IAutoMovieResolvedBone = film.bones("b", t).get("chest")!;
  return Quaternion.rotateVector(
    Quaternion.inverse(bone.worldRotation),
    Vector3.subtract(film.prop("medal", t).position, bone.worldPosition),
  );
}

/** The film second of a segment's named event. */
function mark(segment: IAutoMovieMotionHumanSegment, name: string): number {
  return (
    segment.start +
    segment.plan.duration *
      segment.plan.events.find((event: IAutoMovieMotionEvent): boolean => event.name === name)!.share
  );
}
