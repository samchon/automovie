import type { IAutoMovieMaterial } from "@automovie/interface";
import { materialFinish } from "./001-binding-and-scale";
import { pvTextureBinding } from "../house/canopy-finish";

/** Existing native glass states and the preserved canopy responses. Their
 * geometry, cell mask and placement remain with the architectural owners. */
export function architecturalOpticalMaterial(id: string, privacy: "day"|"private"|"night"): IAutoMovieMaterial | null {
  if (id === "glass") return materialFinish(id,privacy === "day" ? "#d2e2dc" : "#526c64",.09,
    {transmission:privacy === "day" ? .94 : .38,thickness:.018,ior:1.5});
  if (id === "frosted") return materialFinish(id,"#b7ccc0",.70,{transmission:.28,thickness:.018,ior:1.5});
  if (id === "pv") return materialFinish(id,"#b9cedb",.19,
    {alphaMode:"blend",baseColorTexture:pvTextureBinding,thickness:.012,clearcoat:.25});
  if (id === "canopy-metal") return materialFinish(id,"#626e70",.36,{metallic:.65});
  return null;
}
