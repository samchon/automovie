import type { IAutoMovieMesh, IAutoMovieVector3 } from "@automovie/interface";

/** Native sphere row/column lattice, measured after the ellipsoid scale.
 * U starts at the rear -Z meridian; V starts at the bottom pole. Only the
 * seam's vertex attributes are duplicated. This is a mesh-edge approximation,
 * not an isometric cloth chart at the poles. */
export function ellipsoidMetricMesh(mesh: IAutoMovieMesh, scale: IAutoMovieVector3): IAutoMovieMesh {
  if (!mesh.normals || mesh.normals.length !== mesh.positions.length || mesh.skin || mesh.colors)
    throw new Error("Ellipsoid UV requires a rigid complete normal lattice");
  if (![scale.x,scale.y,scale.z].every(n => Number.isFinite(n) && n > 0))
    throw new Error("Ellipsoid UV requires positive finite scale");
  const count = mesh.positions.length/3;
  let stride = 1;
  while (stride < count && Math.abs(mesh.positions[stride*3+1]! - mesh.positions[1]!) < 1e-10) stride++;
  const rows = count/stride, columns = stride-1;
  if (columns < 4 || !Number.isInteger(rows) || rows < 3)
    throw new Error("Ellipsoid UV requires the native sphere row/column lattice");
  const point = (row:number,column:number) => {
    const index = (row*stride+column)*3;
    return [mesh.positions[index]!*scale.x,mesh.positions[index+1]!*scale.y,mesh.positions[index+2]!*scale.z];
  };
  const length = (a:number[],b:number[]) => Math.hypot(a[0]!-b[0]!,a[1]!-b[1]!,a[2]!-b[2]!);
  const middle = Math.floor(rows/2);
  let seam = 0;
  for (let column=1;column<columns;column++) if (point(middle,column)[2]! < point(middle,seam)[2]!) seam=column;
  const u = Array.from({length:rows},()=>Array<number>(columns).fill(0));
  const circumference = Array<number>(rows).fill(0);
  const v = Array.from({length:rows},()=>Array<number>(columns).fill(0));
  for (let row=0;row<rows;row++) {
    let travelled=0;
    for (let offset=1;offset<=columns;offset++) {
      const previous=(seam+offset-1)%columns, column=(seam+offset)%columns;
      travelled+=length(point(row,previous),point(row,column));
      if (offset<columns) u[row]![column]=travelled;
    }
    circumference[row]=travelled;
  }
  for (let column=0;column<columns;column++) for (let row=rows-2;row>=0;row--)
    v[row]![column]=v[row+1]![column]!+length(point(row+1,column),point(row,column));
  const positions=mesh.positions.slice(), normals=mesh.normals.slice(), uvs:number[]=[], indices:number[]=[];
  for (let index=0;index<count;index++) {
    const row=Math.floor(index/stride),column=index%stride%columns;
    uvs.push(u[row]![column]!,v[row]![column]!);
  }
  const copies=new Map<number,number>();
  const source=mesh.indices??Array.from({length:count},(_,index)=>index);
  for (let t=0;t<source.length;t+=3) {
    const triangle=source.slice(t,t+3);
    const offsets=triangle.map(index=>(index%stride%columns-seam+columns)%columns);
    const crosses=Math.max(...offsets)-Math.min(...offsets)>columns/2;
    for (const index of triangle) {
      const row=Math.floor(index/stride),column=index%stride%columns;
      if (!crosses || column!==seam) { indices.push(index); continue; }
      let copy=copies.get(index);
      if (copy===undefined) {
        copy=positions.length/3;copies.set(index,copy);
        positions.push(...mesh.positions.slice(index*3,index*3+3));
        normals.push(...mesh.normals.slice(index*3,index*3+3));
        uvs.push(circumference[row]!,v[row]![column]!);
      }
      indices.push(copy);
    }
  }
  return {...mesh,positions,normals,uvs,indices};
}
