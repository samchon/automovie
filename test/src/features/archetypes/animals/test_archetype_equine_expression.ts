import {
  AutoMovieArchetypeEquine,
  AutoMovieArchetypeEquineExpression,
  type AutoMovieArchetypeEquineExpressionCue,
  AutoMovieArchetypeQuadrupedBody,
  AutoMovieArchetypeRefusal,
  type AutoMovieArchetypeRide,
  createHorse,
  rideHorse,
} from "@automovie/archetypes";
import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { equineExpressionObservation as Look } from "../../internal/equineExpressionObservation";

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

/** Grazing chew period, seconds: 47.1 chews a minute (Taylor, Lancaster and Ellis 2025, Animals 15:2273, Table 1), transcribed here independently of the layer. */
const CHEW_PERIOD: number = 60 / 47.1;

/**
 * Feeding, drinking, ears, jaw, tail, calls and gaze layered over a real horse's halt and walk.
 *
 * Scenarios:
 * 1. Over a halted horse, separately placed grass, hay and trough targets each meet the displayed head capsule's surface while held, and lie clear of it before and after.
 * 2. The displayed jaw opens against the head while it chews at the cited grazing rate, and stays shut outside its cue; each ear turns on its own window while the other keeps its carriage; a swishing tail swings.
 * 3. Every channel returns to the base ride's exact displayed parts once its cue ends.
 * 4. Each call adds exactly one audio mark and one instant.
 * 5. Over a walk, a gaze turns the head to its target while every limb, the saddle and the stirrups keep the base's exact parts and the reins stay on the moving bit, with no displayed part jumping between frames.
 * 6. A target beyond the neck and head's reach, overlapping cues and a clearance contradicting its act refuse.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names every scenario and what it checks.
 * @evidence contracts/development/testing.md#behavioral-verification Layers cues over the public horse ride and reads displayed parts: head and jaw capsules, ear plates, tail, limbs, tack and rein spans.
 * @evidence contracts/development/testing.md#independent-expectations Contact is the displayed capsule's surface distance to separately placed world targets; the chew period is transcribed from the cited study; neutral return and continuity compare with the base ride's own parts.
 * @evidence contracts/development/testing.md#distinguishing-cases Held versus clear, one ear versus the other, inside versus outside each cue, halt versus walk, reachable versus unreachable, admitted versus overlapping and contradicting cues.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous in-memory scenario over public producers; the social cases are `test_archetype_equine_expression_social`'s.
 */
