import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import type { IAutoMovieLoftChain } from "@automovie/engine";
import { HumanNodePaths } from "./HumanNodePaths";
import type { IHumanInspectionDocument } from "../inspection/IHumanInspectionDocument";

/** Durable facts for the no-render source/curve/loft experiment. No reference artifact is read. */
export namespace HumanCurveCostReport {
  /** One disjoint outer operation; nested producer observations belong to facts, not the sum. */
  export interface IPhase {
    /** Stable reference used by part and curve rows. */
    id: string;
    /** Actual requested owner or operation. */
    owner: string;
    /** Clock at the actual operation boundary, UTC. */
    startedUtc: string;
    /** Monotonic process-clock start in milliseconds for same-round profile alignment. */
    performanceStartMilliseconds: number;
    /** Measured wall milliseconds including required internal dependencies. */
    milliseconds: number;
    /** A returned value can still contain native diagnostics; failed means the owner threw. */
    status: "returned" | "failed";
    /** Original exception text, or null after a normal return. */
    error: string | null;
  }

  /** Keep the original thrown value available to the measurement caller. */
  export type Result<T> = { ok: true; value: T; phase: IPhase } | { ok: false; error: unknown; phase: IPhase };

  /** Times one actual call; output serialization is outside the measured operation. */
  export function measure<T>(phases: IPhase[], id: string, owner: string, action: () => T): Result<T> {
    const utc: string = new Date().toISOString();
    process.stdout.write(JSON.stringify({ event: "phase-start", id, owner, utc }) + "\n");
    const started: number = performance.now();
    try {
      const value: T = action();
      const phase: IPhase = { id, owner, startedUtc: utc, performanceStartMilliseconds: started, milliseconds: performance.now() - started, status: "returned", error: null };
      phases.push(phase);
      process.stdout.write(JSON.stringify({ event: "phase-end", ...phase }) + "\n");
      return { ok: true, value, phase };
    } catch (error: unknown) {
      const milliseconds: number = performance.now() - started;
      const phase: IPhase = { id, owner, startedUtc: utc, performanceStartMilliseconds: started, milliseconds, status: "failed", error: message(error) };
      phases.push(phase);
      process.stdout.write(JSON.stringify({ event: "phase-end", ...phase }) + "\n");
      return { ok: false, error, phase };
    }
  }

  /** Exact SHA-256 of source or serialized public inputs. */
  export function hash(value: Buffer | string): string { return createHash("sha256").update(value).digest("hex"); }

  /** Borrowed exception identity is retained by Result; this is only its durable description. */
  export function message(error: unknown): string {
    if (error instanceof AggregateError) {
      const causes: unknown[] = error.errors;
      return (error.stack ?? error.message) + "\nPreserved failures:\n" + causes.map((cause: unknown): string => cause instanceof Error ? cause.stack ?? cause.message : String(cause)).join("\n");
    }
    return error instanceof Error ? error.stack ?? error.message : String(error);
  }

  /** Explicit compiler-chain and related owning-project configs; null records a missing optional owner config. */
  export function configs(): Record<string, string | null> {
    const names: string[] = ["package.json", "pnpm-workspace.yaml", "pnpm-lock.yaml", "test/tsconfig.json", "packages/playground/src/human-parameters/tsconfig.json", "config/tsconfig.json", "config/lint.config.ts", "config/lint.ts", ...["engine", "human", "interface", "playground"].flatMap((owner: string): string[] => ["packages/" + owner + "/package.json", "packages/" + owner + "/tsconfig.json", "packages/" + owner + "/lint.config.ts"])];
    return Object.fromEntries(names.map((name: string): [string, string | null] => [name, fs.existsSync(HumanNodePaths.resolve(name)) ? hash(fs.readFileSync(HumanNodePaths.resolve(name))) : null]));
  }

  /** Present tracked TypeScript/config bytes; an optional caller-owned list records tracked deletions separately from hashes. */
  export function sources(missing?: string[]): Record<string, string> {
    const names: string[] = execFileSync("git", ["ls-files", "-z", "packages/human/src", "packages/engine/src", "packages/interface/src", "packages/playground/src/human-parameters", "config"], { cwd: HumanNodePaths.root(), encoding: "utf8" }).split("\0").filter((name: string): boolean => /\.[cm]?tsx?$/.test(name));
    const values: Record<string, string> = {};
    for (const name of names) {
      const file: string = HumanNodePaths.resolve(name);
      if (!fs.existsSync(file)) {
        missing?.push(name);
        continue;
      }
      values[name] = hash(fs.readFileSync(file));
    }
    for (const [name, value] of Object.entries(configs())) if (value !== null) values[name] = value;
    return values;
  }

