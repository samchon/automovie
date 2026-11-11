import type { IAutoMovieRandom } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  AutoMovieMotionClock,
  AutoMovieMotionHumanArm,
  AutoMovieMotionHumanLeg,
  AutoMovieMotionManner,
  type IHumanBody,
  type IHumanPosture,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * The manner: how effort, intensity, pace, proficiency and variation become
 * modifiers, and what those modifiers change in a clock and in a phrase.
 *
 * The clock has `ready` at 0.25 s, `strokeStart` at 0.375, `stroke` at 0.625,
 * `strokeEnd` at 0.875, `relax` at 1 and lasts 1.25 s. The draw stream is a
 * stub that returns 0.75 at index 0 and 0.25 at index 1, so the tempo's offset
 * is half its bound upward and the extent's half its bound downward.
 *
 * Scenarios:
 * 1. The absent manner and the empty manner are neutral, and a neutral manner
 *    returns the clock it was given.
 * 2. Each factor moves its modifier in one direction: pace 2 halves the tempo,
 *    sudden time shortens it to 0.7, intensity 0.5 halves the extent, strong
 *    weight enlarges it to 1.1, bound flow lengthens the hold to 1.3 and draws
 *    the elbows in, indirect space curves the path.
 * 3. A clock in a manner stretches its holds by the hold factor, every other
 *    span by the tempo, and leaves a fixed span as it is; a scaled clock does
 *    the same without holds; an unknown instant throws.
 * 4. The same draws give the same modifiers; full variation offsets a novice's
 *    tempo by 7 % and extent by 10 %, an expert's by 2.5 % and 4 %; an action
 *    without a stated proficiency reads the performer's timing skill.
 * 5. A member outside its range throws.
 * 6. Extent 0.5 halves a visit's and a lift's excursion in the air and leaves
 *    a visit on a solid place where it is; curvature bows the hand's path
 *    toward its own side and keeps both ends.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public resolvers, the clock's retiming and two phrases, and reads the modifiers, the instants and the written limb goals; a factor applied the wrong way, a hold stretched by the tempo, a fixed span stretched, or an extent that moves a solid place fails.
 * @evidence contracts/development/testing.md#independent-expectations The instants are each span's stated length times its factor, summed by hand; the variation's offsets are the documented bounds times the stub's draws; the halved excursions are the midpoints of the stated origin and place. The Effort values 0.7, 1.3, 1.1 and 0.15 are `HumanEffort`'s documented ends, written as numbers.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers the absent and the empty manner, each factor alone in both directions where it has two, holds against a fixed span, a novice against an expert and half variation, a stated against an inherited proficiency, five range refusals, and a place in the air against a solid one.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit; the draw stream, the skill and the body are stubs of the members the code reads, since the real stream's values would hide which index feeds which modifier. The manner on a real body is judged by the reactions' motion captures. It runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation States the clock, the stub's draws and what they imply, and lists the 6 scenarios with their numbers.
 */
