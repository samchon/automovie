import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieModel,
  IAutoMovieMotionHumanPropFlight,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanSignature,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanSignature } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { PlaygroundBodies } from "../../src/playground/package/PlaygroundBodies";
import { PlaygroundPerformance } from "../../src/playground/package/PlaygroundPerformance";
import type { IPlaygroundComposition } from "../../src/playground/structures/IPlaygroundComposition";
import { SceneTake } from "../../src/scenes/SceneTake";
import { SCENES_FIELD } from "../../src/scenes/data/SCENES_FIELD";
import { SCENES_GAMES } from "../../src/scenes/data/SCENES_GAMES";
import { SCENES_PARTNER } from "../../src/scenes/data/SCENES_PARTNER";
import { SceneArchetype } from "../../src/scenes/package/SceneArchetype";
import type { IScene } from "../../src/scenes/structures/IScene";

/**
 * Every published exercise take plays through the gallery's take overrides
 * and the composition adapter shared with the playground.
 *
 * Scenarios:
 * 1. One basketball is passed, caught and shot during the live contest.
 * 2. Both judoka enter together and the receiver reaches the mat.
 * 3. The wrestling cast avoids joint intrusion beyond the 10 mm skin
 *    allowance at 30 Hz and at authored events, then returns upright.
 * 4. A held racket returns the one shared tennis ball.
 * 5. All five swimmers share the level of the drawn water.
 * 6. The two apparatus scenes land on their authored mats.
 * 7. The martial forms plan for every published cast.
 */
