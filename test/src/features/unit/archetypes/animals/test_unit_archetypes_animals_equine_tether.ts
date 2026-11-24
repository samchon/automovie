import {
  AutoMovieArchetypeEquine,
  AutoMovieArchetypeEquineHobble,
  AutoMovieArchetypeEquineLunge,
  AutoMovieArchetypeEquineLungeLine,
  AutoMovieArchetypeEquineStance,
  AutoMovieArchetypeEquineTie,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeQuadrupedBody,
  AutoMovieArchetypeQuadrupedGait,
  AutoMovieArchetypeRefusal,
  type AutoMovieArchetypeRide,
  type AutoMovieArchetypeSpan,
  createHobble,
  createHorse,
  createQuadruped,
  rideHorse,
} from "@automovie/archetypes";
import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

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

/** A named instant of a ride. */
type Instant = Ride["instants"][number];

/** A stretch of film seconds. */
interface IStretch {
  /** Its first second. */
  from: number;

  /** Its last second. */
  to: number;
}

/** Standard gravity, m/s². */
const GRAVITY: number = 9.80665;

/**
 * Groundwork from #3954: a horse lunged, tied and hobbled.
 *
 * Scenarios:
 * 1. Tied to a ring, the horse's muzzle stays within the tether's reach of the knot; the lead hangs again from the halter after the untie; a head reach beyond the tether is refused.
 * 2. Hobbled, the horse hops forward with the strap never drawn past its length; a strap shorter than the fores stand apart is refused.
 */
