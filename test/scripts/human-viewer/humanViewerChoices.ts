import type { HumanObservationPass } from "@automovie/playground/src/human/common/observation/HumanObservationPass";
import type { HumanObservationView } from "@automovie/playground/src/human/common/observation/HumanObservationView";

/**
 * The named views and passes an address may choose, in the order the viewer
 * lists them. The `satisfies` clauses make the compiler refuse a name the
 * playground does not know. Pass readings and material parameters remain
 * owned by the shared product observation definition.
 */
export const humanViewerChoices = {
  /** Body viewport's public inspection-light names, used by parsing and UI. */
  lights: ["key", "fill", "rim"] as const,
  views: [
    "front",
    "left-three-quarter",
    "left",
    "back",
    "right-three-quarter",
    "right",
    "top",
    "bottom",
  ] as const satisfies readonly HumanObservationView[],
  passes: [
    "beauty",
    "clay",
    "normal",
    "depth",
    "flat",
    "albedo",
    "wire",
    "outline",
  ] as const satisfies readonly HumanObservationPass[],
};
