import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanSegment,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAcrobatics,
  AutoMovieMotionHumanThrowCatch,
  HumanChain,
  HumanPerformance,
} from "@automovie/motions";
import { HumanFoot } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/** The planted-contact bound, metres (the campaign's 5 mm). */
const PLANT: number = 0.005;

/**
 * Join a round-off and a back salto into one tumbling line.
 *
 * Scenarios, on two body proportions:
 * 1. The round-off's hands bear between `handsDown` and `feetDown`, and its
 *    feet land facing back where the line came from.
 * 2. Cut straight from the round-off's landing, the salto pushes off one of
 *    those landed feet: its toes' joint holds within 5 mm from the
 *    round-off's last instant to `takeoff`.
 * 3. In flight the body turns head below hips at the apex, and the salto
 *    lands further along the line, its feet within 0.1 m of the authored
 *    landing.
 * 4. The line keeps its direction: the landing lies beyond the round-off's.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the joined line, the support handovers and the bounds.
 * @evidence contracts/development/testing.md#behavioral-verification Composes round-off and back salto through the public chain and measures displayed feet, hips, head, events and contact windows.
 * @evidence contracts/development/testing.md#independent-expectations Hands then feet bear as a round-off's support order requires, a back salto inverts at its apex, the 5 mm is the campaign's planted bound and the landing place is authored.
 * @evidence contracts/development/testing.md#distinguishing-cases Two body proportions on the same line.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances on the shared Human fixture, without a render or external process.
 */
export function test_motion_acrobatics_tumbling_line(): void {
  for (const name of ["f-small", "m-average"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    const reach: number = body.measure.stature;
    const landing: IAutoMovieVector3 = { x: 0, y: 0, z: 2.2 * reach };
    const film: HumanPerformance = new HumanPerformance({
      seed: "tumbling-line",
      laws: [
        AutoMovieMotionHumanAcrobatics.HumanGymnastics.roundOffLeft,
        AutoMovieMotionHumanThrowCatch.HumanSportThrow.backSalto,
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
        .stand({ hold: 0.3, sway: 0 })
        .registered("roundOffLeft", {})
        .registered("backSalto", { to: landing }).node,
    });
    assertTakeClean("tumbling line", film);
    const [, round, salto]: readonly IAutoMovieMotionHumanSegment[] =
      film.segments("a");

    // 1. Hands, then feet facing back.
    const handsDown: number = when(round!, "handsDown");
    const feetDown: number = when(round!, "feetDown");
    const handWindow: boolean = (["leftHand", "rightHand"] as const).some(
      (part: IAutoMovieMotionHumanContactWindow["part"]): boolean =>
        round!.plan.contacts.some(
          (c: IAutoMovieMotionHumanContactWindow): boolean =>
            c.part === part &&
            round!.start + c.from * round!.plan.duration <= handsDown + 1e-6 &&
            round!.start + c.to * round!.plan.duration >= handsDown,
        ),
    );
    const facing: IAutoMovieVector3 = forward(film, feetDown + 0.05);
    const handsFirst: boolean = handsDown < feetDown;
    const facingBack: boolean = facing.z < -0.5;
    TestValidator.predicate(
      `${name} round-off bears on its hands and lands facing back`,
      handWindow && handsFirst && facingBack,
    );

    // 2. The salto takes off from the landed feet.
    const takeoff: number = when(salto!, "takeoff");
    // The jump pushes off the foot its first window plants; the other leaves.
    const push: IAutoMovieMotionHumanContactWindow | undefined =
      salto!.plan.contacts.find(
        (c: IAutoMovieMotionHumanContactWindow): boolean =>
          c.from === 0 && c.part.endsWith("Foot"),
      );
    const side: AutoMovieHumanSide =
      push?.part === "rightFoot" ? "right" : "left";
    const slip: number = Vector3.distance(
      mtp(film, body, round!.start + round!.plan.duration, side),
      mtp(film, body, takeoff - 1e-3, side),
    );
    TestValidator.predicate(
      `${name} salto pushes off the ${side} foot where the round-off landed it (${(slip * 1000).toFixed(1)} mm)`,
      push !== undefined && slip <= PLANT,
    );

    // 3. Inverted at the apex, landed at the place.
    const apex: number = when(salto!, "apex");
    const bones: ReturnType<HumanPerformance["bones"]> = film.bones("a", apex);
    const down: number = when(salto!, "touchdown");
    const feet: IAutoMovieVector3 = Vector3.lerp(
      film.bones("a", down + 1e-3).get("leftFoot")!.worldPosition,
      film.bones("a", down + 1e-3).get("rightFoot")!.worldPosition,
      0.5,
    );
    TestValidator.predicate(
      `${name} salto turns head below hips at its apex and lands at the place`,
      bones.get("head")!.worldPosition.y < bones.get("hips")!.worldPosition.y &&
        Math.hypot(feet.x - landing.x, feet.z - landing.z) <= 0.1,
    );

    // 4. The line keeps its direction.
    const rounded: IAutoMovieVector3 = film
      .bones("a", feetDown + 1e-3)
      .get("hips")!.worldPosition;
    TestValidator.predicate(
      `${name} lands further along the line than the round-off`,
      feet.z > rounded.z,
    );
  }
}

/** The absolute film second of a required event. */
function when(segment: IAutoMovieMotionHumanSegment, name: string): number {
  const event:
    | IAutoMovieMotionHumanSegment["plan"]["events"][number]
    | undefined = segment.plan.events.find(
    (
      candidate: IAutoMovieMotionHumanSegment["plan"]["events"][number],
    ): boolean => candidate.name === name,
  );
  if (event === undefined)
    throw new Error(segment.name + " has no " + name + " event");
  return segment.start + event.share * segment.plan.duration;
}

/** The hips' forward direction at a film second. */
function forward(film: HumanPerformance, time: number): IAutoMovieVector3 {
  const hips: IAutoMovieResolvedBone = film.bones("a", time).get("hips")!;
  return Quaternion.rotateVector(hips.worldRotation, { x: 0, y: 0, z: 1 });
}

/** A displayed toes' joint at a film second. */
function mtp(
  film: HumanPerformance,
  body: IAutoMovieMotionHumanBody,
  time: number,
  side: AutoMovieHumanSide,
): IAutoMovieVector3 {
  const foot: IAutoMovieResolvedBone = film
    .bones("a", time)
    .get(`${side}Foot`)!;
  return HumanFoot.point(body, side, "mtp", {
    ankle: foot.worldPosition,
    rotation: foot.worldRotation,
  });
}
