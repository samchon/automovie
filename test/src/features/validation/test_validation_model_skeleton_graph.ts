import { validateModel } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieConstraintViolation,
  IAutoMovieModel,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { IDENTITY_TRANSFORM } from "../internal/IDENTITY_TRANSFORM";
import { createModel } from "../internal/createModel";
import { hasViolation } from "../internal/hasViolation";
import { namedFacts } from "../internal/namedFacts";

const b: (
  bone: AutoMovieHumanoidBone,
  parent: AutoMovieHumanoidBone | null,
) => IAutoMovieBone = (
  bone: AutoMovieHumanoidBone,
  parent: AutoMovieHumanoidBone | null,
): IAutoMovieBone => ({
  bone,
  parent,
  rest: IDENTITY_TRANSFORM,
  constraint: null,
});

/**
 * Exercise skeleton connectivity through model admission: declared parents, one root and root reachability are independent requirements.
 *
 * Scenarios:
 *
 * 1. `spine` names missing parent `neck` -> a type violation on its parent.
 * 2. `hips` and `spine` are both roots -> a type violation on the bone list.
 * 3. A single-rooted skeleton plus a detached two-bone cycle -> both detached cycle bones are unreachable.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls validateModel on missing-parent, two-root and detached-cycle graphs, requiring each respective refusal and both unreachable bone addresses.
 * @evidence contracts/testing.md#independent-expectations Literal parent edges establish whether a name resolves, roots number one and each bone is reachable; the detached pair links only to itself, independently of the traversal implementation.
 * @evidence contracts/testing.md#distinguishing-cases Separates unresolved parent, root-count and detached-cycle failures; model_valid owns the connected admitted graph and duplicate names are tested elsewhere.
 * @evidence contracts/testing.md#execution-ownership The named unit constructs ordinary bone records using the existing identity transform; no Human model, FK renderer or dynamically registered case is created.
 */
export function test_validation_model_skeleton_graph(): void {
  const base: IAutoMovieModel = createModel();

  const missingParent: IAutoMovieValidation = validateModel({
    model: {
      ...base,
      skeleton: {
        ...base.skeleton!,
        bones: [b("hips", null), b("spine", "neck")],
      },
    },
  });
  TestValidator.equals("missing parent fails", missingParent.success, false);
  TestValidator.predicate(
    "missing parent violation",
    hasViolation(missingParent, "type", "$input.skeleton.bones[1].parent"),
  );

  const twoRoots: IAutoMovieValidation = validateModel({
    model: {
      ...base,
      skeleton: {
        ...base.skeleton!,
        bones: [b("hips", null), b("spine", null)],
      },
    },
  });
  TestValidator.equals("two roots fail", twoRoots.success, false);
  TestValidator.equals(
    "root count violation",
    namedFacts([
      ["refused", (): boolean => twoRoots.success === false],
      [
        "violated",
        (): boolean =>
          twoRoots.success === false &&
          twoRoots.violations.some(
            (v: IAutoMovieConstraintViolation): boolean =>
              v.path.endsWith("$input.skeleton.bones") &&
              String(v.expected).includes("exactly one root"),
          ),
      ],
    ]),
    { refused: true, violated: true },
  );

  const detachedCycle: IAutoMovieValidation = validateModel({
    model: {
      ...base,
      skeleton: {
        ...base.skeleton!,
        bones: [
          b("hips", null),
          b("spine", "hips"),
          b("leftHand", "leftLowerArm"),
          b("leftLowerArm", "leftHand"),
        ],
      },
    },
  });
  TestValidator.equals("detached cycle fails", detachedCycle.success, false);
  TestValidator.equals(
    "detached cycle bones unreachable",
    namedFacts([
      ["detachedCycleSuccess", (): boolean => detachedCycle.success === false],
      [
        "hasViolationDetachedCycleType",
        (): boolean =>
          detachedCycle.success === false &&
          hasViolation(detachedCycle, "type", "$input.skeleton.bones[2]"),
      ],
      [
        "hasViolationDetachedCycleType2",
        (): boolean =>
          detachedCycle.success === false &&
          hasViolation(detachedCycle, "type", "$input.skeleton.bones[3]"),
      ],
    ]),
    {
      detachedCycleSuccess: true,
      hasViolationDetachedCycleType: true,
      hasViolationDetachedCycleType2: true,
    },
  );
}