export function test_archetype_equine_expression(): void {
  const horse: Horse = createHorse(
    { tack: "saddle", withersHeight: 1.72, tempo: 0 },
    3,
  );
  const halted: Ride = rideHorse(
    horse,
    {
      start: { x: 0, z: 0, heading: 0 },
      cruise: 1.4,
      startSpeed: 0,
      endSpeed: 0,
      acceleration: 1,
      deceleration: 1,
      startFromStanding: true,
      legs: [{ kind: "straight", length: 3 }],
    },
    "walk",
  );
  const t: number = halted.duration + 2;
  const still: Sample = halted.at(t);
  const neck: Look.IBar = Look.bar(still, "neck");
  const root: IAutoMovieVector3 = neck.from;
  const grass: IAutoMovieVector3 = { x: root.x, y: 0.15, z: root.z + 0.35 };
  const hay: IAutoMovieVector3 = { x: root.x, y: 0.9, z: root.z + 0.8 };
  const trough: IAutoMovieVector3 = {
    x: root.x + 0.3,
    y: 0.6,
    z: root.z + 0.7,
  };
  const reach = (
    act: AutoMovieArchetypeEquineExpressionCue.Act,
    from: number,
    point: IAutoMovieVector3,
  ): AutoMovieArchetypeEquineExpressionCue.IReach => ({
    kind: "reach",
    act,
    from,
    to: from + 4,
    ease: 0.8,
    target: { kind: "point", point },
    gap: 0,
  });
  const cues: readonly AutoMovieArchetypeEquineExpressionCue.Cue[] = [
    reach("graze", t, grass),
    { kind: "jaw", action: "chew", from: t + 0.8, to: t + 4.8, ease: 0.3 },
    reach("hay", t + 5, hay),
    reach("drink", t + 10, trough),
    { kind: "vocalize", call: "snort", at: t + 12 },
    {
      kind: "ear",
      side: "left",
      carriage: "forward",
      from: t + 15,
      to: t + 17,
      ease: 0.3,
    },
    {
      kind: "ear",
      side: "right",
      carriage: "back",
      from: t + 16,
      to: t + 18,
      ease: 0.3,
    },
    { kind: "tail", carriage: "swish", from: t + 15, to: t + 18, ease: 0.3 },
    { kind: "jaw", action: "open", from: t + 18, to: t + 19.5, ease: 0.3 },
    { kind: "vocalize", call: "neigh", at: t + 18.3 },
  ];
  const layered: AutoMovieArchetypeEquineExpression.IRide<
    AutoMovieArchetypeEquine.Affordance,
    AutoMovieArchetypeEquine.Dimension
  > = AutoMovieArchetypeEquineExpression.layer(horse, halted, cues);

  // 1. Each target meets the displayed muzzle while held and lies clear of it outside.
  for (const [label, from, point] of [
    ["grass", t, grass],
    ["hay", t + 5, hay],
    ["trough", t + 10, trough],
  ] as const) {
    for (const at of [from + 0.8, from + 2, from + 3.2]) {
      const gap: number = Look.surface(Look.bar(layered.at(at), "head"), point);
      TestValidator.predicate(
        `the muzzle touches the ${label} at ${at}`,
        Math.abs(gap) <= 1e-6,
      );
    }
    for (const at of [from - 0.01, from + 4.01])
      TestValidator.predicate(
        `the muzzle is clear of the ${label} outside its reach`,
        Look.surface(Look.bar(layered.at(at), "head"), point) > 0.05,
      );
  }

  // 2. The jaw chews against the head at the cited rate and is shut outside its cues.
  const jaw = (at: number): number => {
    const sample: Sample = layered.at(at);
    return Look.degrees(Look.axis(sample, "jaw"), Look.axis(sample, "head"));
  };
  const step: number = 1 / 120;
  const peaks: number[] = [];
  for (let at: number = t + 1.2; at < t + 4.4; at += step)
    if (jaw(at) > jaw(at - step) && jaw(at) >= jaw(at + step)) peaks.push(at);
  TestValidator.predicate(
    "the jaw opens and closes while chewing",
    peaks.length >= 2 && Math.max(...peaks.map(jaw)) > 1,
  );
  for (let k: number = 1; k < peaks.length; k++)
    TestValidator.predicate(
      "chews follow the measured grazing period",
      Math.abs(peaks[k]! - peaks[k - 1]! - CHEW_PERIOD) <= 2 * step,
    );
  TestValidator.predicate(
    "the jaw is shut outside its cues",
    jaw(t + 6) <= 1e-6 && jaw(t + 20) <= 1e-6,
  );
  TestValidator.predicate(
    "the jaw holds open for the neigh",
    jaw(t + 18.75) > jaw(t + 2.5) / 2 && jaw(t + 18.75) > 5,
  );

  // Ears relative to the head, which does not move in this window.
  const ear = (at: number, side: "leftEar" | "rightEar"): IAutoMovieVector3 =>
    Look.axis(layered.at(at), side);
  const before: Sample = layered.at(t + 14.9);
  const turned = (at: number, side: "leftEar" | "rightEar"): number =>
    Look.degrees(ear(at, side), Look.axis(before, side));
  TestValidator.predicate(
    "the left ear turns forward on its own",
    turned(t + 15.8, "leftEar") > 10 && turned(t + 15.8, "rightEar") <= 1e-9,
  );
  TestValidator.predicate(
    "the right ear turns back while the left holds",
    turned(t + 17.5, "rightEar") > 10 && turned(t + 17.5, "leftEar") <= 1e-9,
  );
  const tailAt = (at: number): IAutoMovieVector3 =>
    Look.axis(layered.at(at), "tail");
  TestValidator.predicate(
    "the tail swings while it swishes",
    Look.degrees(tailAt(t + 16.25), tailAt(t + 16.75)) > 20,
  );
  for (const at of [t + 15.5, t + 17.2]) {
    const sample: Sample = layered.at(at);
    const head: Look.IBar = Look.bar(sample, "head");
    for (const side of ["leftEar", "rightEar"] as const) {
      const centre: IAutoMovieVector3 = Look.frame(sample, side).translation;
      const plate: IAutoMovieModelPart = sample.archetype.parts.find(
        (part: IAutoMovieModelPart): boolean => part.id === side,
      )!;
      const length: number =
        plate.geometry.type === "primitive" &&
        plate.geometry.shape.type === "box"
          ? plate.geometry.shape.height
          : NaN;
      const base: IAutoMovieVector3 = Vector3.addScaled(
        centre,
        Look.axis(sample, side),
        -length / 2,
      );
      TestValidator.predicate(
        `the ${side}'s root stays inside the head`,
        Look.surface(head, base) < 0,
      );
    }
  }

  // 3. Neutral return: outside every cue the displayed parts are the base's.
  for (const at of [t - 0.5, t + 4.9, t + 9.5, t + 14.5, t + 19.6, t + 25])
    TestValidator.equals(
      `the layer returns to the base pose at ${at}`,
      JSON.stringify(layered.at(at).archetype.parts),
      JSON.stringify(halted.at(at).archetype.parts),
    );

  // 4. One mark and one instant per call.
  TestValidator.equals(
    "one mark per call",
    layered.marks.map(
      (mark: AutoMovieArchetypeEquineExpressionCue.IMark): string => mark.call,
    ),
    ["snort", "neigh"],
  );
  for (const call of ["snort", "neigh"])
    TestValidator.equals(
      `one ${call} instant`,
      layered.instants.filter(
        (instant: { label: string }): boolean =>
          instant.label === `vocal:${call}`,
      ).length,
      1,
    );

  gaze(horse);
  refusals(horse, halted, t, root);
}

