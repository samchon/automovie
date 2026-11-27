import { AutoMovieEngineKinematics, Quaternion } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanBalance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAcrobatics,
  AutoMovieMotionHumanStance,
} from "@automovie/motions";
import {
  AutoMovieMotionClock,
  AutoMovieMotionHumanTrunk,
  HumanBalance,
  HumanFoot,
  poseBones,
  resolveHumanPosture,
} from "@automovie/motions/internal";

import type { motionComplaints } from "./motionComplaints";
import { motionHumanBody } from "./motionHumanBody";

/**
 * The trunk phrases of `AutoMovieMotionHumanTrunk` read on each of the selected
 * rigs. The counterbalance uses the same clock and stance.
 *
 * Every expectation is read on the displayed bones the resolver gives for the
 * written posture. A foot's plant is the ball of the foot, the toes' joint: the
 * stance's leg goal holds its contact there (`stand.legs`), and the heel may
 * rise about it when the shank leans past the ankle's range
 * (`HumanFoot.heelOff`), so the toes bone is read and not the ankle. The clock
 * has `ready` at 0.25 s, `relax` at 1 s and `end` at 1.25 s; a phrase rises
 * from `start` to `ready` and falls from `relax` to `end`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is read, which point a plant is and the clock; each function states its scenarios and bounds.
 * @evidence contracts/development/implementation.md#principled-implementation Reads the resolver's bones and the balance owner's measures for written postures.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One function per phrase family collects geometry findings in its owning test's gatherer.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every failing cell is named with its body, its parameters and its measured numbers.
 * @evidence contracts/development/implementation.md#efficient-algorithms One body per call; the solved postures each function states.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The owning tests use the same geometric reading for both body sizes.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The postures live as long as the call; the body is the shared fixture's.
 */
export namespace motionComposeTrunk {
  type Bones = Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;

