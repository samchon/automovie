import type {
  IAutoMovieFootfallPattern,
  IAutoMoviePhysicalContactBinding,
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalJointAxis,
  IAutoMoviePhysicalMaterial,
  IAutoMoviePhysicalPointBound,
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalShape,
  IAutoMoviePhysicalSimulationInput,
} from "@automovie/interface";

import { admitPhysicalPointBounds } from "./admitPhysicalPointBounds";
import { isPhysicalActuatorChain } from "./isPhysicalActuatorChain";
import { isPhysicalProfilePairExcluded } from "./isPhysicalProfilePairExcluded";

/**
 * Both relationship populations share identities, residual rows and articulated
 * coordinate budgets before solver allocation.
 */
export function admitPhysicalContactBindings(
  input: IAutoMoviePhysicalSimulationInput.IInput,
  body: IAutoMoviePhysicalSimulationInput.IBody,
  bindings: IAutoMoviePhysicalContactBinding[] | undefined,
  pointBounds?: IAutoMoviePhysicalPointBound[],
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
    const receiver: IAutoMoviePhysicalSimulationInput.IBody | undefined =
      input.bodies.find(
        (candidate: IAutoMoviePhysicalSimulationInput.IBody): boolean =>
          candidate.id === binding.target?.body,
      );
    const source: IAutoMoviePhysicalShape | undefined = body.profile.segments
      .find(
        (segment: IAutoMoviePhysicalSegment): boolean =>
          segment.bone === binding.source?.bone,
      )
      ?.shapes.find(
        (shape: IAutoMoviePhysicalShape): boolean =>
          shape.id === binding.source.shape,
      );
    const target: IAutoMoviePhysicalShape | undefined =
      receiver?.profile.segments
        .find(
          (segment: IAutoMoviePhysicalSegment): boolean =>
            segment.bone === binding.target.bone,
        )
        ?.shapes.find(
          (shape: IAutoMoviePhysicalShape): boolean =>
            shape.id === binding.target.shape,
        );
    const allowance: (
      profile: IAutoMoviePhysicalProfile,
      shape: IAutoMoviePhysicalShape | undefined,
    ) => number = (
      profile: IAutoMoviePhysicalProfile,
      shape: IAutoMoviePhysicalShape | undefined,
    ): number => {
      const material: IAutoMoviePhysicalMaterial | undefined =
        profile.materials.find(
          (item: IAutoMoviePhysicalMaterial): boolean =>
            item.id === shape?.material,
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
      !Number.isFinite(binding.compression) ||
      binding.compression < 0 ||
      binding.compression > compression ||
      (binding.kind === "separate" && binding.compression !== 0) ||
      !Number.isSafeInteger(binding.iterations) ||
      binding.iterations < 1 ||
      binding.iterations > 32 ||
      !(binding.tolerance > 0) ||
      !Number.isFinite(binding.tolerance) ||
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
      (![
          binding.target.normal.x,
          binding.target.normal.y,
          binding.target.normal.z,
        ].every(Number.isFinite) ||
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
  const profiles: Record<string, IAutoMoviePhysicalProfile> =
    Object.fromEntries(
      input.bodies.map(
        (
          item: IAutoMoviePhysicalSimulationInput.IBody,
        ): [string, IAutoMoviePhysicalProfile] => [item.id, item.profile],
      ),
    );
  admitPhysicalPointBounds(profiles, body.id, pointBounds ?? [], ids);
  const shapes: string[] = body.profile.segments.flatMap(
    (segment: IAutoMoviePhysicalSegment): string[] =>
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
        .flatMap(
          (
            pattern: IAutoMovieFootfallPattern | undefined,
          ): IAutoMovieFootfallPattern[] =>
            pattern === undefined ? [] : [pattern],
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
      (sum: number, binding: IAutoMoviePhysicalContactBinding): number =>
        sum + (binding.kind === "contact" ? 3 : 1),
      0,
    ) +
    (pointBounds ?? []).reduce(
      (sum: number, bound: IAutoMoviePhysicalPointBound): number =>
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
      ? body.profile.joints.map(
          (joint: IAutoMoviePhysicalJoint): string => joint.child,
        )
      : [
          ...(bindings ?? [])
            .filter(
              (binding: IAutoMoviePhysicalContactBinding): boolean =>
                binding.weight > 0,
            )
            .flatMap(
              (binding: IAutoMoviePhysicalContactBinding): string[] =>
                binding.chain,
            ),
          ...(pointBounds ?? []).flatMap(
            (bound: IAutoMoviePhysicalPointBound): string[] => bound.chain,
          ),
        ],
  );
  const coordinates: number = body.profile.joints
    .filter((joint: IAutoMoviePhysicalJoint): boolean => bones.has(joint.child))
    .reduce(
      (sum: number, joint: IAutoMoviePhysicalJoint): number =>
        sum +
        joint.axes.filter(
          (axis: IAutoMoviePhysicalJointAxis): boolean =>
            axis.maximum > axis.minimum,
        ).length,
      0,
    );
  if (coordinates > 64)
    throw new Error(body.id + ": contact target coordinate budget exceeded");
}
