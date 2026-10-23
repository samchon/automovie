import type { AuthoredLayer } from "../AuthoredLayer";

/** Only rendered dialogue and screenplay have an independent expression pass. */
export function hasNaturalness(
  layer: AuthoredLayer,
): layer is "scripts" | "screenplay" {
  return layer === "scripts" || layer === "screenplay";
}
