import type {
  IAutoMovieLinearizePhysicalTargetRows,
  IAutoMoviePhysicalContactBinding,
  IAutoMoviePhysicalContactBindingRows,
  IAutoMoviePhysicalPointBound,
  IAutoMoviePhysicalProfile,
  IAutoMoviePlanPhysicalContactTargets,
  IAutoMoviePoses,
  IAutoMoviePreparePhysicalGeometry,
  IAutoMovieSolvePhysicalArticulationTargets,
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
import { projectPhysicalTargets } from "./projectPhysicalTargets";
import { rebasePhysicalTargets } from "./rebasePhysicalTargets";
import { solvePhysicalArticulationTargets } from "./solvePhysicalArticulationTargets";

/** One immutable candidate read, scoped to the owning fit. */
type PoseRead<Value> = (poses: IAutoMoviePoses) => Value;

/**
 * Fit relationships in one bounded articulation solve. Actual receiver surfaces,
 * declared supports, the floor and enabled self contacts share one residual
 * vector. The root stays at its actual pose; joint limits and anchors remain
 * intact. No actual body, impulse or receipt changes. Unreachable intent remains
 * a residual, rather than becoming a claimed successful contact.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Fit relationships in one bounded articulation solve) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Fit relationships in one bounded articulation solve) directly over its typed inputs (`input`) as nested iteration of depth 3 (map over input.bindings; find over profile.segments; some over profile.joints), delegating to `physicalContactSupportRows`, `admitPhysicalPointBounds`, `projectPhysicalTargets`, `rebasePhysicalTargets`, `shapes.flatMap`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 263 lines and 23 top-level statements that reuses `physicalContactSupportRows`, `admitPhysicalPointBounds`, `projectPhysicalTargets`, `rebasePhysicalTargets`, `shapes.flatMap` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 14 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `input`; the dominant cost is nested iteration of depth 3 (map over input.bindings; find over profile.segments; some over profile.joints), performed once per call with 43 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 43 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function planPhysicalContactTargets(
  input: IAutoMoviePlanPhysicalContactTargets.IInput,
): IAutoMoviePlanPhysicalContactTargets.IResult {
  const profile: IAutoMoviePhysicalProfile = input.profiles[input.body]!;
  const supports: IAutoMovieLinearizePhysicalTargetRows.IRows[] =
    physicalContactSupportRows({
      profile,
      supports: input.supports ?? [],
      body: input.body,
      geometry: input.geometry,
      floor: input.floor,
    });
  const pointBounds: readonly IAutoMoviePhysicalPointBound[] =
    input.pointBounds ?? [];
  admitPhysicalPointBounds(
    input.profiles,
    input.body,
    pointBounds,
    new Set(
      input.bindings.map(
        (binding: IAutoMoviePhysicalContactBinding): string => binding.id,
      ),
    ),
  );
  const root: string = profile.segments.find(
    (segment: IAutoMoviePhysicalProfile.ISegment): boolean =>
      !profile.joints.some(
        (joint: IAutoMoviePhysicalProfile.IJoint): boolean =>
          joint.child === segment.bone,
      ),
  )!.bone;
  const coherent: Record<string, IAutoMoviePhysicalProfile.ITransform> =
    projectPhysicalTargets(profile, input.targets).targets;
  const initial: Record<string, IAutoMoviePhysicalProfile.ITransform> =
    rebasePhysicalTargets(coherent, root, input.actual[input.body]![root]!);
  const bindings: IAutoMoviePhysicalContactBinding[] = input.bindings.filter(
    (binding: IAutoMoviePhysicalContactBinding): boolean => binding.weight > 0,
  );
  const shapes: { bone: string; shape: IAutoMoviePhysicalProfile.IShape }[] =
    profile.segments.flatMap(
      (
        segment: IAutoMoviePhysicalProfile.ISegment,
      ): { bone: string; shape: IAutoMoviePhysicalProfile.IShape }[] =>
        segment.shapes.map(
          (
            shape: IAutoMoviePhysicalProfile.IShape,
          ): { bone: string; shape: IAutoMoviePhysicalProfile.IShape } => ({
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
  const relationships: IAutoMoviePhysicalContactBindingRows.IResult =
    physicalContactBindingRows({ ...input, bindings, initial });
  const pointValues: PoseRead<number[]>[] = pointBounds.map(
    (bound: IAutoMoviePhysicalPointBound): PoseRead<number[]> =>
      remember(
        [
          bound.source.bone,
          ...(bound.reference.body === input.body
            ? [bound.reference.bone]
            : []),
        ],
        (poses: IAutoMoviePoses): number[] => pointRelationship(bound, poses),
        bound.reference.body === input.body
          ? undefined
          : (): IAutoMoviePhysicalProfile.ITransform =>
              input.actual[bound.reference.body]![bound.reference.bone]!,
      ),
  );
  const pairContacts: PoseRead<
    ReturnType<IAutoMoviePreparePhysicalGeometry.IQueries["contact"]>
  >[] = pairs.map(
    (
      pair: (typeof pairs)[number],
    ): PoseRead<
      ReturnType<IAutoMoviePreparePhysicalGeometry.IQueries["contact"]>
    > =>
      remember(
        [pair.a.bone, pair.b.bone],
        (
          poses: IAutoMoviePoses,
        ): ReturnType<IAutoMoviePreparePhysicalGeometry.IQueries["contact"]> =>
          input.geometry.contact(
            collider(pair.a, poses),
            collider(pair.b, poses),
            0,
          ),
      ),
  );
  const rows: IAutoMovieLinearizePhysicalTargetRows.IRows[] = [
    ...relationships.map(
      (
        relationship: (typeof relationships)[number],
      ): IAutoMovieLinearizePhysicalTargetRows.IRows => relationship.rows,
    ),
    ...pointBounds.map(
      (
        bound: IAutoMoviePhysicalPointBound,
        index: number,
      ): IAutoMovieLinearizePhysicalTargetRows.IRows => ({
        bones: new Set([
          bound.source.bone,
          ...(bound.reference.body === input.body
            ? [bound.reference.bone]
            : []),
        ]),
        measure: pointValues[index]!,
        linearize: (poses: IAutoMoviePoses): PoseRead<number[]> => {
          const interval: (value: number) => number[] =
            linearizePhysicalInterval(
              physicalPointProjection(
                input.body,
                input.profiles,
                input.actual,
                bound,
                poses,
              ),
              bound.minimum,
              bound.maximum,
            );
          return (probe: IAutoMoviePoses): number[] =>
            interval(
              physicalPointProjection(
                input.body,
                input.profiles,
                input.actual,
                bound,
                probe,
              ),
            );
        },
      }),
    ),
    ...pairs.map(
      (
        pair: (typeof pairs)[number],
        index: number,
      ): IAutoMovieLinearizePhysicalTargetRows.IRows => ({
        bones: new Set([pair.a.bone, pair.b.bone]),
        rigidInvariant: true,
        measure: (poses: IAutoMoviePoses): number[] => [
          Math.min(0, pairContacts[index]!(poses)?.separation ?? 0),
        ],
        linearize: (poses: IAutoMoviePoses): PoseRead<number[]> => {
          const model: (
            first: IAutoMoviePhysicalProfile.ITransform,
            second: IAutoMoviePhysicalProfile.ITransform,
          ) => number = linearizePhysicalSeparation(
            input.geometry,
            collider(pair.a, poses),
            collider(pair.b, poses),
            pairContacts[index]!(poses),
          );
          return (probe: IAutoMoviePoses): number[] => [
            model(probe[pair.a.bone]!, probe[pair.b.bone]!),
          ];
        },
      }),
    ),
    ...supports,
  ];
  const bones: string[] = input.selfAvoidance
    ? profile.joints.map(
        (joint: IAutoMoviePhysicalProfile.IJoint): string => joint.child,
      )
    : [
        ...new Set([
          ...bindings.flatMap(
            (binding: IAutoMoviePhysicalContactBinding): string[] =>
              binding.chain,
          ),
          ...pointBounds.flatMap(
            (bound: IAutoMoviePhysicalPointBound): string[] => bound.chain,
          ),
        ]),
      ];
  if (!bones.length)
    return { targets: initial, residuals: Object.create(null) };
  const result: IAutoMovieSolvePhysicalArticulationTargets.IResult =
    solvePhysicalArticulationTargets({
      profile,
      targets: initial,
      bones,
      iterations: Math.max(
        input.selfAvoidance?.iterations ?? 1,
        ...bindings.map(
          (binding: IAutoMoviePhysicalContactBinding): number =>
            binding.iterations,
        ),
        ...pointBounds.map(
          (bound: IAutoMoviePhysicalPointBound): number => bound.iterations,
        ),
      ),
      tolerance: Math.min(
        input.selfAvoidance?.tolerance ?? Infinity,
        ...bindings.map(
          (binding: IAutoMoviePhysicalContactBinding): number =>
            binding.tolerance,
        ),
        ...pointBounds.map(
          (bound: IAutoMoviePhysicalPointBound): number => bound.tolerance,
        ),
      ),
      measure,
      linearize: (
        poses: IAutoMoviePoses,
      ): ((probe: IAutoMoviePoses, moved?: ReadonlySet<string>) => number[]) =>
        linearizePhysicalTargetRows(rows, poses),
    });
  const residuals: Record<string, number> = Object.fromEntries([
    ...relationships.map(
      (relationship: (typeof relationships)[number]): [string, number] => [
        relationship.id,
        Math.hypot(...relationship.rows.measure(result.targets)),
      ],
    ),
    ...pointBounds.map(
      (
        bound: IAutoMoviePhysicalPointBound,
        index: number,
      ): [string, number] => [
        bound.id,
        Math.hypot(...pointValues[index]!(result.targets)),
      ],
    ),
  ]);
  return { targets: result.targets, residuals };

  /** Same-body references move coherently with shared ancestors; other bodies remain the simultaneous actual snapshot. */
  function pointRelationship(
    bound: IAutoMoviePhysicalPointBound,
    poses: IAutoMoviePoses,
  ): number[] {
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
  function measure(poses: IAutoMoviePoses): number[] {
    return rows.flatMap(
      (row: IAutoMovieLinearizePhysicalTargetRows.IRows): number[] =>
        row.measure(poses),
    );
  }

  /** Reuse values by actual scalar dependencies within this invocation only. */
  function remember<Value>(
    bones: readonly string[],
    compute: PoseRead<Value>,
    external?: () => IAutoMoviePhysicalProfile.ITransform,
  ): PoseRead<Value> {
    const names: string[] = [...new Set(bones)];
    return memoizePhysicalTransformValue(
      (poses: IAutoMoviePoses): IAutoMoviePhysicalProfile.ITransform[] => [
        ...names.map(
          (bone: string): IAutoMoviePhysicalProfile.ITransform => poses[bone]!,
        ),
        ...(external ? [external()] : []),
      ],
      compute,
    );
  }

  /** Borrow an admitted shape at the selected candidate bone pose. */
  function collider(
    entry: (typeof shapes)[number],
    poses: IAutoMoviePoses,
  ): IAutoMoviePreparePhysicalGeometry.ICollider {
    return {
      body: input.body,
      bone: entry.bone,
      shape: entry.shape,
      pose: poses[entry.bone]!,
    };
  }
}
