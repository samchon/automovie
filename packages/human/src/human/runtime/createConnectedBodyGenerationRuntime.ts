import type {
  IAutoMovieHumanPersonBodyView,
  IAutoMovieHumanPersonHeadView,
} from "../../index";
import { createHumanPersonBodyEndpointSource } from "../build/createHumanPersonBodyEndpointSource";
import { joinHumanPersonGeneration } from "../build/joinHumanPersonGeneration";

import { createConnectedBodyRuntime } from "../../body/runtime/createConnectedBodyRuntime";
import { createConnectedBodySimpleWhole } from "./createConnectedBodySimpleWhole";

/**
 * Compile the body viewport from its actual paired source views. The head
 * contributes the real endpoint geometry that the body channel gain owner
 * admits; neither a personal document nor an empty marker supplies it. The
 * body stays the displayed and exported model, and no face construction or
 * bootstrap is needed to provide the source context. The same loaded pair
 * supplies its whole-person stature and volume reader.
 *
 * @author Samchon
 */
export function createConnectedBodyGenerationRuntime(
  head: IAutoMovieHumanPersonHeadView,
  body: IAutoMovieHumanPersonBodyView,
  progress?: (stage: string) => void,
): ReturnType<typeof createConnectedBodyRuntime> {
  const generation = joinHumanPersonGeneration(head, body);
  return createConnectedBodyRuntime(
    body.body,
    createConnectedBodySimpleWhole(head, body),
    {
      progress,
      builderOptions: {
        physicalSource: "source-partition",
        endpointSource: createHumanPersonBodyEndpointSource(generation),
      },
    },
  );
}
