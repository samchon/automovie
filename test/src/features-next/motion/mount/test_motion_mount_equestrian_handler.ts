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
import { HumanPerformance, HumanRefusal } from "@automovie/motions";
import { HumanHand } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { equestrianHandlerTake as Take } from "../../../features/internal/equestrianHandlerTake";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/** The rider attachment contract's 10 mm contact budget. */
const CONTACT: number = 0.01;

/**
 * A handler leads a horse in, brushes it with a held brush, puts on its halter, saddles it and holds a lifted hoof, one short take per task starting where its acceptance begins, with the horse's own responses.
 *
 * Scenarios:
 * 1. Lead-in: the displayed palm on the moving lead rope from acquisition to release while the horse travels.
 * 2. Brush: the handler picks the brush up and its bristle face meets the named care point along a stroke on the barrel, clear before and after, the hold naming the horse; a far-side care point refuses as out of reach.
 * 3. Headgear: the fitted halter hangs on its hook, rides the hand by its grip, and once put on the lowered head rides its head socket.
 * 4. Saddle: the saddle made of the horse's own saddle parts waits on its rack and once laid on the bareback horse's back rides the trunk.
 * 5. Hoof: the horse lifts the hoof only after moving its weight, the palm holds it while the hold names the horse, and the startle after replays identically when the take is built again.
 * 6. Every take passes the shipped verdicts over its whole length (`assertTakeClean`): no tangle, jump, turn pop, reversal, skate, floor or unloaded support.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names every scenario and what it checks.
 * @evidence contracts/development/testing.md#behavioral-verification Plays the public care overlay over shipped stands and a crouch against the public horse stance and expression layers through the performance's readers.
 * @evidence contracts/development/testing.md#independent-expectations Each contact is the displayed palm's or bristles' distance to the horse contact's surface read from the horse's own displayed parts, against the attachment contract's 10 mm budget.
 * @evidence contracts/development/testing.md#distinguishing-cases Lead, brush, halter, saddle and hoof; before, during and after each hold; a reachable side versus the far side.
 * @evidence contracts/development/testing.md#execution-ownership Deterministic in-memory scenes, each as short as its acceptance; the horse's whole-body responses are `test_archetype_equine_reaction`'s and leading is `test_motion_equestrian_lifecycle`'s.
 */
