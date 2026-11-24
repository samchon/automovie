import type {
  IAutoMovieLinearizePhysicalTargetRows,
  IAutoMoviePhysicalContactBinding,
  IAutoMoviePhysicalContactBindingRows,
  IAutoMoviePhysicalPointBound,
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalShape,
  IAutoMoviePlanPhysicalContactTargets,
  IAutoMoviePoses,
  IAutoMoviePreparePhysicalGeometry,
  IAutoMovieRigidTransform,
} from "@automovie/interface";

import type { IPhysicalContactPoseReference } from "./IPhysicalContactPoseReference";
import type { ResolvePhysicalContactPose } from "./ResolvePhysicalContactPose";
import { admitPhysicalPointBounds } from "./admitPhysicalPointBounds";
import { initialPhysicalContactTargets } from "./initialPhysicalContactTargets";
import { isPhysicalProfilePairExcluded } from "./isPhysicalProfilePairExcluded";
import { linearizePhysicalInterval } from "./linearizePhysicalInterval";
import { linearizePhysicalSeparation } from "./linearizePhysicalSeparation";
import { physicalContactBindingRows } from "./physicalContactBindingRows";
import { physicalContactSupportRows } from "./physicalContactSupportRows";
import { physicalPointProjection } from "./physicalPointProjection";
import { preparePhysicalContactBindingRows } from "./preparePhysicalContactBindingRows";

type Input = IAutoMoviePlanPhysicalContactTargets.IInput;
type Rows = IAutoMovieLinearizePhysicalTargetRows.IRows;
type PoseRead<Value> = (poses: IAutoMoviePoses) => Value;

type Scope = {
  key(bone: string): string;
  local(poses: IAutoMoviePoses): IAutoMoviePoses;
  resolve: ResolvePhysicalContactPose;
};

type IPrepared = {
  initial: Record<string, IAutoMovieRigidTransform>;
  rows: Rows[];
  bindings: IAutoMoviePhysicalContactBindingRows.IResult;
  points: { id: string; rows: Rows }[];
  iterations: number;
  tolerance: number;
  coupledScalarRows: number;
};

/**
 * Prepare one body's geometry constraints against either its local pose map or
 * a common scene candidate.
 */
