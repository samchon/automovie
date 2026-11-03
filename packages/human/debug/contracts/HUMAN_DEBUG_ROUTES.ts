/**
 * The server paths and response headers of the debug viewer, shared by the server, the page, the
 * capture CLI and the README examples.
 *
 * Every path is under one prefix so the viewer's middleware never shadows Vite's own routes. The
 * page is the one HTML entry at the package root; frames, batches and diagnostics are answered by
 * the server plugins.
 */
export const HUMAN_DEBUG_ROUTES: {
  readonly port: number;
  readonly page: string;
  readonly prefix: string;
  readonly images: string;
  readonly batch: string;
  readonly index: string;
  readonly source: string;
  readonly status: string;
  readonly compiler: string;
  readonly headers: {
    readonly source: string;
    readonly cache: string;
    readonly attempts: string;
    readonly png: string;
    readonly captured: string;
    readonly query: string;
    readonly gpu: string;
    readonly notices: string;
  };
} = {
  // The default port lies outside the workers' own range 5200 to 5299; `AUTOMOVIE_HUMAN_PORT`
  // replaces it.
  port: 5197,
  page: "/debug.html",
  prefix: "/human-debug/",
  images: "/human-debug/images/",
  batch: "/human-debug/batch/",
  index: "/human-debug/index.json",
  source: "/human-debug/source.json",
  status: "/human-debug/status.json",
  compiler: "/human-debug/compiler.json",
  headers: {
    source: "x-human-source-sha256",
    cache: "x-human-cache",
    attempts: "x-human-load-attempts",
    png: "x-human-png-sha256",
    captured: "x-human-captured-utc",
    query: "x-human-query",
    gpu: "x-human-gpu",
    notices: "x-human-notices",
  },
};
