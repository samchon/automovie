import type { IAutoMovieHumanFaceAnatomicalRequest } from "../../structures/IAutoMovieHumanFaceAnatomicalRequest";
import { HUMAN_FACE_MEASUREMENTS } from "./HUMAN_FACE_MEASUREMENTS";
import { HUMAN_FACE_OBSERVATION_RULES } from "./HUMAN_FACE_OBSERVATION_RULES";

/**
 * Admit a face document's anatomical record before it is evaluated.
 *
 * Every target must name a registered measurement once, with a finite value.
 * Every supplied observation leaf (a primitive, null or array value, reached
 * through nested records) resolves to the longest rule whose segments match
 * its path, a `*` segment matching any one key. A leaf with no rule, under a
 * refusing rule, or carrying a value outside an observed rule's list refuses
 * the document naming its path and the rule's reason. Admission changes no
 * value; kept observations never move shape.
 *
 * @evidence contracts/common.md#principled-implementation Each field resolves through one explicit longest-match rule, so the outcome for any supplied value is decided before evaluation.
 * @evidence contracts/common.md#clear-and-simple-design One admission walks targets and observation leaves against two registries.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An unruled field, an unregistered target or an unrepresentable value refuses by name; none is dropped or clamped.
 * @evidence contracts/common.md#meaningful-documentation States leaf traversal, rule matching, the three refusals and that admission changes nothing.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Admission names no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Admission moves no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Admission emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Admission compares no coordinate; target units are the measurements'.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Admission builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The editor shows the readings.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The rules state why each field is kept or refused; the measurements state their protocols.
 * @evidence contracts/anatomy.md#permitted-range A value the basis cannot represent (a non-permanent dentition, a non-erupted tooth, a habitual-closure reference) is refused by name, never mapped onto the nearest representable state.
 * @evidence contracts/anatomy.md#parametric-authority Only registered measurement targets and the documented clinical vocabulary enter; no vertex, curve or proxy shape is admitted.
 * @author Samchon
 */
export function admitHumanFaceAnatomicalRequest(
  request: IAutoMovieHumanFaceAnatomicalRequest,
): void {
  const registered = new Set(HUMAN_FACE_MEASUREMENTS.map((entry) => entry.id));
  const seen = new Set<string>();
  for (const target of request.targets ?? []) {
    if (!registered.has(target.measurement))
      throw new Error("No face measurement is registered as " + target.measurement + ".");
    if (seen.has(target.measurement))
      throw new Error("The face measurement " + target.measurement + " is targeted twice.");
    if (!Number.isFinite(target.value))
      throw new Error("The face measurement target " + target.measurement + " must be finite.");
    seen.add(target.measurement);
  }
  const visit = (value: unknown, path: string[]): void => {
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      for (const [key, child] of Object.entries(value))
        if (child !== undefined) visit(child, [...path, key]);
      return;
    }
    const rule = HUMAN_FACE_OBSERVATION_RULES.filter((candidate) => {
      const segments = candidate.path.split(".");
      return (
        segments.length <= path.length &&
        segments.every((segment, at) => segment === "*" || segment === path[at])
      );
    }).sort((a, b) => b.path.split(".").length - a.path.split(".").length)[0];
    const name = path.join(".");
    if (rule === undefined)
      throw new Error("The face resolver has no rule for the observation " + name + ".");
    if (rule.outcome === "refused")
      throw new Error("The face cannot represent the observation " + name + ": " + rule.reason + ".");
    if (rule.values !== undefined && !rule.values.includes(value as string | number | boolean))
      throw new Error(
        `The face cannot represent ${name} = ${JSON.stringify(value)}: ${rule.reason}.`,
      );
  };
  if (request.observations !== undefined) visit(request.observations, []);
}
