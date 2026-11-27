import type {
  IAutoMovieLinearizePhysicalTargetRows,
  IAutoMoviePhysicalContactBinding,
  IAutoMoviePhysicalCoupledTargetFit,
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalJointAxis,
  IAutoMoviePhysicalPointBound,
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalSimulationInput,
  IAutoMoviePlanPhysicalContactTargets,
  IAutoMoviePoses,
  IAutoMoviePreparePhysicalGeometry,
  IAutoMovieRigidTransform,
} from "@automovie/interface";

import type { IPhysicalContactPoseReference } from "./IPhysicalContactPoseReference";
import { PHYSICAL_COUPLED_RELATIONSHIP_LIMIT } from "./PHYSICAL_COUPLED_RELATIONSHIP_LIMIT";
import { PHYSICAL_TARGET_LIMITS } from "./PHYSICAL_TARGET_LIMITS";
import { admitPhysicalContactBindings } from "./admitPhysicalContactBindings";
import { initialPhysicalContactTargets } from "./initialPhysicalContactTargets";
import { linearizePhysicalTargetRows } from "./linearizePhysicalTargetRows";
import { physicalContactTargetBones } from "./physicalContactTargetBones";
import { physicalCoupledTargetDependencies } from "./physicalCoupledTargetDependencies";
import { preparePhysicalContactTargetRows } from "./preparePhysicalContactTargetRows";
import { solvePhysicalTargetForest } from "./solvePhysicalTargetForest";

/**
 * Fit a mutually adjustable group against one candidate scene. Participating
 * roots and outside receivers borrow the simultaneous placement. All admitted
 * geometric rows share one bounded solve. Only convergence supplies goals.
 */
