import { compareCodeUnits } from "./compareCodeUnits";

/** Return distinct strings in deterministic JavaScript code-unit order. */
export const uniqueStrings: (values: string[]) => string[] = (
  values: string[],
): string[] => [...new Set<string>(values)].sort(compareCodeUnits);
