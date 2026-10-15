import { textured } from "./textured";

export function houseTextureTile(id: string): { u: number; v: number; } | null {
  if (!(id in textured)) return null;
  const [, , , u, v] = textured[id as keyof typeof textured];
  return { u, v };
}
