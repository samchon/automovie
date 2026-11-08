import { composeAutoMovieArtifactKey, encodeAutoMovieArtifactJson } from "@automovie/engine";

import type { IAutoMovieHumanParameters } from "../structures/IAutoMovieHumanParameters";

/**
 * The artifact key under which one parameter set's body calibration is stored.
 *
 * Stage `human.body-calibration` at this module's version, the caller's
 * toolchain (the identity of the Human code that calibrates, such as a digest
 * of `human/src`) and one input, `parameters`: the exact artifact-JSON text of
 * the complete parameters, so `-0` and member order are part of it. Pose and
 * expression are included although calibration ignores them; they only cost
 * misses. `resolveAutoMovieHumanCalibration` stores under this key; a
 * production can also use it to look an entry up or seed one.
 *
 * @param params Complete public input.
 * @param toolchain Identity of the Human code and anything else calibration depends on.
 * @returns The engine `sha256:` key.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Calibration is a deterministic function of the parameters and the Human code, so the exact parameter text plus a code identity names it completely; the engine key adds the stage and version.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Human owns only its stage's key schema; hashing and encoding are the engine's.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No parameter is dropped or rounded; a value artifact JSON cannot encode throws.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the encoded parameter size.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure key coordinates no work.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Only the key outlives the call.
 * @evidence contracts/development/common.md#meaningful-documentation States the stage, version, toolchain, the single input and why pose is included.
 */
export function autoMovieHumanCalibrationKey(
  params: IAutoMovieHumanParameters,
  toolchain: Readonly<Record<string, string>>,
): string {
  return composeAutoMovieArtifactKey({
    stage: "human.body-calibration",
    version: VERSION,
    toolchain,
    inputs: {
      parameters: new TextDecoder().decode(encodeAutoMovieArtifactJson(params)),
    },
  });
}

/** Stage version; bump when the stored calibration's meaning or shape changes. */
const VERSION: string = "1";
