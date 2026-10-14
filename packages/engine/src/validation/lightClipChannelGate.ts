import type { IAutoMovieLightChannelProperty } from "./../resolve/IAutoMovieLightChannelProperty";
import type { IAutoMovieLightPointer } from "./../resolve/IAutoMovieLightPointer";
import type { IAutoMovieConstraintViolation } from "@automovie/interface";
import { LIGHT_CHANNEL_PROPERTIES } from "../resolve/constants/LIGHT_CHANNEL_PROPERTIES";
import { parseLightPointer } from "../resolve/parseLightPointer";
import { withArticle } from "../text/withArticle";
import { IAutoMovieClipChannelGate } from "./IAutoMovieClipChannelGate";
import { pushViolation } from "./pushViolation";

/**
 * Create a gate for canonical light pointers and shared property value types, optionally checking staged light presence and kind.
 *
 * @evidence contracts/common.md#principled-implementation Create a gate for canonical light pointers and shared property value types, optionally checking staged light presence and kind.
 * @evidence contracts/common.md#clear-and-simple-design LIGHT_CHANNEL_PROPERTIES and parseLightPointer own the accepted/applied property vocabulary and escaping.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A null staged-light map deliberately defers existence/kind checks for stored slices, while syntax and value type remain gated.
 * @evidence contracts/common.md#meaningful-documentation The returned closure borrows the map and appends faults at kind, pointer or valueType paths.
 * @evidence contracts/performance.md#efficient-algorithms Pointer length drives parsing/round-trip work; one map lookup follows a fixed property lookup.
 * @evidence contracts/performance.md#reuse-equivalent-work Property definitions are shared with lighting application, and each invocation reads the current borrowed map.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the closure and any captured map lifetime; the gate starts no host task.
 */
export const lightClipChannelGate: (stagedLights: ReadonlyMap<string, unknown> | null) => IAutoMovieClipChannelGate =
  (
    stagedLights: ReadonlyMap<string, unknown> | null,
  ): IAutoMovieClipChannelGate =>
  (channel: Record<string, unknown>, path: string, violations: IAutoMovieConstraintViolation[]): void => {
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
    const target: IAutoMovieLightPointer | null = parseLightPointer(channel.pointer);
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
    const property: IAutoMovieLightChannelProperty = LIGHT_CHANNEL_PROPERTIES[target.property];
    if (channel.valueType !== property.valueType)
      pushViolation(
        violations,
        "type",
        `${path}.valueType`,
        `light clip track "${target.property}" resolves to ${property.valueType}, but was ${JSON.stringify(channel.valueType)}`,
        channel.valueType,
      );
    if (stagedLights === null) return;
    const kind: unknown = stagedLights.get(target.light);
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
