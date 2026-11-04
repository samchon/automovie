import { Quaternion } from "@automovie/engine";
import {
  AutoMovieHumanClinicalIk,
  AutoMovieHumanRigControls,
  type AutoMovieHumanSkeleton,
  type IAutoMovieHumanPose,
} from "@automovie/human";
import type { IAutoMovieQuaternion } from "@automovie/interface";

import type { MotionAction } from "../core/MotionAction";
import { PunchShape } from "./PunchShape";

/**
 * One clinical arm path, independent pad task and same-FK diagnostic witnesses.
 *
 * @evidence contracts/common.md#implementation-and-ownership Public Human FK retains normal scapulohumeral coupling. Clinical IK fits the unchanged independent pad through shoulder3 and elbow with the authored bend and actual three-point peak-plane inequalities. Actual family shape is independently admitted afterward; anatomical witnesses carry no invented fixed-origin targets. Native error, work, clamps and shape failures remain observable.
 * @evidence contracts/common.md#authoring-interface Body-frame metres and public clinical degrees apply. The immutable external pad target remains hard even when seed or final fitting fails. Internal witnesses carry no solver priority. Family bend and plane are authored admission conditions, not a fixed-origin reach certificate; original public ROM applies. Only an actual contact may truncate delivery.
 */
export namespace PunchArm {
  /**
   * Current-shape reach and full-limb pose requests, without a scene or film clock.
   *
   * @evidence contracts/common.md#implementation-and-ownership Carries one clinical seed and a literal independent pad task. Internal shape is exposed separately through witnesses; range metadata never certifies successful clinical or final support fitting.
   * @evidence contracts/common.md#authoring-interface All target points use requested-root FK metres. The host preserves the declared clinical shape controls and jointly checks the external pad, retained support and complete original geometry.
   */
  export interface Result {
    /** Independently owned clinical arm seed, with other authored regions preserved. */
    pose: IAutoMovieHumanPose;
    /** Literal external pad task; internal anatomical references are separate diagnostics. */
    effectors: MotionAction.Effector[];
    /** Current shoulder-to-requested-point distance, metres. */
    distance: number;
    /** Current measured arm/pad reach with the authored extension margin, metres. */
    maximum: number;
    /** Source realization receipt; a finite pose alone never admits the task. */
    fit: Fit;
  }

  /**
   * Independent raw task and same-chain seed realization facts.
   * @evidence contracts/common.md#implementation-and-ownership Retains native public IK pad error, work count and clamp rows unchanged. Actual family-shape admission is distinct from point convergence; the shoulder/elbow/wrist witnesses are actual geometry with no fabricated Cartesian reference.
   * @evidence contracts/common.md#authoring-interface Errors and points use evaluator metres. Realized requires the unchanged .25mm seed criterion and family-shape admission. The host still independently checks original WORLD pad, complete support, floor, bounds and displayed technique geometry.
   */
  export interface Fit {
    /** Seed task acceptance, not whole-body or collision admission. */ status:
      | "realized"
      | "unresolved";
    /** Largest source reference residual, metres. */ error: number;
    /** Existing public solver updates performed. */ iterations: number;
    /** Same actual FK clinical admission rows, without hiding clamps. */ clamped: AutoMovieHumanSkeleton.IOutput["clamped"];
    /** Exactly the eligible coupled arm channels used by both source and host. */ channels: AutoMovieHumanRigControls.DegreeChannel[];
    /** Literal independent pad residual; anatomical witnesses have no invented target. */ points: {
      name: Witness["name"];
      target: MotionAction.Vec3;
      actual: MotionAction.Vec3;
      error: number;
    }[];
    /** Independent actual family-shape admission, separate from native point error. */ shape: ShapeAdmission;
    /** Independent SDK inequality values and violations, in descriptor order. */ constraintValues: AutoMovieHumanClinicalIk.IResult["constraintValues"];
    /** SDK constraint outcome, separate from literal pad residual and final admission. */ constraintsSatisfied: boolean;
  }

