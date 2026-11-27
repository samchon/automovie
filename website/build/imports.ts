// Refuse package subpaths and source traversal except exact definition leaves.
import fs from "node:fs";
import path from "node:path";

const root: string = path.resolve(__dirname, "..");
const packages: string = path.resolve(root, "..", "packages");
const IMPORT: RegExp = /(?:from\s+|import\s*\(\s*|require\s*\(\s*|import\s+)["']([^"']+)["']/g;
const privateImports: Readonly<Record<string, string>> = {
  "src/scenes/data/SceneBuildTypes.ts|../../../../packages/motions/src/lexicon/internal/HumanSocial": path.resolve(packages, "motions/src/lexicon/internal/HumanSocial"),
  "src/scenes/data/SceneBuildTypes.ts|../../../../packages/motions/src/lexicon/internal/shoulderClasp": path.resolve(packages, "motions/src/lexicon/internal/shoulderClasp"),
  "build/checkEverydayScenes.ts|../../packages/motions/src/posture/internal/HumanColliders": path.resolve(packages, "motions/src/posture/internal/HumanColliders"),
  "build/checkEverydayScenes.ts|../../packages/motions/src/posture/internal/HumanFoot": path.resolve(packages, "motions/src/posture/internal/HumanFoot"),
  "build/checkFarewellScene.ts|../../packages/motions/src/audit/internal/AutoMovieMotionHumanAuditPartner": path.resolve(packages, "motions/src/audit/internal/AutoMovieMotionHumanAuditPartner"),
  "build/checkFarewellScene.ts|../../packages/motions/src/posture/internal/HumanHand": path.resolve(packages, "motions/src/posture/internal/HumanHand"),
  "build/checkVehicleScenes.ts|../../packages/motions/src/posture/internal/HumanColliders": path.resolve(packages, "motions/src/posture/internal/HumanColliders"),
  "build/checkVehicleScenes.ts|../../packages/motions/src/posture/internal/HumanFoot": path.resolve(packages, "motions/src/posture/internal/HumanFoot"),
  "build/checkTourists.ts|../../packages/motions/src/audit/internal/AutoMovieMotionHumanAuditTangle": path.resolve(packages, "motions/src/audit/internal/AutoMovieMotionHumanAuditTangle"),
  "build/checkTourists.ts|../../packages/motions/src/posture/internal/HumanColliders": path.resolve(packages, "motions/src/posture/internal/HumanColliders"),
  "build/checkVictoryLap.ts|../../packages/motions/src/posture/internal/HumanFoot": path.resolve(packages, "motions/src/posture/internal/HumanFoot"),
  "build/catalogue/checkSnapshotCamera.ts|../../../packages/motions/src/audit/internal/AutoMovieMotionHumanAuditTangle": path.resolve(packages, "motions/src/audit/internal/AutoMovieMotionHumanAuditTangle"),
  "build/catalogue/checkSnapshotCamera.ts|../../../packages/motions/src/posture/internal/HumanColliders": path.resolve(packages, "motions/src/posture/internal/HumanColliders"),
  "build/catalogue/checkSnapshotCamera.ts|../../../packages/motions/src/posture/internal/poseBones": path.resolve(packages, "motions/src/posture/internal/poseBones"),
  "src/playground/package/PlaygroundObjects.ts|../../../../packages/motions/src/handling/internal/HumanSheath": path.resolve(packages, "motions/src/handling/internal/HumanSheath"),
  "src/playground/package/PlaygroundObjects.ts|../../../../packages/motions/src/perform/internal/HumanObstacle": path.resolve(packages, "motions/src/perform/internal/HumanObstacle"),
};
const skippedDirectories = new Set(["node_modules", ".next", "out", ".shots"]);
const walk = (directory: string): string[] => {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry: fs.Dirent): string[] => {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) return skippedDirectories.has(entry.name) ? [] : walk(full);
    return /\.(ts|tsx|js|jsx|mjs|mdx)$/.test(entry.name) ? [full] : [];
  });
};
const inventoryLeafCache: Map<string, boolean> = new Map();
const isInventoryLeaf = (consumer: string, specifier: string, resolved: string | null): boolean => {
  if (resolved === null || consumer !== "src/motions/package/MotionInventory.ts") return false;
  if (inventoryLeafCache.has(resolved)) return inventoryLeafCache.get(resolved)!;
  const sourcePath = path.join(packages, "motions", "src");
  const sourceFile = resolved + ".ts";
  const withinMotionSources = resolved.startsWith(sourcePath + path.sep);
  const isDefinitionFile = path.basename(resolved) !== "index" && fs.existsSync(sourceFile);
  const isForwarder = isDefinitionFile && /^\s*export\s+(?:\*|\{[\s\S]*?\})\s+from\b/m.test(fs.readFileSync(sourceFile, "utf8"));
  const accepted = withinMotionSources && isDefinitionFile && !isForwarder;
  inventoryLeafCache.set(resolved, accepted);
  return accepted;
};

const violations: string[] = [];
for (const file of walk(root)) {
  if (file === __filename) continue;
  const text = fs.readFileSync(file, "utf8");
  const consumer = path.relative(root, file).replace(/\\/g, "/");
  for (const match of text.matchAll(IMPORT)) {
    const specifier = match[1]!;
    const scoped = /^(@automovie\/[^/]+)(?:\/(.+))?$/.exec(specifier);
    const deepPackageImport = scoped !== null && scoped[2] !== undefined;
    const resolved = specifier.startsWith(".") ? path.resolve(path.dirname(file), specifier) : null;
    const reachesPackage = resolved !== null && (resolved === packages || resolved.startsWith(packages + path.sep));
    const exactLeaf = reachesPackage && privateImports[consumer + "|" + specifier] === resolved;
    const inventoryLeaf = reachesPackage && isInventoryLeaf(consumer, specifier, resolved);
    if (deepPackageImport || (reachesPackage && !exactLeaf && !inventoryLeaf)) {
      violations.push(consumer + ": " + specifier);
    }
  }
}
if (violations.length) {
  console.error("The site imports a package subpath or an unapproved private source path:\n" + violations.map((violation) => "  " + violation).join("\n"));
  process.exit(1);
}
console.log("imports: package roots and exact private definition leaves only");
