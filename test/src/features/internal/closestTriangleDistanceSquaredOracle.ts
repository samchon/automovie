/**
 * Exhaustive oracle distance to one nondegenerate triangle, using Ericson's
 * seven Voronoi regions rather than the production face/segment traversal.
 * The caller predecodes its own corners. Scalar coordinates avoid constructing
 * subtraction and closest-point arrays for every triangle of every query.
 */
export const closestTriangleDistanceSquaredOracle = (
  p: readonly number[], a: readonly number[], b: readonly number[], c: readonly number[],
): number => {
  const abx=b[0]-a[0],aby=b[1]-a[1],abz=b[2]-a[2];
  const acx=c[0]-a[0],acy=c[1]-a[1],acz=c[2]-a[2];
  const apx=p[0]-a[0],apy=p[1]-a[1],apz=p[2]-a[2];
  const d1=abx*apx+aby*apy+abz*apz,d2=acx*apx+acy*apy+acz*apz;
  if(d1<=0&&d2<=0)return squared(apx,apy,apz);
  const bpx=p[0]-b[0],bpy=p[1]-b[1],bpz=p[2]-b[2];
  const d3=abx*bpx+aby*bpy+abz*bpz,d4=acx*bpx+acy*bpy+acz*bpz;
  if(d3>=0&&d4<=d3)return squared(bpx,bpy,bpz);
  const vc=d1*d4-d3*d2;
  if(vc<=0&&d1>=0&&d3<=0){const v=d1/(d1-d3);return squared(apx-v*abx,apy-v*aby,apz-v*abz);}
  const cpx=p[0]-c[0],cpy=p[1]-c[1],cpz=p[2]-c[2];
  const d5=abx*cpx+aby*cpy+abz*cpz,d6=acx*cpx+acy*cpy+acz*cpz;
  if(d6>=0&&d5<=d6)return squared(cpx,cpy,cpz);
  const vb=d5*d2-d1*d6;
  if(vb<=0&&d2>=0&&d6<=0){const w=d2/(d2-d6);return squared(apx-w*acx,apy-w*acy,apz-w*acz);}
  const va=d3*d6-d5*d4;
  if(va<=0&&d4-d3>=0&&d5-d6>=0){const w=(d4-d3)/(d4-d3+d5-d6);return squared(bpx-w*(c[0]-b[0]),bpy-w*(c[1]-b[1]),bpz-w*(c[2]-b[2]));}
  const inverse=1/(va+vb+vc),v=vb*inverse,w=vc*inverse;
  return squared(apx-v*abx-w*acx,apy-v*aby-w*acy,apz-v*abz-w*acz);
};

/** Euclidean squared metric on the oracle's unmodified coordinate frame. */
const squared=(x:number,y:number,z:number):number=>x*x+y*y+z*z;
