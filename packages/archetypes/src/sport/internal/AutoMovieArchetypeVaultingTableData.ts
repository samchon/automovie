import type { IAutoMovieArchetypeBand } from "../../core/index";
import { AutoMovieArchetypeBand } from "../../core/index";

/*
 * The table's size, from a secondary summary of the apparatus norms.
 */
export const NORMS: string =
  "the vaulting table of the FIG apparatus norms, 135 cm high for men and 125 cm for women, 120 cm long and 90 cm wide, each to 1 cm, as Wikipedia's Vault (gymnastics) gives them (https://en.wikipedia.org/wiki/Vault_(gymnastics)); the norms were not read";

/*
 * The bands every table shares.
 */
export const SHARED: Readonly<
  Record<"length" | "width" | "mass", IAutoMovieArchetypeBand>
> = {
  length: AutoMovieArchetypeBand.metres(1.19, 1.21, NORMS, true),
  width: AutoMovieArchetypeBand.metres(0.89, 0.91, NORMS, true),
  mass: AutoMovieArchetypeBand.of(
    "kg",
    80,
    120,
    "an estimate of a steel-based competition table; no maker's figure was read",
    true,
  ),
};
