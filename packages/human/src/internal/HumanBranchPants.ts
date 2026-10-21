import type { HumanCurve } from "./HumanCurve";
import { HumanHermitePatch } from "./HumanHermitePatch";
import type { HumanSurface } from "./HumanSurface";

/** One owner assembles a recovered three-cycle, three-seam domain into four quads.
 * This combinatorial plan supplies no geometry. Every curve, cross field,
 * diagonal, chart transition and interior coefficient must be identified first.
 */
export namespace HumanBranchPants {
  /** Two source-corresponding arcs close each of the three actual ports. */
  export type EdgeName = "aFront" | "aBack" | "bFront" | "bBack" | "cFront" | "cBack" | "ab" | "ac" | "bc" | "frontDiagonal" | "backDiagonal";

  /** One shared curve and one physical transverse field, never per-face copies. */
  export interface Ribbon {
    /** Actual boundary with its complete declared physical parameter interval. */
    curve: HumanSurface.Boundary;
    /** Exact second derivative in the curve's original parameter. */
    secondDerivative: (parameter: number) => HumanCurve.Vector;
    /** Common transverse field in world mm per identified transverse chart unit. */
    cross: (parameter: number) => HumanCurve.Vector;
    /** Exact derivative of cross in the original physical edge parameter. */
    crossDerivative: (parameter: number) => HumanCurve.Vector;
  }

  /** Exact scalar and derivative in the same original edge parameter. */
  export interface ScalarJet {
    /** Identified chart scale or tangential shear. */
    value: number;
    /** Physical edge derivative; no numerical differentiation is performed. */
    derivative: number;
  }

  /** Pull one physical ribbon into a particular quad's canonical coordinates. */
  export interface Transition {
    /** Declared nonzero sign of the transverse scale on the complete edge. */
    scaleSign: 1 | -1;
    /** Exact scale and tangential shear, both in the original edge parameter. */
    jet: (parameter: number) => { scale: ScalarJet; shear: ScalarJet };
  }

  /** A source-fitted face keeps its four chart changes and interior shape. */
  export interface Face {
    /** World outward orientation relative to increasing normalized U/V. */
    outwardSign: 1 | -1;
    /** Identified physical changes of coordinates at the four incident edges. */
    transitions: Record<"u0" | "u1" | "v0" | "v1", Transition>;
    /** Coefficients of the boundary-value/first-jet-vanishing interior basis. */
    interior: readonly (readonly HumanCurve.Vector[])[];
  }

  /** Complete generating authority, independently of any anatomical acceptance. */
  export interface Result {
    /** Four patches consume the same eleven boundary objects and cross fields. */
    patches: HumanHermitePatch.Patch[];
    /** Original objects, including both physical halves of each closed port. */
    boundaries: readonly HumanSurface.Boundary[];
    /** Exact combinatorial ownership; embedding and source fidelity are separate. */
    topology: { vertices: 6; edges: 11; faces: 4; euler: -1; boundaryCycles: 3 };
    /** Mathematical admission limits that assembly cannot establish by itself. */
    limitations: readonly string[];
  }

