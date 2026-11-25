import {
  AutoMovieArchetypeEquine,
  AutoMovieArchetypeEquineStance,
  type AutoMovieArchetypeEquineStanceCue,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeQuadrupedBody,
  AutoMovieArchetypeRefusal,
  type AutoMovieArchetypeRide,
  createHorse,
  rideHorse,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieQuaternion,
  IAutoMovieTransform,
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

/** A displayed hoof: its sole's lowest height and its terminal endpoint, world metres. */
interface IHoof {
  /** Lowest point of the terminal bar. */
  sole: number;

  /** The terminal bar's far end. */
  end: IAutoMovieVector3;
}

/**
 * Whole-body responses over a real halted horse: weight shift, startle, baulk, a lifted hoof, a step aside, a rear and a buck, each settling back.
 *
 * Scenarios:
 * 1. The stance joins the ride's halt with no jump, and every response settles back to that halt's displayed parts.
 * 2. Planted hooves keep their displayed soles on the floor and their endpoints on their anchors through every response.
 * 3. Before each hoof leaves the floor, the rest centre of mass carried by the displayed trunk lies inside the triangle of the displayed soles that stay.
 * 4. The rear holds its authored trunk pitch on both planted hind soles with the forelimbs folded off the floor; the buck holds its pitch on both fore soles with the hind limbs off the floor.
 * 5. The step aside ends with all four soles moved by its width to the asked side.
 * 6. Two separately built stances sampled in reverse order are identical; a pitch of 90 degrees or more, a response while the horse still moves and overlapping responses refuse.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names every scenario and what it checks.
 * @evidence contracts/development/testing.md#behavioral-verification Plays the public stance over the public horse ride and reads displayed limb bars, trunk and instants.
 * @evidence contracts/development/testing.md#independent-expectations Contact is the displayed terminal bar's lowest point against the floor plane; weight transfer is the static-stability rule that the centre of mass projects inside the remaining supports, computed from the producer's rest centre of mass carried by the displayed trunk; pitch is the displayed trunk axis's elevation against the authored angle.
 * @evidence contracts/development/testing.md#distinguishing-cases Planted versus lifted hooves, before versus after release, rear versus buck, returning responses versus the step aside, admitted versus refused cues.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous in-memory scenario; the handler's side is `test_motion_mount_equestrian_handler`'s.
 */
export function test_archetype_equine_reaction(): void {
  const horse: Horse = createHorse(
    { tack: "saddle", withersHeight: 1.72, tempo: 0 },
    11,
  );
  const ride: Ride = rideHorse(
    horse,
    {
      start: { x: 0, z: 0, heading: 0 },
      cruise: 1.2,
      startSpeed: 0,
      endSpeed: 0,
      acceleration: 1,
      deceleration: 1,
      startFromStanding: true,
      legs: [{ kind: "straight", length: 2 }],
    },
    "walk",
  );
  const t: number = ride.duration + 0.5;
  const phases = (
    from: number,
    entry: number,
    hold: number,
    exit: number,
  ): AutoMovieArchetypeEquineStanceCue.IPhases => ({
    from,
    entry,
    hold,
    exit,
  });
  const cues: readonly AutoMovieArchetypeEquineStanceCue.Cue[] = [
    { kind: "shift", x: 0.04, y: 0, z: 0.03, ...phases(t, 0.6, 0.4, 0.6) },
    { kind: "startle", ...phases(t + 2, 0.15, 0.6, 0.8) },
    { kind: "baulk", ...phases(t + 4, 0.5, 0.8, 0.6) },
    { kind: "hoof", limb: "leftFore", ...phases(t + 6.5, 1.2, 1, 1.2) },
    { kind: "hoof", limb: "rightHind", ...phases(t + 10.5, 1.2, 1, 1.2) },
    { kind: "rear", pitch: 40, ...phases(t + 14.5, 1.6, 1, 1.6) },
    { kind: "buck", pitch: 15, ...phases(t + 19.5, 0.8, 0.3, 0.8) },
    {
      kind: "stepAside",
      side: "right",
      width: 0.25,
      ...phases(t + 22, 3.2, 0.4, 0.8),
    },
  ];
  const stance: Ride = AutoMovieArchetypeEquineStance.after(horse, ride, cues);
  const halt: Sample = ride.at(ride.duration);
  const anchors: Readonly<
    Record<AutoMovieArchetypeQuadrupedBody.Limb, IAutoMovieVector3>
  > = {
    leftFore: hoof(halt, "leftFore").end,
    rightFore: hoof(halt, "rightFore").end,
    leftHind: hoof(halt, "leftHind").end,
    rightHind: hoof(halt, "rightHind").end,
  };
  const instant = (label: string, after: number): number =>
    stance.instants.find(
      (entry: { seconds: number; label: string }): boolean =>
        entry.label === label && entry.seconds >= after,
    )!.seconds;

  // 1. The join and every settle meet the halt.
  for (const at of [
    t,
    t + 1.6 + 1e-9,
    t + 3.6,
    t + 5.9 + 1e-9,
    t + 9.9 + 1e-9,
    t + 19 + 1e-9,
  ])
    TestValidator.predicate(
      `the stance meets the halt at ${at}`,
      same(stance.at(at), halt) <= 1e-6,
    );

  // 2. Planted hooves stay on their anchors through the returning responses.
  const planted = (
    at: number,
    limbs: readonly AutoMovieArchetypeQuadrupedBody.Limb[],
  ): void => {
    const sample: Sample = stance.at(at);
    for (const limb of limbs) {
      const shown: IHoof = hoof(sample, limb);
      TestValidator.predicate(
        `the ${limb} stays planted at ${at}`,
        Math.abs(shown.sole) <= 1e-6 &&
          Vector3.distance(shown.end, anchors[limb]) <= 1e-6,
      );
    }
  };
  for (const at of [t + 0.8, t + 2.4, t + 4.9])
    planted(at, AutoMovieArchetypeQuadrupedBody.LIMBS);
  planted(t + 8.2, ["rightFore", "leftHind", "rightHind"]);
  planted(t + 12.2, ["leftFore", "rightFore", "leftHind"]);
  planted(t + 16.6, ["leftHind", "rightHind"]);
  planted(t + 20.4, ["leftFore", "rightFore"]);

  // 3. The weight is on the other three hooves before each lifts.
  for (const [limb, after] of [
    ["leftFore", t + 6.5],
    ["rightHind", t + 10.5],
    ["rightFore", t + 22],
    ["rightHind", t + 22],
    ["leftFore", t + 22],
    ["leftHind", t + 22],
  ] as const) {
    const at: number = instant(`${limb}Off`, after);
    const sample: Sample = stance.at(at);
    const others: IAutoMovieVector3[] =
      AutoMovieArchetypeQuadrupedBody.LIMBS.filter(
        (other: AutoMovieArchetypeQuadrupedBody.Limb): boolean =>
          other !== limb,
      ).map(
        (other: AutoMovieArchetypeQuadrupedBody.Limb): IAutoMovieVector3 =>
          hoof(sample, other).end,
      );
    TestValidator.predicate(
      `the weight is off the ${limb} when it lifts at ${at}`,
      inside(centre(horse, sample), others) >= 0,
    );
  }
  for (const [limb, at] of [
    ["leftFore", t + 8.2],
    ["rightHind", t + 12.2],
  ] as const)
    TestValidator.predicate(
      `the ${limb} is held up at ${at}`,
      hoof(stance.at(at), limb).sole > 0.1,
    );

  // 4. Rear and buck hold their pitch on the pair that stays.
  const elevation = (sample: Sample): number => {
    const axis: IAutoMovieVector3 = Look.axis(sample, "trunk");
    return (Math.atan2(axis.y, Math.hypot(axis.x, axis.z)) * 180) / Math.PI;
  };
  const rearing: Sample = stance.at(t + 16.6);
  TestValidator.predicate(
    "the rear holds its pitch",
    Math.abs(elevation(rearing) - elevation(halt) - 40) <= 1e-6,
  );
  for (const limb of ["leftFore", "rightFore"] as const) {
    TestValidator.predicate(
      `the ${limb} is off the floor in the rear`,
      hoof(rearing, limb).sole > 0.2,
    );
    TestValidator.predicate(
      `the ${limb} is folded in the rear`,
      Look.degrees(
        Look.axis(rearing, AutoMovieArchetypeQuadrupedBody.BONES[limb][1]),
        Look.axis(rearing, AutoMovieArchetypeQuadrupedBody.BONES[limb][2]),
      ) > 60,
    );
  }
  const bucking: Sample = stance.at(t + 20.4);
  TestValidator.predicate(
    "the buck holds its pitch",
    Math.abs(elevation(bucking) - elevation(halt) + 15) <= 1e-6,
  );
  for (const limb of ["leftHind", "rightHind"] as const)
    TestValidator.predicate(
      `the ${limb} kicks off the floor`,
      hoof(bucking, limb).sole > 0.05,
    );

  // 5. The step aside ends displaced by its width to the right.
  const stepped: Sample = stance.at(t + 27);
  for (const limb of AutoMovieArchetypeQuadrupedBody.LIMBS) {
    const shown: IHoof = hoof(stepped, limb);
    const right: IAutoMovieVector3 = Quaternion.rotateVector(
      halt.placement.rotation,
      {
        x: -1,
        y: 0,
        z: 0,
      },
    );
    TestValidator.predicate(
      `the ${limb} stepped right`,
      Math.abs(shown.sole) <= 1e-6 &&
        Vector3.distance(
          shown.end,
          Vector3.addScaled(anchors[limb], right, 0.25),
        ) <= 1e-6,
    );
  }

  // 6. Reproducible in any order, and refusals.
  const again: Ride = AutoMovieArchetypeEquineStance.after(horse, ride, cues);
  for (const at of [t + 26, t + 16, t + 2.3, t + 8])
    TestValidator.equals(
      `the stance replays at ${at}`,
      JSON.stringify(again.at(at).archetype.parts),
      JSON.stringify(stance.at(at).archetype.parts),
    );
  const refused = (
    label: string,
    bad: readonly AutoMovieArchetypeEquineStanceCue.Cue[],
    axis: string,
  ): void => {
    let caught: unknown = null;
    try {
      AutoMovieArchetypeEquineStance.after(horse, ride, bad);
    } catch (error) {
      caught = error;
    }
    TestValidator.predicate(
      `${label} refuses on ${axis}`,
      caught instanceof AutoMovieArchetypeRefusal && caught.axis === axis,
    );
  };
  refused(
    "a vertical rear",
    [{ kind: "rear", pitch: 95, ...phases(t, 1, 1, 1) }],
    "pitch",
  );
  refused(
    "a startle at a walk",
    [{ kind: "startle", ...phases(ride.duration / 2, 0.2, 0.2, 0.2) }],
    "from",
  );
  refused(
    "overlapping responses",
    [
      { kind: "baulk", ...phases(t, 1, 1, 1) },
      { kind: "startle", ...phases(t + 1, 0.2, 0.2, 0.2) },
    ],
    "phases",
  );
}

/** A limb's displayed terminal bar: its lowest point and its far end. */
function hoof(
  sample: Sample,
  limb: AutoMovieArchetypeQuadrupedBody.Limb,
): IHoof {
  const id: string = AutoMovieArchetypeQuadrupedBody.BONES[limb][3];
  const bar: Look.IBar = Look.bar(sample, id);
  const part: IAutoMovieModelPart = sample.archetype.parts.find(
    (candidate: IAutoMovieModelPart): boolean => candidate.id === id,
  )!;
  const axis: IAutoMovieVector3 = Vector3.normalize(
    Vector3.subtract(bar.to, bar.from),
  );

  // A flat-ended cylinder's lowest point: the lower end's centre less its rim's drop, radius times the axis's horizontal share.
  const low: number = Math.min(bar.from.y, bar.to.y);
  const sole: number =
    part.geometry.type === "primitive" &&
    part.geometry.shape.type === "cylinder"
      ? low - bar.radius * Math.hypot(axis.x, axis.z)
      : low - bar.radius;
  return { sole, end: bar.to };
}

/** The largest displacement of any part between two samples, metres. */
function same(a: Sample, b: Sample): number {
  let worst: number = 0;
  for (const part of a.archetype.parts) {
    const p: IAutoMovieTransform = Look.frame(a, part.id);
    const q: IAutoMovieTransform = Look.frame(b, part.id);
    worst = Math.max(worst, Vector3.distance(p.translation, q.translation));
  }
  return worst;
}

/** The rest centre of mass carried by the displayed trunk, world metres. */
function centre(horse: Horse, sample: Sample): IAutoMovieVector3 {
  const rest: IAutoMovieTransform = horse.parts.find(
    (part: IAutoMovieModelPart): boolean => part.id === "trunk",
  )!.transform!;
  const shown: IAutoMovieTransform = Look.frame(sample, "trunk");
  const turn: IAutoMovieQuaternion = Quaternion.multiply(
    shown.rotation,
    Quaternion.inverse(rest.rotation),
  );
  return AutoMovieArchetypeFrame.point(
    {
      translation: Vector3.subtract(
        shown.translation,
        Quaternion.rotateVector(turn, rest.translation),
      ),
      rotation: turn,
      scale: { x: 1, y: 1, z: 1 },
    },
    horse.properties.centerOfMass,
  );
}

/** The least inward distance of a point's ground projection from a triangle's edges; negative outside. */
function inside(
  point: IAutoMovieVector3,
  corners: readonly IAutoMovieVector3[],
): number {
  const middle: IAutoMovieVector3 = Vector3.scale(
    Vector3.add(Vector3.add(corners[0]!, corners[1]!), corners[2]!),
    1 / 3,
  );
  let least: number = Infinity;
  for (let k: number = 0; k < 3; k++) {
    const a: IAutoMovieVector3 = corners[k]!;
    const b: IAutoMovieVector3 = corners[(k + 1) % 3]!;
    const side = (p: IAutoMovieVector3): number =>
      ((b.x - a.x) * (p.z - a.z) - (b.z - a.z) * (p.x - a.x)) /
      Math.hypot(b.x - a.x, b.z - a.z);
    least = Math.min(least, Math.sign(side(middle)) * side(point));
  }
  return least;
}
