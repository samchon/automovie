import {
  type IAutoMovieArtifactResolution,
  type IAutoMovieArtifactStore,
  composeAutoMovieArtifactKey,
  decodeAutoMovieArtifactJson,
  encodeAutoMovieArtifactJson,
  resolveAutoMovieArtifact,
} from "@automovie/engine";

import type { IAutoMovieHumanParameters } from "../structures/IAutoMovieHumanParameters";
import { AutoMovieHumanBodyLaw } from "./AutoMovieHumanBodyLaw";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";

/**
 * The body calibration of one parameter set, read from an artifact store or
 * computed by `AutoMovieHumanBodyLaw.calibrate` and stored.
 *
 * Calibration is the shape law's expensive pass; everything a figure's
 * skeleton, rig and skin need afterwards derives from it. Pass the result as
 * `AutoMovieHumanSkeleton.prepare(params, { calibration })` (and to
 * `AutoMovieHumanPhysicalProfile.prepare` through that evaluator), so a
 * remount reads one stored entry instead of recalibrating. The value is the
 * calibration `calibrate(params).body` returns, carried exactly by the engine's
 * artifact JSON (including `-0` and non-finite numbers); its `diagnostics`
 * list is a copy, not shared with a later calibration.
 *
 * The key is stage `human.body-calibration` at this module's version, the
 * caller's toolchain and the parameters' exact JSON text. Human's package
 * version never changes inside a workspace, so put the identity of the code
 * that calibrates into `toolchain`, for example
 * `{ "@automovie/human#src": <digestAutoMovieSourceTree of human/src> }`
 * supplied by the development server; without it an edited body law keeps
 * serving old calibrations.
 *
 * @param params Complete public input; pose and expression are part of the key though calibration ignores them, so they only cost misses.
 * @param options.store Artifact store, such as Render's HTTP store in a page or its directory store in Node.
 * @param options.toolchain Identity of the Human code and anything else the calibration depends on.
 * @returns The calibration in calibration mm, owned by the caller.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Calibration is a deterministic function of the parameters and the Human code, so a key over the exact parameter text and a caller-supplied code identity names it completely; the engine resolver verifies stored content before reuse.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Human owns only its stage key and value type; keys, verification, encoding and storage are the engine's and Render's generic modules.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The computation is the unchanged body law; a calibration holding values artifact JSON cannot restore throws when it is stored instead of being flattened.
 * @evidence contracts/development/implementation.md#efficient-algorithms A hit costs one store read, one SHA-256 and one parse, linear in the encoded size; a miss adds one calibration and one write.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares a calibration across mounts and processes only under an identical parameter text, stage version and toolchain, after content verification.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds the encoded bytes during the call and returns the decoded calibration; the store owns persistence and its collection.
 * @evidence contracts/development/common.md#meaningful-documentation States what is cached, how to feed it to preparation, the key, the required code identity and the copy semantics.
 */
export async function resolveAutoMovieHumanCalibration(
  params: IAutoMovieHumanParameters,
  options: {
    store: IAutoMovieArtifactStore;
    toolchain: Readonly<Record<string, string>>;
  },
): Promise<IAutoMovieHumanBodyCalibration> {
  const resolved: IAutoMovieArtifactResolution = await resolveAutoMovieArtifact(
    options.store,
    composeAutoMovieArtifactKey({
      stage: "human.body-calibration",
      version: VERSION,
      toolchain: options.toolchain,
      inputs: {
        parameters: new TextDecoder().decode(
          encodeAutoMovieArtifactJson(params),
        ),
      },
    }),
    async (): Promise<Uint8Array> =>
      encodeAutoMovieArtifactJson(AutoMovieHumanBodyLaw.calibrate(params).body),
  );
  return decodeAutoMovieArtifactJson<IAutoMovieHumanBodyCalibration>(
    resolved.bytes,
  );
}

/** Stage version; bump when the stored calibration's meaning or shape changes. */
const VERSION: string = "1";
