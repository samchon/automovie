import type { IAutoMovieVector3 } from "@automovie/interface";

import type { AutoMovieMotionAudit as Audit } from "./AutoMovieMotionAudit";
import { admitMotionGeometry } from "./admitMotionGeometry";
import { isPhysicalNativeNumber as scalar } from "./isPhysicalNativeNumber";
import { motionAuditGeometry } from "./motionAuditGeometry";
import { validatePhysicalProfile } from "./validatePhysicalProfile";

/**
 * Invalid promises cannot produce a successful finite-sample audit by making comparisons false.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Invalid promises cannot produce a successful finite-sample audit by making comparisons false) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Invalid promises cannot produce a successful finite-sample audit by making comparisons false) directly over its typed inputs (`input`) as nested iteration of depth 3 (every over [value.x, value.y, value.z]; for-of over input.bodies; every over [body.jointTolerance, body.floorToleranc), delegating to `Number.isFinite`, `Number.isSafeInteger`, `Math.ceil`, `Array.isArray`, `ids.has`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (9 throw sites). Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 124 lines and 5 top-level statements that reuses `Number.isFinite`, `Number.isSafeInteger`, `Math.ceil`, `Array.isArray`, `ids.has` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `input`; the dominant cost is nested iteration of depth 3 (every over [value.x, value.y, value.z]; for-of over input.bodies; every over [body.jointTolerance, body.floorToleranc), performed once per call with 21 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 21 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function admitPhysicalMotionAudit(input: Audit.IInput): void {
  const point: (value: IAutoMovieVector3) => boolean = (
    value: IAutoMovieVector3,
  ): boolean => !!value && [value.x, value.y, value.z].every(scalar);
  const nonnegative: (value: number) => boolean = (value: number): boolean =>
    Number.isFinite(value) && value >= 0;
  if (
    !Number.isFinite(input.start) ||
    !Number.isFinite(input.end) ||
    input.end < input.start ||
    !(input.rate > 0) ||
    !Number.isFinite(input.rate) ||
    !Number.isSafeInteger(Math.ceil((input.end - input.start) * input.rate)) ||
    !Number.isFinite(input.floor) ||
    !Array.isArray(input.bodies) ||
    typeof input.sample !== "function" ||
    typeof input.allowed !== "function"
  )
    throw new Error("Invalid motion audit sampling interval or population");
  const ids: Set<string> = new Set();
  for (const body of input.bodies) {
    if (
      !body ||
      typeof body.id !== "string" ||
      !body.id.trim() ||
      ids.has(body.id) ||
      (body.profile !== undefined) === (body.geometry !== undefined) ||
      (body.profile !== undefined &&
        validatePhysicalProfile(body.profile).length > 0) ||
      ![body.jointTolerance, body.floorTolerance, body.overlapTolerance].every(
        nonnegative,
      ) ||
      (body.accountForCompression !== undefined &&
        typeof body.accountForCompression !== "boolean") ||
      !body.speeds ||
      Array.isArray(body.speeds) ||
      !Array.isArray(body.supports) ||
      (body.constraints !== undefined && !Array.isArray(body.constraints))
    )
      throw new Error("Invalid motion audit body or acceptance limits");
    ids.add(body.id);
    if (body.geometry !== undefined) admitMotionGeometry(body.geometry);
    const carriers: Set<string> = new Set(
      motionAuditGeometry(body).segments.map(
        (
          segment: ReturnType<typeof motionAuditGeometry>["segments"][number],
        ): string => segment.bone,
      ),
    );
    const bones: Set<string> = new Set(carriers);
    for (const witness of motionAuditGeometry(body).witnesses ?? [])
      bones.add(witness);
    for (const [bone, limit] of Object.entries(body.speeds))
      if (!carriers.has(bone) || !nonnegative(limit))
        throw new Error("Invalid motion audit speed limit");
    for (const support of body.supports)
      if (
        !support ||
        !carriers.has(support.bone) ||
        !Number.isFinite(support.start) ||
        !Number.isFinite(support.end) ||
        support.end < support.start ||
        !point(support.point) ||
        !nonnegative(support.tolerance)
      )
        throw new Error("Invalid motion audit support promise");
    for (const constraint of body.constraints ?? []) {
      if (
        !constraint ||
        !["goal", "distance", "angle"].includes(constraint.kind) ||
        typeof constraint.label !== "string" ||
        !constraint.label.trim() ||
        !Number.isFinite(constraint.start) ||
        !Number.isFinite(constraint.end) ||
        constraint.end < constraint.start ||
        (constraint.minimum === undefined &&
          constraint.maximum === undefined) ||
        [constraint.minimum, constraint.maximum].some(
          (value: number | undefined): boolean =>
            value !== undefined && !Number.isFinite(value),
        ) ||
        (constraint.minimum ?? -Infinity) > (constraint.maximum ?? Infinity) ||
        (constraint.enabled !== undefined &&
          typeof constraint.enabled !== "function")
      )
        throw new Error("Invalid motion audit constraint");
      const anchors: Audit.IAnchor[] =
        constraint.kind === "goal"
          ? [constraint.point]
          : constraint.kind === "distance"
            ? [constraint.from, constraint.to]
            : [constraint.from, constraint.pivot, constraint.to];
      if (constraint.kind === "goal" && typeof constraint.target !== "function")
        throw new Error("Invalid motion audit goal sampler");
      for (const anchor of anchors) {
        if (
          !anchor ||
          !bones.has(anchor.bone) ||
          Number(anchor.localPoint !== undefined) +
            Number(anchor.ray !== undefined) +
            Number(anchor.blend !== undefined) >
            1 ||
          (anchor.localPoint !== undefined && !point(anchor.localPoint))
        )
          throw new Error("Invalid motion audit point witness");
        if (
          anchor.ray &&
          (!bones.has(anchor.ray.from) ||
            anchor.ray.from === anchor.bone ||
            !nonnegative(anchor.ray.distance))
        )
          throw new Error("Invalid motion audit ray witness");
        if (
          anchor.blend &&
          (!bones.has(anchor.blend.other) ||
            !Number.isFinite(anchor.blend.weight) ||
            anchor.blend.weight < 0 ||
            anchor.blend.weight > 1)
        )
          throw new Error("Invalid motion audit blended witness");
      }
    }
  }
}
