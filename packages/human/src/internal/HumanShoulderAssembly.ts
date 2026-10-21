import type { IAutoMovieHumanBodyParameters } from "../structures/body/IAutoMovieHumanBodyParameters";
import { HumanShoulderSkinAdapter } from "../shoulder/HumanShoulderSkinAdapter";
import type { HumanSkeleton } from "./HumanSkeleton";
import type { HumanJointAssembly } from "./HumanJointAssembly";
import type { HumanSurface } from "./HumanSurface";

/** Main-owned assembly of common-q shoulder candidates and their actual neighbors. */
export namespace HumanShoulderAssembly {
  /** Isolated candidate charts, retaining every unjoined regional boundary. */
  export interface Result {
    /** Twelve analytic charts from two common three-boundary shoulder fields. */
    patches: HumanSurface.Patch[];
    /** The same boundary objects consumed by the analytic charts. */
    curves: HumanSurface.Boundary[];
    /** Full common-q graph and explicit transport/continuation qualifications. */
    shoulders: HumanShoulderSkinAdapter.Result[];
    /** Source identification, placement, continuity and rendering limitations. */
    limitations: string[];
  }

  /** Borrow each existing retained shaft boundary without extending or shifting it.
   * The single caller supplies one pooled station law for both sides. Native-role
   * C and the retained shaft remain separate authorities until their joint BVP is
   * identified. Skin and construction receive the same generated graph objects.
   */
  export function build(body: IAutoMovieHumanBodyParameters, skeleton: HumanSkeleton.Result, joints: HumanJointAssembly.Result, law: HumanShoulderSkinAdapter.StationLaw): Result {
    const shoulders: HumanShoulderSkinAdapter.Result[] = [];
    const failures: { side: "l" | "r"; message: string }[] = [];
    for (const side of ["l", "r"] as const) {
      try {
      const matches: HumanSurface.Patch[] = joints.patches.filter((patch: HumanSurface.Patch): boolean => patch.id === "upper-arm-" + side);
      if (matches.length !== 1) throw new Error("The common shoulder owner requires exactly one actual retained upper-arm chart");
      const retained: HumanSurface.Boundary = matches[0]!.boundaries.u0.curve;
      shoulders.push(HumanShoulderSkinAdapter.build({id:"shoulder."+side,body,skeleton,side,retainedShaftBoundary:retained,stationLaw:law}));
      } catch (error) {
        failures.push({ side, message: error instanceof Error ? error.message : String(error) });
      }
    }
    if (failures.length) throw new Error("Independent shoulder assembly failures " + JSON.stringify({ completedSides: 2, failures }));
    const patches: HumanSurface.Patch[] = shoulders.flatMap((shoulder: HumanShoulderSkinAdapter.Result): HumanSurface.Patch[] => [...shoulder.skin.patches]);
    const curves: HumanSurface.Boundary[] = shoulders.flatMap((shoulder: HumanShoulderSkinAdapter.Result): HumanSurface.Boundary[] => [...shoulder.skin.construction]);
    const authorities: Map<string, HumanSurface.Boundary> = new Map();
    for (const curve of curves) {
      const previous: HumanSurface.Boundary | undefined = authorities.get(curve.id);
      if (previous !== undefined && previous !== curve) throw new Error("Multiple shoulder boundary authorities share an identity");
      authorities.set(curve.id,curve);
    }
    return {patches,curves:[...authorities.values()],shoulders,limitations:shoulders.flatMap((shoulder: HumanShoulderSkinAdapter.Result): string[] => [...shoulder.limitations])};
  }
}