  /**
   * Cut a qualified pants domain along AB, AC and BC into two hexagons. Each
   * identified diagonal splits one hexagon into two quads. No arbitrary midpoint
   * or coordinate is introduced. Shared ribbon transitions have the form
   * W_face=scale*W+shear*B'. Thus both incident normal directions are algebraically
   * parallel, provided scale is nonzero and W/B' are independent. Their declared
   * signs must agree after orientation; evaluated scales and finite jets are
   * checked without altering them. Complete-domain regularity belongs to the
   * identifying owner. The existing Hermite patch owner checks all corner values,
   * first jets and twists jointly and preserves full boundary functions.
   */
  export function build(id: string, ribbons: Record<EdgeName,Ribbon>, faces: readonly [Face,Face,Face,Face]): Result {
    if (!id || faces.length !== 4) throw new Error("A branch assembly requires one identified four-face domain");
    const unique: Set<HumanSurface.Boundary> = new Set(Object.values(ribbons).map((ribbon: Ribbon): HumanSurface.Boundary => ribbon.curve));
    if (unique.size !== 11 || new Set([...unique].map((curve: HumanSurface.Boundary): string => curve.id)).size !== 11)
      throw new Error("Every branch edge requires one distinct shared curve authority");
    const uses: Map<EdgeName,Array<{ face:number; side:Side; direction:1|-1 }>> = new Map();
    const sides: Array<Record<Side,HumanHermitePatch.Side>> = cycles.map((cycle: readonly Use[], face: number): Record<Side,HumanHermitePatch.Side> => {
      const ordered: Array<[Side,Use]> = [["v0",cycle[0]!],["u1",cycle[1]!],["v1",reverse(cycle[2]!)],["u0",reverse(cycle[3]!)]];
      const result: Record<Side,HumanHermitePatch.Side> = {} as Record<Side,HumanHermitePatch.Side>;
      for (const [side,use] of ordered) {
        const ribbon: Ribbon = ribbons[use[0]], transition: Transition = faces[face]!.transitions[side];
        if (transition.scaleSign !== 1 && transition.scaleSign !== -1) throw new Error("A branch chart has no nonzero transverse scale sign");
        const occurrences: Array<{face:number;side:Side;direction:1|-1}> = uses.get(use[0]) ?? [];
        occurrences.push({face,side,direction:use[1]}); uses.set(use[0],occurrences);
        result[side] = { edge:{curve:ribbon.curve,orientation:use[1]},
          cross:(parameter:number):HumanCurve.Vector => pull(ribbon,transition,parameter).value,
          crossDerivative:(parameter:number):HumanCurve.Vector => pull(ribbon,transition,parameter).derivative };
      }
      return result;
    });
    for (const [name,occurrences] of uses) {
      const internal: boolean = name === "ab" || name === "ac" || name === "bc" || name === "frontDiagonal" || name === "backDiagonal";
      if (occurrences.length !== (internal ? 2 : 1)) throw new Error("The identified branch lost its three boundary cycles");
      if (internal) {
        const signs: number[] = occurrences.map((use: typeof occurrences[number]): number => faces[use.face]!.outwardSign * use.direction * faces[use.face]!.transitions[use.side].scaleSign * (use.side[0] === "u" ? -1 : 1));
        if (signs[0] !== signs[1]) throw new Error("Incident branch chart changes disagree on the common outward normal: " + name);
      }
    }
    const patches: HumanHermitePatch.Patch[] = faces.map((face: Face,index: number): HumanHermitePatch.Patch => HumanHermitePatch.build(id+".quad."+index,sides[index]!,face.outwardSign,face.interior));
    return { patches,boundaries:[...unique],topology:{vertices:6,edges:11,faces:4,euler:-1,boundaryCycles:3},limitations:[
      "The three-cycle graph and corner constraints do not certify an embedded surface, source likeness, recovered material phase or an independently observed parameter response",
      "Shared transition algebra preserves geometric first-jet normal agreement under nonzero scale and regular ribbon premises; those whole-domain premises remain the identifying owner's responsibility",
      "Interior coefficients and both diagonal curves must come from the joint source problem; this assembler never fills missing shape or assigns synthetic source boundaries",
    ] };
  }

  type Side = "u0"|"u1"|"v0"|"v1";
  type Use = readonly [EdgeName,1|-1];
  // A0->A1->C0->C1->B0->B1 and its reverse-side counterpart are the
  // source three-seam cuts. Diagonals are supplied identified curves.
  const cycles: readonly (readonly Use[])[] = [
    [["aFront",1],["ac",1],["cFront",1],["frontDiagonal",-1]],
    [["frontDiagonal",1],["bc",-1],["bFront",1],["ab",-1]],
    [["aBack",1],["ab",1],["bBack",1],["backDiagonal",-1]],
    [["backDiagonal",1],["bc",1],["cBack",1],["ac",-1]],
  ];
  function reverse(use: Use): Use { return [use[0],use[1] === 1 ? -1 : 1]; }
  function pull(ribbon: Ribbon,transition: Transition,parameter:number): {value:HumanCurve.Vector;derivative:HumanCurve.Vector} {
    const change: ReturnType<Transition["jet"]> = transition.jet(parameter);
    if (![change.scale.value,change.scale.derivative,change.shear.value,change.shear.derivative].every(Number.isFinite) || !(change.scale.value*transition.scaleSign>0)) throw new Error("A branch chart transition is nonfinite or changed its declared nonzero sign");
    const w: HumanCurve.Vector = ribbon.cross(parameter), dw: HumanCurve.Vector = ribbon.crossDerivative(parameter), tangent: HumanCurve.Vector = ribbon.curve.derivative(parameter), curvature: HumanCurve.Vector = ribbon.secondDerivative(parameter);
    if (![w,dw,tangent,curvature].every((value:HumanCurve.Vector):boolean => value.length === 3 && value.every(Number.isFinite))) throw new Error("A branch ribbon returned an unsupported derivative");
    const value: HumanCurve.Vector = [0,0,0],derivative: HumanCurve.Vector = [0,0,0];
    for (let axis:number=0;axis<3;axis++) {
      value[axis]=change.scale.value*w[axis]!+change.shear.value*tangent[axis]!;
      derivative[axis]=change.scale.derivative*w[axis]!+change.scale.value*dw[axis]!+change.shear.derivative*tangent[axis]!+change.shear.value*curvature[axis]!;
    }
    return {value,derivative};
  }
}
