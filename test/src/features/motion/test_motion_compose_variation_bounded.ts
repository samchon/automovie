import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  AutoMovieMotionHumanBend,
  AutoMovieMotionHumanVariation,
  type AutoMovieMotionHumanTarget,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { MOTION_VARIATION_BODIES } from "../internal/MOTION_VARIATION_BODIES";
import { motionArmRig } from "../internal/motionArmRig";
import { motionVariationSource } from "../internal/motionVariationSource";

/**
 * Every offset stays inside its slot's bound, without piling up on it, and a
 * novice's spreads are wider than an elite's.
 *
 * Each slot is varied over 1,024 repeats at full variation for a novice. The
 * bounds are worked out by hand for the average stub body (stature 1.7 m, arm
 * 0.55 m, half shoulder width 0.2 m; chest at 1.25 m between the waist at
 * 1.05 m and the shoulder at 1.4 m).
 *
 * Scenarios:
 * 1. The left hand's place chest, centre, far, reached over 1 m in 0.2 s: the
 *    offset stays within 0.08 arm forward (0.8 of half the 0.2 from `far` to
 *    `mid`), 0.0873 arm sideways (0.8 of half the 0.6 half shoulder widths
 *    from `centre` to `inside`) and 0.1091 arm upward (0.8 of half the 0.15 m
 *    from the chest to the shoulder), and more than half the forward bound
 *    is used.
 * 2. An amount of 0.5 stays within 0.05 (two spreads of 0.025); an amount of
 *    0.9 within 0.06 (0.8 of half the 0.15 from `full` to `deep`).
 * 3. A duration of 0.3 s stays within 0.05 s; one of 0.04 s within 0.02 s,
 *    half its length.
 * 4. A pause of 0.4 s stays within 0.056 s (two spreads of 7 %); a pause of 0
 *    stays 0.
 * 5. A direction turns at most 10°, at most 4° when the nearest other named
 *    direction is 10° away, and keeps its length of 2.
 * 6. A preset bend moves at most 0.1, a curvature at most 0.04, and a strike
 *    point stays within its region's radius of 0.05 m under a scatter of
 *    0.03 m.
 * 7. Of each slot's 1,024 offsets at most one lies on its bound.
 * 8. The place `ahead` with no travel: the root mean square of a novice's
 *    offsets is at least twice an elite's (the spreads are 0.04 and 0.013).
 * 9. A solved elbow turned over 64 repeats stays 0.3 m from the shoulder and
 *    0.25 m from the wrist, within 16° of the solved place (two spreads of
 *    8°), on places whose strain is finite, and not all at one place.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls every public slot function on real seeded streams and reads the offsets; a clamp, a bound read in the wrong unit, a spread that ignores skill, or an elbow that leaves the swivel circle fails.
 * @evidence contracts/development/testing.md#independent-expectations Each bound is the documented rule worked out by hand from the stub's measures and the share tables' stated values, written as a number; the elbow's distances are the rig's bone lengths.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers a bound set by a cell, by a fixed size, by half the value and by the spread alone, a value with no room, both ends of skill, and the pile-up a clamp would leave.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit on real streams, a stub of the measures and a hand-built arm rig. Named places across bodies belong to `test_motion_compose_variation_named`. It runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation States the repeats, the stub and lists the 9 scenarios with their numbers.
 */
