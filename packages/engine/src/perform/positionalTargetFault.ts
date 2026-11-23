import { describeInvalidValue } from "../validation/describeInvalidValue";
import { isRecord } from "../validation/isRecord";

function targetKindName(target: unknown): string {
  return isRecord(target) && typeof target.kind === "string"
    ? target.kind
    : "malformed";
}

/**
 * Why a positional target did not resolve to a world point, phrased as the
 * clause after "but".
 *
 * The discriminator is the fault only for a relative or unknown kind. A `node`
 * or `group` target names a legal kind and an id that is not placed, so echoing
 * the kind made one sentence list a node target as valid and reject it at the
 * same time, leaving the correction round nothing it could act on (#1294). Name
 * the id instead: it is the only thing the author can fix.
 *
 * Accepts ordinary unknown payloads because callers differ in how much they
 * have already validated: the perform gate reaches here past shape checks,
 * while production geometry queries may supply malformed records. Identity
 * conversion failures produce `an uninspectable value` instead of throwing;
 * property accessors that throw and nonterminating conversion hooks remain
 * outside this guarantee.
 */
export function positionalTargetFault(target: unknown): string {
  if (isRecord(target)) {
    if (target.kind === "node")
      return `"${describeInvalidValue(target.node)}" is not placed in the staged scene`;
    if (target.kind === "bone")
      return `bone "${describeInvalidValue(target.bone)}" on "${describeInvalidValue(target.node)}" does not resolve from a rigged staged actor`;
    if (target.kind === "group") {
      const members: string[] = [
        ...(Array.isArray(target.nodes) ? target.nodes : []).map(
          (node: unknown): string => `"${describeInvalidValue(node)}"`,
        ),
        ...(Array.isArray(target.formations) ? target.formations : []).map(
          (formation: unknown): string =>
            `formation "${describeInvalidValue(formation)}"`,
        ),
      ];
      return members.length === 0
        ? "its group names no members"
        : `one or more group members are not placed in the staged scene: ${members.join(", ")}`;
    }
    if (target.kind === "point") {
      if (!isRecord(target.point))
        return "a point target carries no point to resolve";
      return "a point target must carry finite x/y/z coordinates";
    }
    if (target.kind === "direction" || target.kind === "offscreen")
      return `a target of kind "${target.kind}" is relative (a heading or a frame edge), so it names no place`;
  }
  return `"${targetKindName(target)}" is not a positional target kind`;
}
