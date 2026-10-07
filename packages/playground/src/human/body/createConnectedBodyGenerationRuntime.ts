import type { IAutoMovieHumanPersonBodyView, IAutoMovieHumanPersonHeadView } from "@automovie/human";
import { joinHumanPersonGeneration } from "@automovie/human/human/build/joinHumanPersonGeneration";
import { createHumanPersonBodyEndpointSource } from "@automovie/human/human/build/createHumanPersonBodyEndpointSource";
import { createConnectedBodyRuntime } from "./connectedBodyRuntime";
import { createConnectedBodySimpleWhole } from "./createConnectedBodySimpleWhole";

/**
 * Compile the body viewport from its actual paired source views. The head
 * contributes the real endpoint geometry that the body channel gain owner
 * admits; neither a personal document nor an empty marker supplies it. The
 * body stays the displayed and exported model, and no face construction or
 * bootstrap is needed to provide the source context. The same loaded pair
 * supplies its whole-person stature and volume reader.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Makes body edits consume the actual generation's external head endpoint contributions rather than a body-only source missing them.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Passes the owning body constructor its same-generation endpoint source while preserving the body numerical document.
 * @author Samchon
 */
export function createConnectedBodyGenerationRuntime(
  head: IAutoMovieHumanPersonHeadView,
  body: IAutoMovieHumanPersonBodyView,
  progress?: (stage: string) => void,
): ReturnType<typeof createConnectedBodyRuntime> {
  const generation = joinHumanPersonGeneration(head, body);
  return createConnectedBodyRuntime(body.body, createConnectedBodySimpleWhole(head, body), {
    progress,
    builderOptions: {
      physicalSource: "source-partition",
      endpointSource: createHumanPersonBodyEndpointSource(generation),
    },
  });
}
