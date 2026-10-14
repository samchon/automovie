/** Fixed toilets and wall mirrors; metres and local +Z toward the room. */
import { FittingParts, type FittingBuilt, type FittingPoint } from "./geometry";
import type {IAutoMovieNode} from "@automovie/interface";

/**
 * Local-metre sanitary fixture recipes placed by ArchitecturalFitout without scale changes.
 *
 * Each call creates a fresh FittingParts and returns mutable model meshes and face bindings. Material records remain empty for the later building finish owner to resolve. Recipe and builder failures propagate; outputs are not cached, and no browser or native resource is acquired. These draft shapes and stored closed-state articulation do not establish plumbing, optical performance, loading or current visual acceptance.
 */
export class SanitaryFittings {
  /**
 * Closed-state toilet parts and existing seat-lid articulation.
 *
 * Builds tank, foot, twelve-segment outer/inner bowl, seat, lid and lever. The lid mesh is rebased under a hinge at local y=0.43,z=0.28, whose profile limits both equal identity rotation; it declares a closed state rather than a supported opening range. Finite ring loops bound mesh emission. The caller owns fresh geometry and articulation, with surface materials resolved downstream; plumbing and loading remain unverified.
 */
public toilet():FittingBuilt {
    const a:FittingParts=new FittingParts();
    a.box("tank","ceramic",[-.25,.25,.40,.78,0,.20]);
    a.box("tank-lid","ceramic",[-.25,.25,.78,.82,0,.20]);
    a.box("foot","ceramic",[-.12,.12,0,.20,.28,.63]);
    const ring:(rx:number,rz:number,y:number)=>FittingPoint[]=(rx:number,rz:number,y:number):FittingPoint[]=>Array.from({length:12},(_:unknown,i:number):FittingPoint=>{
      const angle:number=2*Math.PI*i/12;return [rx*Math.cos(angle),y,.515+rz*Math.sin(angle)];
    });
    const lower:FittingPoint[]=ring(.12,.175,.20),upper:FittingPoint[]=ring(.19,.235,.40);
    const innerTop:FittingPoint[]=ring(.135,.155,.40),innerBottom:FittingPoint[]=ring(.0945,.1085,.25);
    a.mesh("bowl","ceramic",(q:Parameters<Parameters<FittingParts["mesh"]>[2]>[0],tri:Parameters<Parameters<FittingParts["mesh"]>[2]>[1]):void=>{
      for(let i:number=0;i<12;i++){
        const j:number=(i+1)%12,u:FittingPoint=upper[i]!,v:FittingPoint=upper[j]!,l:FittingPoint=lower[i]!,m:FittingPoint=lower[j]!;
        const e:number[]=[v[0]-u[0],v[1]-u[1],v[2]-u[2]],f:number[]=[l[0]-u[0],l[1]-u[1],l[2]-u[2]];
        const n:[number,number,number]=[e[1]!*f[2]!-e[2]!*f[1]!,e[2]!*f[0]!-e[0]!*f[2]!,e[0]!*f[1]!-e[1]!*f[0]!];
        const len:number=Math.hypot(...n);q([u,v,m,l],n.map((x:number):number=>x/len) as [number,number,number]);
        q([u,v,innerTop[j]!,innerTop[i]!],[0,1,0]);
        const insideA:FittingPoint=innerTop[i]!,insideB:FittingPoint=innerTop[j]!,insideC:FittingPoint=innerBottom[j]!;
        const ab:number[]=[insideB[0]-insideA[0],0,insideB[2]-insideA[2]],ac:number[]=[insideC[0]-insideA[0],-.15,insideC[2]-insideA[2]];
        const inward:[number,number,number]=[-(ab[1]!*ac[2]!-ab[2]!*ac[1]!),-(ab[2]!*ac[0]!-ab[0]!*ac[2]!),-(ab[0]!*ac[1]!-ab[1]!*ac[0]!)];
        const length:number=Math.hypot(...inward);
        q([insideA,insideB,insideC,innerBottom[i]!],inward.map((v:number):number=>v/length) as [number,number,number]);
        tri([[0,.25,.515],innerBottom[i]!,innerBottom[j]!],[0,1,0]);
        tri([[0,.20,.515],l,m],[0,-1,0]);
      }
    });
    const plate:(id:string,face:string,y0:number,y1:number)=>void=(id:string,face:string,y0:number,y1:number):void=>{
      const bottom:FittingPoint[]=ring(.19,.225,y0),top:FittingPoint[]=ring(.19,.225,y1);
      const holeBottom:FittingPoint[]=ring(.135,.155,y0),holeTop:FittingPoint[]=ring(.135,.155,y1);
      a.mesh(id,face,(q:Parameters<Parameters<FittingParts["mesh"]>[2]>[0],tri:Parameters<Parameters<FittingParts["mesh"]>[2]>[1]):void=>{
        for(let i:number=0;i<12;i++){
          const j:number=(i+1)%12,angle:number=2*Math.PI*(i+.5)/12;
          q([bottom[i]!,bottom[j]!,top[j]!,top[i]!],[Math.cos(angle),0,Math.sin(angle)]);
          if(face==="toilet-seat"){
            q([holeBottom[i]!,holeBottom[j]!,holeTop[j]!,holeTop[i]!],[-Math.cos(angle),0,-Math.sin(angle)]);
            q([bottom[i]!,bottom[j]!,holeBottom[j]!,holeBottom[i]!],[0,-1,0]);
            q([top[i]!,top[j]!,holeTop[j]!,holeTop[i]!],[0,1,0]);
          }else{
            tri([[0,y0,.515],bottom[i]!,bottom[j]!],[0,-1,0]);
            tri([[0,y1,.515],top[i]!,top[j]!],[0,1,0]);
          }
        }
      });
    };
    plate("seat","toilet-seat",.40,.43);plate("seat-lid","lid",.43,.455);
    a.box("flush-lever","handle",[-.22,-.14,.6725,.6875,.20,.215]);
    const built:FittingBuilt=a.finish("toilet");
    const node:(id:string,parent:string|null,y:number,z:number,mesh:string|null)=>IAutoMovieNode=(id:string,parent:string|null,y:number,z:number,mesh:string|null):IAutoMovieNode=>({
      id,name:id,parent,kind:mesh===null?"group":"mesh",mesh,camera:null,light:null,skin:null,
      transform:{translation:{x:0,y,z},rotation:{x:0,y:0,z:0,w:1},scale:{x:1,y:1,z:1}},
    });
    built.articulation={
      nodes:[node("root",null,0,0,null),node("seat-lid","root",.43,.28,null),node("lid-mesh","seat-lid",-.43,-.28,"seat-lid")],
      profile:{id:"toilet-seat-lid",name:"toilet closed-state hinge",drivers:[],limits:[{channel:{kind:"node",node:"seat-lid",path:"rotation"},min:[0,0,0,1],max:[0,0,0,1]}]},
      binding:{profile:"toilet-seat-lid",boneMap:{"seat-lid":"seat-lid"}},
    };
    return built;
  }

