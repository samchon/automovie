import type { IAutoMovieScript } from "@automovie/interface";

import { renderScreenplay } from "./internal/renderScreenplay.js";

/** Serializes a committed screenplay as deterministic plain text. */
export class AutoMovieRenderScreenplay {
  private constructor() {}

  /**
   * Serialize a validated script into plain screenplay text with one terminal
   * newline. A script with no beats throws before serialization.
   *
   * A tree supplies the intent header and is walked depth-first in declared
   * child order. Script commit must already have validated its single intent,
   * acyclicity and one-to-one beat join. A treeless script uses the flat
   * logline, theme and ordered beat summaries.
   *
   * Tree output uses `ACT, <purpose>`, uppercase scene slugs, bracketed group
   * rationale, `BEAT, <name>` and stage direction. Dialogue speakers use
   * sixteen spaces of indentation and text uses eight, with `[t=<seconds>s]`
   * for an anchored line. A shot caption writes `[Shot: <caption>]`. Supplied
   * text is preserved; the serializer does not strip whitespace inside
   * authored fields.
   *
   * @param script The validated screenplay.
   * @returns Plain screenplay text with one terminal newline.
   */
  public static render(script: IAutoMovieScript): string {
    return renderScreenplay(script);
  }
}
