// Serve the static export as GitHub Pages does, for looking at a build.
//
//   pnpm run serve [port]
//
// Listens on 127.0.0.1 and the given port, 4173 when absent, until stopped.
import { serveExport } from "./serveExport";

serveExport(Number(process.argv[2] ?? 4173))
  .then(({ address }: { address: string }): void => {
    console.log(`serving the export at ${address}`);
  })
  .catch((error: unknown): void => {
    console.error(error);
    process.exit(1);
  });
