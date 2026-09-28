/** Closed fixture bodies at the model-owned dimensions, independent of light power. */
import { FittingParts, type FittingBuilt, type FittingPoint } from "./furnishings/geometry";

/** Flat fixtures, pendants, mirror bars and the switched-off porch sconce. */
export class LightingFixtures {
  private ring(a:FittingParts,id:string,face:string,profile:readonly (readonly [number,number,number])[],cx=0,cz=0,sides=16):void {
    a.mesh(id,face,q=>{
      const p=(radius:number,y:number,angle:number):FittingPoint=>[cx+radius*Math.cos(angle),y,cz+radius*Math.sin(angle)];
      for(let i=0;i<sides;i++){
        const u=i*2*Math.PI/sides,v=(i+1)*2*Math.PI/sides,m=(u+v)/2;
        for(let j=0;j<profile.length-1;j++){
          const [y0,r0,h0]=profile[j]!,[y1,r1,h1]=profile[j+1]!,dy=y1-y0,dr=r1-r0,l=Math.hypot(dy,dr),di=h1-h0,li=Math.hypot(dy,di);
          q([p(r0,y0,u),p(r0,y0,v),p(r1,y1,v),p(r1,y1,u)],[dy*Math.cos(m)/l,-dr/l,dy*Math.sin(m)/l]);
          q([p(h0,y0,v),p(h0,y0,u),p(h1,y1,u),p(h1,y1,v)],[-dy*Math.cos(m)/li,di/li,-dy*Math.sin(m)/li]);
        }
        for(const [end,n] of [[profile[0]!,-1],[profile.at(-1)!,1]] as const){
          const [y,r,h]=end;
          q([p(h,y,u),p(h,y,v),p(r,y,v),p(r,y,u)],[0,n,0]);
        }
      }
    });
  }
  /** A 16-sided housing with a flush inner diffuser and face-contacting neck. */
  public flush(garage=false):FittingBuilt {
    const a=new FittingParts(),r=garage?.20:.12,inner=r-.02;
    a.cylinder("contact","fixture-housing","y",[0,-.008,0],.008,r*.70,16);
    a.cylinder("neck","fixture-housing","y",[0,-.015,0],.007,r*.70,16);
    a.cylinder("connector","fixture-housing","y",[0,-.020,0],.005,r,16);
    this.ring(a,"ring","fixture-housing",[[-.05,r,inner],[-.020,r,inner]]);
    a.cylinder("diffuser","fixture-diffuser","y",[0,-.05,0],.012,inner,16);
    return a.finish(`flush-${garage?"garage":"room"}`);
  }
  /** The 0.80 m island bell and 1.20 m dining shade share a ceiling frame. */
  public pendant(kind:"island"|"dining"):FittingBuilt {
    const a=new FittingParts(),island=kind==="island",top=island?-.58:-1,bottom=island?-.8:-1.2;
    a.cylinder("canopy","fixture-canopy","y",[0,-.025,0],.025,.05,16);
    a.cylinder("stem","fixture-stem","y",[0,top,0],-.025-top,.006,16);
    this.ring(a,"shade","fixture-shade",island?[[-.8,.14,.132],[-.7,.12,.112],[-.58,.055,.047]]:[[-1.2,.24,.232],[-1,.24,.232]]);
    this.ring(a,"shade-top","fixture-shade",[[top-.008,island?.047:.232,.006],[top,island?.047:.232,.006]]);
    a.cylinder("diffuser","fixture-diffuser","y",[0,bottom+(island?.008:0),0],island?.006:.008,island?.132:.232,16);
    return a.finish(`pendant-${kind}`);
  }
  /** The mirror bar's 0.08 m projection is bounded by its two end supports. */
  public vanity():FittingBuilt {
    const a=new FittingParts();
    a.box("back","fixture-housing",[-.18,.18,-.03,.03,0,.015]);
    for(const [id,x0,x1] of [["left",-.18,-.155],["right",.155,.18]] as const)
      a.box(id,"fixture-housing",[x0,x1,-.03,.03,.015,.08]);
    a.cylinder("diffuser","fixture-diffuser","x",[-.155,0,.0575],.31,.0225,16);
    return a.finish("vanity-light");
  }
  /** The porch body remains visible with its system light switched off. */
  public porch():FittingBuilt {
    const a=new FittingParts();
    a.box("plate","fixture-housing",[-.05,.05,-.09,.09,0,.015]);
    a.cylinder("neck","fixture-stem","z",[0,.015,.015],.045,.0125,16);
    this.ring(a,"glass","fixture-glass",[[-.16,.07,.066],[.04,.05,.046]],0,.1,8);
    return a.finish("porch-sconce");
  }
}
