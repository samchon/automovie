import { ViolationCollector } from "../../validation/ViolationCollector";
import { isRecord } from "../../validation/isRecord";

/**
 * Validate the staged atmosphere, the only check a fog gets before `stageScene`
 * lowers it verbatim into the scene and the renderer's fog law reads it.
 *
 * {@link IAutoMovieFog} carries two facts and both are checked: an extinction
 * density, per metre, that must be a finite number of at least zero, since a
 * negative one has no extinction meaning and a non-finite one cannot be
 * sampled; and a color whose `r`, `g` and `b` lie in `[0, 1]` like every other
 * color the engine accepts. Density has no upper bound: a dense fog is a look,
 * not a mistake. The value is read as `unknown`, because `stage` is reachable
 * in-process without the transport's structural gate, so a `null` fog becomes
 * a located violation rather than a later `TypeError`. Violations go to `out`
 * at `<path>`, `<path>.density`, `<path>.color` and `<path>.color.<channel>`.
 *
 * @param fog The authored fog, unchecked.
 * @param path Violation path of the fog.
 * @param out Collector the violations are appended to.
 *
 * @evidence contracts/common.md#principled-implementation Checks exactly the two facts the fog law in `sceneFogTransmittance` and the renderer read, narrowing every level from `unknown` before comparing and checking each channel with the collector's `range`, which narrows an `unknown` channel itself; no later scene validator checks fog, so this gate is the one that keeps an unusable density out of the scene.
 * @evidence contracts/common.md#clear-and-simple-design One validator for the staged fog field, delegating channel checks to `ViolationCollector.range`, which the light and model color validators also use, so colors are judged with one test and one message.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No density ceiling is imposed and nothing is clamped or defaulted; a refused value is reported as authored.
 * @evidence contracts/common.md#meaningful-documentation States both facts with units and bounds and why each bound exists, the absent ceiling, why the value is unknown, and the reported paths.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A density test and three channel tests, constant work on one record with nothing to search or sort.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Checks one staged fog per call and coordinates no work across calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains nothing itself; it appends at most four violations per call to the collector the caller owns, one for density and one per color channel.
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
  const density: unknown = fog.density;
  if (typeof density !== "number" || !Number.isFinite(density) || density < 0)
    out.push(
      "range",
      `${path}.density`,
      `fog density must be a finite number >= 0, but was ${String(density)}`,
      density,
    );
  const color: unknown = fog.color;
  if (!isRecord(color)) {
    out.push("type", `${path}.color`, "fog color must be a JSON object", color);
    return;
  }
  for (const key of ["r", "g", "b"] as const)
    out.range(`${path}.color.${key}`, color[key], 0, 1, `fog color ${key}`);
};
