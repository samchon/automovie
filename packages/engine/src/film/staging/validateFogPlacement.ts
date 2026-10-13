import { ViolationCollector } from "../../validation/ViolationCollector";
import { isRecord } from "../../validation/isRecord";
import { validateStageUnitColorComponent } from "./validateStageUnitColorComponent";

/**
 * The staged atmosphere, held to the rule the scene gate applies downstream, so
 * a fog `stage` composes can never be one `commitScene` refuses.
 *
 * Two facts and no more, because {@link IAutoMovieFog} carries two: an
 * extinction coefficient that must be finite and non-negative (a negative one
 * has no supported extinction meaning, and a non-finite one cannot be sampled),
 * and a color whose components are unit-ranged like every other color the
 * engine accepts. Density has no upper bound on purpose: `1 /m` is a wall of
 * cloud, which is a look, not a mistake.
 *
 * Total over an untyped payload because `stage` is reachable in-process
 * without the transport's structural gate,
 * and a `null` fog must become a located violation rather than a `TypeError`
 * two rungs later.
 *
 * @evidence requirements/diagnostics/identity-path-and-context.md#diagnostics-path-and-scope Reports malformed extinction and color at their submitted fog fields without substituting an atmosphere.
 * @evidence specifications/validation-and-diagnostics/diagnostic-identity-location-and-severity.md#validation-diagnostic-path-scope Reports malformed extinction and color at their submitted fog fields without substituting an atmosphere.
 */
export const validateFogPlacement = (
  fog: unknown,
  path: string,
  out: ViolationCollector,
): void => {
  if (!isRecord(fog)) {
    out.push("type", path, "fog must be a JSON object", fog);
    return;
  }
  if (
    typeof fog.density !== "number" ||
    !Number.isFinite(fog.density) ||
    fog.density < 0
  )
    out.push(
      "range",
      `${path}.density`,
      `fog density must be a finite number >= 0, but was ${String(fog.density)}`,
      fog.density,
    );
  if (!isRecord(fog.color)) {
    out.push(
      "type",
      `${path}.color`,
      "fog color must be a JSON object",
      fog.color,
    );
    return;
  }
  for (const key of ["r", "g", "b"] as const)
    validateStageUnitColorComponent(
      fog.color[key],
      `${path}.color.${key}`,
      `fog color ${key}`,
      out,
    );
};
