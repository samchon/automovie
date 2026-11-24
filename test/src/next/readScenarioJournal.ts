import fs from "node:fs";

import type { IScenarioMark } from "./IScenarioMark";

/**
 * Read a scenario process's journal: its complete lines, each one mark.
 *
 * A line still being appended has no newline yet, so the text after the last
 * newline is left for the next read, and a journal not yet created or already
 * removed reads as empty.
 *
 * @param journal The journal's path.
 * @returns The marks in the order written.
 */
export function readScenarioJournal(journal: string): IScenarioMark[] {
  let text: string;
  try {
    text = fs.readFileSync(journal, "utf8");
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
  const end: number = text.lastIndexOf("\n");
  if (end < 0) return [];
  return text
    .slice(0, end)
    .split("\n")
    .filter((line: string): boolean => line.length !== 0)
    .map((line: string): IScenarioMark => JSON.parse(line) as IScenarioMark);
}