export function test_motion_mount_equestrian_handler(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
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
  const caring = (film: HumanPerformance): IAutoMovieMotionHumanSegment[] =>
    film
      .overlays("handler")
      .filter((overlay: IAutoMovieMotionHumanSegment): boolean =>
        overlay.name.startsWith("tendHorse"),
      );
  const exchange = (film: HumanPerformance): IAutoMovieMotionHumanSegment[] =>
    film
      .segments("handler")
      .filter(
        (segment: IAutoMovieMotionHumanSegment): boolean =>
          segment.name.startsWith("pickUp") ||
          segment.name.startsWith("putDown"),
      );

  /** A care hold: the horse named as support, the contact met while held and clear before and after. */
  const holds = (
    take: Take.ITake,
    name: string,
    contact: (at: number) => IAutoMovieVector3,
  ): IAutoMovieVector3[] => {
    const overlay: IAutoMovieMotionHumanSegment = caring(take.film)[0]!;
    const window: IAutoMovieMotionHumanContactWindow | undefined =
      overlay.plan.contacts.find(
        (each: IAutoMovieMotionHumanContactWindow): boolean =>
          each.part === "rightHand",
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
    const radius: number =
      (take.affordances.find(
        (a: IAutoMovieAffordance): boolean => a.id === name,
      )?.aperture ?? 0) / 2;
    const touched: IAutoMovieVector3[] = [];
    for (let i: number = 0; i <= 6; i++) {
      const at: number = on + ((off - on) * i) / 6;
      const point: IAutoMovieTransform = take.part(name, at);
      const hand: IAutoMovieVector3 = contact(at);
      touched.push(hand);
      TestValidator.predicate(
        `the hold meets ${name} at ${at}`,
        Math.abs(
          Vector3.dot(
            Vector3.subtract(hand, point.translation),
            Quaternion.rotateVector(point.rotation, { x: 0, y: 1, z: 0 }),
          ) - radius,
        ) <= CONTACT,
      );
    }
    for (const at of [overlay.start, overlay.end])
      TestValidator.predicate(
        `the hold is off ${name} at ${at}`,
        Vector3.distance(contact(at), take.part(name, at).translation) > 0.03,
      );
    return touched;
  };

  // 1. Lead-in.
  const lead: Take.ITake = Take.take(body, "groomLeft", "lead");
  assertTakeClean("equestrian lead-in", lead.film);
  const leading: IAutoMovieMotionHumanSegment = lead.film
    .overlays("handler")
    .find((overlay: IAutoMovieMotionHumanSegment): boolean =>
      overlay.name.startsWith("leadHorse"),
    )!;
  const leadWindow: IAutoMovieMotionHumanContactWindow =
    leading.plan.contacts.find(
      (contact: IAutoMovieMotionHumanContactWindow): boolean =>
        contact.part === "rightHand",
    )!;
  const span: number = leading.end - leading.start;
  const leadOn: number = leading.start + leadWindow.from * span;
  const leadOff: number = leading.start + leadWindow.to * span;
  const rope: number =
    (lead.affordances.find(
      (a: IAutoMovieAffordance): boolean => a.id === "lead",
    )!.aperture ?? 0) / 2;
  for (let i: number = 1; i < 8; i++) {
    const at: number = leadOn + ((leadOff - leadOn) * i) / 8;
    const frame: IAutoMovieTransform = lead.part("lead", at);
    TestValidator.predicate(
      `the palm holds the lead at ${at}`,
      Vector3.distance(
        shown(lead.film, at),
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
      lead.part("lead", leadOn).translation,
      lead.part("lead", leadOff).translation,
    ) > 1.5,
  );

  // 2. Brush.
  const brush: Take.ITake = Take.take(body, "groomLeft", "brush");
  assertTakeClean("equestrian brush", brush.film);
  const bristles = (at: number): IAutoMovieVector3 => {
    const frame: IAutoMovieRigidTransform = brush.film.prop("brush", at);
    return Vector3.add(
      frame.position,
      Quaternion.rotateVector(
        frame.rotation,
        Take.BRUSH.affordance("face").frame.translation,
      ),
    );
  };
  const stroke: IAutoMovieVector3[] = holds(brush, "groomLeft", bristles);
  TestValidator.predicate(
    "the brush strokes along the coat",
    Math.max(
      ...stroke.map((p: IAutoMovieVector3): number =>
        Vector3.distance(p, stroke[0]!),
      ),
    ) > 0.2,
  );
  let caught: unknown = null;
  try {
    const far: Take.ITake = Take.take(body, "groomRight", "brush");
    const reach: IAutoMovieMotionHumanSegment = caring(far.film)[0]!;
    far.film.bones("handler", (reach.start + reach.end) / 2);
  } catch (error) {
    caught = error;
  }
  TestValidator.predicate(
    "a far-side brush refuses as out of reach",
    caught instanceof HumanRefusal && caught.axis === "careReach",
  );

  // 3. Headgear.
  const headgear: Take.ITake = Take.take(body, "groomLeft", "headgear");
  assertTakeClean("equestrian headgear", headgear.film);
  const halter: readonly IAutoMovieMotionHumanSegment[] = exchange(
    headgear.film,
  );
  TestValidator.predicate(
    "the halter waits on its hook",
    Vector3.distance(
      headgear.film.prop("halter", halter[0]!.start).position,
      headgear.hook,
    ) <= 1e-6,
  );
  const carried: number = (halter[0]!.end + halter[1]!.start) / 2;
  const held: IAutoMovieRigidTransform = headgear.film.prop("halter", carried);
  TestValidator.predicate(
    "the carried halter rides the hand by its grip",
    Vector3.distance(
      Vector3.add(
        held.position,
        Quaternion.rotateVector(
          held.rotation,
          headgear.halter.affordance("grip").frame.translation,
        ),
      ),
      shown(headgear.film, carried),
    ) <= 0.06,
  );
  for (const at of [halter[1]!.end, halter[1]!.end + 0.9])
    TestValidator.predicate(
      `the halter rides the head at ${at}`,
      Vector3.distance(
        headgear.film.prop("halter", at).position,
        headgear.part("headgear", at).translation,
      ) <= 1e-3,
    );

  // 4. Saddle.
  const saddle: Take.ITake = Take.take(body, "groomLeft", "saddle");
  assertTakeClean("equestrian saddle", saddle.film);
  const laid: readonly IAutoMovieMotionHumanSegment[] = exchange(saddle.film);
  TestValidator.predicate(
    "the saddle waits on its rack",
    Vector3.distance(
      saddle.film.prop("saddle", laid[0]!.start).position,
      saddle.rack,
    ) <= 1e-6,
  );
  for (const at of [laid[1]!.end, laid[1]!.end + 0.9])
    TestValidator.predicate(
      `the saddle rides the back at ${at}`,
      Vector3.distance(
        saddle.film.prop("saddle", at).position,
        saddle.part("saddle", at).translation,
      ) <= 1e-3,
    );

  // 5. Hoof.
  const hoof: Take.ITake = Take.take(body, "groomLeft", "hoof");
  assertTakeClean("equestrian hoof", hoof.film);
  holds(
    hoof,
    "leftForeHoof",
    (at: number): IAutoMovieVector3 => shown(hoof.film, at),
  );
  const lifted: IAutoMovieMotionHumanSegment = caring(hoof.film)[0]!;
  const middle: number = (lifted.start + lifted.end) / 2;
  TestValidator.predicate(
    "the held hoof is off the floor",
    hoof.part("leftForeHoof", middle).translation.y > 0.15,
  );
  const again: Take.ITake = Take.take(body, "groomLeft", "hoof");
  for (const at of [lifted.end + 0.5, lifted.end + 2.2, middle])
    TestValidator.equals(
      `the horse replays at ${at}`,
      JSON.stringify(again.horse(at).archetype.parts),
      JSON.stringify(hoof.horse(at).archetype.parts),
    );
}
