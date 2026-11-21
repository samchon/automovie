import {
  measureAutoMoviePlacedContact,
  measureAutoMoviePlacedContinuity,
} from "@automovie/engine";
import type {
  IAutoMovieConstraintViolation,
  IAutoMovieInspectionDiagnostics,
  IAutoMoviePlacedContact,
  IAutoMoviePlacedContinuity,
  IAutoMovieVector3,
} from "@automovie/interface";
import { type Matrix4, type Object3D, Vector3 } from "three";

import type { IObserveAutoMoviePlacedScene } from "./IObserveAutoMoviePlacedScene.js";
import { readAutoMovieNativeRigidFrame } from "./readAutoMovieNativeRigidFrame.js";

type IReport = Pick<IAutoMovieInspectionDiagnostics, "findings" | "coverage">;
type IFinding = IAutoMovieInspectionDiagnostics.IFinding;
type ICoverage = IAutoMovieInspectionDiagnostics.ICoverage;
type IWitness = IAutoMovieInspectionDiagnostics.IWitness;
type IMeasurement = IAutoMovieInspectionDiagnostics.IMeasurement;
type IInput = IObserveAutoMoviePlacedScene.ICheck["input"];

const NATIVE_CHECK = "placed-transform";
const FRAME_TOLERANCE = 1e-6;
const MATRIX_ISSUE =
  "active matrix must be finite and affine, and invertible for a camera";