  /**
   * A turn of the trunk on the pelvis and a posture sunk into its knees, on one
   * body. A turn of `d` degrees shows as the chest's forward axis `d` degrees
   * to the left of the pelvis's, the lumbar spine having taken `1 - CHEST` of
   * it. A sunk posture shows the hips bone lower by the depth and back by the
   * distance asked, the chest's long axis inclined forward by the inclination,
   * and both feet on their plants.
   *
   * Scenarios:
   *
   * 1. `turn` by 30 and by -20 degrees claims the trunk, turns the chest by the
   *    degrees (within 1) and the spine by its share at the full instants,
   *    leaves the pelvis, and is gone at both ends.
   * 2. `sunk` has independent small/deep drops, trunk inclination and hip
   *    retraction, and a case combining their limits. At 0 and 90 degrees the
   *    case puts the hips there within a micrometre, inclines the chest by the
   *    inclination (within 0.5 degrees), and keeps both feet on their plants
   *    within 1 mm.
   *
   * @param name The body.
   */
  export function turnAndSink(
    name: motionHumanBody.Name,
    all: motionComplaints.IGatherer,
  ): void {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    const bones = (posture: IAutoMovieMotionHumanPosture): Bones =>
      poseBones(body, resolveHumanPosture(body, posture));
    // Degrees a bone's forward axis points to the left of world +Z.
    const facing = (pose: Bones, bone: AutoMovieHumanoidBone): number => {
      const f: IAutoMovieVector3 = axis(pose, bone, { x: 0, y: 0, z: 1 });
      return Math.atan2(f.x, f.z) * DEG;
    };
    // Degrees a bone's long axis tips ahead of world +Y along a heading.
    const tipped = (
      pose: Bones,
      bone: AutoMovieHumanoidBone,
      yaw: number,
    ): number => {
      const u: IAutoMovieVector3 = axis(pose, bone, { x: 0, y: 1, z: 0 });
      return Math.atan2(yaw === 90 ? u.x : u.z, u.y) * DEG;
    };
    const standing: IAutoMovieMotionHumanPosture =
      AutoMovieMotionHumanStance.stand.posture(body, ORIGIN, 0);
    const upright: Bones = bones(standing);
    const hips: IAutoMovieVector3 = upright.get("hips")!.worldPosition;
    const hipHeight: number = body.measure.hipHeight;

    // 1. A turn of the trunk on the pelvis.
    for (const degrees of [30, -20] as const) {
      const turn: IAutoMovieMotionHumanPrimitive =
        AutoMovieMotionHumanTrunk.turn(CLOCK, RISE, FALL, degrees);
      all.equals(
        `${name}: a turn of ${degrees} claims the trunk`,
        turn.channels,
        ["trunk"],
      );
      for (const seconds of [0.25, 0.625, 1] as const) {
        const pose: Bones = bones(turn.write(standing, seconds));
        const chest: number = facing(pose, "chest");
        const spine: number = facing(pose, "spine");
        all.check(
          `${name}: a turn of ${degrees} at ${seconds} s turns the chest by it and the spine by its share, chest ${chest.toFixed(2)} spine ${spine.toFixed(2)} pelvis ${facing(pose, "hips").toFixed(2)}`,
          Math.abs(chest - degrees) <= 1 &&
            Math.abs(spine - (1 - AutoMovieMotionHumanTrunk.CHEST) * degrees) <=
              1 &&
            Math.abs(facing(pose, "hips")) <= 1e-6 &&
            gap(pose.get("hips")!.worldPosition, hips) <= 1e-9,
        );
      }
      for (const seconds of [0, 1.25] as const) {
        const chest: number = facing(
          bones(turn.write(standing, seconds)),
          "chest",
        );
        all.check(
          `${name}: a turn of ${degrees} is gone at ${seconds} s, chest ${chest.toFixed(3)}`,
          Math.abs(chest - facing(upright, "chest")) <= 1e-6,
        );
      }
    }

    // 2. A posture sunk into its knees.
    for (const yaw of [0, 90] as const) {
      const turned: IAutoMovieMotionHumanPosture =
        AutoMovieMotionHumanStance.stand.posture(body, ORIGIN, yaw);
      const base: Bones = bones(turned);
      const was: IAutoMovieVector3 = base.get("hips")!.worldPosition;
      for (const [share, inclination, back] of [
        [0.1, 0, 0],
        [0.3, 20, 0],
        [0.1, 0, 0.06],
        [0.3, 45, 0.06],
      ] as const) {
        const cell: string = `${name}: sunk by ${share} hip heights, inclined ${inclination}, ${back * 1000} mm back, heading ${yaw}`;
        const pose: Bones = bones(
          AutoMovieMotionHumanTrunk.sunk(
            body,
            turned,
            share * hipHeight,
            inclination,
            back,
          ),
        );
        const off: number = gap(pose.get("hips")!.worldPosition, {
          x: was.x - (yaw === 90 ? back : 0),
          y: was.y - share * hipHeight,
          z: was.z - (yaw === 0 ? back : 0),
        });
        const inclined: number =
          tipped(pose, "chest", yaw) - tipped(base, "chest", yaw);
        all.check(
          `${cell}: the hips are there, off by ${mm(off)} mm`,
          off <= 1e-6,
        );
        all.check(
          `${cell}: the chest is inclined by ${inclined.toFixed(2)} degrees`,
          Math.abs(inclined - inclination) <= 0.5,
        );
        all.check(
          `${cell}: both feet keep their plants, the farther ball off by ${mm(slip(pose, base))} mm`,
          slip(pose, base) <= 0.001,
        );
      }
    }
  }

