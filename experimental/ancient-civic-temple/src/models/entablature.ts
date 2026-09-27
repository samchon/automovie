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
import { templeSanctuarySupportHigh } from "../spaces/roofs/sanctuary";
import { colonnadeBeamTop } from "../geometry/model-roof-datums";

const p = (x: number, y: number, z: number) => ({ x, y, z });
const radians = (degrees: number) => degrees * Math.PI / 180;

/**
 * Builds the five reviewed timber and porch-stone families without choosing placement.
 * @evidence models/entablature.md This class groups the beam, rafter, porch trim, sanctuary truss and room joist builders under their reviewed local frames.
 * @evidenceReview models/entablature.md #c85b3ff Matched the five H2s to the five construction entry points, including the separately returned sanctuary rafters and fixed room joist.
 * @evidence principles/core/source-units.md#source-scope-preservation Its public methods emit only entablature.md members; roof piece selection, repetition and world transforms remain with instances.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The class returns local timber and stone assemblies; no method takes an instance transform, repeat count or roof-piece selection.
 * @evidence principles/core/source-units.md#source-substantive-completion Each family has a callable mesh builder with the H2's named parts and a stable model ID, including distinct sanctuary tail and interior spans.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f The five callable paths reach reviewedModel outputs, with sanctuaryRafters yielding two separately identified closed spans.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The five H2s give the sections, contact faces and part splits consumed here; the corrected rafter cut uses the reviewed wall, support and eave datums without reopening those parents.
 * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c Checked the five source sections against their H2 dimensions and the revised eave datum; no remaining source-only section or contact choice was found.
 * @evidence obligations/design/model-sources.md#design-owned-construction ObjectMesh boxes and polygon extrusions emit the H2 part surfaces without choosing materials or inventing instance spacing.
 * @evidenceReview obligations/design/model-sources.md#design-owned-construction #535df68 modelBox and modelExtrudeXY/YZ compute mesh attributes for named H2 parts, while returned models leave materials empty and omit instance spacing.
 */
export class TempleEntablature {
  /**
   * Four edges share one section; east-end notches meet the 12° corner capitals.
   * @evidence models/entablature.md#colonnade-beam The court-edge differences produce the two lengths, while roof-rule beam tops cut the east beam's two 0.040 m lower notches above 12° corner capitals.
   * @evidenceReview models/entablature.md#colonnade-beam #22b85b7 The court dimensions select north/south or east/west length, and only east's section array inserts 0.040 end rebates for the cap-height difference.
   * @evidence principles/core/source-units.md#source-scope-preservation The four side names select only the H2's beam variants; the timber extrusion owns the 0.26 by 0.28 m section and keeps the east notch out of other sides.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The side union admits the four reviewed edges; the branch changes local section but does not assign an edge to a world roof.
   * @evidence principles/core/source-units.md#source-substantive-completion A side call returns a complete indexed timber mesh, including the concave east end section and longitudinal UV direction.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f modelExtrudeXY closes the chosen section across Z=−0.13..0.13 and projects U from the negative X end into one returned timber part.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The colonnade-beam H2 supplies both court-axis lengths and the difference between 12° and 19° support heights; the east polygon implements that notch without selecting another corner bearing.
   * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c The H2's east support mismatch is exactly the difference of the two colonnadeBeamTop calls; the polygon adds no unreviewed bearing level.
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
   * @evidenceReview models/entablature.md#rafter #16cdc7d The four YZ vertices carry the H2's plumb cut: the upper pair shifts by 0.12tan(angle) before the section is extruded 0.08 across X.
   * @evidence principles/core/source-units.md#source-scope-preservation Only a positive horizontalLength and named variant yield a timber mesh; this method does not choose roof-piece repetition or a wall placement.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The two guards reject an absent run or variant ID; rafter() emits only one local timber shape and no roof placement.
   * @evidence principles/core/source-units.md#source-substantive-completion Its two input guards refuse absent lengths and IDs, and the four-point extrusion returns the full plumb-cut positions, faces and UVs.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f A valid input passes through modelExtrudeYZ to a closed indexed timber mesh with UV direction along its uphill Z run.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The rafter H2 fixes section, local origin, uphill axis, plumb cut and slope family; the extrusion tests those decisions without requiring a new end shape.
   * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c The H2 already defines the 0.12 depth and shear equation used by the four vertices, so the builder did not invent an eave cut.
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
   * @evidenceReview models/entablature.md#rafter #16cdc7d sanctuaryRafters derives its tail from templeSanctuarySupportHigh and overhang, then returns a separate inner rafter ending at plan.eastRing.
   * @evidence principles/core/source-units.md#source-scope-preservation It supplies only the H2's sanctuary tail and interior variant IDs to rafter, leaving the 0.30 m wall volume without an emitted timber span.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The two rafter() calls carry different stable IDs and spans, with no third member bridging the intervening wall.
   * @evidence principles/core/source-units.md#source-substantive-completion Both returned prototypes have their own deterministic span, section, closed end faces and stable ID rather than one beam through the wall.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f The array contains two complete rafter() results; each path closes its four-point YZ section and preserves its own variantId.
   * @evidence upstream/design/model-sources.md#design-revision-from-model-source-work Authoring this sanctuary rafter exposed that the former rafter H2 measured its tail from the support instead of the reviewed 6.25 m eave; the repaired H2 now locates the cut 0.15 m inside that eave, and this builder derives it from the space-owned support, plan wall face and roof rules.
   * @evidenceReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c The corrected H2 now places the outer cut relative to the eave; rafterTail uses the support, overhang and room line after that upstream revision.
   * @evidence obligations/design/model-sources.md#deterministic-build The tail length consumes the space-owned support, plan wall face and shared roof overhang; neither output uses a camera, clock or random input.
   * @evidenceReview obligations/design/model-sources.md#deterministic-build #27790fe The fixed plan and roof constants determine both rafter() inputs, so successive sanctuaryRafters calls return the same two identities and spans.
   */
  sanctuaryRafters(): readonly IAutoMovieModel[] {
    const inner = plan.eastRing;
    // Match the roof-support setback inside the wall-based eave: the cut at
    // support + overhang stays inside the roof edge at wall + overhang.
    const rafterTail = templeSanctuarySupportHigh + templeRoofRules.overhang - plan.eastRoom;
    return [
      this.rafter(22, rafterTail, "sanctuary-tail"),
      this.rafter(22, inner, "sanctuary-interior"),
    ];
  }

