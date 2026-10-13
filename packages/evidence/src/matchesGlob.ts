import { normalizeGlob } from "./normalizeGlob";
import { posix } from "./posix";

function matchesGlobSegment(value: string, pattern: string): boolean {
  let source: string = "^";
  for (const character of pattern) {
    if (character === "*") source += "[\\s\\S]*";
    else if (character === "?") source += "[\\s\\S]";
    else {
      if ("\\^$+.()[]{}|".includes(character)) source += "\\";
      source += character;
    }
  }
  return new RegExp(`${source}$`, "u").test(value);
}

/**
 * Match slash-separated selector segments, including zero or more path segments for double-star.
 *
 * @evidence contracts/common.md#principled-implementation Recursive segment matching treats double-star as either empty or one more path component; memoized index pairs preserve complete-path matching without repeated recursive states.
 * @evidence contracts/common.md#clear-and-simple-design Segment star and question-mark spelling is compiled locally while path recursion owns double-star semantics; callers own ordered negative-selector policy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Literal regex metacharacters are escaped rather than accepted as additional glob syntax; separator normalization does not bypass physical project-boundary admission.
 * @evidence contracts/common.md#meaningful-documentation The result reports selector spelling match only, with double-star crossing directories and ordinary wildcards confined to one path component.
 * @evidence contracts/performance.md#efficient-algorithms Memoization bounds recursive states by pattern-segment times path-segment count; segment regex compilation and backtracking add text-dependent cost, with no fixed input-size limit.
 * @evidence contracts/performance.md#reuse-equivalent-work One call shares resolved index-pair results across double-star alternatives; regexes and memo tables are rebuilt for independent input pairs.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Segment arrays and the memo table live until this synchronous match returns; no compiled-pattern cache or filesystem handle is retained.
 */
export function matchesGlob(file: string, source: string): boolean {
  const pathSegments: string[] = posix(file).split("/");
  const patternSegments: string[] = normalizeGlob(source).split("/");
  const memo: Map<string, boolean> = new Map<string, boolean>();
  const visit: (patternIndex: number, pathIndex: number) => boolean = (patternIndex: number, pathIndex: number): boolean => {
    const key: string = `${patternIndex}:${pathIndex}`;
    const known: boolean | undefined = memo.get(key);
    if (known !== undefined) return known;
    let result: boolean;
    if (patternIndex === patternSegments.length)
      result = pathIndex === pathSegments.length;
    else if (patternSegments[patternIndex] === "**")
      result =
        visit(patternIndex + 1, pathIndex) ||
        (pathIndex < pathSegments.length && visit(patternIndex, pathIndex + 1));
    else
      result =
        pathIndex < pathSegments.length &&
        matchesGlobSegment(
          pathSegments[pathIndex]!,
          patternSegments[patternIndex]!,
        ) &&
        visit(patternIndex + 1, pathIndex + 1);
    memo.set(key, result);
    return result;
  };
  return visit(0, 0);
}
