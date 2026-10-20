import { IAutoMovieWorldSurface } from "@automovie/interface";

import { worldSurfaceContains } from "./worldSurfaceContains";

/**
 * Select the first declared world surface containing an XZ point.
 *
 * @evidence contracts/common.md#principled-implementation Array.find preserves authored precedence and the shared worldSurfaceContains edge/parity rule; finite simple footprints are the caller premise, and elevation is deliberately not compared.
 * @evidence contracts/common.md#clear-and-simple-design This selector owns world precedence only, distinct from the space layer's topmost-height model; worldGroundHeight and geometry admission consume the selected record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No covering surface returns null without a fabricated plane, while overlapping surfaces keep their authored first-hit order and boundary tolerance.
 * @evidence contracts/common.md#meaningful-documentation Documents metre query coordinates, edge inclusion, height-independent selection and borrowed winner identity.
 * @evidence contracts/performance.md#efficient-algorithms It scans visited footprint edges until the first hit, using constant selector state plus per-edge projection records in the shared predicate.
 * @evidence contracts/performance.md#reuse-equivalent-work Callers share this precedence owner, while each query reads the current borrowed list and caches no classification across mutations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned surface is borrowed from the caller's list; no list, point, watcher or host resource survives through this selector.
 */
export const worldGroundSurface: (
  surfaces: readonly IAutoMovieWorldSurface[],
  point: { x: number; z: number },
) => IAutoMovieWorldSurface | null = (
  surfaces: readonly IAutoMovieWorldSurface[],
  point: { x: number; z: number },
): IAutoMovieWorldSurface | null =>
  surfaces.find((surface: IAutoMovieWorldSurface): boolean =>
    worldSurfaceContains(surface, point),
  ) ?? null;
