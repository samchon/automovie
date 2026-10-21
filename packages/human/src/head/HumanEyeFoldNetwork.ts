import type { HumanCurve } from "../internal/HumanCurve";
import type { HumanSurface } from "../internal/HumanSurface";
import type { HumanEyelidAnnulus } from "./HumanEyelidAnnulus";
import type { HumanLowerEyeSurface } from "./HumanLowerEyeSurface";
import type { HumanUpperFaceSurface } from "./HumanUpperFaceSurface";

/** Diagnostic three-layer hypothesis; this assembles existing formulas without changing skin. */
export namespace HumanEyeFoldNetwork {
  type Vector = HumanCurve.Vector;
  type Jet = ReturnType<HumanSurface.Patch["jet"]>;
  type Side = "left" | "right";
  type LayerIndex = 0 | 1 | 2;

  /** Named path roles describe native incidence rather than a visible crease seam. */
  export interface Network {
    /** Existing geometric side, independent of camera. */
    side: Side;
    /** Existing annulus outer, shared crease, shared fold and upper brow objects. */
    edges: readonly [HumanSurface.Boundary, HumanSurface.Boundary,
      HumanSurface.Boundary, HumanSurface.Boundary];
    /** Actual outer-to-crease, crease-to-fold and fold-to-brow charts, in that order. */
    layers: readonly [HumanSurface.Patch, HumanSurface.Patch, HumanSurface.Patch];
    /** Exact generating jet: mm, mm per canthal fraction, mm per interval phase. */
    jet: (layer: LayerIndex, u: number, v: number) => Jet;
    /** Inspect both one-sided crease jets without averaging or assigning visibility. */
    crease: (u: number) => {
      /** Outer-to-crease chart's actual one-sided physical jet. */
      incoming: Jet;
      /** Crease-to-fold chart's actual one-sided physical jet. */
      outgoing: Jet;
    };
    /** Exact pair residual for contact refinement; no intersection is welded or removed. */
    contact: (u: number, first: LayerIndex, firstV: number,
      second: LayerIndex, secondV: number) => {
      /** First chart position minus second chart position, world mm. */
      displacementMm: Vector;
      /** Actual first chart jet at its explicitly supplied address. */
      first: Jet;
      /** Actual second chart jet at its explicitly supplied address. */
      second: Jet;
    };
  }

  /** Whole contact graph, with only previously absent lower patches offered for diagnostic output. */
  export interface Result {
    /** Bilateral three-layer authorities; hood patches are referenced, never regenerated. */
    networks: Network[];
    /** Existing lower hypothesis only; the caller already consumes the upper hood. */
    additionalDiagnosticPatches: readonly HumanSurface.Patch[];
    /** The graph adds neither a normal model nor an anatomical-contact certification. */
    limitations: string[];
  }

  /**
   * Assemble one coupled incidence graph from existing boundary and surface owners.
   * Native lower sheets cross each other in 18/24 observed canthal planes, while
   * their fold-to-brow hood crosses neither in that population. Hidden pocket
   * one-sided crease angles and visible-envelope conditions are separate metrics.
   * This structural hypothesis retains all layers and all exact jets. It does not
   * infer visibility from a feature name, change coefficients, mask hidden tissue,
   * or assert that the old lower shape law satisfies a joint contact constraint.
   * Source original Hermite degree/h and native branch evidence remain external.
   */
  export function build(annuli: HumanEyelidAnnulus.Result,
    lower: HumanLowerEyeSurface.Result, upper: HumanUpperFaceSurface.Result): Result {
    const networks: Network[] = [];
    for (const side of ["left", "right"] as const) {
      const outer: HumanEyelidAnnulus.OuterPort | undefined = annuli.outerPorts.find(
        (value: HumanEyelidAnnulus.OuterPort): boolean => value.side === side);
      const fold: HumanUpperFaceSurface.FoldPort | undefined = upper.foldPorts.find(
        (value: HumanUpperFaceSurface.FoldPort): boolean => value.side === side);
      if (outer === undefined || fold === undefined)
        throw new Error("The eye-fold network requires existing annulus and fold owners");
      const first: HumanSurface.Patch = required(lower.patches,
        "head.lower-eye." + side + ".outer-to-crease.central");
      const second: HumanSurface.Patch = required(lower.patches,
        "head.lower-eye." + side + ".crease-to-fold.central");
      const hood: HumanSurface.Patch = required(upper.patches,
        "head.upperface." + side + ".fold-to-brow.central");
      if (first.boundaries.v0.curve !== outer.boundary ||
        first.boundaries.v1.curve !== fold.crease ||
        second.boundaries.v0.curve !== fold.crease ||
        second.boundaries.v1.curve !== fold.boundary ||
        hood.boundaries.v0.curve !== fold.boundary)
        throw new Error("The eye-fold graph must consume the same actual boundary objects");
      const layers: readonly [HumanSurface.Patch, HumanSurface.Patch, HumanSurface.Patch] =
        [first, second, hood];
      for (const layer of layers) {
        if (layer.u.start !== 0.25 || layer.u.end !== 0.75 ||
          layer.u.unit !== "canthal-chord-fraction" || layer.v.start !== 0 ||
          layer.v.end !== 1 || layer.v.unit !== "normalized-source-crosscourse-phase" ||
          layer.boundaries.v0.orientation !== 1 || layer.boundaries.v1.orientation !== 1)
          throw new Error("The eye-fold graph requires the original ordered central chart gauges");
      }
      const jet: Network["jet"] = (layer: LayerIndex, u: number, v: number): Jet =>
        layers[layer].jet(u, v);
      networks.push({ side, layers,
        edges: [outer.boundary, fold.crease, fold.boundary, hood.boundaries.v1.curve], jet,
        crease: (u: number): { incoming: Jet; outgoing: Jet } =>
          ({ incoming: jet(0, u, 1), outgoing: jet(1, u, 0) }),
        contact: (u: number, a: LayerIndex, av: number, b: LayerIndex, bv: number):
          { displacementMm: Vector; first: Jet; second: Jet } => {
          const firstJet: Jet = jet(a, u, av), secondJet: Jet = jet(b, u, bv);
          return { first: firstJet, second: secondJet, displacementMm:
            firstJet.positionMm.map((value: number, axis: number): number =>
              value - secondJet.positionMm[axis]!) as Vector };
        } });
    }
    return { networks, additionalDiagnosticPatches: lower.patches, limitations: [
      "This pending graph introduces no new common shape law; the fixed lower hypothesis remains unadopted, with known major-crease angular and nineteen internal-corner omissions",
      "Native lower-sheet immersions, Recovery contacts, actual hypothesis contacts and visible outer envelope must be compared separately; finite reference camera occlusion is not a runtime trimming mask",
      "The hood must retain its actual current analytic formula and boundary objects; an annulus/crease/fold shift or new coefficient fit requires whole-network reinspection",
      "Canthi, lower eyelids, side closure, clinical contact/material response, independent fold/roll controls and unseen morphology remain unsupported",
    ] };
  }

  /** Require the caller's actual chart instead of rebuilding a duplicate authority. */
  function required(patches: readonly HumanSurface.Patch[], id: string): HumanSurface.Patch {
    const result: HumanSurface.Patch | undefined = patches.find(
      (value: HumanSurface.Patch): boolean => value.id === id);
    if (result === undefined) throw new Error("Missing actual eye-fold chart " + id);
    return result;
  }
}
