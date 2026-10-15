import { execFileSync } from "node:child_process";
import fs from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";
import type { Plugin, ViteDevServer } from "vite";

/** Path the dev server accepts capture sets on. */
const ENDPOINT: string = "/__automovie/capture";

/** Largest accepted request body, bytes; a 16-view set of 1600x1200 PNGs is far below it. */
const MAX_BODY_BYTES: number = 256 * 1024 * 1024;

/** One captured image, as the page posts it. */
interface IShot {
  /** File name inside the output folder, `[A-Za-z0-9._-]+.png`. */
  file: string;

  /** PNG bytes, base64. */
  png: string;
}

/**
 * Let a page served by the dev server save a set of screenshots into the repository's `.shots/output` and their metadata outside that folder.
 *
 * A page posts `{ name, shots, metadata }` to `/__automovie/capture`. Each shot is written to `.shots/output/<file>`, and `.shots/captures/<name>.json` receives the page's metadata (such as view, document hash and WebGL renderer) plus what only the server knows: the source commit, the paths with uncommitted changes and the write time. Names and files are restricted to `[A-Za-z0-9._-]`, so a request cannot write outside those folders. The response lists the written paths. Pages without a capture action never call it, and a production build has no dev server, so the endpoint exists only while developing.
 *
 * @param props Repository root
 * @returns The Vite plugin
 */
export function createCaptureSinkPlugin(props: { repository: string }): Plugin {
  const output: string = path.join(props.repository, ".shots", "output");
  const metadataDir: string = path.join(props.repository, ".shots", "captures");
  const safe: RegExp = /^[A-Za-z0-9._-]+$/;

  const source: () => { commit: string; dirty: string[] } = (): {
    commit: string;
    dirty: string[];
  } => {
    const git: (args: string[]) => string = (args: string[]): string =>
      execFileSync("git", args, {
        cwd: props.repository,
        encoding: "utf8",
      }).trim();
    return {
      commit: git(["rev-parse", "HEAD"]),
      dirty: git(["status", "--porcelain", "--", "packages"])
        .split("\n")
        .filter((line: string): boolean => line.length !== 0),
    };
  };

  const handle: (
    request: IncomingMessage,
    response: ServerResponse,
  ) => Promise<void> = async (
    request: IncomingMessage,
    response: ServerResponse,
  ): Promise<void> => {
    const chunks: Buffer[] = [];
    let size: number = 0;
    for await (const chunk of request) {
      size += (chunk as Buffer).length;
      if (size > MAX_BODY_BYTES) throw new Error("capture body too large");
      chunks.push(chunk as Buffer);
    }
    const body: { name: string; shots: IShot[]; metadata: unknown } =
      JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!safe.test(body.name)) throw new Error(`bad capture name ${body.name}`);
    for (const shot of body.shots)
      if (!safe.test(shot.file) || !shot.file.endsWith(".png"))
        throw new Error(`bad capture file ${shot.file}`);
    fs.mkdirSync(output, { recursive: true });
    fs.mkdirSync(metadataDir, { recursive: true });
    const files: string[] = body.shots.map((shot: IShot): string => {
      const file: string = path.join(output, shot.file);
      fs.writeFileSync(file, Buffer.from(shot.png, "base64"));
      return file;
    });
    const metadata: string = path.join(metadataDir, `${body.name}.json`);
    fs.writeFileSync(
      metadata,
      `${JSON.stringify(
        {
          name: body.name,
          source: source(),
          writtenAt: new Date().toISOString(),
          files: files.map((file: string): string =>
            path.relative(props.repository, file).split(path.sep).join("/"),
          ),
          metadata: body.metadata,
        },
        null,
        2,
      )}\n`,
    );
    response.setHeader("content-type", "application/json");
    response.end(JSON.stringify({ files, metadata }));
  };

  return {
    name: "automovie-capture-sink",
    configureServer(server: ViteDevServer): void {
      server.middlewares.use(
        ENDPOINT,
        (request: IncomingMessage, response: ServerResponse): void => {
          if (request.method !== "POST") {
            response.statusCode = 405;
            response.end();
            return;
          }
          handle(request, response).catch((error: unknown): void => {
            response.statusCode = 400;
            response.end(error instanceof Error ? error.message : String(error));
          });
        },
      );
    },
  };
}
