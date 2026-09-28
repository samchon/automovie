/** Fixed sanitary fittings from docs/models/14-bathrooms.md. Floor Y is local metres. */
import { FittingParts, type FittingBuilt, type FittingPoint } from "./geometry";

type XZ = readonly [number,number];
const point=(x:number,y:number,z:number):FittingPoint=>[x,y,z];
const polar=(cx:number,cz:number,rx:number,rz:number,angle:number):XZ=>[
  cx+rx*Math.cos(angle),
  cz+rz*Math.sin(angle),
];
const midAngle=(a:number,b:number):number=>a+((b<=a?b+2*Math.PI:b)-a)/2;
const upward=(a:FittingPoint,b:FittingPoint,c:FittingPoint):FittingPoint=>{
  const u=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],v=[c[0]-a[0],c[1]-a[1],c[2]-a[2]];
  const n:[number,number,number]=[
    u[1]!*v[2]!-u[2]!*v[1]!,
    u[2]!*v[0]!-u[0]!*v[2]!,
    u[0]!*v[1]!-u[1]!*v[0]!,
  ];
  if(n[1]<0)n.forEach((value,i)=>{
    n[i]=-value;
  });
  const length=Math.hypot(...n);
  return [n[0]/length,n[1]/length,n[2]/length];
};

/** Bathroom vanities, wall-bound shower booth and bath. */
export class Bathrooms {
  /** Powder, shower and tub vanity widths; the door count follows the reviewed width. */
  public vanity(width:0.60|0.70|0.85,depth:0.45|0.55,paintedWall=false):FittingBuilt {
    if (!((width===0.60&&depth===0.45)||(width===0.70&&depth===0.55)||(width===0.85&&depth===0.55)))
      throw new Error("unsupported vanity reservation");
    const a=new FittingParts(),left=-width/2,right=width/2;
    a.box("plinth", "plinth", [
      left+0.02,
      right-0.02,
      0,
      0.10,
      paintedWall ? 0.015 : 0,
      depth-0.07,
    ]);
    a.box("carcass/back","carcass",[left,right,0.10,0.82,0,0.02]);
    a.box(
      "carcass/left",
      "carcass",
      [left, left+0.02, 0.12, 0.82, 0.02, depth-0.02],
      1,
    );
    a.box(
      "carcass/right",
      "carcass",
      [right-0.02, right, 0.12, 0.82, 0.02, depth-0.02],
      1,
    );
    a.box("carcass/bottom", "carcass", [
      left+0.02,
      right-0.02,
      0.10,
      0.12,
      0.02,
      depth-0.02,
    ]);
    const doors:readonly [number,number][] = width===0.60
      ? [[-0.28, 0.28]]
      : width===0.70
        ? [
            [-0.33, -0.01],
            [0.01, 0.33],
          ]
        : [
            [-0.405, -0.01],
            [0.01, 0.405],
          ];
    for(const [i,[x0,x1]] of doors.entries()){
      const mid=(x0+x1)/2;
      // The top-open notch is cut from the front 0.012 m of each leaf.
      a.box(`door-${i+1}/lower`,"leaf",[x0,x1,0.10,0.802,depth-0.02,depth]);
      a.box(`door-${i+1}/top-left`, "leaf", [
        x0,
        mid-0.06,
        0.802,
        0.82,
        depth-0.02,
        depth,
      ]);
      a.box(`door-${i+1}/top-right`, "leaf", [
        mid+0.06,
        x1,
        0.802,
        0.82,
        depth-0.02,
        depth,
      ]);
      a.box(`door-${i+1}/handle`, "handle", [
        mid-0.06,
        mid+0.06,
        0.802,
        0.82,
        depth-0.02,
        depth-0.012,
      ]);
    }
    this.ellipticalSink(a,width,depth);
    a.cylinder("faucet/base","faucet","y",[0,0.85,0.05],0.008,0.025);
    a.cylinder("faucet/stem","faucet","y",[0,0.858,0.05],0.192,0.0125);
    a.cylinder("faucet/spout","faucet","z",[0,1.041,0.05],0.10,0.009);
    return a.finish(`vanity-${width}`);
  }

