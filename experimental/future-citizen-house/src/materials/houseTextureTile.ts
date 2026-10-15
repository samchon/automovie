import { textured } from "./textured";

/**
 * Texture tile size in metres along U and V for a textured finish, or null for an untextured one.
 */
export function houseTextureTile(id: string): { u: number; v: number; } | null {
  if (!(id in textured)) return null;
  const [, , , u, v] = textured[id as keyof typeof textured];
  return { u, v };
}
