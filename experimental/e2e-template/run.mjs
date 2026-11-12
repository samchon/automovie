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
//    `evidence`.
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
import * as os from "node:os";
import * as path from "node:path";

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
  // pnpm is a .cmd shim on Windows, which only a shell can start.
  const result =
    process.platform === "win32"
      ? spawnSync(line, { cwd, stdio: "inherit", shell: true })
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
  run("pnpm run lint", "pnpm", ["run", "lint"], target);
  run("pnpm run test", "pnpm", ["run", "test"], target);
  run("pnpm run build", "pnpm", ["run", "build"], target);
  run("pnpm run evidence", "pnpm", ["run", "evidence"], target);
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
  if (!install(target)) finish();
  verifyLockfile(target);
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
}
finish();