  private ellipticalSink(a:FittingParts,width:number,depth:number):void {
    const rx=(width-0.20)/2,rz=(depth-0.20)/2,cx=0,cz=depth/2;
    const angleSet=Array.from({ length:32 },(_,i)=>2*Math.PI*i/32);
    for(const sx of [-1,1])for(const sz of [-1, 1])angleSet.push((Math.atan2(sz*depth/2,sx*width/2)+2*Math.PI)%(2*Math.PI));
    const angles=[...new Set(angleSet)].sort((a,b)=>a-b);
    a.mesh("countertop", "countertop", (q,t)=>{
      for(let i=0;i<angles.length;i++){
        const u=angles[i]!,v=angles[(i+1)%angles.length]!;
        const outer=(angle:number):XZ=>{
          const c=Math.cos(angle),s=Math.sin(angle),r=Math.min(
            width/2/Math.max(Math.abs(c),1e-12),
            depth/2/Math.max(Math.abs(s),1e-12),
          );
          return [cx+r*c, cz+r*s];
        };
        const [ox,oz]=outer(u),[px,pz]=outer(v),[ix,iz]=polar(cx, cz, rx, rz, u),[jx,jz]=polar(
          cx,
          cz,
          rx,
          rz,
          v,
        );
        for(const [y,n] of [[0.82,-1],[0.85,1]] as const){
          t([point(ox, y, oz), point(px, y, pz), point(jx, y, jz)], [0, n, 0]);
          t([point(ox, y, oz), point(jx, y, jz), point(ix, y, iz)], [0, n, 0]);
        }
        const mid=midAngle(u, v);
        q(
          [
            point(ox, 0.82, oz),
            point(px, 0.82, pz),
            point(px, 0.85, pz),
            point(ox, 0.85, oz),
          ],
          [Math.cos(mid), 0, Math.sin(mid)],
        );
        q(
          [
            point(ix, 0.82, iz),
            point(jx, 0.82, jz),
            point(jx, 0.85, jz),
            point(ix, 0.85, iz),
          ],
          [-Math.cos(mid), 0, -Math.sin(mid)],
        );
      }
    });
    a.mesh("basin", "ceramic", (q,t)=>{
      for(let i=0;i<angles.length;i++){
        const u=angles[i]!,v=angles[(i+1)%angles.length]!;
        const [tx,tz]=polar(cx, cz, rx, rz, u),[ux,uz]=polar(cx, cz, rx, rz, v);
        const [bx,bz]=polar(cx, cz, rx*0.70, rz*0.70, u),[vx,vz]=polar(
          cx,
          cz,
          rx*0.70,
          rz*0.70,
          v,
        );
        const [ix,iz]=polar(cx, cz, rx*0.70-0.01, rz*0.70-0.01, u),[jx,jz]=polar(
          cx,
          cz,
          rx*0.70-0.01,
          rz*0.70-0.01,
          v,
        );
        const mid=midAngle(u, v);
        q(
          [
            point(tx, 0.82, tz),
            point(ux, 0.82, uz),
            point(vx, 0.69, vz),
            point(bx, 0.69, bz),
          ],
          [Math.cos(mid), 0, Math.sin(mid)],
        );
        q(
          [
            point(tx, 0.82, tz),
            point(ux, 0.82, uz),
            point(jx, 0.70, jz),
            point(ix, 0.70, iz),
          ],
          [-Math.cos(mid), 0, -Math.sin(mid)],
        );
        t(
          [point(cx, 0.70, cz), point(ix, 0.70, iz), point(jx, 0.70, jz)],
          [0, 1, 0],
        );
        t(
          [point(cx, 0.69, cz), point(bx, 0.69, bz), point(vx, 0.69, vz)],
          [0, -1, 0],
        );
      }
    });
  }