export function test_website_exercise_scenes(): void {
  const scenes: readonly IScene[] = [
    ...SCENES_FIELD,
    ...SCENES_GAMES,
    ...SCENES_PARTNER,
  ];
  const findings: string[] = [];
  for (const [id, check] of [
    ["shoot-around", checkPass],
    ["judo-randori", checkThrow],
    ["wrestling-reset", checkReset],
    ["tennis-rally", checkTennis],
    ["swim-strokes", checkSwim],
    ["vault-hall", checkLanding],
    ["high-jump", checkLanding],
    ["martial-forms", undefined],
  ] as const) {
    const scene: IScene | undefined = scenes.find(
      (entry: IScene): boolean => entry.id === id,
    );
    if (
      scene === undefined ||
      scene.composition === null ||
      scene.takes.length === 0
    ) {
      findings.push(`${id} has no published takes`);
      continue;
    }
    if (scene.refusedUntil !== undefined)
      findings.push(
        `${id} still declares a refusal until #${scene.refusedUntil}`,
      );
    for (const take of scene.takes) {
      try {
        const authored: IPlaygroundComposition = SceneTake.apply(
          scene.composition,
          take,
        );
        const built: PlaygroundPerformance.IBuilt =
          PlaygroundPerformance.build(authored);
        check?.(built, authored);
      } catch (error) {
        findings.push(
          `${id}, ${take.label}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }
  TestValidator.equals("all published exercise takes play", findings, []);
}

/** The transferred ball leaves the receiver's hands during the contest. */
function checkPass(
  { performance: court }: PlaygroundPerformance.IBuilt,
  authored: IPlaygroundComposition,
): void {
  const hoop: IPlaygroundComposition.IObject | undefined =
    authored.objects?.find(
      (object: IPlaygroundComposition.IObject): boolean =>
        object.producer === "createGoal" && object.kind === "basketballHoop",
    );
  TestValidator.predicate(
    "the scene has a basketball hoop",
    hoop !== undefined,
  );
  const flights: readonly IAutoMovieMotionHumanPropFlight.IFlight[] =
    court.flights("ball");
  TestValidator.predicate(
    "the pass is followed by a shot",
    flights.length >= 2,
  );
  const [flight, shot] = flights as readonly [
    IAutoMovieMotionHumanPropFlight.IFlight,
    IAutoMovieMotionHumanPropFlight.IFlight,
  ];
  TestValidator.predicate(
    "the receiver secures the pass after release",
    flight.capturedAt !== undefined && flight.capturedAt > flight.launch,
  );
  const position: IAutoMovieVector3 = court.prop(
    "ball",
    flight.capturedAt!,
  ).position;
  TestValidator.predicate(
    "the ball reaches the receiver's side of the court",
    position.z > 3 && position.z < 4,
  );
  const contest: IAutoMovieMotionHumanSegment | undefined = court
    .segments("eli")
    .find(
      (segment: IAutoMovieMotionHumanSegment): boolean =>
        (segment.params as { kind?: string }).kind === "highHandContest",
    );
  const stroke: number | undefined = contest?.plan.events.find(
    (event): boolean => event.name === "stroke",
  )?.share;
  TestValidator.predicate(
    "the second flight releases the same ball while the defender contests it",
    contest !== undefined &&
      stroke !== undefined &&
      shot.source.subject === "fen" &&
      shot.launch > flight.capturedAt! &&
      Math.abs(shot.launch - contest.start - stroke * contest.plan.duration) <
        1e-6,
  );
  const arrival: number =
    shot.launch +
    (shot.source.params as { flightSeconds: number }).flightSeconds;
  // Opposite ring rods give the centre of the rendered opening.
  const ring: IAutoMovieModel["parts"] = (
    SceneArchetype.model(hoop!) as IAutoMovieModel
  ).parts.filter((part): boolean => part.id.startsWith("ring-"));
  const local: IAutoMovieVector3 = Vector3.scale(
    Vector3.add(
      ring[0]!.transform!.translation,
      ring[ring.length / 2]!.transform!.translation,
    ),
    0.5,
  );
  const frame: IAutoMovieRigidTransform = court.prop(hoop!.subject, arrival);
  const rim: IAutoMovieVector3 = Vector3.add(
    frame.position,
    Quaternion.rotateVector(frame.rotation, local),
  );
  const centre = (seconds: number): IAutoMovieVector3 => {
    const shown: IAutoMovieRigidTransform = court.prop("ball", seconds);
    return Vector3.add(
      shown.position,
      Quaternion.rotateVector(shown.rotation, shot.published.sphere!.centre),
    );
  };
  const through: IAutoMovieVector3 = centre(arrival);
  TestValidator.predicate(
    "the displayed ball descends through the measured rim centre",
    arrival <= court.duration &&
      Vector3.distance(through, rim) <= 0.03 &&
      centre(arrival - 1 / 60).y > through.y,
  );
}

/** Rackets are staged and a single tennis ball follows a placed stroke. */
function checkTennis(
  { performance: rally }: PlaygroundPerformance.IBuilt,
  authored: IPlaygroundComposition,
): void {
  const objects: readonly IPlaygroundComposition.IObject[] =
    authored.objects ?? [];
  const balls: IPlaygroundComposition.IObject[] = objects.filter(
    (object: IPlaygroundComposition.IObject): boolean =>
      object.producer === "createBall",
  );
  const rackets: IPlaygroundComposition.IObject[] = objects.filter(
    (object: IPlaygroundComposition.IObject): boolean =>
      object.producer === "createRacket",
  );
  TestValidator.equals("one shared rally ball", balls.length, 1);
  TestValidator.equals("two staged rackets", rackets.length, 2);
  const held: Set<string> = new Set(
    authored.performers.flatMap((performer): string[] =>
      rally
        .segments(performer.subject)
        .flatMap((segment): string[] =>
          (segment.plan.holds ?? []).map((hold): string => hold.prop),
        ),
    ),
  );
  TestValidator.predicate(
    "each visible racket is taken into a hand",
    rackets.every((racket): boolean => held.has(racket.subject)),
  );
  const flights: readonly IAutoMovieMotionHumanPropFlight.IFlight[] =
    rally.flights(balls[0]!.subject);
  TestValidator.equals("one feed and one racket return", flights.length, 2);
  const feed: IAutoMovieMotionHumanPropFlight.IFlight = flights[0]!;
  const returned: IAutoMovieMotionHumanPropFlight.IFlight = flights[1]!;
  TestValidator.predicate(
    "the held racket returns the same ball at the end of its feed",
    returned.source.name === "tennisForehandReturn" &&
      returned.source.subject !== feed.source.subject &&
      feed.supersededAt !== undefined &&
      Math.abs(feed.supersededAt - returned.launch) < 1e-6 &&
      returned.launch > feed.launch,
  );
}

/** Read the water plane through the same displayed prop used by the gallery. */
function checkSwim(
  { performance: pool }: PlaygroundPerformance.IBuilt,
  authored: IPlaygroundComposition,
): void {
  const surface: IPlaygroundComposition.IObject | undefined =
    authored.objects?.find(
      (object: IPlaygroundComposition.IObject): boolean =>
        object.producer === "createPoolWater",
    );
  TestValidator.predicate(
    "the pool has a visible water plane",
    surface !== undefined,
  );
  const height: number = pool.prop(surface!.subject, 0).position.y;
  for (const swimmer of authored.performers) {
    const stroke: IAutoMovieMotionHumanSegment = pool.segments(
      swimmer.subject,
    )[0]!;
    TestValidator.equals(
      `${swimmer.subject} reads the drawn water level`,
      (stroke.params as { water?: number }).water,
      height,
    );
  }
}

/** The landing mat supplies an actual support window to its athlete. */
function checkLanding(
  { performance: stage }: PlaygroundPerformance.IBuilt,
  authored: IPlaygroundComposition,
): void {
  const landing: IPlaygroundComposition.IObject | undefined =
    authored.objects?.find(
      (object: IPlaygroundComposition.IObject): boolean =>
        object.producer === "createLandingMat" ||
        object.producer === "createExerciseMat",
    );
  TestValidator.predicate(
    "the athlete has a landing mat",
    landing !== undefined,
  );
  TestValidator.predicate(
    "the mat bears a foot or back after touchdown",
    authored.performers.some((performer): boolean =>
      stage
        .segments(performer.subject)
        .some((segment): boolean =>
          segment.plan.contacts.some(
            (contact): boolean =>
              (contact.kind === "plant" || contact.kind === "lie") &&
              contact.support.kind === "prop" &&
              contact.support.subject === landing!.subject &&
              contact.from > 0 &&
              contact.to > contact.from,
          ),
        ),
    ),
  );
}

/** The paired throw starts together and lowers the receiver to the mat. */
function checkThrow({ performance: mat }: PlaygroundPerformance.IBuilt): void {
  const initiator: IAutoMovieMotionHumanSegment = mat
    .segments("tor")
    .find((segment) => segment.name === "grapple")!;
  const receiver: IAutoMovieMotionHumanSegment = mat
    .segments("uke")
    .find((segment) => segment.name === "grapple")!;
  TestValidator.predicate(
    "the roles start in sync",
    Math.abs(initiator.start - receiver.start) < 1e-6,
  );
  const standing: number = mat.bones("uke", 0).get("hips")!.worldPosition.y;
  const settled: number = mat.bones("uke", receiver.end).get("hips")!
    .worldPosition.y;
  TestValidator.predicate(
    "the receiver settles below half their standing hip height",
    settled < standing / 2,
  );
}

/** The wrestlers clear one another and return to their entry height. */
function checkReset({
  performance: reset,
  figures,
}: PlaygroundPerformance.IBuilt): void {
  const [red, blue]: IAutoMovieMotionHumanSignature.IReader[] = figures.map(
    (
      figure: PlaygroundPerformance.IFigure,
    ): IAutoMovieMotionHumanSignature.IReader =>
      HumanSignature.of(
        reset,
        figure.subject,
        PlaygroundBodies.get(figure.body).body,
        0,
      ),
  );
  const exchange: IAutoMovieMotionHumanSegment = reset.segments("red").at(-1)!;
  const seconds: Set<number> = new Set([
    ...HumanSignature.times(0, reset.duration, 30),
    ...exchange.plan.events.map(
      (event): number => exchange.start + event.share * exchange.plan.duration,
    ),
    reset.duration,
  ]);
  const clearance: number = Math.min(
    ...Array.from(seconds, (t: number): number =>
      HumanSignature.apart(red!, blue!, t),
    ),
  );
  TestValidator.predicate(
    `the wrestling pair has at most 10 mm joint intrusion (clearance ${clearance} m)`,
    clearance >= -0.01,
  );
  for (const actor of [red, blue]) {
    /** Height of the head above the hip joint, from a single sampled pose. */
    const height = (at: number): number => {
      const bones: ReturnType<typeof HumanSignature.bones> =
        HumanSignature.bones(actor!, at);
      return (
        bones.get("head")!.worldPosition.y - bones.get("hips")!.worldPosition.y
      );
    };
    TestValidator.predicate(
      "the wrestler recovers their upright head-to-hip height",
      Math.abs(height(reset.duration) - height(0)) <= 0.01,
    );
  }
}
