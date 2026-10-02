/** Periodic oak grain: one metre along U and 0.15 metre across V, no plank seam. */
export const furnitureOakSample=(u: number,v: number): number[]=>{
  const wave=Math.sin(2*Math.PI*(v*12+.13*Math.sin(2*Math.PI*u)))*5
    +Math.sin(2*Math.PI*(v*37+.08*Math.cos(4*Math.PI*u)))*2;
  return [168,122,78].map(channel=>Math.round(channel+wave));
};
