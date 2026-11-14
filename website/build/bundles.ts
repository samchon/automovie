// Refuse a page that plays baked scenes but ships the motion or Human code.
//
//   pnpm run bundles     (after `next build`; `build` runs it)
//
// The landing page, the scene gallery, a scene's page and the object
// gallery only pose baked placements and build archetypes, so neither
// `@automovie/motions` nor `@automovie/human` belongs in what they load:
// their initial chunks, and the chunk that plays a baked take, which they
// load on demand. A string literal only each package holds marks it, since
// minifying keeps string literals. The playground, the Human page's
// inspector and the motion reference may load them; they are not checked.
import fs from "node:fs";
import path from "node:path";

/** The routes that must not carry the packages, as Next's manifest names them. */
const ROUTES: readonly string[] = [
  "/(docs)/[[...mdxPath]]/page",
  "/(docs)/scenes/page",
  "/(docs)/scenes/[id]/page",
  "/(docs)/objects/page",
];

/** A string literal only each package holds, from an error it throws. */
const MARKERS: Readonly<Record<string, string>> = {
  "@automovie/motions": "give every performer its own subject id",
  "@automovie/human": "Common and head source stature arithmetic disagree",
};

/** A string the chunk that plays a baked take holds, from an error it throws. */
const PLAYER: string = "The baked scenes did not load";

const next: string = path.resolve(__dirname, "..", ".next");
const manifest: { pages: Record<string, string[]> } = JSON.parse(
  fs.readFileSync(path.join(next, "app-build-manifest.json"), "utf8"),
);
const read: (file: string) => string = (file: string): string =>
  fs.readFileSync(path.join(next, file), "utf8");

// The chunks to check: each route's own, and the player's.
const chunks: Map<string, string> = new Map();
for (const route of ROUTES) {
  const files: string[] | undefined = manifest.pages[route];
  if (files === undefined)
    throw new Error(`The build has no route ${route}; update build/bundles.ts`);
  for (const file of files) if (file.endsWith(".js")) chunks.set(file, route);
}
const all: string[] = fs
  .readdirSync(path.join(next, "static", "chunks"), { recursive: true })
  .map((file: string | Buffer): string =>
    path.join("static", "chunks", String(file)).replaceAll("\\", "/"),
  )
  .filter((file: string): boolean => file.endsWith(".js"));
const players: string[] = all.filter((file: string): boolean =>
  read(file).includes(PLAYER),
);
if (players.length === 0)
  throw new Error("No chunk plays a baked take; update build/bundles.ts");
for (const file of players) chunks.set(file, "the baked-take player");

const violations: string[] = [];
for (const [file, owner] of chunks) {
  const text: string = read(file);
  for (const [name, marker] of Object.entries(MARKERS))
    if (text.includes(marker))
      violations.push(`${owner}: ${file} carries ${name}`);
}
if (violations.length !== 0) {
  console.error(
    "A page that plays baked scenes ships motion or Human code:\n" +
      violations.map((line: string): string => `  ${line}`).join("\n"),
  );
  process.exit(1);
}
console.log(
  `bundles: ${chunks.size} chunks of ${ROUTES.length} routes and the player carry neither package`,
);
