#!/usr/bin/env node
import { runAutoMovieRecoveryCommand } from "./runAutoMovieRecoveryCommand";

// This installed executable owns process exit state; library imports do not.
void runAutoMovieRecoveryCommand(process.argv.slice(2)).then(
  (code: number): void => { process.exitCode = code; },
).catch((failure: unknown): void => {
    console.error(failure instanceof Error ? failure.message : String(failure));
    process.exitCode = 1;
});
