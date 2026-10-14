import { IAutoMovieVisualDeliveryOccurrence } from "./IAutoMovieVisualDeliveryOccurrence";
import { IAutoMovieVisualDeliveryLane } from "./IAutoMovieVisualDeliveryLane";
import { IAutoMovieMixedVisualDeliveryPolicy } from "./IAutoMovieMixedVisualDeliveryPolicy";
import { IAutoMovieVisualDeliveryPlan } from "./IAutoMovieVisualDeliveryPlan";
import { AutoMovieVisualDeliveryDiagnostic } from "./AutoMovieVisualDeliveryDiagnostic";
import { productionRepaintLaneDuplicateOccurrences } from "./productionRepaintLaneDuplicateOccurrences";
import { productionRepaintLaneSafeValidLane } from "./productionRepaintLaneSafeValidLane";
import { productionRepaintLaneIsDigest } from "./productionRepaintLaneIsDigest";
import { productionRepaintLaneValidPolicy } from "./productionRepaintLaneValidPolicy";

/**
 * Resolve one explicit source for every ordered timeline occurrence, returning detached lanes only when metadata admission succeeds.
 *
 * Nonempty populations of exact occurrence/shot records with unique occurrence IDs must match by position before further checks; shots may repeat. Repaint requires a current observation digest; deterministic-only delivery requires its absence. Mixed lanes require exact ordered crossings tied to that digest. Transition review digests are syntax-admitted assertions, not loaded review artifacts. Source/observation/policy diagnostics accumulate after the population gate; malformed nested policy structures may still throw under the typed-input premise.
 *
 * @evidence contracts/common.md#principled-implementation Exact ordered population admission precedes exclusive lane source checks, observation presence and directed adjacent crossings matched to the current mixed policy before cloning usable segments.
 * @evidence contracts/common.md#clear-and-simple-design The planner owns metadata joins and fail-closed segment publication; resident media, aggregate playback and mux effects have separate owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Population mismatch reports its root cause without derived crossing noise, no fallback source is inferred, and review digest syntax is not evidence of actual artifact review.
 * @evidence contracts/common.md#meaningful-documentation Prose gives empty-on-refusal, detached-success ownership, deterministic/repaint observation meaning and nested typed-policy/visual limitations.
 * @evidence contracts/performance.md#efficient-algorithms N occurrences incur bounded full metadata passes, Set duplicate detection and crossing derivation; matching C policy transitions and cloning accepted lane graphs add actual text/graph size, with O(N+C) record storage.
 * @evidence contracts/performance.md#reuse-equivalent-work One admitted ordered population supplies source, presence and crossing checks, and derived crossings are reused by policy comparison; no currentness result is cached across calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Sets, crossing and diagnostic arrays remain local; successful detached lanes or refusal codes transfer to the caller and no media handle, provider effect or encoder task starts.
 */
export const planAutoMovieVisualDelivery: (props: {
    timeline: readonly IAutoMovieVisualDeliveryOccurrence[];
    lanes: readonly IAutoMovieVisualDeliveryLane[];
    policy: IAutoMovieMixedVisualDeliveryPolicy | null;
    currentObservationDigest: string | null;
}) => IAutoMovieVisualDeliveryPlan = (props: {
  timeline: readonly IAutoMovieVisualDeliveryOccurrence[];
  lanes: readonly IAutoMovieVisualDeliveryLane[];
  policy: IAutoMovieMixedVisualDeliveryPolicy | null;
  currentObservationDigest: string | null;
}): IAutoMovieVisualDeliveryPlan => {
  const diagnostics: AutoMovieVisualDeliveryDiagnostic[] = [];
  if (
    props.timeline.length === 0 ||
    props.timeline.length !== props.lanes.length ||
    productionRepaintLaneDuplicateOccurrences(props.timeline) ||
    productionRepaintLaneDuplicateOccurrences(props.lanes) ||
    props.timeline.some(
      (occurrence: IAutoMovieVisualDeliveryOccurrence, index: number): boolean =>
        occurrence.occurrence !== props.lanes[index]?.occurrence ||
        occurrence.shot !== props.lanes[index]?.shot,
    )
  )
    // Every later check reads lanes by timeline position, so a population that
    // does not join the timeline exactly is the one cause worth reporting;
    // crossings and policy derived from a misjoined population would only add
    // consequences of the same defect.
    return { segments: [], diagnostics: ["visual-lane-population-invalid"] };
  if (props.lanes.some((lane: IAutoMovieVisualDeliveryLane): boolean => !productionRepaintLaneSafeValidLane(lane)))
    diagnostics.push("visual-lane-source-invalid");
  const hasRepaint: boolean = props.lanes.some((lane: IAutoMovieVisualDeliveryLane): boolean => lane.lane === "repainted");
  if (
    (hasRepaint &&
      (props.currentObservationDigest === null ||
        !productionRepaintLaneIsDigest(props.currentObservationDigest))) ||
    (!hasRepaint && props.currentObservationDigest !== null)
  )
    diagnostics.push("visual-lane-observation-invalid");
  const mixed: boolean = new Set(props.lanes.map((lane: IAutoMovieVisualDeliveryLane): IAutoMovieVisualDeliveryLane["lane"] => lane.lane)).size > 1;
  const crossings: { fromOccurrence: string; toOccurrence: string }[] = props.lanes.slice(1).flatMap((lane: IAutoMovieVisualDeliveryLane, index: number): { fromOccurrence: string; toOccurrence: string }[] => {
    const previous: IAutoMovieVisualDeliveryLane = props.lanes[index]!;
    return previous.lane === lane.lane
      ? []
      : [
          {
            fromOccurrence: previous.occurrence,
            toOccurrence: lane.occurrence,
          },
        ];
  });
  if (mixed && props.policy === null)
    diagnostics.push("visual-lane-policy-missing");
  else if (
    props.policy !== null &&
    (!mixed ||
      props.currentObservationDigest !== props.policy.observationDigest ||
      !productionRepaintLaneValidPolicy(props.policy, crossings))
  )
    diagnostics.push("visual-lane-transition-invalid");
  return {
    segments:
      diagnostics.length === 0
        ? props.lanes.map((lane: IAutoMovieVisualDeliveryLane): IAutoMovieVisualDeliveryLane => structuredClone(lane))
        : [],
    diagnostics,
  };
};
