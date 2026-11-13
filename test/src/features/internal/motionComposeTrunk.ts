import { type IAutoMovieResolvedBone, Quaternion } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionClock,
  AutoMovieMotionHumanTrunk,
  HumanBalance,
  HumanRefusal,
  HumanTrunk,
  type IAutoMovieMotionHumanPrimitive,
  type IHumanBody,
  type IHumanPosture,
  poseBones,
  resolveHumanPosture,
  stand,
} from "@automovie/motions";

import { motionComplaints } from "./motionComplaints";
import { motionHumanBody } from "./motionHumanBody";

/**
 * The trunk phrases of `AutoMovieMotionHumanTrunk` read on one real body,
 * which the `test_human_motion_compose_trunk_*`,
 * `test_human_motion_compose_trunk_crouch_*` and
 * `test_human_motion_compose_trunk_counterbalance_*` specs run one body of
 * the sweep each, so every body is read and each spec runs in its time.
 *
 * Every expectation is read on the displayed bones the resolver gives for
 * the written posture. A foot's plant is the ball of the foot, the toes'
 * joint: the stance's leg goal holds its contact there (`stand.legs`), and
 * the heel may rise about it when the shank leans past the ankle's range
 * (`HumanFoot.heelOff`), so the toes bone is read and not the ankle. The
 * clock has `ready` at 0.25 s, `relax` at 1 s and `end` at 1.25 s; a phrase
 * rises from `start` to `ready` and falls from `relax` to `end`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is read, which point a plant is and the clock; each function states its scenarios and bounds.
 * @evidence contracts/development/implementation.md#principled-implementation Reads the resolver's bones and the balance owner's measures for written postures; the counterbalance's feasibility is decided by a scan of the hips' places the phrase does not do.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One function per phrase family, each a loop over its cells gathering complaints and asserting once.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every failing cell is named with its body, its parameters and its measured numbers.
 * @evidence contracts/development/implementation.md#efficient-algorithms One body per call; the solved postures each function states.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Read by the per-body specs, so each family's readings exist once.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The postures live as long as the call; the body is the shared fixture's.
 */
export namespace motionComposeTrunk {
  type Bones = Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;

