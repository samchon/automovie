import type {
  IAutoMoviePhysicalContactBinding as Binding,
  IAutoMoviePhysicalProfile as P,
  IAutoMoviePhysicalPointBound as PointBound,
} from "@automovie/interface";

import { admitPhysicalPointBounds } from "./admitPhysicalPointBounds";
import { isPhysicalProfilePairExcluded } from "./isPhysicalProfilePairExcluded";
import { linearizePhysicalInterval } from "./linearizePhysicalInterval";
import { linearizePhysicalSeparation } from "./linearizePhysicalSeparation";
import { linearizePhysicalTargetRows } from "./linearizePhysicalTargetRows";
import { memoizePhysicalTransformValue } from "./memoizePhysicalTransformValue";
import { physicalContactBindingRows } from "./physicalContactBindingRows";
import { physicalContactSupportRows } from "./physicalContactSupportRows";
import { physicalPointProjection } from "./physicalPointProjection";
import type { preparePhysicalGeometry as Geometry } from "./preparePhysicalGeometry";
import { projectPhysicalTargets } from "./projectPhysicalTargets";
import { rebasePhysicalTargets } from "./rebasePhysicalTargets";
import { solvePhysicalArticulationTargets } from "./solvePhysicalArticulationTargets";

/** Borrowed world transforms for one candidate. */
type Poses = Readonly<Record<string, P.ITransform>>;

/** One immutable candidate read, scoped to the owning fit. */
type PoseRead<Value> = (poses: Poses) => Value;

/**
 * Fit relationships in one bounded articulation solve. Actual receiver surfaces,
 * declared supports, the floor and enabled self contacts share one residual
 * vector. The root stays at its actual pose; joint limits and anchors remain
 * intact. No actual body, impulse or receipt changes. Unreachable intent remains
 * a residual, rather than becoming a claimed successful contact.
 */