  /**
   * Actual coupled-FK family geometry, independent from the pad residual.
   * @evidence contracts/common.md#implementation-and-ownership Original shoulder, elbow, wrist and real Hand-bound pad supply these observations. No fixed shoulder origin or rigid Cartesian elbow/Hand target is invented; normal scapulohumeral coupling remains active.
   * @evidence contracts/common.md#authoring-interface Angles use degrees and plane uses evaluator Y metres. Authored family bend/peak-plane and neutral-wrist checks keep their original limits. Failure remains visible even when the native pad solve converges.
   */
  export interface ShapeAdmission {
    /** Applied public clinical elbow bend. */ elbowDegrees: number;
    /** Actual included shoulder-elbow-wrist angle. */ includedDegrees: number;
    /** Elbow displacement from the shoulder-wrist line along evaluator Y. */ planeMetres: number;
    /** Actual rigid glove continuation dot product. */ padAlignment: number;
    /** Applied public wrist flexion and deviation. */ wristDegrees: [
      number,
      number,
    ];
    /** Every independent failed family condition. */ failures: string[];
  }

  /**
   * Select the same small coupled arm chain for source and actual host fitting.
   * @evidence contracts/common.md#implementation-and-ownership Shoulder3 and elbow adapt through the real Human FK, including ancestor lift. Girdle, forearm and wrist are not indiscriminately unlocked, and body/root stay under their existing owner.
   * @evidence contracts/common.md#authoring-interface Returns fresh canonical own-side degree channels; public ROM and the unchanged source work/precision budget still apply.
   */
  export function armChannels(
    side: MotionAction.Side,
  ): AutoMovieHumanRigControls.DegreeChannel[] {
    return [
      `arms.${side}.shoulder.flexion`,
      `arms.${side}.shoulder.abduction`,
      `arms.${side}.shoulder.rotation`,
      `arms.${side}.elbow.flexion`,
    ];
  }

  /**
   * Admit actual family geometry after independent pad fitting.
   * @evidence contracts/common.md#implementation-and-ownership Reads actual public applied controls and same-candidate FK. The normal coupled shoulder centre may move; segment lengths and actual elbow plane remain independently observable. No achieved point replaces a failed raw target.
   * @evidence contracts/common.md#authoring-interface drive is the closed-unit authored phase weight. Family peak plane/minimum bend and neutral impact wrist remain explicit admission. An actual moving wrist entry retains its declared pre-impact curve; it is not reset to neutral. Rigid pad alignment is checked whenever the declared wrist is neutral. Public clamp rows remain the caller's original receipt.
   */
  export function admission(
    context: MotionAction.Context,
    pose: IAutoMovieHumanPose,
    side: MotionAction.Side,
    kind: PunchShape.Kind,
    drive: number,
    clamped: AutoMovieHumanSkeleton.IOutput["clamped"],
    intended: IAutoMovieHumanPose = pose,
  ): ShapeAdmission {
    const rows: Witness[] = witnesses(context, pose, side);
    const shoulder: MotionAction.Vec3 = rows[1]!.point;
    const elbow: MotionAction.Vec3 = rows[2]!.point;
    const wrist: MotionAction.Vec3 = rows[3]!.point;
    const upper: MotionAction.Vec3 = sub(shoulder, elbow);
    const lower: MotionAction.Vec3 = sub(wrist, elbow);
    const axis: MotionAction.Vec3 = unit(sub(wrist, shoulder));
    const offLine: MotionAction.Vec3 = sub(
      sub(elbow, shoulder),
      scale(axis, dot(sub(elbow, shoulder), axis)),
    );
    const elbowDegrees: number = AutoMovieHumanRigControls.readApplied(
      pose,
      `arms.${side}.elbow.flexion`,
      clamped,
    );
    const wristDegrees: [number, number] = [
      AutoMovieHumanRigControls.readApplied(
        pose,
        `arms.${side}.wrist.flexion`,
        clamped,
      ),
      AutoMovieHumanRigControls.readApplied(
        pose,
        `arms.${side}.wrist.radialDeviation`,
        clamped,
      ),
    ];
    const padAlignment: number = dot(
      unit(sub(rows[0]!.point, wrist)),
      unit(lower),
    );
    const failures: string[] = [];
    if (elbowDegrees < PunchShape.extension(kind) * drive - 1e-8)
      failures.push("Family minimum elbow bend was lost");
    const expectedWrist: [number, number] = [
      AutoMovieHumanRigControls.readApplied(
        intended,
        `arms.${side}.wrist.flexion`,
        [],
      ),
      AutoMovieHumanRigControls.readApplied(
        intended,
        `arms.${side}.wrist.radialDeviation`,
        [],
      ),
    ];
    if (
      wristDegrees.some(
        (value: number, index: number): boolean =>
          Math.abs(value - expectedWrist[index]!) > 1e-8,
      )
    )
      failures.push("Owned wrist trajectory was changed");
    if (
      drive >= 1 - 1e-10 &&
      wristDegrees.some((value: number): boolean => Math.abs(value) > 1e-8)
    )
      failures.push("Peak wrist is not clinically neutral");
    if (
      expectedWrist.every(
        (value: number): boolean => Math.abs(value) <= 1e-8,
      ) &&
      padAlignment < 1 - 1e-10
    )
      failures.push(
        "Hand-bound pad does not continue the neutral wrist forearm",
      );
    if (
      drive >= 1 - 1e-10 &&
      (kind === "hook"
        ? offLine[1] < 0.02
        : kind === "uppercut"
          ? offLine[1] > -0.02
          : offLine[1] > 0.002)
    )
      failures.push("Actual family peak elbow plane was lost");
    if (
      clamped.some((row: AutoMovieHumanSkeleton.IClamp): boolean =>
        row.path.startsWith(`arms.${side}.`),
      )
    )
      failures.push("Owned arm has public clinical clamp rows");
    return {
      elbowDegrees,
      includedDegrees:
        (Math.acos(Math.max(-1, Math.min(1, dot(unit(upper), unit(lower))))) *
          180) /
        Math.PI,
      planeMetres: offLine[1],
      padAlignment,
      wristDegrees,
      failures,
    };
  }

