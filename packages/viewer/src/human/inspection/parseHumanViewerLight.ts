import type { HumanViewerAddress } from "./HumanViewerAddress.js";
import { humanViewerChoices } from "./humanViewerChoices.js";

/**
 * Admit the display protocol name,x,y,z for a body studio-light direction. The viewport owns normalization and original-distance restoration; this parser preserves finite raw components and rejects empty or zero vectors. HTTP addresses and the light controls use this same admission boundary. Coordinates are dimensionless world Y-up directions, not model parameters.
 *
 * @evidence contracts/common.md#principled-implementation A supported studio-light name and three raw components with a finite positive representable Euclidean norm form the shared light protocol vector; individual components may be zero.
 * @evidence contracts/common.md#clear-and-simple-design Split/name/magnitude checks preserve raw direction while normalization remains with the viewport.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Empty or zero/nonfinite vectors refuse and dimensionless directions are not labeled model positions.
 * @evidence contracts/common.md#meaningful-documentation The comment defines syntax, Y-up units and normalization/original-distance ownership.
 * @evidence contracts/performance.md#efficient-algorithms Four fields and a fixed light-name list require bounded arithmetic without scene traversal.
 * @evidence contracts/performance.md#reuse-equivalent-work Controls and HTTP light fields share this admission boundary without caching an earlier normalized vector.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a name and direction tuple remain; no light, renderer or material is allocated.
 */
export function parseHumanViewerLight(
  value: string,
): NonNullable<HumanViewerAddress["light"]> {
  const fields: string[] = value.split(",");
  if (
    fields.length !== 4 ||
    !humanViewerChoices.lights.some(
      (name: (typeof humanViewerChoices.lights)[number]): boolean =>
        name === fields[0],
    )
  )
    throw new Error(
      "light requires key, fill or rim and three direction components",
    );
  const direction: number[] = fields
    .slice(1)
    .map((field: string): number =>
      field.trim() === "" ? NaN : Number(field),
    );
  const magnitude: number = Math.hypot(...direction);
  if (!Number.isFinite(magnitude) || magnitude === 0)
    throw new Error("light requires a finite nonzero direction");
  return {
    name: fields[0],
    direction: [direction[0], direction[1], direction[2]],
  };
}
