import type { HumanViewerAddress } from "./HumanViewerAddress.js";
import { humanViewerChoices } from "./humanViewerChoices.js";

/**
 * Admit the display protocol name,x,y,z for a body studio-light direction.
 * The viewport owns normalization and original-distance restoration; this
 * parser preserves finite raw components and rejects empty or zero vectors.
 * HTTP addresses and the light controls use this same admission boundary.
 * Coordinates are dimensionless world Y-up directions, not model parameters.
 */
export function parseHumanViewerLight(
  value: string,
): NonNullable<HumanViewerAddress["light"]> {
  const fields = value.split(",");
  if (
    fields.length !== 4 ||
    !humanViewerChoices.lights.some((name) => name === fields[0])
  )
    throw new Error(
      "light requires key, fill or rim and three direction components",
    );
  const direction = fields
    .slice(1)
    .map((field) => (field.trim() === "" ? NaN : Number(field)));
  const magnitude = Math.hypot(...direction);
  if (!Number.isFinite(magnitude) || magnitude === 0)
    throw new Error("light requires a finite nonzero direction");
  return {
    name: fields[0],
    direction: [direction[0], direction[1], direction[2]],
  };
}
