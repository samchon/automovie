import { compareCodeUnits } from "./compareCodeUnits";

/** Return distinct strings in deterministic JavaScript code-unit order. */
export function uniqueStrings(values: string[]): string[] {
  return [...new Set<string>(values)].sort(compareCodeUnits);
}
