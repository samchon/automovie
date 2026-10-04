/**
 * A published value, or a value the generation needs, that the source
 * generation does not reproduce. `vertices` counts the affected vertices and
 * `maximumMetres` is the largest published displacement among them, so the
 * size of what is missing is visible instead of being filled with zero.
 *
 * @author Samchon
 */
export interface IHumanSourceLoss {
  basis: "face" | "body";
  surface: string;
  row: string;
  kind:
    | "p1-dropped-overlap"
    | "unavailable-at-new-support"
    | "not-regenerated-from-upstream"
    | "part-not-regenerated"
    | "part-rigid-relative-motion";
  vertices: number;
  maximumMetres: number;
  reason: string;
}