export function test_motion_compose_manner(): void {
  const close = (a: number, b: number, e: number = 1e-9): boolean =>
    Math.abs(a - b) <= e;
  const at = (g: IAutoMovieVector3, x: number, y: number, z: number): boolean =>
    close(g.x, x) && close(g.y, y) && close(g.z, z);
  const random = {
    seed: 0,
    block: (): number[] => [],
    uint32: (): number => 0,
    float: (index: number): number => (index === 0 ? 0.75 : 0.25),
  } as unknown as IAutoMovieRandom;
  const resolve = (
    manner: AutoMovieMotionManner.IManner,
  ): AutoMovieMotionManner.IModifiers =>
    AutoMovieMotionManner.resolve(manner, random);
  const free = AutoMovieMotionClock.phrase({
    prepare: 0.25,
    wait: 0.125,
    attack: 0.25,
    follow: 0.25,
    hold: 0.125,
    retract: 0.25,
  });

  // 1. Neutral.
  TestValidator.equals(
    "the absent manner is neutral",
    AutoMovieMotionManner.resolve(undefined, random),
    AutoMovieMotionManner.NEUTRAL,
  );
  TestValidator.equals(
    "the empty manner is neutral",
    resolve({}),
    AutoMovieMotionManner.NEUTRAL,
  );
  TestValidator.predicate(
    "a neutral manner returns the clock it was given",
    AutoMovieMotionManner.time(free, AutoMovieMotionManner.NEUTRAL) === free,
  );

  // 2. Each factor's direction.
  TestValidator.predicate(
    "each factor moves its modifier one way",
    close(resolve({ pace: 2 }).tempo, 0.5) &&
      close(resolve({ effort: { time: 1 } }).tempo, 0.7) &&
      close(resolve({ effort: { time: -1 } }).tempo, 1.3) &&
      close(resolve({ intensity: 0.5 }).extent, 0.5) &&
      close(resolve({ effort: { weight: 1 } }).extent, 1.1) &&
      close(resolve({ effort: { flow: 1 } }).hold, 1.3) &&
      close(resolve({ effort: { flow: 1 } }).tempo, 1) &&
      close(resolve({ effort: { flow: -1 } }).hold, 0.7) &&
      close(resolve({ effort: { flow: 1 } }).bend, -0.15) &&
      close(resolve({ effort: { space: -1 } }).curvature, 0.15) &&
      close(resolve({ effort: { space: 1 } }).curvature, 0),
  );

  // 3. The clock.
  const instants = (clock: AutoMovieMotionClock.IClock): number[] => [
    ...AutoMovieMotionClock.PHRASE.map((name: string): number =>
      clock.at(name),
    ),
    clock.duration,
  ];
  TestValidator.equals(
    "holds by the hold factor, the rest by the tempo",
    instants(AutoMovieMotionManner.time(free, { tempo: 0.5, hold: 2 })),
    [0.125, 0.375, 0.5, 0.625, 0.875, 1],
  );
  TestValidator.equals(
    "a fixed span keeps its length",
    instants(
      AutoMovieMotionManner.time(
        free,
        { tempo: 0.5, hold: 2 },
        { fixed: ["strokeStart"] },
      ),
    ),
    [0.125, 0.375, 0.625, 0.75, 1, 1.125],
  );
  TestValidator.equals(
    "a scaled clock keeps its fixed span",
    instants(AutoMovieMotionClock.scale(free, 0.5, ["stroke"])),
    [0.125, 0.1875, 0.3125, 0.5625, 0.625, 0.75],
  );
  TestValidator.error("a hold the clock lacks", (): unknown =>
    AutoMovieMotionManner.time(
      free,
      { tempo: 0.5, hold: 1 },
      { holds: ["pause"] },
    ),
  );
  TestValidator.error("a fixed instant the clock lacks", (): unknown =>
    AutoMovieMotionClock.scale(free, 0.5, ["flight"]),
  );

  // 4. Variation.
  const novice = resolve({ variation: 1, proficiency: 0 });
  const expert = resolve({ variation: 1, proficiency: 1 });
  TestValidator.equals(
    "the same draws give the same modifiers",
    resolve({ variation: 1, proficiency: 0 }),
    novice,
  );
  TestValidator.predicate(
    "proficiency narrows the variation",
    close(novice.tempo, 1.07) &&
      close(novice.extent, 0.9) &&
      close(expert.tempo, 1.025) &&
      close(expert.extent, 0.96) &&
      close(resolve({ variation: 0.5, proficiency: 0 }).tempo, 1.035),
  );
  const context = (timing: number) =>
    ({
      skill: { p: timing, axes: { timing } },
      random: (): IAutoMovieRandom => random,
    }) as unknown as Parameters<typeof AutoMovieMotionManner.of>[0];
  TestValidator.predicate(
    "an action reads the performer's timing skill",
    close(AutoMovieMotionManner.of(context(1), { variation: 1 }).tempo, 1.025) &&
      close(AutoMovieMotionManner.of(context(0), { variation: 1 }).tempo, 1.07) &&
      close(
        AutoMovieMotionManner.of(context(0), { variation: 1, proficiency: 1 })
          .tempo,
        1.025,
      ) &&
      AutoMovieMotionManner.of(context(0), undefined) ===
        AutoMovieMotionManner.NEUTRAL,
  );

  // 5. Ranges.
  TestValidator.error("no intensity", (): unknown => resolve({ intensity: 0 }));
  TestValidator.error("an intensity over 1", (): unknown =>
    resolve({ intensity: 1.5 }),
  );
  TestValidator.error("no pace", (): unknown => resolve({ pace: 0 }));
  TestValidator.error("a proficiency over 1", (): unknown =>
    resolve({ proficiency: 2 }),
  );
  TestValidator.error("a negative variation", (): unknown =>
    resolve({ variation: -1 }),
  );

  // 6. The phrases.
  const body: IHumanBody = {
    rest: new Map<string, IAutoMovieVector3>([
      ["leftLowerLeg", { x: 0.1, y: 0.5, z: 0 }],
      ["leftFoot", { x: 0.1, y: 0.08, z: 0 }],
      ["leftToes", { x: 0.1, y: 0.02, z: 0.12 }],
    ]),
    surfaces: {
      sockets: {
        palmRight: {
          bone: "rightHand",
          point: { x: 0, y: -0.02, z: 0.08 },
          normal: { x: 0, y: -1, z: 0 },
          forward: { x: 0, y: 0, z: 1 },
        },
      },
    },
  } as unknown as IHumanBody;
  const posture: IHumanPosture = {
    root: { x: 0, y: 0, z: 0 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: {},
    limbs: {},
  };
  const identity = { x: 0, y: 0, z: 0, w: 1 };
  const visit = (
    manner: Pick<AutoMovieMotionManner.IModifiers, "extent" | "curvature">,
    solid: boolean,
  ) =>
    AutoMovieMotionHumanArm.visit({
      body,
      side: "right",
      origin: { point: { x: -0.2, y: 0.9, z: 0 }, rotation: identity },
      clock: free,
      manner,
      target: (): AutoMovieMotionHumanArm.ITarget => ({
        surface: "wrist",
        shape: "relaxed",
        point: { x: -0.2, y: 1.2, z: 0.5 },
        rotation: identity,
        bend: { x: 0, y: 0, z: -1 },
      }),
      ...(solid
        ? {
            contact: {
              kind: "grip" as const,
              support: { kind: "prop" as const, subject: "cup" },
            },
          }
        : {}),
    });
  const hand = (
    manner: Pick<AutoMovieMotionManner.IModifiers, "extent" | "curvature">,
    solid: boolean,
    s: number,
  ): IAutoMovieVector3 =>
    visit(manner, solid).write(posture, s).limbs.rightArm!.point;
  const half = { extent: 0.5, curvature: 0 };
  TestValidator.predicate(
    "extent halves a visit in the air and keeps a solid place",
    at(hand(half, false, 0.625), -0.2, 1.05, 0.25) &&
      at(hand(half, false, 0), -0.2, 0.9, 0) &&
      at(hand(half, true, 0.625), -0.2, 1.2, 0.5),
  );
  const bowed = { extent: 1, curvature: 0.125 };
  TestValidator.predicate(
    "curvature bows the path toward the arm's side and keeps both ends",
    at(hand(bowed, false, 0), -0.2, 0.9, 0) &&
      at(hand(bowed, false, 0.625), -0.2, 1.2, 0.5) &&
      hand(bowed, false, 0.125).x < -0.2 - 1e-3 &&
      close(hand({ extent: 1, curvature: 0 }, false, 0.125).x, -0.2),
  );
  const lift = AutoMovieMotionHumanLeg.lift({
    body,
    side: "left",
    stance: { ankle: { x: 0.1, y: 0.08, z: 0 }, rotation: identity },
    clock: free,
    manner: { extent: 0.5 },
    raised: () => ({ ankle: { x: 0.1, y: 0.4, z: 0.1 }, rotation: identity }),
  });
  TestValidator.predicate(
    "extent halves a lift",
    at(lift.write(posture, 0.9375).limbs.leftLeg!.point, 0.1, 0.24, 0.05),
  );
}
