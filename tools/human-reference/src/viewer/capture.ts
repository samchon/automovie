import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import type { CaptureView } from "./CaptureView.ts";
import { captureViewer } from "./captureViewer.ts";

/**
 * Runs one hardware capture job from explicit viewer, camera, browser module and output declarations.
 *
 * @evidence contracts/common.md#principled-implementation Parses the camera document and explicit local capture options before delegating to captureViewer.
 * @evidence contracts/common.md#clear-and-simple-design The executable owns file and option admission while the browser capture owner realizes views.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No dataset, hidden camera preset or fabricated renderer is selected on missing input.
 * @evidence contracts/common.md#meaningful-documentation The comment states the required local renderer, camera and output declarations.
 * @evidence contracts/performance.md#efficient-algorithms Reads the camera document once plus linear option parsing; actual render and image costs belong to captureViewer.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the common capture owner and keeps each output job independent.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains parsed camera data through the delegated job and acquires no browser or listener itself.
 */
export async function capture(): Promise<void> {
  const args: Map<string, string> = new Map();
  for (let index: number = 2; index < process.argv.length; index += 2) {
    const name: string = process.argv[index];
    const value: string | undefined = process.argv[index + 1];
    if (!name.startsWith("--") || value === undefined || args.has(name))
      throw new Error("Capture expects unique named option/value pairs");
    args.set(name, value);
  }
  const required: (name: string) => string = (name: string): string => {
    const value: string | undefined = args.get(name);
    if (!value) throw new Error(`Missing capture option ${name}`);
    return value;
  };
  const cameraFile: string = path.resolve(required("--views"));
  const cameraBytes: Buffer = fs.readFileSync(cameraFile);
  const cameraSha256: string = crypto
    .createHash("sha256")
    .update(cameraBytes)
    .digest("hex");
  const views: CaptureView[] = JSON.parse(
    cameraBytes.toString("utf8"),
  ) as CaptureView[];
  if (!Array.isArray(views) || !views.length)
    throw new Error("Capture views must be a nonempty array");
  await captureViewer({
    url: required("--url"),
    playwright: path.resolve(required("--playwright")),
    output: path.resolve(required("--output")),
    views,
    cameraSource: { file: cameraFile, sha256: cameraSha256 },
    construction: args.get("--construction") === "true",
  });
}
await capture();
