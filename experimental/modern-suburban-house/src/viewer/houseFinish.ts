import { linearColorToSrgbHex } from "@automovie/engine";
import { buildingSpaceFinish } from "../materials/buildingSpaceFinish";
import { PALETTE } from "../spaces/PALETTE";
import type { HousePartRole } from "../types/HousePartRole";
import { HousePreviewFinish } from "./HousePreviewFinish";

/** Resolve every emitted house face; missing keys are a contract failure. */

export function houseFinish(role: HousePartRole, color: number): HousePreviewFinish {
  if (role === "floor" && color === PALETTE.structure)
    return { id: "structural-base", color, roughness: 0.8, metalness: 0 };
  const source = buildingSpaceFinish(role, color);
  const material = source.material;
  return {
    id: material.id,
    color: Number.parseInt(linearColorToSrgbHex(material.baseColor).slice(1), 16),
    roughness: material.roughness,
    metalness: material.metallic,
    texture: source.texture,
  };
}
