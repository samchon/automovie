import { createBall } from "@automovie/archetypes";
import {
  Quaternion,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  IAutoMovieMotionHumanAquatic,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanProp,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanSwim,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { motionHumanLaw } from "../../../features/internal/motionHumanLaw";
import { nclose } from "../../../features/internal/nclose";

/**
 * A defended polo shot and an artistic figure exercise different support patterns.
 *
 * Scenarios:
 * 1. The goalkeeper reverses ankle height order during the opposed eggbeater
 *    and reaches above the water with both hands to block.
 * 2. A portable ball staged at the attacker's entered grip keeps one prop
 *    identity through release and passes through the authored shot target.
 * 3. An artistic swimmer changes from supported back layout to an upright figure.
 * 4. An assisted flyer cannot list its own subject or the same base twice.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the independent support and release behaviors and their corresponding world observations.
 * @evidence contracts/development/testing.md#behavioral-verification Reads displayed joints, moving grip carry and prop flight through registered performances with an actual generated body and ball archetype.
 * @evidence contracts/development/testing.md#independent-expectations Sign reversal and orientation compare anatomical landmarks against each other or against gravity and water. The shot target comes from the authored scene. The one centimetre tolerance measures prop track continuity near release and error at the target plane; it neither checks grip skin coverage nor simulates the impact.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers the two-handed goalkeeper, the attacker's release, the artistic figure and invalid flyer's bases. A full team lift and keeper interception need additional checks.
 * @evidence contracts/development/testing.md#execution-ownership Runs only in-memory public pose and prop sampling; no viewer or foreign motion implementation.
 */
export function test_motion_swim_aquatic_team(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const water: number = 0;
  const metres: number = 0.01;
  const stage = (
    params: IAutoMovieMotionHumanAquatic.IParams,
    props: readonly IAutoMovieMotionHumanProp[] = [],
    companions: readonly string[] = [],
  ): HumanPerformance =>
    new HumanPerformance({
      seed: "aquatic-team",
      laws: [AutoMovieMotionHumanSwim.aquatic],
      performers: ["athlete", ...companions].map(
        (
          subject: string,
        ): ConstructorParameters<
          typeof HumanPerformance
        >[0]["performers"][number] => ({
          subject,
          body,
          at: { x: 0, y: water, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        }),
      ),
      props: [...props],
      composition: HumanChain.subject("athlete").registered("aquatic", {
        ...params,
        water,
      }).node,
    });

  const keeper: motionHumanLaw.IFilm = motionHumanLaw.film(
    stage({ kind: "waterPolo", role: "keeper" }),
  );
  const draws: number = motionHumanLaw.event(keeper, "raise", "athlete");
  const block: number = motionHumanLaw.event(keeper, "block", "athlete");
  const lead: number[] = [];
  for (let i: number = 0; i <= 12; i++) {
    const bones: motionHumanLaw.Bones = keeper.bones(
      "athlete",
      (draws * i) / 12,
    );
    lead.push(
      bones.get("leftFoot")!.worldPosition.y -
        bones.get("rightFoot")!.worldPosition.y,
    );
  }
  const hands: motionHumanLaw.Bones = keeper.bones("athlete", block);
  TestValidator.predicate(
    "the two feet exchange vertical order under the surface",
    Math.min(...lead) < 0 && Math.max(...lead) > 0,
  );
  TestValidator.predicate(
    "both keeper hands reach higher than the crown joint at the block",
    Math.min(
      hands.get("leftHand")!.worldPosition.y,
      hands.get("rightHand")!.worldPosition.y,
    ) > Math.max(water, hands.get("head")!.worldPosition.y),
  );

  // Place a matching-size portable sphere at the displayed entered grip.
  // The ball subsequently follows the production's ordinary carry and launch.
  const unarmed: HumanPerformance = stage({
    kind: "waterPolo",
    role: "attack",
  });
  const ball: ReturnType<typeof createBall> = createBall(
    { kind: "football" },
    9,
  );
  const grip = body.surfaces.sockets.gripRight;
  const gripBone = unarmed.bones("athlete", 0).get(grip.bone)!;
  const hand = resolveAutoMovieHumanoidSurfaces.place(grip, gripBone);
  const radius: number = ball.dimensions.diameter! / 2;
  const launchProp: IAutoMovieMotionHumanProp = HumanObject.prop("ball", ball, {
    position: Vector3.add(hand.point, { x: 0, y: -radius, z: 0 }),
    rotation: Quaternion.identity(),
  });
  const target: IAutoMovieVector3 = { x: 0, y: water + 0.72, z: 3.5 };
  const attack: HumanPerformance = stage(
    { kind: "waterPolo", role: "attack", prop: "ball", at: target },
    [launchProp],
  );
  const shot: motionHumanLaw.IFilm = motionHumanLaw.film(attack);
  const release: number = motionHumanLaw.event(shot, "release", "athlete");
  const prior: IAutoMovieVector3 = attack.prop(
    "ball",
    release - 0.0001,
  ).position;
  const next: IAutoMovieVector3 = attack.prop(
    "ball",
    release + 0.0001,
  ).position;
  TestValidator.predicate(
    "one ball remains continuous when the hand releases it",
    attack.flights("ball").length === 1 &&
      Vector3.length(Vector3.subtract(prior, next)) < metres,
  );

  let low: number = release;
  let high: number = shot.duration;
  const downrange: number = attack.prop("ball", high).position.z;
  const flight: ReturnType<HumanPerformance["flights"]>[number] =
    attack.flights("ball")[0]!;
  TestValidator.predicate(
    `the ball moves downrange past the target plane (measured ${downrange.toFixed(4)} m, expected past ${target.z} m, release at ${flight.launch} s, first contact at ${flight.end} s)`,
    downrange > target.z,
  );
  for (let i: number = 0; i < 12; i++) {
    const t: number = (low + high) / 2;
    if (attack.prop("ball", t).position.z < target.z) low = t;
    else high = t;
  }
  const crossed: IAutoMovieVector3 = attack.prop(
    "ball",
    (low + high) / 2,
  ).position;
  TestValidator.predicate(
    "the prop reaches the authored target in the flight",
    nclose(crossed.x, target.x, metres) &&
      nclose(crossed.y, target.y, metres) &&
      nclose(crossed.z, target.z, metres),
  );

  const figure: motionHumanLaw.IFilm = motionHumanLaw.film(
    stage({ kind: "artisticSwim", role: "figure" }),
  );
  const spine = (name: string): IAutoMovieVector3 => {
    const bones: motionHumanLaw.Bones = figure.bones(
      "athlete",
      motionHumanLaw.event(figure, name, "athlete"),
    );
    return Vector3.subtract(
      bones.get("head")!.worldPosition,
      bones.get("hips")!.worldPosition,
    );
  };
  const laid: IAutoMovieVector3 = spine("flatScull");
  const upright: IAutoMovieVector3 = spine("figure");
  TestValidator.predicate(
    "the supported performer changes from lying across the surface to upright",
    Math.abs(laid.y) < Math.hypot(laid.x, laid.z) &&
      upright.y > Math.hypot(upright.x, upright.z),
  );

  for (const bases of [
    ["athlete", "base"],
    ["base", "base"],
  ] as const) {
    let refusal: unknown;
    try {
      stage({ kind: "artisticSwim", role: "flyer", bases }, [], ["base"]);
    } catch (error) {
      refusal = error;
    }
    TestValidator.predicate(
      `a flyer refuses bases ${bases.join(", ")}`,
      refusal instanceof HumanRefusal &&
        refusal.kind === "participant" &&
        refusal.axis === "bases",
    );
  }
}