  /**
   * The trunk's crouch on one body: the hips sink and the trunk inclines over
   * them, the body stands again, and the feet and the balance hold all the way.
   * At full depth, the opted-in balance uses the smallest root shift that holds
   * the mass centre over the actual bearing hull. The zero-share and
   * intermediate poses keep the same geometric and support checks.
   *
   * Scenarios:
   *
   * 1. `crouch` refuses a negative or non-numeric depth or pitch.
   * 2. For depths of 0, 0.15 and 0.3 hip heights and pitches of 0 and 30 degrees
   *    it claims the root, the trunk and both legs from its first to its last
   *    instant, leaves the standing body at both ends, is at its depth and its
   *    pitch between `ready` and `relax`, and sinks only part of the way at the
   *    middle of its rise.
   * 3. At every sampled second both feet keep their plants within 1 mm and the
   *    body keeps its balance.
   * 4. Given the standing posture written by joint angles alone, with no leg goal
   *    (as an exercise of keyed angles leaves it), a crouch of 0.3 hip heights
   *    and 30 degrees keeps both feet on their plants within 1 mm at every
   *    sampled second: the crouch plants the legs itself.
   *
   * @param name The body.
   */
  export function crouch(
    name: motionHumanBody.Name,
    all: motionComplaints.IGatherer,
  ): void {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    const bones = (posture: IAutoMovieMotionHumanPosture): Bones =>
      poseBones(body, resolveHumanPosture(body, posture));
    // Degrees the chest's long axis tips ahead of world +Y.
    const tipped = (pose: Bones): number => {
      const u: IAutoMovieVector3 = axis(pose, "chest", { x: 0, y: 1, z: 0 });
      return Math.atan2(u.z, u.y) * DEG;
    };
    const standing: IAutoMovieMotionHumanPosture =
      AutoMovieMotionHumanStance.stand.posture(body, ORIGIN, 0);
    const upright: Bones = bones(standing);
    const hips: IAutoMovieVector3 = upright.get("hips")!.worldPosition;
    const hipHeight: number = body.measure.hipHeight;
    const phraseOf = (
      depth: number,
      pitch: number,
      balance?: IAutoMovieMotionHumanBalance,
    ): IAutoMovieMotionHumanPrimitive =>
      AutoMovieMotionHumanTrunk.crouch({
        balance,
        body,
        standing,
        clock: CLOCK,
        rise: RISE,
        fall: FALL,
        depth,
        pitch,
      });

    // Depth and pitch are admitted before the body is read.
    if (name === "f-small")
      for (const [depth, pitch] of [
        [-0.01, 0],
        [0.1, -1],
        [Number.NaN, 0],
        [0.1, Number.NaN],
      ] as const)
        all.refuses(
          `${name}: a crouch of depth ${depth} and pitch ${pitch} is refused`,
          (): void => {
            phraseOf(depth, pitch);
          },
        );

    // 2 and 3. The crouch over its clock.
    for (const [share, pitch] of [
      [0, 0],
      [0, 30],
      [0.15, 0],
      [0.3, 0],
      [0.3, 30],
    ] as const) {
      const cell: string = `${name}: a crouch of ${share} hip heights and ${pitch} degrees`;
      const depth: number = share * hipHeight;
      const phrase: IAutoMovieMotionHumanPrimitive = phraseOf(
        depth,
        pitch,
        BALANCE,
      );
      const unshifted: IAutoMovieMotionHumanPosture = phraseOf(
        depth,
        pitch,
      ).write(standing, 0.625);
      const unshiftedMargin: number = HumanBalance.margin(body, unshifted);
      all.equals(
        `${cell} claims the root and the trunk over its instants`,
        [phrase.channels, phrase.from, phrase.to],
        [["root", "trunk", "leftLeg", "rightLeg"], 0, 1.25],
      );
      const times: number[] = [0, 0.125, 0.25, 0.625, 1, 1.125, 1.25];
      // The clock is independent of body shape. At the acceleration
      // extrema of the minimum-jerk quintic the linear and eased shares
      // separate; at the midpoint alone they are indistinguishable.
      if (name === "f-small" && share === 0.3 && pitch === 30) {
        const u: number = (3 - Math.sqrt(3)) / 6;
        times.push(0.25 * u, 1 + 0.25 * (1 - u));
      }
      for (const seconds of times) {
        const written: IAutoMovieMotionHumanPosture = phrase.write(
          standing,
          seconds,
        );
        const pose: Bones = bones(written);
        const sunk: number = hips.y - pose.get("hips")!.worldPosition.y;
        const inclined: number = tipped(pose) - tipped(upright);
        const margin: number =
          AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassMargin(
            AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassPlace(
              body.massModel,
              pose,
            ),
            HumanFoot.base(body, pose),
          );
        const at: string = `${cell} at ${seconds} s`;
        if (seconds === 0 || seconds === 1.25)
          all.check(
            `${at} stands as before, hips off by ${mm(gap(pose.get("hips")!.worldPosition, hips))} mm`,
            gap(pose.get("hips")!.worldPosition, hips) <= 1e-6 &&
              Math.abs(inclined) <= 1e-6,
          );
        else {
          const u: number = Math.min(
            1,
            seconds / 0.25,
            (1.25 - seconds) / 0.25,
          );
          const eased: number = u ** 3 * (10 - 15 * u + 6 * u ** 2);
          all.check(
            `${at} sinks ${mm(sunk)} mm and inclines ${inclined.toFixed(2)}°, expected ${mm(depth * eased)} mm and ${(pitch * eased).toFixed(2)}°`,
            Math.abs(sunk - depth * eased) <= 1e-6 &&
              Math.abs(inclined - pitch * eased) <= 0.5,
          );
        }
        const drift: number = slip(pose, upright);
        all.check(
          `${at} keeps both feet on their plants, the farther ball off by ${mm(drift)} mm`,
          drift <= 0.001,
        );
        if (seconds === 0.625)
          minimumSupportShift(
            all,
            at,
            unshiftedMargin,
            margin,
            unshifted.root.z - written.root.z,
            (back: number): number =>
              HumanBalance.margin(body, {
                ...unshifted,
                root: { ...unshifted.root, z: unshifted.root.z - back },
              }),
          );
        else
          all.check(
            `${at} keeps the centre of mass over the bearing hull, with a margin of ${mm(margin)} mm`,
            margin >= 0,
          );
      }
    }

    // 4. A standing posture of joint angles alone.
    const angles: IAutoMovieMotionHumanPosture =
      AutoMovieMotionHumanAcrobatics.GymnasticsFlight.frozen(body, standing);
    const bare: IAutoMovieMotionHumanPrimitive =
      AutoMovieMotionHumanTrunk.crouch({
        body: withoutMass(body),
        standing: angles,
        clock: CLOCK,
        rise: RISE,
        fall: FALL,
        depth: 0.3 * hipHeight,
        pitch: 30,
      });
    for (const seconds of [0, 0.125, 0.25, 0.625, 1, 1.125, 1.25]) {
      const pose: Bones = bones(bare.write(angles, seconds));
      all.check(
        `${name}: a crouch from joint angles alone at ${seconds} s keeps both feet on their plants, the farther ball off by ${mm(slip(pose, upright))} mm`,
        slip(pose, upright) <= 0.001,
      );
    }
  }

