import type { AutoMovieEngineEnvironment } from "@automovie/engine";
import type {
  IAutoMovieEnvironmentContext,
  IAutoMovieHalfSpacePlane,
  IAutoMovieVector3,
} from "@automovie/interface";

import { assertAnalysisEnvironmentContextPart1 } from "../internal/assertAnalysisEnvironmentContextPart1";
import { assertAnalysisEnvironmentContextPart2 } from "../internal/assertAnalysisEnvironmentContextPart2";
import { assertAnalysisEnvironmentContextPart3 } from "../internal/assertAnalysisEnvironmentContextPart3";

/**
 * Validate declared site observations and exercise instant lookup, convex-ray clipping, ground directions and deterministic hemisphere sampling.
 *
 * Scenarios:
 * 1. The declared site validates clean, lookup observes the noon label and absent dawn, and projected solids retain the neighbour id and six-plane count.
 * 2. The existing field-mutation table refuses zero directions, a blank instant label, duplicated instant ids, non-increasing time, negative illuminance and out-of-range humidity.
 * 3. A sun below the horizon with a beam is refused; the same sun with no beam is accepted, and so is a sun above the horizon with a beam.
 * 4. A context id, an instant id and an occluder id colliding with a building-owned id are each refused; the same context beside unrelated building ids is accepted.
 * 5. An occluder of fewer than four half-spaces, with a zero normal, or with a non-finite offset is refused, and the assertion form of the same rule throws on a duplicate id and a malformed plane.
 * 6. The slab test answers hand geometry: inside, ahead, behind, parallel outside, parallel inside, beyond the ray's own length, and exactly tangent at the origin; a nearly parallel ray is judged by its slope against the unit normal, so scaling a plane's normal does not change the verdict.
 * 7. Hemisphere directions have the requested population, unit length and positive normal projection for both signs of normal z, an oblique normal and a singleton; fractional/zero counts and zero normals are refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the actual context validator, instant/solid projection, slab/union/horizon predicates and hemisphere sampler through ordered parts. Literal statuses, fields, ray verdicts, lengths/norms/projections, replay and located throws expose lost records, wrong horizon signs or scale-sensitive parallel clipping.
 * @evidence contracts/development/testing.md#independent-expectations Local unit-box inequalities determine ray entry/exit, exact face touch and the 0.5-versus-1 distance boundary; positive normal rescaling preserves one half-space. Sample directions must number count, have unit norm at original 1e-9 tolerance and positive normal dot product. Repeated JSON direction text checks only same-process deterministic serialization, not cross-platform execution or cosine-distribution accuracy; projection assertions observe id/count rather than reference ownership or complete field identity.
 * @evidence contracts/development/testing.md#distinguishing-cases Keeps every existing field mutation, valid/below-horizon/no-beam/unusable-ground twin, reserved context/instant/occluder ids, malformed planes, inside/outside/parallel/tangent/short rays, empty solid union, ground up/down/grazing and pole/oblique/singleton sampling. Arbitrary unknown containers and proof that every admitted plane set is nonempty and bounded remain outside these assertions.
 * @evidence contracts/development/testing.md#execution-ownership Portable CPU unit test_analysis_environment_context is the discoverable entry and owns the ordered cases delegated to assertAnalysisEnvironmentContextPart1, assertAnalysisEnvironmentContextPart2, assertAnalysisEnvironmentContextPart3; those helpers are called explicitly, with no dynamic registration, native artifact build, process, browser or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 7 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: The declared site validates clean, lookup observes the noon label and absent dawn, and projected solids retain the neighbour id and...).
 */
export function test_analysis_environment_context(): void {
  const {
    context,
    neighbour,
    occluded,
    broken,
    instantOf,
  }: {
    context: IAutoMovieEnvironmentContext;
    neighbour: { id: string; planes: IAutoMovieHalfSpacePlane[] };
    occluded: IAutoMovieEnvironmentContext;
    broken: (
      overrides: Partial<IAutoMovieEnvironmentContext>,
    ) => ReturnType<typeof AutoMovieEngineEnvironment.validateContext>;
    instantOf: (
      index: number,
      patch: Partial<IAutoMovieEnvironmentContext["instants"][number]>,
    ) => IAutoMovieEnvironmentContext["instants"];
  } = assertAnalysisEnvironmentContextPart1();
  const {
    cube,
    rising,
  }: {
    cube: { id: string; planes: IAutoMovieHalfSpacePlane[] };
    rising: IAutoMovieVector3;
  } = assertAnalysisEnvironmentContextPart2(
    context,
    neighbour,
    occluded,
    broken,
    instantOf,
  );
  assertAnalysisEnvironmentContextPart3(context, neighbour, cube, rising);
}