  /** Closed three-panel state at 0, fully stacked 0.80 m clear opening at 1. */
  public showerBooth(open=0):FittingBuilt {
    if (!Number.isFinite(open)||open<0||open>1) throw new Error(
      "shower door state outside reviewed range",
    );
    const a=new FittingParts();
    this.showerTray(a);
    a.box("glass/right","glass",[0.617,0.625,0.018,2.10,0,1.01],2);
    a.box("rail/left-profile","rail",[-0.625,-0.605,0.043,2.075,1.01,1.04],1);
    for(let i=0;i<3;i++){
      const z0=1.01+i*0.03,z1=z0+0.03;
      a.box(`rail/${i+1}/bottom`,"rail",[-0.625,0.625,0.018,0.043,z0,z1]);
      a.box(`rail/${i+1}/top`,"rail",[-0.625,0.625,2.075,2.10,z0,z1]);
    }
    for(const [i,x0,x1,z0] of [
      [1, -0.625, -0.195, 1.04],
      [2, -0.215, 0.215, 1.06],
      [3, 0.195, 0.625, 1.08],
    ] as const){
      const move=(3-i)*0.41*open;
      a.box(
        `glass/panel-${i}`,
        "glass",
        [x0+move, x1+move, 0.043, 2.075, z0, z0+0.008],
        1,
      );
    }
    const hx=-0.235+0.82*open;
    a.cylinder("handle/grip","handle","y",[hx,0.90,1.024],0.20,0.009);
    a.cylinder("handle/support","handle","z",[hx,1.00,1.033],0.007,0.004);
    a.cylinder("faucet/valve","faucet","z",[-0.375,1.05,0],0.025,0.04);
    a.cylinder("faucet/spout","faucet","z",[-0.375,1.05,0.025],0.075,0.0125);
    a.cylinder("faucet/head-arm","faucet","z",[-0.375,2.03,0],0.175,0.0125);
    a.cylinder("faucet/head","faucet","z",[-0.375,2.03,0.175],0.025,0.07);
    return a.finish("shower-booth");
  }

  private showerTray(a:FittingParts):void {
    const x0=-0.625,x1=0.625,z0=0,z1=1.10,ix0=x0+0.01,ix1=x1-0.01,iz0=z0+0.01,iz1=z1-0.01;
    a.mesh("shower-tray", "shower-tray", (q,t)=>{
      q(
        [point(x0, 0, z0), point(x1, 0, z0), point(x1, 0, z1), point(x0, 0, z1)],
        [0, -1, 0],
      );
      const outer:readonly XZ[]=[
        [x0, z0],
        [x1, z0],
        [x1, z1],
        [x0, z1],
      ],inner:readonly XZ[]=[
        [ix0, iz0],
        [ix1, iz0],
        [ix1, iz1],
        [ix0, iz1],
      ];
      for(let i=0;i<4;i++){
        const [ox,oz]=outer[i]!,[px,pz]=outer[(i+1)%4]!,[ix,iz]=inner[i]!,[jx,jz]=inner[(i+1)%4]!;
        q(
          [
            point(ox, 0.018, oz),
            point(px, 0.018, pz),
            point(jx, 0.018, jz),
            point(ix, 0.018, iz),
          ],
          [0, 1, 0],
        );
        const sa=point(ix, 0.018, iz),sb=point(jx, 0.018, jz),sc=point(
          0,
          0.014,
          0.55,
        );
        t([sa, sb, sc], upward(sa, sb, sc));
        const dx=px-ox,dz=pz-oz,length=Math.hypot(dx, dz);
        q(
          [
            point(ox, 0, oz),
            point(px, 0, pz),
            point(px, 0.018, pz),
            point(ox, 0.018, oz),
          ],
          [dz/length, 0, -dx/length],
        );
      }
    });
  }

