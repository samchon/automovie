import {
  type IAutoMovieHumanPersonBodyView,
  type IAutoMovieHumanPersonHeadView,
  createHumanPersonGenerationBuilder,
  joinHumanPersonGeneration,
} from "@automovie/human";

import type { IConnectedPersonEvaluator } from "./IConnectedPersonEvaluator";

/**
 * Join a person generation's head and body views and compile its one-skin
 * evaluator once both views have arrived.
 *
 * @author Samchon
 */
export async function prepareConnectedPersonEvaluator(
  head: Promise<IAutoMovieHumanPersonHeadView>,
  body: Promise<IAutoMovieHumanPersonBodyView>,
): Promise<IConnectedPersonEvaluator> {
  const generation = joinHumanPersonGeneration(await head, await body);
  return { generation, build: createHumanPersonGenerationBuilder({ generation }) };
}