  /**
   * A diagnostic point/frame on the single authoritative clinical arm path.
   * @evidence contracts/common.md#implementation-and-ownership Every witness comes from the same public FK snapshot and real Hand-bound pad lever. It is not an independently fitted Cartesian target or an impact replacement.
   * @evidence contracts/common.md#authoring-interface Point is body-frame metres and rotation is x/y/z/w. Owned bone/local identities permit independent comparison with the actual displayed person; pad feasibility remains a separate literal external task.
   */
  export interface Witness {
    /** Stable anatomical role in the connected arm. */ name:
      | "pad"
      | "shoulder"
      | "elbow"
      | "wrist"
      | "handFrame";
    /** Actual original bone carrying the reference. */ bone: AutoMovieHumanRigControls.Joint;
    /** Actual bone-local witness, metres. */ localPoint: MotionAction.Vec3;
    /** Same-snapshot public FK point, body-frame metres. */ point: MotionAction.Vec3;
    /** Same-snapshot body-frame bone rotation. */ rotation: [
      number,
      number,
      number,
      number,
    ];
  }

  /**
   * Bound a target against this exact authored body's currently posed shoulder.
   *
   * @evidence contracts/common.md#implementation-and-ownership Uses actual neutral-FK upper-arm length and Hand-local forearm/glove-centre lever with the family's authored elbow margin from PunchShape. It never widens bone lengths, changes an opponent or substitutes the baseline shoulder after torso/scapula motion.
   * @evidence contracts/common.md#authoring-interface Input point and returned point use FK-local metres. Missing actual FK/neutral data or noncollinear equipment refuses. This instantaneous neutral-wrist triangle is only a nominal stroke-envelope choice: shoulder motion can move its origin, so it is not a coupled reachability or feasibility certificate.
   */
  export function bound(
    context: MotionAction.Context,
    pose: IAutoMovieHumanPose,
    side: MotionAction.Side,
    point: MotionAction.Vec3,
    kind: PunchShape.Kind,
  ): { point: MotionAction.Vec3; distance: number; maximum: number } {
    const data: Geometry = geometry(context, pose, side);
    return limit(data, point, kind);
  }

