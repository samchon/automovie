import { createHash } from "node:crypto";
import fs from "node:fs/promises";
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
 * node_modules\.bin\ttsx.CMD --no-plugins --noCheck -P packages\human\tsconfig.debug.scripts.json packages\human\debug\capture\human-debug-capture.ts --out packages\human\.shots\<you>\<round> --base "person=f1;piece=foot.loft" --shot "front:camera=front" --shot "top:camera=top;curves=none"
 * ```
 *
 * `--base` is the search text every shot starts from and each `--shot <name>:<search text>`
 * replaces its variables; `;` separates variables because the Windows shim of ttsx reads `&` as a
 * command separator. The text is checked by `HumanDebugOptions` before any request, so a typo
 * fails here. Each shot writes `<name>.png` and `<name>.json` with the response headers and an
 * independent SHA-256 of the bytes received; a hash that differs from `x-human-png-sha256` fails.
 * The program draws nothing itself: the server's resident page draws every frame.
 */
async function main(): Promise<void> {
  const parsed: IHumanDebugCaptureArguments = parseHumanDebugCaptureArguments(process.argv.slice(2));
  await fs.mkdir(parsed.out, { recursive: true });
  for (const shot of parsed.shots) {
    const query: URLSearchParams = new URLSearchParams(parsed.base);
    for (const [name, value] of new URLSearchParams(shot.query)) query.set(name, value);
    const checked: { notices: string[] } = HumanDebugOptions.parse(query, ["fresh"]);
    if (checked.notices.length !== 0) throw new Error("Shot " + shot.name + ": " + checked.notices.join("; "));
    if (!query.has("fresh")) query.set("fresh", shot.name + "-" + Date.now().toString(36));
    const url: string = parsed.origin + HUMAN_DEBUG_ROUTES.images + shot.name + ".png?" + query.toString();
    const response: Response = await fetch(url);
    const bytes: Buffer = Buffer.from(await response.arrayBuffer());
    if (!response.ok) throw new Error("Shot " + shot.name + " answered HTTP " + response.status + ": " + bytes.toString("utf8"));
    const sha256: string = createHash("sha256").update(bytes).digest("hex");
    const headers: Record<string, string> = Object.fromEntries(
      Object.values(HUMAN_DEBUG_ROUTES.headers).map((name: string): [string, string] => [name, response.headers.get(name) ?? ""]),
    );
    if (sha256 !== headers[HUMAN_DEBUG_ROUTES.headers.png])
      throw new Error("Shot " + shot.name + " bytes hash " + sha256 + " but the header says " + headers[HUMAN_DEBUG_ROUTES.headers.png]);
    const file: string = path.join(parsed.out, shot.name + ".png");
    await fs.writeFile(file, bytes);
    await fs.writeFile(path.join(parsed.out, shot.name + ".json"), JSON.stringify({ url, sha256, headers }, null, 2));
    process.stdout.write(JSON.stringify({ file, cache: headers[HUMAN_DEBUG_ROUTES.headers.cache], bytes: bytes.length }) + "\n");
  }
}

main().catch((error: unknown): void => {
  process.stderr.write((error instanceof Error ? (error.stack ?? error.message) : String(error)) + "\n");
  process.exitCode = 1;
});
