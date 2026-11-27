import type { IAutoMovieCompiledFormation, IAutoMovieFormationSlot } from "@automovie/interface";
import type { IAutoMovieRenderFormationViewerObject } from "./IAutoMovieRenderFormationViewerObject";
import type { IBuildInstancedFormationProps } from "./internal/IBuildInstancedFormationProps";
import { buildInstancedFormation as buildInstancedFormationImplementation } from "./internal/buildInstancedFormation";
import { regenerateFormationSlot as regenerateFormationSlotImplementation } from "./internal/regenerateFormationSlot";

/** Public operations for Auto Movie Render Formation. */
export namespace AutoMovieRenderFormation {
  /** Build one compact formation as chunked instance batches. */
  export function buildInstancedFormation(
    input: IBuildInstancedFormationProps,
  ): IAutoMovieRenderFormationViewerObject {
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