export function test_motion_compose_variation_bounded(): void {
  const COUNT: number = 1024;
  const repeats = <T>(
    read: (source: AutoMovieMotionHumanVariation.ISource) => T,
    skill: number = 0,
    count: number = COUNT,
  ): T[] =>
    Array.from({ length: count }, (_: unknown, index: number): T =>
      read(motionVariationSource({ index, skill })),
    );
  const within = (offsets: number[], bound: number): boolean =>
    offsets.every((o: number): boolean => Math.abs(o) <= bound + 1e-12);
  const piled = (offsets: number[], bound: number): boolean =>
    offsets.filter((o: number): boolean => Math.abs(o) >= bound - 1e-12)
      .length > 1;
  const widest = (offsets: number[]): number =>
    Math.max(...offsets.map(Math.abs));

  // 1. A place.
  const body = MOTION_VARIATION_BODIES[0]!;
  const chest: AutoMovieMotionHumanTarget.IDefault = {
    height: 1.25 / 1.7,
    range: 0.8,
    lateral: 0,
    facing: "performer",
  };
  const places = repeats((source) =>
    AutoMovieMotionHumanVariation.place(source, "place", body, "left", chest, {
      distance: 1,
      seconds: 0.2,
    }),
  );
  const forward: number[] = places.map((p) => p.range - 0.8);
  const out: number[] = places.map((p) => (p.lateral! * 0.2) / 0.55);
  const up: number[] = places.map((p) => ((p.height - chest.height) * 1.7) / 0.55);
  TestValidator.predicate(
    "a place stays in its cell on every axis",
    within(forward, 0.08) &&
      within(out, (0.8 * 0.3 * 0.2) / 0.55) &&
      within(up, (0.8 * 0.075) / 0.55) &&
      widest(forward) > 0.04 &&
      places.every((p): boolean => p.facing === "performer"),
  );

  // 2. to 6. The scalar slots, the direction and the strike point.
  const amounts = (share: number): number[] =>
    repeats((s) => AutoMovieMotionHumanVariation.amount(s, "amount", share)).map(
      (v: number): number => v - share,
    );
  const durations = (seconds: number): number[] =>
    repeats((s) =>
      AutoMovieMotionHumanVariation.duration(s, "duration", seconds),
    ).map((v: number): number => v - seconds);
  const pauses: number[] = repeats((s) =>
    AutoMovieMotionHumanVariation.pause(s, "pause", 0.4),
  ).map((v: number): number => v - 0.4);
  const bends: number[] = repeats((s) =>
    AutoMovieMotionHumanVariation.bend(s, "bend", 0.2),
  ).map((v: number): number => v - 0.2);
  const curvatures: number[] = repeats((s) =>
    AutoMovieMotionHumanVariation.curvature(s, "curvature", 0.1),
  ).map((v: number): number => v - 0.1);
  TestValidator.predicate(
    "an amount stays in its level",
    within(amounts(0.5), 0.05) &&
      widest(amounts(0.5)) > 0.04 &&
      within(amounts(0.9), 0.06) &&
      widest(amounts(0.9)) > 0.05,
  );
  TestValidator.predicate(
    "a duration stays within half its length",
    within(durations(0.3), 0.05) &&
      widest(durations(0.3)) > 0.04 &&
      within(durations(0.04), 0.02) &&
      widest(durations(0.04)) > 0.015,
  );
  TestValidator.predicate(
    "a pause stays in its name, and no pause stays none",
    within(pauses, 0.056) &&
      widest(pauses) > 0.045 &&
      repeats(
        (s) => AutoMovieMotionHumanVariation.pause(s, "pause", 0),
        0,
        16,
      ).every((v: number): boolean => v === 0),
  );
  const angles = (gap?: number): { degrees: number; length: number }[] =>
    repeats((s) =>
      AutoMovieMotionHumanVariation.direction(
        s,
        "direction",
        { x: 0, y: 0, z: 2 },
        gap,
      ),
    ).map((v: IAutoMovieVector3) => {
      const length: number = Math.hypot(v.x, v.y, v.z);
      return {
        degrees: (Math.acos(Math.min(1, v.z / length)) * 180) / Math.PI,
        length,
      };
    });
  const free = angles();
  const narrow = angles(10);
  TestValidator.predicate(
    "a direction turns within its bound and keeps its length",
    within(
      free.map((a) => a.degrees),
      10,
    ) &&
      widest(free.map((a) => a.degrees)) > 8 &&
      within(
        narrow.map((a) => a.degrees),
        4 + 1e-9,
      ) &&
      widest(narrow.map((a) => a.degrees)) > 3 &&
      free.every((a): boolean => Math.abs(a.length - 2) <= 1e-12),
  );
  const strikes: number[] = repeats((s) =>
    AutoMovieMotionHumanVariation.strike(s, "strike", {
      radius: 0.05,
      scatter: 0.03,
      along: { up: 1, out: 1 },
    }),
  ).map((t: AutoMovieMotionHumanVariation.ITangent): number =>
    Math.hypot(t.up, t.out),
  );
  TestValidator.predicate(
    "a bend, a curvature and a strike point stay in their bounds",
    within(bends, 0.1) &&
      widest(bends) > 0.08 &&
      within(curvatures, 0.04) &&
      widest(curvatures) > 0.03 &&
      within(strikes, 0.05) &&
      widest(strikes) > 0.04,
  );

  // 7. No pile-up.
  TestValidator.predicate(
    "no slot piles up on its bound",
    !piled(forward, 0.08) &&
      !piled(amounts(0.9), 0.06) &&
      !piled(durations(0.04), 0.02) &&
      !piled(bends, 0.1) &&
      !piled(curvatures, 0.04) &&
      !piled(strikes, 0.05),
  );

  // 8. Skill narrows the spread.
  const ahead: AutoMovieMotionHumanTarget.IDefault = {
    height: 0.72,
    range: 0.8,
    facing: "performer",
  };
  const rms = (skill: number): number =>
    Math.sqrt(
      repeats(
        (s) =>
          AutoMovieMotionHumanVariation.place(s, "place", body, "left", ahead)
            .range - 0.8,
        skill,
      ).reduce((sum: number, o: number): number => sum + o * o, 0) / COUNT,
    );
  TestValidator.predicate(
    "a novice's place spreads at least twice an elite's",
    rms(0) >= 2 * rms(1) && rms(1) > 0,
  );

  // 9. The elbow.
  const rig = motionArmRig();
  const shoulder: IAutoMovieVector3 = { x: 0.2, y: 1.4, z: 0 };
  const wrist: IAutoMovieVector3 = { x: 0.35, y: 1.2, z: 0.3 };
  const props: AutoMovieMotionHumanBend.ISolve = {
    body: rig,
    posture: { root: { x: 0, y: 0, z: 0 }, yaw: 0 },
    side: "left",
    point: wrist,
  };
  const solved: IAutoMovieVector3 = AutoMovieMotionHumanBend.solve(props);
  const distance = (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
    Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  // The foot of the solved elbow on the shoulder-to-wrist line, from which
  // the swivel angle of a turned elbow is read.
  const span: number = distance(shoulder, wrist);
  const along: number = (0.3 ** 2 - 0.25 ** 2 + span ** 2) / (2 * span);
  const foot: IAutoMovieVector3 = {
    x: shoulder.x + ((wrist.x - shoulder.x) * along) / span,
    y: shoulder.y + ((wrist.y - shoulder.y) * along) / span,
    z: shoulder.z + ((wrist.z - shoulder.z) * along) / span,
  };
  const radius: number = Math.sqrt(0.3 ** 2 - along ** 2);
  const elbows: IAutoMovieVector3[] = repeats(
    (s) => AutoMovieMotionHumanVariation.swivel(s, "elbow", props, solved),
    0,
    64,
  );
  const swivels: number[] = elbows.map((e: IAutoMovieVector3): number => {
    const cosine: number =
      ((e.x - foot.x) * (solved.x - foot.x) +
        (e.y - foot.y) * (solved.y - foot.y) +
        (e.z - foot.z) * (solved.z - foot.z)) /
      radius ** 2;
    return (Math.acos(Math.min(1, cosine)) * 180) / Math.PI;
  });
  TestValidator.predicate(
    "a turned elbow stays on the swivel circle, allowed and near",
    elbows.every(
      (e: IAutoMovieVector3): boolean =>
        Math.abs(distance(e, shoulder) - 0.3) <= 1e-6 &&
        Math.abs(distance(e, wrist) - 0.25) <= 1e-6 &&
        Number.isFinite(AutoMovieMotionHumanBend.strain(props, e)),
    ) &&
      within(swivels, 16 + 1e-6) &&
      widest(swivels) > 1,
  );
}
