import fs from "node:fs";
import http from "node:http";
import path from "node:path";

/** The path the site is built under, as `next.config.ts` sets it. */
const BASE: string = "/automovie";

/** The media type of each file extension the export holds. */
const TYPES: Readonly<Record<string, string>> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".wasm": "application/wasm",
  ".woff2": "font/woff2",
  ".png": "image/png",
};

/**
 * Serve the static export as GitHub Pages does.
 *
 * `out/` is served under `/automovie/`, the base path the site is built
 * with, on 127.0.0.1. A path that names a directory serves its `index.html`,
 * and a path that names nothing serves `404.html` with status 404.
 *
 * @param port The port to listen on; 0 takes a free one.
 * @returns The server once it listens, and the address of the site's root.
 */
export function serveExport(
  port: number,
): Promise<{ server: http.Server; address: string }> {
  const out: string = path.resolve(__dirname, "..", "out");
  const server: http.Server = http.createServer(
    (request: http.IncomingMessage, response: http.ServerResponse): void => {
      const pathname: string = decodeURIComponent(
        new URL(request.url ?? "/", "http://localhost").pathname,
      );
      const relative: string | null =
        pathname === BASE || pathname.startsWith(`${BASE}/`)
          ? pathname.slice(BASE.length)
          : null;

      // Resolve inside `out` only: a path that climbs out of it names nothing.
      let file: string | null =
        relative === null ? null : path.join(out, relative);
      if (file !== null && !file.startsWith(out)) file = null;
      if (
        file !== null &&
        fs.existsSync(file) &&
        fs.statSync(file).isDirectory()
      )
        file = path.join(file, "index.html");

      const found: boolean = file !== null && fs.existsSync(file);
      const served: string = found ? file! : path.join(out, "404.html");
      response.writeHead(found ? 200 : 404, {
        "content-type":
          TYPES[path.extname(served)] ?? "application/octet-stream",
      });
      fs.createReadStream(served).pipe(response);
    },
  );
  return new Promise(
    (
      resolve: (value: { server: http.Server; address: string }) => void,
    ): void => {
      server.listen(port, "127.0.0.1", (): void => {
        const bound: number = (server.address() as { port: number }).port;
        resolve({ server, address: `http://127.0.0.1:${bound}${BASE}/` });
      });
    },
  );
}
