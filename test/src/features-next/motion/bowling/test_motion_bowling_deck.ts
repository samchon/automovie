import {
  createBall,
  createBowlingLane,
  createBowlingPin,
} from "@automovie/archetypes";
import {
  AutoMoviePhysicalPlayback,
  Quaternion,
  Vector3,
} from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrecisionDeck,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanStand,
  IAutoMoviePhysicalFrame,
  IAutoMoviePhysicalMaterial,
  IAutoMoviePhysicalPlayback,
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalSegmentState,
  IAutoMoviePhysicalShape,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanBilliards,
  AutoMovieMotionHumanBowling,
  AutoMovieMotionHumanStance,
  AutoMovieMotionHumanThrowCatch,
  HumanChain,
  HumanObject,
  HumanPerformance,
} from "@automovie/motions";
import { HumanHand } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { nclose } from "../../../features/internal/nclose";
import { qclose, vclose } from "../../../features/internal/predicates";
import { rigidProfile } from "../../../features/internal/rigidProfile";

/**
 * A released bowling ball crosses the real lane's pin deck, or rolls along
 * its lower gutter without disturbing the independently placed pins.
 *
 * Scenarios:
 * 1. A centre-line release gives the ball's actual impulse to the headpin.
 * 2. A parallel gutter release goes past the deck without hitting the rack.
 * 3. Read poses in both time orders and reject zero or over-budget bakes.
 * 4. Play the actor's loaded approach and slide, then feed the same released ball's
 *    handoff pose and velocity into the physical rack solve and reopen its
 *    issued playback with the archive reader used for a production.
 * 5. Read the headpin one solver interval before and after the impact in
 *    both orders, and credit the pinfall: the headpin is down after a
 *    strike, no pin is down after the gutter ball.
 *
 * USBC's headpin mark and rack geometry come from their equipment manual.
 * Start 1.4 m back at 4 m/s. Its ideal travel time to the headpin is 0.35 s
 * before allowing for radius, surface response and rolling. Bound first
 * contact to the second and third eighths of the first second. A change of
 * 25 cm and a tilt of 18 degrees distinguish a struck pin from millimetre
 * settling. These are film witness bounds with authored material values,
 * separate from measurements of a regulation bowling alley.
 * The moving delivery releases roughly 19 m from the rack. It must contact
 * after travelling down the lane and still move the headpin within the
 * authored four-second cache.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the lane, shapes, hit and miss cases, native time, tolerances and stated fixture approximation.
 * @evidence contracts/development/testing.md#behavioral-verification Uses createBowlingLane, createBowlingPin and AutoMovieMotionHumanBilliards.bakePrecisionDeck through SDK entry points. Reads solver contact, ball velocity and actual independent pin and ball transforms.
 * @evidence contracts/development/testing.md#independent-expectations USBC locates the headpin at 18.288 m. The fixture sets 1.4 m distance, 4 m/s initial linear speed and a separate filmed clock. Angular and spatial thresholds distinguish a tumbling pin from a nearly upright untouched pin.
 * @evidence contracts/development/testing.md#distinguishing-cases Parallel trajectories start at their respective support heights. The gutter must travel far enough to miss the actual rack, and the centre line must continue through a real contact.
 * @evidence contracts/development/testing.md#execution-ownership Uses the actual in-process solver and its replay cache, with no rendered scene or external host.
 */
