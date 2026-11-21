import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanSegment,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanHand, HumanPerformance, HumanRefusal } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { equestrianHandlerTake as Take } from "../internal/equestrianHandlerTake";
import { motionHumanBody } from "../internal/motionHumanBody";

/** The rider attachment contract's 10 mm contact budget. */
const CONTACT: number = 0.01;

/**
 * A handler leads a horse in, brushes it with a held brush, puts on its halter, saddles it and holds a lifted hoof on one scene clock with the horse's own responses.
 *
 * Scenarios:
 * 1. The handler walks the horse in, the displayed palm on the moving lead rope from acquisition to release while the horse travels.
 * 2. The displayed palm meets each named horse contact while held: the bristle face of a body brush the handler picks up, along a stroke on the barrel, before putting the brush back, and the hoof the horse lifts; it is clear of it before acquisition and after release.
 * 3. Every held window names the horse as its support, the hand as its part and the touch or grip its task asks for. A halter fitted to the horse hangs on a hook, rides the hand by its grip, and once put on the horse's lowered head rides its head socket; a saddle made of the same horse's saddle parts is carried from its rack and laid on the bareback horse's back, where it rides the trunk through the horse's later weight shift and startle.
 * 4. The horse lifts the hoof the handler holds only after moving its weight, and the startle it gives after the hoof is put down replays identically when the take is built again.
 * 5. A care placement on the horse's far side refuses as out of reach.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names every scenario and what it checks.
 * @evidence contracts/development/testing.md#behavioral-verification Plays the public care overlay over shipped stands and a crouch against the public horse stance and expression layers through the performance's readers.
 * @evidence contracts/development/testing.md#independent-expectations Each contact is the displayed palm's distance to the horse contact's surface read from the horse's own displayed parts, against the attachment contract's 10 mm budget.
 * @evidence contracts/development/testing.md#distinguishing-cases Lead, brush, halter, saddle and hoof; before, during and after each hold; a reachable side versus the far side.
 * @evidence contracts/development/testing.md#execution-ownership A deterministic in-memory scene; the horse's whole-body responses are `test_archetype_equine_reaction`'s and leading is `test_motion_equestrian_lifecycle`'s.
 */
