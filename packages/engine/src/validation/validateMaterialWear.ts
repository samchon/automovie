import type {
  IAutoMovieMaterialWear,
  IAutoMovieViolationCollector,
} from "@automovie/interface";

import { validateColor } from "./validateColor";

/**
 * Admit one material's wear record: a safe-integer seed within [0, 2³² − 1], at
 * least one of `edge` and `grime`, and in each present layer a linear colour, a
 * roughness within [0, 1], a width above zero and an amount within (0, 1]. An
 * absent record is left alone; findings are reported at each field's own path.
 *
 * @param wear The `wear` field.
 * @param path Diagnostic path of the field.
 * @param collector Caller-owned sink receiving findings in field order.
 */
export function validateMaterialWear(
  wear: IAutoMovieMaterialWear | undefined,
  path: string,
  collector: IAutoMovieViolationCollector,
): void {
  if (wear === undefined) return;
  if (
    !Number.isSafeInteger(wear.seed) ||
    wear.seed < 0 ||
    wear.seed > 4294967295
  )
    collector.push(
      "range",
      `${path}.seed`,
      "wear seed must be a safe integer within [0, 4294967295]",
      wear.seed,
    );
  if (wear.edge === undefined && wear.grime === undefined)
    collector.push(
      "type",
      path,
      "wear needs an edge layer, a grime layer or both",
      wear,
    );
  for (const name of ["edge", "grime"] as const) {
    const layer: IAutoMovieMaterialWear["edge"] = wear[name];
    if (layer === undefined) continue;
    const at: string = `${path}.${name}`;
    validateColor(layer.color, `${at}.color`, collector);
    collector.range(`${at}.roughness`, layer.roughness, 0, 1, "wear roughness");
    collector.positive(`${at}.width`, layer.width, "wear width");
    if (!(layer.amount > 0 && layer.amount <= 1))
      collector.push(
        "range",
        `${at}.amount`,
        "wear amount must lie within (0, 1]",
        layer.amount,
      );
  }
}