import type { IAutoMovieCompiledFormation, IAutoMovieFormationSlot } from "@automovie/interface";
import type { IAutoMovieFormationViewerObject } from "./IAutoMovieFormationViewerObject.js";
import type { IBuildInstancedFormationProps } from "./internal/IBuildInstancedFormationProps.js";
import { buildInstancedFormation as buildInstancedFormationImplementation } from "./internal/buildInstancedFormation.js";
import { regenerateFormationSlot as regenerateFormationSlotImplementation } from "./internal/regenerateFormationSlot.js";

/** Public operations for Auto Movie Render Formation. */
export namespace AutoMovieRenderFormation {
  /** Build one compact formation as chunked instance batches. */
  export function buildInstancedFormation(
    input: IBuildInstancedFormationProps,
  ): IAutoMovieFormationViewerObject {
    return buildInstancedFormationImplementation(input);
  }

  /** Regenerate one exact slot from compact runtime parameters. */
  export function regenerateFormationSlot(
    formation: IAutoMovieCompiledFormation,
    slot: number,
  ): IAutoMovieFormationSlot {
    return regenerateFormationSlotImplementation(formation, slot);
  }
}
