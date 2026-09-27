/**
 * Timber and porch-stone prototypes from docs/models/entablature.md. Geometry
 * is local and metre valued; the reviewed spaces supply roof lines and room
 * widths. Instances choose positions, counts and the final roof-piece length.
 * Changes here stale roof contacts and neutral model-board observations.
 */
import type { IAutoMovieModel } from "@automovie/interface";
import { ObjectMesh } from "../geometry/object-mesh";
import {
  modelBox,
  modelExtrudeXY,
  modelExtrudeYZ,
  modelMesh,
  reviewedModel,
} from "../geometry/model-source-shapes";
import { templePlan as plan } from "../spaces/building";
import { templeRoofRules } from "../spaces/roofs/assembly";
import { colonnadeBeamTop } from "../geometry/model-roof-datums";

const p = (x: number, y: number, z: number) => ({ x, y, z });
const radians = (degrees: number) => degrees * Math.PI / 180;

/** Builds the five reviewed families without choosing building placement. */
export class TempleEntablature {
  /** Four edges share one section; east-end notches meet the 12° corner capitals. */
  colonnadeBeam(side: "north" | "south" | "east" | "west"): IAutoMovieModel {
    const across = plan.eastCourt - plan.westCourt;
    const depth = plan.courtFront - plan.courtBack;
    const alongEastWest = side === "north" || side === "south";
    const length = alongEastWest
      ? across + 2 * 0.175 + 0.34
      : depth + 2 * 0.175 - 0.26;
    const notch = side === "east"
      ? colonnadeBeamTop(templeRoofRules.leanSlope)
        - colonnadeBeamTop(templeRoofRules.eastGableSlope)
      : 0;
    const half=length/2, builder=new ObjectMesh();
    const section: Array<readonly [number,number]> = notch > 0
      ? [
          [-half, 0.28],
          [-half, notch],
          [-half+0.040, notch],
          [-half+0.040, 0],
          [half-0.040, 0],
          [half-0.040, notch],
          [half, notch],
          [half, 0.28],
        ]
      : [
          [-half, 0.28],
          [-half, 0],
          [half, 0],
          [half, 0.28],
        ];
    modelExtrudeXY(builder, "timber", section, -0.13, 0.13, {
      origin:p(-half, 0, 0),
      direction:p(1, 0, 0),
    });
    return reviewedModel(`beam.colonnade.${side}`, `주랑 ${side} 보`, [
      ["timber", modelMesh(builder, "timber")],
    ]);
  }

  /** A plumb-cut rafter; colonnade lengths come from the selected roof piece. */
  rafter(slopeDegrees: 12 | 19 | 22, horizontalLength: number,
    variantId: string): IAutoMovieModel {
    if (!(horizontalLength > 0)) throw new Error(
      "rafter: reviewed roof span required",
    );
    if (!variantId) throw new Error("rafter: stable variant id required");
    const angle=radians(slopeDegrees), run=horizontalLength/Math.cos(angle);
    const shear=0.12*Math.tan(angle), builder=new ObjectMesh();
    modelExtrudeYZ(
      builder,
      "timber",
      [
        [0, 0],
        [0.12, shear],
        [0.12, run+shear],
        [0, run],
      ],
      -0.04,
      0.04,
      { origin:p(0, 0, 0), direction:p(0, 0, 1) },
    );
    return reviewedModel(`rafter.${variantId}`, `서까래 ${slopeDegrees}°`, [
      ["timber", modelMesh(builder, "timber")],
    ]);
  }

  /** Wall thickness is absent: two independently closed sanctuary spans. */
  sanctuaryRafters(): readonly IAutoMovieModel[] {
    const inner = plan.eastRing;
    // Match the roof-support setback inside the wall-based eave: the cut at
    // support + overhang stays inside the roof edge at wall + overhang.
    const support = (plan.eastRoom + plan.eastRing) / 2;
    const rafterTail = support + templeRoofRules.overhang - plan.eastRoom;
    return [
      this.rafter(22, rafterTail, "sanctuary-tail"),
      this.rafter(22, inner, "sanctuary-interior"),
    ];
  }

  /** The stone beam, projecting cornice and two mitred raking trim solids. */
  porch(): IAutoMovieModel {
    const b=new ObjectMesh(),c=new ObjectMesh(),r=new ObjectMesh();
    modelBox(b,"beam",p(-1.65,0,-0.30),p(1.65,0.30,0));
    modelBox(c,"cornice",p(-1.65,0.30,0),p(1.65,0.40,0.08));
    const top=(x:number)=>4.00+1.65*Math.tan(radians(22))
      -0.18/Math.cos(radians(22))-Math.abs(x)*Math.tan(radians(22))-3.20;
    for(const [a,d] of [
      [-1.65, 0],
      [0, 1.65],
    ] as const){
      const section: Array<readonly [number,number]> = [
        [a, top(a)-0.12],
        [d, top(d)-0.12],
        [d, top(d)],
        [a, top(a)],
      ];
      // Both halves share the ridge end plane, without crossing one another.
      modelExtrudeXY(r,"raking-trim",section,0,0.08);
    }
    return reviewedModel("entablature.porch", "포치 보와 트림", [
      ["beam", modelMesh(b, "beam")],
      ["cornice", modelMesh(c, "cornice")],
      ["raking-trim", modelMesh(r, "raking-trim")],
    ]);
  }

