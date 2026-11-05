import * as THREE from "three";

/**
 * Test finite-volume containment using the supplied original triangle shell.
 * @evidence contracts/common.md#implementation-and-ownership Welded geometric edge incidence must be exactly two before three nonparallel ray parities classify the point. Duplicate transversal hits count once. A ray within10nanometres of an actual triangle edge, a hit with an edge/vertex barycentric coordinate, or a grazing face normal is indeterminate rather than a crossing certificate. This catches tangent touches even when triangle intersection arithmetic misses the exact edge. Disagreeing rays, an open shell or boundary coincidence remain indeterminate, never an outside certificate. This reads actual triangle vertices without convex-hull or hand-axis substitution.
 * @evidence contracts/common.md#authoring-interface Supply complete finite nondegenerate triangles and one point in their common coordinate frame. closed describes geometric edge closure; inside is true only for unanimous odd parity. determinate excludes boundary and inconsistent parity. This certifies this point only; the caller separately tests every triangle against the finite paper interior.
 */
export function inspectClosedSkin(triangles: readonly THREE.Triangle[], point: THREE.Vector3): {closed:boolean;inside:boolean;determinate:boolean} {
  const edges: Map<string,number>=new Map();
  /** Quantize only the topology key; every intersection retains original coordinates. */
  const key: (v:THREE.Vector3)=>string=(v:THREE.Vector3):string=>v.toArray().map((n:number):number=>Math.round(n/1e-9)).join(",");
  for(const triangle of triangles) {
    if(triangle.getArea()<1e-18)continue;
    for(const [a,b] of [[triangle.a,triangle.b],[triangle.b,triangle.c],[triangle.c,triangle.a]] as const) {
      const pair:string[]=[key(a),key(b)].sort((left:string,right:string):number=>left<right?-1:left>right?1:0);const id:string=pair.join("|");
      edges.set(id,(edges.get(id)??0)+1);
    }
  }
  const closed:boolean=edges.size>0&&[...edges.values()].every((n:number):boolean=>n===2);
  if(!closed)return {closed,inside:false,determinate:false};
  if(triangles.some((triangle:THREE.Triangle):boolean=>triangle.closestPointToPoint(point,new THREE.Vector3()).distanceToSquared(point)<1e-16))return {closed,inside:false,determinate:false};
  const parity:boolean[]=[];
  let ambiguous:boolean=false;
  for(const direction of [new THREE.Vector3(1,0.371,0.173),new THREE.Vector3(0.237,1,0.419),new THREE.Vector3(0.193,0.317,1)]) {
    const ray:THREE.Ray=new THREE.Ray(point,direction.normalize());const distances:number[]=[];
    for(const triangle of triangles) {
      const hit:THREE.Vector3|null=ray.intersectTriangle(triangle.a,triangle.b,triangle.c,false,new THREE.Vector3());
      for(const [a,b] of [[triangle.a,triangle.b],[triangle.b,triangle.c],[triangle.c,triangle.a]] as const)
        if(ray.distanceSqToSegment(a,b)<=1e-16)ambiguous=true;
      if(hit) {
        const barycentric:THREE.Vector3|null=triangle.getBarycoord(hit,new THREE.Vector3());
        if(!barycentric||Math.min(barycentric.x,barycentric.y,barycentric.z)<=1e-8||Math.abs(triangle.getNormal(new THREE.Vector3()).dot(ray.direction))<1e-10)ambiguous=true;
        distances.push(hit.distanceTo(point));
      }
    }
    distances.sort((a:number,b:number):number=>a-b);
    const unique:number[]=distances.filter((v:number,n:number):boolean=>n===0||Math.abs(v-distances[n-1]!)>1e-8);
    parity.push(unique.length%2===1);
  }
  return {closed,inside:!ambiguous&&parity.every(Boolean),determinate:!ambiguous&&parity.every((v:boolean):boolean=>v===parity[0])};
}
