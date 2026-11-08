import type {
  IAutoMovieMotionGeometry,
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import type { AutoMoviePhysicsCache as Cache } from "./AutoMoviePhysicsCache";
import { admitPhysicalMotionAudit } from "./admitPhysicalMotionAudit";
import { admitPhysicalMotionFrame } from "./admitPhysicalMotionFrame";
import { measurePhysicalJointLimits } from "./measurePhysicalJointLimits";
import { measurePhysicalMotionConstraint as Constraint } from "./measurePhysicalMotionConstraint";
import { motionAuditGeometry } from "./motionAuditGeometry";
import { preparePhysicalGeometry as Geometry } from "./preparePhysicalGeometry";

/**
 * Reusable finite-sample motion audit over the exact consumer state. Callers
 * provide per-body limits and allowed contact pairs; no actor name, species,
 * screenplay second, knee threshold or hand-picked radius lives here.
 */
export namespace AutoMovieMotionAudit {
  /** Rigid, ray or blended world witness used by reusable audit constraints. */
  export type IAnchor = Constraint.IAnchor;
  /** Time-windowed positional, distance or angular promise, with declared units and bounds. */
  export type IConstraint = Constraint.IConstraint;
  /** One explicit motion promise, in SI units. */
  export type IBody = IPolicy &
    (
      | { profile: P; geometry?: never }
      | { geometry: IAutoMovieMotionGeometry; profile?: never }
    );
  /** Independent acceptance policy shared by physical and geometry-only observations. */
  export interface IPolicy {
    /** Scene id resolving in every sampled frame. */ id: string;
    /** Per-segment maximum world speed, m/s. Missing entries mean unbounded. */ speeds: Record<
      string,
      number
    >;
    /** Per-segment maximum drift while contact is promised, metres. */ supports: {
      bone: string;
      start: number;
      end: number;
      point: IAutoMovieVector3;
      tolerance: number;
    }[];
    /** Allowed floor penetration, metres, independently declared. */ floorTolerance: number;
    /** Opt this owner's compliant materials into floor and inter-body compression allowance; pair allowances sum only opted-in sides. Defaults to auditing the undeformed outer surface. */ accountForCompression?: boolean;
    /** Allowed inter-body overlap, metres. */ overlapTolerance: number;
    /** Maximum free/locked angular constraint error, radians. */ jointTolerance: number;
    /** Endpoint goals, support spread and bend limits from the same displayed frames. */ constraints?: Constraint.IConstraint[];
  }
  /** Every violation is retained rather than stopping at the first phenomenon. */
  export interface IFinding {
    /** Film second. */ seconds: number;
    /** Owning scene body. */ body: string;
    /** Owning segment or pair. */ label: string;
    /** Measurement family. */ kind:
      | "speed"
      | "support"
      | "floor"
      | "overlap"
      | "goal"
      | "distance"
      | "angle"
      | "joint";
    /** Actual m/s for speed, radians for angle, metres otherwise. */ actual: number;
    /** Independently supplied acceptance bound in matching units. */ limit: number;
  }
  /** Consumer state sampler and independently declared finite acceptance policy. */
  export interface IInput {
    /** Audited scene bodies. */ bodies: IBody[];
    /** Inclusive first film second. */ start: number;
    /** Inclusive last film second. */ end: number;
    /** Positive finite samples per second. */ rate: number;
    /** World floor height in metres. */ floor: number;
    /** Same state used by the display at this second. */ sample: (
      seconds: number,
    ) => Cache.IFrame;
    /** Explicitly permitted shape-owner contact pairs. */ allowed: (
      a: string,
      boneA: string,
      b: string,
      boneB: string,
      seconds: number,
    ) => boolean;
  }
  /** Sample all bodies, support windows, speeds, floor clearances and pair contacts. */
  export async function run(
    input: IInput,
  ): Promise<{ samples: number; findings: IFinding[] }> {
    admitPhysicalMotionAudit(input);
    const geometry: Geometry.IQueries = await Geometry();
    const findings: IFinding[] = [];
    let previous: Cache.IFrame | undefined;
    const count: number = Math.ceil((input.end - input.start) * input.rate);
    for (let index: number = 0; index <= count; index++) {
      const seconds: number = Math.min(
        input.end,
        input.start + index / input.rate,
      );
      const frame: Cache.IFrame = input.sample(seconds);
      admitPhysicalMotionFrame(frame, input.bodies, seconds);
      for (const body of input.bodies) {
        for (const joint of motionAuditGeometry(body).joints) {
          const parent: Cache.ISegment | undefined =
            frame.bodies[body.id]?.[joint.parent];
          const child: Cache.ISegment | undefined =
            frame.bodies[body.id]?.[joint.child];
          if (!parent || !child)
            throw new Error(
              `Motion audit missing joint: ${body.id}/${joint.id}`,
            );
          for (const coordinate of measurePhysicalJointLimits(
            joint,
            parent,
            child,
          ))
            if (coordinate.violation > body.jointTolerance)
              findings.push({
                seconds,
                body: body.id,
                label: `${joint.id}/${coordinate.axis}`,
                kind: "joint",
                actual: coordinate.violation,
                limit: body.jointTolerance,
              });
        }
      }
      const colliders: {
        collider: Geometry.ICollider;
        owner: IBody;
        compression: number;
      }[] = [];
      for (const body of input.bodies)
        for (const constraint of body.constraints ?? []) {
          if (
            seconds < constraint.start ||
            seconds > constraint.end ||
            constraint.enabled?.(seconds) === false
          )
            continue;
          const value: number = Constraint(
            constraint,
            frame.bodies[body.id] ?? {},
            seconds,
          );
          if (!Number.isFinite(value))
            throw new Error(
              `Nonfinite motion audit measurement: ${constraint.label}`,
            );
          if (value < (constraint.minimum ?? -Infinity))
            findings.push({
              seconds,
              body: body.id,
              label: constraint.label,
              kind: constraint.kind,
              actual: value,
              limit: constraint.minimum!,
            });
          if (value > (constraint.maximum ?? Infinity))
            findings.push({
              seconds,
              body: body.id,
              label: constraint.label,
              kind: constraint.kind,
              actual: value,
              limit: constraint.maximum!,
            });
        }
      for (const body of input.bodies)
        for (const segment of motionAuditGeometry(body).segments) {
          const state: Cache.ISegment | undefined =
            frame.bodies[body.id]?.[segment.bone];
          if (!state)
            throw new Error(
              `Motion audit missing ${body.id}/${segment.bone} at ${seconds}`,
            );
          const before: Cache.ISegment | undefined =
            previous?.bodies[body.id]?.[segment.bone];
          const limit: number | undefined = body.speeds[segment.bone];
          if (before && limit !== undefined && seconds > previous!.seconds) {
            const speed: number =
              Vector3.length(
                Vector3.subtract(state.position, before.position),
              ) /
              (seconds - previous!.seconds);
            if (speed > limit)
              findings.push({
                seconds,
                body: body.id,
                label: segment.bone,
                kind: "speed",
                actual: speed,
                limit,
              });
          }
          for (const support of body.supports)
            if (
              support.bone === segment.bone &&
              seconds >= support.start &&
              seconds <= support.end
            ) {
              const error: number = Vector3.length(
                Vector3.subtract(state.position, support.point),
              );
              if (error > support.tolerance)
                findings.push({
                  seconds,
                  body: body.id,
                  label: segment.bone,
                  kind: "support",
                  actual: error,
                  limit: support.tolerance,
                });
            }
          for (const shape of segment.shapes) {
            const collider: Geometry.ICollider = {
              body: body.id,
              bone: segment.bone,
              shape,
              pose: state,
            };
            const material: IAutoMovieMotionGeometry["materials"][number] =
              motionAuditGeometry(body).materials.find(
                (
                  material: IAutoMovieMotionGeometry["materials"][number],
                ): boolean => material.id === shape.material,
              )!;
            const compression: number =
              body.accountForCompression && material.compliance > 0
                ? (material.maximumCompression ?? 0)
                : 0;
            const penetration: number =
              input.floor - geometry.minimumY(collider) - compression;
            if (penetration > body.floorTolerance)
              findings.push({
                seconds,
                body: body.id,
                label: `${segment.bone}/${shape.id}`,
                kind: "floor",
                actual: penetration,
                limit: body.floorTolerance,
              });
            colliders.push({ collider, owner: body, compression });
          }
        }
      for (let i: number = 0; i < colliders.length; i++)
        for (let j: number = i + 1; j < colliders.length; j++) {
          const a: (typeof colliders)[number] = colliders[i]!;
          const b: (typeof colliders)[number] = colliders[j]!;
          if (
            a.owner.id === b.owner.id ||
            input.allowed(
              a.owner.id,
              a.collider.bone,
              b.owner.id,
              b.collider.bone,
              seconds,
            )
          )
            continue;
          const receipt: ReturnType<Geometry.IQueries["contact"]> =
            geometry.contact(a.collider, b.collider, seconds);
          const limit: number = Math.min(
            a.owner.overlapTolerance,
            b.owner.overlapTolerance,
          );
          if (
            receipt &&
            -receipt.separation - a.compression - b.compression > limit
          )
            findings.push({
              seconds,
              body: a.owner.id,
              label: `${a.collider.bone}/${b.owner.id}/${b.collider.bone}`,
              kind: "overlap",
              actual: -receipt.separation - a.compression - b.compression,
              limit,
            });
        }
      previous = frame;
    }
    return { samples: count + 1, findings };
  }
}
