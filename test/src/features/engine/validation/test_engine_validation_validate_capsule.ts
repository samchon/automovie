import { AutoMovieEngineViolationCollector, AutoMovieEngineValidation } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieCapsuleProxy,
  IAutoMovieConstraintViolation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * `validateCapsule` admits a collision capsule whose two distinct endpoints are
 * bones of the skeleton reachable from a root, with a positive radius, and
 * reports every failure at its own path.
 *
 * Skeleton {hips, spine, leftFoot}, of which only hips and spine are reachable.
 *
 * Scenarios:
 *
 * 1. Hips → spine, radius 0.1, is valid with no finding.
 * 2. Hips → leftFoot names a declared but unreachable bone at `to`.
 * 3. Hips → head names a bone the skeleton lacks at `to`.
 * 4. Hips → hips with radius 0 is refused at the capsule and at its radius.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Covers resident and reachable endpoint rules, distinct endpoints and the positive-radius boundary.
 * @evidence contracts/development/testing.md#behavioral-verification Calls validateCapsule on explicit endpoint pairs with a separately defined declared and reachable set.
 * @evidence contracts/development/testing.md#independent-expectations The fixture admits only hips and spine as reachable; leftFoot exists but is disconnected and head is absent. A self-pair and zero radius violate two independent conditions.
 */
export function test_engine_validation_validate_capsule(): void {
  const skeleton: ReadonlySet<AutoMovieHumanoidBone> = new Set([
    "hips",
    "spine",
    "leftFoot",
  ]);
  const reachable: ReadonlySet<AutoMovieHumanoidBone> = new Set([
    "hips",
    "spine",
  ]);
  const judge = (
    capsule: IAutoMovieCapsuleProxy,
  ): { valid: boolean; findings: string[][] } => {
    const collector: AutoMovieEngineViolationCollector = new AutoMovieEngineViolationCollector();
    const valid: boolean = AutoMovieEngineValidation.validateCapsule(
      capsule,
      "$c",
      skeleton,
      reachable,
      collector,
    );
    return {
      valid,
      findings: collector.items.map(
        (item: IAutoMovieConstraintViolation): string[] => [
          item.kind,
          item.path,
        ],
      ),
    };
  };
  TestValidator.equals(
    "each capsule's verdict",
    [
      judge({ from: "hips", to: "spine", radius: 0.1 }),
      judge({ from: "hips", to: "leftFoot", radius: 0.1 }),
      judge({ from: "hips", to: "head", radius: 0.1 }),
      judge({ from: "hips", to: "hips", radius: 0 }),
    ],
    [
      { valid: true, findings: [] },
      { valid: false, findings: [["type", "$c.to"]] },
      { valid: false, findings: [["type", "$c.to"]] },
      {
        valid: false,
        findings: [
          ["type", "$c"],
          ["range", "$c.radius"],
        ],
      },
    ],
  );
}