export async function test_motion_bowling_deck(): Promise<void> {
  const lane: ReturnType<typeof createBowlingLane> = createBowlingLane();
  const pin: ReturnType<typeof createBowlingPin> = createBowlingPin();
  const ball: ReturnType<typeof createBall> = createBall({ kind: "bowling" });
  const rest: IAutoMovieRigidTransform = {
    position: { x: 0, y: 0, z: 0 },
    rotation: Quaternion.identity(),
  };
  const material: IAutoMoviePhysicalMaterial = {
    id: "fixture",
    friction: 0.3,
    restitution: 0.1,
    compliance: 0,
    damping: 0,
  };
  const profile = (
    model: Parameters<typeof rigidProfile>[0],
    id: string,
  ): IAutoMoviePhysicalProfile => rigidProfile(model, id, material);

  const sphere: IAutoMoviePhysicalShape = ball.shapes()[0]!;
  if (sphere.kind !== "sphere")
    throw new Error("Expected one bowling ball sphere");
  const centreOf = (pose: IAutoMovieRigidTransform): IAutoMovieVector3 =>
    Vector3.add(
      pose.position,
      Quaternion.rotateVector(pose.rotation, sphere.transform.position),
    );
  const head: IAutoMovieVector3 = lane.affordance("pin1").frame.translation;
  const gutter: IAutoMovieVector3 =
    lane.affordance("leftGutter").frame.translation;
  const duration: number = 0.8;
  const release: number = 2;
  const speed: number = 4;
  const pinProfile: IAutoMoviePhysicalProfile = profile(pin, "pin");
  const ballProfile: IAutoMoviePhysicalProfile = profile(ball, "ball");
  const laneProfile: IAutoMoviePhysicalProfile = profile(lane, "lane");
  const input = (
    x: number,
    elevation: number,
  ): IAutoMovieMotionHumanPrecisionDeck => ({
    release,
    duration,
    maximumSteps: 480,
    surface: { id: "lane", profile: laneProfile, pose: rest },
    ball: {
      id: "ball",
      profile: ballProfile,
      pose: {
        ...rest,
        position: {
          x: x - sphere.transform.position.x,
          y: elevation + sphere.radius - sphere.transform.position.y,
          z: head.z - 1.4 - sphere.transform.position.z,
        },
      },
      velocity: { x: 0, y: 0, z: speed },
    },
    targets: createBowlingLane.PINS.map(
      (id): IAutoMovieMotionHumanPrecisionDeck.IRigid => ({
        id,
        profile: pinProfile,
        pose: { ...rest, position: lane.affordance(id).frame.translation },
      }),
    ),
    floor: -0.25,
    floorBounds: {
      min: { x: -3, z: -5 },
      max: { x: 3, z: 27 },
      thickness: 1,
    },
  });

  const hit: IAutoMovieMotionHumanPrecisionDeck.IResult =
    await AutoMovieMotionHumanBilliards.bakePrecisionDeck(input(0, 0));
  const miss: IAutoMovieMotionHumanPrecisionDeck.IResult =
    await AutoMovieMotionHumanBilliards.bakePrecisionDeck(
      input(gutter.x, gutter.y),
    );
  const final: IAutoMoviePhysicalFrame = hit.cache.at(duration);
  const finalMiss: IAutoMoviePhysicalFrame = miss.cache.at(duration);
  const endPin: IAutoMovieRigidTransform = final.bodies.pin1!.root!;
  const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
  TestValidator.predicate(
    "the ball leaves with the authored velocity and records a headpin impact",
    nclose(hit.cache.at(0).bodies.ball!.root!.velocity.z, speed, 1e-5) &&
      hit.firstTarget?.id === "pin1" &&
      hit.firstTarget.seconds > release + 0.25 &&
      hit.firstTarget.seconds < release + 0.5 &&
      hit.cache.contacts.some((contact): boolean => {
        const pair: readonly string[] = [contact.a.body, contact.b.body];
        return (
          pair.includes("ball") &&
          pair.includes("pin1") &&
          contact.source === "solver" &&
          (contact.impulse ?? 0) > 0
        );
      }),
  );
  TestValidator.predicate(
    "the struck pin moves and tilts while the gutter leaves all ten pins in place",
    vclose(hit.cache.at(0.2).bodies.pin1!.root!.position, head, 0.002) &&
      Vector3.distance(endPin.position, head) > 0.25 &&
      Quaternion.rotateVector(endPin.rotation, up).y < Math.cos(Math.PI / 10) &&
      miss.firstTarget === undefined &&
      finalMiss.bodies.ball!.root!.position.z > head.z &&
      createBowlingLane.PINS.every((id): boolean => {
        const pose: IAutoMovieRigidTransform = finalMiss.bodies[id]!.root!;
        return (
          vclose(pose.position, lane.affordance(id).frame.translation, 0.002) &&
          qclose(pose.rotation, rest.rotation, 0.002)
        );
      }),
  );
  const earlier: IAutoMoviePhysicalFrame = hit.cache.at(0.35);
  hit.cache.at(duration);
  const sought: IAutoMoviePhysicalFrame = hit.cache.at(0.35);
  TestValidator.predicate(
    "seeking backward reads the same ball and pin frames",
    ["ball", ...createBowlingLane.PINS].every(
      (id): boolean =>
        vclose(
          earlier.bodies[id]!.root!.position,
          sought.bodies[id]!.root!.position,
          1e-6,
        ) &&
        qclose(
          earlier.bodies[id]!.root!.rotation,
          sought.bodies[id]!.root!.rotation,
          1e-6,
        ),
    ),
  );

  for (const invalid of [
    { ...input(0, 0), duration: 0 },
    { ...input(0, 0), maximumSteps: 95 },
  ]) {
    let refusal: unknown;
    try {
      await AutoMovieMotionHumanBilliards.bakePrecisionDeck(invalid);
    } catch (error: unknown) {
      refusal = error;
    }
    TestValidator.predicate(
      "an invalid or over-budget pin-deck bake refuses at its time boundary",
      refusal instanceof RangeError &&
        refusal.message.startsWith("Deck duration"),
    );
  }

  const subject: string = "bowler";
  const body: ReturnType<typeof motionHumanBody> = motionHumanBody("m-average");
  const approach: IAutoMovieVector3 = { x: 0.25, y: 0, z: -3.5 };
  const line: IAutoMovieVector3 = { ...approach, z: -1 };
  const performers: IAutoMovieMotionHumanPerformance.IInput["performers"] = [
    {
      subject,
      body,
      at: approach,
      yaw: 0,
      proficiency: { level: "trained" },
    },
  ];
  // The scene opens with the ball supported in front of the torso.
  const holdingStand = (
    holding: boolean,
  ): IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanStand.IParams> => ({
    ...AutoMovieMotionHumanStance.stand,
    name: holding ? "bowlingFixtureHold" : "bowlingFixtureAddress",
    plan: (
      context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanStand.IParams>,
    ): IAutoMovieMotionHumanActionPlan => {
      const stationary: IAutoMovieMotionHumanActionPlan =
        AutoMovieMotionHumanStance.stand.plan(context);
      return {
        ...stationary,
        posture: (seconds: number): IAutoMovieMotionHumanPosture => {
          const pose: IAutoMovieMotionHumanPosture =
            stationary.posture(seconds);
          return {
            ...pose,
            joints: {
              ...pose.joints,
              rightLowerArm: [80, 0, 0],
              leftLowerArm: [80, 0, 0],
            },
          };
        },
        ...(holding
          ? { holds: [{ side: "right", prop: "ball", from: 0 }] }
          : {}),
      };
    },
  });
  const held: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanStand.IParams> =
    holdingStand(true);
  const address: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanStand.IParams> =
    holdingStand(false);
  const ready: HumanPerformance = new HumanPerformance({
    seed: "bowling-approach",
    performers,
    laws: [address],
    composition: HumanChain.subject(subject).registered(address.name, {
      hold: 0.2,
      sway: 0,
    }).node,
  });
  const palm: IAutoMovieMotionHumanHand.IFrame = HumanHand.frame(
    body,
    ready.bones(subject, 0),
    "right",
    "palm",
  );
  const carry: IAutoMovieVector3 = Vector3.add(
    palm.point,
    Vector3.scale(palm.normal, sphere.radius),
  );
  const slideFrom: number = 0.26;
  const slideTo: number = 0.72;
  const take: HumanPerformance = new HumanPerformance({
    seed: "bowling-approach",
    performers,
    laws: [
      held,
      address,
      AutoMovieMotionHumanThrowCatch.HumanSportThrow.bowlingSlide,
      AutoMovieMotionHumanThrowCatch.HumanSportThrow.bowlingDelivery,
    ],
    props: [
      HumanObject.prop("ball", ball, {
        position: Vector3.subtract(carry, sphere.transform.position),
        rotation: Quaternion.identity(),
      }),
    ],
    composition: HumanChain.subject(subject)
      .registered(held.name, { hold: 0.2, sway: 0 })
      .carry({
        to: line,
        kind: "twoHands",
        load: ball.properties.mass / body.profile.mass,
      })
      .registered(address.name, { hold: 0.2, sway: 0 })
      .registered("bowlingSlide", {
        distance: 0.22,
        from: slideFrom,
        to: slideTo,
        duration: 2.9,
      })
      .over((upper) =>
        upper.registered("bowlingDelivery", {
          prop: "ball",
          target: {
            kind: "point",
            frame: "world",
            at: { x: 0.102, y: 0.11, z: 2 },
          },
        }),
      ).node,
  });
  const slide: IAutoMovieMotionHumanSegment = take.segments(subject).at(-1)!;
  const actions: ReturnType<HumanPerformance["flights"]> = take.flights("ball");
  TestValidator.predicate("one same-ball release", actions.length === 1);
  const flight: (typeof actions)[number] = actions[0]!;
  const releasePose: IAutoMovieRigidTransform = take.prop(
    "ball",
    flight.launch,
  );
  const beforeRelease: number = flight.launch - 1e-4;
  const carried: IAutoMovieRigidTransform = take.prop("ball", beforeRelease);
  const contact: IAutoMovieVector3 = HumanHand.frame(
    body,
    take.bones(subject, beforeRelease),
    "right",
    "palm",
  ).point;
  const carriedCentre: IAutoMovieVector3 = centreOf(carried);
  TestValidator.predicate(
    "the ball stays a full diameter ahead of the hips through the loaded approach",
    [0, slide.start / 2, slide.start].every(
      (seconds: number): boolean =>
        centreOf(take.prop("ball", seconds)).z -
          take.bones(subject, seconds).get("hips")!.worldPosition.z >
        2 * sphere.radius,
    ),
  );
  const physics: IAutoMovieMotionHumanPrecisionDeck = input(0, 0);
  const replay: IAutoMovieMotionHumanPrecisionDeck.IResult =
    await AutoMovieMotionHumanBilliards.bakePrecisionDeck({
      ...physics,
      release: flight.launch,
      duration: 4,
      ball: {
        ...physics.ball,
        pose: releasePose,
        velocity: flight.projectile.velocity,
      },
    });
  const initial: IAutoMoviePhysicalFrame = replay.cache.at(0);
  const startSlide: IAutoMovieVector3 = take
    .bones(subject, slide.start + slideFrom)
    .get("leftFoot")!.worldPosition;
  const stopSlide: IAutoMovieVector3 = take
    .bones(subject, slide.start + slideTo)
    .get("leftFoot")!.worldPosition;
  TestValidator.predicate(
    "the actor advances from the approach, then settles the sliding foot before release",
    take.bones(subject, slide.start).get("hips")!.worldPosition.z >
      approach.z + 2 &&
      nclose(stopSlide.z - startSlide.z, 0.22, 0.005) &&
      nclose(stopSlide.y, startSlide.y, 0.005) &&
      slide.start + slideTo <= flight.launch + 0.005,
  );
  TestValidator.predicate(
    "the palm meets the ball's exterior and the physical launch joins without snapping",
    nclose(Vector3.distance(contact, carriedCentre), sphere.radius, 0.015) &&
      Vector3.distance(carried.position, releasePose.position) < 0.015 &&
      vclose(initial.bodies.ball!.root!.position, releasePose.position, 2e-5) &&
      qclose(initial.bodies.ball!.root!.rotation, releasePose.rotation, 2e-5) &&
      vclose(
        initial.bodies.ball!.root!.velocity,
        flight.projectile.velocity,
        2e-5,
      ),
  );
  const rolling: IAutoMoviePhysicalSegmentState =
    replay.cache.at(1.3).bodies.ball!.root!;
  const rollingCentre: IAutoMovieVector3 = centreOf(rolling);
  TestValidator.predicate(
    "the released ball rolls forward on the physical lane before the rack",
    nclose(rollingCentre.y, sphere.radius, 0.022) &&
      rolling.velocity.z > 1 &&
      Math.abs(rolling.angularVelocity.x) > 10 &&
      replay.cache.contacts.some(
        (contact): boolean =>
          contact.source === "solver" &&
          (contact.impulse ?? 0) > 0 &&
          ((contact.a.body === "ball" && contact.b.body === "lane") ||
            (contact.a.body === "lane" && contact.b.body === "ball")),
      ),
  );
  TestValidator.predicate(
    "the same launched ball crosses the lane and visibly scatters the rack",
    replay.firstTarget?.id === "pin1" &&
      replay.firstTarget.seconds > flight.launch + 2 &&
      replay.firstTarget.seconds < flight.launch + replay.cache.duration &&
      Vector3.distance(replay.cache.at(4).bodies.pin1!.root!.position, head) >
        0.25,
  );

  // One solver interval either side of the impact, read after, before and
  // after again: the headpin stands on its spot before and moves after.
  const impact: number = replay.firstTarget!.seconds - replay.release;
  const interval: number = 1 / 120;
  const afterImpact: IAutoMoviePhysicalSegmentState = replay.cache.at(
    impact + interval,
  ).bodies.pin1!.root!;
  const beforeImpact: IAutoMoviePhysicalSegmentState = replay.cache.at(
    impact - interval,
  ).bodies.pin1!.root!;
  const afterAgain: IAutoMoviePhysicalSegmentState = replay.cache.at(
    impact + interval,
  ).bodies.pin1!.root!;
  TestValidator.predicate(
    "the headpin is at rest on its spot before the impact and driven after it, in either read order",
    vclose(beforeImpact.position, head, 0.002) &&
      Vector3.length(beforeImpact.velocity) < 0.01 &&
      Vector3.length(afterImpact.velocity) > 0.5 &&
      vclose(afterImpact.position, afterAgain.position, 1e-9) &&
      qclose(afterImpact.rotation, afterAgain.rotation, 1e-9),
  );
  TestValidator.predicate(
    "the struck rack credits the headpin among the fallen while the gutter ball fells none",
    AutoMovieMotionHumanBowling.readPinfall({
      pins: physics.targets,
      result: replay,
    }).includes("pin1") &&
      AutoMovieMotionHumanBowling.readPinfall({
        pins: physics.targets,
        result: hit,
      }).includes("pin1") &&
      AutoMovieMotionHumanBowling.readPinfall({
        pins: physics.targets,
        result: miss,
      }).length === 0 &&
      AutoMovieMotionHumanBowling.readPinfall({
        pins: physics.targets,
        result: replay,
      }).every((id: string): boolean => {
        const root: IAutoMovieRigidTransform = replay.cache.at(
          replay.cache.duration,
        ).bodies[id]!.root!;
        // USBC: 2.031 in base diameter on a 15 in pin whose centre of mass
        // is below mid-height, so any pin down leans past atan(1.0155 / 7.5).
        return (
          Quaternion.rotateVector(root.rotation, up).y <
          Math.cos(Math.atan2(2.031 / 2, 7.5))
        );
      }),
  );
  // The production physics command's default archive budget.
  const byteLimit: number = 268_435_456;
  const archive: Uint8Array = await AutoMoviePhysicalPlayback.encode(
    replay.cache,
    byteLimit,
  );
  const playback: IAutoMoviePhysicalPlayback =
    await AutoMoviePhysicalPlayback.decode(archive, replay.cache.identity, {
      maximumBytes: byteLimit,
      maximumFrames: 481,
      maximumSegments: 12,
    });
  for (const seconds of [
    replay.cache.duration,
    0,
    replay.firstTarget!.seconds - replay.release,
    1.3,
  ])
    TestValidator.equals(
      `the production archive restores its independently sought ball and rack at ${seconds}s`,
      playback.at(seconds).bodies,
      replay.cache.at(seconds).bodies,
    );

  // The takes pass the shipped verdicts a viewer would show.
  assertTakeClean("bowling approach and slide", take);
}