  /**
   * The stone beam, projecting cornice and two mitred raking trim solids.
   * @evidence models/entablature.md#porch-entablature The beam occupies X ±1.65 m, the cornice reaches Z +0.08 m, and two roof-slope sections meet at X=0 in the raking-trim part.
   * @evidenceReview models/entablature.md#porch-entablature #420427d The beam and cornice boxes span ±1.65, while the two raking-trim sections meet at X=0 without crossing the ridge plane.
   * @evidence principles/core/source-units.md#source-scope-preservation Its three parts reproduce the H2 porch assembly in the beam's front-edge frame; no column or pediment wall is emitted here.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 porch() returns beam, cornice and raking-trim only; its ObjectMesh builders include neither support columns nor a triangular infill wall.
   * @evidence principles/core/source-units.md#source-substantive-completion Box and paired XY extrusions return beam, cornice and raking-trim meshes with no missing ridge half.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f The signed [-1.65,0] and [0,1.65] ranges both feed modelExtrudeXY, and all three part meshes enter reviewedModel.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The porch-entablature H2 specifies the 3.30 m span, 0.30 m beam depth, 0.08 m projections and 22° roof underside equation used by this builder.
   * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c The porch H2 gives the 22-degree trim equation and projection dimensions directly consumed by top(x) and modelBox; no extra cornice profile was chosen.
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
   * @evidenceReview models/entablature.md#sanctuary-truss #e54cd6e The tie box reaches plan.eastRing on both sides, and bottom(x) clips each principal to tieTop before the post and struts meet its underside.
   * @evidence principles/core/source-units.md#source-scope-preservation Roof support, slope and thickness come from the space-owned support and shared rules; the emitted tie-beam, principal, king-post and strut are exactly the H2's four parts.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 sanctuaryTruss reads shared support and gable slope and returns exactly the four H2 part keys, with no roof placement or surface finish.
   * @evidence principles/core/source-units.md#source-substantive-completion Explicit clipped polygons and boxes produce all four meshes, including V-cut king-post head and strut-end contacts.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f The principal polygons include their clipping kink, the king-post polygon has a V head, and each strut polygon is trimmed to the roof underside.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The sanctuary-truss H2 fixes its underside equation, flat tie clipping, V head and two strut endpoints; emitting those cuts required no extra joint decision.
   * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c The H2's underside and strut endpoints match bottom(x), foot and head; polygon clipping uses those inputs without selecting another joint.
   */
  sanctuaryTruss(): IAutoMovieModel {
    const angle=templeRoofRules.gableSlope;
    const support=templeSanctuarySupportHigh;
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
   * The four rooms share one joist span; repetition belongs to instances.
   * @evidence models/entablature.md#ceiling-joist The timber box takes its X span from the east inner and room plan lines (−2 to +2 m) and rises 0.18 m with a 0.12 m Z width.
   * @evidenceReview models/entablature.md#ceiling-joist #ce3975e halfSpan derives from the two plan lines and the box runs from −halfSpan to +halfSpan with the H2's 0.18 height and 0.12 depth.
   * @evidence principles/core/source-units.md#source-scope-preservation This method emits one room-joist prototype; room counts and the H2's suggested 0.60 m spacing are deferred to instances.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 ceilingJoist takes no room or count input and returns a single local timber, leaving spacing to the instance layer.
   * @evidence principles/core/source-units.md#source-substantive-completion The single timber mesh has both end planes and the upper boarding-contact plane, with a stable joist.room ID.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f modelBox closes the joist's two X ends and upper Y=0.18 face before reviewedModel assigns joist.room its one mesh.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The ceiling-joist H2 provides the 4.00 by 0.18 by 0.12 m bounds and local origin, so a box completes the reviewed fixed proxy.
   * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c The H2's 4.00 by 0.18 by 0.12 proxy and local origin fully determine this box; construction raised no new ceiling-joist section.
   */
  ceilingJoist(): IAutoMovieModel {
    const b=new ObjectMesh();
    const halfSpan=(plan.eastInner-plan.eastRoom)/2;
    modelBox(b, "timber", p(-halfSpan, 0, -0.06), p(halfSpan, 0.18, 0.06), {
      origin:p(-halfSpan, 0, 0),
      direction:p(1, 0, 0),
    });
    return reviewedModel("joist.room", "방 천장 보", [
      ["timber", modelMesh(b, "timber")],
    ]);
  }
}
