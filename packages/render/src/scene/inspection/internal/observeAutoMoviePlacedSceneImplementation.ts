import type { IObserveAutoMoviePlacedSceneResult } from "../../IObserveAutoMoviePlacedSceneResult.js";
import type { IObserveAutoMoviePlacedSceneProps } from "../../IObserveAutoMoviePlacedSceneProps.js";
import type { IObserveAutoMoviePlacedSceneCheck } from "../../IObserveAutoMoviePlacedSceneCheck.js";
import { AutoMovieEngineValidation } from "@automovie/engine";
import type {
  IAutoMovieConstraintViolation,
  IAutoMovieInspectionDiagnostics,
  IAutoMoviePlacedContinuity,
} from "@automovie/interface";
import type { Matrix4, Object3D } from "three";

import type { IAutoMoviePlacedObligation } from "../IAutoMoviePlacedObligation.js";
import { inspectAutoMovieNativePlacement } from "./inspectAutoMovieNativePlacement.js";
import { measureAutoMoviePlacedObligation } from "./measureAutoMoviePlacedObligation.js";

type IReport = IObserveAutoMoviePlacedSceneResult;
type IFinding = IAutoMovieInspectionDiagnostics.IFinding;
type ICoverage = IAutoMovieInspectionDiagnostics.ICoverage;
type IWitness = IAutoMovieInspectionDiagnostics.IWitness;
type IMeasurement = IAutoMovieInspectionDiagnostics.IMeasurement;
type ITime = IAutoMovieInspectionDiagnostics.ITime;
type IInput = IObserveAutoMoviePlacedSceneCheck["input"];
type IIdentity = {
  readonly check: string;
  readonly key: string;
  readonly required: boolean;
};

/** Check name of the native placement and physical frame findings. */
const NATIVE_CHECK: string = "placed-transform";

/** Check name of a rule's received contact evidence. */
const RECEIVED_CHECK: string = "received-contact";

/** Check name of each obligation kind. */
const CHECK_NAMES: Readonly<Record<IInput["kind"], string>> = {
  support: "support",
  "scene-support": "support",
  grip: "grip",
  "scene-grip": "grip",
  step: "transform-continuity",
  custody: "custody",
  transform: "authored-transform",
  track: "authored-track",
};

/**
 * Source checks reported as optional and unsupported when no rule supplies
 * them.
 */
const SOURCE_CHECKS: readonly string[] = [
  "support",
  "grip",
  "transform-continuity",
  "custody",
  "authored-track",
];

/**
 * Audit the actual visible native placement and any independent source rules.
 * Default coverage reads active native transforms and the available physical
 * snapshot. Unavailable source intent is reported as optional coverage.
 *
 * Precondition: the host has settled every world matrix of the scene and the
 * camera, as `observeAutoMoviePlacedInspection` does. The observer reads each
 * displayed `matrixWorld` as drawn and never recomposes it. Native findings
 * address a node by `autoMovieInspectionEntityPathOf`, which stays unique when
 * names repeat.
 */
export function observeAutoMoviePlacedSceneImplementation(
  props: IObserveAutoMoviePlacedSceneProps,
): IReport {
  const { scene, camera, physicalFrame, checks, time } = props;
  const findings: IFinding[] = [];
  const coverage: ICoverage[] = [
    { check: NATIVE_CHECK, key: "scene", required: true, status: "checked" },
  ];
  inspectAutoMovieNativePlacement(scene, camera, findings);
  if (physicalFrame !== undefined)
    for (const [body, segments] of Object.entries(physicalFrame.bodies))
      for (const [bone, segment] of Object.entries(segments)) {
        const result: IAutoMoviePlacedContinuity.IResult =
          AutoMovieEngineValidation.measurePlacedContinuity({
            kind: "transform",
            path: `physical.bodies[${JSON.stringify(body)}][${JSON.stringify(bone)}]`,
            observation: {
              kind: "present",
              transform: {
                translation: segment.position,
                rotation: segment.rotation,
                scale: { x: 1, y: 1, z: 1 },
              },
            },
          });
        if (result.status === "checked")
          appendViolations(
            findings,
            NATIVE_CHECK,
            "scene",
            [],
            result.violations,
            {},
          );
      }

  const matrices: Map<Object3D, Matrix4 | undefined> = new Map();
  const provided: Set<string> = new Set();
  for (const rule of checks ?? []) {
    const check: string = CHECK_NAMES[rule.input.kind];
    provided.add(check);
    const identity: IIdentity = {
      check,
      key: rule.key,
      required: rule.required,
    };
    const evidence: ICoverage | undefined = receivedCoverage(rule, check, time);
    if (evidence !== undefined) coverage.push(evidence);
    const observed: IAutoMoviePlacedObligation =
      measureAutoMoviePlacedObligation(scene, matrices, rule.input);
    if (observed.status !== "checked") {
      coverage.push({
        ...identity,
        status: observed.status,
        reason: observed.reason,
      });
      continue;
    }
    coverage.push({ ...identity, status: "checked" });
    if (observed.violations.length === 0) continue;
    const located: IWitness =
      time !== undefined &&
      observed.witness.time?.filmSeconds === time.filmSeconds
        ? { ...observed.witness, time }
        : observed.witness;
    appendViolations(
      findings,
      check,
      rule.key,
      rule.paths ?? [],
      observed.violations,
      withReceivedContact(located, rule, time),
    );
  }
  for (const check of SOURCE_CHECKS)
    if (!provided.has(check))
      coverage.push({
        check,
        key: "source",
        required: false,
        status: "unsupported",
        reason:
          "This placed occurrence supplies no authored observation or expectation for this check.",
      });
  return { findings, coverage };
}

