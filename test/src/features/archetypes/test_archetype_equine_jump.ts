import {
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeQuadrupedBody,
  type AutoMovieArchetypeQuadrupedFooting,
  AutoMovieArchetypeRefusal,
  createHorse,
  rideHorse,
  type rideQuadruped,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { animalTerminalSole } from "../internal/animalTerminalSole";
import { archetypeHorseRide } from "../internal/archetypeHorseRide";

type Ride = ReturnType<typeof rideHorse>;

/** The authored clearance every jump asks for, metres. */
const CLEARANCE: number = 0.1;

/** The fore's measured maximum carpal flexion over a 1.0 m vertical, degrees: the mean of the trailing (128.3) and leading (130.7) fore means of St George et al. 2021, Animals 11:414, Table 1, intermediate group. */
const TUCK: number = (128.3 + 130.7) / 2;

/** How far above the clearance the tightest part may pass, metres: a settled flight keeps at most 5 ms of surplus, which at the arc's steepest, g times a flight under 1 s over 2, is under 25 mm, and the 5 ms sampling adds the rest. */
const TIGHT: number = 0.05;

/** One rail across the lane at a course distance and a top height. */
interface IRail {
  /** Course distance of its axis, metres. */
  z: number;
  /** Height of its axis, metres. */
  y: number;
}

/** One obstacle course of the jump test. */
interface IObstacleCase {
  /** The obstacle's name. */
  label: string;
  /** Its rails. */
  rails: readonly IRail[];
  /** The lane's support planes. */
  planes: readonly AutoMovieArchetypeQuadrupedFooting.IPlane[];
}

/** One measured part's lowest height and its extent along the lane. */
interface IExtent {
  /** Lowest world height, metres. */
  low: number;
  /** Least world Z, metres. */
  back: number;
  /** Greatest world Z, metres. */
  front: number;
}

/**
 * A horse jumps real obstacles from its canter, flies clear of them, lands on a fore and recovers; a scripted baulk halts and settles without a jump; invalid approaches refuse before any jump is emitted.
 *
 * Scenarios:
 * 1. A vertical, a spread and a dry ditch, each across a level lane: the ride publishes approach, takeoff, landing and recovery; just before takeoff a hind is down, from takeoff to landing every hoof is clear of the floor, a fore lands at landing, and canter footfalls follow the recovery. The whole displayed body, hooves and limbs included, keeps the authored clearance above each rail wherever it passes over it, and no hoof lands inside the ditch. The trunk's vertical velocity stays continuous through the push-off and the landing.
 * 2. A baulk before the vertical halts with all four soles on the floor and unmoving through the settle, and publishes no takeoff or landing.
 * 3. A jump on a turn, a 1.8 m vertical and a vertical too close to the leg's start refuse at the ride's construction.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the obstacles, the events read and the refused approaches.
 * @evidence contracts/development/testing.md#behavioral-verification Reads displayed primitive parts, soles and published events of actual horse rides.
 * @evidence contracts/development/testing.md#independent-expectations Clearance is measured from each part's own primitive geometry against the authored rail capsules; flight from sole heights; the rise from the displayed placement's own height; the refusal bounds are the FEI's 1.70 m height. The 10 cm clearance is the authored request.
 * @evidence contracts/development/testing.md#distinguishing-cases Vertical, spread, ditch, baulk, a curved approach, an over-height rail and a short approach.
 * @evidence contracts/development/testing.md#execution-ownership A memory-only archetype unit on the public horse ride.
 */
export function test_archetype_equine_jump(): void {
  const horse: ReturnType<typeof createHorse> = createHorse({
    tack: "bare",
    withersHeight: 1.72,
    tempo: 0,
  });
  const speed: number = 5;
  const lane = (
    z: readonly [number, number],
  ): AutoMovieArchetypeQuadrupedFooting.IPlane => ({
    id: `lane-${z[0]}`,
    origin: { x: 0, y: 0, z: 0 },
    x: [-4, 4],
    z,
    slope: { x: 0, z: 0 },
  });
  const pole = (
    rail: IRail,
    index: number,
  ): AutoMovieArchetypeQuadrupedFooting.IPole => ({
    id: `rail-${index}`,
    from: { x: -2, y: rail.y, z: rail.z },
    to: { x: 2, y: rail.y, z: rail.z },
    radius: 0.05,
  });
  const issues: string[] = [];
  const cases: readonly IObstacleCase[] = [
    {
      label: "vertical",
      rails: [
        { z: 20, y: 0.65 },
        { z: 20, y: 1 },
      ],
      planes: [lane([-10, 60])],
    },
    {
      label: "spread",
      rails: [
        { z: 20, y: 0.9 },
        { z: 21.2, y: 1 },
      ],
      planes: [lane([-10, 60])],
    },
    { label: "ditch", rails: [], planes: [lane([-10, 19]), lane([21, 60])] },
  ];
  for (const { label, rails, planes } of cases) {
    const ride: Ride = jump(rails.map(pole), planes, 0);
    const takeoff: number = cue(ride, "jumpTakeoff");
    const landing: number = cue(ride, "jumpLanding");
    const recovery: number = cue(ride, "jumpRecovery");
    if (!(cue(ride, "jumpApproach") < takeoff && landing < recovery))
      issues.push(`${label}: jump cues out of order`);
    if (
      !AutoMovieArchetypeQuadrupedBody.LIMBS.some(
        (limb: AutoMovieArchetypeQuadrupedBody.Limb): boolean =>
          limb.endsWith("Hind") && sole(ride, limb, takeoff - 0.01) < 1e-6,
      )
    )
      issues.push(`${label}: no hind is down before takeoff`);
    for (let at: number = takeoff + 0.005; at < landing; at += 0.01)
      if (
        AutoMovieArchetypeQuadrupedBody.LIMBS.some(
          (limb: AutoMovieArchetypeQuadrupedBody.Limb): boolean =>
            !(sole(ride, limb, at) > 0),
        )
      ) {
        issues.push(`${label}: a hoof is down in flight at ${at}`);
        break;
      }
    if (
      !ride.instants.some(
        (event): boolean =>
          event.label.endsWith("ForeOn") &&
          Math.abs(event.seconds - landing) < 1e-9,
      )
    )
      issues.push(`${label}: no fore lands at the landing`);
    if (
      archetypeHorseRide
        .footfalls(ride, "leftFore")
        .filter((at: number): boolean => at > recovery).length < 2
    )
      issues.push(`${label}: no canter strides after recovery`);
    let tightest: number = Infinity;
    for (let at: number = takeoff - 0.4; at < landing + 0.6; at += 0.005) {
      const sample: ReturnType<Ride["at"]> = ride.at(at);
      for (const part of sample.archetype.parts) {
        if (part.geometry.type !== "primitive") continue;
        if (part.geometry.shape.type === "plane") continue;
        const extent: IExtent = measure(part, sample.placement);
        for (const rail of rails)
          if (extent.front > rail.z - 0.05 && extent.back < rail.z + 0.05) {
            const margin: number = extent.low - (rail.y + 0.05);
            tightest = Math.min(tightest, margin);
            if (margin < CLEARANCE - 1e-6)
              issues.push(
                `${label}: ${part.id} ${margin} m over the rail at ${at}`,
              );
          }
      }
    }
    if (rails.length > 0 && !(tightest < CLEARANCE + TIGHT))
      issues.push(
        `${label}: the body overjumps, tightest margin ${tightest} m`,
      );
    // The trunk's rise is continuous: between two 2 ms samples it changes by less than a fifth of the flight's takeoff velocity, g T / 2, so no push-off or impact is skipped.
    const rise = (at: number): number =>
      (ride.at(at + 0.001).placement.translation.y -
        ride.at(at - 0.001).placement.translation.y) /
      0.002;
    const step: number = (0.2 * 9.80665 * (landing - takeoff)) / 2;
    for (let at: number = takeoff - 0.4; at < landing + 0.4; at += 0.002)
      if (!(Math.abs(rise(at + 0.002) - rise(at)) <= step)) {
        issues.push(`${label}: the trunk's rise jumps at ${at.toFixed(3)} s`);
        break;
      }
    const quarter: number = takeoff + (landing - takeoff) / 4;
    for (const side of ["left", "right"] as const) {
      const fold: number = carpus(ride, side, quarter) - carpus(ride, side, 0);
      if (Math.abs(fold - TUCK) > 1)
        issues.push(`${label}: ${side} carpus folds ${fold} degrees in flight`);
    }
    if (label === "ditch")
      for (const limb of AutoMovieArchetypeQuadrupedBody.LIMBS)
        for (const at of archetypeHorseRide.footfalls(ride, limb)) {
          const hoof: IAutoMovieVector3 = archetypeHorseRide.hoof(
            ride,
            limb,
            at + 0.005,
          );
          if (hoof.z > 19 && hoof.z < 21)
            issues.push(`${label}: ${limb} lands in the ditch at ${at}`);
        }
  }

  // 2. A baulk before the vertical.
  const baulk: Ride = rideHorse(horse, {
    start: { x: 0, z: 0, heading: 0 },
    cruise: speed,
    acceleration: 2,
    deceleration: 2,
    speeds: [0, 0],
    legs: [
      {
        kind: "straight",
        length: 16,
        pause: 1.5,
        equineFootwork: { kind: "baulk" },
      },
      { kind: "turn", radius: 4, angle: 120 },
    ],
    footing: {
      planes: [lane([-10, 60])],
      poles: [pole({ z: 20, y: 1 }, 0)],
    },
  });
  const stop: number = cue(baulk, "baulkStop");
  const settle: number = cue(baulk, "baulkSettle");
  if (baulk.instants.some((event): boolean => event.label.startsWith("jump")))
    issues.push("the baulk publishes a jump event");
  for (const limb of AutoMovieArchetypeQuadrupedBody.LIMBS) {
    const first: IAutoMovieVector3 = archetypeHorseRide.hoof(
      baulk,
      limb,
      stop + 0.1,
    );
    for (const at of [stop + 0.1, (stop + settle) / 2, settle - 0.1])
      if (
        Math.abs(sole(baulk, limb, at)) > 1e-9 ||
        Vector3.distance(first, archetypeHorseRide.hoof(baulk, limb, at)) > 1e-9
      )
        issues.push(
          `baulk: ${limb} is not planted through the settle at ${at}`,
        );
  }

  // 3. Invalid approaches refuse at construction.
  for (const [label, build] of [
    [
      "a jump on a turn",
      (): Ride =>
        rideHorse(horse, {
          start: { x: 0, z: 0, heading: 0 },
          cruise: speed,
          startSpeed: speed,
          endSpeed: speed,
          legs: [
            {
              kind: "turn",
              radius: 40,
              angle: 30,
              gait: "canter",
              equineFootwork: { kind: "jump", clearance: CLEARANCE },
            },
          ],
          footing: { planes: [lane([-10, 60])] },
        }),
    ],
    [
      "a 1.8 m vertical",
      (): Ride => jump([pole({ z: 20, y: 1.75 }, 0)], [lane([-10, 60])], 0),
    ],
    [
      "a vertical too close to the start",
      (): Ride => jump([pole({ z: 1.5, y: 1 }, 0)], [lane([-10, 60])], 0),
    ],
  ] as const) {
    let refusal: unknown;
    try {
      build();
    } catch (error) {
      refusal = error;
    }
    if (
      !(
        refusal instanceof AutoMovieArchetypeRefusal &&
        refusal.axis.endsWith("equineFootwork")
      )
    )
      issues.push(`${label} is not refused: ${String(refusal)}`);
  }
  TestValidator.equals("equine jump observations", issues, []);

  /** A straight canter lane with one jump leg. */
  function jump(
    poles: readonly AutoMovieArchetypeQuadrupedFooting.IPole[],
    planes: readonly AutoMovieArchetypeQuadrupedFooting.IPlane[],
    x: number,
  ): Ride {
    const legs: readonly rideQuadruped.ILeg[] = [
      {
        kind: "straight",
        length: 40,
        gait: "canter",
        lead: "left",
        equineFootwork: { kind: "jump", clearance: CLEARANCE },
      },
    ];
    return rideHorse(horse, {
      start: { x, z: 0, heading: 0 },
      cruise: speed,
      startSpeed: speed,
      endSpeed: speed,
      legs,
      footing: { planes, poles },
    });
  }
}

/** Degrees between a fore's displayed radius and cannon bars. */
function carpus(ride: Ride, side: "left" | "right", at: number): number {
  const parts: readonly IAutoMovieModelPart[] = ride.at(at).archetype.parts;
  const axis = (index: number): IAutoMovieVector3 => {
    const part: IAutoMovieModelPart = parts.find(
      (p: IAutoMovieModelPart): boolean =>
        p.id === AutoMovieArchetypeQuadrupedBody.BONES[`${side}Fore`][index],
    )!;
    return Quaternion.rotateVector(part.transform!.rotation, {
      x: 0,
      y: 1,
      z: 0,
    });
  };
  const cosine: number = Vector3.dot(axis(1), axis(2));
  return (Math.acos(Math.max(-1, Math.min(1, cosine))) * 180) / Math.PI;
}

/** A published instant. */
function cue(ride: Ride, label: string): number {
  const found: number | undefined = ride.instants.find(
    (event): boolean => event.label === label,
  )?.seconds;
  if (found === undefined) throw new Error(`The ride did not publish ${label}`);
  return found;
}

/** A hoof's displayed sole height above the level floor. */
function sole(
  ride: Ride,
  limb: AutoMovieArchetypeQuadrupedBody.Limb,
  at: number,
): number {
  const sample: ReturnType<Ride["at"]> = ride.at(at);
  const part: IAutoMovieModelPart = sample.archetype.parts.find(
    (p: IAutoMovieModelPart): boolean =>
      p.id === AutoMovieArchetypeQuadrupedBody.BONES[limb][3],
  )!;
  return animalTerminalSole(part, sample.placement);
}

/** A primitive's lowest world height and world Z extent from its own geometry: segment ends widened by the radius across the axis, or a box's corners. */
function measure(
  part: IAutoMovieModelPart,
  placement: IAutoMovieTransform,
): IExtent {
  if (part.geometry.type !== "primitive")
    throw new Error(`${part.id} is not a primitive`);
  const shape: typeof part.geometry.shape = part.geometry.shape;
  const frame: IAutoMovieTransform = AutoMovieArchetypeFrame.compose(
    placement,
    part.transform!,
  );
  const point = (local: IAutoMovieVector3): IAutoMovieVector3 =>
    Vector3.add(
      frame.translation,
      Quaternion.rotateVector(frame.rotation, local),
    );
  if (shape.type === "box") {
    const corners: IAutoMovieVector3[] = [];
    for (const sx of [-1, 1])
      for (const sy of [-1, 1])
        for (const sz of [-1, 1])
          corners.push(
            point({
              x: (sx * shape.width) / 2,
              y: (sy * shape.height) / 2,
              z: (sz * shape.depth) / 2,
            }),
          );
    return {
      low: Math.min(...corners.map((c: IAutoMovieVector3): number => c.y)),
      back: Math.min(...corners.map((c: IAutoMovieVector3): number => c.z)),
      front: Math.max(...corners.map((c: IAutoMovieVector3): number => c.z)),
    };
  }
  if (shape.type === "plane") throw new Error("A plane has no solid");
  const half: number = shape.type === "sphere" ? 0 : shape.height / 2;
  const radius: number = shape.radius;
  const ends: readonly IAutoMovieVector3[] = [
    point({ x: 0, y: -half, z: 0 }),
    point({ x: 0, y: half, z: 0 }),
  ];
  const axis: IAutoMovieVector3 = Quaternion.rotateVector(frame.rotation, {
    x: 0,
    y: 1,
    z: 0,
  });
  const round: boolean = shape.type === "sphere" || shape.type === "capsule";
  const acrossY: number = round
    ? radius
    : radius * Math.sqrt(Math.max(0, 1 - axis.y * axis.y));
  const acrossZ: number = round
    ? radius
    : radius * Math.sqrt(Math.max(0, 1 - axis.z * axis.z));
  return {
    low: Math.min(ends[0]!.y, ends[1]!.y) - acrossY,
    back: Math.min(ends[0]!.z, ends[1]!.z) - acrossZ,
    front: Math.max(ends[0]!.z, ends[1]!.z) + acrossZ,
  };
}