export function test_unit_archetypes_animals_equine_tether(): void {
  const horse: ReturnType<typeof createHorse> = createHorse(
    { tack: "bareback", withersHeight: 1.6, tempo: 0 },
    5,
  );
  const centre: AutoMovieArchetypeEquineLunge.IPoint = { x: 0, z: 0 };
  const radius: number = 8;
  const lunge: Ride = AutoMovieArchetypeEquineLunge.ride(horse, {
    centre,
    radius,
    bearing: 0,
    acceleration: 1,
    turn: 3,
    face: 2,
    reins: [
      {
        side: "left",
        work: [
          { gait: "walk", laps: 0.25 },
          { gait: "trot", laps: 0.5 },
          { gait: "canter", laps: 0.5 },
        ],
      },
      { side: "right", work: [{ gait: "trot", laps: 0.5 }] },
    ],
  });
  const root = (seconds: number): IAutoMovieVector3 =>
    lunge.plan.at(seconds).placement.translation;

  // 1. Tied to a ring and untied.
  const walked: Ride = rideHorse(
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
  const halt: number = walked.duration;
  const halter: IAutoMovieVector3 = walked.frame("lead", halt).translation;
  const ring: IAutoMovieVector3 = {
    x: halter.x + 0.3,
    y: 1.2,
    z: halter.z + 0.6,
  };
  const tether: number = 1;
  const tie: AutoMovieArchetypeEquineTie.ITie = {
    ring,
    axis: { x: 1, y: 0, z: 0 },
    radius: 0.03,
    tether,
    tie: { from: halt + 0.5, carry: 1.2, wraps: 2, wrap: 0.6 },
    untie: { from: halt + 6, carry: 1.2, wraps: 2, wrap: 0.6 },
  };
  const tied: Ride = AutoMovieArchetypeEquineTie.layer(walked, "lead", 3, tie);
  const knot: IAutoMovieVector3 = Vector3.addScaled(
    ring,
    { x: 0, y: 1, z: 0 },
    tie.radius,
  );
  for (
    let t: number = AutoMovieArchetypeEquineTie.end(tie.tie);
    t < tie.untie!.from;
    t += 0.25
  ) {
    const sample: Sample = tied.at(t);
    const span: AutoMovieArchetypeSpan.IState = sample.archetype.span("lead");
    const muzzle: IAutoMovieVector3 = tip(sample, "head");
    const reach: number = Vector3.distance(
      point(sample.placement, span.to),
      muzzle,
    );
    TestValidator.predicate(
      `the tied muzzle stays within the tether's reach of the knot at ${t} s`,
      Vector3.distance(muzzle, knot) <= tether + reach + 1e-6,
    );
  }
  const freed: Sample = tied.at(
    AutoMovieArchetypeEquineTie.end(tie.untie!) + 0.5,
  );
  const loose: Sample = walked.at(
    AutoMovieArchetypeEquineTie.end(tie.untie!) + 0.5,
  );
  TestValidator.predicate(
    "the lead hangs from the halter again after the untie",
    Vector3.distance(
      point(freed.placement, freed.archetype.span("lead").from),
      point(loose.placement, loose.archetype.span("lead").from),
    ) <= 1e-6,
  );
  TestValidator.error(
    "a tether shorter than the head stands from the knot is refused",
    () => {
      const short: Ride = AutoMovieArchetypeEquineTie.layer(walked, "lead", 3, {
        ...tie,
        tether: 0.1,
        untie: undefined,
      });
      short.at(AutoMovieArchetypeEquineTie.end(tie.tie) + 0.5);
    },
  );

  // 2. Hobbled.
  const stopped: Sample = walked.at(halt);
  const apart: number = Vector3.distance(
    cuff(stopped, "leftFore"),
    cuff(stopped, "rightFore"),
  );
  const strap: number = apart + 0.05;
  const hopping: Ride = AutoMovieArchetypeEquineStance.after(horse, walked, [
    {
      kind: "hops",
      count: 3,
      length: 0.25,
      strap,
      from: halt + 0.5,
      entry: 4,
      hold: 0,
      exit: 0.6,
    },
  ]);
  const cannon: IAutoMovieModelPart = horse.parts.find(
    (part: IAutoMovieModelPart): boolean =>
      part.id === AutoMovieArchetypeQuadrupedBody.BONES.leftFore[2],
  )!;
  const hobble: AutoMovieArchetypeRide.IRide<never, never> =
  for (let t: number = halt; t <= hopping.duration; t += 0.1) {
    const worn: AutoMovieArchetypeRide.ISample<never, never> = hobble.at(t);
    const cuffs: number = Vector3.distance(
      world(worn, "leftCuff"),
      world(worn, "rightCuff"),
    );
    TestValidator.predicate(
      `the hobbled fores (${cuffs} m apart at the cuffs) never separate beyond the ${strap} m strap at ${t} s`,
      cuffs <= strap + 1e-6,
    );
    TestValidator.predicate(
      `the cuffs close round the fore cannons at ${t} s`,
      Vector3.distance(
        world(worn, "leftCuff"),
        cuff(hopping.at(t), "leftFore"),
      ) <= 1e-6,
    );
  }
  const moved: number = Vector3.distance(
    hoof(hopping.at(hopping.duration), "leftHind"),
    hoof(stopped, "leftHind"),
  );
  TestValidator.predicate(
    `the hobbled horse hops forward (${moved} m)`,
    Math.abs(moved - 0.75) <= 0.05,
  );
  TestValidator.error(
    "a strap shorter than the fores stand apart is refused",
    () =>
      AutoMovieArchetypeEquineStance.after(horse, walked, [
        {
          kind: "hops",
          count: 1,
          length: 0.25,
          strap: apart - 0.05,
          from: halt + 0.5,
          entry: 1.5,
          hold: 0,
          exit: 0.5,
        },
      ]),
  );
}

/** A part's world origin in a sample. */
function world<Id extends string, D extends string>(
  sample: AutoMovieArchetypeRide.ISample<Id, D>,
  id: string,
): IAutoMovieVector3 {
  const part: IAutoMovieModelPart = sample.archetype.parts.find(
    (each: IAutoMovieModelPart): boolean => each.id === id,
  )!;
  return AutoMovieArchetypeFrame.compose(sample.placement, part.transform!)
    .translation;
}

/** A bar part's far end in the world: its frame's centre plus half its length along its axis. */
function tip(sample: Sample, id: string): IAutoMovieVector3 {
  const part: IAutoMovieModelPart = sample.archetype.parts.find(
    (each: IAutoMovieModelPart): boolean => each.id === id,
  )!;
  const frame: IAutoMovieTransform = AutoMovieArchetypeFrame.compose(
    sample.placement,
    part.transform!,
  );
  const length: number =
    part.geometry.type === "primitive" &&
    (part.geometry.shape.type === "capsule" ||
      part.geometry.shape.type === "cylinder")
      ? part.geometry.shape.height
      : NaN;
  return AutoMovieArchetypeFrame.compose(
    frame,
    AutoMovieArchetypeFrame.upright({ x: 0, y: length / 2, z: 0 }),
  ).translation;
}

/** Where a hobble's cuff closes on a fore cannon in the world: `AutoMovieArchetypeEquineHobble.ABOVE` up the cannon from its fetlock. */
function cuff(
  sample: Sample,
  limb: AutoMovieArchetypeQuadrupedBody.Limb,
): IAutoMovieVector3 {
  const id: string = AutoMovieArchetypeQuadrupedBody.BONES[limb][2];
  const fetlock: IAutoMovieVector3 = tip(sample, id);
  const middle: IAutoMovieVector3 = world(sample, id);
  return Vector3.addScaled(
    fetlock,
    Vector3.normalize(Vector3.subtract(middle, fetlock)),
    AutoMovieArchetypeEquineHobble.ABOVE,
  );
}

/** A limb's hoof endpoint in the world. */
function hoof(
  sample: Sample,
  limb: AutoMovieArchetypeQuadrupedBody.Limb,
): IAutoMovieVector3 {
  return tip(sample, AutoMovieArchetypeQuadrupedBody.BONES[limb][3]);
}

/** The distance from a point to a bar part's axis segment, world metres. */
function segmentDistance(
  at: IAutoMovieVector3,
  sample: Sample,
  id: string,
): number {
  const end: IAutoMovieVector3 = tip(sample, id);
  const middle: IAutoMovieVector3 = world(sample, id);
  const start: IAutoMovieVector3 = Vector3.subtract(
    Vector3.scale(middle, 2),
    end,
  );
  const axis: IAutoMovieVector3 = Vector3.subtract(end, start);
  const share: number = Math.max(
    0,
    Math.min(
      1,
      Vector3.dot(Vector3.subtract(at, start), axis) / Vector3.dot(axis, axis),
    ),
  );
  return Vector3.distance(at, Vector3.addScaled(start, axis, share));
}

/** The distance from a point to a segment, metres. */
function pointToSegment(
  at: IAutoMovieVector3,
  start: IAutoMovieVector3,
  end: IAutoMovieVector3,
): number {
  const axis: IAutoMovieVector3 = Vector3.subtract(end, start);
  const share: number = Math.max(
    0,
    Math.min(
      1,
      Vector3.dot(Vector3.subtract(at, start), axis) / Vector3.dot(axis, axis),
    ),
  );
  return Vector3.distance(at, Vector3.addScaled(start, axis, share));
}

/** A model-space point carried into the world by a placement. */
function point(
  placement: IAutoMovieTransform,
  local: IAutoMovieVector3,
): IAutoMovieVector3 {
  return AutoMovieArchetypeFrame.compose(
    placement,
    AutoMovieArchetypeFrame.upright(local),
  ).translation;
}

/** The unsigned angle between two floor directions, degrees. */
function angle(
  a: AutoMovieArchetypeEquineLunge.IPoint,
  b: AutoMovieArchetypeEquineLunge.IPoint,
): number {
  return (
    (Math.acos(
      Math.max(
        -1,
        Math.min(
          1,
          (a.x * b.x + a.z * b.z) /
            (Math.hypot(a.x, a.z) * Math.hypot(b.x, b.z)),
        ),
      ),
    ) *
      180) /
    Math.PI
  );
}
