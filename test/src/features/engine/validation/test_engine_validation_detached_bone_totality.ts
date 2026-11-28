import { AutoMovieEngineValidation } from "@automovie/engine";
import {
  type IAutoMovieBodyCollisionResult,
  type IAutoMovieCollisionActor,
  IAutoMovieConstraintViolation,
  IAutoMovieKeyframe,
  IAutoMovieMotion,
  IAutoMoviePose,
  IAutoMovieSkeleton,
  IAutoMovieTransform,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { hasViolation, namedFacts } from "../../internal/predicates";

const restAt: (x: number, y: number, z: number) => IAutoMovieTransform = (
  x: number,
  y: number,
  z: number,
): IAutoMovieTransform => ({
  translation: { x, y, z },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
});

/**
 * A skeleton with a **detached** bone: `leftFoot` is declared, but its parent
 * `leftLowerLeg` is absent, so its chain never reaches the null-parent root
 * (`hips`). `skeleton.bones` membership sees `leftFoot`, yet `resolvePose`'s
 * root-anchored walk never visits it.
 */
const DETACHED_SKELETON: IAutoMovieSkeleton = {
  id: "detached",
  bones: [
    { bone: "hips", parent: null, rest: restAt(0, 1, 0), constraint: null },
    {
      bone: "leftFoot",
      parent: "leftLowerLeg",
      rest: restAt(0, -0.9, 0),
      constraint: null,
    },
  ],
};

const restPose: IAutoMoviePose = {
  skeleton: DETACHED_SKELETON.id,
  root: null,
  joints: [],
};
const key: (time: number) => IAutoMovieKeyframe = (
  time: number,
): IAutoMovieKeyframe => ({
  time,
  pose: restPose,
  expression: null,
  easing: "linear",
  bezier: null,
});
const MOTION: IAutoMovieMotion = {
  id: "motion-detached",
  skeleton: DETACHED_SKELETON.id,
  duration: 1,
  loop: false,
  keyframes: [key(0), key(1)],
};

/**
 * A physics validator's bone membership is checked against the DECLARED set
 * (`skeleton.bones`), but `resolvePose` returns only the FK-REACHABLE set: the
 * bones its root-anchored walk visits. A declared-but-detached bone slips the
 * gap: the declared check passes, yet the resolved lookup comes back empty, and
 * the old code asserted it non-null and crashed. A validator must be total:
 * malformed input becomes a violation, never a thrown exception (the #593
 * severity/ledger contract, the same totality #685/#688 restored for the
 * collision oracle).
 *
 * `validateFootSkate`, `validateBalanceSupport`, and the capsule validators
 * (`validateSelfIntersection`, `detectBodyCollision`, #1056) must all report
 * the detached bone as a `type` violation and never throw, while a normal
 * (fully-reachable) rig keeps validating exactly as before.
 *
 * Scenarios:
 *
 * 1. Detached foot contact, balance center and balance support each report a
 *    located reachability error.
 * 2. Detached self-intersection endpoints and both collision actors report their
 *    endpoint paths; collision emits no events or response.
 * 3. An absent foot reports must-exist rather than not-reachable, and a connected
 *    rig succeeds for footskate and balance.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Covers detached endpoint reachability, absent bones and connected controls in four physics validators.
 * @evidence contracts/development/testing.md#behavioral-verification Calls foot skate, balance support, self-intersection and body collision on rigs whose relevant named bones are detached or unspecified.
 * @evidence contracts/development/testing.md#independent-expectations A bone with no path from a root has no resolved frame despite being declared. That differs from an undeclared bone and from a connected control. Missing collision endpoints cannot witness a contact or response.
 */
export function test_engine_validation_detached_bone_totality(): void {
  // footskate: a contact on the detached bone reports, does not crash.
  const foot: IAutoMovieValidation = AutoMovieEngineValidation.validateFootSkate({
    motion: MOTION,
    skeleton: DETACHED_SKELETON,
    contacts: [{ bone: "leftFoot", start: 0, end: 1 }],
  });
  TestValidator.equals(
    "footskate: detached contact bone is a reachability violation, not a crash",
    namedFacts([
      [
        "hasViolationFootType",
        (): boolean => hasViolation(foot, "type", "contacts[0].bone"),
      ],
      ["footSuccess", (): boolean => foot.success === false],
      [
        "footViolationsV",
        (): boolean =>
          foot.success === false &&
          foot.violations.some((v: IAutoMovieConstraintViolation): boolean =>
            v.expected.includes("not reachable"),
          ),
      ],
    ]),
    { hasViolationFootType: true, footSuccess: true, footViolationsV: true },
  );

  // balance: a detached centerBone reports, does not crash.
  const center: IAutoMovieValidation = AutoMovieEngineValidation.validateBalanceSupport({
    motion: MOTION,
    skeleton: DETACHED_SKELETON,
    supports: [
      { centerBone: "leftFoot", supportBones: ["hips"], start: 0, end: 1 },
    ],
  });
  TestValidator.equals(
    "balance: detached centerBone is a reachability violation, not a crash",
    namedFacts([
      [
        "hasViolationCenterType",
        (): boolean => hasViolation(center, "type", "supports[0].centerBone"),
      ],
      ["centerSuccess", (): boolean => center.success === false],
      [
        "centerViolationsV",
        (): boolean =>
          center.success === false &&
          center.violations.some((v: IAutoMovieConstraintViolation): boolean =>
            v.expected.includes("not reachable"),
          ),
      ],
    ]),
    {
      hasViolationCenterType: true,
      centerSuccess: true,
      centerViolationsV: true,
    },
  );

  // balance: a detached support bone reports, does not crash.
  const support: IAutoMovieValidation = AutoMovieEngineValidation.validateBalanceSupport({
    motion: MOTION,
    skeleton: DETACHED_SKELETON,
    supports: [
      { centerBone: "hips", supportBones: ["leftFoot"], start: 0, end: 1 },
    ],
  });
  TestValidator.equals(
    "balance: detached support bone is a reachability violation, not a crash",
    namedFacts([
      [
        "hasViolationSupportType",
        (): boolean =>
          hasViolation(support, "type", "supports[0].supportBones"),
      ],
      ["supportSuccess", (): boolean => support.success === false],
      [
        "supportViolationsV",
        (): boolean =>
          support.success === false &&
          support.violations.some((v: IAutoMovieConstraintViolation): boolean =>
            v.expected.includes("not reachable"),
          ),
      ],
    ]),
    {
      hasViolationSupportType: true,
      supportSuccess: true,
      supportViolationsV: true,
    },
  );

  // self-intersection: a capsule endpoint on the detached bone reports at the
  // endpoint's own path, does not crash (#1056).
  const capsule: IAutoMovieValidation = AutoMovieEngineValidation.validateSelfIntersection({
    motion: MOTION,
    skeleton: DETACHED_SKELETON,
    pairs: [
      {
        first: { from: "hips", to: "leftFoot", radius: 0.1 },
        second: { from: "leftFoot", to: "hips", radius: 0.1 },
      },
    ],
  });
  TestValidator.equals(
    "self-intersection: detached capsule endpoint is a reachability violation, not a crash",
    namedFacts([
      [
        "hasViolationCapsuleType",
        (): boolean => hasViolation(capsule, "type", "pairs[0].first.to"),
      ],
      [
        "hasViolationCapsuleType2",
        (): boolean => hasViolation(capsule, "type", "pairs[0].second.from"),
      ],
      ["capsuleSuccess", (): boolean => capsule.success === false],
      [
        "capsuleViolationsV",
        (): boolean =>
          capsule.success === false &&
          capsule.violations.some((v: IAutoMovieConstraintViolation): boolean =>
            v.expected.includes("not reachable"),
          ),
      ],
    ]),
    {
      hasViolationCapsuleType: true,
      hasViolationCapsuleType2: true,
      capsuleSuccess: true,
      capsuleViolationsV: true,
    },
  );

  // body collision: a detached endpoint on either actor reports, does not
  // crash, and sampling is skipped (#1056).
  const actor: (node: string) => IAutoMovieCollisionActor = (
    node: string,
  ): IAutoMovieCollisionActor => ({
    node,
    skeleton: DETACHED_SKELETON,
    motion: MOTION,
    capsules: [{ from: "hips", to: "leftFoot", radius: 0.1 }],
    body: null,
  });
  const collision: IAutoMovieBodyCollisionResult = AutoMovieEngineValidation.detectBodyCollision({
    a: actor("a"),
    b: actor("b"),
  });
  TestValidator.equals(
    "body collision: detached capsule endpoint is a reachability violation, not a crash",
    namedFacts([
      [
        "hasViolationCollisionValidation",
        (): boolean =>
          hasViolation(collision.validation, "type", "a.capsules[0].to"),
      ],
      [
        "hasViolationCollisionValidation2",
        (): boolean =>
          hasViolation(collision.validation, "type", "b.capsules[0].to"),
      ],
      [
        "collisionValidationSuccess",
        (): boolean => collision.validation.success === false,
      ],
      ["collisionEvents", (): boolean => collision.events.length === 0],
      ["collisionResponse", (): boolean => collision.response === null],
    ]),
    {
      hasViolationCollisionValidation: true,
      hasViolationCollisionValidation2: true,
      collisionValidationSuccess: true,
      collisionEvents: true,
      collisionResponse: true,
    },
  );

  // A bone entirely absent from the skeleton still reports "must exist", NOT
  // the reachability message: the two failures stay distinct.
  const absent: IAutoMovieValidation = AutoMovieEngineValidation.validateFootSkate({
    motion: MOTION,
    skeleton: DETACHED_SKELETON,
    contacts: [{ bone: "rightFoot", start: 0, end: 1 }],
  });
  TestValidator.equals(
    "footskate: an absent bone reports must-exist, not unreachable",
    namedFacts([
      ["absentSuccess", (): boolean => absent.success === false],
      [
        "absentViolationsV",
        (): boolean =>
          absent.success === false &&
          absent.violations.some((v: IAutoMovieConstraintViolation): boolean =>
            v.expected.includes("must exist"),
          ),
      ],
      [
        "absentViolationsV2",
        (): boolean =>
          absent.success === false &&
          !absent.violations.some((v: IAutoMovieConstraintViolation): boolean =>
            v.expected.includes("not reachable"),
          ),
      ],
    ]),
    { absentSuccess: true, absentViolationsV: true, absentViolationsV2: true },
  );

  // A fully-reachable rig validates with no bone-structure violations (the
  // reachability gate never fires on a well-formed skeleton).
  const reachableSkeleton: IAutoMovieSkeleton = {
    id: "reachable",
    bones: [
      { bone: "hips", parent: null, rest: restAt(0, 1, 0), constraint: null },
      {
        bone: "leftFoot",
        parent: "hips",
        rest: restAt(0, -0.9, 0),
        constraint: null,
      },
    ],
  };
  const wellFormed: IAutoMovieValidation = AutoMovieEngineValidation.validateFootSkate({
    motion: { ...MOTION, skeleton: reachableSkeleton.id },
    skeleton: reachableSkeleton,
    contacts: [{ bone: "leftFoot", start: 0, end: 1 }],
  });
  TestValidator.equals(
    "footskate: a reachable rig reports no bone-structure violation",
    wellFormed.success,
    true,
  );
  const wellFormedBalance: IAutoMovieValidation = AutoMovieEngineValidation.validateBalanceSupport({
    motion: { ...MOTION, skeleton: reachableSkeleton.id },
    skeleton: reachableSkeleton,
    supports: [
      { centerBone: "hips", supportBones: ["leftFoot"], start: 0, end: 1 },
    ],
  });
  TestValidator.equals(
    "balance: a reachable rig reports no bone-structure violation",
    wellFormedBalance.success,
    true,
  );
}
