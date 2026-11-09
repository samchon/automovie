import fs from "node:fs";
import path from "node:path";

import { HumanCurveCostReport as R } from "./HumanCurveCostReport";

/** Existing scalar diagnostic clocks, progress and file writes, without source construction. */
export namespace HumanScalarCostSession {
  /** Same invocation's durable result sinks and original failure ownership. */
  export interface IInput {
    /** Existing owned report directory. */
    output: string;

    /** Small report object referencing the actual rows. */
    report: Record<string, unknown>;

    /** Disjoint actual calls; nested acquisition references are not summed per scalar. */
    phases: R.IPhase[];

    /** Actual original acquisition outcomes. */
    acquisitions: Record<string, unknown>[];

    /** Original scalar/control preparation and read observations. */
    scalars: Record<string, unknown>[];

    /** Actual axis reads. */
    axes: Record<string, unknown>[];

    /** Named observer and source errors. */
    errors: Record<string, unknown>[];

    /** Original thrown values, distinct from returned-native diagnostics. */
    failures: unknown[];
  }

  /** Observer operations; none acquires a Human source. */
  export interface IOutput {
    /** Clock one actual action and preserve its original outcome. */
    timed<T>(
      id: string,
      owner: string,
      action: () => T,
      progress?: boolean,
    ): R.Result<T>;

    /** Write observation-only progress without overriding a producer exception. */
    emit(facts: Record<string, unknown>): void;

    /** Save the same CSV/report rows outside measured producer calls. */
    save(): void;
  }

  /** Bind clocks and writers to one existing diagnostic invocation. */
  export function create(input: IInput): IOutput {
    const {
      output,
      report,
      phases,
      acquisitions,
      scalars,
      axes,
      errors,
      failures,
    }: IInput = input;
    return { timed, emit, save };

    /** Clocks the actual call without per-scalar I/O; thrown values remain distinct from returned native diagnostics. */
    function timed<T>(
      id: string,
      owner: string,
      action: () => T,
      progress: boolean = false,
    ): R.Result<T> {
      const utc: string = new Date().toISOString();
      if (progress) emit({ event: "acquisition-start", id, utc });
      const begin: number = performance.now();
      let result: R.Result<T>;
      try {
        const value: T = action();
        const elapsed: number = performance.now() - begin;
        const phase: R.IPhase = {
          id,
          owner,
          startedUtc: utc,
          performanceStartMilliseconds: begin,
          milliseconds: elapsed,
          status: "returned",
          error: null,
        };
        result = { ok: true, value, phase };
      } catch (error: unknown) {
        const elapsed: number = performance.now() - begin;
        failures.push(error);
        const phase: R.IPhase = {
          id,
          owner,
          startedUtc: utc,
          performanceStartMilliseconds: begin,
          milliseconds: elapsed,
          status: "failed",
          error: R.message(error),
        };
        result = { ok: false, error, phase };
      }
      phases.push(result.phase);
      if (progress) emit({ event: "acquisition-end", ...result.phase });
      return result;
    }

    /** Progress is observation-only: its failure neither changes a producer result nor replaces its exception. */
    function emit(facts: Record<string, unknown>): void {
      try {
        process.stdout.write(JSON.stringify(facts) + "\n");
      } catch (error: unknown) {
        failures.push(error);
        errors.push({ stage: "progress-observation", error: R.message(error) });
        process.exitCode = 1;
      }
    }

    /** Writes facts outside the measured producer calls. No original control source or runtime file is modified. */
    function save(): void {
      csv("scalar-preparations.csv", scalars);
      csv("source-acquisitions.csv", acquisitions);
      csv("axis-reads.csv", axes);
      csv("phases.csv", phases);
      fs.writeFileSync(
        path.join(output, "report.next.json"),
        JSON.stringify(report, null, 2),
      );
      fs.renameSync(
        path.join(output, "report.next.json"),
        path.join(output, "report.json"),
      );
    }

    /** Preserves numbers and nested facts as quoted JSON cells; unknown or unmeasured values remain null. */
    function csv<T extends object>(name: string, rows: readonly T[]): void {
      const fields: string[] = [
        ...new Set(rows.flatMap((row: T): string[] => Object.keys(row))),
      ];
      const quote: (value: unknown) => string = (value: unknown): string =>
        '"' +
        (typeof value === "string"
          ? value
          : JSON.stringify(value ?? null)
        ).replaceAll('"', '""') +
        '"';
      const text: string[] = [fields.map(quote).join(",")];
      for (const row of rows) {
        const values: Record<string, unknown> = Object.fromEntries(
          Object.entries(row),
        );
        text.push(
          fields.map((field: string): string => quote(values[field])).join(","),
        );
      }
      fs.writeFileSync(path.join(output, name), text.join("\n") + "\n");
    }
  }
}