const NATIVE_ISSUES = {
  matrix: MATRIX_ISSUE,
  matrixWorld: MATRIX_ISSUE,
  position: "position components must be finite",
  quaternion: "rotation must be a finite unit quaternion",
  scale: "scale components must be finite and nonzero for a camera",
};
const CHECK_NAMES: Record<IInput["kind"], string> = {
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
 * Audit the actual visible native placement and any independent source rules.
 * Default coverage reads active native transforms and the available physical
 * snapshot. Unavailable source intent is reported as optional coverage.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes displayed matrix and component authority, raw physical transforms, and optional versus declared coverage.
 * @evidence contracts/development/implementation.md#principled-implementation Validates active native affine matrices or component transforms, delegates canonical limits to Engine, and maps measured metre/radian values and exact edge intervals into typed witness records.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure A native pass covers visible nodes and camera. The selected rules use Engine's placed detectors, and one report path attaches each witness to its matching coverage row.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reads the placed source once without another seek or motion solve. Stale TRS behind a manual matrix, excluded boundaries and impulse observations cannot create false support or grip coverage.
 * @evidence contracts/development/implementation.md#efficient-algorithms Visits visible nodes and supplied physical segments once, plus explicitly selected obligations. A request-local map shares native matrix reads across rules. It never scans historical contact receipts or raw keyframes per frame.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses Three's active native matrix composition for selected references and Engine's existing canonical predicates for support, grip, transforms and custody.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only report data escapes the call. The request-local matrix index and temporary rigid frame views are released, and no geometry or host is acquired.
 */
export function observeAutoMoviePlacedScene(
  props: IObserveAutoMoviePlacedScene.IProps,
): IReport {
  const { scene, camera, physicalFrame, checks, time } = props;
  const findings: IFinding[] = [];
  const coverage: ICoverage[] = [
    { check: NATIVE_CHECK, key: "scene", required: true, status: "checked" },
  ];
  scene.traverseVisible((object: Object3D): void => {
    if (object !== camera) inspectNative(object, false, findings);
  });
  inspectNative(camera, true, findings);
  if (physicalFrame !== undefined)
    for (const [body, segments] of Object.entries(physicalFrame.bodies))
      for (const [bone, segment] of Object.entries(segments)) {
        const path = `physical.bodies[${JSON.stringify(body)}][${JSON.stringify(bone)}]`;
        const result = measureAutoMoviePlacedContinuity({
          kind: "transform",
          path,
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

  const matrices = new Map<Object3D, Matrix4 | undefined>();
  const provided = new Set<string>();
  for (const rule of checks ?? []) {
    const check = CHECK_NAMES[rule.input.kind];
    provided.add(check);
    const identity = { check, key: rule.key, required: rule.required };
    const observed = observeCheck(scene, matrices, rule.input);
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
    const located =
      time !== undefined &&
      observed.witness.time?.filmSeconds === time.filmSeconds
        ? { ...observed.witness, time }
        : observed.witness;
    const witness = withReceivedContact(located, rule, time);
    appendViolations(
      findings,
      check,
      rule.key,
      rule.paths ?? [],
      observed.violations,
      witness,
    );
  }
  for (const check of [
    "support",
    "grip",
    "transform-continuity",
    "custody",
    "authored-track",
  ])
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

function inspectNative(
  object: Object3D,
  isCamera: boolean,
  findings: IFinding[],
): void {
  const authority = !object.matrixWorldAutoUpdate
    ? "matrixWorld"
    : !object.matrixAutoUpdate
      ? "matrix"
      : undefined;
  if (authority !== undefined) {
    const matrix = object[authority];
    const determinant = isCamera ? matrix.determinant() : 1;
    if (!isAffine(matrix) || !Number.isFinite(determinant) || determinant === 0)
      nativeFinding(object, isCamera, authority, findings);
    return;
  }
  if (!finiteVector(object.position))
    nativeFinding(object, isCamera, "position", findings);
  if (!(Math.abs(object.quaternion.length() - 1) <= FRAME_TOLERANCE))
    nativeFinding(object, isCamera, "quaternion", findings);
  const { scale } = object;
  if (
    !finiteVector(scale) ||
    (isCamera && (scale.x === 0 || scale.y === 0 || scale.z === 0))
  )
    nativeFinding(object, isCamera, "scale", findings);
}

function nativeFinding(
  object: Object3D,
  isCamera: boolean,
  field: keyof typeof NATIVE_ISSUES,
  findings: IFinding[],
): void {
  const parts: string[] = [];
  if (!isCamera)
    for (let node: Object3D = object; node.parent !== null; node = node.parent)
      parts.push(`children[${node.parent.children.indexOf(node)}]`);
  const path = isCamera ? "camera" : ["scene", ...parts.reverse()].join(".");
  findings.push({
    check: NATIVE_CHECK,
    key: "scene",
    code: "invalid-native-transform",
    paths: [`${path}.${field}`],
    category: "error",
    confidence: "confirmed",
    message: NATIVE_ISSUES[field],
    witness: {},
  });
}

function isAffine(matrix: Matrix4): boolean {
  const elements = matrix.elements;
  return (
    elements.every(Number.isFinite) &&
    elements[3] === 0 &&
    elements[7] === 0 &&
    elements[11] === 0 &&
    elements[15] === 1
  );
}

function finiteVector(point: IAutoMovieVector3): boolean {
  return (
    Number.isFinite(point.x) &&
    Number.isFinite(point.y) &&
    Number.isFinite(point.z)
  );
}

type IChecked = {
  readonly status: "checked";
  readonly violations: readonly IAutoMovieConstraintViolation[];
  readonly witness: IWitness;
};
type IUnavailable = {
  readonly status: "unsupported" | "excluded";
  readonly reason: string;
};
type IObserved = IChecked | IUnavailable;

function checked(
  violations: readonly IAutoMovieConstraintViolation[],
): IChecked {
  return { status: "checked", violations, witness: {} };
}

function observeCheck(
  scene: Object3D,
  matrices: Map<Object3D, Matrix4 | undefined>,
  input: IInput,
): IObserved {
  if (input.kind === "track")
    return input.violations === undefined
      ? {
          status: "unsupported",
          reason: "No raw source clip admission was supplied.",
        }
      : checked(input.violations);
  if (input.kind === "scene-support" || input.kind === "scene-grip")
    return observeContact(nativeContact(scene, matrices, input));
  if (input.kind === "support" || input.kind === "grip")
    return observeContact(input);
  return observeContinuity(input);
}

function nativeContact(
  scene: Object3D,
  matrices: Map<Object3D, Matrix4 | undefined>,
  input:
    | IObserveAutoMoviePlacedScene.INativeSupport
    | IObserveAutoMoviePlacedScene.INativeGrip,
): IAutoMoviePlacedContact.IProps {
  if (input.kind === "scene-support") {
    const { sample, path, maxGap, maxSlip } = input;
    const request = { kind: "support", path, maxGap, maxSlip } as const;
    if (sample === undefined) return request;
    const socket = placedMatrix(scene, matrices, sample.socket);
    const frame = readAutoMovieNativeRigidFrame(
      placedMatrix(scene, matrices, sample.support),
      FRAME_TOLERANCE,
    );
    return socket === undefined || frame === undefined
      ? request
      : {
          ...request,
          sample: {
            point: new Vector3().setFromMatrixPosition(socket),
            frame,
            anchor: sample.anchor,
          },
        };
  }
  const { sample, path, maxDistance, maxAngle } = input;
  const request = { kind: "grip", path, maxDistance, maxAngle } as const;
  if (sample === undefined) return request;
  const hand = readAutoMovieNativeRigidFrame(
    placedMatrix(scene, matrices, sample.hand),
    FRAME_TOLERANCE,
  );
  const prop = readAutoMovieNativeRigidFrame(
    placedMatrix(scene, matrices, sample.prop),
    FRAME_TOLERANCE,
  );
  return hand === undefined || prop === undefined
    ? request
    : { ...request, sample: { hand, prop, expected: sample.expected } };
}

function placedMatrix(
  scene: Object3D,
  matrices: Map<Object3D, Matrix4 | undefined>,
  object: Object3D,
): Matrix4 | undefined {
  if (matrices.has(object)) return matrices.get(object);
  let root = object;
  while (root !== scene && root.parent !== null) root = root.parent;
  let matrix: Matrix4 | undefined;
  if (root === scene) {
    object.updateWorldMatrix(true, false);
    if (isAffine(object.matrixWorld)) matrix = object.matrixWorld;
  }
  matrices.set(object, matrix);
  return matrix;
}

function observeContact(input: IAutoMoviePlacedContact.IProps): IObserved {
  const result = measureAutoMoviePlacedContact(input);
  if (result.status === "unsupported")
    return {
      status: "unsupported",
      reason:
        "The declared contact point, rigid frame or target was unavailable.",
    };
  if (result.violations.length === 0) return checked(result.violations);
  const point =
    input.kind === "support"
      ? input.sample?.point
      : input.sample?.prop?.position;
  const witness =
    point != null && finiteVector(point)
      ? { point: { x: point.x, y: point.y, z: point.z } }
      : {};
  if (result.status === "invalid")
    return { status: "checked", violations: result.violations, witness };
  const measurements =
    result.kind === "support" && input.kind === "support"
      ? [
          { name: "gap", value: result.gap, limit: input.maxGap, unit: "m" },
          { name: "slip", value: result.slip, limit: input.maxSlip, unit: "m" },
        ]
      : result.kind === "grip" && input.kind === "grip"
        ? [
            {
              name: "distance",
              value: result.distance,
              limit: input.maxDistance,
              unit: "m",
            },
            {
              name: "angle",
              value: result.angle,
              limit: input.maxAngle,
              unit: "rad",
            },
          ]
        : [];
  return {
    status: "checked",
    violations: result.violations,
    witness: { ...witness, measurements },
  };
}

function observeContinuity(
  input: IAutoMoviePlacedContinuity.IProps,
): IObserved {
  const result = measureAutoMoviePlacedContinuity(input);
  if (result.status === "excluded")
    return {
      status: "excluded",
      reason: "The source declared a cut or intentional discontinuity.",
    };
  if (result.status === "unsupported")
    return {
      status: "unsupported",
      reason:
        "An authoritative source transform, endpoint or holder was unavailable.",
    };
  if (
    result.violations.length === 0 ||
    input.kind !== "step" ||
    result.motion === undefined ||
    input.before === undefined ||
    input.after === undefined
  )
    return checked(result.violations);
  const point = input.after.transform.translation;
  return {
    status: "checked",
    violations: result.violations,
    witness: {
      point: { x: point.x, y: point.y, z: point.z },
      time: { filmSeconds: input.after.seconds },
      interval: { from: input.before.seconds, to: input.after.seconds },
      measurements: [
        {
          name: "distance",
          value: result.motion.distance,
          unit: "m",
          ...(input.maxDistance === undefined
            ? {}
            : { limit: input.maxDistance }),
        },
        {
          name: "angle",
          value: result.motion.angle,
          unit: "rad",
          ...(input.maxAngle === undefined ? {} : { limit: input.maxAngle }),
        },
      ],
    },
  };
}

function withReceivedContact(
  witness: IWitness,
  rule: IObserveAutoMoviePlacedScene.ICheck,
  time: IAutoMovieInspectionDiagnostics.ITime | undefined,
): IWitness {
  const touch = rule.observedContact;
  if (
    touch === undefined ||
    touch.seconds !== time?.filmSeconds ||
    !Number.isFinite(touch.separation)
  )
    return witness;
  const received: IMeasurement[] = [
    { name: "received-separation", value: touch.separation, unit: "m" },
  ];
  if (
    touch.separation <= 0 &&
    touch.impulse !== null &&
    Number.isFinite(touch.impulse) &&
    touch.impulse >= 0
  )
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

function appendViolations(
  findings: IFinding[],
  check: string,
  key: string,
  paths: readonly string[],
  violations: readonly IAutoMovieConstraintViolation[],
  witness: IWitness,
): void {
  if (violations.length === 0) return;
  const unique = new Map<string, IAutoMovieConstraintViolation>();
  for (const violation of violations) {
    const identity = JSON.stringify([
      violation.kind,
      violation.path,
      violation.severity,
    ]);
    const prior = unique.get(identity);
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
    const measure = witness.measurements?.find(({ name }) =>
      violation.path.endsWith(`.${name}`),
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
