import type { HumanCurve } from "../internal/HumanCurve";
import type { HumanSkeleton } from "../internal/HumanSkeleton";
import type { HumanSurface } from "../internal/HumanSurface";
import type { IAutoMovieHumanEar } from "../structures/head/IAutoMovieHumanEar";
import type { IAutoMovieHumanHeadIdentity } from "../structures/head/IAutoMovieHumanHeadIdentity";
import { HumanEarGraph } from "./HumanEarGraph";
import { HumanHeadFrame } from "./HumanHeadFrame";

/** Common auricular graph with independent metric axes and unresolved skin. */
export namespace HumanEarFeatures {
  /** One signed auricle retains one graph, including every named composition. */
  export interface Ear {
    /** Independent typed side; clinical correspondence remains unqualified. */
    side: "left" | "right";
    /** Shared geometric ear-heel proxy in world mm. */
    heelMm: HumanCurve.Vector;
    /** Existing helix consumers receive the actual graph path objects. */
    curves: { outerHelix: HumanSurface.Boundary; innerHelix: HumanSurface.Boundary };
    /** Single node, tangent, subpath and named-composition authority. */
    graph: HumanEarGraph.Result;
    /** Finite 257-point outer-feature envelope defining the generated metric proxy. */
    envelopeMm: { length: number; breadth: number; protrusion: number };
  }

  /** Feature graph support does not certify the missing ear surface charts. */
  export interface Result {
    /** Independently parameterized signed ear graph authorities. */
    ears: Ear[];
    /** Missing skin domains and source correspondence qualifications. */
    limitations: string[];
  }

  /** Generate complete observed ear graphs from the common joint identification.
   * Every helix, concha, central, heel, tragus and antitragus feature consumes the
   * same maximal subpaths, shared node positions and physical node derivatives.
   * Independent ear metrics scale the graph under source envelope proxies.
   * Both graphs and the temporary envelope belong to this call, with bounded
   * constant work and storage and no retained source, mesh or process resources.
   * A supplied shared head frame retains the assembly's actual datum object;
   * omission preserves standalone construction through the same frame law.
   */
  export function build(parameters: IAutoMovieHumanHeadIdentity, skeleton: HumanSkeleton.Result, suppliedFrame?: HumanHeadFrame.Result): Result {
    const frame: HumanHeadFrame.Result = suppliedFrame ?? HumanHeadFrame.build(parameters, skeleton);
    const ears: Ear[] = [];
    const extrema: ReturnType<typeof HumanEarGraph.outerEnvelope> = HumanEarGraph.outerEnvelope();
    for (const side of ["left", "right"] as const) {
      const metrics: IAutoMovieHumanEar = parameters.earPair[side];
      if (!(metrics.length > 0 && metrics.breadth > 0 && metrics.protrusion >= 0 && Number.isFinite(metrics.length + metrics.breadth + metrics.protrusion)))
        throw new Error("Independent ear envelopes require positive length/breadth and finite nonnegative protrusion");
      const sign: number = side === "left" ? -1 : 1;
      const heel: HumanCurve.Vector = [
        frame.supportMm[0] + 0.0697939971385735 * frame.lengthMm,
        frame.chinY + 0.7289634384585896 * frame.eyeHeightMm,
        frame.supportMm[2] + sign * 0.5163249365425622 * frame.breadthMm,
      ];
      const scales: HumanCurve.Vector = [
        metrics.breadth / (extrema.high[0] - extrema.low[0]),
        metrics.length / (extrema.high[1] - extrema.low[1]),
        sign * metrics.protrusion / extrema.absoluteZ,
      ];
      const graph: HumanEarGraph.Result = HumanEarGraph.build(side, heel, scales, metrics.length);
      ears.push({ side, heelMm: heel, graph,
        curves: { outerHelix: graph.paths[1]!, innerHelix: graph.paths[0]! },
        envelopeMm: { length: metrics.length, breadth: metrics.breadth, protrusion: metrics.protrusion } });
    }
    return { ears, limitations: [
      ...ears[0]!.graph.limitations,
      "Metric scales use a finite 257-point outer-feature forward/up/lateral envelope; generated proxies are not continuous-extremum or Frankfort-plane clinical certificates",
      "The ear-heel frame is a pooled geometric rule; independent source response, individual asymmetry and unseen morphology prediction remain unqualified",
      "Outer and inner helices have different endpoint and extremum courses; equal normalized phases do not establish transverse skin correspondence",
      "No closed skin, lobe cap, conchal sheet, source attachment domain or scalp join is inferred from this sparse named graph",
    ] };
  }
}
