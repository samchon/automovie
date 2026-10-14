import type {
  IAutoMovieContextOccluder,
  IAutoMovieEnvironmentContext,
  IAutoMovieEnvironmentInstant,
  IAutoMovieHalfSpacePlane,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { assertAutoMovieAnalysisSolids, validateAutoMovieEnvironmentContext } from "@automovie/engine";

import { analysisContext } from "../internal/analysisContext";
import { assertAnalysisEnvironmentContextPart1 } from "../internal/assertAnalysisEnvironmentContextPart1";
import { assertAnalysisEnvironmentContextPart2 } from "../internal/assertAnalysisEnvironmentContextPart2";
import { assertAnalysisEnvironmentContextPart3 } from "../internal/assertAnalysisEnvironmentContextPart3";
import { hasViolation, throwsError } from "../internal/predicates";

/**
 * Validate declared site observations and exercise instant lookup, convex-ray clipping, ground directions and deterministic hemisphere sampling.
 *
 * Scenarios:
 * 1. The declared site validates clean, lookup observes the noon label and absent dawn, and projected solids retain the neighbour id and six-plane count.
 * 2. The existing field-mutation table refuses version, units, blank id, zero and non-finite directions, non-finite elevation, blank and duplicated instant ids, non-finite and non-increasing time, negative and non-finite illuminance, out-of-range humidity and non-finite outdoor temperature.
 * 3. A sun below the horizon with a beam is refused; the same sun with no beam is accepted, and so is a sun above the horizon with a beam.
 * 4. A context id, an instant id and an occluder id colliding with a building-owned id are each refused; the same context beside unrelated building ids is accepted.
 * 5. An occluder of fewer than four half-spaces, with a zero normal, or with a non-finite offset is refused, and the assertion form of the same rule throws on a blank id, a duplicate id and a malformed plane.
 * 6. The slab test answers hand geometry: inside, ahead, behind, parallel outside, parallel inside, beyond the ray's own length, and exactly tangent at the origin; a nearly parallel ray is judged by its slope against the unit normal, so scaling a plane's normal does not change the verdict.
 * 7. Hemisphere directions have the requested population, unit length and positive normal projection for both signs of normal z, an oblique normal and a singleton; fractional/zero counts and zero/non-finite normals are refused.
 * 8. Resident instant, occluder and plane holes are refused at their own slots instead of disappearing from the context or shade admission.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs the actual context validator, instant/solid projection, slab/union/horizon predicates and hemisphere sampler through ordered parts, plus resident-slot checks in this entry. Literal statuses, fields, ray verdicts, lengths/norms/projections, replay and located throws expose lost records, wrong horizon signs or scale-sensitive parallel clipping.
 * @evidence contracts/testing.md#independent-expectations Local unit-box inequalities determine ray entry/exit, exact face touch and the 0.5-versus-1 distance boundary; positive normal rescaling preserves one half-space. Sample directions must number count, have unit norm at original 1e-9 tolerance and positive normal dot product. Repeated JSON direction text checks only same-process deterministic serialization, not cross-platform execution or cosine-distribution accuracy; projection assertions observe id/count rather than reference ownership or complete field identity.
 * @evidence contracts/testing.md#distinguishing-cases Keeps every existing field mutation, valid/below-horizon/no-beam/unusable-ground twin, reserved context/instant/occluder ids, sparse resident slots, malformed planes, inside/outside/parallel/tangent/short rays, empty solid union, ground up/down/grazing and pole/oblique/singleton sampling. Arbitrary unknown containers and proof that every admitted plane set is nonempty and bounded remain outside these assertions.
 * @evidence contracts/testing.md#execution-ownership Portable CPU unit test_analysis_environment_context is the discoverable entry and owns the ordered cases delegated to assertAnalysisEnvironmentContextPart1, assertAnalysisEnvironmentContextPart2, assertAnalysisEnvironmentContextPart3; those helpers are called explicitly, with no dynamic registration, native artifact build, process, browser or GPU host.
 */
export function test_analysis_environment_context(): void {
  const sparseInstants: IAutoMovieEnvironmentContext = analysisContext({
    instants: new Array<IAutoMovieEnvironmentInstant>(1),
  });
  const sparseOccluders: IAutoMovieEnvironmentContext = analysisContext({
    occluders: new Array<IAutoMovieContextOccluder>(1),
  });
  const sparsePlanes: IAutoMovieContextOccluder = {
    id: "missing-plane",
    kind: "neighbour",
    planes: new Array<IAutoMovieHalfSpacePlane>(4),
  };
  const sparseResults: Record<string, boolean> = {
    instant: hasViolation(
      validateAutoMovieEnvironmentContext({ context: sparseInstants }),
      "type",
      "$input.instants[0]",
    ),
    occluder: hasViolation(
      validateAutoMovieEnvironmentContext({ context: sparseOccluders }),
      "type",
      "$input.occluders[0]",
    ),
    plane: hasViolation(
      validateAutoMovieEnvironmentContext({
        context: analysisContext({ occluders: [sparsePlanes] }),
      }),
      "type",
      "$input.occluders[0].planes[0]",
    ),
    shade: throwsError(
      (): void => assertAutoMovieAnalysisSolids([sparsePlanes], "shade"),
      "shade.planes[0]",
    ),
  };
  TestValidator.equals(
    "every resident context/shade slot must contain its declared record",
    sparseResults,
    { instant: true, occluder: true, plane: true, shade: true },
  );
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
    ) => ReturnType<typeof validateAutoMovieEnvironmentContext>;
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
