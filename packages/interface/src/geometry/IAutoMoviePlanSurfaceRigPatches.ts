import type { IAutoMovieSurfaceNetwork } from "./IAutoMovieSurfaceNetwork";
import type { IAutoMovieSurfaceRegistry } from "./IAutoMovieSurfaceRegistry";
import type { IAutoMovieSurfaceSample } from "./IAutoMovieSurfaceSample";
import type { IAutoMovieSweepRig } from "./IAutoMovieSweepRig";

/**
 * Geometry samplers and registry shared while laying out one tier's patch
 * controls.
 */
export namespace IAutoMoviePlanSurfaceRigPatches {
  /**
   * Lay out the sweep, transition, Coons and bridge blocks of a surface rig,
   * preserving vertex registration order and cell reaches. Bridge sweep probes
   * bind once after registry cell resolution and before sealing, so their
   * normals and axial derivatives use the same geometric field as their loop
   * positions, before control pins.
   */
  export type IProps = {
    /**
     * Borrowed surface-network patch declarations. Planning preserves input
     * vertex registration and cell reach semantics for the selected tier.
     */
    network: IAutoMovieSurfaceNetwork;
    /**
     * Mutable invocation-local vertex/face registry. Planning adds samples,
     * interior writers and deferred bridge-probe callbacks; the owning network
     * later resolves those callbacks during finalization. Planning errors can
     * leave earlier registrations in place, so discard a failed construction.
     */
    registry: IAutoMovieSurfaceRegistry;
    /**
     * Resolve an existing named sweep to the same compiled rig used by the
     * network; unknown names throw in the supplied resolver.
     */
    sweepRig: (name: string) => IAutoMovieSweepRig;
    /**
     * Select and admit the current tier's safe positive integer count from a
     * count record. what provides diagnostic context; exceptions propagate.
     */
    count: (counts: IAutoMovieSurfaceNetwork.ICounts, what: string) => number;
    /**
     * Construct a stable sweep-point identity from name and u/v, using the same
     * clamped-u and wrapped-turn quantization as all registry users. Numeric
     * proximity does not supply identity.
     */
    sweepKey: (name: string, u: number, v: number) => string;
    /**
     * Sample an edge in its declared order, retaining shared sweep/curve
     * identities and local footprint reaches. what identifies admission
     * failures; callback exceptions propagate.
     */
    sample: (
      edge: IAutoMovieSurfaceNetwork.IEdge,
      what: string,
    ) => IAutoMovieSurfaceSample[];
    /**
     * Sample an ordered closed edge loop with matching endpoints and compatible
     * counts. Return its unique cyclic samples; topology inconsistencies throw
     * before patch emission.
     */
    loop: (
      edges: IAutoMovieSurfaceNetwork.IEdge[],
      what: string,
    ) => IAutoMovieSurfaceSample[];
  };
}
