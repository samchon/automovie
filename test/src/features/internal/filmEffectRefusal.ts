import { AutoMovieFilmEffectRuntimeError } from "../../../../packages/engine/src/effectRuntime/AutoMovieFilmEffectRuntimeError";

/** Run the supplied task and report accepted or the actual film-effect error code, preserving unexpected thrown values in the original unexpected-text branch. The canonical error class is shared with the product throwers; no foreign method or global is replaced. */
export const filmEffectRefusal: (task: () => unknown) => string = (
  task: () => unknown,
): string => {
  try {
    task();
    return "accepted";
  } catch (error: unknown) {
    return error instanceof AutoMovieFilmEffectRuntimeError
      ? error.code
      : `unexpected: ${String(error)}`;
  }
};