  /**
   * Author a connected clinical shape around an independent pad task.
   *
   * @evidence contracts/common.md#implementation-and-ownership Uses the already realized body with normal coupled shoulder-origin motion. The public bounded solver adapts only shoulder3 and elbow to the literal independent pad while respecting the original elbow margin and same-FK elbow displacement from its moving shoulder-wrist line. No pre-IK distance formula freezes the elbow and no Cartesian elbow target is fabricated. Actual family angle/plane/wrist and all public clamps remain independent admission.
   * @evidence contracts/common.md#authoring-interface Pose/root/target describe the same realized body; drive is finite in[0,1]. The caller authors any outer-bound miss before this call; the literal supplied pad is never reclamped after fitting. Source and host retain authored girdle/forearm/wrist trajectories and admit the same shoulder3+elbow. Public bounds remain unchanged; fit retains unresolved raw residuals, work, clamp rows and shape failures. Actual angle/plane/lever/continuity remain independent checks.
   */
  export function compose(
    context: MotionAction.Context,
    pose: IAutoMovieHumanPose,
    side: MotionAction.Side,
    target: MotionAction.Vec3,
    active: boolean,
    kind: PunchShape.Kind,
    drive: number,
  ): Result {
    if (!Number.isFinite(drive) || drive < 0 || drive > 1)
      throw new Error("Punch arm drive requires a closed-unit weight");
    const data: Geometry = geometry(context, pose, side);
    const distance: number = length(sub(target, data.shoulder.position));
    const bone: "leftHand" | "rightHand" =
      side === "left" ? "leftHand" : "rightHand";
    const effectors: MotionAction.Effector[] = [
      {
        bone,
        localPoint: [...context.geometry.handLocalPoint!],
        target: [...target],
        role: active ? "strike" : "guard",
        radius: context.geometry.gloveRadiusMetres!,
      },
    ];
    const channels: AutoMovieHumanRigControls.DegreeChannel[] =
      armChannels(side);
    const constraints: AutoMovieHumanClinicalIk.IConstraint[] = [
      {
        kind: "channel",
        channel: `arms.${side}.elbow.flexion`,
        minimum: PunchShape.extension(kind) * drive,
      },
    ];
    const axis: MotionAction.Vec3 = unit(
      sub(data.hand.position, data.shoulder.position),
    );
    const arm: MotionAction.Vec3 = sub(
      data.elbow.position,
      data.shoulder.position,
    );
    const plane: number = sub(arm, scale(axis, dot(arm, axis)))[1];
    const terminalPlane: number =
      kind === "hook" ? 0.02 : kind === "uppercut" ? -0.02 : 0.002;
    const initialPlane: number =
      kind === "hook"
        ? Math.min(plane, terminalPlane)
        : Math.max(plane, terminalPlane);
    const planeBound: number =
      drive >= 1 - 1e-10
        ? terminalPlane
        : initialPlane + (terminalPlane - initialPlane) * drive;
    constraints.push({
      kind: "line-offset",
      point: { bone: side === "left" ? "leftLowerArm" : "rightLowerArm" },
      line: {
        origin: { bone: side === "left" ? "leftUpperArm" : "rightUpperArm" },
        end: { bone },
      },
      normal: [0, 1, 0],
      ...(kind === "hook" ? { minimum: planeBound } : { maximum: planeBound }),
    });
    const solved: AutoMovieHumanClinicalIk.IResult =
      AutoMovieHumanClinicalIk.solve(context.evaluatePose!, pose, {
        channels,
        constraints,
        targets: [
          {
            bone,
            localPoint: [...context.geometry.handLocalPoint!],
            position: [...target],
          },
        ],
        iterations: 16,
        tolerance: 0.00025,
      });
    const actual: Witness[] = witnesses(context, solved.pose, side);
    const pad: MotionAction.Vec3 = actual[0]!.point;
    const shape: ShapeAdmission = admission(
      context,
      solved.pose,
      side,
      kind,
      drive,
      solved.output.clamped,
      pose,
    );
    const intendedSpan: ReturnType<typeof bound> = bound(
      context,
      pose,
      side,
      context.target,
      kind,
    );
    if (
      drive >= 1 - 1e-10 &&
      intendedSpan.distance > intendedSpan.maximum &&
      Math.abs(shape.includedDegrees - (180 - PunchShape.extension(kind))) > 3
    )
      shape.failures.push(
        "Declared full stroke lost its original family included angle",
      );
    const other: MotionAction.Side = side === "left" ? "right" : "left";
    if (
      JSON.stringify(solved.pose.arms?.[other]) !==
      JSON.stringify(pose.arms?.[other])
    )
      shape.failures.push("Nonacting guard was changed");
    const points: Fit["points"] = [
      {
        name: "pad",
        target: [...target],
        actual: [...pad],
        error: length(sub(pad, target)),
      },
    ];
    return {
      pose: solved.pose,
      effectors,
      distance,
      maximum: limit(data, target, kind).maximum,
      fit: {
        status:
          solved.error <= 0.00025 &&
          solved.constraintsSatisfied &&
          shape.failures.length === 0
            ? "realized"
            : "unresolved",
        error: solved.error,
        iterations: solved.iterations,
        clamped: structuredClone(solved.output.clamped),
        channels,
        points,
        shape,
        constraintValues: structuredClone(solved.constraintValues),
        constraintsSatisfied: solved.constraintsSatisfied,
      },
    };
  }

