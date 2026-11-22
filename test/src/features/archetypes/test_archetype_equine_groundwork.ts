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
 * 1. Lunged on an 8 m circle, the horse's displayed trunk leans toward the centre by the angle its measured speed and radius predict, atan(v² / g r), within Pfau et al.'s spread; it circles the other way after the change of rein on the same circle, and at each halt stands facing the centre.
 * 2. The lunge line runs from the handler's line hand to the halter on the head at every sample, never longer than the line, its length the halter's distance in from the hand.
 * 3. A circle tighter than the canter admits at its speed is refused, naming the radius.
 * 4. Tied to a ring, the horse's muzzle stays within the tether's reach of the knot; the lead hangs again from the halter after the untie; a head reach beyond the tether is refused.
 * 5. Hobbled, the horse hops forward with the strap never drawn past its length; a strap shorter than the fores stand apart is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names every scenario and what it checks.
 * @evidence contracts/development/testing.md#behavioral-verification Plays the public lunge, line, tie and hobble over public rides and reads displayed parts and spans.
 * @evidence contracts/development/testing.md#independent-expectations The lean is predicted from the root's measured speed and distance; the line, muzzle and strap are measured on displayed geometry.
 * @evidence contracts/development/testing.md#distinguishing-cases Walk, trot and canter, the two reins, tied versus loose, a strap that fits versus one that does not.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous in-memory scenario.
 */