  /** 1.80 m bath with a rounded, open cavity and wall-mounted shower fittings. */
  public bathtub():FittingBuilt {
    const a=new FittingParts();
    const rx=0.84,rz=0.34,r=0.08;
    const inner: XZ[]=[];
    for(const [cx,cz,start] of [
      [rx-r, rz-r, 0],
      [-rx+r, rz-r, Math.PI/2],
      [-rx+r, -rz+r, Math.PI],
      [rx-r, -rz+r, 3*Math.PI/2],
    ] as const)
      for(let i=0;i<=8;i++) inner.push([
        cx+r*Math.cos(start+i*Math.PI/16),
        cz+r*Math.sin(start+i*Math.PI/16),
      ]);
    const angleSet=inner.map(([x,z])=>Math.atan2(z,x));
    for(const sx of [-1, 1]) for(const sz of [-1, 1]) angleSet.push(Math.atan2(sz*0.40, sx*0.90));
    const angles=[...new Set(angleSet.map((v)=>(v+2*Math.PI)%(2*Math.PI)))].sort(
      (a,b)=>a-b,
    );
    const intersection=(theta:number):XZ=>{
      const dx=Math.cos(theta),dz=Math.sin(theta);
      let best=Infinity;
      for(let i=0;i<inner.length;i++){
        const [ax,az]=inner[i]!,[bx,bz]=inner[(i+1)%inner.length]!,ex=bx-ax,ez=bz-az,den=dx*ez-dz*ex;
        if(Math.abs(den)<1e-12)continue;
        const t=(ax*ez-az*ex)/den,u=(ax*dz-az*dx)/den;
        if(t>0&&u>=-1e-9&&u<=1+1e-9)best=Math.min(best,t);
      }
      if(!Number.isFinite(best))throw new Error("bath cavity ray missed its outline");
      return [best*dx,best*dz];
    };
    const outer=(theta:number):XZ=>{
      const dx=Math.cos(theta),dz=Math.sin(theta),v=Math.min(
        0.90/Math.max(Math.abs(dx),1e-12),
        0.40/Math.max(Math.abs(dz),1e-12),
      );
      return [v*dx,0.40+v*dz];
    };
    a.mesh("ceramic", "ceramic", (q,t)=>{
      for(let i=0;i<angles.length;i++){
        const u=angles[i]!,v=angles[(i+1)%angles.length]!,[ix,iz]=intersection(
          u,
        ),[jx,jz]=intersection(v),[ox,oz]=outer(u),[px,pz]=outer(v);
        t([point(0, 0, 0.40), point(ox, 0, oz), point(px, 0, pz)], [0, -1, 0]);
        t(
          [point(ox, 0.55, oz), point(px, 0.55, pz), point(jx, 0.55, 0.40+jz)],
          [0, 1, 0],
        );
        t(
          [
            point(ox, 0.55, oz),
            point(jx, 0.55, 0.40+jz),
            point(ix, 0.55, 0.40+iz),
          ],
          [0, 1, 0],
        );
        const mid=midAngle(u, v);
        q(
          [
            point(ix, 0.15, 0.40+iz),
            point(jx, 0.15, 0.40+jz),
            point(jx, 0.55, 0.40+jz),
            point(ix, 0.55, 0.40+iz),
          ],
          [-Math.cos(mid), 0, -Math.sin(mid)],
        );
        t(
          [
            point(0, 0.15, 0.40),
            point(ix, 0.15, 0.40+iz),
            point(jx, 0.15, 0.40+jz),
          ],
          [0, 1, 0],
        );
        const dx=px-ox,dz=pz-oz,len=Math.hypot(dx, dz);
        q(
          [
            point(ox, 0, oz),
            point(px, 0, pz),
            point(px, 0.55, pz),
            point(ox, 0.55, oz),
          ],
          [dz/len, 0, -dx/len],
        );
      }
    });
    a.cylinder("faucet/stem","faucet","y",[-0.87,0.55,0.40],0.14,0.0125);
    a.cylinder("faucet/plate","faucet","y",[-0.87,0.69,0.40],0.02,0.04);
    a.cylinder("faucet/spout","faucet","x",[-0.87,0.70,0.40],0.12,0.0125);
    a.cylinder(
      "faucet/shower-column",
      "faucet",
      "y",
      [-0.87, 0.71, 0.40],
      1.165,
      0.0125,
    );
    a.cylinder("faucet/head-arm","faucet","x",[-0.87,1.875,0.40],0.18,0.0125);
    a.cylinder("faucet/head","faucet","y",[-0.69,1.875,0.40],0.025,0.07);
    return a.finish("bathtub");
  }
}
