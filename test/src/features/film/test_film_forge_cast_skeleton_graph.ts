import { IAutoMovieForgedCast } from "../../../../packages/engine/src/film/IAutoMovieForgedCast";
import { IAutoMovieConstraintViolation, AutoMovieHumanoidBone, IAutoMovieBone } from "@automovie/interface";
import { forgeCast } from "../../../../packages/engine/src/film/forgeCast";
import { TestValidator } from "@nestia/e2e";
import { forgeEntry, makeScriptWrite } from "../internal/filmFixtures";
import { IDENTITY_TRANSFORM } from "../internal/fixtures";
import { hasViolation, namedFacts } from "../internal/predicates";
const b: (bone: AutoMovieHumanoidBone, parent: AutoMovieHumanoidBone | null) => IAutoMovieBone = (
  bone: AutoMovieHumanoidBone,
  parent: AutoMovieHumanoidBone | null,
): IAutoMovieBone => ({
  bone,
  parent,
  rest: IDENTITY_TRANSFORM,
  constraint: null,
});

/**
 * Forged rigs must form one connected skeleton tree with terminating validation.
 *
 * Scenarios:
 * 1. Duplicate names, an unresolved parent and two roots report their local faults.
 * 2. A detached two-bone cycle beside one rooted chain reports both unreachable bones.
 * 3. A repeated child under one root terminates and reports only its duplicate name.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls forgeCast with three authored skeleton graphs and checks duplicate, missing-parent, root-count and reachability findings; the duplicate-child case detects spurious unreachable errors or nonterminating traversal.
 * @evidence contracts/testing.md#independent-expectations Unique bone names, one null parent and connectivity define a rooted tree. The detached cycle has no path from hips, while two declarations of spine share an otherwise reachable child; those explicit edges determine expected findings without running FK as an oracle.
 * @evidence contracts/testing.md#distinguishing-cases Distinguishes local multi-root faults, a locally resolvable detached cycle and a duplicate edge on a connected graph. Ordinary rig acceptance and transform/constraint scalar admission are covered elsewhere.
 * @evidence contracts/testing.md#execution-ownership The synchronous discoverable entry owns three portable forge/model graph cases and guarded named facts; no renderer or native rig is built and success here proves no posed appearance.
 */
export function test_film_forge_cast_skeleton_graph(): void {
  const broken: IAutoMovieForgedCast = forgeCast(makeScriptWrite(), {
    entries: [
      forgeEntry("knightB", {
        skeleton: {
          id: "skeleton-broken",
          bones: [
            b("hips", null),
            b("hips", null),
            b("spine", "neck"),
            b("chest", null),
          ],
        },
      }),
    ],
  });
  TestValidator.equals("broken fails", broken.success, false);
  if (broken.success === false) {
    TestValidator.predicate(
      "duplicate bone rejected",
      hasViolation(broken, "type", ".skeleton.bones[1].bone"),
    );
    TestValidator.predicate(
      "unresolvable parent rejected",
      hasViolation(broken, "type", ".skeleton.bones[2].parent"),
    );
    TestValidator.predicate(
      "root count rejected",
      broken.violations.some(
        (v: IAutoMovieConstraintViolation): boolean =>
          v.path.endsWith(".skeleton.bones") &&
          String(v.expected).includes("exactly one root"),
      ),
    );
  }

  const cyclic: IAutoMovieForgedCast = forgeCast(makeScriptWrite(), {
    entries: [
      forgeEntry("knightB", {
        skeleton: {
          id: "skeleton-cycle",
          bones: [
            b("hips", null),
            b("spine", "hips"),
            b("leftHand", "leftLowerArm"),
            b("leftLowerArm", "leftHand"),
          ],
        },
      }),
    ],
  });
  TestValidator.equals("cycle fails", cyclic.success, false);
  TestValidator.equals(
    "both detached-cycle bones unreachable",
    namedFacts([
      ["cyclicSuccess", (): boolean => cyclic.success === false],
      [
        "hasViolationCyclicType",
        (): boolean =>
          cyclic.success === false &&
          hasViolation(cyclic, "type", ".skeleton.bones[2]"),
      ],
      [
        "hasViolationCyclicType2",
        (): boolean =>
          cyclic.success === false &&
          hasViolation(cyclic, "type", ".skeleton.bones[3]"),
      ],
    ]),
    {
      cyclicSuccess: true,
      hasViolationCyclicType: true,
      hasViolationCyclicType2: true,
    },
  );

  const doubled: IAutoMovieForgedCast = forgeCast(makeScriptWrite(), {
    entries: [
      forgeEntry("knightB", {
        skeleton: {
          id: "skeleton-doubled",
          bones: [b("hips", null), b("spine", "hips"), b("spine", "hips")],
        },
      }),
    ],
  });
  TestValidator.equals("doubled fails", doubled.success, false);
  TestValidator.equals(
    "only the duplicate field is reported (walk terminates, nothing unreachable)",
    namedFacts([
      ["doubledSuccess", (): boolean => doubled.success === false],
      [
        "hasViolationDoubledType",
        (): boolean =>
          doubled.success === false &&
          hasViolation(doubled, "type", ".skeleton.bones[2].bone"),
      ],
      [
        "doubledViolationsV",
        (): boolean =>
          doubled.success === false &&
          doubled.violations.every((v: IAutoMovieConstraintViolation): boolean =>
            v.path.endsWith(".skeleton.bones[2].bone"),
          ),
      ],
    ]),
    {
      doubledSuccess: true,
      hasViolationDoubledType: true,
      doubledViolationsV: true,
    },
  );
}
