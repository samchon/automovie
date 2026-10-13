import { IAutoMovieLight, IAutoMovieStageLight } from "@automovie/interface";

import { isAutoMovieLightType } from "../../resolve/isAutoMovieLightType";

/**
 * A light placement's kind: its `type` when that names a supported kind,
 * `"directional"`, the sun-like parallel source, when it is omitted, and
 * `null` when it is anything else.
 *
 * The value is read as `unknown` because `stage` is reachable in-process
 * without the transport's structural gate, so a placement's declared type may
 * not be what its static type claims. `validateLightPlacementShape` reports a
 * `null` answer as a violation; `lowerLightPlacement` runs only after that
 * gate passed and so never sees one.
 *
 * @param light The staging light placement.
 * @returns The supported kind, the directional default, or `null`.
 *
 * @evidence contracts/common.md#principled-implementation Narrows the authored field through `isAutoMovieLightType`, the membership test over the engine's supported light kinds, instead of trusting the static union, and maps only omission to the documented default.
 * @evidence contracts/common.md#clear-and-simple-design The one reading of a placement's kind shared by the shape validator, the environment check in `stageScene` and the lowering, so the default and the refusal cannot differ between them.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An unsupported type answers `null` for the validator to refuse rather than being coerced to a supported kind; the directional default is the staging contract's meaning of omission.
 * @evidence contracts/common.md#meaningful-documentation States the three answers, why the value is doubted at runtime, and which caller refuses `null` and which may assume it is absent.
 * @evidenceExclude contracts/performance.md#efficient-algorithms One property read and one set membership test, with no algorithm to choose.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Reads one placement per call and coordinates no work across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Allocates and retains nothing; it returns a string or `null`.
 */
export const lightTypeOf = (
  light: IAutoMovieStageLight,
): IAutoMovieLight["type"] | null => {
  const type: unknown = light.type;
  if (type === undefined) return "directional";
  return isAutoMovieLightType(type) ? type : null;
};
