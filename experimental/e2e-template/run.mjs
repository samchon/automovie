// End-to-end check of what `@automovie/template` creates, against the packages
// of this checkout instead of the npm registry.
//
//   node experimental/e2e-template/run.mjs <production|workspace> [--keep]
//
// The checkout must be installed and built (`pnpm install`, `pnpm run build`),
// because the published packages ship `lib/`. The run then:
//
// 1. packs every public package under `packages/` into a tarball directory;
// 2. installs the packed `automovie` CLI into a tool directory and creates the
//    layout with it: a single production, or a workspace root to which the
//    workspace's own installed CLI adds `shorts/alpha` and `series/beta`;
// 3. appends pnpm `overrides` to the created `pnpm-workspace.yaml`, so every
//    `@automovie/*` package and `automovie`, direct or transitive, resolves to
//    its tarball while the scaffold's `catalog:automovie` references stay as
//    created, and checks the lockfile names every tarball;
// 4. runs the created scripts: `lint`, `test`, `build` in each production, and
//    `evidence`, including a nested test that imports the installed SDK;
// 5. loads those SDK imports in the development and built inspector pages,
//    and exercises Play and Pause in the pinned headless browser;
// 6. compares an authored edit through completed Viewer samples, Draw and
//    the exact decoded delivery, then saves and opens a separate motion take.
//
// Packing `@automovie/template` runs its `prepare` script, which rebuilds the
// checkout's `packages/template/generated`, so run one layout at a time per
// checkout; CI runs each layout in its own job.
//
// A failed install stops the run; every later check runs even when an earlier
// one fails, so one run reports every failure. The work directory, under the
// system temporary directory, is removed after a passing run and kept after a
// failing one, or always with `--keep`.
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import { createRequire } from "node:module";
import * as os from "node:os";
import * as path from "node:path";

import { installedSdkTestSource } from "./installedSdkTestSource.mjs";

const ROOT = path.resolve(import.meta.dirname, "../..");
const layout = process.argv[2];
const keep = process.argv.includes("--keep");
if (layout !== "production" && layout !== "workspace") {
  console.error(
    "usage: node experimental/e2e-template/run.mjs <production|workspace> [--keep]",
  );
  process.exit(2);
}

const work = fs.realpathSync.native(
  fs.mkdtempSync(path.join(os.tmpdir(), `automovie-e2e-${layout}-`)),
);
const results = [];

/** Run one command, echoing it, and record whether it exited with 0. */
const run = (label, command, args, cwd) => {
  const line = [command, ...args]
    .map((part) => (/\s/.test(part) ? `"${part}"` : part))
    .join(" ");
  console.log(`\n=== ${label}\n$ ${line}\n  (in ${cwd})`);
  // PowerShell resolves Windows command shims without relying on cmd syntax.
  const windowsInvocation =
    "& " +
    [command, ...args]
      .map((part) => `'${part.replaceAll("'", "''")}'`)
      .join(" ") +
    "; exit $LASTEXITCODE";
  const result =
    process.platform === "win32"
      ? spawnSync(
          "powershell.exe",
          ["-NoProfile", "-Command", windowsInvocation],
          { cwd, stdio: "inherit" },
        )
      : spawnSync(command, args, { cwd, stdio: "inherit" });
  const ok = result.status === 0;
  results.push({ label, ok });
  return ok;
};

/** Print every recorded result, clean up, and exit with the verdict. */
const finish = () => {
  const failed = results.filter((entry) => !entry.ok);
  console.log(
    `\n=== ${layout}: ${results.length - failed.length}/${results.length} passed`,
  );
  for (const entry of results)
    console.log(`  ${entry.ok ? "pass" : "FAIL"}  ${entry.label}`);
  if (failed.length === 0 && !keep)
    fs.rmSync(work, { recursive: true, force: true });
  else console.log(`\nwork directory kept: ${work}`);
  process.exit(failed.length === 0 ? 0 : 1);
};

