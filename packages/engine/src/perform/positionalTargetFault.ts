import { describeInvalidValue } from "../validation/describeInvalidValue";
import { isRecord } from "../validation/isRecord";

function targetKindName(target: unknown): string {
  return isRecord(target) && typeof target.kind === "string"
    ? target.kind
    : "malformed";
}

/**
 * Why a positional target did not resolve to a world point, phrased as the clause after "but".
 *
 * The discriminator is the fault only for a relative or unknown kind. A `node` or `group` target names a legal kind and an id that is not placed, so echoing the kind made one sentence list a node target as valid and reject it at the same time, leaving the correction round nothing it could act on (#1294). Name the id instead: it is the only thing the author can fix.
 *
 * Accepts ordinary unknown payloads because callers differ in how much they have already validated: the perform gate reaches here past shape checks, while production geometry queries may supply malformed records. Identity conversion failures produce `an uninspectable value` instead of throwing; property accessors that throw and nonterminating conversion hooks remain outside this guarantee.
 *
 *
 * @evidence contracts/common.md#principled-implementation Dispatches on the target discriminator only after the shared record guard, then describes the missing placement or structural context for that supported representation; group faults list authored identities without claiming every member is absent because the caller supplies no placement map here.
 * @evidence contracts/common.md#clear-and-simple-design Owns the explanatory clause reused by the film gate and target-dependent actor synthesis; shape classification uses the existing isRecord guard, while placement computation remains resolveTargetPoint's responsibility.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names the authored node, bone or group rather than rejecting a legal discriminator; no fixture identity changes the wording, and an unknown kind is reported without coercing it to a supported target.
 * @evidence contracts/common.md#meaningful-documentation States the clause format, identity-based feedback, unknown-input purpose and conversion-failure boundary; the group message reports unresolved membership without guessing which member failed.
 * @evidence contracts/performance.md#efficient-algorithms Field classification is constant; a group visits each authored identity once and joins output-sized text. Conversion is delegated to describeInvalidValue, with no time bound on user-defined hooks, so O(N) traversal excludes that hook work and representation length.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Produces one diagnostic from the current target payload and coordinates no requests; the caller owns placement lookup and decides when this explanation is needed.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Keeps no target or map after return; the local member strings become one caller-owned diagnostic string whose length grows with the authored identities.
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
