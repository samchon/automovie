import type { IAutoMovieLoftChain } from "@automovie/engine";

import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";

/**
 * The storable form of a body calibration: the same value without the engine's
 * callable source records.
 *
 * The engine attaches three optional records so later stages of the same
 * process can read the original source a chain was lofted from: a layer's
 * `frameSource`, and the `source` of a chain's `pole` and `opposite` caps. Each
 * holds the source axis object itself, with its `at` and `jet` methods, which
 * no artifact can carry; the engine documents that JSON cannot restore them.
 * Every engine reader treats them as optional: a layer falls back to its own
 * plain `frame`, `frameSlopes` and `frameCurvatures`, and a cap to its plain
 * `point` and end station. A stored calibration drops these three records and
 * keeps everything else unchanged.
 *
 * @param calibration A calibration as `AutoMovieHumanBodyLaw.calibrate` returns it.
 * @returns A copy whose chains carry no callable source record; every other member is shared with the input.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Removes exactly the engine's documented callable source records, which a walk of a real calibration found to be the only live values, and keeps the plain data the engine reads when they are absent.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One mapping over chains and layers; the artifact store's plain-data rule stays with the engine encoder, unchanged.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not drop functions generically or weaken the encoder; any other non-plain member still fails storage by name.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the number of layers, with one shallow copy per chain, cap and sourced layer.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Members other than the copied records are shared, not copied.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a new top-level record and retains nothing.
 * @evidence contracts/development/common.md#meaningful-documentation States why the records cannot be stored, what replaces each and what the copy shares.
 */
export function plainAutoMovieHumanCalibration(
  calibration: IAutoMovieHumanBodyCalibration,
): IAutoMovieHumanBodyCalibration {
  return {
    ...calibration,
    chains: calibration.chains.map(
      (chain: IAutoMovieLoftChain): IAutoMovieLoftChain => {
        const plain: IAutoMovieLoftChain = {
          ...chain,
          layers: chain.layers.map(
            (layer: IAutoMovieLoftChain.ILayer): IAutoMovieLoftChain.ILayer => {
              if (layer.frameSource === undefined) return layer;
              const { frameSource: _, ...rest } = layer;
              return rest;
            },
          ),
        };
        if (chain.pole?.source !== undefined) {
          const { source: _, ...pole } = chain.pole;
          plain.pole = pole;
        }
        if (chain.opposite?.source !== undefined) {
          const { source: _, ...opposite } = chain.opposite;
          plain.opposite = opposite;
        }
        return plain;
      },
    ),
  };
}
