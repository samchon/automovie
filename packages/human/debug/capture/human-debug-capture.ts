import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";

import { HUMAN_DEBUG_ROUTES } from "../contracts/HUMAN_DEBUG_ROUTES";
import { HumanDebugOptions } from "../contracts/HumanDebugOptions";
import type { IHumanDebugCaptureArguments } from "./IHumanDebugCaptureArguments";
import { parseHumanDebugCaptureArguments } from "./parseHumanDebugCaptureArguments";

/**
 * Save frames of the debug viewer's image route as files, one request per shot.
 *
 * Run from the repository root against a running debug viewer:
 *
 * ```powershell
 * node_modules\.bin\ttsx.CMD -P packages\human\tsconfig.debug.scripts.json packages\human\debug\capture\human-debug-capture.ts --out packages\human\.shots\<you>\<round> --base "person=f1;piece=foot.loft" --shot "front:camera=front" --shot "top:camera=top;curves=none"
 * ```
 *
 * `--base` is the search text every shot starts from and each `--shot <name>:<search text>`
 * replaces its variables; `;` separates variables because the Windows shim of ttsx reads `&` as a
 * command separator. The text is checked by `HumanDebugOptions` before any request, so a typo
 * fails here; `keep=1` passes through to the route, so a series of shots is drawn on one loaded
 * source. Every shot asks a new frame (a UUID `fresh` nonce unless the text gives one).
 * The nonce is independent of the file name: valid shot names can contain dots or exceed
 * the frame nonce's sixty-four-character bound.
 *
 * A shot is kept only when the route answers `new-requested-frame` and the bytes received hash to
 * `x-human-png-sha256`; it is written as `<name>.png`, and `receipt.json` lists every kept shot with
 * its URL, its bytes' SHA-256 and the route's headers (source hash, capture time). A shot that
 * fails keeps no PNG and adds one line with its cause to `<person>-FAILED.txt`, named by the
 * shot's `person` variable, and the run goes on to the next shot and ends with exit code 1. While
 * the route answers 503, the shot is asked again after the answer's `retry-after`, for up to
 * {@link GATE_WAIT}. That status alone does not establish why the server could not serve it.
 * Requests use
 * `node:http` without a timeout, because one person's generation takes minutes, longer than
 * `fetch`'s header timeout. The program draws nothing itself: the server's resident page draws
 * every frame.
 */
async function main(): Promise<void> {
  const parsed: IHumanDebugCaptureArguments = parseHumanDebugCaptureArguments(process.argv.slice(2));
  await fs.mkdir(parsed.out, { recursive: true });
  const receipt: IReceiptRow[] = [];
  let failed: boolean = false;
  for (const shot of parsed.shots) {
    const query: URLSearchParams = new URLSearchParams(parsed.base);
    for (const [name, value] of new URLSearchParams(shot.query)) query.set(name, value);
    const checked: { notices: string[] } = HumanDebugOptions.parse(query, ["fresh", "keep"]);
    if (checked.notices.length !== 0) throw new Error("Shot " + shot.name + ": " + checked.notices.join("; "));
    if (!query.has("fresh")) query.set("fresh", randomUUID());
    const url: string = parsed.origin + HUMAN_DEBUG_ROUTES.images + shot.name + ".png?" + query.toString();
    try {
      const row: IReceiptRow = await capture(url, path.join(parsed.out, shot.name + ".png"));
      receipt.push(row);
      process.stdout.write(JSON.stringify({ shot: shot.name, captured: row.headers[HUMAN_DEBUG_ROUTES.headers.captured], source: row.headers[HUMAN_DEBUG_ROUTES.headers.source] }) + "\n");
    } catch (error) {
      failed = true;
      const message: string = shot.name + ": " + (error instanceof Error ? error.message : String(error)).replace(/\s+/g, " ");
      await fs.appendFile(path.join(parsed.out, (query.get("person") ?? "shot") + "-FAILED.txt"), message + "\n");
      process.stdout.write(JSON.stringify({ shot: shot.name, failed: message }) + "\n");
    }
  }
  await fs.writeFile(path.join(parsed.out, "receipt.json"), JSON.stringify(receipt, null, 2) + "\n");
  if (failed) process.exitCode = 1;
}

