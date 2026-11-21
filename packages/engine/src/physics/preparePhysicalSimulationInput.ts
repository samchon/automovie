import type {
  IAutoMoviePhysicalCoupledTargetFit,
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalSimulationInput,
} from "@automovie/interface";

import { AutoMoviePhysicalCoupledTargetError } from "./AutoMoviePhysicalCoupledTargetError";
import { physicalCoupledTargetDependencies } from "./physicalCoupledTargetDependencies";
import { PHYSICAL_COUPLED_RELATIONSHIP_LIMIT } from "./planPhysicalCoupledTargets";
import { physicalContactTargetBones } from "./preparePhysicalContactTargetRows";
import { PHYSICAL_TARGET_LIMITS } from "./solvePhysicalTargetForest";

type Body = IAutoMoviePhysicalSimulationInput.IBody;
type Target = IAutoMoviePhysicalSimulationInput.ITarget;

/**
 * One group of borrowed, already admitted bodies at a sampled step.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Relates the group identity to the bodies whose targets that step owns.
 * @evidence contracts/development/design.md#principled-representation The bodies and corresponding member ids share ordinal order.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Keeps the actual admitted body records for both frame producers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Groups are created only from explicit authored declarations.
 */
export interface IPhysicalCoupledTargetGroup
  extends IAutoMoviePhysicalCoupledTargetFit.IInterval {
  readonly bodies: readonly Body[];
}

/**
 * Sparse schedule of coupled groups in exact authored interval order.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Keys populated intervals by integer step, with groups ordered by id.
 * @evidence contracts/development/design.md#principled-representation Keeps per-step membership separate from runtime root and pose selection.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A producer needs only the groups for its current sampled step.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The borrowed schedule contains no native state or fitted outputs.
 */
export type IPhysicalCoupledTargetSchedule = ReadonlyMap<
  number,
  readonly IPhysicalCoupledTargetGroup[]
>;

/**
 * Admit explicit coupled groups on top of the already admitted individual
 * motion inputs. Returns undefined when no output interval requested a group.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States sparse membership, clock and individual admission precondition.
 * @evidence contracts/development/implementation.md#principled-implementation Checks declarations and reciprocal adjustable receivers at each step, then enforces combined relationship and coordinate limits.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Indexes explicit membership by step, then sorts and admits each named group once.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Frame zero seeds the scene. Inactive native declarations, singleton groups and fixed apparent cycles refuse.
 * @evidence contracts/development/implementation.md#efficient-algorithms Allocates maps only after an explicit declaration and reuses the same validated body profiles.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the same actuator selection and adjustable graph check as the shared fit.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns only the sparse declaration index. The caller owns the lifetime of its borrowed inputs.
 */
