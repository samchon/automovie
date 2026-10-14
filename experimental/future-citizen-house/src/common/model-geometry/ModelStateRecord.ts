import { type Bounds } from "./orthogonal-mesh";
import type { ModelPartRecord } from "./ModelPartRecord";

/**
 * Caller-owned draft state consumed by mesh recipes and catalog audits. Optional maps are indexed by local part ID; absence leaves the associated recipe unavailable. This erased shape neither validates numeric domains nor copies catalog data.
 *
 * @author Samchon
 */
export interface ModelStateRecord {
  /** Exact state token; plant recipes also parse it as millimetres of overall height. */
  state: string;

  /** Combined local bounds used by the model-source audit, including compose when present; assembly does not emit this box. */
  envelope: Bounds;

  /** Part records rebuilt in authored order for each invocation. */
  parts: ModelPartRecord[];

  /** Orthogonal cuts subtracted from each host or piece union; absence supplies an empty cut list. */
  voids?: Record<string, Bounds[]>;

  /** Orthogonal solid pieces whose union replaces the host box for the applicable cut recipe. */
  pieces?: Record<string, Bounds[]>;

  /** Centre X/Z, inner radius and outer radius in metres for a concentric through shell. */
  radial?: Record<string, [number, number, number, number]>;

  /** Centre X/Z, inner X/Z semiaxes and outer X/Z semiaxes in metres for elliptical vessel dispatch. */
  ellipse?: Record<string, [number, number, number, number, number, number]>;

  /** Axial bore tokens parsed by boreCuts, boxWithBore or vessel; token order depends on axis and malformed spans can throw. */
  bores?: Record<string, { axis: string; args: string[] }>;

  /** Vessel section, bottom divisor, shoulder ratio, wall divisor and mouth-radius tokens. The current wall formula uses height/divisor, an unresolved design mismatch. */
  profiles?: Record<string, string[]>;

  /** Retained plant join data; the current ModelRepresentation assembly does not consume these records. */
  joins?: Record<string, number[]>;

  /** Local X/Y/Z leaf origins in metres; a matching entry selects plantLeaf and requires plantSpec. */
  apices?: Record<string, number[]>;

  /** Plant proportions shared by pot and leaf dispatch; additional authored fields may be retained without a current consumer. */
  plantSpec?: {
    /** Lower bound on pot wall thickness in metres. */
    wallMinimum: number;

    /** Pot wall thickness as a factor of overall plant height. */
    wallFactor: number;

    /** Bottom pot radius as a factor of overall plant height. */
    potBottomRadius: number;

    /** Top pot radius as a factor of overall plant height. */
    potTopRadius: number;

    /** Authored pot-height proportion retained in catalog data; pot dispatch currently uses part bounds. */
    potHeight: number;

    /** Authored soil-surface proportion retained for the catalog's separate soil part. */
    soilSurface: number;

    /** Leaf thickness as a factor of overall plant height. */
    leafThickness: number;

    /** Other authored plant facts retained without implied mesh-dispatch support. */
    [key: string]: unknown;
  };

  /** Child identity and local metre offset used for combined-envelope audit; building this state does not merge the child's parts. */
  compose?: { anchor: string; state: string; offset: [number, number, number] };
}