  /**
   * Define a clinical guard/return pad endpoint before fitting.
   *
   * @evidence contracts/common.md#implementation-and-ownership Reads the real Hand-bound pad from its single clinical pose. Contact-conditioned recovery explicitly declares this internal return path to the common FK resolver, preserving the actual stopped endpoint and full bone lengths instead of separately interpolating rigid points.
   * @evidence contracts/common.md#authoring-interface This endpoint is authored for guard/return, never substituted for a failed delivery task. Bone/local/radius identity matches the external pad so an actual captured stop can enter the declared clinical return. The host still independently checks support, actual pad and geometry.
   */
  export function frame(
    context: MotionAction.Context,
    pose: IAutoMovieHumanPose,
    side: MotionAction.Side,
    active: boolean,
  ): MotionAction.Effector[] {
    const pad: Witness = witnesses(context, pose, side)[0]!;
    return [
      {
        bone: pad.bone,
        localPoint: [...pad.localPoint],
        target: [...pad.point],
        role: active ? "strike" : "guard",
        radius: context.geometry.gloveRadiusMetres!,
      },
    ];
  }

  /**
   * Expose the five connected internal references without adding task constraints.
   * @evidence contracts/common.md#implementation-and-ownership One public snapshot supplies shoulder, elbow, wrist, rigid pad and a lateral Hand point; no Cartesian elbow circle or independent wrist orientation is reconstructed. The external pad target is deliberately absent from these FK facts.
   * @evidence contracts/common.md#authoring-interface The caller supplies its authoritative clinical pose. Returned owned points and frames are diagnostics, not hard or soft solver goals. Actual shown geometry and the immutable external pad task must be assessed separately.
   */
  export function witnesses(
    context: MotionAction.Context,
    pose: IAutoMovieHumanPose,
    side: MotionAction.Side,
  ): Witness[] {
    const data: Geometry = geometry(context, pose, side);
    const lateral: MotionAction.Vec3 = scale(
      unit(cross(unit(data.forearm), [1, 0, 0])),
      0.05,
    );
    const bone: "leftHand" | "rightHand" =
      side === "left" ? "leftHand" : "rightHand";
    return [
      {
        name: "pad",
        bone,
        localPoint: [...context.geometry.handLocalPoint!],
        point: [...data.pad],
        rotation: [...data.hand.rotation],
      },
      {
        name: "shoulder",
        bone: side === "left" ? "leftUpperArm" : "rightUpperArm",
        localPoint: [0, 0, 0],
        point: [...data.shoulder.position],
        rotation: [...data.shoulder.rotation],
      },
      {
        name: "elbow",
        bone: side === "left" ? "leftLowerArm" : "rightLowerArm",
        localPoint: [0, 0, 0],
        point: [...data.elbow.position],
        rotation: [...data.elbow.rotation],
      },
      {
        name: "wrist",
        bone,
        localPoint: [0, 0, 0],
        point: [...data.hand.position],
        rotation: [...data.hand.rotation],
      },
      {
        name: "handFrame",
        bone,
        localPoint: lateral,
        point: add(
          data.hand.position,
          rotate(record(data.hand.rotation), lateral),
        ),
        rotation: [...data.hand.rotation],
      },
    ];
  }
}

/** Actual FK facts retained only for the current invocation. */
interface Geometry {
  /** Current moving shoulder origin. */ shoulder: AutoMovieHumanSkeleton.IPlacement;
  /** Current seed elbow. */ elbow: AutoMovieHumanSkeleton.IPlacement;
  /** Current seed hand frame. */ hand: AutoMovieHumanSkeleton.IPlacement;
  /** Actual current glove-centre point. */ pad: MotionAction.Vec3;
  /** Actual neutral elbow-to-wrist vector expressed in Hand bone-local coordinates. */ forearm: MotionAction.Vec3;
  /** Actual upper-arm length. */ upper: number;
  /** Actual collinear elbow-to-glove-centre length. */ lever: number;
}

