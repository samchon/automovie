import { retargetHumanoidMotion, IAutoMovieRetargetContactProps } from "@automovie/engine";
import type {
  IAutoMovieJointConstraint,
  IAutoMovieMotion,
  IAutoMovieKeyframe,
  IAutoMovieSkeleton,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { hasViolation } from "../internal/predicates";

const range: (max: number) => IAutoMovieJointConstraint = (max: number): IAutoMovieJointConstraint => ({
  flexion: { min: -max, max },
  abduction: { min: -180, max: 180 },
  twist: { min: -180, max: 180 },
});

const skeleton: (id: string, flexionMax: number) => IAutoMovieSkeleton = (id: string, flexionMax: number): IAutoMovieSkeleton => ({
  id,
  bones: [
    {
      bone: "hips",
      parent: null,
      rest: {
        translation: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        scale: { x: 1, y: 1, z: 1 },
      },
      constraint: null,
    },
    {
      bone: "leftUpperArm",
      parent: "hips",
      rest: {
        translation: { x: 0, y: 1, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        scale: { x: 1, y: 1, z: 1 },
      },
      constraint: range(flexionMax),
    },
  ],
});

const motion: (flexion: number, times?: number [ ]) => IAutoMovieMotion = (flexion: number, times: number[] = [0, 1]): IAutoMovieMotion => ({
  id: "source-motion",
  skeleton: "source-rig",
  duration: 1,
  loop: false,
  keyframes: times.map((time: number): IAutoMovieKeyframe => ({
    time,
    pose: {
      skeleton: "source-rig",
      root: null,
      joints: [{ bone: "leftUpperArm", flexion, abduction: 0, twist: 0 }],
    },
    expression: null,
    easing: "linear",
    bezier: null,
  })),
  gaitCycle: null,
});

/**
 * Retargeting admits only motion already valid in its declared source rig.
 *
 * Scenarios:
 *
 * 1. A source-valid clip reaches target conversion unchanged apart from target
 *    identity.
 * 2. A pose accepted by the target's wider ROM is still refused when it exceeds
 *    the source rig's authored ROM.
 * 3. A clip with a reversed source clock is refused at its source-motion path
 *    before conversion can relabel it as target motion.
 * 4. Enabled contacts reject nonfinite/negative tolerance, nonfinite scalar ground and nonfinite, reversed or out-of-clip hand windows by their own paths; disabled contacts ignore unused policy and zero tolerance/single-frame windows remain valid.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls public retarget admission and checks returned motion identity or null plus field-located source ROM, clock and contact-policy errors; invalid tolerance/window values cannot silently remove stance.
 * @evidence contracts/testing.md#independent-expectations Source flexion bound 30 admits20 and refuses60 despite target bound180; duration1 admits inclusive [0,1] contact bounds and zero tolerance, while reversed/outside/nonfinite values have no valid source-clock meaning.
 * @evidence contracts/testing.md#distinguishing-cases Source-valid, source-ROM-invalid, reversed-clock and static-contact boundaries distinguish conversion from refusal; disabled policy ignores unused fields. Dynamic ground failures and actual pin residuals belong to planting/contact suites.
 * @evidence contracts/testing.md#execution-ownership Portable unit test discovered through test_engine_retarget_source_validation; this function owns its directly invoked cases and uses no native artifact, renderer or consumer installation.
 */
export function test_engine_retarget_source_validation(): void {
  const source: IAutoMovieSkeleton = skeleton("source-rig", 30);
  const target: IAutoMovieSkeleton = skeleton("target-rig", 180);

  const accepted: ReturnType<typeof retargetHumanoidMotion> = retargetHumanoidMotion({
    motion: motion(20),
    source,
    target,
    contacts: { enabled: false },
  });
  TestValidator.equals(
    "source-valid motion reaches target conversion",
    {
      validation: accepted.validation,
      target: accepted.motion?.skeleton,
    },
    { validation: { success: true }, target: "target-rig" },
  );

  const sourceRomFailure: ReturnType<typeof retargetHumanoidMotion> = retargetHumanoidMotion({
    motion: motion(60),
    source,
    target,
    contacts: { enabled: false },
  });
  TestValidator.equals(
    "source ROM failure is not laundered through a wider target ROM",
    {
      refused: sourceRomFailure.motion === null,
      located: hasViolation(
        sourceRomFailure.validation,
        "rom",
        "$input.motion.keyframes[0].pose.joints[0].flexion",
      ),
    },
    { refused: true, located: true },
  );

  const sourceClockFailure: ReturnType<typeof retargetHumanoidMotion> = retargetHumanoidMotion({
    motion: motion(20, [0.75, 0.5]),
    source,
    target,
    contacts: { enabled: false },
  });
  TestValidator.equals(
    "source temporal failure remains located on the source clip",
    {
      refused: sourceClockFailure.motion === null,
      located: hasViolation(
        sourceClockFailure.validation,
        "temporal",
        "$input.motion.keyframes[1].time",
      ),
    },
    { refused: true, located: true },
  );
  const hand: NonNullable<IAutoMovieRetargetContactProps["hands"]>[number] = {
    hand: "leftHand", upper: "leftUpperArm", lower: "leftLowerArm", start: 0, end: 1,
  };
  const cases: { contacts: IAutoMovieRetargetContactProps; path: string; kind: "range" | "temporal" }[] = [
    ...[Number.NaN, Number.POSITIVE_INFINITY, -0.01].map((tolerance: number): (typeof cases)[number] => ({ contacts: { tolerance }, path: "$input.contacts.tolerance", kind: "range" })),
    ...[Number.NaN, Number.NEGATIVE_INFINITY].map((groundY: number): (typeof cases)[number] => ({ contacts: { groundY }, path: "$input.contacts.groundY", kind: "range" })),
    ...[Number.NaN, -0.01, 1.01].map((start: number): (typeof cases)[number] => ({ contacts: { hands: [{ ...hand, start }] }, path: "$input.contacts.hands[0].start", kind: "range" })),
    ...[Number.NaN, -0.01, 1.01].map((end: number): (typeof cases)[number] => ({ contacts: { hands: [{ ...hand, end }] }, path: "$input.contacts.hands[0].end", kind: "range" })),
    { contacts: { hands: [{ ...hand, start: 0.8, end: 0.2 }] }, path: "$input.contacts.hands[0].end", kind: "temporal" },
  ];
  for (const entry of cases) {
    const result: ReturnType<typeof retargetHumanoidMotion> = retargetHumanoidMotion({ motion: motion(20), source, target, contacts: entry.contacts });
    TestValidator.equals(`contact policy refuses ${entry.path}`, { nullMotion: result.motion === null, located: hasViolation(result.validation, entry.kind, entry.path) }, { nullMotion: true, located: true });
  }
  for (const contacts of [{ enabled: false, tolerance: Number.NaN, hands: [{ ...hand, start: -1 }] }, { tolerance: 0, groundY: 0, hands: [{ ...hand, start: 1, end: 1 }] }])
    TestValidator.predicate("unused disabled policy and inclusive zero-tolerance boundary remain valid", (): boolean => retargetHumanoidMotion({ motion: motion(20), source, target, contacts }).motion !== null);
}