  /** Actual producer incompleteness is retained independently of any surviving rendered triangles. */
  export function rawIssues(document: IHumanInspectionDocument): string[] {
    const issues: string[] = [];
    const observation: unknown = document.provenance.observation;
    const loft: unknown = document.provenance.loft;
    if (record(observation) && Array.isArray(observation.unavailableParts) && observation.unavailableParts.length !== 0) issues.push("unavailable raw sources: " + JSON.stringify(observation.unavailableParts));
    if (Array.isArray(document.provenance.unmatchedGlobs) && document.provenance.unmatchedGlobs.length !== 0) issues.push("unmatched raw selectors: " + JSON.stringify(document.provenance.unmatchedGlobs));
    if (!record(loft)) issues.push("Actual raw loft provenance is unavailable");
    else for (const field of ["nonFinite", "orphans"]) {
      const value: unknown = loft[field];
      if (!Array.isArray(value)) issues.push("Actual raw " + field + " provenance is unavailable");
      else if (value.length !== 0) issues.push("raw " + field + ": " + JSON.stringify(value));
    }
    if (document.parts.length === 0) issues.push("No actual raw display operands");
    return issues;
  }

  /** Narrows producer facts before inspecting optional nested metadata. */
  function record(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }

  /** Copies only the actual principal numeric chain payload, without invoking callable/native source laws. */
  export function rawPayload(chain: IAutoMovieLoftChain): Record<string, unknown> {
    return { name: chain.name, basis: chain.basis ?? null, order: chain.order, rule: chain.rule, samples: chain.samples, mirrored: chain.mirrored ?? null, orientation: chain.orientation ?? null, layers: chain.layers.map((layer: IAutoMovieLoftChain.ILayer): unknown => ({ y: layer.y, frame: layer.frame, coefficients: layer.coefficients, slopes: layer.slopes, curvatures: layer.curvatures, lift: layer.lift, liftSlopes: layer.liftSlopes, liftCurvatures: layer.liftCurvatures, frameSlopes: layer.frameSlopes, frameCurvatures: layer.frameCurvatures, view: layer.view })), pole: chain.pole === undefined ? null : { end: chain.pole.end, point: chain.pole.point }, opposite: chain.opposite === undefined ? null : { end: chain.opposite.end, point: chain.opposite.point }, hashScope: "Actual principal numeric rows and frame/derivative snapshots only. Callable/native source records and between-row physical equivalence are not sealed by this payload." };
  }

  /** Writes one complete report and CSV tables using the actual object keys, without projection adapters. */
  export function save(directory: string, report: Record<string, unknown>, phases: readonly IPhase[], parts: readonly Record<string, unknown>[], curves: readonly Record<string, unknown>[]): void {
    fs.writeFileSync(path.join(directory, "report.next.json"), JSON.stringify(report, null, 2));
    fs.renameSync(path.join(directory, "report.next.json"), path.join(directory, "report.json"));
    csv(path.join(directory, "phases.csv"), phases);
    csv(path.join(directory, "parts.csv"), parts);
    csv(path.join(directory, "curves.csv"), curves);
  }

  /** Quotes every cell and preserves numeric round-trip text; nested facts remain explicit JSON cells. */
  function csv<T extends object>(file: string, rows: readonly T[]): void {
    const fields: string[] = [...new Set(rows.flatMap((row: T): string[] => Object.keys(row)))];
    const quote: (value: unknown) => string = (value: unknown): string => '"' + (typeof value === "string" ? value : JSON.stringify(value ?? null)).replaceAll('"', '""') + '"';
    const text: string[] = [fields.map(quote).join(",")];
    for (const row of rows) {
      const entries: [string, unknown][] = Object.entries(row);
      const value: Record<string, unknown> = Object.fromEntries(entries);
      text.push(fields.map((field: string): string => quote(value[field])).join(","));
    }
    fs.writeFileSync(file, text.join("\n") + "\n");
  }
}