// 1. Pack every public package of the checkout.
const tarballs = path.join(work, "tarballs");
fs.mkdirSync(tarballs);
const packed = {};
for (const directory of fs.readdirSync(path.join(ROOT, "packages"))) {
  const folder = path.join(ROOT, "packages", directory);
  const manifestFile = path.join(folder, "package.json");
  if (!fs.existsSync(manifestFile)) continue;
  const manifest = JSON.parse(fs.readFileSync(manifestFile, "utf8"));
  if (manifest.private === true) continue;
  if (!fs.existsSync(path.join(folder, "lib"))) {
    console.error(
      `${manifest.name} has no lib/; run pnpm run build at the checkout root first.`,
    );
    process.exit(2);
  }
  if (
    !run(
      `pack ${manifest.name}`,
      "pnpm",
      ["pack", "--pack-destination", tarballs],
      folder,
    )
  )
    finish();
  const file = path.join(
    tarballs,
    `${manifest.name.replace(/^@/, "").replace("/", "-")}-${manifest.version}.tgz`,
  );
  if (!fs.existsSync(file)) {
    console.error(`pnpm pack did not write ${file}`);
    process.exit(1);
  }
  packed[manifest.name] = file;
}

/** The pnpm `overrides` that bind every packed package to its tarball. */
const overrides = () =>
  [
    "",
    "# e2e-template: resolve the AutoMovie packages to this checkout's tarballs.",
    "overrides:",
    ...Object.entries(packed).map(
      ([name, file]) => `  "${name}": "file:${file.split(path.sep).join("/")}"`,
    ),
    "",
  ].join("\n");

/** Bind an installation's `pnpm-workspace.yaml` to the tarballs. */
const bind = (directory) => {
  const file = path.join(directory, "pnpm-workspace.yaml");
  const text = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  if (/^overrides:/m.test(text))
    throw new Error(`${file} already has overrides; the e2e cannot bind it.`);
  fs.writeFileSync(file, text + overrides());
};

/** Record whether the lockfile resolves every packed package to its tarball. */
const verifyLockfile = (directory) => {
  const lockfile = fs.readFileSync(
    path.join(directory, "pnpm-lock.yaml"),
    "utf8",
  );
  const missing = Object.values(packed)
    .map((file) => path.basename(file))
    .filter((name) => !lockfile.includes(name));
  console.log(
    `\n=== lockfile resolves every package to a local tarball\n` +
      (missing.length === 0
        ? "  all present"
        : `  missing: ${missing.join(", ")}`),
  );
  results.push({
    label: "lockfile resolves every package to a local tarball",
    ok: missing.length === 0,
  });
};

const install = (directory) =>
  run("pnpm install", "pnpm", ["install", "--no-frozen-lockfile"], directory);

