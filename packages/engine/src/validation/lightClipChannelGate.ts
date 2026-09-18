import { LIGHT_CHANNEL_PROPERTIES } from "../resolve/LIGHT_CHANNEL_PROPERTIES";
import { parseLightPointer } from "../resolve/parseLightPointer";
import { withArticle } from "../text/article";
import { asArray } from "./asArray";
import { isRecord } from "./isRecord";
import { pushViolation } from "./pushViolation";
import { IAutoMovieClipChannelGate } from "./IAutoMovieClipChannelGate";

/**
 * A LIGHT clip's track must address one staged light's animatable property, and
 * exactly the ones {@link resolveShotLighting} writes (#1348).
 *
 * Admission is read out of `LIGHT_CHANNEL_PROPERTIES`, the same table the
 * applier folds its sampled values through. There is no second list to keep in
 * step: a property the table does not carry is refused here and unreachable
 * there, and a property added to the table becomes admissible and applied in
 * one edit. That is the mechanical form of the rule two of this campaign's
 * defects sit on either side of: a validated axis with no applier (#1339), and
 * an applier that silently ignores part of its input (#1349).
 *
 * `stagedLights` is the scene's light id → `type` index when the caller has a
 * scene to cross-reference (the submitted-artifact path) and `null` when it
 * does not (the stored-slice path, which reads one file with no scene beside
 * it). Without it the pointer grammar and value type are still gated; only the
 * "does this light exist, and does its kind carry this" pair defers.
 *
 * @evidence requirements/diagnostics/identity-path-and-context.md#diagnostics-path-and-scope `lightClipChannelGate` locates an unknown staged-light target, unsupported property, or mismatched value type at the light track's channel.
 * @evidence specifications/validation-and-diagnostics/diagnostic-identity-location-and-severity.md#validation-diagnostic-path-scope `lightClipChannelGate` derives admission from the same light-property table used by the applier and retains the rejected address.
 */
export const lightClipChannelGate =
  (
    stagedLights: ReadonlyMap<string, unknown> | null,
  ): IAutoMovieClipChannelGate =>
  (channel, path, violations): void => {
    if (channel.kind !== "pointer") {
      pushViolation(
        violations,
        "type",
        `${path}.kind`,
        `light clip track channel kind must be "pointer" addressing /lights/<light id>/<property>, but was ${JSON.stringify(channel.kind)}`,
        channel.kind,
      );
      return;
    }
    const target = parseLightPointer(channel.pointer);
    if (target === null) {
      pushViolation(
        violations,
        "type",
        `${path}.pointer`,
        `light clip track pointer must be /lights/<light id>/<property> with property one of ${[...Object.keys(LIGHT_CHANNEL_PROPERTIES)].join(", ")}, but was ${JSON.stringify(channel.pointer)}`,
        channel.pointer,
      );
      return;
    }
    const property = LIGHT_CHANNEL_PROPERTIES[target.property];
    if (channel.valueType !== property.valueType)
      pushViolation(
        violations,
        "type",
        `${path}.valueType`,
        `light clip track "${target.property}" resolves to ${property.valueType}, but was ${JSON.stringify(channel.valueType)}`,
        channel.valueType,
      );
    if (stagedLights === null) return;
    const kind = stagedLights.get(target.light);
    if (kind === undefined)
      pushViolation(
        violations,
        "type",
        `${path}.pointer`,
        `light clip track must address a staged scene light, but "${target.light}" is not one`,
        channel.pointer,
      );
    else if (!property.carries(kind))
      pushViolation(
        violations,
        "type",
        `${path}.pointer`,
        `light clip track addresses "${target.property}", which ${withArticle(String(kind))} light does not carry`,
        channel.pointer,
      );
  };

/**
 * The scene's light id → `type` index, keyed by the only thing a pointer can
 * name.
 *
 * A light is addressable exactly when it is an object with a string id and a
 * `type`, which is what a `Map.get` miss states in one read: an entry left out
 * and an entry stored with no kind both answer `undefined`, and neither can be
 * the target of a track. Such a scene is malformed either way, and
 * `validateSceneArtifact` is the gate that says so.
 */
const stagedLightKinds = (scene: unknown): ReadonlyMap<string, unknown> => {
  const index = new Map<string, unknown>();
  for (const light of asArray(isRecord(scene) ? scene.lights : undefined))
    if (isRecord(light) && typeof light.id === "string")
      index.set(light.id, light.type);
  return index;
};
