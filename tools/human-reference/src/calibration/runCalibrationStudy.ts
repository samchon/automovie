import path from "node:path";

import type { ReferenceManifest } from "../io/ReferenceManifest.ts";
import { readInput } from "../io/readInput.ts";
import { readManifest } from "../io/readManifest.ts";
import { writeArtifact } from "../io/writeArtifact.ts";
import type { CalibrationStudy } from "./CalibrationStudy.ts";
import { analyzeCalibrationStudy } from "./analyzeCalibrationStudy.ts";

const args: string[] = process.argv.slice(2);
const manifestFile: string | undefined = args[args.indexOf("--manifest") + 1];
const output: string | undefined = args[args.indexOf("--output") + 1];
if (
  !args.includes("--manifest") ||
  !args.includes("--output") ||
  !manifestFile ||
  !output ||
  !path.isAbsolute(output)
)
  throw new Error(
    "Expected --manifest ABSOLUTE_FILE --output ABSOLUTE_DIRECTORY",
  );
const manifest: ReferenceManifest = readManifest(manifestFile);
const study: CalibrationStudy = readInput<CalibrationStudy>(manifest, "study");
const result: ReturnType<typeof analyzeCalibrationStudy> =
  analyzeCalibrationStudy(study);
writeArtifact(output, "coverage.json", {
  schema: "human-calibration-coverage-v1",
  input: manifest.files.study,
  ...result,
});