/** Exercise the runtime project selected for a discovered SDK consumer. */
const addSdkConsumer = (directory, { parity = true } = {}) => {
  const nested = path.join(directory, "test", "features", "installed-sdk");
  fs.mkdirSync(nested, { recursive: true });
  const contactBody = JSON.parse(
    fs.readFileSync(path.join(ROOT, "test", "src", "features", "internal", "MOTION_HUMAN_PEOPLE.json"), "utf8"),
  )["f-average"];
  fs.writeFileSync(
    path.join(nested, "test_installed_sdk.ts"),
    installedSdkTestSource(contactBody),
  );
  fs.writeFileSync(
    path.join(directory, "src", "composition", "films", "starter.ts"),
    `import { createBuilding, createEnvironment, createEnvironmentProp } from "@automovie/archetypes/environments";
import { createBookcase, createSeat } from "@automovie/archetypes/furniture";
import { compileDefinedShot, defineShot } from "@automovie/engine";
import type { IAutoMovieCompiledDefinedShot, IAutoMovieEnvironment, IAutoMovieModel, IAutoMovieStage } from "@automovie/interface";
import {
  type IAutoMovieSceneObject,
  buildModel,
  buildScene,
  collectAutoMovieOwnedResources,
} from "@automovie/render";

import type { IFilm } from "../../IFilm";
import type { IFilmProduction } from "../../IFilmProduction";

/**
 * A packed-SDK room exercised by the generated production's existing film.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Defines a shot from the installed room and furniture outputs. The compiler checks the authored camera and depth bound. A compiler refusal or missing walkable entrance threshold stops the mount before buildScene places the models that buildModel produces.
 * @evidence contracts/development/implementation.md#efficient-algorithms The Viewer and capture share the same scene factory. Each mount compiles the room once, indexes models by id and builds a distinct object for each scene node. Each seek updates world matrices on the retained scene. Disposal collects and releases the scene's owned resources, then clears the scene.
 */
export function starter(): IFilm {
  return {
    durationSeconds: 2,
    fps: 24,
    width: 640,
    height: 360,
    create: async (): Promise<IFilmProduction> => {
      const room: IAutoMovieEnvironment = createEnvironment({
        id: "installed-room",
        items: {
          hall: { use: createBuilding({ levels: [{
            id: "ground",
            rooms: { studio: [0, 0, 6, 4] },
            openings: [{ id: "entry", kind: "passage", between: ["studio", null], edge: [[0, 0], [6, 0]], width: 1.2, height: 2.1 }],
          }] }) },
          bench: { use: createEnvironmentProp({ model: createSeat({ kind: "bench" }) }), at: { anchor: "hall/ground/studio" } },
          bookcase: { use: createEnvironmentProp({ model: createBookcase() }), at: { x: 4.6, y: 0, z: 2.85 } },
        },
      });
      const id: string = "starter";
      const description: string = "A furnished room with an open entrance";
      const target = { kind: "point" as const, point: { x: 2.8, y: 0.8, z: 1.6 } };
      const stage: IAutoMovieStage = {
        ...room.stage,
        scene: { id, name: description },
        plan: description,
        actors: [],
        cameras: [{ node: "camera", position: { x: 0.8, y: 1.65, z: 3.3 }, lookAt: target, fovDeg: 48, near: 0.1, far: 20, depthPrecision: { minimumDepthBits: 24, maximumStepMeters: 0.03 } }],
        lights: [{ node: "key", role: "key", direction: { x: -1, y: -2, z: -1 }, intensity: 2.5 }],
      };
      const compiled: IAutoMovieCompiledDefinedShot = compileDefinedShot({
        shot: defineShot(id, {
          scene: id,
          contract: { beat: id, durationSeconds: 2, participants: [], opening: [], closing: [], camera: { intent: description, requiredSubjects: ["installed-room/bench"], maxOcclusionRatio: 0.2 }, events: [], reviewFrames: [{ id: "room", time: 1, passes: ["beauty"] }] },
          build: () => ({
            stage,
            actors: [],
            script: { logline: description, theme: description, cast: [], beats: [{ id, name: description, summary: description, durationHint: 2 }] },
            blocking: { beat: id, analysis: description, rationale: description, actors: [], camera: { framing: "wide", move: "static", on: target }, duration: 2 },
            performance: { beat: id, plan: description, draft: [], revise: { review: description, final: null }, duration: 2 },
            eventSamples: [],
          }),
        }),
        context: null,
        runtime: { ...room.runtime, synthesize: () => null, skeleton: () => null, hasActorContext: () => false, frameFormat: { width: 640, height: 360 } },
      });
      if (!compiled.success) throw new Error(JSON.stringify(compiled.diagnostics));
      if (!compiled.source.scene.space?.walkable.includes("installed-room/hall/ground/entry/threshold"))
        throw new Error("The named entry did not reach the compiled room");
      const models: Map<string, IAutoMovieModel> = new Map(room.runtime.models.map((model: IAutoMovieModel) => [model.id, model]));
      const drawing: IAutoMovieSceneObject = buildScene(compiled.source.scene, (id: string) => {
        const model: IAutoMovieModel | undefined = models.get(id);
        return model === undefined ? undefined : buildModel(model);
      });
      return {
        scene: drawing.scene,
        camera: drawing.cameras[0]!,
        seek: (): void => drawing.scene.updateMatrixWorld(true),
        dispose: (): void => {
          for (const resource of collectAutoMovieOwnedResources(drawing.scene)) resource.dispose();
          drawing.scene.clear();
        },
      };
    },
  };
}
`,
  );
  fs.writeFileSync(
    path.join(directory, "src", "installedSdkSmoke.ts"),
    `import { createRing } from "@automovie/archetypes";
import { HumanChain } from "@automovie/motions";

// E2E-only: execute published SDK imports in the inspector's browser graph.
if (createRing({ id: "browser-sdk" }).parts.length === 0 ||
    !HumanChain.subject("browser-sdk").stand({ hold: 1 }).node)
  throw new Error("Installed SDK returned an incomplete model or motion");
document.documentElement.dataset.sdkSmoke = "ready";
`,
  );
  for (const entry of ["main.ts", "subjects.ts"]) {
    const file = path.join(directory, "src", entry);
    fs.writeFileSync(
      file,
      `import "./installedSdkSmoke";\n` + fs.readFileSync(file, "utf8"),
    );
  }
  if (!parity) return;
  // The starter remains the SDK smoke subject. A second real film lets the
  // installed film registry exercise transitions and repeat a retimed shot.
  const films = path.join(directory, "src", "composition", "films");
  fs.copyFileSync(
    path.join(import.meta.dirname, "installedParityFilm.ts"),
    path.join(films, "installedParityFilm.ts"),
  );
  const index = path.join(films, "index.ts");
  const registered = fs.readFileSync(index, "utf8");
  if (!registered.includes("  starter: starter(),"))
    throw new Error("The installed starter is not in its film registry");
  fs.writeFileSync(
    index,
    'import { installedParityFilm } from "./installedParityFilm";\n' +
      registered.replace(
        "  starter: starter(),",
        '  starter: starter(),\n  "installed-parity": installedParityFilm(),',
      ),
  );
  const executable = path.join(directory, "src", "executable");
  fs.copyFileSync(
    path.join(import.meta.dirname, "installedParityCheck.ts"),
    path.join(executable, "installedParityCheck.ts"),
  );
  fs.writeFileSync(
    path.join(executable, "check.ts"),
    'export { checks as default } from "./installedParityCheck.ts";\n',
  );
};

