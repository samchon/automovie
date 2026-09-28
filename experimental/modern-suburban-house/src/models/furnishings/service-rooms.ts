/** Wall-bound laundry cabinet and pantry shelving from docs/models/12-service-rooms.md. */
import { FittingParts, type FittingBuilt, type FittingPoint } from "./geometry";

type XZ = readonly [number,number];

/** Fixed service-room storage prototypes in documented house XZ, floor-local Y. */
export class ServiceRooms {
  /** The folding slab closes its casing cut and the two actual cleat sockets. */
  public laundryTop(): FittingBuilt {
    const a=new FittingParts();
    const xs=[4.75,5.47,5.485,5.50],ys=[.88,.92,.94];
    const zs=[-3.35,-3.28,-3.25,-3.22,-2.18,-2.15,-2.05];
    const solid=(i:number,j:number,k:number):boolean=>
      i>=0&&i<xs.length-1&&j>=0&&j<ys.length-1&&k>=0&&k<zs.length-1&&
      !(i===2&&k===0)&&!(i>=1&&j===0&&(k===2||k===4));
    a.mesh("top","top",q=>{
      for(let i=0;i<xs.length-1;i++)for(let j=0;j<ys.length-1;j++)for(let k=0;k<zs.length-1;k++){
        if(!solid(i,j,k))continue;
        const x0=xs[i]!,x1=xs[i+1]!,y0=ys[j]!,y1=ys[j+1]!,z0=zs[k]!,z1=zs[k+1]!;
        const side=(points:readonly [FittingPoint,FittingPoint,FittingPoint,FittingPoint],n:FittingPoint):void=>
          q(points,n,points.map(p=>n[1]?[p[2]+3.35,p[0]-4.75]:[n[0]?p[2]+3.35:p[0]-4.75,p[1]-.88]) as [[number,number],[number,number],[number,number],[number,number]]);
        if(!solid(i-1,j,k))side([[x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0]],[-1,0,0]);
        if(!solid(i+1,j,k))side([[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],[x1,y0,z1]],[1,0,0]);
        if(!solid(i,j-1,k))side([[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1]],[0,-1,0]);
        if(!solid(i,j+1,k))side([[x0,y1,z0],[x0,y1,z1],[x1,y1,z1],[x1,y1,z0]],[0,1,0]);
        if(!solid(i,j,k-1))side([[x0,y0,z0],[x0,y1,z0],[x1,y1,z0],[x1,y0,z0]],[0,0,-1]);
        if(!solid(i,j,k+1))side([[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]],[0,0,1]);
      }
    });
    a.box("cleat/1","cleat",[5.47,5.50,.88,.92,-3.25,-3.22],2);
    a.box("cleat/2","cleat",[5.47,5.50,.88,.92,-2.18,-2.15],2);
    return {...a.finish("laundry-top"),reviewYaw:Math.PI/2};
  }

  /** Wall plate and four closed mitred hooks; hanging clothing is a later prop. */
  public coatHooks(): FittingBuilt {
    const a=new FittingParts();
    a.box("board","board",[3.22,3.24,1.65,1.75,-2.85,-2.05],2);
    for(const [index,offset] of [-.25,-.08,.08,.25].entries()){
      const z=-2.45-offset,r=.006,y=1.715,x=3.32,segments=24;
      const rings:[FittingPoint[],FittingPoint[],FittingPoint[]]=[[],[],[]];
      for(let i=0;i<segments;i++){
        const angle=2*Math.PI*i/segments,c=r*Math.cos(angle),s=r*Math.sin(angle);
        rings[0].push([3.24,y+c,z+s]);
        rings[1].push([x-c,y+c,z+s]);
        rings[2].push([x-c,y+.025,z+s]);
      }
      a.mesh(`hook/${index+1}`,"hook",(q,t)=>{
        for(let i=0;i<segments;i++){
          const next=(i+1)%segments,angle=2*Math.PI*(i+.5)/segments;
          const c=Math.cos(angle),s=Math.sin(angle),u=i*2*Math.PI*r/segments,v=(i+1)*2*Math.PI*r/segments;
          q([rings[0][i]!,rings[1][i]!,rings[1][next]!,rings[0][next]!],[0,c,s],[[0,u],[.08,u],[.08,v],[0,v]]);
          q([rings[1][i]!,rings[2][i]!,rings[2][next]!,rings[1][next]!],[-c,0,s],[[.08,u],[.105,u],[.105,v],[.08,v]]);
          t([[3.24,y,z],rings[0][i]!,rings[0][next]!],[-1,0,0]);
          t([[x,y+.025,z],rings[2][i]!,rings[2][next]!],[0,1,0]);
        }
      });
    }
    return {...a.finish("mudroom-hooks"),reviewYaw:-Math.PI/2};
  }

