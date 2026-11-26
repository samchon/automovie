import type {
  IAutoMovieMeasurePhysicalMotionConstraint,
  IAutoMovieMotionAudit,
  IAutoMovieMotionGeometry,
  IAutoMoviePhysicalFrame,
  IAutoMoviePhysicalSegmentState,
  IAutoMoviePreparePhysicalGeometry,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { admitPhysicalMotionAudit } from "./admitPhysicalMotionAudit";
import { admitPhysicalMotionFrame } from "./admitPhysicalMotionFrame";
import { measurePhysicalJointLimits } from "./internal/measurePhysicalJointLimits";
import { measurePhysicalMotionConstraint as Constraint } from "./internal/measurePhysicalMotionConstraint";
import { motionAuditGeometry } from "./motionAuditGeometry";
import { preparePhysicalGeometry as Geometry } from "./preparePhysicalGeometry";

/**
 * Reusable finite-sample motion audit over the exact consumer state. Callers
 * provide per-body limits and allowed contact pairs; no actor name, species,
 * screenplay second, knee threshold or hand-picked radius lives here.
 */
export namespace AutoMovieMotionAudit {
  /**
   * Sample all bodies, support windows, speeds, floor clearances and pair
   * contacts.
   */
  export async function run(
    input: IAutoMovieMotionAudit.IInput,
  ): IAutoMovieMeasurePhysicalMotionConstraint.IRunResult {
    admitPhysicalMotionAudit(input);
    const geometry: IAutoMoviePreparePhysicalGeometry.IQueries =
      await Geometry();
    const findings: IAutoMovieMotionAudit.IFinding[] = [];
    let previous: IAutoMoviePhysicalFrame | undefined;
    const count: number = Math.ceil((input.end - input.start) * input.rate);
    for (let index: number = 0; index <= count; index++) {
      const seconds: number = Math.min(
        input.end,
        input.start + index / input.rate,
      );
      const frame: IAutoMoviePhysicalFrame = input.sample(seconds);
      admitPhysicalMotionFrame(frame, input.bodies, seconds);
      for (const body of input.bodies) {
        for (const joint of motionAuditGeometry(body).joints) {
          const parent: IAutoMoviePhysicalSegmentState | undefined =
            frame.bodies[body.id]?.[joint.parent];
          const child: IAutoMoviePhysicalSegmentState | undefined =
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
        collider: IAutoMoviePreparePhysicalGeometry.ICollider;
        owner: IAutoMovieMotionAudit.IBody;
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
          const state: IAutoMoviePhysicalSegmentState | undefined =
            frame.bodies[body.id]?.[segment.bone];
          if (!state)
            throw new Error(
              `Motion audit missing ${body.id}/${segment.bone} at ${seconds}`,
            );
          const before: IAutoMoviePhysicalSegmentState | undefined =
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
            const collider: IAutoMoviePreparePhysicalGeometry.ICollider = {
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
          const receipt: ReturnType<
            IAutoMoviePreparePhysicalGeometry.IQueries["contact"]
          > = geometry.contact(a.collider, b.collider, seconds);
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
