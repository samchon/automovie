import type {
  IAutoMovieMeasurePhysicalMotionConstraint,
  IAutoMovieMotionAudit,
  IAutoMovieMotionGeometry,
  IAutoMoviePhysicsCache,
  IAutoMoviePreparePhysicalGeometry,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
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
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Reusable finite-sample motion audit over the exact consumer state) and documents 7 documented members as stated in this comment.
 * @evidence contracts/development/design.md#principled-representation Represents Reusable finite-sample motion audit over the exact consumer state: companion namespace of 7 members (`IAnchor`, `IConstraint`, `IBody`, `IPolicy`, `IFinding`, `IInput`, ...); units and frames named in its text: world, frame, metres, radians, frames. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieMotionAudit` in packages/engine/src/physics/AutoMovieMotionAudit.ts; its surface is the 7 members listed and the text shows 8 other files naming it, mostly packages/engine (4), test (4), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace AutoMovieMotionAudit {
  /**
   * Sample all bodies, support windows, speeds, floor clearances and pair contacts.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Sample all bodies, support windows, speeds, floor clearances and pair contacts.
   * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Sample all bodies, support windows, speeds, floor clearances and pair contacts) directly over its typed inputs (`input`) as nested iteration of depth 5 (for loop bounded by index <= count; for-of over input.bodies; for-of over motionAuditGeometry(body).joints), delegating to `admitPhysicalMotionAudit`, `Geometry`, `Math.ceil`, `Math.min`, `input.sample`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (3 throw sites). Apart from structural 0, 1 and 2 the body uses no numeric literal.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One async operation of 195 lines and 7 top-level statements that reuses `admitPhysicalMotionAudit`, `Geometry`, `Math.ceil`, `Math.min`, `input.sample` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 7 non-null assertion(s); these are the remaining shortcuts and are not justified here.
   * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `input`; the dominant cost is nested iteration of depth 5 (for loop bounded by index <= count; for-of over input.bodies; for-of over motionAuditGeometry(body).joints), performed once per call with 17 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Awaits 1 call per invocation and shares no result or in-flight work between invocations: equivalence of effectful calls is not decided here, so every call repeats its effects.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The body awaits asynchronous work; it retains nothing after it settles beyond its result, and any handle it opens is owned and released by the call or by its callees.
   */
  export async function run(
    input: IAutoMovieMotionAudit.IInput,
  ): IAutoMovieMeasurePhysicalMotionConstraint.IRunResult {
    admitPhysicalMotionAudit(input);
    const geometry: IAutoMoviePreparePhysicalGeometry.IQueries =
      await Geometry();
    const findings: IAutoMovieMotionAudit.IFinding[] = [];
    let previous: IAutoMoviePhysicsCache.IFrame | undefined;
    const count: number = Math.ceil((input.end - input.start) * input.rate);
    for (let index: number = 0; index <= count; index++) {
      const seconds: number = Math.min(
        input.end,
        input.start + index / input.rate,
      );
      const frame: IAutoMoviePhysicsCache.IFrame = input.sample(seconds);
      admitPhysicalMotionFrame(frame, input.bodies, seconds);
      for (const body of input.bodies) {
        for (const joint of motionAuditGeometry(body).joints) {
          const parent: IAutoMoviePhysicsCache.ISegment | undefined =
            frame.bodies[body.id]?.[joint.parent];
          const child: IAutoMoviePhysicsCache.ISegment | undefined =
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
          const state: IAutoMoviePhysicsCache.ISegment | undefined =
            frame.bodies[body.id]?.[segment.bone];
          if (!state)
            throw new Error(
              `Motion audit missing ${body.id}/${segment.bone} at ${seconds}`,
            );
          const before: IAutoMoviePhysicsCache.ISegment | undefined =
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
