import type {IAutoMovieLight} from "@automovie/interface";
import type * as THREE from "three";

/**
 * Project one actual punctual light into the Engine's shadow-caster identity.
 * The caller supplies the authored or runtime identity. Native class markers
 * own the kind and castShadow owns participation, independent of visibility.
 * Other scene objects and non-punctual lights return null rather than a
 * fabricated shadow source. Admission and allocation formulas stay in Engine.
 *
 * @evidence requirements/lighting/shadows-reflections-and-transmission.md#lighting-shadow-identity Preserves the actual punctual source identity and cast flag for admission and texture facts.
 * @evidence specifications/camera-light-and-visibility/light-transport-color-and-budget.md#clv-shadow-state-sampling Supplies one shared native-light projection to the existing shadow policy owner.
 */
export const readAutoMovieShadowLightSource=(id:string,object:THREE.Object3D):Pick<IAutoMovieLight,"id"|"type"|"castShadow">|null=>{
  const light=object as THREE.Light & {isPointLight?:boolean;isDirectionalLight?:boolean;isSpotLight?:boolean};
  const type=light.isPointLight===true?"point":light.isDirectionalLight===true?"directional":light.isSpotLight===true?"spot":null;
  return type===null?null:{id,type,castShadow:light.castShadow};
};