  /** Four named part families retain the roof and wall contact planes. */
  sanctuaryTruss(): IAutoMovieModel {
    const angle=templeRoofRules.gableSlope;
    const support=(plan.eastRoom+plan.eastRing)/2;
    const tieBottom=4.86,tieDepth=0.28,tieTop=tieBottom+tieDepth;
    const principalDepth=0.20,outerHalf=plan.eastRing;
    const top=(x:number)=>templeRoofRules.sanctuarySupport
      +(support-Math.abs(x))*Math.tan(angle)
      -templeRoofRules.normalThickness/Math.cos(angle);
    const bottom=(x:number)=>Math.max(
      top(x)-principalDepth/Math.cos(angle),
      tieTop,
    );
    const kink=support-(tieTop-templeRoofRules.sanctuarySupport
      +(templeRoofRules.normalThickness+principalDepth)/Math.cos(angle))
      /Math.tan(angle);
    const t=new ObjectMesh(),pr=new ObjectMesh(),k=new ObjectMesh(),st=new ObjectMesh();
    modelBox(
      t,
      "tie-beam",
      p(-outerHalf, 0, -0.11),
      p(outerHalf, tieDepth, 0.11),
      {
        origin:p(-outerHalf, 0, 0),
        direction:p(1, 0, 0),
      },
    );
    for(const sign of [-1,1]){
      const outer=sign*outerHalf, inner=0;
      const s: Array<readonly [number,number]> = sign>0
        ? [
            [inner, bottom(inner)-tieBottom],
            [kink, tieTop-tieBottom],
            [outer, bottom(outer)-tieBottom],
            [outer, top(outer)-tieBottom],
            [inner, top(inner)-tieBottom],
          ]
        : [
            [outer, bottom(outer)-tieBottom],
            [-kink, tieTop-tieBottom],
            [inner, bottom(inner)-tieBottom],
            [inner, top(inner)-tieBottom],
            [outer, top(outer)-tieBottom],
          ];
      modelExtrudeXY(pr, "principal", s, -0.09, 0.09, {
        origin:p(outer, bottom(outer)-tieBottom, 0),
        direction:p(-sign, Math.tan(angle), 0),
      });
    }
    modelExtrudeXY(
      k,
      "king-post",
      [
        [-0.09, tieDepth],
        [0.09, tieDepth],
        [0.09, bottom(0.09)-tieBottom],
        [0, bottom(0)-tieBottom],
        [-0.09, bottom(0.09)-tieBottom],
      ],
      -0.09,
      0.09,
      { origin:p(0, tieDepth, 0), direction:p(0, 1, 0) },
    );
    for(const sign of [-1,1]){
      const foot=p(sign*0.09,5.69-tieBottom,0);
      const head=p(sign*outerHalf/2,bottom(outerHalf/2)-tieBottom,0);
      const dx=head.x-foot.x,dy=head.y-foot.y, L=Math.hypot(dx,dy);
      const normal=p(-dy/L*0.07,dx/L*0.07,0);
      const ends=[
        p(foot.x+normal.x, foot.y+normal.y, 0),
        p(head.x+normal.x, head.y+normal.y, 0),
        p(head.x-normal.x, head.y-normal.y, 0),
        p(foot.x-normal.x, foot.y-normal.y, 0),
      ];
      // The section follows the two reviewed end contacts. A vertical king
      // side and the principal underside trim the parallel beam boundaries.
      const atFoot=ends.map((q,i)=>
        i===0||i===3 ? p(foot.x, q.y+(foot.x-q.x)*dy/dx, 0) : q,
      );
      const roofSlope=-sign*Math.tan(angle);
      const atHead=atFoot.map((q,i)=>
        i===1||i===2
          ? p(
              q.x+(bottom(Math.abs(q.x))-tieBottom-q.y)/(dy/dx-roofSlope),
              q.y+(bottom(Math.abs(q.x))-tieBottom-q.y)/(dy/dx-roofSlope)*dy/dx,
              0,
            )
          : q,
      );
      const polygon=[atHead[0]!,atHead[1]!,atHead[2]!,atHead[3]!];
      const area=polygon.reduce((sum,q,i)=>{
        const next=polygon[(i+1)%polygon.length]!;
        return sum+q.x*next.y-next.x*q.y;
      }, 0);
      if(area<0)polygon.reverse();
      modelExtrudeXY(
        st,
        "strut",
        polygon.map((q)=>[q.x,q.y] as const),
        -0.07,
        0.07,
        { origin:foot, direction:p(dx, dy, 0) },
      );
    }
    return reviewedModel("truss.sanctuary", "제실 트러스", [
      ["tie-beam", modelMesh(t, "tie-beam")],
      ["principal", modelMesh(pr, "principal")],
      ["king-post", modelMesh(k, "king-post")],
      ["strut", modelMesh(st, "strut")],
    ]);
  }

  /** The four rooms share one 4.00 m joist; repetition belongs to instances. */
  ceilingJoist(): IAutoMovieModel {
    const b=new ObjectMesh();
    modelBox(b, "timber", p(-2, 0, -0.06), p(2, 0.18, 0.06), {
      origin:p(-2, 0, 0),
      direction:p(1, 0, 0),
    });
    return reviewedModel("joist.room", "방 천장 보", [
      ["timber", modelMesh(b, "timber")],
    ]);
  }
}
