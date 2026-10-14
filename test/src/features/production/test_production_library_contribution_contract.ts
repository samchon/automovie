import type { IAutoMovieLibraryContribution } from "@automovie/interface";
import { autoMovieLibraryContributionDiagnostics } from "@automovie/production";
import { TestValidator } from "@nestia/e2e";

import { analysisContext } from "../internal/analysisFixtures";
import { drawingBoxModel } from "../internal/drawingFixtures";
import { rectangularBuilding } from "../internal/envelopeFixtures";
import { namedFacts } from "../internal/predicates";

/**
 * Library completion accepts only a nonempty result owned by its branch.
 *
 * Scenarios:
 *
 * 1. Map, model, and space owners publish one result in their current semantic
 *    carrier without a diagnostic.
 * 2. Empty and cross-branch payloads fail before completion.
 * 3. Material, instance, motion, and system branches receive one explicit
 *    unsupported-carrier refusal rather than completing through nested data.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls actual contribution diagnostics with map/model/space carriers and empty, cross-branch, unsupported and unknown owners, observing acceptance or the specific refusal population rather than executing source registration.
 * @evidence contracts/testing.md#independent-expectations The shipped protocol maps maps to contexts, models to models and spaces to environments, requires a nonempty own carrier and forbids foreign carriers; the other four recognized branches lack standalone carriers. These are protocol expectations, not independently validated domain geometry.
 * @evidence contracts/testing.md#distinguishing-cases Each supported nonempty carrier contrasts with empty completion, foreign payload and omitted optional contexts; unsupported recognized branches contrast with an unknown branch. Schema admission and carrier-domain validation belong to their own boundaries.
 * @evidence contracts/testing.md#execution-ownership The discoverable test_production_library_contribution_contract directly calls portable synchronous branch policy using existing data fixtures, without evaluating a consumer source module or starting a host.
 */
export function test_production_library_contribution_contract(): void {
  const empty: () => IAutoMovieLibraryContribution = (): IAutoMovieLibraryContribution => ({
    environments: [],
    models: [],
    contexts: [],
  });
  const map: IAutoMovieLibraryContribution = empty();
  map.contexts = [analysisContext()];
  const model: IAutoMovieLibraryContribution = empty();
  model.models = [
    drawingBoxModel({
      id: "bench",
      shape: { type: "box", width: 1, height: 1, depth: 1 },
      material: "wood",
    }),
  ];
  const space: IAutoMovieLibraryContribution = empty();
  space.environments = [rectangularBuilding()];

  TestValidator.equals(
    "library contribution carrier follows its exact semantic owner",
    namedFacts([
      [
        "supportedBranchesAcceptTheirOwnCarrier",
        (): boolean =>
          autoMovieLibraryContributionDiagnostics("maps", map).length === 0 &&
          autoMovieLibraryContributionDiagnostics("models", model).length ===
            0 &&
          autoMovieLibraryContributionDiagnostics("spaces", space).length === 0,
      ],
      [
        "supportedBranchesRefuseEmptyCompletion",
        (): boolean =>
          ["maps", "models", "spaces"].every((branch: string): boolean =>
            autoMovieLibraryContributionDiagnostics(branch, empty()).some(
              (message: string): boolean => message.includes("returned no"),
            ),
          ),
      ],
      [
        "crossBranchPayloadsAreRefused",
        (): boolean =>
          autoMovieLibraryContributionDiagnostics("maps", {
            ...map,
            models: model.models,
          }).some((message: string): boolean => message.includes("belongs to the models")) &&
          autoMovieLibraryContributionDiagnostics("models", {
            ...model,
            environments: space.environments,
          }).some((message: string): boolean => message.includes("belongs to the spaces")) &&
          autoMovieLibraryContributionDiagnostics("spaces", {
            ...space,
            contexts: map.contexts,
          }).some((message: string): boolean => message.includes("belongs to the maps")),
      ],
      [
        "unsupportedBranchesFailExplicitly",
        (): boolean =>
          ["materials", "instances", "motions", "systems"].every((branch: string): boolean => {
            const diagnostics: string[] = autoMovieLibraryContributionDiagnostics(
              branch,
              space,
            );
            return (
              diagnostics.length === 1 &&
              diagnostics[0]!.includes("no supported standalone result carrier")
            );
          }),
      ],
      [
        "unknownBranchDoesNotBorrowAResultCarrier",
        (): boolean =>
          autoMovieLibraryContributionDiagnostics("unknown", map)[0]?.includes(
            "not a recognized design owner",
          ) === true,
      ],
      [
        "omittedContextsReadAsEmpty",
        (): boolean =>
          autoMovieLibraryContributionDiagnostics("maps", {
            environments: [],
            models: [],
          }).some((message: string): boolean => message.includes("returned no contexts")),
      ],
    ]),
    {
      supportedBranchesAcceptTheirOwnCarrier: true,
      supportedBranchesRefuseEmptyCompletion: true,
      crossBranchPayloadsAreRefused: true,
      unsupportedBranchesFailExplicitly: true,
      unknownBranchDoesNotBorrowAResultCarrier: true,
      omittedContextsReadAsEmpty: true,
    },
  );
}