  /** Degrees per radian. */
  const DEG: number = 180 / Math.PI;

  /** Opt the primitives into hip balance across the whole authored phrase. */
  export const BALANCE: IAutoMovieMotionHumanBalance = {
    by: "hips",
    from: { event: "start" },
    to: { event: "end" },
  };

  /** Let a primitive read every geometric property and fail on any mass access. */
  export function withoutMass(
    body: IAutoMovieMotionHumanBody,
  ): IAutoMovieMotionHumanBody {
    return {
      ...body,
      get massModel(): IAutoMovieMotionHumanBody["massModel"] {
        throw new Error(
          "Balance is absent, so this primitive does not read mass",
        );
      },
    };
  }

  /**
   * Compare the actual shift with a closer feasible candidate along its
   * prescribed axis.
   */
  export function minimumSupportShift(
    all: motionComplaints.IGatherer,
    cell: string,
    before: number,
    after: number,
    shift: number,
    marginAt: (shift: number) => number,
  ): void {
    all.check(
      `${cell}: the mass centre stays over the bearings, margin ${mm(after)} mm`,
      after >= 0,
    );
    if (before >= 0) {
      all.check(
        `${cell}: a supported pose moves ${mm(shift)} mm`,
        Math.abs(shift) <= 1e-9,
      );
      return;
    }
    // A one-step retreat along the shift must lose the bearing hull, within
    // the balance solver's stated spatial resolution of half a millimetre.
    const nearer: number =
      Math.sign(shift) * Math.max(0, Math.abs(shift) - HumanBalance.TOLERANCE);
    const margin: number = marginAt(nearer);
    all.check(
      `${cell}: ${mm(shift)} mm shifts from a ${mm(before)} mm margin, and the closer ${mm(nearer)} mm shift has a ${mm(margin)} mm margin`,
      shift !== 0 && margin < 0,
    );
  }

  /** The phrases' clock: `ready` at 0.25 s, `relax` at 1 s and `end` at 1.25 s. */
  export const CLOCK: IAutoMovieMotionClock = AutoMovieMotionClock.phrase({
    prepare: 0.25,
    wait: 0.125,
    attack: 0.25,
    follow: 0.25,
    hold: 0.125,
    retract: 0.25,
  });

  /** The phrases' rise. */
  export const RISE: readonly ["start", "ready"] = ["start", "ready"];

  /** The phrases' fall. */
  export const FALL: readonly ["relax", "end"] = ["relax", "end"];

  /** The stance's place. */
  export const ORIGIN: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };

  /** The distance between two points, metres. */
  export function gap(a: IAutoMovieVector3, b: IAutoMovieVector3): number {
    return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  }

  /** Metres written as millimetres. */
  export function mm(metres: number): string {
    return (metres * 1000).toFixed(2);
  }

  /** A bone's axis in the world. */
  function axis(
    pose: Bones,
    bone: AutoMovieHumanoidBone,
    v: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    return Quaternion.rotateVector(pose.get(bone)!.worldRotation, v);
  }

  /** How far the farther ball of a foot is from its standing plant. */
  function slip(pose: Bones, base: Bones): number {
    return Math.max(
      gap(
        pose.get("leftToes")!.worldPosition,
        base.get("leftToes")!.worldPosition,
      ),
      gap(
        pose.get("rightToes")!.worldPosition,
        base.get("rightToes")!.worldPosition,
      ),
    );
  }
}