export function preparePhysicalContactTargetRows(
  input: Input,
  initial?: Record<string, IAutoMovieRigidTransform>,
  scope?: Scope,
): IPrepared {
  const profile: IAutoMoviePhysicalProfile = input.profiles[input.body]!;
  const supportRows: Rows[] = physicalContactSupportRows({
    profile,
    supports: input.supports ?? [],
    body: input.body,
    geometry: input.geometry,
    floor: input.floor,
  });
  const bounds: readonly IAutoMoviePhysicalPointBound[] =
    input.pointBounds ?? [];
  admitPhysicalPointBounds(
    input.profiles,
    input.body,
    bounds,
    new Set(
      input.bindings.map(
        (binding: IAutoMoviePhysicalContactBinding): string => binding.id,
      ),
    ),
  );
  const seed: Record<string, IAutoMovieRigidTransform> =
    initial ?? initialPhysicalContactTargets(input);
  const bindings: IAutoMoviePhysicalContactBinding[] = input.bindings.filter(
    (binding: IAutoMoviePhysicalContactBinding): boolean => binding.weight > 0,
  );
  const key: (bone: string) => string =
    scope?.key ?? ((bone: string): string => bone);
  const shapes: {
    bone: string;
    key: string;
    shape: IAutoMoviePhysicalShape;
  }[] = profile.segments.flatMap(
    (segment: IAutoMoviePhysicalSegment): typeof shapes =>
      segment.shapes.map(
        (shape: IAutoMoviePhysicalShape): (typeof shapes)[number] => ({
          bone: segment.bone,
          key: key(segment.bone),
          shape,
        }),
      ),
  );
  const pairs: { a: (typeof shapes)[number]; b: (typeof shapes)[number] }[] =
    input.selfAvoidance
      ? shapes.flatMap(
          (a: (typeof shapes)[number], index: number): typeof pairs =>
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
    scope === undefined
      ? physicalContactBindingRows({ ...input, bindings, initial: seed })
      : preparePhysicalContactBindingRows(
          { ...input, bindings, initial: seed },
          scope.resolve,
        );
  const points: IPrepared["points"] = bounds.map(
    (bound: IAutoMoviePhysicalPointBound): IPrepared["points"][number] => {
      const sameBody: boolean = bound.reference.body === input.body;
      const peer: IPhysicalContactPoseReference | undefined = sameBody
        ? undefined
        : scope?.resolve(bound.reference.body, bound.reference.bone);
      const names: Set<string> = new Set([key(bound.source.bone)]);
      if (sameBody) names.add(key(bound.reference.bone));
      else if (peer?.key !== undefined) names.add(peer.key);
      const project: PoseRead<number> = (poses: IAutoMoviePoses): number =>
        physicalPointProjection(
          input.body,
          input.profiles,
          peer?.key !== undefined
            ? {
                [bound.reference.body]: {
                  [bound.reference.bone]: peer.read(poses),
                },
              }
            : input.actual,
          bound,
          scope?.local(poses) ?? poses,
        );
      const measure: PoseRead<number[]> = (
        poses: IAutoMoviePoses,
      ): number[] => {
        const value: number = project(poses);
        return [
          ...(bound.minimum !== undefined
            ? [Math.min(0, value - bound.minimum)]
            : []),
          ...(bound.maximum !== undefined
            ? [Math.max(0, value - bound.maximum)]
            : []),
        ];
      };
      return {
        id: bound.id,
        rows: {
          bones: names,
          measure,
          linearize: (poses: IAutoMoviePoses): PoseRead<number[]> => {
            const interval: (value: number) => number[] =
              linearizePhysicalInterval(
                project(poses),
                bound.minimum,
                bound.maximum,
              );
            return (probe: IAutoMoviePoses): number[] =>
              interval(project(probe));
          },
        },
      };
    },
  );
  const self: Rows[] = pairs.map((pair: (typeof pairs)[number]): Rows => {
    const contact: PoseRead<
      ReturnType<IAutoMoviePreparePhysicalGeometry.IQueries["contact"]>
    > = (
      poses: IAutoMoviePoses,
    ): ReturnType<IAutoMoviePreparePhysicalGeometry.IQueries["contact"]> =>
      input.geometry.contact(
        collider(pair.a, poses),
        collider(pair.b, poses),
        0,
      );
    return {
      bones: new Set([pair.a.key, pair.b.key]),
      rigidInvariant: true,
      measure: (poses: IAutoMoviePoses): number[] => [
        Math.min(0, contact(poses)?.separation ?? 0),
      ],
      linearize: (poses: IAutoMoviePoses): PoseRead<number[]> => {
        const model: (
          first: IAutoMovieRigidTransform,
          second: IAutoMovieRigidTransform,
        ) => number = linearizePhysicalSeparation(
          input.geometry,
          collider(pair.a, poses),
          collider(pair.b, poses),
          contact(poses),
        );
        return (probe: IAutoMoviePoses): number[] => [
          model(probe[pair.a.key]!, probe[pair.b.key]!),
        ];
      },
    };
  });
  const supports: Rows[] =
    scope === undefined
      ? supportRows
      : supportRows.map(
          (row: Rows): Rows => ({
            bones: new Set([...row.bones].map(key)),
            rigidInvariant: row.rigidInvariant,
            measure: (poses: IAutoMoviePoses): number[] =>
              row.measure(scope.local(poses)),
            linearize: (poses: IAutoMoviePoses): PoseRead<number[]> => {
              const model: PoseRead<number[]> = row.linearize(
                scope.local(poses),
              );
              return (probe: IAutoMoviePoses): number[] =>
                model(scope.local(probe));
            },
          }),
        );
  return {
    initial: seed,
    rows: [
      ...relationships.map(
        (relationship: (typeof relationships)[number]): Rows =>
          relationship.rows,
      ),
      ...points.map((point: (typeof points)[number]): Rows => point.rows),
      ...self,
      ...supports,
    ],
    bindings: relationships,
    points,
    iterations: Math.max(
      input.selfAvoidance?.iterations ?? 1,
      ...bindings.map(
        (binding: IAutoMoviePhysicalContactBinding): number =>
          binding.iterations,
      ),
      ...bounds.map(
        (bound: IAutoMoviePhysicalPointBound): number => bound.iterations,
      ),
    ),
    tolerance: Math.min(
      input.selfAvoidance?.tolerance ?? Infinity,
      ...bindings.map(
        (binding: IAutoMoviePhysicalContactBinding): number =>
          binding.tolerance,
      ),
      ...bounds.map(
        (bound: IAutoMoviePhysicalPointBound): number => bound.tolerance,
      ),
    ),
    coupledScalarRows:
      scope === undefined
        ? 0
        : shapes.length +
          pairs.length +
          bindings.reduce(
            (sum: number, binding: IAutoMoviePhysicalContactBinding): number =>
              sum + (binding.kind === "contact" ? 3 : 1),
            0,
          ) +
          bounds.reduce(
            (sum: number, bound: IAutoMoviePhysicalPointBound): number =>
              sum +
              Number(bound.minimum !== undefined) +
              Number(bound.maximum !== undefined),
            0,
          ) +
          (input.supports ?? []).reduce(
            (
              sum: number,
              support: NonNullable<Input["supports"]>[number],
            ): number =>
              sum +
              (support.patch
                ? 4 + (support.patch.floorPoints?.length ?? 0)
                : 3),
            0,
          ),
  };

  /** Borrow an admitted shape at the selected candidate bone pose. */
  function collider(
    entry: (typeof shapes)[number],
    poses: IAutoMoviePoses,
  ): IAutoMoviePreparePhysicalGeometry.ICollider {
    return {
      body: input.body,
      bone: entry.bone,
      shape: entry.shape,
      pose: poses[entry.key]!,
    };
  }
}
