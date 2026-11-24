import { createHash, randomUUID } from "node:crypto";
import * as fs from "node:fs/promises";
import * as path from "node:path";

import type { IAutoMovieVerification } from "./IAutoMovieVerification";
import { captureAutoMovie } from "./captureAutoMovie";
import { hashAutoMovieFile } from "./hashAutoMovieFile";
import { inspectAutoMovieVerificationCapture } from "./inspectAutoMovieVerificationCapture";
import { inspectAutoMovieVerificationDelivery } from "./inspectAutoMovieVerificationDelivery";
import { inspectAutoMovieVerificationReview } from "./inspectAutoMovieVerificationReview";
import { readAutoMovieErrorCode } from "./readAutoMovieErrorCode";
import { readAutoMovieRevision } from "./readAutoMovieRevision";
import type { readAutoMovieVerifyOptions } from "./readAutoMovieVerifyOptions";

/** Settings the evaluator needs after the CLI admitted its arguments. */
type ISelection = Pick<
  ReturnType<typeof readAutoMovieVerifyOptions>,
  "subjects" | "only" | "require" | "run"
>;

/** A scoped result before its identity and stage membership are attached. */
type IOutcome = Pick<
  IAutoMovieVerification.IResult,
  "state" | "message" | "evidence"
>;

/** A retained local run and its input identity. */
interface IReceipt {
  readonly signature: string;
  readonly outcome: IOutcome;
  readonly measurement?: number;
  readonly recordSha256?: string;
}

/**
 * Evaluate selected targets in declaration order. A status read uses available
 * records and actual bytes. An explicit run executes only the chosen enabled
 * checks and writes a local receipt for each completed measurement or capture
 * refresh. A required stage includes its omitted and unselected required IDs in
 * the same report, so filtering cannot turn missing work into a pass.
 *
 * @param props Production root, admitted command selection and editable
 *   targets.
 * @returns Current results and whether the requested stage is blocked.
 * @throws When target/check IDs or the requested scope are not usable.
 */
export async function runAutoMovieVerification(props: {
  /** Absolute production directory, resolving inputs and owned observations. */
  readonly root: string;

  /** The installed capture host's environment. */
  readonly env: Readonly<Record<string, string | undefined>>;

  /** Subjects defined by this production. */
  readonly targets: readonly IAutoMovieVerification[];

  /** Explicit workload and optional gate. */
  readonly options: ISelection;
}): Promise<IAutoMovieVerification.IReport> {
  const { options, root }: typeof props = props;
  const targets: Map<string, IAutoMovieVerification> = new Map();
  for (const target of props.targets) {
    if (
      !target.id?.trim() ||
      targets.has(target.id) ||
      !Array.isArray(target.checks)
    )
      throw new Error(
        `verify needs a unique ID and a check list for each target: ${target.id}.`,
      );
    targets.set(target.id, target);
  }
  if (options.subjects.length === 0 && targets.size > 1)
    throw new Error(
      `Select --subject from: ${[...targets.keys()].join(", ")}.`,
    );
  const selected: readonly string[] =
    options.subjects.length === 0 ? [...targets.keys()] : options.subjects;
  if (options.require !== null && selected.length === 0)
    throw new Error(
      `Define a verification target before requiring ${options.require}.`,
    );
  const only: Set<string> = new Set(options.only);
  const found: Set<string> = new Set();
  const plans: {
    readonly target: IAutoMovieVerification;
    readonly requirements: readonly string[] | undefined;
  }[] = [];
  for (const id of selected) {
    const target: IAutoMovieVerification | undefined = targets.get(id);
    if (target === undefined)
      throw new Error(`No verification target named ${id}.`);
    const requirements: readonly string[] | undefined =
      options.require === null ||
      !Object.hasOwn(target.required ?? {}, options.require)
        ? undefined
        : target.required?.[options.require];
    if (
      options.require !== null &&
      (!Array.isArray(requirements) ||
        requirements.length === 0 ||
        requirements.some(
          (name: unknown): boolean => typeof name !== "string" || !name.trim(),
        ))
    )
      throw new Error(
        `Target ${id} needs named requirements for verification stage ${options.require}.`,
      );
    const seen: Set<string> = new Set();
    for (const check of target.checks) {
      if (
        !check.id?.trim() ||
        !check.title?.trim() ||
        !check.scope?.trim() ||
        seen.has(check.id)
      )
        throw new Error(
          `Target ${id} needs unique check IDs, titles and scopes: ${check.id}.`,
        );
      seen.add(check.id);
      if (only.has(check.id)) found.add(check.id);
    }
    plans.push({ target, requirements });
  }
  for (const id of only)
    if (!found.has(id))
      throw new Error(`No selected verification check named ${id}.`);

  const items: IAutoMovieVerification.IResult[] = [];
  let revision: string | undefined;
  for (const { target, requirements } of plans) {
    const remaining: Set<string> = new Set(requirements);
    for (const check of target.checks) {
      const required: boolean = remaining.delete(check.id);
      const chosen: boolean = only.size === 0 || only.has(check.id);
      if (!chosen && !required) continue;
      const execute: boolean = options.run && chosen;
      let result: IOutcome;
      try {
        result =
          check.enabled === false
            ? {
                state: "disabled",
                message: "Enable the check to obtain current evidence.",
              }
            : await evaluate({
                root,
                env: props.env,
                target: target.id,
                check,
                execute,
                readRevision: (): string =>
                  (revision ??= readAutoMovieRevision(root)),
              });
      } catch (error) {
        result = {
          state: "unobserved",
          message: error instanceof Error ? error.message : String(error),
        };
      }
      items.push({
        target: target.id,
        id: check.id,
        title: check.title,
        scope: check.scope,
        required,
        ...result,
      });
    }
    for (const missing of remaining)
      items.push({
        target: target.id,
        id: missing,
        title: missing,
        scope: options.require ?? "",
        required: true,
        state: "not-run",
        message:
          "Restore the required check or record the changed requirement at its owner.",
      });
  }
  return {
    targets: selected,
    requiredStage: options.require,
    items,
    blocked: items.some(
      (item: IAutoMovieVerification.IResult): boolean =>
        item.required && item.state !== "passed",
    ),
  };
}

