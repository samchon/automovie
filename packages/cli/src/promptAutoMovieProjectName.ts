import * as readline from "node:readline/promises";

import { AUTOMOVIE_DEFAULT_PROJECT_NAME } from "./AUTOMOVIE_DEFAULT_PROJECT_NAME";

/**
 * Ask the terminal for a project name, offering {@link AUTOMOVIE_DEFAULT_PROJECT_NAME}.
 *
 * Without an interactive terminal on both standard input and output, no question is asked and the default is returned, so scripted runs never wait. A blank answer also takes the default; any other answer is returned as typed for the template's name rule to admit.
 *
 * @returns The answered or default name.
 *
 * @evidence contracts/development/implementation.md#principled-implementation `isTTY` on both streams identifies an interactive terminal; the readline interface is closed in `finally`, so standard input is released even when the question fails.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The prompt is the CLI's only interactive I/O, separate from the pure name decision.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The answer is not normalized here; the template's one name rule admits it.
 * @evidence contracts/development/common.md#meaningful-documentation The comment states when the question is asked, the default, and how a blank answer is treated.
 * @evidence contracts/development/implementation.md#efficient-algorithms One question and one trim.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each request asks at most once.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The readline interface is closed before returning.
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