/**
 * The optional coverage row of a rule's received contact evidence at this
 * clock: checked when measured or confirmed absent under complete observation,
 * unsupported with the producer's reason when the pair was unobservable.
 */
function receivedCoverage(
  rule: IObserveAutoMoviePlacedSceneCheck,
  check: string,
  time: ITime | undefined,
): ICoverage | undefined {
  const touch: IObserveAutoMoviePlacedSceneCheck["observedContact"] =
    rule.observedContact;
  if (touch === undefined || touch.seconds !== time?.filmSeconds)
    return undefined;
  const identity: IIdentity = {
    check: RECEIVED_CHECK,
    key: `${check}:${rule.key}`,
    required: false,
  };
  return touch.status === "unobservable"
    ? { ...identity, status: "unsupported", reason: touch.reason }
    : { ...identity, status: "checked" };
}

/**
 * The witness with the rule's received evidence at this clock: a zero contact
 * count when confirmed absent, the received separation when measured, and the
 * normal impulse when the measured pair touched with solver evidence.
 */
function withReceivedContact(
  witness: IWitness,
  rule: IObserveAutoMoviePlacedSceneCheck,
  time: ITime | undefined,
): IWitness {
  const touch: IObserveAutoMoviePlacedSceneCheck["observedContact"] =
    rule.observedContact;
  if (touch === undefined || touch.seconds !== time?.filmSeconds)
    return witness;
  if (touch.status === "absent")
    return {
      ...witness,
      measurements: [
        ...(witness.measurements ?? []),
        { name: "received-contacts", value: 0, unit: "count" },
      ],
    };
  if (touch.status !== "measured") return witness;
  const received: IMeasurement[] = [
    { name: "received-separation", value: touch.separation, unit: "m" },
  ];
  if (touch.separation <= 0 && touch.impulse !== null && touch.impulse >= 0)
    received.push({
      name: "received-normal-impulse",
      value: touch.impulse,
      unit: "N s",
    });
  return {
    ...witness,
    measurements: [...(witness.measurements ?? []), ...received],
  };
}

/**
 * Append one confirmed finding per distinct violation of a rule, merging the
 * expectations of violations that share kind, path and severity, and ranking
 * each by the magnitude of the measure its path names.
 */
function appendViolations(
  findings: IFinding[],
  check: string,
  key: string,
  paths: readonly string[],
  violations: readonly IAutoMovieConstraintViolation[],
  witness: IWitness,
): void {
  if (violations.length === 0) return;
  const unique: Map<string, IAutoMovieConstraintViolation> = new Map();
  for (const violation of violations) {
    const identity: string = JSON.stringify([
      violation.kind,
      violation.path,
      violation.severity,
    ]);
    const prior: IAutoMovieConstraintViolation | undefined =
      unique.get(identity);
    unique.set(
      identity,
      prior === undefined || prior.expected === violation.expected
        ? violation
        : {
            ...violation,
            expected: `${prior.expected}. ${violation.expected}`,
          },
    );
  }
  for (const violation of unique.values()) {
    const measure: IMeasurement | undefined = witness.measurements?.find(
      ({ name }: IMeasurement): boolean => violation.path.endsWith(`.${name}`),
    );
    findings.push({
      check,
      key,
      code: `${check}-${violation.kind}-${violation.severity}`,
      paths: [...new Set([...paths, violation.path])],
      category: violation.severity,
      confidence: "confirmed",
      message: violation.expected,
      witness:
        measure === undefined || typeof measure.value !== "number"
          ? witness
          : { ...witness, rank: Math.abs(measure.value) },
    });
  }
}
