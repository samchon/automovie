import type {
  IAutoMovieConstraintViolation,
  IAutoMovieDiagnostic,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import path from "node:path";

import { analysisContext } from "../internal/analysisFixtures";
import { createLibraryContributionAdmissionInput } from "../internal/createLibraryContributionAdmissionInput";
import { drawingBoxModel } from "../internal/drawingFixtures";
import { rectangularBuilding } from "../internal/envelopeFixtures";
import { loadSourceModule } from "../internal/loadSourceModule";

const { admitAutoMovieLibraryContribution } = loadSourceModule<{
  admitAutoMovieLibraryContribution(
    props: ReturnType<typeof createLibraryContributionAdmissionInput>,
  ): boolean;
}>(
  path.resolve(
    __dirname,
    "../../../../packages/production/src/production/admitAutoMovieLibraryContribution.ts",
  ),
);

/**
 * Contribution admission classifies domain findings without losing attribution.
 *
 * Scenarios:
 * 1. Error findings from each carrier refuse its contribution, preserve source
 *    and target, and leave its identity claimed for the complete attempt.
 * 2. Warning findings from each carrier remain visible without refusing it.
 * 3. An older error is not attributed to a later valid contribution.
 */
export const test_production_library_contribution_findings = (): void => {
  for (const severity of ["error", "warning"] as const) {
    const contribution = {
      environments: [rectangularBuilding()],
      models: [
        drawingBoxModel({
          id: "ship",
          shape: { type: "box", width: 1, height: 1, depth: 1 },
          material: "wood",
        }),
      ],
      contexts: [analysisContext()],
    };
    const input = createLibraryContributionAdmissionInput(contribution);
    const before: IAutoMovieDiagnostic = {
      code: "generated-stale",
      category: "error",
      phase: "compile",
      target: "older-target",
      path: null,
      message: "An older target is stale.",
    };
    input.diagnostics.push(before);
    const finding = (path: string): IAutoMovieConstraintViolation => ({
      kind: "range",
      path,
      expected: "within the declared carrier range",
      value: -1,
      severity,
    });
    const answer = (path: string): IAutoMovieValidation =>
      severity === "error"
        ? { success: false, violations: [finding(path)] }
        : { success: true, warnings: [finding(path)] };
    input.validators = {
      environment: () => answer("$input.spaces[0]"),
      model: () => answer("$input.parts[0]"),
      context: () => answer("$input.north"),
    };
    TestValidator.equals(
      "only new errors refuse this contribution",
      admitAutoMovieLibraryContribution(input),
      severity === "warning",
    );
    TestValidator.predicate(
      "older diagnostic remains its exact original record",
      input.diagnostics[0] === before,
    );
    TestValidator.equals(
      "every carrier finding retains its source target and tier",
      input.diagnostics
        .slice(1)
        .map(({ category, phase, path, target }) => ({
          category,
          phase,
          path,
          target,
        })),
      Array.from({ length: 3 }, () => ({
        category: severity,
        phase: "source" as const,
        path: input.source,
        target: input.target,
      })),
    );
    TestValidator.equals(
      "findings retain their exact carrier paths",
      input.diagnostics
        .slice(1)
        .map((diagnostic) =>
          [".spaces[0]", ".parts[0]", ".north"].filter((path) =>
            diagnostic.message.includes(path),
          ),
        ),
      [[".spaces[0]"], [".parts[0]"], [".north"]],
    );
    TestValidator.equals(
      "a refused contribution still owns its claimed identities",
      [
        input.environmentOwner.size,
        input.modelOwner.size,
        input.contextOwner.size,
        input.models.size,
      ],
      [1, 1, 1, 1],
    );
  }
};