/** Read a check's owning evidence or produce an explicit local or capture run. */
async function evaluate(props: {
  readonly root: string;
  readonly env: Readonly<Record<string, string | undefined>>;
  readonly target: string;
  readonly check: IAutoMovieVerification.Check;
  readonly execute: boolean;
  readonly readRevision: () => string;
}): Promise<IOutcome> {
  const { root, check }: typeof props = props;
  if (check.kind === "delivery")
    return inspectAutoMovieVerificationDelivery(check, root);
  if (check.kind === "review")
    return inspectAutoMovieVerificationReview(check, root);
  if (check.kind !== "measure" && check.kind !== "capture")
    throw new Error("Unknown verification check kind.");

  const file: string = path.join(
    root,
    ".cache",
    "automovie",
    "verify",
    `${digest([props.target, check.id])}.json`,
  );
  const retained: IReceipt | undefined = (await readJson(file)) as
    | IReceipt
    | undefined;
  if (check.kind === "measure") {
    const signature: string = await identify(root, check);
    if (!props.execute) {
      if (retained === undefined)
        return {
          state: "not-run",
          message: "Run this measurement with verify --run.",
        };
      if (retained.signature !== signature)
        return {
          state: "stale",
          message:
            "The criterion or input bytes changed. Run the measurement again.",
        };
      if (
        typeof retained.measurement !== "number" ||
        !Number.isFinite(retained.measurement)
      )
        return {
          state: "failed",
          message:
            retained.outcome?.state === "failed" &&
            typeof retained.outcome.message === "string"
              ? retained.outcome.message
              : "Run the measurement to record its observed quantity.",
          evidence: path.relative(root, file),
        };
      return {
        ...measured(check, retained.measurement),
        evidence: path.relative(root, file),
      };
    }
    let outcome: IOutcome;
    let measurement: number | undefined;
    try {
      measurement = await check.measure(root);
      outcome = measured(check, measurement);
    } catch (error) {
      outcome = {
        state: "failed",
        message: error instanceof Error ? error.message : String(error),
      };
    }
    if ((await identify(root, check)) !== signature)
      return {
        state: "stale",
        message: "Inputs changed while the measurement ran. Run it again.",
      };
    await writeReceipt(file, {
      signature,
      outcome,
      ...(measurement !== undefined && Number.isFinite(measurement)
        ? { measurement }
        : {}),
    });
    return { ...outcome, evidence: path.relative(root, file) };
  }
  const recordPath: string = path.resolve(root, check.record);
  if (props.execute && check.capture !== undefined) {
    const signature: string = await identify(root, check);
    let recorded: string | undefined;
    try {
      await captureAutoMovie({
        root,
        env: props.env,
        args: check.capture,
        write: (): void => {},
        recorded: (file: string): void => {
          recorded = file;
        },
      });
    } catch (error) {
      return {
        state: "failed",
        message: error instanceof Error ? error.message : String(error),
      };
    }
    if (recorded !== recordPath)
      return {
        state: "failed",
        message: `The configured capture wrote ${recorded ?? "no record"}, not ${check.record}.`,
      };
    if ((await identify(root, check)) !== signature)
      return {
        state: "stale",
        message: "Inputs changed during capture. Run it again.",
        evidence: check.record,
      };
    const recordedBytes: Buffer = await fs.readFile(recordPath);
    const recordSha256: string = createHash("sha256")
      .update(recordedBytes)
      .digest("hex");
    const outcome: IOutcome = await inspectAutoMovieVerificationCapture(
      check,
      JSON.parse(recordedBytes.toString("utf8")) as unknown,
      root,
    );
    await writeReceipt(file, { signature, outcome, recordSha256 });
    return outcome;
  }

  let recordBytes: Buffer;
  try {
    recordBytes = await fs.readFile(recordPath);
  } catch (error) {
    if (readAutoMovieErrorCode(error) !== "ENOENT") throw error;
    return {
      state: "not-run",
      message: "Capture the scoped subject to write its record.",
      evidence: check.record,
    };
  }
  const record: unknown = JSON.parse(recordBytes.toString("utf8")) as unknown;
  if (retained?.recordSha256 !== undefined) {
    if (
      retained.signature !== (await identify(root, check)) ||
      retained.recordSha256 !==
        createHash("sha256").update(recordBytes).digest("hex")
    )
      return {
        state: "stale",
        message:
          "The check, input files or recorded bytes changed. Refresh the capture.",
        evidence: check.record,
      };
  } else {
    const current: string = props.readRevision();
    if (
      check.inputs !== undefined ||
      !/^(?:[a-f\d]{40}|[a-f\d]{64})$/u.test(current) ||
      (record as { revision?: string } | null)?.revision !== current
    )
      return {
        state: "unobserved",
        message:
          "Capture input identity is unknown. Declare the scoped files and refresh through verify --run.",
        evidence: check.record,
      };
  }
  return inspectAutoMovieVerificationCapture(check, record, root);
}

