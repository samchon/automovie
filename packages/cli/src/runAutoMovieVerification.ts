import { createHash } from "node:crypto";
import * as fs from "node:fs/promises";
import * as path from "node:path";

import type { IAutoMovieVerification } from "./IAutoMovieVerification";
import { captureAutoMovie } from "./captureAutoMovie";
import { createAutoMovieVerificationInputScope } from "./createAutoMovieVerificationInputScope";
import { createAutoMovieVerificationMediaHash } from "./createAutoMovieVerificationMediaHash";
import { hashAutoMovieFile } from "./hashAutoMovieFile";
import { inspectAutoMovieVerificationCapture } from "./inspectAutoMovieVerificationCapture";
import { inspectAutoMovieVerificationDelivery } from "./inspectAutoMovieVerificationDelivery";
import { inspectAutoMovieVerificationReview } from "./inspectAutoMovieVerificationReview";
import { readAutoMovieErrorCode } from "./readAutoMovieErrorCode";
import { readAutoMovieRevision } from "./readAutoMovieRevision";
import type { readAutoMovieVerifyOptions } from "./readAutoMovieVerifyOptions";
import { writeAutoMovieVerificationReceipt } from "./writeAutoMovieVerificationReceipt";

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

/** Lazily resolved boundaries for explicitly named production inputs. */
type AutoMovieVerificationInputScope = ReturnType<
  typeof createAutoMovieVerificationInputScope
>;

/** A known local record is damaged and needs repair at its owner. */
const DAMAGED_JSON: unique symbol = Symbol("damaged verification JSON");

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

  /** Native module observations supplied by the CLI loader for measurements. */
  readonly measurementSources?: (
    file: string | undefined,
  ) => ReadonlyMap<string, string>;
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
    options.subjects.length === 0
      ? [...targets.keys()]
      : [...new Set(options.subjects)];
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
  const inputScope: AutoMovieVerificationInputScope =
    createAutoMovieVerificationInputScope(root);
  const hashMedia: (file: string) => Promise<string> =
    createAutoMovieVerificationMediaHash();
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
                inputScope,
                measurementSources: props.measurementSources,
                hashMedia,
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
  readonly inputScope: AutoMovieVerificationInputScope;
  readonly measurementSources?: (
    file: string | undefined,
  ) => ReadonlyMap<string, string>;
  readonly hashMedia: (file: string) => Promise<string>;
  readonly readRevision: () => string;
}): Promise<IOutcome> {
  const { root, check }: typeof props = props;
  if (check.kind === "delivery")
    return inspectAutoMovieVerificationDelivery(check, root, props.hashMedia);
  if (check.kind === "review")
    return inspectAutoMovieVerificationReview(check, root, props.hashMedia);
  if (check.kind !== "measure" && check.kind !== "capture")
    throw new Error("Unknown verification check kind.");

  const file: string = path.join(
    root,
    ".cache",
    "automovie",
    "verify",
    `${digest([props.target, check.id])}.json`,
  );
  const refresh: boolean =
    props.execute && (check.kind === "measure" || check.capture !== undefined);
  const retained: IReceipt | undefined | typeof DAMAGED_JSON = refresh
    ? undefined
    : ((await readJson(file)) as IReceipt | undefined | typeof DAMAGED_JSON);
  if (retained === DAMAGED_JSON)
    return damaged(
      path.relative(root, file),
      "Run verify --run for this check to rebuild its receipt.",
    );
  if (check.kind === "measure") {
    const signature: string = await props.inputScope.identify(
      check,
      props.measurementSources,
    );
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
    if (
      (await props.inputScope.identify(check, props.measurementSources)) !==
      signature
    )
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
    const signature: string = await props.inputScope.identify(check);
    let serializedRecord: string | undefined;
    try {
      await captureAutoMovie({
        root,
        env: props.env,
        args: check.capture,
        expectedRecord: recordPath,
        write: (): void => {},
        recorded: (_file: string, serialized: string): void => {
          serializedRecord = serialized;
        },
      });
    } catch (error) {
      return {
        state: "failed",
        message: error instanceof Error ? error.message : String(error),
      };
    }
    if (serializedRecord === undefined)
      return {
        state: "failed",
        message: `The configured capture did not complete ${check.record}.`,
      };
    if ((await props.inputScope.identify(check)) !== signature)
      return {
        state: "stale",
        message: "Inputs changed during capture. Run it again.",
        evidence: check.record,
      };
    const recordSha256: string = createHash("sha256")
      .update(serializedRecord)
      .digest("hex");
    const outcome: IOutcome = await inspectAutoMovieVerificationCapture(
      check,
      JSON.parse(serializedRecord) as unknown,
      root,
      props.hashMedia,
    );
    if ((await hashAutoMovieFile(recordPath)) !== recordSha256)
      return {
        state: "stale",
        message: "Another capture replaced the record. Refresh it again.",
        evidence: check.record,
      };
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
  const record: unknown = parseJson(recordBytes.toString("utf8"));
  if (record === DAMAGED_JSON)
    return damaged(check.record, "Restore its record or refresh this capture.");
  if (retained?.recordSha256 !== undefined) {
    if (
      retained.signature !== (await props.inputScope.identify(check)) ||
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
    const recordedRevision: unknown = (record as { revision?: unknown } | null)
      ?.revision;
    if (
      check.inputs !== undefined ||
      typeof recordedRevision !== "string" ||
      !/^(?:[a-f\d]{40}|[a-f\d]{64})$/u.test(recordedRevision) ||
      (await props.inputScope.checkout()) !==
        (await props.inputScope.project()) ||
      recordedRevision !== props.readRevision()
    )
      return {
        state: "unobserved",
        message:
          "Capture input identity is unknown. Declare the scoped files and refresh through verify --run.",
        evidence: check.record,
      };
  }
  return inspectAutoMovieVerificationCapture(
    check,
    record,
    root,
    props.hashMedia,
  );
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

/** Compact deterministic identity of a serializable definition or receipt key. */
function digest(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

/** Read a JSON observation, treating only a missing file as unavailable. */
async function readJson(file: string): Promise<unknown> {
  try {
    return parseJson(await fs.readFile(file, "utf8"));
  } catch (error) {
    if (readAutoMovieErrorCode(error) === "ENOENT") return undefined;
    throw error;
  }
}

/** Keep a damaged JSON file distinguishable from an absent or old record. */
function parseJson(contents: string): unknown {
  try {
    return JSON.parse(contents) as unknown;
  } catch (error) {
    if (error instanceof SyntaxError) return DAMAGED_JSON;
    throw error;
  }
}

/** Explain which file is damaged and how to obtain usable evidence. */
function damaged(evidence: string, recovery: string): IOutcome {
  return {
    state: "unobserved",
    message: `The JSON record is damaged. ${recovery}`,
    evidence,
  };
}

/** Encode the durable record before handing it to the atomic publisher. */
function writeReceipt(file: string, latest: IReceipt): Promise<void> {
  return writeAutoMovieVerificationReceipt(
    file,
    `${JSON.stringify(latest)}\n`,
    latest.outcome.state === "failed",
  );
}
