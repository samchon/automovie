import type { IAutoMovieTextureReference } from "@automovie/interface";
import { textureTiles } from "./textureTiles";

/** Resolves an authored texture family to its asset and surface-meter UV transform; an unknown family is refused. */
export function textureBinding(family: string): IAutoMovieTextureReference{
 const tile: (typeof textureTiles)[keyof typeof textureTiles] | undefined=Object.entries(textureTiles).find(([id]: [string, (typeof textureTiles)[keyof typeof textureTiles]]): boolean =>id===family)?.[1];
 if (tile === undefined) throw new Error("Unknown manor texture family: " + family);
 return {asset:'assets/textures/manor/'+tile.file,texCoord:0,coordinateSource:'surface-metres',colorSpace:'srgb',
  transform:{offset:{x:0,y:0},scale:{x:1/tile.metres[0],y:1/tile.metres[1]},rotationDeg:0},
  sampler:{wrapS:'mirror',wrapT:'mirror',minFilter:'linearMipmapLinear',magFilter:'linear'}};
}
