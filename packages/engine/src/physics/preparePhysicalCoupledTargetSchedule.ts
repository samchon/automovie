import type {
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalSimulationInput,
} from "@automovie/interface";

import { AutoMoviePhysicalCoupledTargetError } from "./AutoMoviePhysicalCoupledTargetError";
import type { IPhysicalCoupledTargetGroup } from "./IPhysicalCoupledTargetGroup";
import type { IPhysicalCoupledTargetSchedule } from "./IPhysicalCoupledTargetSchedule";
import { PHYSICAL_COUPLED_RELATIONSHIP_LIMIT } from "./PHYSICAL_COUPLED_RELATIONSHIP_LIMIT";
import { PHYSICAL_TARGET_LIMITS } from "./PHYSICAL_TARGET_LIMITS";
import { physicalContactTargetBones } from "./physicalContactTargetBones";
import { physicalCoupledTargetDependencies } from "./physicalCoupledTargetDependencies";

type Body = IAutoMoviePhysicalSimulationInput.IBody;
type Target = IAutoMoviePhysicalSimulationInput.ITarget;

/**
 * Admit explicit coupled groups on top of the already admitted individual
 * motion inputs. Returns undefined when no output interval requested a group.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States sparse membership, clock and individual admission precondition.
 * @evidence contracts/development/implementation.md#principled-implementation Checks declarations and reciprocal adjustable receivers at each step, then enforces combined relationship and coordinate limits.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Indexes explicit membership by step, then sorts and admits each named group once.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Frame zero seeds the scene. Inactive native declarations, singleton groups and fixed apparent cycles refuse. Contact-release members and native-root members with balance or support tracking refuse, because the group fit could not honour their plans independently of body order.
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
        const refusal: string | undefined = unsupportedMember(body, target);
        if (refusal !== undefined)
          throw new AutoMoviePhysicalCoupledTargetError({
            step,
            group,
            members: result.members,
            kind: "refused",
            reason: "membership",
            detail: body.id + ": " + refusal,
          });
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

/**
 * Name a member policy the shared fit cannot honour for the whole interval.
 * Native tracking writes balance and support plans during each body's own
 * turn, so a group fit on an earlier member's turn would miss a later
 * member's plans and depend on body order. A contact-triggered release would
 * withdraw a member in the middle of the group.
 */
function unsupportedMember(body: Body, target: Target): string | undefined {
  if (body.releaseOnContact !== undefined)
    return "a coupled member cannot declare a contact-triggered release.";
  if (body.mode.kind === "kinematic") return undefined;
  const children: Set<string> = new Set(
    body.profile.joints.map(
      (joint: IAutoMoviePhysicalProfile["joints"][number]): string =>
        joint.child,
    ),
  );
  const root: string | undefined = body.profile.segments.find(
    (segment: IAutoMoviePhysicalProfile["segments"][number]): boolean =>
      !children.has(segment.bone),
  )?.bone;
  const nativeRoot: boolean =
    target.dynamicSegments === undefined ||
    (root !== undefined && target.dynamicSegments.includes(root));
  return nativeRoot &&
    (body.balance !== undefined || body.supportTracking !== undefined)
    ? "a coupled member with a native root cannot take balance or support-tracking goals."
    : undefined;
}

function ordinal(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
