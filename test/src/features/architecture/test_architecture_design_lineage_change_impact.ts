import type {
  IAutoMovieDesignImpact,
  IAutoMovieDesignLineage,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { designLineageImpact } from "@automovie/engine";
import { brokenLineage, renovationLineage } from "../internal/lineageFixtures";
import { throwsError } from "../internal/predicates";

/**
 * Trace changed identities through authored derivation edges and account for unaffected artifacts beside invalidated ones.
 *
 * Scenarios:
 * 1. One opening change invalidates the wall mesh, the finish cut, the door mesh, the quantity, and the render, and leaves the six unrelated artifacts untouched.
 * 2. The same question asked twice about the same identity deduplicates rather than doubling the answer.
 * 3. Naming oak-texture as changed reaches its declared dependents, including render-warm while leaving render-cool unaffected; no asset bytes are replaced.
 * 4. A derived artifact named as changed invalidates itself and its dependents.
 * 5. Two unrelated changes union their impact rather than one shadowing the other.
 * 6. Changing nothing invalidates nothing and leaves every artifact accounted for, which is the boundary that proves the partition is total.
 * 7. An identity no graph declared is refused rather than traced as empty, and an incoherent lineage is refused before any impact is computed.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls designLineageImpact for subject, asset and derived-artifact ids, comparing complete changed/invalidated/unaffected lists and named refusals. A missing transitive dependency, a changed artifact excluded from itself, duplicate ids or collateral invalidation of unrelated artifacts changes these observations; the call computes a graph answer without rebuilding outputs.
 * @evidence contracts/testing.md#independent-expectations Explicit fixture input edges give opening-door's five invalidated and six unaffected artifacts, and oak-texture's four invalidated and seven unaffected artifacts. Literal partitions also cover the changed mesh, union of unrelated ids and empty set. The duplicate-id relation shares the same query, beside these independent lists; neither that relation nor the asset id observes changed disk bytes.
 * @evidence contracts/testing.md#distinguishing-cases Opening, imported-asset id, derived artifact and two unrelated changes, duplicates, empty changes, unknown ids and invalid lineage cover selective invalidation; no actual artifact rebuild or external file mutation runs here.
 * @evidence contracts/testing.md#execution-ownership Portable CPU unit test_architecture_design_lineage_change_impact imports the actual engine/archetype operations and owns its locally enumerated cases; no dynamic registration, consumer installation, native artifact build, process, browser or GPU host is required.
 */
export function test_architecture_design_lineage_change_impact(): void {
  const lineage: IAutoMovieDesignLineage = renovationLineage();

  TestValidator.equals(
    "one opening change invalidates its wall, cut, door, quantity, and render",
    designLineageImpact(lineage, ["opening-door"]),
    {
      changed: ["opening-door"],
      invalidated: [
        "cut-floor-oak",
        "mesh-door-leaf",
        "mesh-wall-north",
        "quantity-finishes",
        "render-lobby",
      ],
      unaffected: [
        "cut-floor-west",
        "mesh-wall-west",
        "render-cool",
        "render-strip-phase",
        "render-warm",
        "render-west",
      ],
    },
  );

  TestValidator.equals(
    "asking twice about one identity deduplicates instead of doubling",
    designLineageImpact(lineage, ["opening-door", "opening-door"]),
    designLineageImpact(lineage, ["opening-door"]),
  );

  TestValidator.equals(
    "changing an imported asset's bytes invalidates the outputs reading it",
    designLineageImpact(lineage, ["oak-texture"]),
    {
      changed: ["oak-texture"],
      invalidated: [
        "cut-floor-oak",
        "quantity-finishes",
        "render-lobby",
        "render-warm",
      ],
      unaffected: [
        "cut-floor-west",
        "mesh-door-leaf",
        "mesh-wall-north",
        "mesh-wall-west",
        "render-cool",
        "render-strip-phase",
        "render-west",
      ],
    },
  );

  TestValidator.equals(
    "a derived artifact named as changed invalidates itself and its dependents",
    designLineageImpact(lineage, ["mesh-wall-north"]),
    {
      changed: ["mesh-wall-north"],
      invalidated: [
        "cut-floor-oak",
        "mesh-wall-north",
        "quantity-finishes",
        "render-lobby",
      ],
      unaffected: [
        "cut-floor-west",
        "mesh-door-leaf",
        "mesh-wall-west",
        "render-cool",
        "render-strip-phase",
        "render-warm",
        "render-west",
      ],
    },
  );

  TestValidator.equals(
    "two unrelated changes union their impact",
    designLineageImpact(lineage, ["opening-door", "wall-west"]),
    {
      changed: ["opening-door", "wall-west"],
      invalidated: [
        "cut-floor-oak",
        "cut-floor-west",
        "mesh-door-leaf",
        "mesh-wall-north",
        "mesh-wall-west",
        "quantity-finishes",
        "render-lobby",
        "render-west",
      ],
      unaffected: ["render-cool", "render-strip-phase", "render-warm"],
    },
  );

  TestValidator.equals(
    "changing nothing invalidates nothing and accounts for every artifact",
    designLineageImpact(lineage, []),
    {
      changed: [],
      invalidated: [],
      unaffected: [
        "cut-floor-oak",
        "cut-floor-west",
        "mesh-door-leaf",
        "mesh-wall-north",
        "mesh-wall-west",
        "quantity-finishes",
        "render-cool",
        "render-lobby",
        "render-strip-phase",
        "render-warm",
        "render-west",
      ],
    },
  );

  TestValidator.predicate(
    "an identity no graph declared is refused rather than traced as empty",
    throwsError(
      (): IAutoMovieDesignImpact => designLineageImpact(lineage, ["wall-east"]),
      'has no identity "wall-east" to trace',
    ),
  );
  TestValidator.predicate(
    "an incoherent lineage is refused before any impact is computed",
    throwsError(
      (): IAutoMovieDesignImpact =>
        designLineageImpact(
          brokenLineage((draft: IAutoMovieDesignLineage): void => {
            draft.head = "r9";
          }),
          ["opening-door"],
        ),
      'head revision "r9" does not resolve',
    ),
  );
}
