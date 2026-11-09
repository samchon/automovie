#!/usr/bin/env node
import { run } from "./run";

// The executable entry runs unconditionally: a `require.main === module` guard
// is false under ttsx, whose bootstrap is the main module and loads this file
// by `require`, so `pnpm start` would exit without running.
void run(process.argv).then((code: number): void => {
  process.exitCode = code;
});