  /** Laundry upper cabinet with its garage-door casing clearance cut. */
  public laundryUpper(): FittingBuilt {
    const a=new FittingParts();
    a.box("carcass/main","carcass",[5.22,5.485,1.50,2.30,-3.35,-2.05]);
    a.box("carcass/casing-side","carcass",[5.485,5.50,1.50,2.27,-3.28,-2.05]);
    a.box("carcass/casing-head","carcass",[5.485,5.50,2.27,2.30,-3.35,-2.05]);
    for(const [id,z0,z1] of [
      ["left", -3.35, -2.70],
      ["right", -2.70, -2.05],
    ] as const){
      const centre=(z0+z1)/2,slot0=centre-0.06,slot1=centre+0.06;
      // The front 0.012 m layer is absent at the handle; the backing face is recessed.
      a.box(`leaf/${id}/back`,"leaf",[5.212,5.22,1.50,2.30,z0,z1]);
      a.box(`leaf/${id}/lower`,"leaf",[5.20,5.212,1.50,1.5275,z0,z1]);
      a.box(`leaf/${id}/upper`,"leaf",[5.20,5.212,1.5525,2.30,z0,z1]);
      a.box(`leaf/${id}/slot-left`,"leaf",[5.20,5.212,1.5275,1.5525,z0,slot0]);
      a.box(`leaf/${id}/slot-right`,"leaf",[5.20,5.212,1.5275,1.5525,slot1,z1]);
    }
    return {...a.finish("laundry-upper"),reviewYaw:Math.PI/2};
  }

  /** Five one-piece L shelves and two wall cleats below each shelf. */
  public pantryShelves(): FittingBuilt {
    const a=new FittingParts();
    const perimeter: readonly XZ[] = [
      [3.22, -6.05],
      [5.50, -6.05],
      [5.50, -4.70],
      [5.20, -4.70],
      [5.20, -5.80],
      [3.235, -5.80],
      [3.235, -5.82],
      [3.22, -5.82],
    ];
    for(const [i,top] of [0.20,0.60,1.00,1.40,1.80].entries()){
      const low=top-0.03;
      a.mesh(`shelf/${i+1}`, "shelf", (q,t)=>{
        for(let j=0;j<perimeter.length;j++){
          const [x0,z0]=perimeter[j]!,[x1,z1]=perimeter[(j+1)%perimeter.length]!;
          const uv: [[number,number],[number,number],[number,number]]=[
            [5.25-3.22, -5.90+6.05],
            [x0-3.22, z0+6.05],
            [x1-3.22, z1+6.05],
          ];
          t(
            [
              [5.25, top, -5.90],
              [x0, top, z0],
              [x1, top, z1],
            ],
            [0, 1, 0],
            uv,
          );
          t(
            [
              [5.25, low, -5.90],
              [x0, low, z0],
              [x1, low, z1],
            ],
            [0, -1, 0],
            uv,
          );
          const dx=x1-x0,dz=z1-z0,length=Math.hypot(dx, dz),normal:FittingPoint=[
            dz/length,
            0,
            -dx/length,
          ];
          q(
            [
              [x0, low, z0],
              [x1, low, z1],
              [x1, top, z1],
              [x0, top, z0],
            ],
            normal,
            [
              [0, 0],
              [length, 0],
              [length, 0.03],
              [0, 0.03],
            ],
          );
        }
      });
      a.box(`cleat/${i+1}/back`, "cleat", [
        3.235,
        5.48,
        top-0.06,
        top-0.03,
        -6.05,
        -6.03,
      ]);
      a.box(
        `cleat/${i+1}/right`,
        "cleat",
        [5.48, 5.50, top-0.06, top-0.03, -6.03, -4.70],
        2,
      );
    }
    return a.finish("pantry-shelves");
  }
}
