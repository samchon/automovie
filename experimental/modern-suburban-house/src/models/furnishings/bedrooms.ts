/** Built-in bedroom and wardrobe storage from docs/models/13-bedrooms.md. */
import { FittingParts, type FittingBuilt, type FittingPoint } from "./geometry";

/** Fixed storage carcasses, moving sliding leaves, rods and authored clothes proxies. */
export class Bedrooms {
  /** The same 1.50 m wardrobe fits each small bedroom by instance placement. */
  public slidingCloset(frontTravel=0,rearTravel=0): FittingBuilt {
    if (![frontTravel,rearTravel].every(Number.isFinite)||frontTravel<0||frontTravel>0.72||rearTravel<0||rearTravel>0.72)
      throw new Error("bedroom closet travel outside reviewed range");
    const a=new FittingParts();
    a.box("carcass/back-low","carcass",[-0.75,0.75,0,0.10,0.015,0.02]);
    a.box("carcass/back-high","carcass",[-0.75,0.75,0.10,2.20,0,0.02]);
    a.box("carcass/left","carcass",[-0.75,-0.73,0,2.20,0.02,0.49],1);
    a.box("carcass/right","carcass",[0.73,0.75,0,2.20,0.02,0.49],1);
    a.box("carcass/bottom","carcass",[-0.73,0.73,0,0.02,0.02,0.49]);
    a.box("carcass/top","carcass",[-0.73,0.73,2.18,2.20,0.02,0.49]);
    for(const [id,z0,z1] of [
      ["front", 0.55, 0.57],
      ["rear", 0.50, 0.52],
    ] as const){
      a.box(`rail/${id}/bottom`,"rail",[-0.75,0.75,0,0.01,z0,z1]);
      a.box(`rail/${id}/top`,"rail",[-0.75,0.75,2.17,2.20,z0,z1]);
    }
    a.recessedZDoor(
      "door/front",
      [-0.75+frontTravel, 0.01+frontTravel, 0.01, 2.17, 0.55, 0.57],
      [-0.11+frontTravel, -0.01+frontTravel, 1.0375, 1.0625],
      0.008,
    );
    a.recessedZDoor(
      "door/rear",
      [-0.01-rearTravel, 0.75-rearTravel, 0.01, 2.17, 0.50, 0.52],
      [0.01-rearTravel, 0.11-rearTravel, 1.0375, 1.0625],
      0.008,
    );
    a.box("casing/left","casing",[-0.75,-0.72,0,2.17,0.57,0.60],1);
    a.box("casing/right","casing",[0.72,0.75,0,2.17,0.57,0.60],1);
    a.box("casing/head","casing",[-0.75,0.75,2.17,2.20,0.57,0.60]);
    a.cylinder("rod","rod","x",[-0.73,1.65,0.28],1.46,0.015);
    a.box("shelf","shelf",[-0.73,0.73,1.825,1.85,0.02,0.47]);
    this.clothes(a,"clothes",18,-0.36,1.635,0.28,0.38,0.85,0.05);
    return a.finish("bedroom-sliding-closet");
  }

  /** Wardrobe hanging run in its documented house XZ coordinates. */
  public wardrobeHanging(): FittingBuilt {
    const a=new FittingParts();
    for(const [name,x0,x1] of [
      ["left", 2.10, 2.13],
      ["right", 4.22, 4.25],
    ] as const){
      a.box(`carcass/${name}/low`,"carcass",[x0,x1,0,0.10,-10.435,-9.90],1);
      a.box(`carcass/${name}/high`,"carcass",[x0,x1,0.10,2.05,-10.45,-9.90],1);
    }
    a.cylinder("rod","rod","x",[2.13,1.65,-10.17],2.09,0.015);
    a.box("shelf","shelf",[2.13,4.22,2.02,2.05,-10.45,-9.90]);
    this.clothes(a,"clothes",36,2.455,1.60,-10.17,0.50,0.85,0.10);
    return a.finish("wardrobe-hanging");
  }

  /** Four support-free closet shelves with side panels and skirting relief. */
  public wardrobeShelves(): FittingBuilt {
    const a=new FittingParts();
    a.box("carcass/left/low","carcass",[4.40,4.43,0,0.10,-10.435,-9.90],1);
    a.box("carcass/left/high","carcass",[4.40,4.43,0.10,1.78,-10.45,-9.90],1);
    a.box("carcass/right/low","carcass",[5.47,5.485,0,0.10,-10.435,-9.90],1);
    a.box("carcass/right/high","carcass",[5.47,5.50,0.10,1.78,-10.45,-9.90],1);
    for(const [i,top] of [0.20,0.65,1.10,1.55].entries())
      a.box(`shelf/${i+1}`,"shelf",[4.43,5.47,top-0.03,top,-10.45,-9.90]);
    return a.finish("wardrobe-shelves");
  }

  private clothes(a:FittingParts,prefix:string,count:number,firstX:number,top:number,zCentre:number,depth:number,baseLength:number,step:number):void {
    let x=firstX;
    for(let i=0;i<count;i++){
      const thickness=0.035+0.005*(i%3),bottom=top-baseLength-step*(i%3),x0=x,x1=x+thickness;
      const z0=zCentre-depth/2,z1=zCentre+depth/2;
      const outline: readonly [number,number][] = [
        [zCentre, top],
        [zCentre-depth*0.28, top-0.01],
        [z0+0.03, top-0.045],
        [z0, top-0.10],
        [z0, bottom],
        [z1, bottom],
        [z1, top-0.10],
        [z1-0.03, top-0.045],
        [zCentre+depth*0.28, top-0.01],
      ];
      a.mesh(`${prefix}/${i+1}`,"clothes",(q,t)=>{
        const centreY=(top+bottom)/2;
        for(const faceX of [x0,x1]) for(let j=0;j<outline.length;j++){
          const [za,ya]=outline[j]!,[zb,yb]=outline[(j+1)%outline.length]!;
          t([[faceX,centreY,zCentre],[faceX,ya,za],[faceX,yb,zb]],faceX===x0?[-1,0,0]:[1,0,0]);
        }
        for(let j=0;j<outline.length;j++){
          const [za,ya]=outline[j]!,[zb,yb]=outline[(j+1)%outline.length]!,dy=yb-ya,dz=zb-za;
          const norm=Math.hypot(dy,dz),normal:FittingPoint=[0,-dz/norm,dy/norm];
          q([[x0,ya,za],[x1,ya,za],[x1,yb,zb],[x0,yb,zb]],normal);
        }
      });
      x=x1;
    }
  }
}