/** Run the browser consumer against the installed SDK, never source aliases. */
const browserSmoke = (directory, { parity = true } = {}) => {
  if (
    run(
      "install headless browser",
      "pnpm",
      [
        "exec",
        "playwright-core",
        "install",
        "--with-deps",
        "chromium-headless-shell",
      ],
      directory,
    )
  ) {
    run(
      "development and built inspector",
      process.execPath,
      [
        path.join(ROOT, "experimental", "e2e-template", "browser.mjs"),
        directory,
        ...(parity ? [] : ["--sdk-only"]),
      ],
      directory,
    );
    return true;
  }
  return false;
};

/** Run the same installed take across a real process restart. */
const motionTakeSmoke = (directory) => {
  const fixture = "test/e2e-motion-take";
  fs.cpSync(
    path.join(import.meta.dirname, "motion-take"),
    path.join(directory, fixture),
    {
      recursive: true,
    },
  );
  const body = JSON.parse(
    fs.readFileSync(
      path.join(ROOT, "test/src/features/internal/MOTION_HUMAN_PEOPLE.json"),
      "utf8",
    ),
  );
  fs.writeFileSync(
    path.join(directory, fixture, "body.json"),
    JSON.stringify(body["m-average"]),
  );
  for (const stage of ["save", "reopen"])
    if (
      !run(
        `installed motion take: ${stage}`,
        "pnpm",
        [
          "exec",
          "ttsx",
          "--cache-dir",
          "node_modules/.cache/ttsc",
          "-P",
          "tsconfig.json",
          `${fixture}/${stage}.ts`,
        ],
        directory,
      )
    )
      return;
  run(
    "pnpm run motion:take open (saved branch)",
    "pnpm",
    ["run", "motion:take", "open", `${fixture}/branch.ts`, `${fixture}/branch.json`],
    directory,
  );
};