/** How long a shot waits while its route answers 503, ms: a burst of saves can last minutes. */
const GATE_WAIT: number = 30 * 60 * 1000;

/** One kept shot of the receipt. */
interface IReceiptRow {
  /** File name in the output directory. */
  file: string;

  /** The URL asked. */
  url: string;

  /** SHA-256 of the saved bytes, equal to the route's `x-human-png-sha256`. */
  sha256: string;

  /** The route's headers by name (`HUMAN_DEBUG_ROUTES.headers`). */
  headers: Record<string, string>;
}

/** An HTTP answer read whole. */
interface IAnswer {
  /** Status code. */
  status: number;

  /** Lower-case header names to their values. */
  headers: Record<string, string>;

  /** The body bytes. */
  body: Buffer;
}

/**
 * Ask one frame, check it and save it.
 *
 * @param url The frame's address.
 * @param file Where its bytes go.
 * @returns The receipt row.
 * @throws {Error} When the route refuses, answers a kept frame, or the bytes do not hash to its header.
 */
async function capture(url: string, file: string): Promise<IReceiptRow> {
  const answer: IAnswer = await gated(url);
  if (answer.status !== 200) throw new Error("HTTP " + answer.status + ": " + answer.body.toString("utf8").slice(0, 400));
  const headers: Record<string, string> = Object.fromEntries(
    Object.values(HUMAN_DEBUG_ROUTES.headers).map((name: string): [string, string] => [name, answer.headers[name] ?? ""]),
  );
  if (headers[HUMAN_DEBUG_ROUTES.headers.cache] !== "new-requested-frame")
    throw new Error("the route answered " + headers[HUMAN_DEBUG_ROUTES.headers.cache] + ", not a new frame");
  const sha256: string = createHash("sha256").update(answer.body).digest("hex");
  if (sha256 !== headers[HUMAN_DEBUG_ROUTES.headers.png])
    throw new Error("bytes hash " + sha256 + " but the header says " + headers[HUMAN_DEBUG_ROUTES.headers.png]);
  await fs.writeFile(file, answer.body);
  return { file: path.basename(file), url, sha256, headers };
}

/**
 * GET a frame, waiting while the route answers 503. Ask again after its
 * `retry-after` (10 s when absent) until {@link GATE_WAIT} has passed; this
 * caller does not classify the server's source, module or shutdown cause.
 *
 * @param url The frame's address.
 * @returns The first answer that is not a 503, or the last one.
 */
async function gated(url: string): Promise<IAnswer> {
  const until: number = Date.now() + GATE_WAIT;
  for (;;) {
    const answer: IAnswer = await get(url);
    if (answer.status !== 503 || Date.now() > until) return answer;
    const after: number = Number(answer.headers["retry-after"]);
    await new Promise<boolean>((resolve: (done: boolean) => void): void => {
      setTimeout((): void => resolve(true), 1000 * (Number.isFinite(after) && after > 0 ? after : 10));
    });
  }
}

/**
 * GET one URL with no timeout and read the whole answer.
 *
 * @param url The address.
 * @returns The status, headers and body.
 */
function get(url: string): Promise<IAnswer> {
  return new Promise<IAnswer>((resolve: (answer: IAnswer) => void, reject: (error: Error) => void): void => {
    http
      .get(url, (response: http.IncomingMessage): void => {
        const chunks: Buffer[] = [];
        response.on("data", (chunk: Buffer): void => {
          chunks.push(chunk);
        });
        response.on("end", (): void => {
          const headers: Record<string, string> = {};
          for (const [key, value] of Object.entries(response.headers)) if (typeof value === "string") headers[key] = value;
          resolve({ status: response.statusCode ?? 0, headers, body: Buffer.concat(chunks) });
        });
        response.on("error", reject);
      })
      .on("error", reject);
  });
}

main().catch((error: unknown): void => {
  process.stderr.write((error instanceof Error ? (error.stack ?? error.message) : String(error)) + "\n");
  process.exitCode = 1;
});
