import { textureTiles } from "./textureTiles";

/** Maps authored material identities to the shared physical tile family used by color and UV derivation. */
export const families: Record<string, keyof typeof textureTiles> = {oak:'wood',oakLight:'wood',oakPale:'wood',oakGrain:'wood',upper:'wood',bark:'bark',soil:'soil',
 stone:'stone',stoneLight:'stone',stoneDark:'stone',floor:'stone',gravel:'stone',plaster:'plaster',
 roof:'tile',roofLight:'tile',roofMuted:'tile',bed:'cloth',linen:'cloth',linenDark:'cloth',quiltRust:'cloth',quiltSage:'cloth'};
