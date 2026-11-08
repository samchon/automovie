import { loadImage } from "@napi-rs/canvas";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { HumanNodePaths } from "./HumanNodePaths";

/** Verifies a nonempty one-to-one PNG inventory, exact hashes and native decode; this establishes no visual acceptance. */
export async function NodeCanvasInspect(
  argv: readonly string[],
): Promise<void> {
  if (argv.length === 0)
    throw new Error(
      "Usage: pnpm --dir packages/human node:inspect <packet-directory>...",
    );
  const errors: unknown[] = [];
  for (const packet of argv) {
    try {
      await inspect(packet);
    } catch (error: unknown) {
      errors.push(error);
      process.stderr.write(
        (error instanceof Error
          ? (error.stack ?? error.message)
          : String(error)) + "\n",
      );
    }
  }
  if (errors.length !== 0)
    throw new AggregateError(errors, "PNG packet inspection failed", {
      cause: errors[0],
    });
}

/** Inspects each explicit packet independently in the same process, so a refusal does not hide later packets. */
async function inspect(argument: string): Promise<void> {
  const task: string = await fs.realpath(
    HumanNodePaths.resolve("packages/human/.shots/node_canvas_xhigh"),
  );
  const packet: string = await fs.realpath(path.resolve(argument));
  if (!packet.startsWith(task + path.sep))
    throw new Error("Inspection packet is outside the verified task directory");
  const started: number = performance.now();
  const manifestBytes: Buffer = await fs.readFile(
    path.join(packet, "manifest.json"),
  );
  const manifest: unknown = JSON.parse(manifestBytes.toString("utf8"));
  if (!isRecord(manifest) || !Array.isArray(manifest.frames))
    throw new Error("Packet manifest has no actual frames");
  const rows: unknown[] = manifest.frames;
  const results: {
    file: string;
    sha256?: string;
    width?: number;
    height?: number;
    status: string;
    error?: string;
  }[] = [];
  const names: Map<string, string> = new Map();
  const duplicates: string[] = [];
  const files: string[] = (await fs.readdir(packet)).filter(
    (file: string): boolean => /\.png$/i.test(file),
  );
  /** Windows names address the same file without regard to ASCII case; other hosts retain their exact spelling. */
  const key: (name: string) => string = (name: string): string =>
    process.platform === "win32" ? name.toLowerCase() : name;
  for (const value of rows) {
    let name: string = "unavailable-row";
    try {
      if (
        !isRecord(value) ||
        typeof value.file !== "string" ||
        path.basename(value.file) !== value.file ||
        !/\.png$/i.test(value.file) ||
        typeof value.sha256 !== "string" ||
        !isRecord(value.camera)
      )
        throw new Error("Invalid saved PNG frame record");
      name = value.file;
      if (names.has(key(name))) {
        duplicates.push(name);
        throw new Error("Duplicate physical PNG frame: " + name);
      }
      names.set(key(name), name);
      const bytes: Buffer = await fs.readFile(path.join(packet, name));
      const sha256: string = createHash("sha256").update(bytes).digest("hex");
      if (sha256 !== value.sha256)
        throw new Error("Saved PNG SHA differs from the frame");
      const decoded: Awaited<ReturnType<typeof loadImage>> =
        await loadImage(bytes);
      if (
        decoded.width !== value.camera.width ||
        decoded.height !== value.camera.height
      )
        throw new Error("Decoded PNG dimensions differ from the actual camera");
      results.push({
        file: name,
        sha256,
        width: decoded.width,
        height: decoded.height,
        status: "hash-and-native-decode-valid",
      });
    } catch (error: unknown) {
      results.push({
        file: name,
        status: "failed",
        error:
          error instanceof Error
            ? (error.stack ?? error.message)
            : String(error),
      });
    }
  }
  const physical: Set<string> = new Set(files.map(key));
  const unexpected: string[] = files.filter(
    (file: string): boolean => !names.has(key(file)),
  );
  const missing: string[] = [...names]
    .filter(([name]: [string, string]): boolean => !physical.has(name))
    .map(([, file]: [string, string]): string => file);
  const failures: number = results.filter(
    (result: (typeof results)[number]): boolean => result.status === "failed",
  ).length;
  const declaredCountMismatch: boolean =
    typeof manifest.pngCount !== "number" ||
    !Number.isSafeInteger(manifest.pngCount) ||
    manifest.pngCount !== rows.length;
  const failed: boolean =
    rows.length === 0 ||
    failures !== 0 ||
    duplicates.length !== 0 ||
    unexpected.length !== 0 ||
    missing.length !== 0 ||
    physical.size !== names.size ||
    declaredCountMismatch;
  const report: Record<string, unknown> = {
    status: failed ? "failed" : "png-inventory-valid",
    packet,
    manifestSha256: createHash("sha256").update(manifestBytes).digest("hex"),
    observedUtc: new Date().toISOString(),
    milliseconds: performance.now() - started,
    rows: rows.length,
    uniqueFrames: names.size,
    declaredPngs: manifest.pngCount ?? null,
    declaredCountMismatch,
    actualPngs: files.length,
    emptyFrames: rows.length === 0,
    duplicateFrames: duplicates,
    unexpectedPngs: unexpected,
    missingPngs: missing,
    failures,
    accounting:
      "Row decode failures and structural inventory facts overlap; they are not an additive failure total.",
    visualAcceptance:
      "Not established by decoding; this verdict does not accept source generation, partial capture completion or appearance.",
    results,
  };
  await fs.writeFile(
    path.join(packet, "decode-verification.json"),
    JSON.stringify(report, null, 2),
  );
  process.stdout.write(
    JSON.stringify({
      packet,
      status: report.status,
      rows: rows.length,
      actualPngs: files.length,
      failures,
      duplicateFrames: duplicates.length,
      unexpectedPngs: unexpected.length,
      missingPngs: missing.length,
      milliseconds: report.milliseconds,
    }) + "\n",
  );
  if (failed) process.exitCode = 1;
}

/** Narrows parsed object records without assuming a manifest schema. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

if (require.main === module)
  NodeCanvasInspect(process.argv.slice(2)).catch((error: unknown): void => {
    process.stderr.write(
      (error instanceof Error
        ? (error.stack ?? error.message)
        : String(error)) + "\n",
    );
    process.exitCode = 1;
  });
