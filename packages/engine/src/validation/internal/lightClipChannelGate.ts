import type {
  IAutoMovieChannel,
  IAutoMovieClipChannelGate,
  IAutoMovieConstraintViolation,
  IAutoMovieLightChannelProperty,
  IAutoMovieLightPointer,
} from "@automovie/interface";

import { LIGHT_CHANNEL_PROPERTIES } from "../../resolve/LIGHT_CHANNEL_PROPERTIES";
import { parseLightPointer } from "../../resolve/internal/parseLightPointer";
import { AutoMovieEngineText } from "../../text/AutoMovieEngineText";
import { pushViolation } from "./pushViolation";

/**
 * Create a gate for canonical light pointers and shared property value types,
 * optionally checking staged light presence and kind.
 */
export function lightClipChannelGate(
  stagedLights: ReadonlyMap<string, unknown> | null,
): IAutoMovieClipChannelGate {
  return (
    channel: IAutoMovieChannel,
    path: string,
    violations: IAutoMovieConstraintViolation[],
  ): void => {
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
    const target: IAutoMovieLightPointer | null = parseLightPointer(
      channel.pointer,
    );
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
    const property: IAutoMovieLightChannelProperty =
      LIGHT_CHANNEL_PROPERTIES[target.property];
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
        `light clip track addresses "${target.property}", which ${AutoMovieEngineText.withArticle(String(kind))} light does not carry`,
        channel.pointer,
      );
  };
}