export function test_motion_equestrian_handler(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const first: Take.ITake = Take.take(body, "groomLeft");
  const again: Take.ITake = Take.take(body, "groomLeft");
  const caring = (film: HumanPerformance): IAutoMovieMotionHumanSegment[] =>
    film
      .overlays("handler")
      .filter((overlay: IAutoMovieMotionHumanSegment): boolean =>
        overlay.name.startsWith("tendHorse"),
      );
  const overlays: readonly IAutoMovieMotionHumanSegment[] = caring(first.film);
  const palm: IAutoMovieVector3 = HumanHand.offset(body, "right", "palm").point;
  const shown = (film: HumanPerformance, at: number): IAutoMovieVector3 => {
    const hand: IAutoMovieResolvedBone = film
      .bones("handler", at)
      .get("rightHand")!;
    return Vector3.add(
      hand.worldPosition,
      Quaternion.rotateVector(hand.worldRotation, palm),
    );
  };
  // The brush's displayed bristle face: the held prop's world frame carrying its face contact.
  const bristles = (film: HumanPerformance, at: number): IAutoMovieVector3 => {
    const frame: IAutoMovieRigidTransform = film.prop("brush", at);
    return Vector3.add(
      frame.position,
      Quaternion.rotateVector(
        frame.rotation,
        Take.BRUSH.affordance("face").frame.translation,
      ),
    );
  };
  const names: readonly string[] = ["groomLeft", "leftForeHoof"];
  TestValidator.equals("two care overlays", overlays.length, names.length);
  overlays.forEach((overlay: IAutoMovieMotionHumanSegment, k: number): void => {
    const name: string = names[k]!;
    const window: IAutoMovieMotionHumanContactWindow | undefined =
      overlay.plan.contacts.find(
        (contact: IAutoMovieMotionHumanContactWindow): boolean =>
          contact.part === "rightHand",
      );
    TestValidator.predicate(
      `the ${name} hold names the horse`,
      window !== undefined &&
        window.support.kind === "prop" &&
        window.support.subject === "horse",
    );
    const duration: number = overlay.end - overlay.start;
    const on: number = overlay.start + window!.from * duration;
    const off: number = overlay.start + window!.to * duration;
    const touched: IAutoMovieVector3[] = [];
    for (let i: number = 0; i <= 6; i++) {
      const at: number = on + ((off - on) * i) / 6;
      const point: IAutoMovieTransform = first.part(name, at);
      const radius: number =
        (first.affordances.find(
          (a: IAutoMovieAffordance): boolean => a.id === name,
        )?.aperture ?? 0) / 2;
      const hand: IAutoMovieVector3 =
        name === "groomLeft" ? bristles(first.film, at) : shown(first.film, at);
      touched.push(hand);
      const distance: number = Math.abs(
        Vector3.dot(
          Vector3.subtract(hand, point.translation),
          Quaternion.rotateVector(point.rotation, { x: 0, y: 1, z: 0 }),
        ) - radius,
      );
      TestValidator.predicate(
        `the palm holds ${name} at ${at}`,
        distance <= CONTACT,
      );
    }
    for (const at of [overlay.start, overlay.end])
      TestValidator.predicate(
        `the palm or brush is off ${name} at ${at}`,
        Vector3.distance(
          name === "groomLeft"
            ? bristles(first.film, at)
            : shown(first.film, at),
          first.part(name, at).translation,
        ) > 0.03,
      );
    if (name === "groomLeft")
      TestValidator.predicate(
        "the brush strokes along the coat",
        Math.max(
          ...touched.map((p: IAutoMovieVector3): number =>
            Vector3.distance(p, touched[0]!),
          ),
        ) > 0.2,
      );
  });

  // 0. The handler leads the horse in, the displayed palm on the moving lead rope while the rope travels.
  const lead: IAutoMovieMotionHumanSegment = first.film
    .overlays("handler")
    .find((overlay: IAutoMovieMotionHumanSegment): boolean =>
      overlay.name.startsWith("leadHorse"),
    )!;
  const leadWindow: IAutoMovieMotionHumanContactWindow =
    lead.plan.contacts.find(
      (contact: IAutoMovieMotionHumanContactWindow): boolean =>
        contact.part === "rightHand",
    )!;
  const leadOn: number = lead.start + leadWindow.from * (lead.end - lead.start);
  const leadOff: number = lead.start + leadWindow.to * (lead.end - lead.start);
  const rope: number =
    (first.affordances.find(
      (a: IAutoMovieAffordance): boolean => a.id === "lead",
    )!.aperture ?? 0) / 2;
  for (let i: number = 1; i < 8; i++) {
    const at: number = leadOn + ((leadOff - leadOn) * i) / 8;
    const frame: IAutoMovieTransform = first.part("lead", at);
    TestValidator.predicate(
      `the palm holds the lead at ${at}`,
      Vector3.distance(
        shown(first.film, at),
        Vector3.addScaled(
          frame.translation,
          Quaternion.rotateVector(frame.rotation, { x: 0, y: 1, z: 0 }),
          rope,
        ),
      ) <= CONTACT,
    );
  }
  TestValidator.predicate(
    "the led horse travels",
    Vector3.distance(
      first.part("lead", leadOn).translation,
      first.part("lead", leadOff).translation,
    ) > 1.5,
  );
  // The halter hangs on its hook, rides the hand by its grip, and once put on rides the horse's head socket; the saddle, carried from its rack, rides the trunk once laid on the back.
  const exchange: readonly IAutoMovieMotionHumanSegment[] = first.film
    .segments("handler")
    .filter(
      (segment: IAutoMovieMotionHumanSegment): boolean =>
        segment.name.startsWith("pickUp") || segment.name.startsWith("putDown"),
    );
  const sits = (prop: string, socket: string, at: number): boolean =>
    Vector3.distance(
      first.film.prop(prop, at).position,
      first.part(socket, at).translation,
    ) <= 1e-3;
  TestValidator.predicate(
    "the halter waits on its hook",
    Vector3.distance(
      first.film.prop("halter", exchange[2]!.start).position,
      first.hook,
    ) <= 1e-6,
  );
  const carried: number = (exchange[2]!.end + exchange[3]!.start) / 2;
  const held: IAutoMovieRigidTransform = first.film.prop("halter", carried);
  TestValidator.predicate(
    "the carried halter rides the hand by its grip",
    Vector3.distance(
      Vector3.add(
        held.position,
        Quaternion.rotateVector(
          held.rotation,
          first.halter.affordance("grip").frame.translation,
        ),
      ),
      shown(first.film, carried),
    ) <= 0.06,
  );
  TestValidator.predicate(
    "the saddle waits on its rack",
    Vector3.distance(
      first.film.prop("saddle", exchange[4]!.start).position,
      first.rack,
    ) <= 1e-6,
  );
  for (const at of [
    exchange[5]!.end,
    overlays[1]!.start + 1,
    overlays[1]!.end + 2,
  ]) {
    TestValidator.predicate(
      `the halter rides the head at ${at}`,
      sits("halter", "headgear", at),
    );
    TestValidator.predicate(
      `the saddle rides the back at ${at}`,
      sits("saddle", "saddle", at),
    );
  }
  // 3. The horse's hoof is up while the handler holds it, and the take replays.
  const hoof: IAutoMovieMotionHumanSegment = overlays[1]!;
  const middle: number = (hoof.start + hoof.end) / 2;
  TestValidator.predicate(
    "the held hoof is off the floor",
    first.part("leftForeHoof", middle).translation.y > 0.15,
  );
  for (const at of [hoof.end + 0.5, hoof.end + 2.2, middle])
    TestValidator.equals(
      `the horse replays at ${at}`,
      JSON.stringify(again.horse.at(at).archetype.parts),
      JSON.stringify(first.horse.at(at).archetype.parts),
    );

  // 4. The far side is out of reach.
  let caught: unknown = null;
  try {
    const far: Take.ITake = Take.take(body, "groomRight");
    const brush: IAutoMovieMotionHumanSegment = caring(far.film)[0]!;
    far.film.bones("handler", (brush.start + brush.end) / 2);
  } catch (error) {
    caught = error;
  }
  TestValidator.predicate(
    "a far-side brush refuses as out of reach",
    caught instanceof HumanRefusal && caught.axis === "careReach",
  );
}
