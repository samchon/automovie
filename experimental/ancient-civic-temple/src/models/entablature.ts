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

/**
 * Builds the five reviewed timber and porch-stone families without choosing placement.
 * @evidence models/entablature.md This class groups the beam, rafter, porch trim, sanctuary truss and room joist builders under their reviewed local frames.
 * @evidence principles/core/source-units.md#source-scope-preservation Its public methods emit only entablature.md members; roof piece selection, repetition and world transforms remain with instances.
 * @evidence principles/core/source-units.md#source-substantive-completion Each family has a callable mesh builder with the H2's named parts and a stable model ID, including distinct sanctuary tail and interior spans.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The five H2s give the sections, contact faces and part splits consumed here; the corrected rafter cut uses the reviewed wall, support and eave datums without reopening those parents.
 * @evidence obligations/design/model-sources.md#design-owned-construction ObjectMesh boxes and polygon extrusions emit the H2 part surfaces without choosing materials or inventing instance spacing.
 */
export class TempleEntablature {
  /**
   * Four edges share one section; east-end notches meet the 12° corner capitals.
   * @evidence models/entablature.md#colonnade-beam The court-edge differences produce the two lengths, while roof-rule beam tops cut the east beam's two 0.040 m lower notches above 12° corner capitals.
   * @evidence principles/core/source-units.md#source-scope-preservation The four side names select only the H2's beam variants; the timber extrusion owns the 0.26 by 0.28 m section and keeps the east notch out of other sides.
   * @evidence principles/core/source-units.md#source-substantive-completion A side call returns a complete indexed timber mesh, including the concave east end section and longitudinal UV direction.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The colonnade-beam H2 supplies both court-axis lengths and the difference between 12° and 19° support heights; the east polygon implements that notch without selecting another corner bearing.
   */
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

  /**
   * A plumb-cut rafter; colonnade lengths come from the selected roof piece.
   * @evidence models/entablature.md#rafter The 0.08 by 0.12 m YZ section extends its upper eave corner by 0.12tan(slope), with occupancy L/cos(slope)+that shear.
   * @evidence principles/core/source-units.md#source-scope-preservation Only a positive reviewed span and named variant yield a timber mesh; this method does not choose roof-piece repetition or a wall placement.
   * @evidence principles/core/source-units.md#source-substantive-completion Its two input guards refuse absent lengths and IDs, and the four-point extrusion returns the full plumb-cut positions, faces and UVs.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The rafter H2 fixes section, local origin, uphill axis, plumb cut and slope family; the extrusion tests those decisions without requiring a new end shape.
   */
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

  /**
   * Wall thickness is absent: two independently closed sanctuary spans.
   * @evidence models/entablature.md#rafter The support midpoint plus roof overhang sets the 6.10 m outer cut inside the 6.25 m roof edge, and the east-ring face starts the separate 5.60 m inner member.
   * @evidence principles/core/source-units.md#source-scope-preservation It supplies only the H2's sanctuary tail and interior variant IDs to rafter, leaving the 0.30 m wall volume without an emitted timber span.
   * @evidence principles/core/source-units.md#source-substantive-completion Both returned prototypes have their own deterministic span, section, closed end faces and stable ID rather than one beam through the wall.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The corrected rafter H2 places the cut 0.15 m inside the roof edge and names both wall faces; plan and roof rules yield those same two lengths without another parent repair.
   * @evidence obligations/design/model-sources.md#deterministic-build The tail length is computed once from plan support, wall face and the shared roof overhang; neither output uses a camera, clock or random input.
   */
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

  /**
   * The stone beam, projecting cornice and two mitred raking trim solids.
   * @evidence models/entablature.md#porch-entablature The beam occupies X ±1.65 m, the cornice reaches Z +0.08 m, and two roof-slope sections meet at X=0 in the raking-trim part.
   * @evidence principles/core/source-units.md#source-scope-preservation Its three parts reproduce the H2 porch assembly in the beam's front-edge frame; no column or pediment wall is emitted here.
   * @evidence principles/core/source-units.md#source-substantive-completion Box and paired XY extrusions return beam, cornice and raking-trim meshes with no missing ridge half.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The porch-entablature H2 specifies the 3.30 m span, 0.30 m beam depth, 0.08 m projections and 22° roof underside equation used by this builder.
   */
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

  /**
   * Four named part families retain the roof and wall contact planes.
   * @evidence models/entablature.md#sanctuary-truss The tie spans the ±5.60 m inner faces, each principal is clipped above the 5.14 m tie, and the king-post and two struts end on those principal undersides.
   * @evidence principles/core/source-units.md#source-scope-preservation Roof support, slope and thickness come from shared rules; the emitted tie-beam, principal, king-post and strut are exactly the H2's four parts.
   * @evidence principles/core/source-units.md#source-substantive-completion Explicit clipped polygons and boxes produce all four meshes, including V-cut king-post head and strut-end contacts.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The sanctuary-truss H2 fixes its underside equation, flat tie clipping, V head and two strut endpoints; emitting those cuts required no extra joint decision.
   */
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

  /**
   * The four rooms share one 4.00 m joist; repetition belongs to instances.
   * @evidence models/entablature.md#ceiling-joist The timber box spans X −2 to +2 m from the underside-center origin and rises 0.18 m with a 0.12 m Z width.
   * @evidence principles/core/source-units.md#source-scope-preservation This method emits one room-joist prototype; room counts and the H2's suggested 0.60 m spacing are deferred to instances.
   * @evidence principles/core/source-units.md#source-substantive-completion The single timber mesh has both end planes and the upper boarding-contact plane, with a stable joist.room ID.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The ceiling-joist H2 provides the 4.00 by 0.18 by 0.12 m bounds and local origin, so a box completes the reviewed fixed proxy.
   */
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
