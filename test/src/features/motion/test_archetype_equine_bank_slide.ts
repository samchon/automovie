import {
  ArchetypeFrame,
  ArchetypeRefusal,
  QuadrupedBody,
  type QuadrupedFooting,
  createHorse,
  rideHorse,
  type rideQuadruped,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieMotionHumanBody,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { type HumanPerformance, HumanSignature } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../internal/assertTakeClean";
import { equineFordRider } from "../internal/equineFordRider";
import { equineFordScene } from "../internal/equineFordScene";
import { motionHumanBody } from "../internal/motionHumanBody";

/** A horse ride along a course. */
type Ride = ReturnType<typeof rideHorse>;

/** The level top before the face, metres along +Z. */
const TOP: number = 3;

/** The face's run, metres. */
const RUN: number = 4;

/** The face's grade, rise over run: 31 degrees, steeper than the face's friction holds. */
const GRADE: number = 0.6;

/** The face's static hoof friction, authored. */
const FRICTION: number = 0.5;

/** A sole on its surface: the hoof bar's lowest surface within this of the plane, metres. */
const SURFACE: number = 0.005;

/** The contact tolerance of the seated rider specs, metres. */
const TOLERANCE: number = 0.01;

/** The least extra flexion at the stifle and the hock while sat, degrees: an authored bound well under the sit's own pitch. */
const FLEXION: number = 5;

/** The least nose-up pitch of the trunk against the face while sat, degrees: an authored bound well under the technique's sit. */
const SAT: number = 10;

/** The footing: a level top, the face and a level foot. */
const planes = (grade: number): QuadrupedFooting.IPlane[] => [
  {
    id: "top",
    origin: { x: 0, y: 0, z: TOP },
    x: [-6, 6],
    z: [-6, TOP],
    slope: { x: 0, z: 0 },
  },
  {
    id: "face",
    origin: { x: 0, y: 0, z: TOP },
    x: [-6, 6],
    z: [TOP, TOP + RUN],
    slope: { x: 0, z: -grade },
  },
  {
    id: "foot",
    origin: { x: 0, y: -grade * RUN, z: TOP + RUN },
    x: [-6, 6],
    z: [TOP + RUN, TOP + RUN + 30],
    slope: { x: 0, z: 0 },
  },
];

/** The course: the top, the slid face and a run-out. */
const course = (
  grade: number,
  friction: number,
  runOut: boolean = true,
  footing: boolean = true,
): rideQuadruped.ICourse => ({
  start: { x: 0, z: 0, heading: 0 },
  cruise: 1.2,
  startSpeed: 0,
  endSpeed: 0,
  acceleration: 0.5,
  deceleration: 0.5,
  startFromStanding: true,
  ...(footing ? { footing: { planes: planes(grade) } } : {}),
  legs: [
    { kind: "straight", length: TOP },
    {
      kind: "straight",
      length: RUN,
      rise: -grade * RUN,
      equineFootwork: {
        kind: "bank-slide",
        friction,
        source: "authored",
        entry: 0.8,
        exit: 0.8,
      },
    },
    ...(runOut
      ? [{ kind: "straight", length: 4 } satisfies rideQuadruped.ILeg]
      : []),
  ],
});

/**
 * A horse slides down a steep bank sat on its haunches, its hinds sliding on the face and its fores walking, carrying its rider.
 *
 * Scenarios:
 * 1. Through the sat interval each hind sole stays on the face (its lowest surface within 5 mm of the plane) and moves down the face, while a fore sole on its surface between two reads stays put (within 5 mm): the slide is on the hinds only. Before the slide no hind sole moves while on its surface.
 * 2. Sat, each hind limb flexes at least 5 degrees more at the stifle and at the hock than when standing at the start, and the trunk pitches at least 10 degrees nose-up against the face, read from the emitted bars.
 * 3. The ride's placement stays continuous onto the level foot, with no jump between reads 20 ms apart across the slide's end.
 * 4. A face steeper than the technique's bound, a face its friction holds, a slide without a run-out at its foot and one without authored footing are refused on the leg's `equineFootwork`.
 * 5. A mounted rider's seat socket stays within 10 mm of the saddle through the slide, and the take passes the shipped take verdicts.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the scenarios and bounds.
 * @evidence contracts/development/testing.md#behavioral-verification Rides the public horse ride over authored footing and reads the emitted hoof, limb and trunk bars against the face, and a mounted rider's seat against the saddle; a hoof off the face, a fore that slides, unflexed hinds, an upright trunk, a jump at the foot or an admitted face out of bounds fails.
 * @evidence contracts/development/testing.md#independent-expectations The face is the authored plane; flexions are read against the same horse standing; the bounds are authored well under the technique's own sit.
 * @evidence contracts/development/testing.md#distinguishing-cases The slide on the hinds, the fores stepping, the run-out, four refusals and the carried rider.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name.
 */
export function test_archetype_equine_bank_slide(): void {
  const horse: equineFordRider.Horse = createHorse(
    { withersHeight: 1.65, stirrupDrop: 0.575, tempo: 0 },
    8,
  );
  const ride: Ride = ride_(course(GRADE, FRICTION));
  const cue = (label: string): number => {
    for (const instant of ride.instants)
      if (instant.label === label) return instant.seconds;
    throw new Error(`The ride has no ${label} cue`);
  };
  const sat: number = cue("bankSlideSat");
  const rise: number = cue("bankSlideRise");
  const start: number = cue("bankSlideStart");
  const end: number = cue("bankSlideEnd");
  const face: QuadrupedFooting.IPlane = planes(GRADE)[1]!;
  const issues: string[] = [];
  const part = (at: number, id: string): IAutoMovieModelPart =>
    ride
      .at(at)
      .archetype.parts.find((p: IAutoMovieModelPart): boolean => p.id === id)!;
  const sole = (at: number, limb: QuadrupedBody.Limb): number =>
    equineFordScene.separation(
      part(at, QuadrupedBody.BONES[limb][3]),
      ride.at(at).placement,
      plane(ride.at(at).placement, limb, at),
    );
  const hoof = (at: number, limb: QuadrupedBody.Limb): IAutoMovieVector3 =>
    ArchetypeFrame.compose(
      ride.at(at).placement,
      part(at, QuadrupedBody.BONES[limb][3]).transform!,
    ).translation;
  /** The authored plane under a hoof. */
  function plane(
    placement: IAutoMovieTransform,
    limb: QuadrupedBody.Limb,
    at: number,
  ): QuadrupedFooting.IPlane {
    const z: number = ArchetypeFrame.compose(
      placement,
      part(at, QuadrupedBody.BONES[limb][3]).transform!,
    ).translation.z;
    return planes(GRADE).find(
      (p: QuadrupedFooting.IPlane): boolean => z >= p.z[0] && z < p.z[1],
    )!;
  }

  // 1. The hinds slide on the face; the fores do not.
  const step: number = 0.1;
  for (let at: number = sat; at + step <= rise; at += step) {
    for (const limb of QuadrupedBody.LIMBS) {
      const fore: boolean = limb.endsWith("Fore");
      const here: number = sole(at, limb);
      const there: number = sole(at + step, limb);
      if (!fore) {
        if (!(Math.abs(here) <= SURFACE))
          issues.push(`${limb} ${at.toFixed(2)}: sole ${here} m off the face`);
        if (!(hoof(at + step, limb).z > hoof(at, limb).z))
          issues.push(`${limb} ${at.toFixed(2)}: the hind does not slide down`);
      } else if (
        Math.abs(here) <= SURFACE &&
        Math.abs(there) <= SURFACE &&
        Vector3.distance(hoof(at, limb), hoof(at + step, limb)) > SURFACE
      )
        issues.push(`${limb} ${at.toFixed(2)}: a planted fore slides`);
    }
  }
  for (let at: number = 0.5; at + step <= start; at += step)
    for (const limb of ["leftHind", "rightHind"] as const)
      if (
        Math.abs(sole(at, limb)) <= SURFACE &&
        Math.abs(sole(at + step, limb)) <= SURFACE &&
        Vector3.distance(hoof(at, limb), hoof(at + step, limb)) > SURFACE
      )
        issues.push(`${limb} ${at.toFixed(2)}: a hind slides before the face`);

  // 2. Flexion and pitch while sat.
  const bend = (at: number, upper: string, lower: string): number => {
    const axis = (id: string): IAutoMovieVector3 => {
      const [top, bottom] = equineFordScene.ends(part(at, id));
      return Vector3.normalize(Vector3.subtract(bottom, top));
    };
    return (
      (Math.acos(
        Math.max(-1, Math.min(1, Vector3.dot(axis(upper), axis(lower)))),
      ) *
        180) /
      Math.PI
    );
  };
  const middle: number = (sat + rise) / 2;
  for (const limb of ["leftHind", "rightHind"] as const) {
    const [femur, tibia, cannon] = QuadrupedBody.BONES[limb];
    for (const [joint, upper, lower] of [
      ["stifle", femur, tibia],
      ["hock", tibia, cannon],
    ] as const) {
      const extra: number =
        bend(middle, upper, lower) - bend(0, upper, lower);
      if (!(extra >= FLEXION))
        issues.push(`${limb} ${joint} flexes only ${extra} degrees more sat`);
    }
  }
  const trunk: IAutoMovieTransform = ArchetypeFrame.compose(
    ride.at(middle).placement,
    part(middle, "trunk").transform!,
  );
  const along: IAutoMovieVector3 = Quaternion.rotateVector(trunk.rotation, {
    x: 0,
    y: 1,
    z: 0,
  });
  const axis: IAutoMovieVector3 =
    Vector3.dot(along, { x: 0, y: 0, z: 1 }) < 0
      ? Vector3.scale(along, -1)
      : along;
  const pitch: number =
    (Math.atan2(axis.y, Math.hypot(axis.x, axis.z)) +
      Math.atan(-face.slope.z)) *
    (180 / Math.PI);
  if (!(pitch >= SAT))
    issues.push(`the trunk pitches only ${pitch} degrees nose-up against the face`);

  // 3. Continuous onto the foot.
  for (const at of [end - 0.02, end, end + 0.02]) {
    const jump: number = Vector3.distance(
      ride.at(at).placement.translation,
      ride.at(at + 0.02).placement.translation,
    );
    if (!(jump <= 0.06))
      issues.push(`the body jumps ${jump} m at ${at.toFixed(2)}`);
  }

  // 4. Refusals.
  for (const [label, built] of [
    ["an over-steep face", (): unknown => ride_(course(1.2, FRICTION))],
    ["a face its friction holds", (): unknown => ride_(course(GRADE, 0.7))],
    [
      "a slide without a run-out",
      (): unknown => ride_(course(GRADE, FRICTION, false)),
    ],
    [
      "a slide without footing",
      (): unknown => ride_(course(GRADE, FRICTION, true, false)),
    ],
  ] as const) {
    let refusal: unknown = null;
    try {
      built();
    } catch (error) {
      refusal = error;
    }
    if (
      !(
        refusal instanceof ArchetypeRefusal &&
        refusal.axis === "legs[1].equineFootwork"
      )
    )
      issues.push(`${label} must be refused on legs[1]; got ${String(refusal)}`);
  }

  // 5. The carried rider.
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-tall");
  const mounted: equineFordRider.IMount = equineFordRider.carry(
    horse,
    (seconds: number): equineFordRider.IInstant => ride.at(seconds),
    ride.duration,
    0,
  );
  const film: HumanPerformance = equineFordRider.perform(
    mounted,
    body,
    equineFordRider.mount(mounted, [
      {
        seat: "entered",
        transfer: 0.4,
        seconds:
          mounted.halt - equineFordRider.settled(mounted, body) - 0.4,
        supports: equineFordRider.WADING,
      },
    ]),
  );
  const reader: ReturnType<typeof HumanSignature.of> = HumanSignature.of(
    film,
    "rider",
    body,
    0,
  );
  for (const at of [
    equineFordRider.WAIT + sat,
    equineFordRider.WAIT + middle,
    equineFordRider.WAIT + rise,
  ]) {
    const saddle: IAutoMovieTransform = mounted.part("seat", at);
    const gap: number = Math.abs(
      Quaternion.rotateVector(
        Quaternion.inverse(saddle.rotation),
        Vector3.subtract(
          HumanSignature.region(reader, "seat", at),
          saddle.translation,
        ),
      ).y,
    );
    if (!(gap <= TOLERANCE))
      issues.push(
        `rider ${at.toFixed(2)}: seat ${(gap * 1000).toFixed(1)} mm from the saddle`,
      );
  }
  TestValidator.equals(
    "the horse slides down the bank on its haunches and carries its rider",
    issues,
    [],
  );
  assertTakeClean("the bank slide", film);

  /** The horse's walk over a course. */
  function ride_(authored: rideQuadruped.ICourse): Ride {
    return rideHorse(horse, authored, "walk");
  }
}
