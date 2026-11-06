import type { IAutoMovieHumanPose } from "../structures/pose/IAutoMovieHumanPose";
import type { AutoMovieHumanClinicalIk as Ik } from "./AutoMovieHumanClinicalIk";
import type { AutoMovieHumanGrounding as Grounding } from "./AutoMovieHumanGrounding";
import type { AutoMovieHumanRigControls as Controls } from "./AutoMovieHumanRigControls";
import type { AutoMovieHumanSkeleton as Skeleton } from "./AutoMovieHumanSkeleton";
import { AutoMovieHumanSkeletonMath as M } from "./AutoMovieHumanSkeletonMath";
import type { AutoMovieHumanSupportFrame as Frame } from "./AutoMovieHumanSupportFrame";

/** Per-run FK, complete-foot geometry and clinical state ownership; no global cache. */
export namespace AutoMovieHumanGroundingState {
  /** One fixed linearization population, with a separate measured physical residual. */
  export interface IState {
    /** Ordered hard target differences and the existing floor term, metres. */
    residual: number[];

    /** Separate expressive point differences, metres. */
    expressive: number[];

    /** Minimum over every original source-foot point, world metres. */
    minimum: number;

    /** Largest hard target distance, metres. */
    supportError: number;

    /** Largest expressive target distance, metres. */
    softError: number;

    /** Largest hard target or floor residual, metres. */
    error: number;
  }
  /** One run's original argument references and scalar policies; no field snapshots a caller getter. */
  export interface IContext {
    /** Prepared body's copied point groups. */ groups: Map<
      Controls.Joint,
      M.Vector[]
    >;

    /** Original root supplying the unchanged no-hard-target Y preference. */ initial: Grounding.IRoot;

    /** Original request, read at the existing measurement sites. */ request: Grounding.IRequest;

    /** Original already selected soft population. */ soft: readonly Ik.ITarget[];

    /** Selected canonical angular coordinates. */ paths: Controls.DegreeChannel[];

    /** Independent copied clinical pose, normalized at the original apply sites. */ pose: IAutoMovieHumanPose;

    /** Independent mutable scene root. */ root: Grounding.IRoot;

    /** Same mutable coordinate array used by probes and rollback. */ values: number[];

    /** Original projected or plain evaluation capability. */ trial: Skeleton.ProjectionEvaluator;

    /** Existing fitting-only vertical-elimination policy. */ eliminateY: boolean;

    /** World-metre plane. */ floor: number;

    /** Existing hard support tolerance in metres. */ tolerance: number;

    /** Independent nonpenetration tolerance in metres. */ floorTolerance: number;

    /** Existing soft angular preferences. */ knee: number[];
  }
  /** One initialized run's FK slot, measurements and unchanged trial operations. */
  export interface IWorkspace {
    /** Current original FK identity; initialize with apply or the inspected result before measuring. */ output: Skeleton.IProjection;

    /** Complete source-cloud minimum. */ minimum: () => number;

    /** Complete ordered source-cloud heights. */ heights: () => number[];

    /** Separate hard and expressive measurements. */ state: () => IState;

    /** Normalize selected coordinates and apply the original vertical policy. */ apply: (
      eliminate?: boolean,
    ) => Skeleton.IProjection;

    /** Original physical and selected-clamp admission. */ admitted: (
      value: IState,
    ) => boolean;

    /** Original squared hard merit. */ physical: (value: IState) => number;

