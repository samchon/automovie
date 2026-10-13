import { ChildProcess, spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { IHumanBuildFileHost } from "./IHumanBuildFileHost";
import { createHumanBuildFileHost } from "./createHumanBuildFileHost";
import { runHumanBuild } from "./runHumanBuild";
import { synchronizeHumanBuild } from "./synchronizeHumanBuild";

/**
 * Package build entry: own an exclusive stage, compile both supported
 * variants, then replace runtime output.
 *
 * The ordinary compiler and lint remain the authority. Every mutation stays
 * inside this package's real directory, and an unrestored previous output is
 * retained for explicit recovery.
 */
async function main(): Promise<void> {
  const directory: string = fs.realpathSync.native(path.resolve(__dirname, ".."));
  const output: string = path.join(directory, "lib");
  const lock: string = path.join(directory, ".human-build.lock");
  const compilerPackage: string = require.resolve("ttsc/package.json", {
    paths: [directory],
  });
  const compilerManifest: { bin: { ttsc: string } } = JSON.parse(
    fs.readFileSync(compilerPackage, "utf8"),
  );
  const compiler: string = path.resolve(
    path.dirname(compilerPackage),
    compilerManifest.bin.ttsc,
  );
  const fileHost: IHumanBuildFileHost = createHumanBuildFileHost(directory);

  const owned = (candidate: string): string => {
    const resolved: string = path.resolve(candidate);
    const relative: string = path.relative(directory, resolved);
    if (
      !relative ||
      relative.startsWith(".." + path.sep) ||
      relative === ".." ||
      path.isAbsolute(relative)
    )
      throw new Error(
        "Human build refuses a path outside its owning package: " + candidate,
      );
    return resolved;
  };
  const previous = (stage: string): string => owned(stage + "-previous");

  const handle: number = fs.openSync(owned(lock), "wx");
  let recoveryRequired: boolean = false;
  let retained: boolean = false;
  let backupComplete: boolean = false;
  try {
    fs.writeFileSync(
      handle,
      JSON.stringify({ pid: process.pid, started: new Date().toISOString() }),
    );
    await runHumanBuild({
      createStage(): string {
        if (fs.existsSync(output) && fs.lstatSync(output).isSymbolicLink())
          throw new Error(
            "Human build refuses to replace a linked runtime output directory.",
          );
        return fs.mkdtempSync(owned(path.join(directory, ".human-build-")));
      },
      async compile(stage: string, pass: "node" | "browser"): Promise<void> {
        const destination: string =
          pass === "browser"
            ? owned(path.join(owned(stage), "browser"))
            : owned(stage);
        const args: string[] = [compiler, "--outDir", destination];
        if (pass === "browser")
          args.push("--module", "esnext", "--moduleResolution", "bundler");
        const child: ChildProcess = spawn(process.execPath, args, {
          cwd: directory,
          windowsHide: true,
          stdio: "inherit",
        });
        const exit: string | null = await new Promise(
          (
            resolve: (failure: string | null) => void,
            reject: (error: Error) => void,
          ): void => {
            child.once("error", reject);
            child.once(
              "close",
              (code: number | null, signal: NodeJS.Signals | null): void =>
                resolve(code === 0 ? null : `exit ${code}, signal ${signal}`),
            );
          },
        );
        if (exit !== null)
          throw new Error(`Human ${pass} compiler failed (${exit}).`);
      },
      hasPrevious: (): boolean => fs.existsSync(output),
      backup: (stage: string): void => {
        fileHost.files(output);
        fs.cpSync(owned(output), previous(stage), {
          recursive: true,
          errorOnExist: true,
          force: false,
        });
        backupComplete = true;
      },
      install: (stage: string): void =>
        synchronizeHumanBuild(fileHost, owned(stage), owned(output)),
      restore: (stage: string): void => {
        try {
          synchronizeHumanBuild(
            fileHost,
            fs.existsSync(previous(stage)) ? previous(stage) : undefined,
            owned(output),
          );
        } catch (error) {
          recoveryRequired = true;
          throw error;
        }
      },
      removeBackup: (stage: string): void =>
        fs.rmSync(previous(stage), { recursive: true }),
      discardStage(stage: string): void {
        if (
          recoveryRequired ||
          (backupComplete && fs.existsSync(previous(stage)))
        ) {
          retained = true;
          fs.ftruncateSync(handle, 0);
          fs.writeSync(
            handle,
            JSON.stringify({
              pid: process.pid,
              recovery: stage,
              backup: previous(stage),
              publicationUnresolved: true,
            }),
            0,
          );
          console.error(
            "Human build retained recovery files and its publication lock at " +
              stage,
          );
          return;
        }
        if (!backupComplete && fs.existsSync(previous(stage)))
          fs.rmSync(previous(stage), { recursive: true });
        fs.rmSync(owned(stage), { recursive: true });
      },
    });
  } finally {
    fs.closeSync(handle);
    if (!retained) fs.unlinkSync(owned(lock));
  }
}

main().catch((error: unknown): void => {
  console.error(error);
  process.exitCode = 1;
});
