import type {
  IAutoMoviePhysicalContactBinding as Binding,
  IAutoMovieFootfallPattern,
  IAutoMoviePhysicalProfile as P,
  IAutoMoviePhysicalPointBound as PointBound,
} from "@automovie/interface";

import { isAutoMovieRecord } from "../validation/isAutoMovieRecord";
import type { AutoMoviePhysicalSimulation as Simulation } from "./AutoMoviePhysicalSimulation";
import { admitPhysicalPointBounds } from "./admitPhysicalPointBounds";
import { isPhysicalActuatorChain } from "./isPhysicalActuatorChain";
import { isPhysicalNativeNumber as scalar } from "./isPhysicalNativeNumber";
import { isPhysicalProfilePairExcluded } from "./isPhysicalProfilePairExcluded";

/**
 * Both relationship populations share identities, residual rows and articulated coordinate budgets before solver allocation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Both relationship populations share identities, residual rows and articulated coordinate budgets before solver allocation) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Both relationship populations share identities, residual rows and articulated coordinate budgets before solver allocation) directly over its typed inputs (`input`, `body`, `bindings`, `pointBounds`) as nested iteration of depth 3 (for-of over bindings ?? []; find over input.bodies; find over body.profile.segments .find( ), delegating to `Array.isArray`, `allowance`, `ids.has`, `Number.isFinite`, `scalar`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (6 throw sites). Beyond structural 0, 1 and 2 the body uses the literals 16, 32, 4, 3, 1024, whose basis this answer does not independently establish and a reviewer must confirm.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 194 lines and 14 top-level statements that reuses `Array.isArray`, `allowance`, `ids.has`, `Number.isFinite`, `scalar` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters. Literal caveat: 16, 32, 4, 3, 1024 are not independently sourced here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `input`, `body`, `bindings`, `pointBounds`; the dominant cost is nested iteration of depth 3 (for-of over bindings ?? []; find over input.bodies; find over body.profile.segments .find( ), performed once per call with 23 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 23 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function admitPhysicalContactBindings(
  input: Simulation.IInput,
  body: Simulation.IBody,
  bindings: Binding[] | undefined,
  pointBounds?: PointBound[],
): void {
  if (
    (bindings !== undefined && !Array.isArray(bindings)) ||
    (pointBounds !== undefined && !Array.isArray(pointBounds)) ||
    (bindings?.length ?? 0) + (pointBounds?.length ?? 0) >
      (body.maximumBindings ?? 16)
  )
    throw new Error(body.id + ": invalid contact binding budget");
  const ids: Set<string> = new Set();
  for (const binding of bindings ?? []) {
    if (!binding) throw new Error(body.id + ": invalid contact binding");
    const receiver: Simulation.IBody | undefined = input.bodies.find(
      (candidate: Simulation.IBody): boolean =>
        candidate.id === binding.target?.body,
    );
    const source: P.IShape | undefined = body.profile.segments
      .find(
        (segment: P.ISegment): boolean => segment.bone === binding.source?.bone,
      )
      ?.shapes.find(
        (shape: P.IShape): boolean => shape.id === binding.source.shape,
      );
    const target: P.IShape | undefined = receiver?.profile.segments
      .find(
        (segment: P.ISegment): boolean => segment.bone === binding.target.bone,
      )
      ?.shapes.find(
        (shape: P.IShape): boolean => shape.id === binding.target.shape,
      );
    const allowance: (profile: P, shape: P.IShape | undefined) => number = (
      profile: P,
      shape: P.IShape | undefined,
    ): number => {
      const material: P.IMaterial | undefined = profile.materials.find(
        (item: P.IMaterial): boolean => item.id === shape?.material,
      );
      return material && material.compliance > 0
        ? (material.maximumCompression ?? 0)
        : 0;
    };
    const compression: number =
      allowance(body.profile, source) +
      (receiver ? allowance(receiver.profile, target) : 0);
    if (
      typeof binding.id !== "string" ||
      !binding.id.trim() ||
      ids.has(binding.id) ||
      !["contact", "separate"].includes(binding.kind) ||
      !receiver ||
      !source ||
      !target ||
      !Number.isFinite(binding.weight) ||
      binding.weight < 0 ||
      binding.weight > 1 ||
      !scalar(binding.compression) ||
      binding.compression < 0 ||
      binding.compression > compression ||
      (binding.kind === "separate" && binding.compression !== 0) ||
      !Number.isSafeInteger(binding.iterations) ||
      binding.iterations < 1 ||
      binding.iterations > 32 ||
      !(binding.tolerance > 0) ||
      !scalar(binding.tolerance) ||
      !isPhysicalActuatorChain(
        body.profile,
        binding.chain,
        binding.source.bone,
      ) ||
      (receiver === body && binding.source.bone === binding.target.bone)
    )
      throw new Error(body.id + ": invalid contact binding " + binding.id);
    ids.add(binding.id);
    if (
      binding.target.normal !== undefined &&
      (!isAutoMovieRecord(binding.target.normal) ||
        ![
          binding.target.normal.x,
          binding.target.normal.y,
          binding.target.normal.z,
        ].every(scalar) ||
        !(
          Math.hypot(
            binding.target.normal.x,
            binding.target.normal.y,
            binding.target.normal.z,
          ) > 0
        ) ||
        binding.kind !== "contact")
    )
      throw new Error(body.id + ": invalid contact binding surface normal");
  }
  const profiles: Record<string, P> = Object.fromEntries(
    input.bodies.map((item: Simulation.IBody): [string, P] => [
      item.id,
      item.profile,
    ]),
  );
  admitPhysicalPointBounds(profiles, body.id, pointBounds ?? [], ids);
  const shapes: string[] = body.profile.segments.flatMap(
    (segment: P.ISegment): string[] =>
      segment.shapes.map((): string => segment.bone),
  );
  const self: number = body.selfAvoidance
    ? shapes.reduce(
        (sum: number, bone: string, index: number): number =>
          sum +
          shapes
            .slice(index + 1)
            .filter(
              (other: string): boolean =>
                !isPhysicalProfilePairExcluded(body.profile, bone, other),
            ).length,
        0,
      )
    : 0;
  const supportRows: Map<string, IAutoMovieFootfallPattern["limbs"][number]> =
    new Map(
      [body.balance?.pattern, body.supportTracking?.pattern]
        .filter(
          (
            pattern: IAutoMovieFootfallPattern | undefined,
          ): pattern is IAutoMovieFootfallPattern => pattern !== undefined,
        )
        .flatMap(
          (
            pattern: IAutoMovieFootfallPattern,
          ): IAutoMovieFootfallPattern["limbs"] => pattern.limbs,
        )
        .map(
          (
            limb: IAutoMovieFootfallPattern["limbs"][number],
          ): [string, IAutoMovieFootfallPattern["limbs"][number]] => [
            JSON.stringify([
              limb.bone,
              limb.localPoint,
              limb.contacts,
              limb.floorPoints,
            ]),
            limb,
          ],
        ),
    );
  const endpoints: number = [...supportRows.values()].reduce(
    (sum: number, limb: IAutoMovieFootfallPattern["limbs"][number]): number =>
      sum + 4 + (limb.floorPoints?.length ?? 0),
    0,
  );
  const rows: number =
    shapes.length +
    self +
    endpoints +
    (bindings ?? []).reduce(
      (sum: number, binding: Binding): number =>
        sum + (binding.kind === "contact" ? 3 : 1),
      0,
    ) +
    (pointBounds ?? []).reduce(
      (sum: number, bound: PointBound): number =>
        sum +
        Number(bound.minimum !== undefined) +
        Number(bound.maximum !== undefined),
      0,
    );
  if (
    ((bindings?.length ?? 0) + (pointBounds?.length ?? 0) > 0 ||
      body.selfAvoidance) &&
    rows > 1024
  )
    throw new Error(body.id + ": contact target residual budget exceeded");
  const bones: Set<string> = new Set(
    body.selfAvoidance
      ? body.profile.joints.map((joint: P.IJoint): string => joint.child)
      : [
          ...(bindings ?? [])
            .filter((binding: Binding): boolean => binding.weight > 0)
            .flatMap((binding: Binding): string[] => binding.chain),
          ...(pointBounds ?? []).flatMap(
            (bound: PointBound): string[] => bound.chain,
          ),
        ],
  );
  const coordinates: number = body.profile.joints
    .filter((joint: P.IJoint): boolean => bones.has(joint.child))
    .reduce(
      (sum: number, joint: P.IJoint): number =>
        sum +
        joint.axes.filter(
          (axis: P.IAxis): boolean => axis.maximum > axis.minimum,
        ).length,
      0,
    );
  if (coordinates > 64)
    throw new Error(body.id + ": contact target coordinate budget exceeded");
}
