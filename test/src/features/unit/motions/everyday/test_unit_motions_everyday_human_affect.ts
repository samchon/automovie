import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanLayer,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanAffect,
  HumanRefusal,
  HumanTrunk,
  affectHeldHands,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../../internal/nclose";
import { vclose } from "../../../internal/vclose";

namespace part_human_affect_angles {
  /** Rounding of a few products, degrees. */
  const ROUNDING: number = 1e-9;

  /**
   * `HumanAffect.angles` is what an affect display adds to the joints at a time
   * into it: nothing at or outside its two ends, a laugh's trunk pulsing once
   * every `NOTE` (210 ms, Provine 1996) under its envelope with the head held
   * back, and a refusal of a length that is not positive.
   *
   * Scenarios:
   *
   * 1. A 1.5 s laugh adds nothing before it, at its start, at its end or after.
   * 2. Inside its steady part the laugh's chest flexion repeats every 210 ms, its
   *    spine taking half of it, and its head is held back 5 degrees.
   * 3. Twice the intensity doubles every angle.
   * 4. A display of no length is refused on `seconds`.
   */
  export function verify(): void {
    TestValidator.equals(
      "nothing at the ends",
      [-0.1, 0, 1.5, 2].map(
        (t: number): number =>
          Object.keys(HumanAffect.angles("laugh", t, 1.5)).length,
      ),
      [0, 0, 0, 0],
    );
    const at: (
      t: number,
      intensity?: number,
    ) => ReturnType<typeof HumanAffect.angles> = (
      t: number,
      intensity: number = 1,
    ): ReturnType<typeof HumanAffect.angles> =>
      HumanAffect.angles("laugh", t, 1.5, intensity);
    const chest: (t: number) => number = (t: number): number => at(t).chest![0];
    TestValidator.predicate(
      "the pulse repeats every note",
      [0.6, 0.65, 0.7].every((t: number): boolean =>
        nclose(chest(t), chest(t + HumanAffect.NOTE), ROUNDING),
      ) &&
        nclose(at(0.65).spine![0], chest(0.65) / 2, ROUNDING) &&
        nclose(at(0.65).head![0], -5, ROUNDING),
    );
    TestValidator.predicate(
      "twice the intensity",
      nclose(at(0.65, 2).chest![0], 2 * chest(0.65), ROUNDING) &&
        nclose(at(0.65, 2).head![0], -10, ROUNDING),
    );
    let refused: boolean = false;
    try {
      HumanAffect.angles("laugh", 0.5, 0);
    } catch (error: unknown) {
      refused = error instanceof HumanRefusal && error.axis === "seconds";
    }
    TestValidator.predicate("no length", refused);
  }
}

namespace part_human_affect_crying {
  /** Rounding of a few minimum-jerk products, degrees. */
  const ROUNDING: number = 1e-9;

  /** The sampling step of the inspiration peaks, seconds. */
  const STEP: number = 0.001;

  /**
   * A sob's interval between inspirations at intensity 1 and its ±30 % seeded
   * range, seconds.
   */
  const SOB: readonly [number, number] = [0.5 * 0.7, 0.5 * 1.3];

  /** The 12 Hz Nyquist limit of 24 Hz film, seconds. */
  const NYQUIST: number = 1 / 12;

  /**
   * The seconds of a 4 s sob's steady part, between its 8 % ramp in and its 20 %
   * ramp out, at which the shoulder lift peaks.
   */
  function peaks(intensity: number, seed: string): number[] {
    const lift = (t: number): number =>
      HumanAffect.angles("sob", t, 4, intensity, seed).leftShoulder![1];
    const found: number[] = [];
    for (let t: number = 0.32 + STEP; t < 3.2 - STEP; t += STEP)
      if (lift(t) > lift(t - STEP) && lift(t) >= lift(t + STEP)) found.push(t);
    return found;
  }

