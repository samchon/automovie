import { compareCodeUnits as compareCodeUnitsImpl } from "./internal/compareCodeUnits";
import { withArticle as withArticleImpl } from "./internal/withArticle";

/** Deterministic text helpers shared by Engine operations. */
export namespace AutoMovieEngineText {
  /** Compare strings by locale-independent UTF-16 code-unit order. */
  export function compareCodeUnits(a: string, b: string): number {
    return compareCodeUnitsImpl(a, b);
  }

  /** Prefix a diagnostic subject with an article selected from its first written letter. */
  export function withArticle(value: string): string {
    return withArticleImpl(value);
  }
}
