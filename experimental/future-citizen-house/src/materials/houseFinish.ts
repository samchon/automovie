/** Building finish decisions Geometry and part
 * identities stay with their existing space and model owners. */
import type { IAutoMovieMaterial } from "@automovie/interface";

import { materialFinish } from "./materialFinish";
import { metricBinding } from "./metricBinding";
import { HouseFinishId } from "./HouseFinishId";
import { isHouseFinish } from "./isHouseFinish";
import { textured } from "./textured";
import { solid } from "./solid";
import { WoodFinish } from "./WoodFinish";

/** A role-specific native finish; no image or geometry is fabricated here. */
export function houseFinish(role: HouseFinishId): IAutoMovieMaterial {
  if (!isHouseFinish(role)) throw new Error(`unknown house finish ${role}`);
  if (role.startsWith("wood-end/")) {
    const [color, roughness] =
      textured[role.slice("wood-end/".length) as WoodFinish];
    return materialFinish(role, color, roughness);
  }
  if (role in textured) {
    const [color, roughness, asset, u, v] =
      textured[role as keyof typeof textured];
    return materialFinish(role, color, roughness, {
      baseColorTexture: metricBinding(asset, u, v),
    });
  }
  const [color, roughness, metallic, clearcoat] =
    solid[role as keyof typeof solid];
  return materialFinish(role, color, roughness, { metallic, clearcoat });
}