  /**
   * `HumanAffect.angles` of the crying displays: a sob flexes the chest 6, the
   * lumbar spine 4 and the head 10 degrees under a seeded train of inspirations,
   * each lifting the shoulders 6 and extending the chest 4, the first a third of
   * the 0.5 s interval in; a weep lowers the head 12 and flexes the chest 4 over
   * a 2.5 s shoulder heave of 2, with seeded sniffs lifting the head 3 and the
   * shoulders 2; a gasp's one inspiration extends the head 12 and the chest 6 and
   * lifts the shoulders 8, peaking 0.25 s in. A sob's or weep's timing is its
   * seed's, the same in every read.
   *
   * Scenarios:
   *
   * 1. Inside a 4 s sob's steady part, at every read the head is 10 and the spine 4,
   *    and the chest and the shoulder lift move together: chest + 2/3 shoulder =
   *    6; the shoulders are still before the first inspiration, at 0.15 s.
   * 2. Inside a 10 s weep's steady part the head is 12 less 3/2 of the shoulders'
   *    lift beyond the slow heave `2 (0.5 - 0.5 cos(2 pi t / 2.5))`.
   * 3. A 1.5 s gasp at 0.25 s extends the head 12, the chest 6 and lifts each
   *    shoulder 8.
   * 4. In the steady part the shoulder lift peaks at intervals within ±30 % of 0.5
   *    s, never closer than 1/12 s, not all equal; another seed moves the peaks
   *    and intensity 2 gives more of them.
   * 5. The same seed reads the same sob twice; a sneeze too short for its burst is
   *    refused by the layer on `seconds`.
   */
  export function verify(): void {
    const sob: (
      t: number,
      seed?: string,
    ) => IAutoMovieMotionHumanPosture["joints"] = (
      t: number,
      seed: string = "tears",
    ): IAutoMovieMotionHumanPosture["joints"] =>
      HumanAffect.angles("sob", t, 4, 1, seed);
    TestValidator.predicate(
      "a sob",
      [1, 1.3, 1.7, 2.1, 2.6].every((t: number): boolean => {
        const j: IAutoMovieMotionHumanPosture["joints"] = sob(t);
        return (
          nclose(j.head![0], 10, ROUNDING) &&
          nclose(j.spine![0], 4, ROUNDING) &&
          nclose(j.chest![0] + (2 / 3) * j.leftShoulder![1], 6, ROUNDING)
        );
      }) && sob(0.15).leftShoulder![1] === 0,
    );
    TestValidator.predicate(
      "a weep",
      [3, 4.4, 5.9].every((t: number): boolean => {
        const j: IAutoMovieMotionHumanPosture["joints"] = HumanAffect.angles(
          "weep",
          t,
          10,
          1,
          "tears",
        );
        const slow: number =
          2 * (0.5 - 0.5 * Math.cos((2 * Math.PI * t) / 2.5));
        const sniff: number = (j.leftShoulder![1] - slow) / 2;
        return (
          nclose(j.head![0], 12 - 3 * sniff, ROUNDING) &&
          nclose(j.chest![0], 4, ROUNDING)
        );
      }),
    );
    const gasp: IAutoMovieMotionHumanPosture["joints"] = HumanAffect.angles(
      "gasp",
      0.25,
      1.5,
    );
    TestValidator.predicate(
      "a gasp",
      nclose(gasp.head![0], -12, ROUNDING) &&
        nclose(gasp.chest![0], -6, ROUNDING) &&
        nclose(gasp.leftShoulder![1], 8, ROUNDING) &&
        nclose(gasp.rightShoulder![1], 8, ROUNDING),
    );
    TestValidator.equals("replayed", sob(1.7), sob(1.7));
    const lifts: number[] = peaks(1, "a");
    const gaps: number[] = lifts
      .slice(1)
      .map((t: number, i: number): number => t - lifts[i]!);
    TestValidator.predicate(
      "seeded intervals",
      gaps.length >= 3 &&
        gaps.every(
          (gap: number): boolean =>
            gap >= SOB[0] - 2 * STEP &&
            gap <= SOB[1] + 2 * STEP &&
            gap > NYQUIST,
        ) &&
        Math.max(...gaps) - Math.min(...gaps) > 4 * STEP,
    );
    TestValidator.predicate(
      "another seed, a stronger sob",
      peaks(1, "b").join() !== lifts.join() &&
        peaks(2, "a").length > lifts.length,
    );
    let axis: string | undefined;
    try {
      HumanAffect.layer([{ kind: "sneeze", at: 0, duration: 0.2 }]);
    } catch (error: unknown) {
      if (error instanceof HumanRefusal) axis = error.axis;
    }
    TestValidator.equals("a short sneeze", axis, "seconds");
  }
}

namespace part_affect_held_hands {
  /** Rounding of a rigid carry through the rig's FK, metres. */
  const CARRY: number = 1e-9;

