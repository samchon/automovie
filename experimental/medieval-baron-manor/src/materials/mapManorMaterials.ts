import type { IAutoMovieMaterial } from "@automovie/interface";
import { families } from "./families";
import { textureBinding } from "./textureBinding";

// Linear multipliers, deliberately not the old dark sRGB swatches a second time.
const tint: Record<string, number[]> = {oak:[.14,.19,.25],oakLight:[.22,.28,.34],oakPale:[.31,.37,.44],oakGrain:[.10,.15,.20],upper:[.19,.23,.29],bark:[.78,.78,.76],soil:[.64,.62,.57],
 stone:[.68,.69,.67],stoneLight:[.85,.85,.80],stoneDark:[.35,.37,.35],floor:[.65,.63,.56],gravel:[.72,.69,.60],plaster:[.75,.71,.61],
 roof:[.17,.22,.27],roofLight:[.23,.26,.29],roofMuted:[.20,.24,.28],bed:[.63,.61,.53],linen:[.94,.91,.82],linenDark:[.57,.54,.44],quiltRust:[.54,.24,.17],quiltSage:[.34,.43,.27]};

/** Adds each recognized manor material's texture binding and linear tint; unrecognized materials retain their supplied object. */
export function mapManorMaterials(materials: IAutoMovieMaterial[]): IAutoMovieMaterial[]{
 return materials.map((m: IAutoMovieMaterial): IAutoMovieMaterial =>{const family: "wood" | "stone" | "plaster" | "tile" | "cloth" | "bark" | "soil"=families[m.id];if(!family)return m;const [r,g,b]: number[]=tint[m.id];
  return {...m,baseColor:{r,g,b,a:1,hex:null},baseColorTexture:textureBinding(family)};
 });
}
