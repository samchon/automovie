import { compareCodeUnits as compareCodeUnitsImpl } from "./internal/compareCodeUnits";
import { withArticle as withArticleImpl } from "./internal/withArticle";

/** Deterministic text helpers shared by Engine operations. */
export namespace AutoMovieEngineText {
  /**
   * Compare two strings lexicographically by UTF-16 code units.
   *
   * Return -1, 0 or 1 for less, equal or greater. Case is significant, and a
   * shared prefix sorts before a longer string. Unicode normalization and
   * locale are caller choices.
   */
  export function compareCodeUnits(a: string, b: string): number {
    return compareCodeUnitsImpl(a, b);
  }

  /**
   * Prefix a diagnostic label with an English spelling-based article.
   *
   * An initial a, e, i, o or u selects an, ignoring case. Other first code
   * units and an empty label select a. The label itself is retained after
   * the space.
   */
  export function withArticle(value: string): string {
    return withArticleImpl(value);
  }
}
