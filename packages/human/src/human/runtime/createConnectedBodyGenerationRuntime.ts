import { createConnectedBodyRuntime } from "../../body/runtime/createConnectedBodyRuntime";
import type {
  IAutoMovieHumanPersonBodyView,
  IAutoMovieHumanPersonHeadView,
} from "../../index";
import { createHumanPersonBodyEndpointSource } from "../build/createHumanPersonBodyEndpointSource";
import { joinHumanPersonGeneration } from "../build/joinHumanPersonGeneration";
import { createConnectedBodySimpleWhole } from "./createConnectedBodySimpleWhole";

/**
 * Compose the body request runtime from actual loaded head/body generation views. Registered head endpoint geometry supplies the body gain owner's source context, while the same pair separately compiles whole-person stature/volume readers. The body runtime still returns body geometry; this factory constructs no face render model or second asset read. Loaded inputs and progress callbacks remain borrowed and must preserve source context during runtime lifetime.
 *
 * @evidence contracts/common.md#principled-implementation Joined matching generation views and actual head endpoint contributions feed the body compiler's existing source-partition path beside its coupled whole-person measurement reader.
 * @evidence contracts/common.md#clear-and-simple-design This composition supplies source context/readers/progress to the established body runtime rather than creating another transport, evaluator or geometry owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No marker or personal document substitutes for head endpoint source geometry, and compiling a request handler supplies no current viewport/GPU acceptance.
 * @evidence contracts/common.md#meaningful-documentation Prose states loaded-pair borrowing, body-only output, independent whole-person reading and no extra source fetch/face bootstrap.
 * @evidence contracts/performance.md#efficient-algorithms Generation joins scan source surfaces; endpoint projection and whole-person compilation pay actual source costs before the existing body runtime compiler/segment plan, not constant facade-only work.
 * @evidence contracts/performance.md#reuse-equivalent-work The supplied loaded pair serves runtime and measurement compilers without another asset read, and existing body request/evaluation owners are reused unchanged.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned body runtime retains borrowed source context/readers and its own compiled/cache state; this facade acquires no independent worker, fetch, timer or source handle.
 *
 * @author Samchon
 */
export function createConnectedBodyGenerationRuntime(
  head: IAutoMovieHumanPersonHeadView,
  body: IAutoMovieHumanPersonBodyView,
  progress?: (stage: string) => void,
): ReturnType<typeof createConnectedBodyRuntime> {
  const generation: ReturnType<typeof joinHumanPersonGeneration> =
    joinHumanPersonGeneration(head, body);
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