export function preparePhysicalCoupledTargetSchedule(
  input: IAutoMoviePhysicalSimulationInput.IInput,
): IPhysicalCoupledTargetSchedule | undefined {
  const end: number = input.duration * input.rate;
  let steps: Map<number, Map<string, Body[]>> | undefined;
  for (const body of input.bodies)
    for (const [step, target] of body.targets.entries()) {
      const label: unknown = target.coupledGroup;
      if (label === undefined) continue;
      if (
        typeof label !== "string" ||
        label.trim().length === 0 ||
        !Number.isSafeInteger(end) ||
        !Number.isSafeInteger(input.maximumSteps) ||
        step < 1 ||
        step > end ||
        step > input.maximumSteps
      )
        throw new AutoMoviePhysicalCoupledTargetError({
          step,
          group: typeof label === "string" ? label : "",
          members: [body.id],
          kind: "refused",
          reason: "declaration",
          detail:
            "Expected a nonblank group id on a positive admitted output step.",
        });
      if (body.mode.kind !== "kinematic" && target.strength === 0)
        throw new AutoMoviePhysicalCoupledTargetError({
          step,
          group: label,
          members: [body.id],
          kind: "refused",
          reason: "membership",
          detail: "An inactive native target cannot request a coupled fit.",
        });
      steps ??= new Map();
      let groups: Map<string, Body[]> | undefined = steps.get(step);
      if (groups === undefined) steps.set(step, (groups = new Map()));
      let members: Body[] | undefined = groups.get(label);
      if (members === undefined) groups.set(label, (members = []));
      members.push(body);
    }
  if (steps === undefined) return undefined;

  const profiles: Readonly<Record<string, IAutoMoviePhysicalProfile>> =
    Object.fromEntries(
      input.bodies.map((body: Body): [string, IAutoMoviePhysicalProfile] => [
        body.id,
        body.profile,
      ]),
    );
  return new Map(
    [...steps.entries()]
      .sort(
        (
          [a]: [number, Map<string, Body[]>],
          [b]: [number, Map<string, Body[]>],
        ): number => a - b,
      )
      .map(
        ([step, groups]: [number, Map<string, Body[]>]): [
          number,
          IPhysicalCoupledTargetGroup[],
        ] => [
          step,
          [...groups.entries()]
            .sort(([a]: [string, Body[]], [b]: [string, Body[]]): number =>
              ordinal(a, b),
            )
            .map(
              ([group, bodies]: [
                string,
                Body[],
              ]): IPhysicalCoupledTargetGroup =>
                admitGroup(step, group, bodies, profiles),
            ),
        ],
      ),
  );
}

/** Establish the group's fixed identities and count its movable coordinates. */
function admitGroup(
  step: number,
  group: string,
  bodies: Body[],
  profiles: Readonly<Record<string, IAutoMoviePhysicalProfile>>,
): IPhysicalCoupledTargetGroup {
  bodies.sort((a: Body, b: Body): number => ordinal(a.id, b.id));
  const result: IPhysicalCoupledTargetGroup = {
    step,
    group,
    bodies,
    members: bodies.map((body: Body): string => body.id),
  };
  if (bodies.length < 2 || new Set(result.members).size !== bodies.length)
    throw new AutoMoviePhysicalCoupledTargetError({
      step,
      group,
      members: result.members,
      kind: "refused",
      reason: "membership",
      detail: "A coupled fit requires at least two distinct active bodies.",
    });

  let relationships: number = 0;
  let coordinates: number = 0;
  const members: Parameters<typeof physicalCoupledTargetDependencies>[0] =
    bodies.map(
      (
        body: Body,
      ): Parameters<typeof physicalCoupledTargetDependencies>[0][number] => {
        const target: Target = body.targets[step]!;
        const plan: Parameters<typeof physicalContactTargetBones>[0] = {
          body: body.id,
          profiles,
          bindings: target.bindings ?? [],
          pointBounds: target.pointBounds,
          selfAvoidance: body.selfAvoidance,
        };
        relationships += plan.bindings.length + (plan.pointBounds?.length ?? 0);
        const bones: string[] = physicalContactTargetBones(plan);
        const selected: Set<string> = new Set(bones);
        for (const joint of body.profile.joints)
          if (selected.has(joint.child))
            for (const axis of joint.axes)
              if (axis.maximum > axis.minimum) coordinates++;
        return { body: body.id, bones, plan };
      },
    );
  if (
    relationships > PHYSICAL_COUPLED_RELATIONSHIP_LIMIT ||
    coordinates > PHYSICAL_TARGET_LIMITS.coordinates
  )
    throw new AutoMoviePhysicalCoupledTargetError({
      step,
      group,
      members: result.members,
      kind: "refused",
      reason: "budget",
      detail: "The coupled relationship or coordinate budget was exceeded.",
    });
  if (!physicalCoupledTargetDependencies(members))
    throw new AutoMoviePhysicalCoupledTargetError({
      step,
      group,
      members: result.members,
      kind: "refused",
      reason: "dependency",
      detail: "The group lacks reciprocal adjustable binding receivers.",
    });
  return result;
}

function ordinal(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
