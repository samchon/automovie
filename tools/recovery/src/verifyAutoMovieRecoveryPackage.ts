import { type SpawnSyncReturns, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { installAutoMovieRecoveryConsumerToolchain } from "./installAutoMovieRecoveryConsumerToolchain.ts";
import { verifyAutoMovieRecoveryOpenConsumer } from "./verifyAutoMovieRecoveryOpenConsumer.ts";
import { verifyAutoMovieRecoveryRegisteredConsumer } from "./verifyAutoMovieRecoveryRegisteredConsumer.ts";

/**
 * Verify actual packed recovery imports, installed bin and immutable publication.
 * Run after the workspace build with the recovery-tools verify:package script.
 * That pnpm run host supplies npm_execpath; an explicit driver override remains
 * available to controlled hosts. Packing disables lifecycle scripts.
 * The external consumer installs only exact interface, engine and recovery tarballs;
 * its package store and temporary paths are run-owned. Runtime installation is
 * offline. After runtime checks, the consumer normally installs the workspace
 * TypeScript version as a development dependency for the separate declaration check.
 * Source-free runtime checks use Node's filesystem permissions, admitting only the
 * external consumer tree. The generated type-consumer config is returned for the
 * owning compiler or CI; runtime stripping alone is not a declaration-type check.
 * Failed runs retain their evidence directory for inspection; successful runs also
 * retain packed bytes until the validation owner has collected the receipt.
 *
 * @evidence contracts/common.md#principled-implementation Real pack/install resolution exercises published exports and the installed executable; a separate permission-scoped process reconstructs known square courses and checks immutable failure cleanup.
 * @evidence contracts/common.md#clear-and-simple-design Host integration stays outside under-500-ms portable unit tests and outside the distributed library's runtime closure.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source alias, parent dependency, NODE_PATH, compiler hook, source mesh, global replacement or private tool supplies the consumer's runtime.
 * @evidence contracts/common.md#meaningful-documentation States build prerequisites, offline exact tarballs, Node permissions, type-check distinction and evidence-retention ownership.
 * @evidence contracts/performance.md#efficient-algorithms Packing and installation traverse the distribution bytes once per operation; the numerical consumer uses constant-size generic curves and writes only small artifacts.
 * @evidence contracts/performance.md#reuse-equivalent-work The same three packed byte artifacts are installed and hashed; geometry is generated once for its independent physical checks and publication.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Every child is synchronous and time-bounded, has no install scripts and inherits run-owned temporary/cache paths. The caller owns packed and failed-run evidence and must retire it after collection; no worker remains after a settled child.
 */
export function verifyAutoMovieRecoveryPackage(): void {
  const repository: string = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../..",
  );
  const parent: string = path.resolve(
    process.env.AUTOMOVIE_RECOVERY_PACKAGE_SCRATCH ?? os.tmpdir(),
  );
  const relative: string = path.relative(repository, parent);
  if (
    relative === "" ||
    (!relative.startsWith(".." + path.sep) &&
      relative !== ".." &&
      !path.isAbsolute(relative))
  )
    throw new Error(
      "The package consumer scratch directory must be outside the repository",
    );
  for (let ancestor: string = parent; ; ancestor = path.dirname(ancestor)) {
    if (fs.existsSync(path.join(ancestor, "node_modules")))
      throw new Error("External validation cannot inherit parent node_modules");
    if (path.dirname(ancestor) === ancestor) break;
  }
  fs.mkdirSync(parent, { recursive: true });
  const scratch: string = fs.mkdtempSync(
    path.join(parent, "automovie-recovery-pack-"),
  );
  for (const directory of [
    "packs",
    "consumer",
    "tmp",
    "cache",
    "home",
    "store",
    "pnpm",
  ])
    fs.mkdirSync(path.join(scratch, directory));
  const consumer: string = path.join(scratch, "consumer");
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    NODE_PATH: undefined,
    NODE_OPTIONS: undefined,
    TEMP: path.join(scratch, "tmp"),
    TMP: path.join(scratch, "tmp"),
    HOME: path.join(scratch, "home"),
    USERPROFILE: path.join(scratch, "home"),
    XDG_CACHE_HOME: path.join(scratch, "cache"),
    PNPM_HOME: path.join(scratch, "pnpm"),
    npm_config_cache: path.join(scratch, "cache"),
    npm_config_ignore_scripts: "true",
    PATH:
      path.dirname(process.execPath) +
      path.delimiter +
      (process.env.PATH ?? ""),
  };
  const driver: string | undefined =
    process.env.npm_execpath ?? process.env.AUTOMOVIE_PNPM_DRIVER;
  if (!driver || !fs.existsSync(driver))
    throw new Error(
      "Run the recovery-tools verify:package script or provide AUTOMOVIE_PNPM_DRIVER",
    );
  const run: (
    command: string,
    args: string[],
    cwd: string,
    childEnv?: NodeJS.ProcessEnv,
  ) => string = (
    command: string,
    args: string[],
    cwd: string,
    childEnv: NodeJS.ProcessEnv = env,
  ): string => {
    const result: SpawnSyncReturns<string> = spawnSync(command, args, {
      cwd,
      env: childEnv,
      encoding: "utf8",
      timeout: 300_000,
      maxBuffer: 4 * 1024 * 1024,
    });
    if (result.error || result.status !== 0)
      throw new Error(
        JSON.stringify({
          command: path.basename(command),
          status: result.status,
          signal: result.signal,
          error: result.error?.message,
          stdout: result.stdout,
          stderr: result.stderr,
        }),
      );
    return result.stdout;
  };
  const pnpm: (args: string[], cwd: string) => string = (
    args: string[],
    cwd: string,
  ): string =>
    /\.[cm]?js$/i.test(driver)
      ? run(process.execPath, [driver, ...args], cwd)
      : run(driver, args, cwd);
  const packs: { name: string; file: string; bytes: number; sha256: string }[] =
    [];
  for (const name of ["interface", "engine", "recovery"]) {
    pnpm(
      [
        "--config.ignore-scripts=true",
        "pack",
        "--pack-destination",
        path.join(scratch, "packs"),
      ],
      path.join(repository, "packages", name),
    );
    const metadata: { version: string } = JSON.parse(
      fs.readFileSync(
        path.join(repository, "packages", name, "package.json"),
        "utf8",
      ),
    );
    const file: string = path.join(
      scratch,
      "packs",
      `automovie-${name}-${metadata.version}.tgz`,
    );
    const bytes: Buffer = fs.readFileSync(file);
    packs.push({
      name: `@automovie/${name}`,
      file,
      bytes: bytes.length,
      sha256: createHash("sha256").update(bytes).digest("hex"),
    });
  }
  const dependencies: Record<string, string> = Object.fromEntries(
    packs.map((pack: (typeof packs)[number]): [string, string] => [
      pack.name,
      `file:${pack.file.replaceAll("\\", "/")}`,
    ]),
  );
  fs.writeFileSync(
    path.join(consumer, "package.json"),
    JSON.stringify(
      { private: true, dependencies, pnpm: { overrides: dependencies } },
      null,
      2,
    ),
  );
  pnpm(
    [
      "install",
      "--offline",
      "--ignore-scripts",
      "--ignore-workspace",
      "--lockfile=false",
      "--store-dir",
      path.join(scratch, "store"),
    ],
    consumer,
  );
  fs.mkdirSync(path.join(consumer, "outputs"));
  const script: string = `
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const recovery = require("@automovie/recovery");
const host = require("@automovie/recovery/node");
const version = require("@automovie/recovery/package.json").version;
assert.equal(typeof recovery.observeAutoMovieRecovery, "function");
assert.equal(typeof recovery.reconstructAutoMovieRecoveryModel, "function");
assert.equal(typeof host.publishAutoMovieRecoveryArtifact, "function");
function ring(y) {
  const points = [[0,y,0],[0,y,3],[3,y,3],[3,y,0]];
  return { type:"cubicBezier", name:"square."+y, unit:"mm", phaseUnit:"mm", closed:true,
    phaseIntervals:[3,3,3,3], spans:points.map((p,i)=>{const q=points[(i+1)%4];return [p,p.map((x,k)=>x+(q[k]-x)/3),p.map((x,k)=>x+2*(q[k]-x)/3),q]}) };
}
const policy = { axis:[0,1,0], reference:[1,0,0], stepMm:2, toleranceMm:.01, chordToleranceMm:.01,
  maxSections:8, maxSpans:8, exactCoordinateAliases:false, sourceOrientationSign:1, cornerDegrees:45 };
const sections = [0,2].map(y=>({coordinateMm:y,loops:[{curve:ring(y),winding:1}]}));
const bundle = { schema:"automovie-recovery-curves-v1", loft:{sections,events:[],chordToleranceMm:.01,
  intervals:[{beforeMm:0,afterMm:2,groups:[{before:[0],after:[0],supported:true,reason:null}]}]},
  reports:sections.map(s=>({coordinateMm:s.coordinateMm,fits:[{sampleMaximumMm:0,polylineUpperEstimateMm:0,toleranceMet:true,observationsPerSpan:2,handleFallbacks:0}],open:[],isolatedContactsMm:[],diagnostics:[]})),
  diagnostics:[],topologyGaps:[],unconsumedEvents:[],policy,summary:{observations:16,spans:8,sections:2,events:0,aliases:0} };
const result = recovery.reconstructAutoMovieRecoveryModel(bundle);
assert.equal(result.status,"complete");
let area = 0;
for (const part of result.value.model.parts) {
  const mesh = part.geometry.mesh;
  for(let i=0;i<mesh.indices.length;i+=3) {
    const p=mesh.indices.slice(i,i+3).map(index=>mesh.positions.slice(3*index,3*index+3));
    const u=p[1].map((x,k)=>x-p[0][k]),v=p[2].map((x,k)=>x-p[0][k]);
    area+=Math.hypot(u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0])/2;
  }
}
assert.ok(Math.abs(area-24e-6)<1e-12);
const target=path.join(__dirname,"outputs","immutable.json");
const first=host.publishAutoMovieRecoveryArtifact(target,result.value);
assert.equal(first.status,"complete");
const before=fs.readFileSync(target);
const repeat=host.publishAutoMovieRecoveryArtifact(target,{replacement:true});
assert.equal(repeat.status,"failed");
assert.ok(before.equals(fs.readFileSync(target)));
const cyclic={};cyclic.self=cyclic;
const failed=host.publishAutoMovieRecoveryArtifact(path.join(__dirname,"outputs","failed.json"),cyclic);
assert.equal(failed.status,"failed");
assert.ok(!fs.existsSync(path.join(__dirname,"outputs","failed.json")));
assert.deepEqual(fs.readdirSync(path.join(__dirname,"outputs")),["immutable.json"]);
const abort=new AbortController();abort.abort();
assert.equal(host.publishAutoMovieRecoveryArtifact(path.join(__dirname,"outputs","cancelled.json"),{}, {signal:abort.signal}).status,"cancelled");
assert.ok(!fs.existsSync(path.join(__dirname,"outputs","cancelled.json")));
for (const file of Object.keys(require.cache)) assert.ok(file.startsWith(__dirname+path.sep),"Repository or foreign dependency escaped packed closure: "+file);
fs.writeFileSync(path.join(__dirname,"outputs","curves.json"),JSON.stringify(bundle));
console.log(JSON.stringify({node:process.version,version,area,status:result.status,immutablePublication:true,failureCleanup:true,preCancelledPublication:true}));
`;
  fs.writeFileSync(path.join(consumer, "consumer.cjs"), script);
  const stdout: string = run(
    process.execPath,
    [
      "--permission",
      `--allow-fs-read=${consumer}`,
      `--allow-fs-write=${path.join(consumer, "outputs")}`,
      path.join(consumer, "consumer.cjs"),
    ],
    consumer,
  );
  fs.writeFileSync(
    path.join(consumer, "consumer-esm.mjs"),
    'import { reconstructAutoMovieRecoveryModel } from "@automovie/recovery"; if(typeof reconstructAutoMovieRecoveryModel!=="function")throw Error("ESM public import failed");\n',
  );
  run(process.execPath, [path.join(consumer, "consumer-esm.mjs")], consumer);
  const bin: string = path.join(
    consumer,
    "node_modules",
    ".bin",
    process.platform === "win32"
      ? "automovie-recovery.CMD"
      : "automovie-recovery",
  );
  const cli: SpawnSyncReturns<string> = spawnSync(bin, ["--help"], {
    cwd: consumer,
    env,
    encoding: "utf8",
    shell: process.platform === "win32",
    timeout: 30_000,
  });
  if (cli.status !== 0 || !cli.stdout.includes("automovie-recovery"))
    throw new Error("Installed bin help failed: " + cli.stderr);
  const packageCli: string = path.join(
    consumer,
    "node_modules",
    "@automovie",
    "recovery",
    "lib",
    "node",
    "cli.js",
  );
  const version: string = run(
    process.execPath,
    [packageCli, "--version"],
    consumer,
  );
  const refused: SpawnSyncReturns<string> = spawnSync(
    process.execPath,
    [packageCli, "unsupported"],
    { cwd: consumer, env, encoding: "utf8", timeout: 30_000 },
  );
  if (refused.status !== 2 || !refused.stderr.includes('"refused"'))
    throw new Error("Installed CLI refusal did not return status 2");
  const sourceEpoch: string | undefined =
    process.env.AUTOMOVIE_RECOVERY_SOURCE_EPOCH ?? process.env.GITHUB_SHA;
  if (!sourceEpoch || !/^[a-f0-9]{40,64}$/i.test(sourceEpoch))
    throw new Error(
      "A generating source epoch is required for the installed CLI behavior check",
    );
  const modelFile: string = path.join(consumer, "outputs", "model.json");
  run(
    process.execPath,
    [
      "--permission",
      `--allow-fs-read=${consumer}`,
      `--allow-fs-write=${path.join(consumer, "outputs")}`,
      packageCli,
      "recovery",
      "--source-epoch",
      sourceEpoch,
      "reconstruct",
      path.join(consumer, "outputs", "curves.json"),
      modelFile,
    ],
    consumer,
  );
  const model: {
    schema: string;
    operation: { status: string };
    model: {
      parts: {
        geometry: { mesh: { positions: number[]; indices: number[] } };
      }[];
    };
    provenance: { sourceCommit: string };
  } = JSON.parse(fs.readFileSync(modelFile, "utf8"));
  let cliArea: number = 0;
  for (const part of model.model.parts) {
    const mesh: (typeof part.geometry)["mesh"] = part.geometry.mesh;
    if (
      !mesh.positions.every(Number.isFinite) ||
      !mesh.indices.every(
        (index: number): boolean =>
          Number.isSafeInteger(index) &&
          index >= 0 &&
          index * 3 + 2 < mesh.positions.length,
      )
    )
      throw new Error(
        "Installed closed consumer returned invalid finite indexed geometry",
      );
    for (let i: number = 0; i < mesh.indices.length; i += 3) {
      const points: number[][] = mesh.indices
        .slice(i, i + 3)
        .map((index: number): number[] =>
          mesh.positions.slice(index * 3, index * 3 + 3),
        );
      const a: number[] = points[0]!,
        b: number[] = points[1]!,
        c: number[] = points[2]!;
      const u: number[] = b.map(
          (value: number, axis: number): number => value - a[axis]!,
        ),
        v: number[] = c.map(
          (value: number, axis: number): number => value - a[axis]!,
        );
      cliArea +=
        Math.hypot(
          u[1]! * v[2]! - u[2]! * v[1]!,
          u[2]! * v[0]! - u[0]! * v[2]!,
          u[0]! * v[1]! - u[1]! * v[0]!,
        ) / 2;
    }
  }
  if (
    model.schema !== "automovie-recovery-model-v1" ||
    model.operation.status !== "complete" ||
    model.provenance.sourceCommit !== sourceEpoch ||
    !Number.isFinite(cliArea) ||
    Math.abs(cliArea - 24e-6) > 1e-12
  )
    throw new Error(
      "Installed CLI source-free reconstruction changed the declared physical surface or provenance",
    );
  verifyAutoMovieRecoveryRegisteredConsumer({
    consumer,
    cli: packageCli,
    sourceEpoch,
    run,
  });
  const openConsumer: ReturnType<typeof verifyAutoMovieRecoveryOpenConsumer> =
    verifyAutoMovieRecoveryOpenConsumer({
      consumer,
      cli: packageCli,
      sourceEpoch,
      run,
    });
  fs.writeFileSync(
    path.join(consumer, "consumer-types.mts"),
    `import { observeAutoMovieRecovery, reconstructAutoMovieRecoveryModel } from "@automovie/recovery";
import { publishAutoMovieRecoveryArtifact } from "@automovie/recovery/node";
import type { IAutoMovieRecoveryInput } from "@automovie/interface/recovery";
export function consume(input: IAutoMovieRecoveryInput, saved: Parameters<typeof reconstructAutoMovieRecoveryModel>[0]): void {
 const observed: ReturnType<typeof observeAutoMovieRecovery> = observeAutoMovieRecovery(input);
 const generated: ReturnType<typeof reconstructAutoMovieRecoveryModel> = reconstructAutoMovieRecoveryModel(saved);
 if ("value" in observed && "value" in generated) publishAutoMovieRecoveryArtifact("unused.json", {observed:observed.value,model:generated.value.model});
}
`,
  );
  const typeConfig: string = path.join(consumer, "tsconfig.json");
  fs.writeFileSync(
    typeConfig,
    JSON.stringify(
      {
        compilerOptions: {
          target: "ES2022",
          module: "NodeNext",
          moduleResolution: "NodeNext",
          strict: true,
          noEmit: true,
          skipLibCheck: false,
          types: [],
        },
        files: ["consumer-types.mts"],
      },
      null,
      2,
    ),
  );
  const declarationToolchain: ReturnType<
    typeof installAutoMovieRecoveryConsumerToolchain
  > = installAutoMovieRecoveryConsumerToolchain({
    repository,
    consumer,
    dependencies,
    store: path.join(scratch, "store"),
    pnpm,
  });
  const receipt: object = {
    schema: "automovie-recovery-packed-consumer-v1",
    sourceEpoch,
    node: process.version,
    platform: process.platform,
    packs: packs.map(
      (pack: (typeof packs)[number]): Omit<typeof pack, "file"> => ({
        name: pack.name,
        bytes: pack.bytes,
        sha256: pack.sha256,
      }),
    ),
    runtime: JSON.parse(stdout),
    installedBinHelp: true,
    installedCli: {
      sourceFreeReconstruction: true,
      area: cliArea,
      schema: model.schema,
      registeredObservationAndContinuation: true,
      openConsumer,
    },
    version: version.trim(),
    refusedExit: refused.status,
    declarationCheck: "pending-owning-compiler",
    declarationToolchain: {
      ...declarationToolchain,
      strict: true,
      skipLibCheck: false,
      sourceFallback: false,
    },
    typeConfig,
  };
  fs.writeFileSync(
    path.join(scratch, "receipt.json"),
    JSON.stringify(receipt, null, 2),
  );
  if (process.env.GITHUB_OUTPUT)
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `typeConfig=${typeConfig}\n`);
  console.log(
    JSON.stringify({
      scratch,
      receipt: path.join(scratch, "receipt.json"),
      typeConfig,
    }),
  );
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  verifyAutoMovieRecoveryPackage();
