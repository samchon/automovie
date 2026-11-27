#!/usr/bin/env node
import { AutoMovieCliCommand } from "./command/AutoMovieCliCommand";

// The executable entry runs unconditionally: a `require.main === module` guard
// is false under ttsx, whose bootstrap is the main module and loads this file
// by `require`, so `pnpm start` would exit without running.
void AutoMovieCliCommand.run(process.argv).then((code: number): void => {
  process.exitCode = code;
});
