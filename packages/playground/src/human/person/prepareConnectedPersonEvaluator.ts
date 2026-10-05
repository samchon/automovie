import {
  type IAutoMovieHumanPersonBodyView,
  type IAutoMovieHumanPersonHeadView,
  compileHumanPersonGeneration,
  createHumanPersonGenerationBuilder,
  joinHumanPersonGeneration,
} from "@automovie/human";

import type { IConnectedPersonEvaluator } from "./IConnectedPersonEvaluator";

/**
 * Join a person generation's head and body views, compile it and build its
 * one-skin evaluator once both views have arrived.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-measurements Compiles the evaluator person measurements are read and solved on.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-measurements Joins the head and body views once both arrive and builds the one-skin evaluator.
 * @author Samchon
 */
export async function prepareConnectedPersonEvaluator(
  head: Promise<IAutoMovieHumanPersonHeadView>,
  body: Promise<IAutoMovieHumanPersonBodyView>,
): Promise<IConnectedPersonEvaluator> {
  const generation = joinHumanPersonGeneration(await head, await body);
  return { compiled: compileHumanPersonGeneration(generation), build: createHumanPersonGenerationBuilder({ generation }) };
}