  /**
   * A turn of the trunk on the pelvis and a posture sunk into its knees, on
   * one body. A turn of `d` degrees shows as the chest's forward axis `d`
   * degrees to the left of the pelvis's, the lumbar spine having taken
   * `1 - CHEST` of it. A sunk posture shows the hips bone lower by the depth
   * and back by the distance asked, the chest's long axis inclined forward
   * by the inclination, and both feet on their plants.
   *
   * Scenarios:
   * 1. `turn` by 30 and by -20 degrees claims the trunk, turns the chest by
   *    the degrees (within 1) and the spine by its share at the full
   *    instants, leaves the pelvis, and is gone at both ends.
   * 2. `sunk` by 0.1 and 0.3 hip heights with inclinations of 0, 20 and 45
   *    degrees and 0 or 60 mm back, at headings of 0 and 90 degrees, puts the
   *    hips there (within a micrometre), inclines the chest by the
   *    inclination (within 0.5 degrees), and keeps both feet on their plants
   *    within 1 mm.
   *
   * @param name The body.
   */
  export function turnAndSink(name: motionHumanBody.Name): void {
    const all: motionComplaints.IGatherer = motionComplaints();
    const body: IHumanBody = motionHumanBody(name);
    const bones = (posture: IHumanPosture): Bones =>
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
    const standing: IHumanPosture = stand.posture(body, ORIGIN, 0);
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
      const turned: IHumanPosture = stand.posture(body, ORIGIN, yaw);
      const base: Bones = bones(turned);
      const was: IAutoMovieVector3 = base.get("hips")!.worldPosition;
      for (const share of [0.1, 0.3] as const)
        for (const inclination of [0, 20, 45] as const)
          for (const back of [0, 0.06] as const) {
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
    all.assert(`the trunk's turn and sunk posture hold (${name})`);
  }

  /**
   * The trunk's crouch on one body: the hips sink and the trunk inclines
   * over them, the body stands again, and the feet and the balance hold all
   * the way. The balance is the centre of mass against the soles: not ahead
   * of their middle (`HumanBalance.offset`, within 2 mm) and inside the base
   * of support (`HumanBalance.margin` positive).
   *
   * Scenarios:
   * 1. `crouch` refuses a negative or non-numeric depth or pitch.
   * 2. For depths of 0, 0.15 and 0.3 hip heights and pitches of 0 and 30
   *    degrees it claims the root and the trunk from its first to its last
   *    instant, leaves the standing body at both ends, is at its depth and
   *    its pitch between `ready` and `relax`, and sinks only part of the way
   *    at the middle of its rise.
   * 3. At every sampled second both feet keep their plants within 1 mm and
   *    the body keeps its balance.
   *
   * @param name The body.
   */
  export function crouch(name: motionHumanBody.Name): void {
    const all: motionComplaints.IGatherer = motionComplaints();
    const body: IHumanBody = motionHumanBody(name);
    const bones = (posture: IHumanPosture): Bones =>
      poseBones(body, resolveHumanPosture(body, posture));
    // Degrees the chest's long axis tips ahead of world +Y.
    const tipped = (pose: Bones): number => {
      const u: IAutoMovieVector3 = axis(pose, "chest", { x: 0, y: 1, z: 0 });
      return Math.atan2(u.z, u.y) * DEG;
    };
    const standing: IHumanPosture = stand.posture(body, ORIGIN, 0);
    const upright: Bones = bones(standing);
    const hips: IAutoMovieVector3 = upright.get("hips")!.worldPosition;
    const hipHeight: number = body.measure.hipHeight;
    const phraseOf = (
      depth: number,
      pitch: number,
    ): IAutoMovieMotionHumanPrimitive =>
      AutoMovieMotionHumanTrunk.crouch({
        body,
        standing,
        clock: CLOCK,
        rise: RISE,
        fall: FALL,
        depth,
        pitch,
      });

    // 1. Refusals.
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
    for (const share of [0, 0.15, 0.3] as const)
      for (const pitch of [0, 30] as const) {
        const cell: string = `${name}: a crouch of ${share} hip heights and ${pitch} degrees`;
        const depth: number = share * hipHeight;
        const phrase: IAutoMovieMotionHumanPrimitive = phraseOf(depth, pitch);
        all.equals(
          `${cell} claims the root and the trunk over its instants`,
          [phrase.channels, phrase.from, phrase.to],
          [["root", "trunk"], 0, 1.25],
        );
        for (const seconds of [0, 0.125, 0.25, 0.625, 1, 1.125, 1.25]) {
          const written: IHumanPosture = phrase.write(standing, seconds);
          const pose: Bones = bones(written);
          const sunk: number = hips.y - pose.get("hips")!.worldPosition.y;
          const inclined: number = tipped(pose) - tipped(upright);
          const ahead: number = HumanBalance.offset(body, written);
          const margin: number = HumanBalance.margin(body, written);
          const at: string = `${cell} at ${seconds} s`;
          if (seconds === 0 || seconds === 1.25)
            all.check(
              `${at} stands as before, hips off by ${mm(gap(pose.get("hips")!.worldPosition, hips))} mm`,
              gap(pose.get("hips")!.worldPosition, hips) <= 1e-6 &&
                Math.abs(inclined) <= 1e-6,
            );
          else if (seconds === 0.125 || seconds === 1.125)
            all.check(
              `${at} is part of the way down, ${mm(sunk)} mm of ${mm(depth)} mm`,
              depth === 0
                ? Math.abs(sunk) <= 1e-6
                : sunk > 0.05 * depth && sunk < 0.95 * depth,
            );
          else
            all.check(
              `${at} is at its depth and its pitch, ${mm(sunk)} mm of ${mm(depth)} mm and ${inclined.toFixed(2)} degrees`,
              Math.abs(sunk - depth) <= 1e-6 &&
                Math.abs(inclined - pitch) <= 0.5,
            );
          all.check(
            `${at} keeps both feet on their plants, the farther ball off by ${mm(slip(pose, upright))} mm`,
            slip(pose, upright) <= 0.001,
          );
          all.check(
            `${at} keeps the balance, the centre ${mm(ahead)} mm ahead of the soles' middle with a margin of ${mm(margin)} mm`,
            ahead <= 0.002 && margin > 0,
          );
        }
      }
    all.assert(`the trunk's crouch holds (${name})`);
  }

  /**
   * The trunk's counterbalance on one body: under limbs held out ahead the
   * hips move straight back along the heading until the centre of mass
   * stands over the feet again, and come forward as the limbs return.
   *
   * The extended postures are the standing one with both arms held out
   * ahead at 0.92 of their length and the whole posture pitched by 0, 30
   * and 60 degrees. A posture's pitch turns the body about its root on the
   * floor, so a pitch of 30 degrees stands the hips about half a hip height
   * ahead of the planted feet: a body that falls forward as it is, and that
   * a person holds as a bow with the hips behind the feet. The balance is
   * `HumanBalance.offset`, the centre of mass ahead of the soles' middle,
   * within 2 mm of it after the shift.
   *
   * Whether a pose can be balanced at all is decided here, not by the
   * phrase: the hips are moved back along the heading in 5 mm steps for as
   * long as both hip joints stay within a leg's length (thigh and shank) of
   * their planted ankles, and the pose is balanceable when one of those
   * places puts the centre of mass inside the base of support
   * (`HumanBalance.margin` positive).
   *
   * Scenarios, at headings of 0 and 90 degrees, for the pitches of 0 and 30
   * degrees (scenarios 1 to 5) and of 60 degrees at a heading of 0
   * (scenario 6):
   * 1. The phrase claims the root.
   * 2. At the middle of its hold the centre of mass is over the soles'
   *    middle and the hips have moved back; a pose whose centre is not ahead
   *    of the soles is not moved.
   * 3. The root moves straight back along the heading: not sideways, not
   *    up, and the heading is kept.
   * 4. The phrase is gone at both ends.
   * 5. At each heading at least one pitch puts the centre ahead of the
   *    soles, so the counterbalance is exercised; and the standing body is
   *    not moved.
   * 6. The pitch of 60 degrees is refused with a `HumanRefusal` of kind
   *    `base` on the axis `balance` exactly when the scan finds no
   *    balanceable place, and otherwise planned and balanced as scenario 2
   *    reads it.
   *
   * @param name The body.
   */
  export function counterbalance(name: motionHumanBody.Name): void {
    const all: motionComplaints.IGatherer = motionComplaints();
    const body: IHumanBody = motionHumanBody(name);
    const reach: number = body.measure.thigh + body.measure.shank;
    for (const yaw of [0, 90] as const) {
      const turned: IHumanPosture = stand.posture(body, ORIGIN, yaw);
      const base: Bones = poseBones(body, resolveHumanPosture(body, turned));
      const ahead = (
        p: IAutoMovieVector3,
        forward: number,
        up: number,
      ): IAutoMovieVector3 => ({
        x: p.x + (yaw === 90 ? forward : 0),
        y: p.y + up,
        z: p.z + (yaw === 0 ? forward : 0),
      });
      const arm = (side: "left" | "right"): IHumanPosture.IGoal => {
        const shoulder: IAutoMovieVector3 = base.get(
          `${side}UpperArm`,
        )!.worldPosition;
        const length: number =
          gap(shoulder, base.get(`${side}LowerArm`)!.worldPosition) +
          gap(
            base.get(`${side}LowerArm`)!.worldPosition,
            base.get(`${side}Hand`)!.worldPosition,
          );
        return {
          point: ahead(shoulder, 0.92 * length, 0),
          bend: ahead(shoulder, 0.3 * length, -0.5 * length),
        };
      };
      const extend = (pitch: number): IHumanPosture => ({
        ...turned,
        pitch,
        limbs: {
          ...turned.limbs,
          leftArm: arm("left"),
          rightArm: arm("right"),
        },
      });
      // Whether some place of the hips back along the heading, within the
      // legs' reach of their plants, puts the centre inside the base.
      const balanceable = (posture: IHumanPosture): boolean => {
        for (let back: number = 0; ; back += 0.005) {
          const moved: IHumanPosture = {
            ...posture,
            root: ahead(posture.root, -back, 0),
          };
          const trunk: Bones = HumanTrunk.resolve(body, moved);
          const within: boolean = (["left", "right"] as const).every(
            (side: "left" | "right"): boolean =>
              gap(
                trunk.get(`${side}UpperLeg`)!.worldPosition,
                moved.limbs[`${side}Leg`]!.point,
              ) <= reach,
          );
          if (!within) return false;
          if (HumanBalance.margin(body, moved) > 0) return true;
        }
      };
      const read = (pitch: number, cell: string): boolean => {
        const extended: IHumanPosture = extend(pitch);
        const phrase: IAutoMovieMotionHumanPrimitive =
          AutoMovieMotionHumanTrunk.counterbalance(
            body,
            CLOCK,
            RISE,
            FALL,
            extended,
          );
        const before: number = HumanBalance.offset(body, extended);
        const full: IHumanPosture = phrase.write(extended, 0.625);
        const after: number = HumanBalance.offset(body, full);
        const back: number =
          yaw === 0
            ? extended.root.z - full.root.z
            : extended.root.x - full.root.x;
        all.equals(`${cell} claims the root`, phrase.channels, ["root"]);
        all.check(
          `${cell} puts the centre over the soles' middle, ${mm(after)} mm ahead from ${mm(before)} mm, the hips ${mm(back)} mm back`,
          before > 0
            ? Math.abs(after) <= 0.002 && back > 0
            : Math.abs(back) <= 1e-9,
        );
        all.check(
          `${cell} moves the root straight back along the heading`,
          Math.abs(full.root.y - extended.root.y) <= 1e-9 &&
            Math.abs(
              yaw === 0
                ? full.root.x - extended.root.x
                : full.root.z - extended.root.z,
            ) <= 1e-9 &&
            full.yaw === extended.yaw,
        );
        all.check(
          `${cell} is gone at both ends`,
          gap(phrase.write(extended, 0).root, extended.root) <= 1e-9 &&
            gap(phrase.write(extended, 1.25).root, extended.root) <= 1e-9,
        );
        return before > 0.005;
      };

      // 6. A pose is refused exactly when no place of the hips balances it.
      // Read at one heading: the scan and the refusal run their whole
      // range, the costliest cell, and the heading's part is scenario 3's.
      if (yaw === 0) {
        const cell: string = `${name}: a counterbalance of a trunk pitched 60 at a heading of 0`;
        const feasible: boolean = balanceable(extend(60));
        let refusal: unknown;
        try {
          AutoMovieMotionHumanTrunk.counterbalance(
            body,
            CLOCK,
            RISE,
            FALL,
            extend(60),
          );
        } catch (error) {
          refusal = error;
        }
        if (feasible) {
          all.check(
            `${cell} plans, since a place of the hips within the legs' reach balances it${refusal instanceof Error ? ` (refused: ${refusal.message})` : ""}`,
            refusal === undefined,
          );
          if (refusal === undefined) read(60, cell);
        } else
          all.equals(
            `${cell} is refused on its balance, since no place of the hips within the legs' reach balances it${refusal instanceof Error ? ` (${refusal.message})` : ""}`,
            refusal instanceof HumanRefusal
              ? [refusal.kind, refusal.axis]
              : "no refusal",
            ["base", "balance"],
          );
      }

      let unbalanced: number = 0;
      for (const pitch of [0, 30] as const)
        if (
          read(
            pitch,
            `${name}: a counterbalance of a trunk pitched ${pitch} at a heading of ${yaw}`,
          )
        )
          unbalanced++;
      all.check(
        `${name}: at a heading of ${yaw} a pitched trunk puts the centre ahead of the soles, so the counterbalance is exercised`,
        unbalanced >= 1,
      );
      const still: IHumanPosture = AutoMovieMotionHumanTrunk.counterbalance(
        body,
        CLOCK,
        RISE,
        FALL,
        turned,
      ).write(turned, 0.625);
      all.check(
        `${name}: a counterbalance at a heading of ${yaw} moves nothing for the standing body, whose centre is ${mm(HumanBalance.offset(body, turned))} mm ahead`,
        HumanBalance.offset(body, turned) > 0 ||
          gap(still.root, turned.root) <= 1e-9,
      );
    }
    all.assert(`the trunk's counterbalance holds (${name})`);
  }

  /** Degrees per radian. */
  const DEG: number = 180 / Math.PI;

  /** The phrases' clock: `ready` at 0.25 s, `relax` at 1 s and `end` at 1.25 s. */
  const CLOCK: AutoMovieMotionClock.IClock = AutoMovieMotionClock.phrase({
    prepare: 0.25,
    wait: 0.125,
    attack: 0.25,
    follow: 0.25,
    hold: 0.125,
    retract: 0.25,
  });

  /** The phrases' rise. */
  const RISE: readonly ["start", "ready"] = ["start", "ready"];

  /** The phrases' fall. */
  const FALL: readonly ["relax", "end"] = ["relax", "end"];

  /** The stance's place. */
  const ORIGIN: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };

  /** The distance between two points, metres. */
  function gap(a: IAutoMovieVector3, b: IAutoMovieVector3): number {
    return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  }

  /** Metres written as millimetres. */
  function mm(metres: number): string {
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
