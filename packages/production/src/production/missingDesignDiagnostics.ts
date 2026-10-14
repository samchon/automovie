
import { IAutoMovieDiagnostic } from "@automovie/interface";
import { AutoMovieProductionProject } from "./AutoMovieProductionProject";
import { encodeAutoMoviePathSegment } from "./contentIdentity";

/**
 * Report absent production/world records and an empty timed shot-contract population.
 *
 * The timed dispatcher supplies its graph; this helper reads record presence and names their expected namespaced addresses, without opening or creating a file. Library dispatch bypasses these timed obligations.
 *
 * @evidence contracts/common.md#principled-implementation Null production/world and zero shot-map size produce distinct design-missing findings in fixed order. The shared namespace encoder supplies diagnostic paths; presence does not establish schema validity or compiled realization.
 * @evidence contracts/common.md#clear-and-simple-design The timed coordinator owns graph admission and authoring-kind dispatch; this function only adds the three missing-design explanations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A first tracked shot is a timed-production requirement, not a special fixture. No absent world, production or shot is synthesized to let source execution continue.
 * @evidence contracts/common.md#meaningful-documentation Documents timed-only use, missing-versus-valid distinction, fixed finding order and tracked-record recovery addresses.
 * @evidence contracts/performance.md#efficient-algorithms Three scalar presence/size checks and namespace encoding allocate at most three findings; id encoding and output text length contribute cost, without scanning graph members or reading bytes.
 * @evidence contracts/performance.md#reuse-equivalent-work The supplied graph observation is reused directly by the current attempt; no absence answer is cached across project mutations or library/timed dispatch.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the small returned finding array; the graph remains borrowed and this function acquires no file handle or task.
 */
export function missingDesignDiagnostics(
  project: AutoMovieProductionProject,
  graph: ReturnType<AutoMovieProductionProject["graph"]>
): IAutoMovieDiagnostic[] {
  const productionSegment: string = encodeAutoMoviePathSegment(project.productionId);
  const diagnostics: IAutoMovieDiagnostic[] = [];
  if (graph.production === null)
    diagnostics.push({
      code: "design-missing",
      category: "error",
      phase: "design",
      target: "production",
      path: `automovie/design/${productionSegment}/production.json`,
      message:
        "Production design is missing. Create the tracked production design record.",
    });
  if (graph.world === null)
    diagnostics.push({
      code: "design-missing",
      category: "error",
      phase: "design",
      target: "world",
      path: "automovie/design/shared/world.json",
      message:
        "World design is missing. Create the tracked world design record.",
    });
  if (graph.shots.size === 0)
    diagnostics.push({
      code: "design-missing",
      category: "error",
      phase: "design",
      target: "shots",
      path: `automovie/design/${productionSegment}/shots`,
      message:
        "No shot contract exists. Create the first tracked shot contract record.",
    });
  return diagnostics;
}
