import { withoutEnding } from "./withoutEnding";

/** Returns the exact source line ending, including an absent final ending. */
export function lineEnding(line: string): string {
  return line.slice(withoutEnding(line).length);
}
