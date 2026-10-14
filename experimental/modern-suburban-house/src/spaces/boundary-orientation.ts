/** Preserve world points while orienting a one-sided wall frame toward outdoors. */
import type { IAutoMovieQuaternion } from "@automovie/interface";
export const boundaryOrientation=(axis:"x"|"z",sides:readonly [string,string]):{
  rotation:IAutoMovieQuaternion;sign:1|-1;
}=>{
  const single=sides.includes("house-site");
  const reversed=single&&(axis==="x"?sides[0]==="house-site":sides[1]==="house-site");
  const sign=reversed?-1:1;
  const yaw=axis==="x"?(reversed?Math.PI:0):(reversed?Math.PI/2:-Math.PI/2);
  return {rotation:{x:0,y:Math.sin(yaw/2),z:0,w:Math.cos(yaw/2)},sign};
};