    /** Original expressive and angular merit. */ expressive: (
      value: IState,
    ) => number;
  }
  /**
   * The fit call retains this workspace only for its run. Its affine cache and
   * closures become unreachable on return or throw; the final public FK result
   * remains caller-owned. No placement cache is attached to that result.
   */
  export function prepare(context: IContext): IWorkspace {
    const {
      groups,
      initial,
      request,
      soft,
      paths,
      pose,
      root,
      values,
      trial,
      eliminateY,
      floor,
      tolerance,
      floorTolerance,
      knee,
    }: IContext = context;

    let output: Skeleton.IProjection;
    let geometryOutput: Skeleton.IProjection | undefined;
    let geometryPlacements: Map<string, Skeleton.IPlacement> = new Map();
    let geometryRows: {
      origin: number;
      row: M.Vector;
      points: M.Vector[];
    }[] = [];

    /** Reuse exact affine arithmetic only within this owned FK and fixed root rotation. */
    function placements(): Map<string, Skeleton.IPlacement> {
      if (geometryOutput !== output) {
        geometryPlacements = new Map(
          output.posed.map(
            (row: Skeleton.IPlacement): [string, Skeleton.IPlacement] => [
              row.bone,
              row,
            ],
          ),
        );
        geometryRows = [];
        for (const [name, points] of groups) {
          const bone: Skeleton.IPlacement | undefined =
            geometryPlacements.get(name);
          if (!bone) throw new Error(`Grounding bone absent: ${name}`);
          const rotation: M.Quaternion = M.multiply(
            root.rotation,
            bone.rotation,
          );
          geometryRows.push({
            origin: M.rotate(root.rotation, bone.position)[1],
            row: M.rotate(
              [-rotation[0], -rotation[1], -rotation[2], rotation[3]],
              [0, 1, 0],
            ),
            points,
          });
        }
        geometryOutput = output;
      }
      return geometryPlacements;
    }

    /** Every original point participates through the exact current bone's affine Y row. */
    function minimum(): number {
      placements();
      let value: number = Infinity;
      for (const group of geometryRows) {
        const origin: number = group.origin + root.translation[1];
        for (const point of group.points)
          value = Math.min(
            value,
            origin +
              group.row[0] * point[0] +
              group.row[1] * point[1] +
              group.row[2] * point[2],
          );
      }
      return value;
    }

    /** Same ordered full-foot population supplies each linearized inequality. */
    function heights(): number[] {
      placements();
      return geometryRows.flatMap(
        (group: {
          origin: number;
          row: M.Vector;
          points: M.Vector[];
        }): number[] =>
          group.points.map(
            (point: M.Vector): number =>
              group.origin +
              root.translation[1] +
              group.row[0] * point[0] +
              group.row[1] * point[1] +
              group.row[2] * point[2],
          ),
      );
    }

    /** Hard physical measurements and expressive measurements remain separate. */
    function state(): IState {
      const at: Map<string, Skeleton.IPlacement> = placements();
      const residual: number[] = request.targets.flatMap(
        (target: Ik.ITarget): number[] =>
          M.sub(
            world(at, root, {
              bone: target.bone,
              localPoint: target.localPoint ?? [0, 0, 0],
            }),
            target.position,
          ),
      );
      const expressive: number[] = soft.flatMap(
        (target: Ik.ITarget): number[] =>
          M.sub(
            world(at, root, {
              bone: target.bone,
              localPoint: target.localPoint ?? [0, 0, 0],
            }),
            target.position,
          ),
      );
      const low: number = minimum();
      if (!eliminateY) residual.push(Math.min(0, low - floor));
      const supportError: number = Math.max(
        0,
        ...request.targets.map((_: Ik.ITarget, index: number): number =>
          Math.hypot(...residual.slice(index * 3, index * 3 + 3)),
        ),
      );
      return {
        residual,
        expressive,
        minimum: low,
        supportError,
        softError: Math.max(
          0,
          ...soft.map((_: Ik.ITarget, index: number): number =>
            Math.hypot(...expressive.slice(index * 3, index * 3 + 3)),
          ),
        ),
        error: Math.max(supportError, floor - low, 0),
      };
    }

    /** Apply actual conditional coordinates, then eliminate root Y in this same constrained trial. */
    function apply(eliminate: boolean = true): Skeleton.IProjection {
      paths.forEach((path: Controls.DegreeChannel, index: number): void =>
        write(pose, path, values[index]!),
      );
      output = trial(pose);
      let changed: boolean = false;
      for (const clamp of output.clamped) {
        const index: number = paths.findIndex(
          (path: Controls.DegreeChannel): boolean => path === clamp.path,
        );
        if (index >= 0) {
          values[index] = clamp.applied;
          write(pose, clamp.path, clamp.applied);
          changed = true;
        }
      }
      if (changed) output = trial(pose);
      if (eliminateY && eliminate) {
        const at: Map<string, Skeleton.IPlacement> = placements();
        const lower: number = root.translation[1] + floor - minimum();
        const ideal: number = request.targets.length
          ? request.targets.reduce(
              (sum: number, target: Ik.ITarget): number =>
                sum +
                target.position[1] -
                world(
                  at,
                  {
                    translation: [root.translation[0], 0, root.translation[2]],
                    rotation: root.rotation,
                  },
                  {
                    bone: target.bone,
                    localPoint: target.localPoint ?? [0, 0, 0],
                  },
                )[1],
              0,
            ) / request.targets.length
          : initial.translation[1];
        root.translation[1] = Math.max(lower, ideal);
      }
      return output;
    }

    /** Full physical tolerances are necessary; finite coordinates alone never admit a result. */
    function admitted(value: IState): boolean {
      return (
        value.supportError <= tolerance &&
        value.minimum >= floor - floorTolerance &&
        output.clamped.every(
          (clamp: Skeleton.IClamp): boolean =>
            !paths.some(
              (path: Controls.DegreeChannel): boolean => path === clamp.path,
            ),
        )
      );
    }

    /** Primary merit is physical; expressive preferences cannot compensate for its violation. */
    function physical(value: IState): number {
      return value.residual.reduce(
        (sum: number, item: number): number => sum + item * item,
        0,
      );
    }

    /** Secondary merit has separate metre targets and a small degree regularizer. */
    function expressive(value: IState): number {
      return (
        value.expressive.reduce(
          (sum: number, item: number): number => sum + item * item,
          0,
        ) +
        values.reduce(
          (sum: number, item: number, index: number): number =>
            sum +
            (Number.isFinite(knee[index])
              ? 1e-7 * (item - knee[index]!) ** 2
              : 0),
          0,
        )
      );
    }
    return {
      /** Read the same original lexical FK slot. */ get output(): Skeleton.IProjection {
        return output;
      },

      /** Restore or publish the same original lexical FK slot. */ set output(
        value: Skeleton.IProjection,
      ) {
        output = value;
      },
      minimum,
      heights,
      state,
      apply,
      admitted,
      physical,
      expressive,
    };
  }

