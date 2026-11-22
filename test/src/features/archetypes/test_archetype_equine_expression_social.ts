import {
  AutoMovieArchetypeEquine,
  AutoMovieArchetypeEquineExpression,
  type AutoMovieArchetypeRide,
  createHorse,
  rideHorse,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { equineExpressionObservation as Look } from "../internal/equineExpressionObservation";

/** The horse producer's model. */
type Horse = ReturnType<typeof createHorse>;

/** A horse ride. */
type Ride = AutoMovieArchetypeRide.IRide<
  AutoMovieArchetypeEquine.Affordance,
  AutoMovieArchetypeEquine.Dimension
>;

/** A sample of a horse ride. */
type Sample = AutoMovieArchetypeRide.ISample<
  AutoMovieArchetypeEquine.Affordance,
  AutoMovieArchetypeEquine.Dimension
>;

/**
 * Greeting, sniffing, mutual grooming and self-rubbing between two real horses on one film clock.
 *
 * Scenarios:
 * 1. Two halted horses face each other; one attends the other while the other greets it nose to nose, tracking the moving muzzle, then sniffs its neck at a held clearance.
 * 2. Two halted horses stand side by side facing opposite ways and groom each other's withers at once, each muzzle on the partner's displayed withers.
 * 3. A horse rubs its face on the outer face of its own left upper arm, touching that bar's surface without passing through the other forelimb bars.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the three social scenes and what each checks.
 * @evidence contracts/development/testing.md#behavioral-verification Layers cues over two public horse rides and reads both horses' displayed head capsules, withers and limb bars.
 * @evidence contracts/development/testing.md#independent-expectations Each contact is the displayed muzzle capsule's surface distance to a point read from the partner's or the horse's own displayed geometry; a sniff keeps exactly its authored clearance.
 * @evidence contracts/development/testing.md#distinguishing-cases A moving tracked muzzle versus a fixed region, contact versus clearance, a partner's body versus the horse's own.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous in-memory scenario; feeding, ears, jaw and refusals are `test_archetype_equine_expression`'s.
 */
export function test_archetype_equine_expression_social(): void {
  const horse: Horse = createHorse(
    { tack: "bare", withersHeight: 1.72, tempo: 0 },
    5,
  );
  const halt = (x: number, z: number, heading: number): Ride =>
    rideHorse(
      horse,
      {
        start: { x, z, heading },
        cruise: 1.2,
        startSpeed: 0,
        endSpeed: 0,
        acceleration: 1,
        deceleration: 1,
        startFromStanding: true,
        legs: [{ kind: "straight", length: 1 }],
      },
      "walk",
    );
  const tip = (sample: Sample): IAutoMovieVector3 => {
    const head: Look.IBar = Look.bar(sample, "head");
    return Vector3.addScaled(
      head.to,
      Vector3.normalize(Vector3.subtract(head.to, head.from)),
      head.radius,
    );
  };

  // 1. Face to face: B attends A's poll, A greets B's moving muzzle, then sniffs B's neck.
  const a: Ride = halt(0, 0, 0);
  const b: Ride = halt(0.2, 3.4, 180);
  const t: number = Math.max(a.duration, b.duration) + 1;
  const poll: IAutoMovieVector3 = Look.bar(a.at(t), "head").from;
  const attending: Ride = AutoMovieArchetypeEquineExpression.layer(horse, b, [
    {
      kind: "attend",
      from: t,
      to: t + 8,
      ease: 0.6,
      target: { kind: "point", point: poll },
    },
  ]);
  const neck: Look.IBar = Look.bar(b.at(t), "neck");
  const side: IAutoMovieVector3 = Vector3.addScaled(
    Vector3.scale(Vector3.add(neck.from, neck.to), 0.5),
    { x: -1, y: 0, z: 0 },
    neck.radius,
  );
  const greeting: Ride = AutoMovieArchetypeEquineExpression.layer(horse, a, [
    {
      kind: "reach",
      act: "greet",
      from: t + 0.5,
      to: t + 3.5,
      ease: 0.6,
      target: {
        kind: "track",
        at: (at: number): IAutoMovieVector3 => tip(attending.at(at)),
      },
      gap: 0,
    },
    {
      kind: "reach",
      act: "sniff",
      from: t + 4,
      to: t + 7,
      ease: 0.6,
      target: { kind: "point", point: side },
      gap: 0.04,
    },
  ]);
  for (const at of [t + 1.1, t + 2, t + 2.9]) {
    const gap: number = Look.surface(
      Look.bar(greeting.at(at), "head"),
      tip(attending.at(at)),
    );
    TestValidator.predicate(`the noses meet at ${at}`, Math.abs(gap) <= 1e-6);
  }
  for (const at of [t + 4.6, t + 5.5, t + 6.4])
    TestValidator.predicate(
      `the sniff keeps its clearance at ${at}`,
      Math.abs(Look.surface(Look.bar(greeting.at(at), "head"), side) - 0.04) <=
        1e-6,
    );

  // 2. Side by side, facing opposite ways: each grooms the other's withers.
  const left: Ride = halt(0, 0, 0);
  const restLeft: Sample = left.at(left.duration + 1);
  const withers = (sample: Sample): IAutoMovieVector3 => {
    const ball: IAutoMovieTransform = Look.frame(sample, "withers");
    const part: IAutoMovieModelPart = sample.archetype.parts.find(
      (candidate: IAutoMovieModelPart): boolean => candidate.id === "withers",
    )!;
    const radius: number =
      part.geometry.type === "primitive" &&
      part.geometry.shape.type === "sphere"
        ? part.geometry.shape.radius
        : NaN;
    return Vector3.addScaled(ball.translation, { x: 0, y: 1, z: 0 }, radius);
  };
  const leftRoot: IAutoMovieVector3 = Look.bar(restLeft, "neck").from;
  const probe: Ride = halt(0.95, 0, 180);
  const offset: number = leftRoot.z - withers(probe.at(probe.duration + 1)).z;
  const right: Ride = halt(0.95, offset, 180);
  const s: number = Math.max(left.duration, right.duration) + 1;
  const groomLeft: Ride = AutoMovieArchetypeEquineExpression.layer(
    horse,
    left,
    [
      {
        kind: "reach",
        act: "groom",
        from: s,
        to: s + 5,
        ease: 0.8,
        target: {
          kind: "track",
          at: (at: number): IAutoMovieVector3 => withers(right.at(at)),
        },
        gap: 0,
      },
    ],
  );
  const groomRight: Ride = AutoMovieArchetypeEquineExpression.layer(
    horse,
    right,
    [
      {
        kind: "reach",
        act: "groom",
        from: s + 0.3,
        to: s + 5.3,
        ease: 0.8,
        target: {
          kind: "track",
          at: (at: number): IAutoMovieVector3 => withers(left.at(at)),
        },
        gap: 0,
      },
    ],
  );
  for (const at of [s + 1.2, s + 2.5, s + 4.1]) {
    const l: Sample = groomLeft.at(at);
    const r: Sample = groomRight.at(at);
    TestValidator.predicate(
      `the left horse's muzzle is on the right horse's withers at ${at}`,
      Math.abs(Look.surface(Look.bar(l, "head"), withers(r))) <= 1e-6,
    );
    TestValidator.predicate(
      `the right horse's muzzle is on the left horse's withers at ${at}`,
      Math.abs(Look.surface(Look.bar(r, "head"), withers(l))) <= 1e-6,
    );
  }

  // 3. Self-rubbing on the outer face of the own left upper arm, above the elbow.
  const still: Sample = left.at(s);
  const arm: Look.IBar = Look.bar(still, "leftForeHumerus");
  const spot: IAutoMovieVector3 = Vector3.addScaled(
    Vector3.lerp(arm.from, arm.to, 0.6),
    Quaternion.rotateVector(still.placement.rotation, { x: 1, y: 0, z: 0 }),
    arm.radius,
  );
  const rubbing: Ride = AutoMovieArchetypeEquineExpression.layer(horse, left, [
    {
      kind: "reach",
      act: "rub",
      from: s,
      to: s + 4,
      ease: 0.8,
      target: { kind: "point", point: spot },
      gap: 0,
    },
  ]);
  for (const at of [s + 1, s + 2, s + 3]) {
    const shown: Sample = rubbing.at(at);
    TestValidator.predicate(
      `the face rubs the upper arm at ${at}`,
      Math.abs(Look.surface(Look.bar(shown, "head"), spot)) <= 1e-6 &&
        Math.abs(Look.surface(Look.bar(shown, "leftForeHumerus"), spot)) <=
          1e-9,
    );
  }
}
