import type {IAutoMovieLight} from "@automovie/interface";
import type * as THREE from "three";

/**
 * Project one actual punctual light into the Engine's shadow-caster identity.
 * The caller supplies the authored or runtime identity. Native class markers
 * own the kind and castShadow owns participation, independent of visibility.
 * Other scene objects and non-punctual lights return null rather than a
 * fabricated shadow source. Admission and allocation formulas stay in Engine.
 */
export const readAutoMovieShadowLightSource=(id:string,object:THREE.Object3D):Pick<IAutoMovieLight,"id"|"type"|"castShadow">|null=>{
  const light=object as THREE.Light & {isPointLight?:boolean;isDirectionalLight?:boolean;isSpotLight?:boolean};
  const type=light.isPointLight===true?"point":light.isDirectionalLight===true?"directional":light.isSpotLight===true?"spot":null;
  return type===null?null:{id,type,castShadow:light.castShadow};
};
