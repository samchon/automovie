import type { HumanViewerAddress } from "./HumanViewerAddress";
import { humanViewerChoices } from "./humanViewerChoices";

/**
 * Admit the display protocol name,x,y,z for a body studio-light direction.
 * The viewport owns normalization and original-distance restoration; this
 * parser preserves finite raw components and rejects empty or zero vectors.
 * HTTP addresses and the light controls use this same admission boundary.
 * Coordinates are dimensionless world Y-up directions, not model parameters.
 *
 * @evidence contracts/common.md#principled-implementation Checks the closed public light-name set, exact tuple arity and finite nonzero norm before producing the viewport input.
 * @evidence contracts/common.md#clear-and-simple-design One pure admission function serves both URL and control input without owning scene mutation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses the public inspection protocol without document-specific values or geometry changes.
 * @evidence contracts/common.md#meaningful-documentation Explains coordinates, normalization ownership and the consumers of this boundary.
 */
export function parseHumanViewerLight(
  value: string,
): NonNullable<HumanViewerAddress["light"]> {
  const fields = value.split(",");
  if (fields.length !== 4 || !humanViewerChoices.lights.some((name) => name === fields[0]))
    throw new Error("light requires key, fill or rim and three direction components");
  const direction = fields.slice(1).map((field) => field.trim() === "" ? NaN : Number(field));
  const magnitude = Math.hypot(...direction);
  if (!Number.isFinite(magnitude) || magnitude === 0)
    throw new Error("light requires a finite nonzero direction");
  return { name: fields[0], direction: [direction[0], direction[1], direction[2]] };
}