  /**
 * Fixed framed mirror at one of the three reserved widths.
 *
 * The typed widths are 0.60, 0.70 and 0.85 metres; four frame bars and a recessed plate are 0.80 metres high with 0.04/0.01-metre depths. Five box calls emit fresh caller-owned geometry and face bindings. The type restricts the authored choices; runtime box validation does not enforce that width union. Reflection is downstream material/viewer behavior and is not proven by this geometry.
 */
public mirror(width:.60|.70|.85):FittingBuilt {
    const a:FittingParts=new FittingParts(),half:number=width/2;
    a.box("frame-left","mirror-frame",[-half,-half+.02,0,.80,0,.04],1);
    a.box("frame-right","mirror-frame",[half-.02,half,0,.80,0,.04],1);
    a.box("frame-bottom","mirror-frame",[-half+.02,half-.02,0,.02,0,.04]);
    a.box("frame-top","mirror-frame",[-half+.02,half-.02,.78,.80,0,.04]);
    a.box("plate","mirror",[-half+.02,half-.02,.02,.78,0,.01]);
    return a.finish(`mirror-${width}`);
  }

  /**
 * Fixed towel-bar hardware without a hanging textile.
 *
 * Width selects 0.25, 0.50 or 0.75 metres and height selects 0.30 or 0.40 metres in the authored type; support centres sit height-0.03 metres above the local floor. Two wall bases, two arms and one transverse bar use the builder's default 24-sided cylinders. Output is fresh and caller-owned; no textile is emitted and contact/loading remains unverified.
 */
public towelBar(width:.25|.50|.75,height:.30|.40):FittingBuilt {
    const a:FittingParts=new FittingParts(),y:number=height-.03;
    for(const [i,x] of [-width/2+.015,width/2-.015].entries()){
      a.cylinder(`bracket/${i+1}/base`,"bracket","z",[x,y,0],.006,.015);
      a.cylinder(`bracket/${i+1}/arm`,"bracket","z",[x,y,.006],.024,.006);
    }
    a.cylinder("bar","rod","x",[-width/2,y,.04],width,.01);
    return a.finish(`towel-bar-${width}-${height}`);
  }

  /**
 * Fixed longitudinal rail and two ceiling supports for the tub reservation.
 *
 * A 1.80-metre +Z rail has its centre at y=2.05 metres. Two vertical supports at z=0.01 and 1.79 extend from y=2.0625 to 2.60 metres. Three default 24-sided cylinders emit fresh caller-owned geometry with rail/rod face bindings. No curtain cloth, movement or structural support certification is produced.
 */
public curtainRail():FittingBuilt {
    const a:FittingParts=new FittingParts();
    a.cylinder("rail","rail","z",[0,2.05,0],1.80,.0125);
    for(const [i,z] of [.01,1.79].entries())a.cylinder(`support/${i+1}`,"rod","y",[0,2.0625,z],.5375,.01);
    return a.finish("tub-curtain-rail");
  }
}
