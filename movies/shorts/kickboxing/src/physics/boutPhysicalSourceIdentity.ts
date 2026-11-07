import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

/** Hash numerical source, resources and the installed native implementation independently of the cache manifest. A supplied byte reader supports immutable source-snapshot inspection without editing maintained files. */
export async function boutPhysicalSourceIdentity(
  read: (file: string) => Promise<Uint8Array> = readFile,
): Promise<string> {
  const film: string = path.resolve(import.meta.dirname, "../..");
  const root: string = path.resolve(film, "../../..");
  const files: Map<string, string> = new Map();
  /** Stable repository-relative identities survive different checkout locations. */
  function include(
    file: string,
    identity: string = path.relative(root, file).replaceAll("\\", "/"),
  ): void {
    files.set(identity, file);
  }
  /** Include executable source and numerical resources; file names are part of the digest. */
  async function collect(
    directory: string,
    identity: string = path.relative(root, directory).replaceAll("\\", "/"),
  ): Promise<void> {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const file: string = path.join(directory, entry.name);
      if (entry.isDirectory()) await collect(file, `${identity}/${entry.name}`);
      else if (/\.(?:ts|json|wasm|mjs|cjs|js)$/.test(entry.name))
        include(file, `${identity}/${entry.name}`);
    }
  }
  for (const relative of ["src/motion", "src/shots/kickboxing/ring-bout"])
    await collect(path.join(film, relative));
  for (const relative of [
    "src/assets/person/createPersonParameters.ts",
    "src/runtime/FilmEvents.ts",
    "src/physics/BoutTargetSource.ts",
    "src/physics/BoutPhysicalSettings.ts",
    "src/physics/createBoutPhysicalInput.ts",
    "src/physics/fitBoutPhysicalTargets.ts",
    "src/physics/fitBoutPhysicalLimbs.ts",
    "src/physics/fitBoutContactTargets.ts",
    "src/physics/fitBoutContactScene.ts",
    "src/physics/boutContactGroups.ts",
    "src/physics/boutContactTargetInput.ts",
    "src/physics/collectBoutFormulaResponses.ts",
    "src/physics/prepareBoutFormulaResponses.ts",
    "src/physics/boutPhysicalTrunk.ts",
    "src/physics/boutSupportPattern.ts",
    "src/physics/BoutKinematicClip.ts",
    "src/physics/boutContactBindings.ts",
    "src/physics/boutGuardPointBounds.ts",
    "src/physics/boutDynamicSegments.ts",
    "src/physics/boutPostBindings.ts",
    "src/physics/boutPhysicalSourceIdentity.ts",
  ])
    include(path.join(film, relative));
  include(path.join(film, "src/physics/boutLimbClearanceBindings.ts"));
  include(path.join(film, "src/physics/boutPhysicalPlacement.ts"));

  // Conservative package closures cover shared loft geometry, clinical constants and envelope implementations too.
  for (const relative of [
    "packages/engine/src",
    "packages/human/src",
    "packages/interface/src",
  ])
    await collect(path.join(root, relative));
  for (const relative of [
    "packages/engine/package.json",
    "packages/human/package.json",
    "packages/interface/package.json",
    "pnpm-lock.yaml",
    "pnpm-workspace.yaml",
  ])
    include(path.join(root, relative));
  const native: string = path.resolve(
    path.dirname(
      createRequire(path.join(root, "packages/engine/package.json")).resolve(
        "@dimforge/rapier3d-compat",
      ),
    ),
    "..",
  );
  await collect(native, "dependencies/@dimforge/rapier3d-compat");
  const hash: ReturnType<typeof createHash> = createHash("sha256");
  for (const [identity, file] of [...files].sort(
    ([a]: [string, string], [b]: [string, string]): number =>
      a < b ? -1 : a > b ? 1 : 0,
  )) {
    hash.update(identity);
    hash.update("\0");
    hash.update(await read(file));
    hash.update("\0");
  }
  return `sha256:${hash.digest("hex")}`;
}
