import { frameName as frameNameImpl } from "./frameName.js";
import { framePattern as framePatternImpl } from "./framePattern.js";
import { renderPathStem as renderPathStemImpl } from "./renderPathStem.js";

/** Utilities that name rendered media and output locations. */
export namespace AutoMovieRenderMedia {
  /** Name one frame in an FFmpeg image sequence. */
  export function frameName(index: number, ext?: string, pad?: number): string {
    return frameNameImpl(index, ext, pad);
  }

  /** Build the FFmpeg image-sequence input pattern. */
  export function framePattern(ext?: string, pad?: number): string {
    return framePatternImpl(ext, pad);
  }

  /** Create one file-system-safe component for a render target. */
  export function renderPathStem(target: string): string {
    return renderPathStemImpl(target);
  }
}
