import { IAutoMovieSemanticMask } from "@automovie/interface";
import { digestAutoMovieSemanticMask } from "../../../../packages/engine/src/render/digestAutoMovieSemanticMask";
/** Attach a digest of the production projection to an intentionally malformed own-field record; this creates a candidate, never certifies schema validity or supplies an independent digest oracle. */
export const sealSemanticMaskUnchecked: (value: Record<string, unknown>) => IAutoMovieSemanticMask = (
  value: Record<string, unknown>,
): IAutoMovieSemanticMask =>
  ({
    ...value,
    digest: digestAutoMovieSemanticMask(value as never),
  }) as unknown as IAutoMovieSemanticMask;
