import { AutoMovieGravity, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanMedium,
  IAutoMovieMotionHumanSegment,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanRide,
  HumanChain,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { HumanWater } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/** The two feet. */
const SIDES: readonly AutoMovieHumanSide[] = ["left", "right"];

/** The established planted-contact tolerance of the gait tests, metres. */
const SLIP: number = 0.02;

/** The walk's world target from the origin, metres. */
const TARGET: IAutoMovieVector3 = { x: 0, y: 0, z: 4 };

/** A body key of the shared canonical bodies. */
type BodyKey = "m-average" | "f-small";

/**
 * A walk adapts to the medium it crosses: unchanged on rigid ground,
 * slowed and arms raised in water, sinking and lifting clear in snow, held
 * in mud, and leaning into a steady wind.
 *
 * Scenarios, on the average man and the small woman:
 * 1. Without a medium or wind the walk equals the plain walk.
 * 2. Wading hip-deep, the walk is as much slower as the immersed drag
 *    (`HumanWater.sum`) against the 1.2 m measurement says, and the
 *    wrists stay above the surface.
 * 3. Water above the chest is refused.
 * 4. In snow each planted ankle bears on the firm ground under the layer,
 *    each swing clears the snow's surface, and the walk takes more steps and longer than on
 *    rigid ground; a steady side wind leans the trunk by `atan(F/(m g))`.
 * 5. A stuck foot in mud stays sunk for the hold after its plant ends.
 * 6. A gust after the walk produces a capture step through the existing
 *    perturbation, and a steady wind beyond the feet's static balance is
 *    refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the media, bodies and checked quantities.
 * @evidence contracts/development/testing.md#behavioral-verification Reads displayed ankles, wrists, pelvis and trunk, and the plans' durations and plant windows.
 * @evidence contracts/development/testing.md#independent-expectations The plain walk, the immersed drag model with Fantozzi et al.'s 40 % slower walk at 1.2 m, the ground and medium depths, and the static moment balance give the expectations.
 * @evidence contracts/development/testing.md#distinguishing-cases Rigid ground against water, snow and mud, shallow against over-deep water, admitted against refused wind, two bodies.
 * @evidence contracts/development/testing.md#execution-ownership In-memory Human performances; no host.
 */
export function test_motion_gait_medium_walk(): void {
  const failures: string[] = [];
  for (const key of ["m-average", "f-small"] as const) mediums(key, failures);
  TestValidator.equals("medium walks", failures, []);
}

/** One body's walks across the media. */
function mediums(key: BodyKey, failures: string[]): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody(key);
  const plain: HumanPerformance = perform(body, undefined, undefined, true);
  const rigid: HumanPerformance = perform(body, undefined, undefined);
  // Seeded variation is keyed by the action's name, so the two walks agree
  // in structure: the same plants, duration and arrival.
  const plantCount = (film: HumanPerformance): number =>
    film
      .segments("a")[0]!
      .plan.contacts.filter(
        (window: IAutoMovieMotionHumanContactWindow): boolean =>
          window.kind === "plant",
      ).length;
  if (
    plantCount(plain) !== plantCount(rigid) ||
    Math.abs(plain.duration / rigid.duration - 1) > 0.05 ||
    Vector3.distance(
      joint(plain, "hips", plain.duration),
      joint(rigid, "hips", rigid.duration),
    ) >
      3 * SLIP
  )
    failures.push(
      `${key}: the walk on rigid ground differs from the plain walk`,
    );

  // Wading at hip depth: slower by the drag ratio, the wrists above the water.
  const depth: number = body.measure.hipHeight * 1.1;
  const water: HumanPerformance = perform(body, { kind: "water", depth });
  const bones: ReturnType<HumanPerformance["bones"]> = plain.bones("a", 0);
  const drag = (level: number): number =>
    Vector3.length(
      HumanWater.sum(body, bones, { x: 0, y: 0, z: 1 }, { surface: level })
        .drag,
    );
  const expected: number = Math.min(
    1,
    0.6 * Math.sqrt(drag(1.2) / drag(depth)),
  );
  const measured: number = plain.duration / water.duration;
  if (Math.abs(measured / expected - 1) > 0.15)
    failures.push(
      `${key}: wading speed share ${measured.toFixed(3)} against the drag's ${expected.toFixed(3)}`,
    );
  for (const at of [water.duration * 0.4, water.duration * 0.6])
    for (const side of SIDES)
      if (joint(water, `${side}Hand`, at).y < depth)
        failures.push(
          `${key}: the ${side} wrist is under the water at ${at.toFixed(2)} s`,
        );
  clean(`${key} water`, water, failures);
  let refusal: unknown;
  try {
    perform(body, { kind: "water", depth: body.measure.chestHeight + 0.1 });
  } catch (error) {
    refusal = error;
  }
  if (!(refusal instanceof HumanRefusal && refusal.axis === "medium.depth"))
    failures.push(`${key}: water above the chest is not refused`);

  // Snow in a side wind: sunk stances, clear swings, more and slower steps, a lean.
  const snow: number = 0.25;
  const force: number = 40;
  const trudge: HumanPerformance = perform(
    body,
    { kind: "snow", depth: snow },
    { x: force, y: 0, z: 0 },
  );
  // The same walk at the snow's pace on rigid ground: the depth's baseline.
  const paced: HumanPerformance = new HumanPerformance({
    seed: "medium walk",
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("a").walk({
      to: TARGET,
      manner: { pace: 1 / Math.sqrt(1 + 13 * snow) },
    }).node,
  });
  clean(`${key} snow`, trudge, failures);
  const segment: IAutoMovieMotionHumanSegment = trudge.segments("a")[0]!;
  const plants: readonly IAutoMovieMotionHumanContactWindow[] =
    segment.plan.contacts.filter(
      (window: IAutoMovieMotionHumanContactWindow): boolean =>
        window.kind === "plant",
    );
  const rigidPlants: number = rigid
    .segments("a")[0]!
    .plan.contacts.filter(
      (window: IAutoMovieMotionHumanContactWindow): boolean =>
        window.kind === "plant",
    ).length;
  if (!(plants.length > rigidPlants && trudge.duration > rigid.duration))
    failures.push(
      `${key}: snow does not take more and slower steps (${plants.length} vs ${rigidPlants})`,
    );
  for (const window of plants) {
    const side: AutoMovieHumanSide =
      window.part === "leftFoot" ? "left" : "right";
    const middle: number =
      segment.start + ((window.from + window.to) / 2) * segment.plan.duration;
    const sunk: number = ankle(trudge, side, middle).y - planted(paced);
    if (Math.abs(sunk) > SLIP)
      failures.push(
        `${key}: the planted ${side} ankle is ${sunk.toFixed(3)} m off the firm ground under the snow`,
      );
  }
  for (const side of SIDES) {
    let highest: number = -Infinity;
    for (let at: number = 0.2; at < trudge.duration - 0.2; at += 0.02)
      highest = Math.max(
        highest,
        ankle(trudge, side, at).y - body.measure.ankleHeight,
      );
    if (highest < snow)
      failures.push(`${key}: the ${side} foot never clears the snow's surface`);
  }
  const lean: number = Math.atan(
    force / (body.profile.mass * AutoMovieGravity.STANDARD),
  );
  const tilt = (film: HumanPerformance): number => {
    let sum: number = 0;
    let count: number = 0;
    for (let at: number = 0.3; at < film.duration - 0.3; at += 0.05) {
      const trunk: IAutoMovieVector3 = Vector3.subtract(
        joint(film, "neck", at),
        joint(film, "hips", at),
      );
      sum += Math.atan2(trunk.x, trunk.y);
      count += 1;
    }
    return sum / count;
  };
  const calm: HumanPerformance = perform(body, { kind: "snow", depth: snow });
  const leaned: number = tilt(calm) - tilt(trudge);
  if (Math.abs(leaned - lean) > 2 * (Math.PI / 180))
    failures.push(
      `${key}: the trunk leans ${((leaned * 180) / Math.PI).toFixed(2)} deg into a wind that balances at ${((lean * 180) / Math.PI).toFixed(2)} deg`,
    );

  // Mud: the foot stays sunk through the hold after its plant ends.
  const hold: number = 0.3;
  const mud: HumanPerformance = perform(body, {
    kind: "mud",
    depth: 0.1,
    hold,
  });
  clean(`${key} mud`, mud, failures);
  const muddy: IAutoMovieMotionHumanSegment = mud.segments("a")[0]!;
  const first: IAutoMovieMotionHumanContactWindow | undefined =
    muddy.plan.contacts.find(
      (window: IAutoMovieMotionHumanContactWindow): boolean =>
        window.kind === "plant" && window.to < 0.9,
    );
  if (first !== undefined) {
    const side: AutoMovieHumanSide =
      first.part === "leftFoot" ? "left" : "right";
    const off: number = muddy.start + first.to * muddy.plan.duration - hold;
    const stuck: number = Vector3.distance(
      ankle(mud, side, off + hold / 2),
      ankle(mud, side, off),
    );
    if (Math.abs(stuck) > SLIP)
      failures.push(
        `${key}: the stuck ${side} foot moves ${stuck.toFixed(3)} m during the hold`,
      );
  }
  // A gust beyond what the lean balances: the existing perturbation takes a
  // capture step after the walk into the steady wind.
  // The perturbation reads impulses only, not the steady wind the lean
  // balances, so the gust follows a breeze light for this body.
  const steady: IAutoMovieVector3 = {
    x: 0.05 * body.profile.mass * AutoMovieGravity.STANDARD,
    y: 0,
    z: 0,
  };
  const walked: number = perform(body, undefined, steady).duration;
  // The step band depends on the body and the walk's end velocity, so the
  // gust is the first of a ladder of speeds the perturbation steps for.
  const gusted = (speed: number): HumanPerformance =>
    new HumanPerformance({
      seed: "medium walk",
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      laws: [AutoMovieMotionHumanRide.HumanSurface.mediumWalk],
      forces: [
        {
          kind: "impulse",
          subject: "a",
          at: "sternum",
          seconds: walked - 0.05,
          impulse: { x: 0, y: 0, z: -speed * body.profile.mass },
        },
      ],
      composition: HumanChain.subject("a")
        .registered("mediumWalk", { to: TARGET, wind: steady })
        .perturb({ outcome: "step" }).node,
    });
  let gust: HumanPerformance | undefined;
  for (let speed: number = 0.6; speed <= 1.0; speed += 0.02) {
    try {
      gust = gusted(speed);
      gust.duration;
      break;
    } catch (error) {
      if (!(error instanceof HumanRefusal && error.axis === "outcome"))
        throw error;
      gust = undefined;
    }
  }
  if (gust === undefined) {
    failures.push(`${key}: no gust in the ladder produces a capture step`);
    return;
  }
  const caught: IAutoMovieMotionHumanSegment | undefined = gust
    .segments("a")
    .find(
      (segment: IAutoMovieMotionHumanSegment): boolean =>
        segment.name === "perturb",
    );
  const stepped: number =
    caught === undefined
      ? 0
      : Math.max(
          ...SIDES.map((side: AutoMovieHumanSide): number =>
            Vector3.distance(
              ankle(gust, side, caught.start),
              ankle(gust, side, caught.start + caught.plan.duration),
            ),
          ),
        );
  if (!(stepped > 0.1))
    failures.push(
      `${key}: the gust does not produce a capture step (${stepped.toFixed(3)} m)`,
    );
  let gale: unknown;
  try {
    perform(body, undefined, {
      x: body.profile.mass * AutoMovieGravity.STANDARD,
      y: 0,
      z: 0,
    });
  } catch (error) {
    gale = error;
  }
  if (!(gale instanceof HumanRefusal && gale.axis === "wind"))
    failures.push(`${key}: a wind beyond static balance is not refused`);
}