export function planPhysicalCoupledTargets(input: IInput): IResult {
  const bodyById: Map<string, Body> = new Map(
    input.scene.bodies.map((body: Body): [string, Body] => [body.id, body]),
  );
  const members: Member[] = [...input.members].sort(
    (a: Member, b: Member): number => compare(a.body, b.body),
  );
  const participating: Set<string> = new Set(
    members.map((member: Member): string => member.body),
  );
  if (
    members.length < 2 ||
    participating.size !== members.length ||
    bodyById.size !== input.scene.bodies.length
  )
    return {
      kind: "refused",
      reason: "membership",
      detail:
        "A coupled fit requires at least two distinct admitted scene bodies.",
    };

  const profiles: Readonly<Record<string, IAutoMoviePhysicalProfile>> =
    Object.fromEntries(
      input.scene.bodies.map(
        (body: Body): [string, IAutoMoviePhysicalProfile] => [
          body.id,
          body.profile,
        ],
      ),
    );
  const plans: PreparedMember[] = [];
  let relationships: number = 0;
  for (const member of members) {
    const body: Body | undefined = bodyById.get(member.body);
    if (
      body === undefined ||
      (body.mode.kind !== "kinematic" && member.target.strength === 0)
    )
      return {
        kind: "refused",
        reason: "membership",
        detail: member.body + ": expected an active scene target.",
      };
    if (
      !body.profile.segments.every(
        (segment: IAutoMoviePhysicalProfile["segments"][number]): boolean =>
          hasPose(input.actual, body.id, segment.bone) &&
          Object.hasOwn(member.target.segments, segment.bone),
      )
    )
      return {
        kind: "refused",
        reason: "poses",
        detail: member.body + ": expected complete authored and actual poses.",
      };
    try {
      admitPhysicalContactBindings(
        input.scene,
        body,
        member.target.bindings,
        member.target.pointBounds,
      );
    } catch (error: unknown) {
      if (!(error instanceof Error)) throw error;
      return {
        kind: "refused",
        reason: "bindings",
        detail: error.message,
      };
    }
    const bindings: IAutoMoviePhysicalContactBinding[] = [
      ...(member.target.bindings ?? []),
    ].sort(
      (
        a: IAutoMoviePhysicalContactBinding,
        b: IAutoMoviePhysicalContactBinding,
      ): number => compare(a.id, b.id),
    );
    const points: IAutoMoviePhysicalPointBound[] = [
      ...(member.target.pointBounds ?? []),
    ].sort(
      (
        a: IAutoMoviePhysicalPointBound,
        b: IAutoMoviePhysicalPointBound,
      ): number => compare(a.id, b.id),
    );
    relationships += bindings.length + points.length;
    if (relationships > PHYSICAL_COUPLED_RELATIONSHIP_LIMIT)
      return {
        kind: "refused",
        reason: "budget",
        detail: "Coupled relationship budget exceeded.",
      };
    if (
      bindings.some(
        (binding: IAutoMoviePhysicalContactBinding): boolean =>
          binding.weight > 0 &&
          !hasPose(input.actual, binding.target.body, binding.target.bone),
      ) ||
      points.some(
        (bound: IAutoMoviePhysicalPointBound): boolean =>
          !hasPose(input.actual, bound.reference.body, bound.reference.bone),
      )
    )
      return {
        kind: "refused",
        reason: "poses",
        detail:
          member.body + ": a relationship reference lacks a simultaneous pose.",
      };
    const plan: Plan = {
      body: body.id,
      profiles,
      targets: member.target.segments,
      actual: input.actual,
      bindings,
      pointBounds: points,
      selfAvoidance: body.selfAvoidance,
      supports: member.supports,
      geometry: input.geometry,
      floor: input.floor,
    };
    plans.push({
      body: body.id,
      plan,
      bones: physicalContactTargetBones(plan),
    });
  }
  if (!physicalCoupledTargetDependencies(plans))
    return {
      kind: "refused",
      reason: "dependency",
      detail:
        "Each member must reach and be reached by another adjustable binding receiver.",
    };

  const bones: string[] = plans.flatMap((member: PreparedMember): string[] =>
    member.bones.map((bone: string): string => qualify(member.body, bone)),
  );
  const joints: IAutoMoviePhysicalJoint[] = plans.flatMap(
    (member: PreparedMember): IAutoMoviePhysicalJoint[] =>
      profiles[member.body]!.joints.map(
        (joint: IAutoMoviePhysicalJoint): IAutoMoviePhysicalJoint => ({
          ...joint,
          id: qualify(member.body, joint.id),
          parent: qualify(member.body, joint.parent),
          child: qualify(member.body, joint.child),
        }),
      ),
  );
  const selected: Set<string> = new Set(bones);
  const coordinates: number = joints.reduce(
    (sum: number, joint: IAutoMoviePhysicalJoint): number =>
      sum + (selected.has(joint.child) ? freeCoordinates(joint) : 0),
    0,
  );
  if (coordinates > PHYSICAL_TARGET_LIMITS.coordinates)
    return {
      kind: "refused",
      reason: "budget",
      detail: "Coupled target coordinate budget exceeded.",
    };

  const initial: Record<string, IAutoMovieRigidTransform> = Object.create(null);
  const localReaders: Record<
    string,
    ReturnType<typeof localView>
  > = Object.create(null);
  const prepared: ReturnType<typeof preparePhysicalContactTargetRows>[] = [];
  let scalarRows: number = 0;
  try {
    for (const member of plans) {
      const seed: IAutoMoviePoses = initialPhysicalContactTargets(member.plan);
      localReaders[member.body] = localView(member.body, Object.keys(seed));
      for (const [bone, pose] of Object.entries(seed))
        initial[qualify(member.body, bone)] = pose;
    }
    for (const member of plans) {
      const rows: ReturnType<typeof preparePhysicalContactTargetRows> =
        preparePhysicalContactTargetRows(member.plan, initial, {
          key: (bone: string): string => qualify(member.body, bone),
          local: localReaders[member.body]!,
          resolve,
        });
      scalarRows += rows.coupledScalarRows;
      if (scalarRows > PHYSICAL_TARGET_LIMITS.rows)
        return {
          kind: "refused",
          reason: "budget",
          detail: "Coupled target residual row budget exceeded.",
        };
      prepared.push(rows);
    }
  } catch (error: unknown) {
    if (!(error instanceof Error)) throw error;
    return { kind: "refused", reason: "geometry", detail: error.message };
  }

  const rows: Rows[] = prepared.flatMap(
    (body: (typeof prepared)[number]): Rows[] => body.rows,
  );
  const tolerance: number = Math.min(
    ...prepared.map(
      (member: (typeof prepared)[number]): number => member.tolerance,
    ),
  );
  const iterations: number = Math.max(
    ...prepared.map(
      (member: (typeof prepared)[number]): number => member.iterations,
    ),
  );
  let solved: ReturnType<typeof solvePhysicalTargetForest>;
  try {
    solved = solvePhysicalTargetForest({
      segments: Object.keys(initial).map((bone: string): { bone: string } => ({
        bone,
      })),
      joints,
      bones,
      targets: initial,
      tolerance,
      iterations,
      measure: (poses: IAutoMoviePoses): number[] =>
        rows.flatMap((row: Rows): number[] => row.measure(poses)),
      linearize: (
        poses: IAutoMoviePoses,
      ): ReturnType<typeof linearizePhysicalTargetRows> =>
        linearizePhysicalTargetRows(rows, poses),
    });
  } catch (error: unknown) {
    if (!(error instanceof Error)) throw error;
    return { kind: "refused", reason: "geometry", detail: error.message };
  }
  const report: Report = {
    tolerance,
    iterations: solved.iterations,
    residual: solved.residual,
    witnesses: prepared.flatMap(
      (member: (typeof prepared)[number], index: number): Witness[] => [
        ...member.bindings.map(
          (binding: (typeof member.bindings)[number]): Witness => ({
            body: plans[index]!.body,
            id: binding.id,
            kind: "binding",
            components: binding.rows.measure(solved.targets),
          }),
        ),
        ...member.points.map(
          (point: (typeof member.points)[number]): Witness => ({
            body: plans[index]!.body,
            id: point.id,
            kind: "point",
            components: point.rows.measure(solved.targets),
          }),
        ),
      ],
    ),
  };
  if (solved.residual > tolerance)
    return {
      ...report,
      kind: "unconverged",
      reason: solved.iterations === iterations ? "iteration-budget" : "stalled",
    };
  return {
    ...report,
    kind: "converged",
    targets: Object.fromEntries(
      plans.map((member: PreparedMember): [string, IAutoMoviePoses] => [
        member.body,
        localReaders[member.body]!(solved.targets),
      ]),
    ),
  };

  /** Outside bodies retain their original actual placements for the full fit. */
  function resolve(body: string, bone: string): IPhysicalContactPoseReference {
    if (!participating.has(body))
      return {
        read: (): IAutoMovieRigidTransform => input.actual[body]![bone]!,
      };
    const key: string = qualify(body, bone);
    return {
      key,
      read: (poses: IAutoMoviePoses): IAutoMovieRigidTransform => poses[key]!,
    };
  }
}
type Body = IAutoMoviePhysicalSimulationInput.IBody;
type Target = IAutoMoviePhysicalSimulationInput.ITarget;
type Plan = IAutoMoviePlanPhysicalContactTargets.IInput;