/** Read current centres and invert the neutral Hand frame before deriving its local lever. */
function geometry(
  context: MotionAction.Context,
  pose: IAutoMovieHumanPose,
  side: MotionAction.Side,
): Geometry {
  if (
    !context.evaluatePose ||
    !context.neutral ||
    !context.geometry.handLocalPoint
  )
    throw new Error(
      "Punch arm requires the actual public Human evaluator and bind geometry",
    );
  const current: AutoMovieHumanSkeleton.IOutput = context.evaluatePose(pose);
  const shoulder: AutoMovieHumanSkeleton.IPlacement = placement(
    current,
    `${side}UpperArm`,
  );
  const elbow: AutoMovieHumanSkeleton.IPlacement = placement(
    current,
    `${side}LowerArm`,
  );
  const hand: AutoMovieHumanSkeleton.IPlacement = placement(
    current,
    `${side}Hand`,
  );
  const neutralHand: AutoMovieHumanSkeleton.IPlacement = placement(
    context.neutral,
    `${side}Hand`,
  );
  const neutralElbow: AutoMovieHumanSkeleton.IPlacement = placement(
    context.neutral,
    `${side}LowerArm`,
  );

  // Human has distinct bind-to-neutral wrist correction, so raw bind forearm vectors are not Hand-local vectors.
  const forearm: MotionAction.Vec3 = rotate(
    Quaternion.inverse(record(neutralHand.rotation)),
    sub(neutralHand.position, neutralElbow.position),
  );
  const local: MotionAction.Vec3 = context.geometry.handLocalPoint;
  if (length(cross(unit(forearm), local)) > 1e-6 || dot(forearm, local) <= 0)
    throw new Error(
      "Straight punch glove centre must continue the actual bind forearm",
    );
  return {
    shoulder,
    elbow,
    hand,
    pad: add(hand.position, rotate(record(hand.rotation), local)),
    forearm,
    upper: length(
      sub(
        neutralElbow.position,
        placement(context.neutral, `${side}UpperArm`).position,
      ),
    ),
    lever: length(add(forearm, local)),
  };
}

/** Reuse already evaluated current geometry when composing the same arm sample. */
function limit(
  data: Geometry,
  point: MotionAction.Vec3,
  kind: PunchShape.Kind,
): { point: MotionAction.Vec3; distance: number; maximum: number } {
  const delta: MotionAction.Vec3 = sub(point, data.shoulder.position);
  const distance: number = length(delta);
  const maximum: number = Math.sqrt(
    data.upper * data.upper +
      data.lever * data.lever +
      2 *
        data.upper *
        data.lever *
        Math.cos((PunchShape.extension(kind) * Math.PI) / 180),
  );
  return {
    point:
      distance > maximum
        ? add(data.shoulder.position, scale(delta, maximum / distance))
        : [...point],
    distance,
    maximum,
  };
}

/** Missing actual joints refuse instead of silently selecting a baseline origin. */
function placement(
  output: AutoMovieHumanSkeleton.IOutput,
  bone: string,
): AutoMovieHumanSkeleton.IPlacement {
  const row: AutoMovieHumanSkeleton.IPlacement | undefined = output.posed.find(
    (item: AutoMovieHumanSkeleton.IPlacement): boolean => item.bone === bone,
  );
  if (!row) throw new Error(`Missing actual punch joint ${bone}`);
  return row;
}
/** Tuple conversion preserves the public x/y/z/w convention. */
function record(value: [number, number, number, number]): IAutoMovieQuaternion {
  return { x: value[0], y: value[1], z: value[2], w: value[3] };
}
/** Rotate a bind vector through the public quaternion implementation. */
function rotate(
  rotation: IAutoMovieQuaternion,
  value: MotionAction.Vec3,
): MotionAction.Vec3 {
  const result: { x: number; y: number; z: number } = Quaternion.rotateVector(
    rotation,
    { x: value[0], y: value[1], z: value[2] },
  );
  return [result.x, result.y, result.z];
}
/** Finite nondegenerate geometric vectors are required by the measured chain. */
function unit(value: MotionAction.Vec3): MotionAction.Vec3 {
  const norm: number = length(value);
  if (!Number.isFinite(norm) || norm < 1e-10)
    throw new Error("Degenerate punch chain direction");
  return scale(value, 1 / norm);
}
/** Fixed-size metre vector operations retain no caller arrays. */
function add(a: MotionAction.Vec3, b: MotionAction.Vec3): MotionAction.Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}
/** Fixed-size metre difference. */
function sub(a: MotionAction.Vec3, b: MotionAction.Vec3): MotionAction.Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}
/** Fixed-size scalar multiplication. */
function scale(a: MotionAction.Vec3, weight: number): MotionAction.Vec3 {
  return [a[0] * weight, a[1] * weight, a[2] * weight];
}
/** Euclidean length in metres. */
function length(value: MotionAction.Vec3): number {
  return Math.hypot(...value);
}
/** Euclidean dot product. */
function dot(a: MotionAction.Vec3, b: MotionAction.Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
/** Right-hand cross product in the same registered actor frame. */
function cross(a: MotionAction.Vec3, b: MotionAction.Vec3): MotionAction.Vec3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}
