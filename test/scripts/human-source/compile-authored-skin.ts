import path from "node:path";

import { compileHumanSourceAuthoredSkin } from "./compileHumanSourceAuthoredSkin.ts";

/** Actual provider neutral/root/frozen-cut/P1 stage, without final generation publication.
 * From test CWD: ttsx -P tsconfig.human-source.json --no-plugins scripts/human-source/compile-authored-skin.ts WORK PROVIDER REPLAY OUTPUT.
 */
const [work, provider, replay, output] = process.argv
  .slice(2)
  .map((entry) => path.resolve(entry));
if (
  work === undefined ||
  provider === undefined ||
  replay === undefined ||
  output === undefined
)
  throw new Error(
    "Usage: compile-authored-skin.ts WORK PROVIDER REPLAY OUTPUT",
  );
compileHumanSourceAuthoredSkin(
  work,
  provider,
  replay,
  output,
  path.resolve(__dirname, "../../.."),
);