/** 5. A gaze over a walk keeps the stride and the tack. */
function gaze(horse: Horse): void {
  const walk: Ride = rideHorse(
    horse,
    {
      start: { x: 0, z: 0, heading: 0 },
      cruise: 1.4,
      startSpeed: 0,
      endSpeed: 0,
      acceleration: 1,
      deceleration: 1,
      startFromStanding: true,
      legs: [{ kind: "straight", length: 8 }],
    },
    "walk",
  );
  const point: IAutoMovieVector3 = { x: 6, y: 1.8, z: 6 };
  const layered: Ride = AutoMovieArchetypeEquineExpression.layer(horse, walk, [
    {
      kind: "attend",
      from: 1,
      to: 5,
      ease: 0.6,
      target: { kind: "point", point },
    },
  ]);
  const kept: readonly string[] = [
    ...AutoMovieArchetypeQuadrupedBody.LIMBS.flatMap(
      (limb: AutoMovieArchetypeQuadrupedBody.Limb): readonly string[] =>
        AutoMovieArchetypeQuadrupedBody.BONES[limb],
    ),
    "trunk",
    "hindquarters",
    ...horse.parts
      .map((part: IAutoMovieModelPart): string => part.id)
      .filter((id: string): boolean =>
        /stirrup|saddle|girth|seat|flap|panel/i.test(id),
      ),
  ];
  const step: number = 1 / 60;
  let previous: Sample | undefined;
  for (let at: number = 0.9; at <= 5.1; at += step) {
    const shown: Sample = layered.at(at);
    const base: Sample = walk.at(at);
    for (const id of kept)
      TestValidator.equals(
        `${id} keeps the base stride and tack at ${at}`,
        JSON.stringify(Look.frame(shown, id)),
        JSON.stringify(Look.frame(base, id)),
      );
    const head: Look.IBar = Look.bar(shown, "head");
    for (const rein of ["rein-left", "rein-right"]) {
      const line: Look.IBar = Look.bar(shown, rein);
      TestValidator.predicate(
        `${rein} stays on the turning head at ${at}`,
        Math.min(Look.surface(head, line.from), Look.surface(head, line.to)) <=
          0,
      );
    }
    if (previous !== undefined)
      for (const part of shown.archetype.parts) {
        if (kept.includes(part.id)) continue;
        const jump: number = Vector3.distance(
          Look.frame(shown, part.id).translation,
          Look.frame(previous, part.id).translation,
        );
        TestValidator.predicate(
          `${part.id} moves continuously at ${at}`,
          jump <= 0.1,
        );
      }
    previous = shown;
  }
  const held: Sample = layered.at(3);
  const neck: Look.IBar = Look.bar(held, "neck");
  const head: Look.IBar = Look.bar(held, "head");
  const bearing = (from: IAutoMovieVector3, to: IAutoMovieVector3): number =>
    Math.atan2(to.x - from.x, to.z - from.z);
  TestValidator.predicate(
    "the gaze turns the head to its target",
    Math.abs(bearing(neck.from, head.to) - bearing(neck.from, point)) <= 1e-6,
  );
}

/** 6. Unreachable targets and malformed cues refuse. */
function refusals(
  horse: Horse,
  halted: Ride,
  t: number,
  root: IAutoMovieVector3,
): void {
  const refused = (
    label: string,
    cues: readonly AutoMovieArchetypeEquineExpressionCue.Cue[],
    axis: string,
  ): void => {
    let caught: unknown = null;
    try {
      AutoMovieArchetypeEquineExpression.layer(horse, halted, cues);
    } catch (error) {
      caught = error;
    }
    TestValidator.predicate(
      `${label} refuses on ${axis}`,
      caught instanceof AutoMovieArchetypeRefusal && caught.axis === axis,
    );
  };
  refused(
    "grass beyond the neck and head",
    [
      {
        kind: "reach",
        act: "graze",
        from: t,
        to: t + 3,
        ease: 0.5,
        target: { kind: "point", point: { x: root.x, y: 0, z: root.z + 1.5 } },
        gap: 0,
      },
    ],
    "target",
  );
  refused(
    "two ear cues on one ear",
    [
      {
        kind: "ear",
        side: "left",
        carriage: "back",
        from: t,
        to: t + 2,
        ease: 0.2,
      },
      {
        kind: "ear",
        side: "left",
        carriage: "forward",
        from: t + 1,
        to: t + 3,
        ease: 0.2,
      },
    ],
    "cues",
  );
  refused(
    "a sniff that touches",
    [
      {
        kind: "reach",
        act: "sniff",
        from: t,
        to: t + 3,
        ease: 0.5,
        target: { kind: "point", point: { x: root.x, y: 1, z: root.z + 0.8 } },
        gap: 0,
      },
    ],
    "gap",
  );
}
