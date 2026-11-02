import { fork, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";

import { HumanAnatomyAudit } from "./features/internal/HumanAnatomyAudit";
import { HumanPeople } from "./features/internal/HumanPeople";

/** The selected anatomy checks and the maximum number of live people. */
interface IOptions {
  /** Names accepted by HumanPeople, without generating their bodies. */
  aliases: string[];

  /** Existing audit names; the runner changes no expectations. */
  categories: string[];

  /** Simultaneous person processes, either one or two. */
  concurrency: number;

  /** Absolute UTF-8 JSON destination, replaced after each completed person. */
  output: string;
}

/** One audit invocation, including every measurement even when it fails. */
interface ICategory {
  /** Key in HumanAnatomyAudit.REGIONS. */
  category: string;

  /** Audit wall time in milliseconds, excluding body generation. */
  milliseconds: number;

  /** All measurements; non-finite numbers serialize as JSON null. */
  rows: HumanAnatomyAudit.IRow[];

  /** Number of measurements rejected by the existing audit predicate. */
  failed: number;

  /** An exception prevents this category from supplying complete rows. */
  error?: string;
}

/** Results from one process whose generated geometry dies with that process. */
interface IPerson {
  /** HumanPeople alias. */
  alias: string;

  /** Generation wall time in milliseconds, or null when generation failed. */
  generationMilliseconds: number | null;

  /** Existing audits, each invoked once for this person. */
  categories: ICategory[];

  /** Body generation or worker failure, distinct from measurement failures. */
  error?: string;
}

/** A report can remain partial when interrupted or when a worker fails. */
interface IReport {
  /** UTC start of the requested campaign measurement. */
  startedAt: string;

  /** UTC end, null while work remains. */
  completedAt: string | null;

  /** Requested scope and worker bound, retained even in a partial report. */
  selection: IOptions;

  /** Elapsed wall time at the latest checkpoint, milliseconds. */
  milliseconds: number;

  /** Completed people in the requested alias order. */
  people: IPerson[];
}

/**
 * Run anatomy audits once per selected person and category, preserving all rows
 * and existing tolerances. Each fork owns one HumanPeople cache and exits after
 * its report; at most two forks retain generated geometry. The parent retains
 * only measurement rows and joins every child before finishing. Inherited ttsx
 * NODE_OPTIONS provide the same checked TypeScript loader to each fork.
 *
 * From test: pnpm exec ttsx --no-plugins -P tsconfig.human-campaign.json
 * src/humanCampaign.ts --output ../packages/playground/.shots/round/anatomy.json
 * --aliases f1,f2,m1,m2 --categories trunk,arm --concurrency 1
 *
 * This executable calls the maintained audits directly; it does not replace
 * the maintained test suite, curve tests, CPU score, or visual inspection.
 *
 * @param args CLI options; callers can validate an explicit selection without
 * mutating the process's argument vector.
 */
export async function humanCampaign(args: string[] = process.argv.slice(2)): Promise<void> {
  if (args[0] === "--worker") {
    if (args.length !== 3 || !process.send)
      throw new Error("--worker is reserved for task-owned IPC children.");
    const aliases: string[] = select(args[1], HumanPeople.names(), "aliases");
    const categories: string[] = select(args[2], Object.keys(HumanAnatomyAudit.REGIONS), "categories");
    if (aliases.length !== 1) throw new Error("Each worker owns exactly one person.");
    await measure(aliases[0]!, categories);
    return;
  }
  if (args.length === 1 && args[0] === "--help") {
    console.log(
      "Human anatomy campaign\n" +
        "--output <file.json> (required)\n" +
        "--aliases <comma-separated names> (default: all nine)\n" +
        "--categories <comma-separated names> (default: all seven)\n" +
        "--concurrency <1|2> (default: 1; coordinate with other generators)\n" +
        "The cap applies to this invocation; reserve slots for any running viewer.\n" +
        "Windows PowerShell, from test, if TEMP is virtualized:\n" +
        "New-Item -ItemType Directory -Path ../.shots/human-campaign-temp\n" +
        "$env:TEMP=(Resolve-Path ../.shots/human-campaign-temp).Path; $env:TMP=$env:TEMP\n" +
        `Aliases: ${HumanPeople.names().join(",")}\n` +
        `Categories: ${Object.keys(HumanAnatomyAudit.REGIONS).join(",")}`,
    );
    return;
  }

  const options: IOptions = parse(args);
  const started: number = performance.now();
  const report: IReport = {
    startedAt: new Date().toISOString(),
    completedAt: null,
    selection: options,
    milliseconds: 0,
    people: [],
  };
  const children: Set<ChildProcess> = new Set();
  let cursor: number = 0;
  let interrupted: boolean = false;

  /** Cancel only children this invocation created, then join their close events. */
  const stop: (signal: NodeJS.Signals) => void = (signal: NodeJS.Signals): void => {
    interrupted = true;
    process.exitCode = signal === "SIGINT" ? 130 : 143;
    for (const child of children) child.kill("SIGTERM");
  };

  /** Persist completed rows even if a later person fails or is interrupted. */
  const checkpoint: () => void = (): void => {
    report.milliseconds = performance.now() - started;
    report.people.sort(
      (a: IPerson, b: IPerson): number =>
        options.aliases.indexOf(a.alias) - options.aliases.indexOf(b.alias),
    );
    fs.writeFileSync(options.output, JSON.stringify(report, null, 2), "utf8");
  };

  fs.mkdirSync(path.dirname(options.output), { recursive: true });
  checkpoint();
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
  try {
    const settled: PromiseSettledResult<undefined>[] = await Promise.allSettled(
      Array.from({ length: options.concurrency }, async (): Promise<undefined> => {
        try {
          while (!interrupted && cursor < options.aliases.length) {
            const alias: string = options.aliases[cursor++]!;
            const person: IPerson = await launch(alias, options.categories, children);
            report.people.push(person);
            checkpoint();
          }
        } catch (error) {
          interrupted = true;
          for (const child of children) child.kill("SIGTERM");
          throw error;
        }
        return undefined;
      }),
    );
    const rejected: PromiseRejectedResult | undefined = settled.find(
      (result: PromiseSettledResult<undefined>): result is PromiseRejectedResult => result.status === "rejected",
    );
    if (rejected)
      throw rejected.reason instanceof Error
        ? rejected.reason
        : new Error(String(rejected.reason));
    if (!interrupted) report.completedAt = new Date().toISOString();
    checkpoint();

    const measurements: number = report.people.reduce(
      (sum: number, person: IPerson): number =>
        sum + person.categories.reduce((n: number, c: ICategory): number => n + c.rows.length, 0),
      0,
    );
    const failures: number = report.people.reduce(
      (sum: number, person: IPerson): number =>
        sum + person.categories.reduce((n: number, c: ICategory): number => n + c.failed, 0),
      0,
    );
    const errors: number = report.people.reduce(
      (sum: number, person: IPerson): number =>
        sum + Number(person.error !== undefined) + person.categories.filter((c: ICategory): boolean => c.error !== undefined).length,
      0,
    );
    console.log(`${report.people.length}/${options.aliases.length} people; ${measurements} measurements; ${failures} failures; ${errors} errors; ${report.milliseconds.toFixed(0)} ms`);
    if (!interrupted && (failures !== 0 || errors !== 0)) process.exitCode = 1;
  } finally {
    process.off("SIGINT", stop);
    process.off("SIGTERM", stop);
  }
}

/** Validate the whole scope before starting a body or replacing the output file. */
function parse(args: string[]): IOptions {
  const flags: Map<string, string> = new Map();
  const accepted: string[] = ["--output", "--aliases", "--categories", "--concurrency"];
  for (let i: number = 0; i < args.length; i += 2) {
    const flag: string = args[i]!;
    const value: string | undefined = args[i + 1];
    if (!accepted.includes(flag) || flags.has(flag) || !value || value.startsWith("--"))
      throw new Error(`Invalid or repeated option: ${flag}; use --help.`);
    flags.set(flag, value);
  }
  const output: string | undefined = flags.get("--output");
  if (!output) throw new Error("--output is required; use --help.");
  const concurrency: string = flags.get("--concurrency") ?? "1";
  if (concurrency !== "1" && concurrency !== "2")
    throw new Error("--concurrency must be 1 or 2.");
  return {
    aliases: select(flags.get("--aliases"), HumanPeople.names(), "aliases"),
    categories: select(flags.get("--categories"), Object.keys(HumanAnatomyAudit.REGIONS), "categories"),
    concurrency: Number(concurrency),
    output: path.resolve(output),
  };
}

/** Reject unknown, empty, or duplicate selections rather than silently dropping work. */
function select(value: string | undefined, allowed: string[], label: string): string[] {
  if (value === undefined) return allowed;
  const names: string[] = value.split(",");
  if (names.some((name: string): boolean => !allowed.includes(name)) || new Set(names).size !== names.length)
    throw new Error(`Invalid ${label}: ${value}; expected distinct names from ${allowed.join(",")}.`);
  return names;
}

/** Generate once, audit each requested category once, and flush one IPC report. */
async function measure(alias: string, categories: string[]): Promise<void> {
  const result: IPerson = { alias, generationMilliseconds: null, categories: [] };
  try {
    const started: number = performance.now();
    HumanPeople.person(alias);
    result.generationMilliseconds = performance.now() - started;
    console.log(`${alias} generated ${result.generationMilliseconds.toFixed(0)} ms`);
    for (const category of categories) {
      const began: number = performance.now();
      const audit: ICategory = { category, milliseconds: 0, rows: [], failed: 0 };
      try {
        audit.rows = HumanAnatomyAudit.REGIONS[category]!(alias);
        audit.failed = audit.rows.filter((row: HumanAnatomyAudit.IRow): boolean => !HumanAnatomyAudit.passes(row)).length;
        for (const row of audit.rows)
          if (!HumanAnatomyAudit.passes(row))
            console.log(`FAIL ${alias} ${category}: ${row.site}: ${row.value} ${row.unit}; expected [${row.low}, ${row.high}]`);
      } catch (error) {
        audit.error = errorText(error);
        console.error(`ERROR ${alias} ${category}: ${audit.error}`);
      }
      audit.milliseconds = performance.now() - began;
      result.categories.push(audit);
      console.log(`${alias} ${category}: ${audit.rows.length} measurements, ${audit.failed} failures, ${audit.milliseconds.toFixed(0)} ms`);
    }
  } catch (error) {
    result.error = errorText(error);
    console.error(`ERROR ${alias}: ${result.error}`);
  }

  await new Promise<undefined>((resolve: (value: undefined) => void, reject: (error: Error) => void): void => {
    if (!process.send) {
      reject(new Error("The measurement worker requires an IPC parent."));
      return;
    }
    process.send(result, (error: Error | null): void => {
      if (error) reject(error);
      else resolve(undefined);
    });
  });
  process.disconnect();
}

/** Join one task-owned child; geometry cannot survive into the next alias. */
function launch(alias: string, categories: string[], children: Set<ChildProcess>): Promise<IPerson> {
  return new Promise<IPerson>((resolve: (person: IPerson) => void): void => {
    const child: ChildProcess = fork(__filename, ["--worker", alias, categories.join(",")], {
      execArgv: [],
      stdio: ["ignore", "inherit", "inherit", "ipc"],
    });
    children.add(child);
    let result: IPerson | undefined;
    let failure: string | undefined;
    child.on("message", (message: IPerson): void => { result = message; });
    child.on("error", (error: Error): void => { failure = error.message; });
    child.on("close", (code: number | null, signal: NodeJS.Signals | null): void => {
      children.delete(child);
      if (code !== 0 || result === undefined)
        resolve({ alias, generationMilliseconds: null, categories: result?.categories ?? [], error: failure ?? `Worker closed with code ${code}, signal ${signal}.` });
      else resolve(result);
    });
  });
}

/** Preserve diagnostic stacks without assuming the thrown value is an Error. */
function errorText(error: unknown): string {
  return error instanceof Error ? error.stack ?? error.message : String(error);
}

if (require.main === module)
  void humanCampaign().catch((error: unknown): void => {
    console.error(errorText(error));
    process.exitCode = 2;
  });
