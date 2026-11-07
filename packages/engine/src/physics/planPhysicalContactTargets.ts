import type {
  IAutoMoviePhysicalContactBinding as Binding,
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
  IAutoMoviePhysicalPointBound as PointBound,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { admitPhysicalPointBounds } from "./admitPhysicalPointBounds";
import { isPhysicalProfilePairExcluded } from "./isPhysicalProfilePairExcluded";
import { linearizePhysicalInterval } from "./linearizePhysicalInterval";
import { linearizePhysicalSeparation } from "./linearizePhysicalSeparation";
import { physicalPointProjection } from "./physicalPointProjection";
import { physicalShapeSurfaceAnchor } from "./physicalShapeSurfaceAnchor";
import { physicalSupportPoint } from "./physicalSupportPoint";
import type { preparePhysicalGeometry as Geometry } from "./preparePhysicalGeometry";
import { projectPhysicalTargets } from "./projectPhysicalTargets";
import { rebasePhysicalTargets } from "./rebasePhysicalTargets";
import { solvePhysicalArticulationTargets } from "./solvePhysicalArticulationTargets";

/**
 * Fit relationships in one bounded articulation solve. Actual receiver surfaces,
 * declared supports, the floor and enabled self contacts share one residual
 * vector. The root stays at its actual pose; joint limits and anchors remain
 * intact. No actual body, impulse or receipt changes. Unreachable intent remains
 * a residual, rather than becoming a claimed successful contact.
 */
export function planPhysicalContactTargets(input: {
  /** Source scene identity. */ body: string;
  /** Exact source and receiver profiles. */ profiles: Readonly<
    Record<string, P>
  >;
  /** Authored motor placements, borrowed without mutation. */ targets: Readonly<
    Record<string, P.ITransform>
  >;
  /** One simultaneous actual scene snapshot. */ actual: Readonly<
    Record<string, Readonly<Record<string, P.ITransform>>>
  >;
  /** Explicit relationships for this cached interval. */ bindings: readonly Binding[];
  /** Candidate-relative projection corridors, sharing the admitted relationship budgets. */ pointBounds?: readonly PointBound[];
  /** Profile-wide collision avoidance without anatomical selectors. */ selfAvoidance?: {
    iterations: number;
    tolerance: number;
  };
  /** Enabled world endpoints retained while other branches reach a receiver. */ supports?: readonly {
    bone: string;
    localPoint?: IAutoMovieVector3;
    point: IAutoMovieVector3;
  }[];
  /** Initialized no-dynamics convex queries. */ geometry: Geometry.IQueries;
  /** World floor lower bound in metres. */ floor: number;
}): {
  targets: Record<string, P.ITransform>;
  residuals: Record<string, number>;
} {
  const profile: P = input.profiles[input.body]!;
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
  const features: planPhysicalContactTargets.IFeature[] = bindings.map(
    (binding: Binding): planPhysicalContactTargets.IFeature => {
      const source: P.IShape = shape(profile, binding.source);
      const receiver: P.IShape = shape(
        input.profiles[binding.target.body]!,
        binding.target,
      );
      const pose: P.ITransform = receiverPose(binding, initial);
      const collider: Geometry.ICollider = {
        body: input.body,
        bone: binding.source.bone,
        shape: source,
        pose: initial[binding.source.bone]!,
      };
      const contact: ReturnType<Geometry.IQueries["contact"]> =
        input.geometry.contact(
          collider,
          {
            body: binding.target.body,
            bone: binding.target.bone,
            shape: receiver,
            pose,
          },
          0,
          100,
        );
      if (!contact)
        throw new Error("Contact binding exceeds query domain: " + binding.id);
      const anchor: ReturnType<typeof physicalShapeSurfaceAnchor> = binding
        .target.normal
        ? physicalShapeSurfaceAnchor(pose, receiver, binding.target.normal)
        : {
            point: Vector3.add(
              contact.point,
              Vector3.scale(contact.normal, contact.separation / 2),
            ),
            normal: Vector3.scale(contact.normal, -1),
          };
      return {
        binding,
        source,
        target: receiver,
        point: Quaternion.rotateVector(
          Quaternion.inverse(pose.rotation),
          Vector3.subtract(anchor.point, pose.position),
        ),
        normal: Quaternion.rotateVector(
          Quaternion.inverse(pose.rotation),
          anchor.normal,
        ),
        start: input.geometry.project(collider, anchor.point),
      };
    },
  );
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
      linearize,
    });
  const residuals: Record<string, number> = Object.fromEntries([
    ...features.map(
      (feature: planPhysicalContactTargets.IFeature): [string, number] => [
        feature.binding.id,
        Math.hypot(...relationship(feature, result.targets)),
      ],
    ),
    ...pointBounds.map((bound: PointBound): [string, number] => [
      bound.id,
      Math.hypot(...pointRelationship(bound, result.targets)),
    ]),
  ]);
  return { targets: result.targets, residuals };

  /** Self relationships follow candidate motion; other bodies use the actual snapshot. */
  function receiverPose(
    binding: Binding,
    poses: Readonly<Record<string, P.ITransform>>,
  ): P.ITransform {
    return binding.target.body === input.body
      ? poses[binding.target.bone]!
      : input.actual[binding.target.body]![binding.target.bone]!;
  }

  /** Contact selects a receiver-local surface feature; separation never attracts. */
  function relationship(
    feature: planPhysicalContactTargets.IFeature,
    poses: Readonly<Record<string, P.ITransform>>,
  ): number[] {
    const binding: Binding = feature.binding;
    const pose: P.ITransform = receiverPose(binding, poses);
    const source: Geometry.ICollider = {
      body: input.body,
      bone: binding.source.bone,
      shape: feature.source,
      pose: poses[binding.source.bone]!,
    };
    const target: Geometry.ICollider = {
      body: binding.target.body,
      bone: binding.target.bone,
      shape: feature.target,
      pose,
    };
    if (binding.kind === "separate")
      return [
        Math.min(
          0,
          input.geometry.contact(source, target, 0)?.separation ?? 0,
        ) * binding.weight,
      ];
    const anchor: IAutoMovieVector3 = Vector3.subtract(
      physicalSupportPoint(pose, feature.point),
      Vector3.scale(
        Quaternion.rotateVector(pose.rotation, feature.normal),
        binding.compression,
      ),
    );
    const goal: IAutoMovieVector3 = Vector3.add(
      feature.start,
      Vector3.scale(Vector3.subtract(anchor, feature.start), binding.weight),
    );
    const difference: IAutoMovieVector3 = Vector3.subtract(
      input.geometry.project(source, goal),
      goal,
    );
    return [difference.x, difference.y, difference.z];
  }

  /** Same-body references move coherently with shared ancestors; other bodies remain the simultaneous actual snapshot. */
  function pointRelationship(
    bound: PointBound,
    poses: Readonly<Record<string, P.ITransform>>,
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

  /** Refresh pair witnesses only at accepted configurations; probes differentiate their articulated motion in double precision. */
  function linearize(
    poses: Readonly<Record<string, P.ITransform>>,
  ): (probe: Readonly<Record<string, P.ITransform>>) => number[] {
    const models: ReturnType<typeof linearizePhysicalSeparation>[] = pairs.map(
      (
        pair: (typeof pairs)[number],
      ): ReturnType<typeof linearizePhysicalSeparation> =>
        linearizePhysicalSeparation(
          input.geometry,
          collider(pair.a, poses),
          collider(pair.b, poses),
        ),
    );
    const intervals: ((probe: number) => number[])[] = pointBounds.map(
      (bound: PointBound): ((probe: number) => number[]) =>
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
        ),
    );
    const floors: ((probe: number) => number[])[] = shapes.map(
      (entry: (typeof shapes)[number]): ((probe: number) => number[]) =>
        linearizePhysicalInterval(
          input.geometry.minimumY(collider(entry, poses)),
          input.floor,
        ),
    );
    const separate: Map<
      planPhysicalContactTargets.IFeature,
      ReturnType<typeof linearizePhysicalSeparation>
    > = new Map(
      features
        .filter(
          (feature: planPhysicalContactTargets.IFeature): boolean =>
            feature.binding.kind === "separate",
        )
        .map(
          (
            feature: planPhysicalContactTargets.IFeature,
          ): [
            planPhysicalContactTargets.IFeature,
            ReturnType<typeof linearizePhysicalSeparation>,
          ] => [
            feature,
            linearizePhysicalSeparation(
              input.geometry,
              {
                body: input.body,
                bone: feature.binding.source.bone,
                shape: feature.source,
                pose: poses[feature.binding.source.bone]!,
              },
              {
                body: feature.binding.target.body,
                bone: feature.binding.target.bone,
                shape: feature.target,
                pose: receiverPose(feature.binding, poses),
              },
            ),
          ],
        ),
    );
    return (probe: Readonly<Record<string, P.ITransform>>): number[] => [
      ...features.flatMap(
        (feature: planPhysicalContactTargets.IFeature): number[] =>
          separate.has(feature)
            ? [
                separate.get(feature)!(
                  probe[feature.binding.source.bone]!,
                  receiverPose(feature.binding, probe),
                ) * feature.binding.weight,
              ]
            : relationship(feature, probe),
      ),
      ...pointBounds.flatMap((bound: PointBound, index: number): number[] =>
        intervals[index]!(
          physicalPointProjection(
            input.body,
            input.profiles,
            input.actual,
            bound,
            probe,
          ),
        ),
      ),
      ...pairs.map((pair: (typeof pairs)[number], index: number): number =>
        models[index]!(probe[pair.a.bone]!, probe[pair.b.bone]!),
      ),
      ...environment(probe, floors),
    ];
  }

  /** Exact query merit retains every row, including those constant in the local linear system. */
  function measure(poses: Readonly<Record<string, P.ITransform>>): number[] {
    return [
      ...features.flatMap(
        (feature: planPhysicalContactTargets.IFeature): number[] =>
          relationship(feature, poses),
      ),
      ...pointBounds.flatMap((bound: PointBound): number[] =>
        pointRelationship(bound, poses),
      ),
      ...pairs.map((pair: (typeof pairs)[number]): number =>
        Math.min(
          0,
          input.geometry.contact(
            collider(pair.a, poses),
            collider(pair.b, poses),
            0,
          )?.separation ?? 0,
        ),
      ),
      ...environment(poses),
    ];
  }

  /** Floor and endpoint rows share exactly the same ownership in both evaluations. */
  function environment(
    poses: Readonly<Record<string, P.ITransform>>,
    floors?: readonly ((probe: number) => number[])[],
  ): number[] {
    return [
      ...shapes.map((entry: (typeof shapes)[number], index: number): number =>
        floors
          ? floors[index]!(input.geometry.minimumY(collider(entry, poses)))[0]!
          : Math.min(
              0,
              input.geometry.minimumY(collider(entry, poses)) - input.floor,
            ),
      ),
      ...(input.supports ?? []).flatMap(
        (support: NonNullable<typeof input.supports>[number]): number[] => {
          const difference: IAutoMovieVector3 = Vector3.subtract(
            physicalSupportPoint(poses[support.bone]!, support.localPoint),
            support.point,
          );
          return [difference.x, difference.y, difference.z];
        },
      ),
    ];
  }

  /** Borrow an admitted shape at the selected candidate bone pose. */
  function collider(
    entry: (typeof shapes)[number],
    poses: Readonly<Record<string, P.ITransform>>,
  ): Geometry.ICollider {
    return {
      body: input.body,
      bone: entry.bone,
      shape: entry.shape,
      pose: poses[entry.bone]!,
    };
  }
}

/** Receiver-local witnesses retained throughout one simultaneous fit. */
export namespace planPhysicalContactTargets {
  /** The source and selected target surface are owned by admitted profiles. */
  export interface IFeature {
    /** Authored phase and collider identities. */ binding: Binding;
    /** Source collider. */ source: P.IShape;
    /** Receiver collider. */ target: P.IShape;
    /** Receiver-local target point. */ point: IAutoMovieVector3;
    /** Receiver-local outward normal. */ normal: IAutoMovieVector3;
    /** Initial source surface point for phase interpolation. */ start: IAutoMovieVector3;
  }
}

/** Admission owns selector validity; fitting borrows the declared shape. */
function shape(
  profile: P,
  selector: { bone: string; shape: string },
): P.IShape {
  return profile.segments
    .find((segment: P.ISegment): boolean => segment.bone === selector.bone)!
    .shapes.find(
      (candidate: P.IShape): boolean => candidate.id === selector.shape,
    )!;
}
