/** Preserve a finding's actual numerical unit and distinguish a sampled point from a diagnostic location. */
export namespace HumanCurveMetric {
  /** Explicit interpretation; unregistered legacy rules must not be silently labelled millimetres. */
  export interface IDescription {
    /** Unit of both value and limit, separate from the point's coordinate unit. */
    units: string;
    /** Actual formula represented by the scalar. */
    definition: string;
    /** Whether the accompanying coordinates are a skin sample or only a locator. */
    pointRole: "surface-sample" | "section-centroid" | "diagnostic-anchor" | "unregistered";
    /** Every existing point coordinate uses calibration millimetres. */
    coordinateUnits: "mm";
  }

  /** Register known formulas without inventing a physical interpretation for another legacy rule. */
  export function describe(rule: string): IDescription {
    if (rule === "step") return { units: "deg", definition: "Absolute difference between median normal-turn angles on the upper and trunk sides, each from 0.1 mm off the joint to STEP_REACH. This is not a positional gap.", pointRole: "diagnostic-anchor", coordinateUnits: "mm" };
    if (rule === "ridge") return { units: "dimensionless", definition: "Absolute median over fixed bearings of a radial second difference divided by station pitch squared, multiplied by section perimeter/(2*pi).", pointRole: "section-centroid", coordinateUnits: "mm" };
    if (rule === "tear") return { units: "deg", definition: "Angle between adjacent actual mesh face normals.", pointRole: "surface-sample", coordinateUnits: "mm" };
    if (rule === "crumple") return { units: "edge count", definition: "Count of sharp mesh edges within the declared physical patch radius.", pointRole: "surface-sample", coordinateUnits: "mm" };
    if (rule === "join") return { units: "mm", definition: "Largest sampled child-end distance to the nearest sampled inherited parent-ring point.", pointRole: "surface-sample", coordinateUnits: "mm" };
    if (rule === "thigh") return { units: "ratio", definition: "Sampled thigh perimeter divided by the public thigh target in calibration units.", pointRole: "section-centroid", coordinateUnits: "mm" };
    if (rule === "inside") return { units: "ring count", definition: "Count of arm section centroids enclosed by the trunk's section.", pointRole: "section-centroid", coordinateUnits: "mm" };
    return { units: "unregistered", definition: "The owning legacy evaluator has not yet registered this metric's units and point interpretation; do not infer them from the point coordinates.", pointRole: "unregistered", coordinateUnits: "mm" };
  }
}