  /** Visit each required coordinate so sparse arrays cannot skip root or point admission. */
  export function finiteTuple(value: unknown, size: number): boolean {
    return (
      Array.isArray(value) &&
      value.length === size &&
      Array.from(
        { length: size },
        (_: unknown, index: number): number => index,
      ).every((index: number): boolean => Number.isFinite(value[index]))
    );
  }

  /** Read only a caller-selected canonical angular leaf. */
  export function read(pose: IAutoMovieHumanPose, path: string): number {
    let node: unknown = pose;
    for (const part of path.split(".")) {
      if (typeof node !== "object" || node === null) return 0;
      node = Reflect.get(node, part);
    }
    return typeof node === "number" ? node : 0;
  }

  /** Write selected public controls while retaining the bilateral region contract. */
  export function write(
    pose: IAutoMovieHumanPose,
    path: string,
    value: number,
  ): void {
    const parts: string[] = path.split(".");
    let node: object = pose;
    for (const part of parts.slice(0, -1)) {
      if (
        typeof Reflect.get(node, part) !== "object" ||
        Reflect.get(node, part) === null
      )
        Reflect.set(
          node,
          part,
          node === pose && (part === "arms" || part === "legs")
            ? { left: {}, right: {} }
            : {},
        );
      node = Reflect.get(node, part) as object;
    }
    Reflect.set(node, parts[parts.length - 1]!, value);
  }
}

/** Transform an exact bone-relative witness with its corresponding full FK and root. */
function world(
  placements: Map<string, Skeleton.IPlacement>,
  root: Grounding.IRoot,
  point: Frame.IPoint,
): M.Vector {
  const bone: Skeleton.IPlacement | undefined = placements.get(point.bone);
  if (!bone) throw new Error(`Grounding bone absent: ${point.bone}`);
  return M.add(
    root.translation,
    M.rotate(
      root.rotation,
      M.add(bone.position, M.rotate(bone.rotation, point.localPoint)),
    ),
  );
}
