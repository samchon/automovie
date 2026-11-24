import {
  type AutoMovieArchetypeEquineBank,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeQuadrupedBody,
  type AutoMovieArchetypeQuadrupedFooting,
  AutoMovieArchetypeQuadrupedJoints,
  AutoMovieArchetypeRefusal,
  createHorse,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieQuaternion,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { type HumanPerformance, HumanSignature } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../../internal/assertTakeClean";
import { equineBankStage } from "../../internal/equineBankStage";
import { equineFordRider } from "../../internal/equineFordRider";
import { equineFordScene } from "../../internal/equineFordScene";
import { motionHumanBody } from "../../internal/motionHumanBody";

/** The face: 31 degrees down over 4 m, steeper than its friction holds. */
const FACE: equineBankStage.IFace = { grade: -0.6, run: 4 };

/** The face's static hoof friction, authored. */
const FRICTION: number = 0.5;

/**
 * A sole on its surface: the hoof bar's lowest surface within this of the
 * plane, metres.
 */

/**
 * A sole standing on its surface, not lifting: within this of the plane,
 * metres, under a swing's first rise.
 */
const PLANTED: number = 0.001;

/**
 * The least turn of a hoof bar over a read interval that marks it rolling over
 * its toe rather than sliding, radians: authored, one degree.
 */
const ROLL: number = Math.PI / 180;
const SURFACE: number = 0.005;

/** The contact tolerance of the seated rider specs, metres. */
const TOLERANCE: number = 0.01;

/**
 * The least extra flexion at the stifle and the hock while sat, degrees: an
 * authored bound well under the sit's own pitch.
 */
const FLEXION: number = 5;

/**
 * The least nose-up pitch of the trunk against the face while sat, degrees: an
 * authored bound well under the technique's sit.
 */
const SAT: number = 10;

/** Seconds a rider's figure change takes. */
const TRANSFER: number = 0.4;

/**
 * The most a descending rider's trunk leans from upright in space, degrees:
 * authored, well inside the horse's pitch on the face.
 */
const UPRIGHT: number = 10;

/** The slide on the face, at a friction. */
const slide = (friction: number): AutoMovieArchetypeEquineBank.ISlide => ({
  kind: "bank-slide",
  friction,
  source: "authored",
  entry: 0.6,
  exit: 0.6,
});

/**
 * A horse slides down a steep bank sat on its haunches, its hinds sliding on
 * the face and its fores stepping, carrying its rider.
 *
 * Scenarios:
 *
 * 1. Through the sat interval each hind sole stays on the face (its lowest surface
 *    within 5 mm of the plane) and moves down it, while a fore sole standing on
 *    its surface (within 1 mm) through a 0.1 s interval (at each of its fifths)
 *    moves no more than 5 mm without turning by a degree (a hoof rolling over
 *    its toe turns): the slide is on the hinds only. Before the slide no hind
 *    sole on its surface through such an interval moves.
 * 2. Sat, each hind limb flexes at least 5 degrees more at the stifle and at the
 *    hock than when standing at the start, and the trunk pitches at least 10
 *    degrees nose-up against the face, read from the emitted bars.
 * 3. The ride's placement stays continuous onto the level foot, with no jump
 *    between reads 20 ms apart across the slide's end.
 * 4. A face steeper than the technique's bound, a face its friction holds, a slide
 *    without a run-out at its foot and one without authored footing are refused
 *    on the leg's `equineFootwork`.
 * 5. No hoof standing on its surface lands within its pastern's length of the
 *    face's concave foot, where the face meets the level ground below: the
 *    hoof's foothold, its terminal endpoint (its rig pastern along the bar from
 *    the fetlock) laid onto its plane, stays that far from the edge.
 * 6. A mounted rider in the descent seat keeps the seat socket within 10 mm of the
 *    saddle and the trunk within 10 degrees of upright in space through the
 *    slide, and the take passes the shipped take verdicts.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the scenarios and bounds.
 * @evidence contracts/development/testing.md#behavioral-verification Rides the public horse ride over authored footing and reads the emitted hoof, limb and trunk bars against the face, and a mounted rider's seat against the saddle; a hoof off the face, a fore that slides, unflexed hinds, an upright trunk, a jump at the foot or an admitted face out of bounds fails.
 * @evidence contracts/development/testing.md#independent-expectations The face is the authored plane; flexions are read against the same horse standing; the bounds are authored well under the technique's own sit.
 * @evidence contracts/development/testing.md#distinguishing-cases The slide on the hinds, the fores stepping, the run-out, four refusals and the carried rider; the climb belongs to test_archetype_equine_bank_scramble.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name.
 */
export function test_motion_mount_equine_bank_slide(): void {
  const horse: ReturnType<typeof createHorse> = createHorse(
    { withersHeight: 1.65, stirrupDrop: 0.575, tempo: 0 },
    8,
  );
  const ride: equineBankStage.Ride = equineBankStage.walk(
    horse,
    equineBankStage.course(FACE, slide(FRICTION)),
  );
  const read: equineBankStage.IReader = equineBankStage.read(ride, FACE);
  const start: number = read.cue("bankSlideStart");
  const sat: number = read.cue("bankSlideSat");
  const rise: number = read.cue("bankSlideRise");
  const end: number = read.cue("bankSlideEnd");
  const issues: string[] = [];

  // 1. The hinds slide on the face; the fores do not.
  const step: number = 0.1;
  /**
   * A hoof on its surface through a read interval, at each of its fifths, that
   * moves more than a sole's tolerance: a slide, not a liftoff or a touchdown.
   */
  const slides = (
    at: number,
    limb: AutoMovieArchetypeQuadrupedBody.Limb,
  ): boolean => {
    if (
      ![0, 0.25, 0.5, 0.75, 1].every(
        (share: number): boolean =>
          Math.abs(read.sole(at + share * step, limb)) <= PLANTED,
      )
    )
      return false;
    // A hoof rolling over its toe at breakover turns while its sole stays down; a slide carries it without turning.
    const turn = (when: number): IAutoMovieQuaternion =>
      AutoMovieArchetypeFrame.compose(
        ride.at(when).placement,
        read.part(when, AutoMovieArchetypeQuadrupedBody.BONES[limb][3])
          .transform!,
      ).rotation;
    const a: IAutoMovieQuaternion = turn(at);
    const b: IAutoMovieQuaternion = turn(at + step);
    const rolled: number =
      2 *
      Math.acos(
        Math.min(1, Math.abs(a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w)),
      );
    return (
      rolled < ROLL &&
      Vector3.distance(read.hoof(at, limb), read.hoof(at + step, limb)) >
        SURFACE
    );
  };
  for (let at: number = sat; at + step <= rise; at += step)
    for (const limb of AutoMovieArchetypeQuadrupedBody.LIMBS) {
      const here: number = read.sole(at, limb);
      if (!limb.endsWith("Fore")) {
        if (!(Math.abs(here) <= SURFACE))
          issues.push(`${limb} ${at.toFixed(2)}: sole ${here} m off the face`);
        if (!(read.hoof(at + step, limb).z > read.hoof(at, limb).z))
          issues.push(`${limb} ${at.toFixed(2)}: the hind does not slide down`);
      } else if (slides(at, limb))
        issues.push(`${limb} ${at.toFixed(2)}: a planted fore slides`);
    }
  for (let at: number = 0.5; at + step <= start; at += step)
    for (const limb of ["leftHind", "rightHind"] as const)
      if (slides(at, limb))
        issues.push(`${limb} ${at.toFixed(2)}: a hind slides before the face`);

  // 6. No standing hoof within its pastern's length of the face's concave foot.
  const foot: number = equineBankStage.APPROACH + FACE.run;
  const rig: ReturnType<typeof AutoMovieArchetypeQuadrupedJoints.read> =
    AutoMovieArchetypeQuadrupedJoints.read(horse.parts);
  const pasterns: Readonly<
    Record<AutoMovieArchetypeQuadrupedBody.Limb, number>
  > = {
    leftFore: Vector3.distance(rig.limbs.leftFore[3]!, rig.limbs.leftFore[4]!),
    rightFore: Vector3.distance(
      rig.limbs.rightFore[3]!,
      rig.limbs.rightFore[4]!,
    ),
    leftHind: Vector3.distance(rig.limbs.leftHind[3]!, rig.limbs.leftHind[4]!),
    rightHind: Vector3.distance(
      rig.limbs.rightHind[3]!,
      rig.limbs.rightHind[4]!,
    ),
  };
  for (let at: number = 0.5; at <= ride.duration; at += step)
    for (const limb of AutoMovieArchetypeQuadrupedBody.LIMBS) {
      if (!(Math.abs(read.sole(at, limb)) <= SURFACE)) continue;
      // The hoof's terminal endpoint lies its rig pastern along the bar from the fetlock.
      const [top, bottom] = equineFordScene.ends(
        read.part(at, AutoMovieArchetypeQuadrupedBody.BONES[limb][3]),
      );
      const reach: number = pasterns[limb];
      const endpoint: IAutoMovieVector3 = AutoMovieArchetypeFrame.point(
        ride.at(at).placement,
        Vector3.addScaled(
          top,
          Vector3.normalize(Vector3.subtract(bottom, top)),
          reach,
        ),
      );
      // Its foothold is the endpoint laid along its plane's normal onto the plane, where the hoof meets the footing.
      const plane: AutoMovieArchetypeQuadrupedFooting.IPlane = equineBankStage
        .planes(FACE)
        .find(
          (p: AutoMovieArchetypeQuadrupedFooting.IPlane): boolean =>
            endpoint.z >= p.z[0] && endpoint.z < p.z[1],
        )!;
      const normal: IAutoMovieVector3 = Vector3.normalize({
        x: -plane.slope.x,
        y: 1,
        z: -plane.slope.z,
      });
      const z: number = Vector3.addScaled(
        endpoint,
        normal,
        -Vector3.dot(normal, Vector3.subtract(endpoint, plane.origin)),
      ).z;
      if (Math.abs(z - foot) < reach - SURFACE)
        issues.push(
          `${limb} ${at.toFixed(2)}: stands ${Math.abs(z - foot)} m from the concave foot, within its ${reach} m pastern`,
        );
    }

  // 2. Flexion and pitch while sat.
  const bend = (at: number, upper: string, lower: string): number => {
    const axis = (id: string): IAutoMovieVector3 => {
      const [top, bottom] = equineFordScene.ends(read.part(at, id));
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
    const [femur, tibia, cannon] = AutoMovieArchetypeQuadrupedBody.BONES[limb];
    for (const [joint, upper, lower] of [
      ["stifle", femur, tibia],
      ["hock", tibia, cannon],
    ] as const) {
      const extra: number = bend(middle, upper, lower) - bend(0, upper, lower);
      if (!(extra >= FLEXION))
        issues.push(`${limb} ${joint} flexes only ${extra} degrees more sat`);
    }
  }
  const trunk: IAutoMovieTransform = AutoMovieArchetypeFrame.compose(
    ride.at(middle).placement,
    read.part(middle, "trunk").transform!,
  );
  const along: IAutoMovieVector3 = Quaternion.rotateVector(trunk.rotation, {
    x: 0,
    y: 1,
    z: 0,
  });
  const forward: IAutoMovieVector3 =
    along.z < 0 ? Vector3.scale(along, -1) : along;
  const pitch: number =
    (Math.atan2(forward.y, Math.hypot(forward.x, forward.z)) -
      Math.atan(FACE.grade)) *
    (180 / Math.PI);
  if (!(pitch >= SAT))
    issues.push(
      `the trunk pitches only ${pitch} degrees nose-up against the face`,
    );

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
  const refused: readonly [
    string,
    equineBankStage.IFace,
    number,
    boolean,
    boolean,
  ][] = [
    ["an over-steep face", { ...FACE, grade: -1.2 }, FRICTION, true, true],
    ["a face its friction holds", FACE, 0.7, true, true],
    ["a slide without a run-out", FACE, FRICTION, false, true],
    ["a slide without footing", FACE, FRICTION, true, false],
  ];
  for (const [label, face, friction, runOut, footing] of refused) {
    let refusal: unknown = null;
    try {
      equineBankStage.walk(
        horse,
        equineBankStage.course(face, slide(friction), runOut, footing),
      );
    } catch (error) {
      refusal = error;
    }
    if (
      !(
        refusal instanceof AutoMovieArchetypeRefusal &&
        refusal.axis === "legs[1].equineFootwork"
      )
    )
      issues.push(
        `${label} must be refused on legs[1]; got ${String(refusal)}`,
      );
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
        transfer: TRANSFER,
        hold:
          equineFordRider.WAIT +
          start -
          equineFordRider.settled(mounted, body) -
          TRANSFER,
        supports: equineFordRider.WADING,
      },
      {
        seat: "descent",
        transfer: TRANSFER,
        hold: end - start - TRANSFER,
        supports: equineFordRider.WADING,
      },
      {
        seat: "entered",
        transfer: TRANSFER,
        hold: mounted.halt - equineFordRider.WAIT - end - TRANSFER,
        supports: equineFordRider.WADING,
      },
    ]),
  );
  const reader: ReturnType<typeof HumanSignature> = HumanSignature(
    film,
    "rider",
    body,
    0,
  );
  for (const at of [sat, middle, rise].map(
    (seconds: number): number => equineFordRider.WAIT + seconds,
  )) {
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
    const lean: number = HumanSignature.trunk(reader, at);
    if (!(Math.abs(lean) <= UPRIGHT))
      issues.push(
        `rider ${at.toFixed(2)}: trunk ${lean} degrees from upright in space`,
      );
  }
  TestValidator.equals(
    "the horse slides down the bank on its haunches and carries its rider",
    issues,
    [],
  );
  assertTakeClean("the bank slide", film);
}