export function test_archetype_equine_groundwork(): void {
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

  // 1. The lean, measured on the trunk over the middle of each work's constant speed.
  const spans: IStretch[] = [];
  let open: number | null = null;
  for (let t: number = 0.25; t < lunge.duration; t += 0.25) {
    const steady: boolean =
      lunge.plan.at(t).speed > 0 &&
      Math.abs(lunge.plan.at(t).speed - lunge.plan.at(t - 0.25).speed) < 1e-6;
    if (steady && open === null) open = t;
    if (!steady && open !== null) {
      if (t - open > 3) spans.push({ from: open, to: t });
      open = null;
    }
  }
  TestValidator.predicate(
    "the lunge has a steady stretch at each of its four works",
    spans.length >= 4,
  );
  const turning: number[] = [];
  for (const span of spans) {
    const middle: number = (span.from + span.to) / 2;
    let leaning: number = 0;
    let predicted: number = 0;
    const count: number = 8;
    for (let k: number = 0; k < count; ++k) {
      const t: number = middle - 0.5 + k / count;
      const h: number = 0.05;
      const speed: number =
        Vector3.distance(root(t + h), root(t - h)) / (2 * h);
      const at: IAutoMovieVector3 = root(t);
      const distance: number = Math.hypot(at.x - centre.x, at.z - centre.z);
      predicted +=
        (Math.atan((speed * speed) / (GRAVITY * distance)) * 180) / Math.PI;
      const sample: Sample = lunge.at(t);
      const trunk: IAutoMovieVector3 = world(sample, "trunk");
      const inward: IAutoMovieVector3 = Vector3.normalize({
        x: centre.x - at.x,
        y: 0,
        z: centre.z - at.z,
      });
      leaning +=
        (Math.atan2(
          Vector3.dot(Vector3.subtract(trunk, at), inward),
          trunk.y - at.y,
        ) *
          180) /
        Math.PI;
      const ahead: IAutoMovieVector3 = Vector3.subtract(
        root(t + h),
        root(t - h),
      );
      if (k === 0)
        turning.push(
          Math.sign((at.x - centre.x) * ahead.z - (at.z - centre.z) * ahead.x),
        );
    }
    TestValidator.predicate(
      `the trunk leans in ${leaning / count} degrees against the predicted ${predicted / count} at ${middle} s`,
      Math.abs(leaning / count - predicted / count) <= 2.5,
    );
  }
  TestValidator.predicate(
    "the horse circles the other way after the change of rein",
    turning[0] !== 0 && turning.at(-1) === -turning[0]!,
  );
  const rein2: number = lunge.instants.find((instant: Instant): boolean =>
    instant.label.startsWith("rein2:"),
  )!.seconds;
  for (let t: number = rein2; t < lunge.duration; t += 1)
    if (lunge.plan.at(t).speed > 0) {
      const at: IAutoMovieVector3 = root(t);
      TestValidator.predicate(
        `the second rein keeps to the circle at ${t} s`,
        Math.abs(Math.hypot(at.x - centre.x, at.z - centre.z) - radius) <= 0.2,
      );
    }
  for (const instant of lunge.instants.filter((each: Instant): boolean =>
    each.label.endsWith(":face"),
  )) {
    const sample: Sample = lunge.at(instant.seconds + 0.5);
    const trunk: IAutoMovieVector3 = world(sample, "trunk");
    const head: IAutoMovieVector3 = world(sample, "head");
    const facing: number = angle(
      { x: head.x - trunk.x, z: head.z - trunk.z },
      { x: centre.x - trunk.x, z: centre.z - trunk.z },
    );
    TestValidator.predicate(
      `the halted horse faces the handler within 15 degrees (${facing}) at ${instant.label}`,
      facing <= 15,
    );
  }

  // 2. The line, from the line hand to the halter.
  const hand: AutoMovieArchetypeEquineLungeLine.IHand = {
    height: 1.05,
    reach: 0.4,
    spread: 0.2,
  };
  const length: number = 9.14;
  const lined: Ride = AutoMovieArchetypeEquineLungeLine.layer(
    lunge,
    "lead",
    centre,
    "left",
    hand,
    length,
  );
  const headPart: IAutoMovieModelPart = horse.parts.find(
    (part: IAutoMovieModelPart): boolean => part.id === "head",
  )!;
  const headRadius: number =
    headPart.geometry.type === "primitive" &&
    headPart.geometry.shape.type === "capsule"
      ? headPart.geometry.shape.radius
      : NaN;
  for (let t: number = 0; t <= lined.duration; t += 0.5) {
    const sample: Sample = lined.at(t);
    const state: AutoMovieArchetypeSpan.IState = sample.archetype.span("lead");
    const from: IAutoMovieVector3 = point(sample.placement, state.from);
    const to: IAutoMovieVector3 = point(sample.placement, state.to);
    const at: IAutoMovieVector3 = sample.placement.translation;
    const out: IAutoMovieVector3 = Vector3.normalize({
      x: at.x - centre.x,
      y: 0,
      z: at.z - centre.z,
    });
    const expected: IAutoMovieVector3 = {
      x: centre.x + out.x * hand.reach + out.z * hand.spread,
      y: hand.height,
      z: centre.z + out.z * hand.reach - out.x * hand.spread,
    };
    const held: IAutoMovieVector3 = lined.frame("lead", t).translation;
    TestValidator.predicate(
      `the line's held run is at the line hand at ${t} s`,
      Vector3.distance(held, expected) <= 1e-6,
    );
    TestValidator.predicate(
      `the line runs through the line hand at ${t} s`,
      pointToSegment(held, from, to) <= 1e-6,
    );
    TestValidator.predicate(
      `the line meets the halter on the head at ${t} s`,
      segmentDistance(to, sample, "head") <= headRadius + 0.05,
    );
    TestValidator.predicate(
      `the line (${state.length} m) is within its length at ${t} s`,
      state.length <= length,
    );
    if (lined.plan.at(t).speed > 0) {
      const inward: number =
        Math.hypot(to.x - centre.x, to.z - centre.z) - hand.reach;
      TestValidator.predicate(
        `the line's length ${state.length} m matches the halter's ${inward} m in from the hand at ${t} s`,
        Math.abs(state.length - inward) <=
          hand.spread + Math.abs(to.y - hand.height) + 0.05,
      );
    }
  }

  // 3. An over-tight circle.
  const canter: ReturnType<typeof AutoMovieArchetypeQuadrupedGait.range> =
    AutoMovieArchetypeQuadrupedGait.range(
      createQuadruped.species(horse),
      "canter",
      1.6,
    );
  TestValidator.error(
    "a circle tighter than the canter admits is refused",
    () => {
      try {
        AutoMovieArchetypeEquineLunge.ride(horse, {
          centre,
          radius: 2,
          bearing: 0,
          acceleration: 1,
          turn: 3,
          face: 0,
          reins: [
            {
              side: "left",
              work: [{ gait: "canter", laps: 1, speed: canter.minimum + 0.05 }],
            },
          ],
        });
      } catch (error) {
        if (
          error instanceof AutoMovieArchetypeRefusal &&
          error.axis === "radius"
        )
          throw error;
        throw new Error(`refused for another reason: ${String(error)}`);
      }
    },
  );

  // 4. Tied to a ring and untied.
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

  // 5. Hobbled.
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
    AutoMovieArchetypeEquineHobble.ride(
      createHobble(
        cannon.geometry.type === "primitive" &&
          (cannon.geometry.shape.type === "capsule" ||
            cannon.geometry.shape.type === "cylinder")
          ? cannon.geometry.shape.radius
          : NaN,
        { strap },
      ),
      hopping,
    );
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
