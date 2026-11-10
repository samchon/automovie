import { HumanAffect, type IHumanPosture } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * Affect displays start and end at rest, move smoothly, leave limb goals
 * alone and keep their cited rhythms.
 *
 * Scenarios:
 * 1. Every display adds nothing before its start, at its start, at its end
 *    and after it, and every angle it adds changes by less than 1.5 degrees
 *    between samples 1 ms apart (no jumps).
 * 2. A laugh's trunk pulses repeat every 210 ms (Provine 1996): the chest
 *    flexion peaks are spaced by the note interval within 2 ms.
 * 3. The layer adds onto the posture's own joint angles and returns the
 *    posture's limb goals and root unchanged; displays that overlap add.
 * 4. A display of non-positive length is refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Evaluates the display angles and the layer on a posture; a display that starts or ends off zero, jumps, loses the laugh's rhythm, touches a limb goal or ignores the base angles fails.
 * @evidence contracts/development/testing.md#independent-expectations The note interval is Provine's 210 ms; zero ends, continuity and untouched goals are the layer contract stated by IHumanLayer.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers all six displays, before, inside and after, overlap and an invalid length; the posed result on a body is reviewed in captures.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit; it runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 scenarios and what each pins.
 */
export function test_motion_everyday_affect(): void {
  const kinds: HumanAffect.Kind[] = [
    "laugh",
    "sigh",
    "yawn",
    "cough",
    "sneeze",
    "shiver",
  ];
  const total = (
    a: Partial<Record<string, readonly [number, number, number]>>,
  ): number =>
    Object.values(a).reduce(
      (s: number, v) => s + Math.abs(v![0]) + Math.abs(v![1]) + Math.abs(v![2]),
      0,
    );
  for (const kind of kinds) {
    const length: number = HumanAffect.LENGTH[kind];
    TestValidator.predicate(
      `${kind} rests at its ends`,
      [-1, 0, length, length + 1].every(
        (t: number): boolean =>
          total(HumanAffect.angles(kind, t, length)) === 0,
      ),
    );
    let jump: number = 0;
    let previous = HumanAffect.angles(kind, 0, length);
    for (let t: number = 0.001; t <= length; t += 0.001) {
      const now = HumanAffect.angles(kind, t, length);
      for (const bone of new Set([
        ...Object.keys(now),
        ...Object.keys(previous),
      ])) {
        const a = (now as Record<string, readonly number[]>)[bone] ?? [0, 0, 0];
        const b = (previous as Record<string, readonly number[]>)[bone] ?? [
          0, 0, 0,
        ];
        for (let i: number = 0; i < 3; i++)
          jump = Math.max(jump, Math.abs(a[i]! - b[i]!));
      }
      previous = now;
    }
    TestValidator.predicate(
      `${kind} moves smoothly (${jump.toFixed(3)})`,
      jump < 1.5,
    );
  }

  const peaks: number[] = [];
  let last: number = 0;
  let rising: boolean = false;
  for (let t: number = 0.3; t < 1.0; t += 0.0005) {
    const v: number = HumanAffect.angles("laugh", t, 1.5).chest![0];
    if (v < last && rising) peaks.push(t);
    rising = v > last;
    last = v;
  }

  // The scan starts inside a note, so its first local maximum may be the window's edge; gaps are read from the second peak on.
  const full: number[] = peaks.slice(1);
  const gaps: number[] = full
    .slice(1)
    .map((p: number, i: number): number => p - full[i]!);
  TestValidator.predicate(
    `laugh notes every 210 ms (${gaps.map((g) => g.toFixed(3)).join(", ")})`,
    gaps.length >= 2 &&
      gaps.every(
        (g: number): boolean => Math.abs(g - HumanAffect.NOTE) < 0.002,
      ),
  );

  const posture: IHumanPosture = {
    root: { x: 1, y: 0, z: 2 },
    yaw: 30,
    pitch: 0,
    roll: 0,
    joints: { chest: [5, 0, 0] },
    limbs: {
      leftArm: {
        point: { x: 1, y: 1, z: 1 },
        bend: { x: 0, y: 0, z: 0 },
        planted: true,
      },
    },
  };
  const layered: IHumanPosture = HumanAffect.layer([
    { kind: "cough", at: 0 },
  ]).apply(posture, 0.22, undefined as never);
  const cough: number = HumanAffect.angles(
    "cough",
    0.22,
    HumanAffect.LENGTH.cough,
  ).chest![0];
  TestValidator.predicate(
    "adds onto the base angle",
    Math.abs(layered.joints.chest![0] - (5 + cough)) < 1e-12,
  );
  TestValidator.predicate(
    "limb goals and root unchanged",
    layered.limbs === posture.limbs ||
      JSON.stringify(layered.limbs) === JSON.stringify(posture.limbs),
  );
  TestValidator.predicate(
    "root unchanged",
    layered.root === posture.root && layered.yaw === 30,
  );
  const both: IHumanPosture = HumanAffect.layer([
    { kind: "cough", at: 0 },
    { kind: "laugh", at: 0 },
  ]).apply(posture, 0.22, undefined as never);
  const laugh: number = HumanAffect.angles(
    "laugh",
    0.22,
    HumanAffect.LENGTH.laugh,
  ).chest![0];
  TestValidator.predicate(
    "overlapping displays add",
    Math.abs(both.joints.chest![0] - (5 + cough + laugh)) < 1e-12,
  );
  TestValidator.error("non-positive length refused", (): unknown =>
    HumanAffect.angles("sigh", 0.1, 0),
  );
}
