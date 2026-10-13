#!/usr/bin/env node
import { runAutoMovieReferenceCommand } from "./runAutoMovieReferenceCommand";

void runAutoMovieReferenceCommand(process.argv.slice(2))
  .then((code: number): void => {
    process.exitCode = code;
  })
  .catch((): void => {
    process.stderr.write("automovie-reference: command output failed.\n");
    process.exitCode = 1;
  });