// 2. Install the packed CLI, as `npx automovie` would fetch it.
const tool = path.join(work, "tool");
fs.mkdirSync(tool);
fs.writeFileSync(
  path.join(tool, "package.json"),
  JSON.stringify(
    {
      name: "automovie-e2e-tool",
      private: true,
      dependencies: {
        automovie: `file:${packed.automovie.split(path.sep).join("/")}`,
      },
    },
    null,
    2,
  ),
);
bind(tool);
if (!install(tool)) finish();
const cli = path.join(tool, "node_modules", "automovie");
const bin = path.join(
  cli,
  JSON.parse(fs.readFileSync(path.join(cli, "package.json"), "utf8")).bin
    .automovie,
);

// 3. Create the layout, bind it, and install it.
const target = path.join(work, layout);
if (layout === "production") {
  if (
    !run(
      "automovie create",
      process.execPath,
      [bin, "create", target, "--name", "e2e-production"],
      work,
    )
  )
    finish();
  bind(target);
  if (!install(target)) finish();
  verifyLockfile(target);
  addSdkConsumer(target);
  run("pnpm run lint", "pnpm", ["run", "lint"], target);
  run("pnpm run test", "pnpm", ["run", "test"], target);
  run("pnpm run build", "pnpm", ["run", "build"], target);
  run("pnpm run evidence", "pnpm", ["run", "evidence"], target);
  if (browserSmoke(target)) motionTakeSmoke(target);
} else {
  if (
    !run(
      "automovie create --workspace",
      process.execPath,
      [bin, "create", target, "--workspace", "--name", "e2e-workspace"],
      work,
    )
  )
    finish();
  bind(target);
  if (!install(target)) finish();
  const productions = ["shorts/alpha", "series/beta"];
  const parityProduction = productions[0];
  // An older workspace still has its pinned CLI and tarball overrides, but
  // predates these production dependencies. The installed add must fill both.
  const { parseDocument } = createRequire(path.join(ROOT, "test/package.json"))(
    "yaml",
  );
  const config = path.join(target, "pnpm-workspace.yaml");
  const workspace = parseDocument(fs.readFileSync(config, "utf8"));
  const missing = ["@automovie/archetypes", "@automovie/motions"];
  for (const name of missing)
    if (!workspace.deleteIn(["catalogs", "automovie", name]))
      throw new Error(`Fresh scaffold lacks ${name}`);
  fs.writeFileSync(config, workspace.toString());
  for (const production of productions)
    if (
      !run(
        `pnpm exec automovie add ${production}`,
        "pnpm",
        ["exec", "automovie", "add", production],
        target,
      )
    )
      finish();
  const completed = parseDocument(fs.readFileSync(config, "utf8"));
  results.push({
    label: "add restores both missing SDK catalog entries",
    ok: missing.every((name) =>
      completed.hasIn(["catalogs", "automovie", name]),
    ),
  });
  if (!install(target)) finish();
  verifyLockfile(target);
  for (const production of productions)
    addSdkConsumer(path.join(target, "movies", production), {
      parity: production === parityProduction,
    });
  run("pnpm run lint", "pnpm", ["run", "lint"], target);
  run("pnpm run test", "pnpm", ["run", "test"], target);
  for (const production of productions)
    run(
      `pnpm run build (movies/${production})`,
      "pnpm",
      ["run", "build"],
      path.join(target, "movies", production),
    );
  run("pnpm run evidence", "pnpm", ["run", "evidence"], target);
  for (const production of productions) {
    const directory = path.join(target, "movies", production);
    const parity = production === parityProduction;
    if (browserSmoke(directory, { parity }) && parity)
      motionTakeSmoke(directory);
  }
}
finish();