export function planPhysicalContactTargets(input: {
  /** Source scene identity. */ body: string;
  /** Exact source and receiver profiles. */ profiles: Readonly<Record<string, P>>;
  /** Authored motor placements, borrowed without mutation. */ targets: Poses;
  /** One simultaneous actual scene snapshot. */ actual: Readonly<Record<string, Poses>>;
  /** Explicit relationships for this cached interval. */ bindings: readonly Binding[];
  /** Candidate-relative projection corridors, sharing the admitted relationship budgets. */ pointBounds?: readonly PointBound[];
  /** Profile-wide collision avoidance without anatomical selectors. */ selfAvoidance?: {
    iterations: number;
    tolerance: number;
  };
  /** Original XYZ endpoints and optional provider-owned support patches. */ supports?: readonly physicalContactSupportRows.ISupport[];
  /** Initialized no-dynamics convex queries. */ geometry: Geometry.IQueries;
  /** World floor lower bound in metres. */ floor: number;
}): {
  targets: Record<string, P.ITransform>;
  residuals: Record<string, number>;
} {
  const profile: P = input.profiles[input.body]!;
  const supports: linearizePhysicalTargetRows.IRows[] =
    physicalContactSupportRows({
      profile,
      supports: input.supports ?? [],
      body: input.body,
      geometry: input.geometry,
      floor: input.floor,
    });
  const pointBounds: readonly PointBound[] = input.pointBounds ?? [];
  admitPhysicalPointBounds(
    input.profiles,
    input.body,
    pointBounds,
    new Set(input.bindings.map((binding: Binding): string => binding.id)),
  );
  const root: string = profile.segments.find(
    (segment: P.ISegment): boolean =>
      !profile.joints.some(
        (joint: P.IJoint): boolean => joint.child === segment.bone,
      ),
  )!.bone;
  const coherent: Record<string, P.ITransform> = projectPhysicalTargets(
    profile,
    input.targets,
  ).targets;
  const initial: Record<string, P.ITransform> = rebasePhysicalTargets(
    coherent,
    root,
    input.actual[input.body]![root]!,
  );
  const bindings: Binding[] = input.bindings.filter(
    (binding: Binding): boolean => binding.weight > 0,
  );
  const shapes: { bone: string; shape: P.IShape }[] = profile.segments.flatMap(
    (segment: P.ISegment): { bone: string; shape: P.IShape }[] =>
      segment.shapes.map(
        (shape: P.IShape): { bone: string; shape: P.IShape } => ({
          bone: segment.bone,
          shape,
        }),
      ),
  );
  const pairs: { a: (typeof shapes)[number]; b: (typeof shapes)[number] }[] =
    input.selfAvoidance
      ? shapes.flatMap(
          (
            a: (typeof shapes)[number],
            index: number,
          ): { a: typeof a; b: typeof a }[] =>
            shapes
              .slice(index + 1)
              .filter(
                (b: typeof a): boolean =>
                  !isPhysicalProfilePairExcluded(profile, a.bone, b.bone),
              )
              .map((b: typeof a): { a: typeof a; b: typeof a } => ({ a, b })),
        )
      : [];
  const relationships: ReturnType<typeof physicalContactBindingRows> =
    physicalContactBindingRows({ ...input, bindings, initial });
  const pointValues: PoseRead<number[]>[] = pointBounds.map(
    (bound: PointBound): PoseRead<number[]> =>
      remember(
        [
          bound.source.bone,
          ...(bound.reference.body === input.body ? [bound.reference.bone] : []),
        ],
        (poses: Poses): number[] => pointRelationship(bound, poses),
        bound.reference.body === input.body
          ? undefined
          : (): P.ITransform => input.actual[bound.reference.body]![bound.reference.bone]!,
      ),
  );
  const pairContacts: PoseRead<ReturnType<Geometry.IQueries["contact"]>>[] =
    pairs.map(
      (pair: (typeof pairs)[number]): PoseRead<ReturnType<Geometry.IQueries["contact"]>> =>
        remember(
          [pair.a.bone, pair.b.bone],
          (poses: Poses): ReturnType<Geometry.IQueries["contact"]> =>
            input.geometry.contact(collider(pair.a, poses), collider(pair.b, poses), 0),
        ),
    );
  const rows: linearizePhysicalTargetRows.IRows[] = [
    ...relationships.map(
      (relationship: (typeof relationships)[number]): linearizePhysicalTargetRows.IRows => relationship.rows,
    ),
    ...pointBounds.map(
      (bound: PointBound, index: number): linearizePhysicalTargetRows.IRows => ({
        bones: new Set([
          bound.source.bone,
          ...(bound.reference.body === input.body ? [bound.reference.bone] : []),
        ]),
        measure: pointValues[index]!,
        linearize: (poses: Poses): PoseRead<number[]> => {
          const interval: (value: number) => number[] = linearizePhysicalInterval(
            physicalPointProjection(input.body, input.profiles, input.actual, bound, poses),
            bound.minimum,
            bound.maximum,
          );
          return (probe: Poses): number[] => interval(
            physicalPointProjection(input.body, input.profiles, input.actual, bound, probe),
          );
        },
      }),
    ),
    ...pairs.map(
      (pair: (typeof pairs)[number], index: number): linearizePhysicalTargetRows.IRows => ({
        bones: new Set([pair.a.bone, pair.b.bone]),
        rigidInvariant: true,
        measure: (poses: Poses): number[] => [
          Math.min(0, pairContacts[index]!(poses)?.separation ?? 0),
        ],
        linearize: (poses: Poses): PoseRead<number[]> => {
          const model: ReturnType<typeof linearizePhysicalSeparation> =
            linearizePhysicalSeparation(
              input.geometry,
              collider(pair.a, poses),
              collider(pair.b, poses),
              pairContacts[index]!(poses),
            );
          return (probe: Poses): number[] => [
            model(probe[pair.a.bone]!, probe[pair.b.bone]!),
          ];
        },
      }),
    ),
    ...supports,
  ];
  const bones: string[] = input.selfAvoidance
    ? profile.joints.map((joint: P.IJoint): string => joint.child)
    : [
        ...new Set([
          ...bindings.flatMap((binding: Binding): string[] => binding.chain),
          ...pointBounds.flatMap((bound: PointBound): string[] => bound.chain),
        ]),
      ];
  if (!bones.length)
    return { targets: initial, residuals: Object.create(null) };
  const result: ReturnType<typeof solvePhysicalArticulationTargets> =
    solvePhysicalArticulationTargets({
      profile,
      targets: initial,
      bones,
      iterations: Math.max(
        input.selfAvoidance?.iterations ?? 1,
        ...bindings.map((binding: Binding): number => binding.iterations),
        ...pointBounds.map((bound: PointBound): number => bound.iterations),
      ),
      tolerance: Math.min(
        input.selfAvoidance?.tolerance ?? Infinity,
        ...bindings.map((binding: Binding): number => binding.tolerance),
        ...pointBounds.map((bound: PointBound): number => bound.tolerance),
      ),
      measure,
      linearize: (poses: Poses): ReturnType<typeof linearizePhysicalTargetRows> =>
        linearizePhysicalTargetRows(rows, poses),
    });
  const residuals: Record<string, number> = Object.fromEntries([
    ...relationships.map(
      (relationship: (typeof relationships)[number]): [string, number] => [
        relationship.id,
        Math.hypot(...relationship.rows.measure(result.targets)),
      ],
    ),
    ...pointBounds.map((bound: PointBound, index: number): [string, number] => [
      bound.id,
      Math.hypot(...pointValues[index]!(result.targets)),
    ]),
  ]);
  return { targets: result.targets, residuals };

  /** Same-body references move coherently with shared ancestors; other bodies remain the simultaneous actual snapshot. */
  function pointRelationship(bound: PointBound, poses: Poses): number[] {
    const value: number = physicalPointProjection(
      input.body,
      input.profiles,
      input.actual,
      bound,
      poses,
    );
    return [
      ...(bound.minimum !== undefined
        ? [Math.min(0, value - bound.minimum)]
        : []),
      ...(bound.maximum !== undefined
        ? [Math.max(0, value - bound.maximum)]
        : []),
    ];
  }

  /** Exact merit retains every row, including those invariant in a local probe. */
  function measure(poses: Poses): number[] {
    return rows.flatMap(
      (row: linearizePhysicalTargetRows.IRows): number[] => row.measure(poses),
    );
  }

  /** Reuse values by actual scalar dependencies within this invocation only. */
  function remember<Value>(
    bones: readonly string[],
    compute: PoseRead<Value>,
    external?: () => P.ITransform,
  ): PoseRead<Value> {
    const names: string[] = [...new Set(bones)];
    return memoizePhysicalTransformValue(
      (poses: Poses): P.ITransform[] => [
        ...names.map((bone: string): P.ITransform => poses[bone]!),
        ...(external ? [external()] : []),
      ],
      compute,
    );
  }

  /** Borrow an admitted shape at the selected candidate bone pose. */
  function collider(
    entry: (typeof shapes)[number],
    poses: Poses,
  ): Geometry.ICollider {
    return {
      body: input.body,
      bone: entry.bone,
      shape: entry.shape,
      pose: poses[entry.bone]!,
    };
  }
}
