import type { IHumanFaceMeasurement as ImportedIHumanFaceMeasurement } from "@automovie/human";
import type { IHumanFaceObservationRule as ImportedIHumanFaceObservationRule } from "./IHumanFaceObservationRule";
import type { IAutoMovieHumanFaceAnatomicalRequest } from "../../structures/IAutoMovieHumanFaceAnatomicalRequest";
import { HUMAN_FACE_MEASUREMENTS } from "./HUMAN_FACE_MEASUREMENTS";
import { HUMAN_FACE_OBSERVATION_RULES } from "./HUMAN_FACE_OBSERVATION_RULES";

/**
 * Admit a face document's anatomical record before it is evaluated.
 *
 * Every target must name a registered measurement once, with a finite value. Every supplied observation leaf (a primitive, null or array value, reached through nested records) resolves to the longest rule whose segments match its path, a `*` segment matching any one key. A leaf with no rule, under a refusing rule, or carrying a value outside an observed rule's list refuses the document naming its path and the rule's reason. Admission changes no value; kept observations never move shape.
 *
 * @evidence contracts/common.md#principled-implementation Unique finite registered targets and longest matching wildcard rules admit supplied observation leaves.
 * @evidence contracts/common.md#clear-and-simple-design Retained observations remain metadata and this boundary neither solves targets nor moves geometry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown/refused/value-mismatched leaves throw without clamping or ignored values; a finite acyclic JSON-like observation tree is a caller premise.
 * @evidence contracts/common.md#meaningful-documentation Each refusal identifies the field/measurement and owning rule reason.
 * @evidence contracts/performance.md#efficient-algorithms Targets use registry/id sets; each leaf filters/sorts the rule table with repeated path splitting, plus recursive traversal depth.
 * @evidence contracts/performance.md#reuse-equivalent-work Shared registry/rule tables supply consistent policy, but rule matching is currently recomputed per leaf.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary sets, path arrays and recursion frames scale with request/leaf depth and leave after synchronous admission.
 *
 * @author Samchon
 */
export function admitHumanFaceAnatomicalRequest(
  request: IAutoMovieHumanFaceAnatomicalRequest,
): void {
  const registered: Set<string> = new Set(HUMAN_FACE_MEASUREMENTS.map((entry: ImportedIHumanFaceMeasurement): string => entry.id));
  const seen: Set<string> = new Set<string>();
  for (const target of request.targets ?? []) {
    if (!registered.has(target.measurement))
      throw new Error(
        "No face measurement is registered as " + target.measurement + ".",
      );
    if (seen.has(target.measurement))
      throw new Error(
        "The face measurement " + target.measurement + " is targeted twice.",
      );
    if (!Number.isFinite(target.value))
      throw new Error(
        "The face measurement target " +
          target.measurement +
          " must be finite.",
      );
    seen.add(target.measurement);
  }
  const visit: (value: unknown, path: string[]) => void = (value: unknown, path: string[]): void => {
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      for (const [key, child] of Object.entries(value))
        if (child !== undefined) visit(child, [...path, key]);
      return;
    }
    const rule: ImportedIHumanFaceObservationRule = HUMAN_FACE_OBSERVATION_RULES.filter((candidate: ImportedIHumanFaceObservationRule): boolean => {
      const segments: string[] = candidate.path.split(".");
      return (
        segments.length <= path.length &&
        segments.every((segment: string, at: number): boolean => segment === "*" || segment === path[at])
      );
    }).sort((a: ImportedIHumanFaceObservationRule, b: ImportedIHumanFaceObservationRule): number => b.path.split(".").length - a.path.split(".").length)[0];
    const name: string = path.join(".");
    if (rule === undefined)
      throw new Error(
        "The face resolver has no rule for the observation " + name + ".",
      );
    if (rule.outcome === "refused")
      throw new Error(
        "The face cannot represent the observation " +
          name +
          ": " +
          rule.reason +
          ".",
      );
    if (
      rule.values !== undefined &&
      !rule.values.includes(value as string | number | boolean)
    )
      throw new Error(
        `The face cannot represent ${name} = ${JSON.stringify(value)}: ${rule.reason}.`,
      );
  };
  if (request.observations !== undefined) visit(request.observations, []);
}