type Rows = IAutoMovieLinearizePhysicalTargetRows.IRows;

type Member = {
  readonly body: string;
  /** The active admitted interval goal. */
  readonly target: Target;
  /** Actual support rows selected for that same interval. */
  readonly supports?: Plan["supports"];
};

type IInput = {
  /** Admitted body profiles and relationship budgets. */
  readonly scene: IAutoMoviePhysicalSimulationInput.IInput;
  /** One mutually dependent group, in any order. */
  readonly members: readonly Member[];
  /** World transforms from a single simultaneous snapshot. */
  readonly actual: Plan["actual"];
  readonly geometry: IAutoMoviePreparePhysicalGeometry.IQueries;
  /** Existing world floor lower bound, metres. */
  readonly floor: number;
};
type Witness = IAutoMoviePhysicalCoupledTargetFit.IWitness;
type Report = IAutoMoviePhysicalCoupledTargetFit.IReport;

type Refusal = Omit<
  IAutoMoviePhysicalCoupledTargetFit.IRefused,
  keyof IAutoMoviePhysicalCoupledTargetFit.IInterval
>;

type IResult =
  | (Report & {
      readonly kind: "converged";
      readonly targets: Readonly<Record<string, IAutoMoviePoses>>;
    })
  | (Report & {
      readonly kind: "unconverged";
      readonly reason: "iteration-budget" | "stalled";
    })
  | Refusal;

type PreparedMember = {
  readonly body: string;
  readonly plan: Plan;
  readonly bones: readonly string[];
};

/** Read one body's local bone view of the qualified world poses. */
function localView(
  body: string,
  names: readonly string[],
): (poses: IAutoMoviePoses) => IAutoMoviePoses {
  const keys: string[] = names.map((bone: string): string =>
    qualify(body, bone),
  );
  return (poses: IAutoMoviePoses): IAutoMoviePoses =>
    Object.fromEntries(
      names.map(
        (bone: string, index: number): [string, IAutoMovieRigidTransform] => [
          bone,
          poses[keys[index]!]!,
        ],
      ),
    );
}

function freeCoordinates(joint: IAutoMoviePhysicalJoint): number {
  return joint.axes.filter(
    (axis: IAutoMoviePhysicalJointAxis): boolean => axis.maximum > axis.minimum,
  ).length;
}

function hasPose(actual: Plan["actual"], body: string, bone: string): boolean {
  const poses: IAutoMoviePoses | undefined = actual[body];
  return (
    Object.hasOwn(actual, body) &&
    poses !== undefined &&
    Object.hasOwn(poses, bone)
  );
}

function qualify(body: string, bone: string): string {
  return JSON.stringify([body, bone]);
}

function compare(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