/** Derive the status of an actual finite measurement under inclusive limits. */
function measured(
  check: IAutoMovieVerification.IMeasurement,
  value: number,
): IOutcome {
  const { minimum, maximum }: IAutoMovieVerification.IMeasurement = check;
  if (
    !Number.isFinite(value) ||
    !check.unit.trim() ||
    (minimum === undefined && maximum === undefined) ||
    (minimum !== undefined && !Number.isFinite(minimum)) ||
    (maximum !== undefined && !Number.isFinite(maximum)) ||
    (minimum ?? -Infinity) > (maximum ?? Infinity)
  )
    return {
      state: "failed",
      message: "Provide a finite measurement, unit and ordered finite bounds.",
    };
  return {
    state:
      value < (minimum ?? -Infinity) || value > (maximum ?? Infinity)
        ? "failed"
        : "passed",
    message: `${value} ${check.unit}. Required ${minimum ?? "−∞"} through ${maximum ?? "∞"} ${check.unit}.`,
  };
}

/**
 * Hash a check definition and the exact named inputs without walking the
 * project.
 */
async function identify(
  root: string,
  check: IAutoMovieVerification.IMeasurement | IAutoMovieVerification.ICapture,
): Promise<string> {
  const names: readonly string[] = check.inputs ?? [];
  if (!Array.isArray(names) || names.length === 0)
    throw new Error(
      "Declare the scoped input files to establish result currentness.",
    );
  const inputs: [string, string][] = [];
  for (const name of new Set(names)) {
    const file: string = path.resolve(root, name);
    const relative: string = path.relative(root, file);
    if (
      path.isAbsolute(name) ||
      relative === ".." ||
      relative.startsWith(`..${path.sep}`)
    )
      throw new Error(`Verification input must be project-relative: ${name}.`);
    inputs.push([relative, await hashAutoMovieFile(file)]);
  }
  return digest([
    { ...check, enabled: undefined },
    check.kind === "measure" ? String(check.measure) : null,
    inputs,
  ]);
}

/** Compact deterministic identity of a serializable definition or receipt key. */
function digest(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

/** Read a JSON observation, treating only a missing file as unavailable. */
async function readJson(file: string): Promise<unknown> {
  try {
    return JSON.parse(await fs.readFile(file, "utf8")) as unknown;
  } catch (error) {
    if (readAutoMovieErrorCode(error) === "ENOENT") return undefined;
    throw error;
  }
}

/** Publish one complete receipt and preserve the first failure across runs. */
async function writeReceipt(file: string, latest: IReceipt): Promise<void> {
  const temporary: string = `${file}.${randomUUID()}.tmp`;
  await fs.mkdir(path.dirname(file), { recursive: true });
  try {
    await fs.writeFile(temporary, `${JSON.stringify(latest)}\n`, {
      flag: "wx",
    });
    if (latest.outcome.state === "failed") {
      const witness: string = file.replace(/\.json$/u, ".first-failure.json");
      // The link installs a complete witness and leaves any prior one intact.
      await fs.link(temporary, witness).catch((error: unknown): void => {
        if (readAutoMovieErrorCode(error) !== "EEXIST") throw error;
      });
    }
    await fs.rename(temporary, file);
  } catch (error) {
    try {
      await fs.unlink(temporary);
    } catch (cleanup) {
      if (readAutoMovieErrorCode(cleanup) !== "ENOENT")
        throw new AggregateError(
          [error, cleanup],
          "Verification receipt publication and cleanup both failed.",
        );
    }
    throw error;
  }
}