  /**
   * `affectHeldHands` keeps the hands an action holds by contact on their
   * contacts while a trunk layer moves the body under them.
   *
   * - A hand on something outside the body, posed by joint angles, gets the
   *   action's own angle back on every joint the layer turned between the root
   *   and the hand, in full inside its window and by the minimum-jerk ease over
   *   the 0.1 s before it opens; the layer's other joints stay layered.
   * - A hand held by a limb goal on something outside the body keeps its goal, so
   *   the layer stands.
   * - A hand held by a limb goal on its own bone has its goal carried rigidly with
   *   that bone: the goal's place in the bone's frame is the same before and
   *   after the layer.
   * - With no action, or no open contact, the layer stands.
   *
   * The body is built whole (`humanFixtureBody`): the carry resolves the rig.
   *
   * Scenarios, an action over 0 to 10 s and a layer that flexes the spine 4, the
   * chest 10 and the head 8 degrees and lifts the right shoulder 6:
   *
   * 1. A left palm on the ground over shares 0.5 to 1 at 7 s: the spine and chest
   *    return to rest and the head and right shoulder keep the layer.
   * 2. At 4.95 s, half the ease before the window, the chest is 10 - 10 x 0.5 = 5,
   *    the minimum-jerk share of a half being a half.
   * 3. The same palm with a limb goal, or no action, or at 2 s, returns the layered
   *    posture itself.
   * 4. A left palm goaled on the performer's own head keeps its goal's head-local
   *    place and turn across the layer.
   */
  export async function verify(): Promise<void> {
    const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
    const before: IAutoMovieMotionHumanPosture = {
      root: { x: 0, y: 0, z: 0 },
      yaw: 0,
      pitch: 0,
      roll: 0,
      joints: {},
      limbs: {},
    };
    const after: IAutoMovieMotionHumanPosture = {
      ...before,
      joints: {
        spine: [4, 0, 0],
        chest: [10, 0, 0],
        head: [8, 0, 0],
        rightShoulder: [0, 6, 0],
      },
    };
    const ground: IAutoMovieMotionHumanContactWindow = {
      part: "leftHand",
      kind: "plant",
      from: 0.5,
      to: 1,
      support: { kind: "ground" },
    };
    const context = (
      contacts: readonly IAutoMovieMotionHumanContactWindow[] | undefined,
    ): affectHeldHands.IContext => ({
      subject: "a",
      body,
      action: (): IAutoMovieMotionHumanLayer.IAction | undefined =>
        contacts === undefined
          ? undefined
          : {
              name: "stand",
              family: "stand",
              from: 0,
              to: 10,
              events: [],
              contacts,
            },
    });
    const held: IAutoMovieMotionHumanPosture = affectHeldHands(
      before,
      after,
      7,
      context([ground]),
    );
    TestValidator.equals(
      "a joint-posed hand on the ground",
      [held.joints.spine, held.joints.chest, held.joints.head],
      [
        [0, 0, 0],
        [0, 0, 0],
        [8, 0, 0],
      ],
    );
    TestValidator.equals("the free side", held.joints.rightShoulder, [0, 6, 0]);
    TestValidator.predicate(
      "easing in",
      nclose(
        affectHeldHands(before, after, 4.95, context([ground])).joints
          .chest![0],
        5,
        CARRY,
      ),
    );
    const goaled: IAutoMovieMotionHumanPosture = {
      ...before,
      limbs: {
        leftArm: {
          point: { x: 0.1, y: 1.6, z: 0.15 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
          bend: { x: 0.3, y: 1.2, z: 0 },
        },
      },
    };
    TestValidator.predicate(
      "the layer stands",
      affectHeldHands(goaled, after, 7, context([ground])) === after &&
        affectHeldHands(before, after, 7, context(undefined)) === after &&
        affectHeldHands(before, after, 2, context([ground])) === after,
    );
    const face: IAutoMovieMotionHumanPosture = affectHeldHands(
      goaled,
      after,
      7,
      context([
        {
          ...ground,
          support: { kind: "person", subject: "a", bone: "head" },
        },
      ]),
    );
    const read: (
      posture: IAutoMovieMotionHumanPosture,
    ) => Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      HumanTrunk.prepareResolve(body, new Set<AutoMovieHumanoidBone>(["head"]));
    const local = (
      posture: IAutoMovieMotionHumanPosture,
      goal: IAutoMovieMotionHumanPosture["limbs"]["leftArm"],
    ): IAutoMovieVector3 => {
      const head: IAutoMovieResolvedBone = read(posture).get("head")!;
      return Quaternion.rotateVector(
        Quaternion.inverse(head.worldRotation),
        Vector3.subtract(goal!.point, head.worldPosition),
      );
    };
    const turn = (
      posture: IAutoMovieMotionHumanPosture,
      goal: IAutoMovieMotionHumanPosture["limbs"]["leftArm"],
    ): IAutoMovieVector3 =>
      Quaternion.rotateVector(
        Quaternion.multiply(
          Quaternion.inverse(read(posture).get("head")!.worldRotation),
          goal!.rotation!,
        ),
        { x: 0, y: 0, z: 1 },
      );
    TestValidator.predicate(
      "a goal carried with its own bone",
      vclose(
        local(face, face.limbs.leftArm),
        local(goaled, goaled.limbs.leftArm),
        CARRY,
      ) &&
        vclose(
          turn(face, face.limbs.leftArm),
          turn(goaled, goaled.limbs.leftArm),
          CARRY,
        ) &&
        !vclose(face.limbs.leftArm!.point, goaled.limbs.leftArm!.point, CARRY),
    );
  }
}

/**
 * `HumanAffect`'s unit contract: its display angles and held hands.
 *
 * Its parts, each documented with its own scenarios:
 *
 * - `human_affect_angles`: `HumanAffect.angles` is what an affect display adds to
 *   the joints at a time into it:
 * - `human_affect_crying`: A sob's interval between inspirations at intensity 1
 *   and its ±30 % seeded range, seconds.
 * - `affect_held_hands`: `affectHeldHands` keeps the hands an action holds by
 *   contact on their contacts while a trunk layer moves the body under them.
 */
export async function test_unit_motions_everyday_human_affect(): Promise<void> {
  part_human_affect_angles.verify();
  part_human_affect_crying.verify();
  await part_affect_held_hands.verify();
}
