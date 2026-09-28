/** Fixed toilets and wall mirrors; metres and local +Z toward the room. */
import { FittingParts, type FittingBuilt, type FittingPoint } from "./geometry";
import type {IAutoMovieNode} from "@automovie/interface";

/** Sanitary fixtures consume the three room reservations without scale changes. */
export class SanitaryFittings {
  /** One closed-seat toilet, with a twelve-sided bowl and separate tank. */
  public toilet():FittingBuilt {
    const a=new FittingParts();
    a.box("tank","ceramic",[-.25,.25,.40,.78,0,.20]);
    a.box("tank-lid","ceramic",[-.25,.25,.78,.82,0,.20]);
    a.box("foot","ceramic",[-.12,.12,0,.20,.28,.63]);
    const ring=(rx:number,rz:number,y:number):FittingPoint[]=>Array.from({length:12},(_,i)=>{
      const angle=2*Math.PI*i/12;return [rx*Math.cos(angle),y,.515+rz*Math.sin(angle)];
    });
    const lower=ring(.12,.175,.20),upper=ring(.19,.235,.40);
    const innerTop=ring(.135,.155,.40),innerBottom=ring(.0945,.1085,.25);
    a.mesh("bowl","ceramic",(q,tri)=>{
      for(let i=0;i<12;i++){
        const j=(i+1)%12,u=upper[i]!,v=upper[j]!,l=lower[i]!,m=lower[j]!;
        const e=[v[0]-u[0],v[1]-u[1],v[2]-u[2]],f=[l[0]-u[0],l[1]-u[1],l[2]-u[2]];
        const n:[number,number,number]=[e[1]!*f[2]!-e[2]!*f[1]!,e[2]!*f[0]!-e[0]!*f[2]!,e[0]!*f[1]!-e[1]!*f[0]!];
        const len=Math.hypot(...n);q([u,v,m,l],n.map(x=>x/len) as [number,number,number]);
        q([u,v,innerTop[j]!,innerTop[i]!],[0,1,0]);
        const insideA=innerTop[i]!,insideB=innerTop[j]!,insideC=innerBottom[j]!;
        const ab=[insideB[0]-insideA[0],0,insideB[2]-insideA[2]],ac=[insideC[0]-insideA[0],-.15,insideC[2]-insideA[2]];
        const inward:[number,number,number]=[-(ab[1]!*ac[2]!-ab[2]!*ac[1]!),-(ab[2]!*ac[0]!-ab[0]!*ac[2]!),-(ab[0]!*ac[1]!-ab[1]!*ac[0]!)];
        const length=Math.hypot(...inward);
        q([insideA,insideB,insideC,innerBottom[i]!],inward.map(v=>v/length) as [number,number,number]);
        tri([[0,.25,.515],innerBottom[i]!,innerBottom[j]!],[0,1,0]);
        tri([[0,.20,.515],l,m],[0,-1,0]);
      }
    });
    const plate=(id:string,face:string,y0:number,y1:number):void=>{
      const bottom=ring(.19,.225,y0),top=ring(.19,.225,y1);
      const holeBottom=ring(.135,.155,y0),holeTop=ring(.135,.155,y1);
      a.mesh(id,face,(q,tri)=>{
        for(let i=0;i<12;i++){
          const j=(i+1)%12,angle=2*Math.PI*(i+.5)/12;
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
    const built=a.finish("toilet");
    const node=(id:string,parent:string|null,y:number,z:number,mesh:string|null):IAutoMovieNode=>({
      id,name:id,parent,kind:mesh===null?"group":"mesh",mesh,camera:null,light:null,skin:null,
      transform:{translation:{x:0,y,z},rotation:{x:0,y:0,z:0,w:1},scale:{x:1,y:1,z:1}},
    });
    built.articulation={
      nodes:[node("root",null,0,0,null),node("seat-lid","root",.43,.28,null),node("lid-mesh","seat-lid",-.43,-.28,"seat-lid")],
      profile:{id:"toilet-seat-lid",name:"toilet closed-state hinge",drivers:[],controls:[{
        name:"seat-lid.rotation",channel:{kind:"node",node:"seat-lid",path:"rotation"},default:[0,0,0,1],group:"sanitary",
      }],limits:[{channel:{kind:"node",node:"seat-lid",path:"rotation"},min:[0,0,0,1],max:[0,0,0,1]}]},
      binding:{profile:"toilet-seat-lid",root:"root",instanceName:null,boneMap:{"seat-lid":"seat-lid"}},
    };
    return built;
  }

  /** Frame bars meet at their ends; the silver plate sits 0.03 m behind the front. */
  public mirror(width:.60|.70|.85):FittingBuilt {
    const a=new FittingParts(),half=width/2;
    a.box("frame-left","mirror-frame",[-half,-half+.02,0,.80,0,.04],1);
    a.box("frame-right","mirror-frame",[half-.02,half,0,.80,0,.04],1);
    a.box("frame-bottom","mirror-frame",[-half+.02,half-.02,0,.02,0,.04]);
    a.box("frame-top","mirror-frame",[-half+.02,half-.02,.78,.80,0,.04]);
    a.box("plate","mirror",[-half+.02,half-.02,.02,.78,0,.01]);
    return a.finish(`mirror-${width}`);
  }

  /** Wall-fixed hardware only; the hanging textile remains a separate prop. */
  public towelBar(width:.25|.50|.75,height:.30|.40):FittingBuilt {
    const a=new FittingParts(),y=height-.03;
    for(const [i,x] of [-width/2+.015,width/2-.015].entries()){
      a.cylinder(`bracket/${i+1}/base`,"bracket","z",[x,y,0],.006,.015);
      a.cylinder(`bracket/${i+1}/arm`,"bracket","z",[x,y,.006],.024,.006);
    }
    a.cylinder("bar","rod","x",[-width/2,y,.04],width,.01);
    return a.finish(`towel-bar-${width}-${height}`);
  }

  /** Rail follows local +Z; both end supports meet the room's ceiling datum. */
  public curtainRail():FittingBuilt {
    const a=new FittingParts();
    a.cylinder("rail","rail","z",[0,2.05,0],1.80,.0125);
    for(const [i,z] of [.01,1.79].entries())a.cylinder(`support/${i+1}`,"rod","y",[0,2.0625,z],.5375,.01);
    return a.finish("tub-curtain-rail");
  }
}
