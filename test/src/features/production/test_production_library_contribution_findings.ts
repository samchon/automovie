import type {
  IAutoMovieConstraintViolation,
  IAutoMovieDiagnostic,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { admitAutoMovieLibraryContribution } from "../../../../packages/production/src/production/admitAutoMovieLibraryContribution";

import { analysisContext } from "../internal/analysisFixtures";
import { createLibraryContributionAdmissionInput } from "../internal/createLibraryContributionAdmissionInput";
import { drawingBoxModel } from "../internal/drawingFixtures";
import { rectangularBuilding } from "../internal/envelopeFixtures";

/**
 * Contribution admission classifies domain findings without losing attribution.
 *
 * Scenarios:
 * 1. Error findings from each carrier refuse its contribution, preserve source
 *    and target, and leave its identity claimed for the complete attempt.
 * 2. Warning findings from each carrier remain visible without refusing it.
 * 3. An older error is not attributed to a later valid contribution.
 *
 * @evidence contracts/testing.md#behavioral-verification Admits a contribution through actual ownership policy and its declared domain-validator port, checking warning/error verdicts, exact prior-diagnostic identity, all carrier finding addresses and ownership claims retained after refusal.
 * @evidence contracts/testing.md#independent-expectations Three injected carrier findings determine three source-attributed diagnostics; only newly emitted errors refuse this contribution, while an older error remains unchanged. The injected validators isolate attribution and do not independently establish carrier validity.
 * @evidence contracts/testing.md#distinguishing-cases Error and warning findings exercise all three carriers against an existing unrelated error, and ownership counts remain claimed in both modes; real carrier validity and duplicate ownership have the companion ownership test.
 * @evidence contracts/testing.md#execution-ownership The discoverable test_production_library_contribution_findings synchronously executes actual policy with its caller-owned validator capability; it substitutes no globals or foreign methods and starts no evaluator process.
 */
export function test_production_library_contribution_findings(): void {
  for (const severity of ["error", "warning"] as const) {
    const contribution: Parameters<typeof createLibraryContributionAdmissionInput>[0] = {
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
    const input: ReturnType<typeof createLibraryContributionAdmissionInput> = createLibraryContributionAdmissionInput(contribution);
    const before: IAutoMovieDiagnostic = {
      code: "generated-stale",
      category: "error",
      phase: "compile",
      target: "older-target",
      path: null,
      message: "An older target is stale.",
    };
    input.diagnostics.push(before);
    const finding: (path: string) => IAutoMovieConstraintViolation = (path: string): IAutoMovieConstraintViolation => ({
      kind: "range",
      path,
      expected: "within the declared carrier range",
      value: -1,
      severity,
    });
    const answer: (path: string) => IAutoMovieValidation = (path: string): IAutoMovieValidation =>
      severity === "error"
        ? { success: false, violations: [finding(path)] }
        : { success: true, warnings: [finding(path)] };
    input.validators = {
      environment: (): IAutoMovieValidation => answer("$input.spaces[0]"),
      model: (): IAutoMovieValidation => answer("$input.parts[0]"),
      context: (): IAutoMovieValidation => answer("$input.north"),
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
      input.diagnostics.slice(1).map(({ category, phase, path, target }: IAutoMovieDiagnostic): Pick<IAutoMovieDiagnostic, "category" | "phase" | "path" | "target"> => ({
        category,
        phase,
        path,
        target,
      })),
      Array.from({ length: 3 }, (): Pick<IAutoMovieDiagnostic, "category" | "phase" | "path" | "target"> => ({
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
        .map((diagnostic: IAutoMovieDiagnostic): string[] =>
          [".spaces[0]", ".parts[0]", ".north"].filter((path: string): boolean =>
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
}
