import * as readline from "node:readline/promises";

import { AUTOMOVIE_DEFAULT_PROJECT_NAME } from "./AUTOMOVIE_DEFAULT_PROJECT_NAME";

/**
 * Ask the terminal for a project name, offering
 * {@link AUTOMOVIE_DEFAULT_PROJECT_NAME}.
 *
 * Without an interactive terminal on both standard input and output, no
 * question is asked and the default is returned, so scripted runs never wait. A
 * blank answer also takes the default; any other answer is returned as typed
 * for the template's name rule to admit.
 *
 * @returns The answered or default name.
 */
export async function promptAutoMovieProjectName(): Promise<string> {
  if (process.stdin.isTTY !== true || process.stdout.isTTY !== true)
    return AUTOMOVIE_DEFAULT_PROJECT_NAME;
  const terminal: readline.Interface = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  try {
    const answer: string = await terminal.question(
      `Project name (${AUTOMOVIE_DEFAULT_PROJECT_NAME}): `,
    );
    return answer.trim() === "" ? AUTOMOVIE_DEFAULT_PROJECT_NAME : answer;
  } finally {
    terminal.close();
  }
}
