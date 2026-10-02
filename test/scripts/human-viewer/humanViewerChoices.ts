import type { HumanObservationPass } from "@automovie/playground/src/human/common/observation/HumanObservationPass";
import type { HumanObservationView } from "@automovie/playground/src/human/common/observation/HumanObservationView";

/**
 * The named views and passes an address may choose, in the order the viewer
 * lists them. The playground's own tuples cannot be imported at runtime from
 * this Node package, so the lists are written here once, and the `satisfies`
 * clauses make the compiler refuse a name the playground does not know.
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
    "wire",
    "outline",
  ] as const satisfies readonly HumanObservationPass[],
};