/** One walk from the origin to the target, through a medium and wind or as the plain walk. */
function perform(
  body: IAutoMovieMotionHumanBody,
  medium?: IAutoMovieMotionHumanMedium.IMedium,
  wind?: IAutoMovieVector3,
  plain: boolean = false,
): HumanPerformance {
  return new HumanPerformance({
    seed: "medium walk",
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    laws: [AutoMovieMotionHumanRide.HumanSurface.mediumWalk],
    composition: plain
      ? HumanChain.subject("a").walk({ to: TARGET }).node
      : HumanChain.subject("a").registered("mediumWalk", {
          to: TARGET,
          ...(medium === undefined ? {} : { medium }),
          ...(wind === undefined ? {} : { wind }),
        }).node,
  });
}

/** The mean height of the displayed ankles at the middle of each inner plant. */
function planted(film: HumanPerformance): number {
  const segment: IAutoMovieMotionHumanSegment = film.segments("a")[0]!;
  const heights: number[] = segment.plan.contacts
    .filter(
      (window: IAutoMovieMotionHumanContactWindow): boolean =>
        window.kind === "plant" && window.from > 0 && window.to < 1,
    )
    .map(
      (window: IAutoMovieMotionHumanContactWindow): number =>
        ankle(
          film,
          window.part === "leftFoot" ? "left" : "right",
          segment.start +
            ((window.from + window.to) / 2) * segment.plan.duration,
        ).y,
    );
  return (
    heights.reduce((a: number, b: number): number => a + b, 0) / heights.length
  );
}

/** The displayed ankle of one foot. */
function ankle(
  film: HumanPerformance,
  side: AutoMovieHumanSide,
  at: number,
): IAutoMovieVector3 {
  return joint(film, `${side}Foot`, at);
}

/** A displayed joint. */
function joint(
  film: HumanPerformance,
  bone: Parameters<ReturnType<HumanPerformance["bones"]>["get"]>[0],
  at: number,
): IAutoMovieVector3 {
  return film.bones("a", at).get(bone)!.worldPosition;
}

/**
 * The shipped take verdicts over a take, as a complaint.
 *
 * @param label What the take is.
 * @param take The take.
 * @param failures Where a fault is recorded.
 */
function clean(
  label: string,
  take: HumanPerformance,
  failures: string[],
): void {
  try {
    assertTakeClean(label, take);
  } catch (error) {
    failures.push(error instanceof Error ? error.message : String(error));
  }
}
