import {
  type IAutoMovieQuadraticRow,
  solveAutoMovieQuadraticProgram,
} from "@automovie/engine";
import { refineAutoMovieQuadraticProgram } from "@automovie/engine/math/refineAutoMovieQuadraticProgram";

import { AutoMovieHumanStateAdmission } from "../instance/AutoMovieHumanStateAdmission";
import type { IAutoMovieHumanPose } from "../structures/pose/IAutoMovieHumanPose";
import type { AutoMovieHumanClinicalIk as Ik } from "./AutoMovieHumanClinicalIk";
import { AutoMovieHumanRigControls as Controls } from "./AutoMovieHumanRigControls";
import type { AutoMovieHumanSkeleton as Skeleton } from "./AutoMovieHumanSkeleton";
import { AutoMovieHumanSkeletonMath as M } from "./AutoMovieHumanSkeletonMath";
import type { AutoMovieHumanSupportFrame as Frame } from "./AutoMovieHumanSupportFrame";

/** Joint clinical/root fitting retains actual sole and whole-foot floor constraints. */
export namespace AutoMovieHumanGrounding {
  /** Caller-owned scene placement; fitting changes translation only on explicitly selected axes. */
  export interface IRoot {
    /** Scene-world translation in metres, changed only on requested rootAxes. */
    translation: M.Vector;

    /** Fixed unit x/y/z/w rotation from the evaluator frame to the scene. */
    rotation: M.Quaternion;
  }
  /** Explicit absolute targets and independent full source-foot geometry. */
  export interface IRequest {
    /** World-metre target coordinates; every target keeps its exact bone-local witness. */ targets: readonly Ik.ITarget[];
    /** Expressive world-metre goals optimized only while hard support remains admitted. */ softTargets?: readonly Ik.ITarget[];
    /** Clinical angular controls admitted by the canonical Human catalogue; inspect permits an empty set for a fixed pose. */ channels: readonly Controls.DegreeChannel[];
    /** Soft angular preferences, subordinate to actual point/floor constraints; omitted knees prefer the supplied seed. */ preferred?: Readonly<
      Partial<Record<Controls.DegreeChannel, number>>
    >;
    /** Scene translation degrees of freedom, default vertical only. */ rootAxes?: readonly (
      | "x"
      | "y"
      | "z"
    )[];
    /** Metre support-plane height, default zero. All supplied foot vertices obey this inequality. */ floor?: number;
    /** Finite updates, default six, maximum sixteen. */ iterations?: number;
    /** Actual largest point/floor residual acceptance in metres, default0.00025. */ tolerance?: number;
    /** Independent nonpenetration allowance in metres, default0.000001. */ floorTolerance?: number;
  }
  /** An applied selected angular coordinate currently on its canonical interval endpoint. */
  export interface IBound {
    /** Exact own-side angular channel; jaw millimetres are excluded. */
    path: Controls.DegreeChannel;

    /** Applied clinical angle at the active static or conditional endpoint, degrees. */
    value: number;
  }
  /** Independent clinical pose/root with measurements from its exact public FK. */
  export interface IResult {
    /** Fitting normalizes selected applied controls; inspect retains the supplied controls and reports any selected clamp as unresolved. */
    pose: IAutoMovieHumanPose;

    /** Independent final scene placement; rotation remains the caller's request. */
    root: IRoot;

    /** Public full FK for exactly pose, before the separate scene root. */
    output: Skeleton.IOutput;

    /** Largest final target-distance or floor-penetration residual in metres. */
    error: number;

    /** Minimum scene-world Y across every supplied source-foot point, metres. */
    floorMinimum: number;

    /** Completed finite update count; exhaustion does not certify convergence. */
    iterations: number;

    /** Hard support, full-foot floor and applied clinical bounds all pass only when admitted. */
    status: "admitted" | "unresolved";

    /** Local numerical outcome; unresolved is not a certificate of global infeasibility. */
    reason:
      | "converged"
      | "constraints-violated"
      | "bound-or-stagnated"
      | "budget-exhausted";

    /** Largest hard support target distance in scene metres. */
    supportError: number;

    /** Largest separate expressive target distance in scene metres. */
    softError: number;

    /** Selected applied controls currently on static or conditional clinical bounds. */
    activeBounds: readonly IBound[];

    /** Last local QP's numerical certificate; actual nonlinear geometry alone determines status. */
    quadratic?: IQuadratic;
  }

  /** Local direction provenance, separate from physical goal/floor admission. */
  export interface IQuadratic {
    /** Existing Engine native status; only Solved1 supplies a proposed direction. */ nativeStatus: number;
    /** Native interior-point iterations, distinct from outer FK updates. */ nativeIterations: number;
    /** Original local linear-row violation in that row's declared units. */ maximumViolation: number;
    /** Original local stationarity residual, not a physical residual. */ stationarityResidual: number;
    /** Original local complementarity residual when a Solved native result reached refinement. */ complementarityResidual?: number;
    /** Whether all three local KKT readings meet the separate1e-12 numerical certificate. */ certified: boolean;
    /** Existing Engine polishing steps; no extra native solve or FK. */ refinements: number;
    /** A certified polished or finite native Solved direction still needs exact nonlinear line admission. */ direction:
      | "certified"
      | "inexact"
      | "none";
  }

  /** A fixed body's solver and one-FK admission path share the same complete source points. */
  export interface IPrepared {
    /** Fit hard support and floor before expressive objectives; failures retain exact diagnostics. */
    (pose: IAutoMovieHumanPose, root: IRoot, request: IRequest): IResult;

    /** Inspect the supplied state without changing its root or solving clinical controls; empty channels retain all geometry and target measurements. */
    inspect: (
      pose: IAutoMovieHumanPose,
      root: IRoot,
      request: IRequest,
    ) => IResult;
  }

  /**
   * Prepare one immutable body's complete foot point population. The closure
   * uses bounded clinical Gauss-Newton with a hard-feasibility merit function.
   * Allowed root Y is eliminated inside every nonlinear trial: all actual foot vertices
   * give its lower bound, and hard target heights give the constrained least-
   * squares minimizer. This is not a later correction of an accepted pose.
   * Soft head/posture goals can improve only while physical tolerances hold.
   * Applied conditional controls are normalized before each linearization.
   * Linearizations retain root Y explicitly and constrain every original foot
   * height and angular interval together. Canonical conditional bound gradients
   * reuse the same selected probes, so a knee's tibial interval moves with its
   * flexion without extra FK or duplicated ROM constants. Independently differentiating a
   * minimized maximum would combine incompatible floor branches. A bounded
   * public Engine quadratic solve uses no extra FK, backtracking or updates;
   * one shared step fraction retains its direction and existing step caps.
   * Full-foot Y uses one rigid affine row per actual bone, retaining every
   * source vertex. A finite result is admitted only after exact final FK,
   * target/floor and clinical checks; local failure never proves impossibility.
   * Inspect reuses the same measurements without numerical fitting. Copied
   * descriptors live with this body; no caller pose or historical state is kept.
   * Prepared FK projects every source-foot bone and hard/soft target through
   * the same clinical law. Plain callable evaluators retain their full fallback.
   * Only the final applied result materializes a complete public snapshot;
   * projection placements and per-run affine rows never escape as mutable caches.
   */
  export function prepare(
    evaluate: Skeleton.PoseEvaluator,
    vertices: readonly Frame.IPoint[],
  ): IPrepared {
    if (
      !Array.isArray(vertices) ||
      !vertices.length ||
      Array.from(vertices).some(
        (point: Frame.IPoint): boolean =>
          point === null ||
          typeof point !== "object" ||
          !Controls.isJoint(point.bone) ||
          !finiteTuple(point.localPoint, 3),
      )
    )
      throw new Error("Grounding requires actual finite source-foot points");
    const feet: Frame.IPoint[] = vertices.map(
      (point: Frame.IPoint): Frame.IPoint => ({
        bone: Controls.joint(point.bone),
        localPoint: [...point.localPoint],
      }),
    );
    const groups: Map<Controls.Joint, M.Vector[]> = new Map();
    for (const point of feet) {
      const group: M.Vector[] = groups.get(point.bone) ?? [];
      group.push(point.localPoint);
      groups.set(point.bone, group);
    }
    /** One independent call owns all candidate state and returns an exact applied snapshot. */
    function run(
      seed: IAutoMovieHumanPose,
      initial: IRoot,
      request: IRequest,
      inspect: boolean,
    ): IResult {
      if (
        !Array.isArray(request.channels) ||
        !Array.isArray(request.targets) ||
        (request.softTargets !== undefined &&
          !Array.isArray(request.softTargets)) ||
        (request.rootAxes !== undefined && !Array.isArray(request.rootAxes))
      )
        throw new Error(
          "Grounding controls, dimensions or work budget is invalid",
        );
      const paths: Controls.DegreeChannel[] = Array.from(request.channels);
      const directions: readonly ("x" | "y" | "z")[] = Array.from(
        request.rootAxes ?? ["y"],
      );
      if (
        paths.some(
          (path: Controls.DegreeChannel): boolean => !Controls.isChannel(path),
        ) ||
        directions.some(
          (axis: "x" | "y" | "z"): boolean => !["x", "y", "z"].includes(axis),
        )
      )
        throw new Error(
          "Grounding controls, dimensions or work budget is invalid",
        );
      const eliminateY: boolean = directions.includes("y") && !inspect;
      const axes: number[] = directions.map(
        (axis: "x" | "y" | "z"): number => ({ x: 0, y: 1, z: 2 })[axis],
      );
      const limit: number = request.iterations ?? 6;
      const tolerance: number = request.tolerance ?? 0.00025;
      const floorTolerance: number = request.floorTolerance ?? 0.000001;
      const soft: readonly Ik.ITarget[] = request.softTargets ?? [];
      if (
        (!inspect && !paths.length) ||
        paths.length > 32 ||
        new Set(paths).size !== paths.length ||
        new Set(directions).size !== directions.length ||
        !Number.isInteger(limit) ||
        limit < 1 ||
        limit > 16 ||
        !Number.isFinite(tolerance) ||
        tolerance <= 0 ||
        !Number.isFinite(floorTolerance) ||
        floorTolerance < 0 ||
        !finiteTuple(initial?.translation, 3) ||
        !finiteTuple(initial?.rotation, 4) ||
        Math.abs(Math.hypot(...initial.rotation) - 1) > 1e-6 ||
        [...request.targets, ...soft].some(
          (target: Ik.ITarget): boolean =>
            target === null ||
            typeof target !== "object" ||
            !Controls.isJoint(target.bone) ||
            !finiteTuple(target.position, 3) ||
            (target.localPoint !== undefined &&
              !finiteTuple(target.localPoint, 3)),
        ) ||
        !Number.isFinite(request.floor ?? 0) ||
        Object.entries(request.preferred ?? {}).some(
          ([path, value]: [string, number | undefined]): boolean =>
            !Controls.isChannel(path) ||
            (value !== undefined && !Number.isFinite(value)),
        )
      )
        throw new Error(
          "Grounding controls, dimensions or work budget is invalid",
        );
      const bounds: { minimum: number; maximum: number }[] = paths.map(
        (path: Controls.DegreeChannel): { minimum: number; maximum: number } =>
          Controls.bounds(path),
      );
      const pose: IAutoMovieHumanPose = AutoMovieHumanStateAdmission.pose(seed);
      const root: IRoot = structuredClone(initial);
      const values: number[] = paths.map(
        (path: Controls.DegreeChannel, index: number): number =>
          Math.max(
            bounds[index]!.minimum,
            Math.min(bounds[index]!.maximum, read(pose, path)),
          ),
      );
      const knee: number[] = paths.map(
        (path: Controls.DegreeChannel, index: number): number =>
          request.preferred?.[path] ??
          (/\.knee\.(?:flexion|rotation)$/u.test(path) ? values[index]! : NaN),
      );
      const floor: number = request.floor ?? 0;
      let trial: Skeleton.ProjectionEvaluator = evaluate;
      if (!inspect && evaluate.project) {
        try {
          trial = evaluate.project([
            ...groups.keys(),
            ...request.targets.map((target: Ik.ITarget): string => target.bone),
            ...soft.map((target: Ik.ITarget): string => target.bone),
          ]);
        } catch (error: unknown) {
          throw new Error(`Grounding bone absent or invalid: ${String(error)}`);
        }
      }
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
      let count: number = 0;
      let quadratic: IQuadratic | undefined;
      let reason: IResult["reason"] = inspect
        ? "constraints-violated"
        : "budget-exhausted";

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
                      translation: [
                        root.translation[0],
                        0,
                        root.translation[2],
                      ],
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
      const inspected: Skeleton.IOutput | undefined = inspect
        ? evaluate(pose)
        : undefined;
      output = inspected ?? apply();
      let current: IState = state();
      for (; !inspect && count < limit; ++count) {
        const fixed: IState = current;
        const feasible: boolean = admitted(fixed);
        if (
          feasible &&
          fixed.softError <= tolerance &&
          values.every(
            (value: number, index: number): boolean =>
              !Number.isFinite(knee[index]) ||
              Math.abs(value - knee[index]!) <= 2,
          )
        ) {
          reason = "converged";
          break;
        }
        const previous: number[] = [...values];
        const translation: M.Vector = [...root.translation];
        const originalOutput: Skeleton.IProjection = output;
        const base: number[] = [
          ...fixed.residual,
          ...(feasible ? fixed.expressive : []),
        ];
        const intervals: { minimum: number; maximum: number }[] = paths.map(
          (
            path: Controls.DegreeChannel,
          ): { minimum: number; maximum: number } =>
            Controls.bounds(path, pose),
        );
        const derivatives: number[][] = [];
        const floorBase: number[] = eliminateY ? heights() : [];
        const floorDerivatives: number[][] = [];
        const minimumDerivatives: number[][] = paths.map((): number[] => []);
        const maximumDerivatives: number[][] = paths.map((): number[] => []);
        for (
          let column: number = 0;
          column < paths.length + axes.length;
          ++column
        ) {
          if (column >= paths.length) {
            // Root translations have exact unit derivatives. Keep Y explicit
            // in this local problem so every floor branch shares one variable.
            const axis: number = axes[column - paths.length]!;
            const derivative: number[] = [
              ...request.targets,
              ...(feasible ? soft : []),
            ].flatMap((): number[] =>
              [0, 1, 2].map((component: number): number =>
                component === axis ? 1 : 0,
              ),
            );
            if (!eliminateY)
              derivative.splice(request.targets.length * 3, 0, 0);
            derivatives.push(derivative);
            floorDerivatives.push(
              floorBase.map((): number => (axis === 1 ? 1 : 0)),
            );
            minimumDerivatives.forEach((row: number[]): void => {
              row.push(0);
            });
            maximumDerivatives.forEach((row: number[]): void => {
              row.push(0);
            });
            continue;
          }
          values.splice(0, values.length, ...previous);
          root.translation = [...translation];
          const interval: { minimum: number; maximum: number } =
            intervals[column]!;
          const forward: number = Math.min(
            0.15,
            interval.maximum - previous[column]!,
          );
          const backward: number = Math.min(
            0.15,
            previous[column]! - interval.minimum,
          );
          const step: number = forward >= backward ? forward : -backward;
          if (Math.abs(step) < 1e-10) {
            derivatives.push(base.map((): number => 0));
            floorDerivatives.push(floorBase.map((): number => 0));
            minimumDerivatives.forEach((row: number[]): void => {
              row.push(0);
            });
            maximumDerivatives.forEach((row: number[]): void => {
              row.push(0);
            });
            continue;
          }
          values[column] = previous[column]! + step;
          apply(false);
          const moved: IState = state();
          const applied: number = values[column]! - previous[column]!;
          derivatives.push(
            [...moved.residual, ...(feasible ? moved.expressive : [])].map(
              (value: number, index: number): number =>
                Math.abs(applied) < 1e-10
                  ? 0
                  : (value - base[index]!) / applied,
            ),
          );
          floorDerivatives.push(
            eliminateY
              ? heights().map((value: number, index: number): number =>
                  Math.abs(applied) < 1e-10
                    ? 0
                    : (value - floorBase[index]!) / applied,
                )
              : [],
          );
          paths.forEach((path: Controls.DegreeChannel, index: number): void => {
            const movedInterval: { minimum: number; maximum: number } =
              Controls.bounds(path, pose);
            minimumDerivatives[index]!.push(
              Math.abs(applied) < 1e-10
                ? 0
                : (movedInterval.minimum - intervals[index]!.minimum) / applied,
            );
            maximumDerivatives[index]!.push(
              Math.abs(applied) < 1e-10
                ? 0
                : (movedInterval.maximum - intervals[index]!.maximum) / applied,
            );
          });
        }
        values.splice(0, values.length, ...previous);
        root.translation = [...translation];
        paths.forEach((path: Controls.DegreeChannel, index: number): void =>
          write(pose, path, previous[index]!),
        );
        output = originalOutput;
        const damping: number[] = derivatives.map(
          (_: number[], index: number): number =>
            index < paths.length && Number.isFinite(knee[index]) ? 1e-7 : 2e-8,
        );
        const preference: number[] = derivatives.map(
          (_: number[], index: number): number =>
            feasible && index < paths.length && Number.isFinite(knee[index])
              ? 1e-7 * (knee[index]! - values[index]!)
              : 0,
        );
        const matrix: number[][] = derivatives.map(
          (row: number[], i: number): number[] =>
            derivatives.map(
              (other: number[], j: number): number =>
                row.reduce(
                  (sum: number, value: number, index: number): number =>
                    sum + value * other[index]!,
                  0,
                ) + (i === j ? damping[i]! : 0),
            ),
        );
        const right: number[] = derivatives.map(
          (row: number[], index: number): number =>
            -row.reduce(
              (sum: number, value: number, k: number): number =>
                sum + value * base[k]!,
              0,
            ) + preference[index]!,
        );
        // An outward active coordinate must be fixed before solving the other
        // coupled coordinates. Clipping an unconstrained solution afterward can
        // turn its remaining components into an uphill physical direction.
        // Conditional intervals move with their controlling coordinates. Their
        // canonical bound derivatives belong in the same local QP as the point
        // tasks; freezing a tibial box makes later normalization change the step.
        const coupled: ILinearFloor[] = paths.flatMap(
          (_: Controls.DegreeChannel, index: number): ILinearFloor[] => [
            {
              row: minimumDerivatives[index]!.map(
                (value: number, column: number): number =>
                  (index === column ? 1 : 0) - value,
              ),
              bound: intervals[index]!.minimum - previous[index]!,
            },
            {
              row: maximumDerivatives[index]!.map(
                (value: number, column: number): number =>
                  (index === column ? -1 : 0) + value,
              ),
              bound: previous[index]! - intervals[index]!.maximum,
            },
          ],
        );
        const dependent: boolean =
          minimumDerivatives.some((row: number[]): boolean =>
            row.some((value: number): boolean => value !== 0),
          ) ||
          maximumDerivatives.some((row: number[]): boolean =>
            row.some((value: number): boolean => value !== 0),
          );
        const step: IQuadraticStep | undefined =
          eliminateY || dependent
            ? floorDelta(
                derivatives,
                base,
                damping,
                preference,
                previous,
                bounds,
                [
                  ...floorBase.map(
                    (height: number, index: number): ILinearFloor => ({
                      row: floorDerivatives.map(
                        (column: number[]): number => column[index]!,
                      ),
                      bound: floor - height,
                    }),
                  ),
                  ...coupled,
                ],
              )
            : undefined;
        const delta: number[] =
          step?.delta ?? boundedDelta(matrix, right, previous, intervals);
        quadratic = step?.observation;
        const stepIntervals: { minimum: number; maximum: number }[] = step
          ? bounds
          : intervals;
        let scale: number = 1;
        for (let index: number = 0; index < delta.length; index++) {
          // QP roundoff at an exact angular face is numerical zero. Do not let
          // a sub-picodegree outward remainder zero the common step fraction.
          if (
            index < paths.length &&
            Math.abs(delta[index]!) < 1e-10 &&
            ((previous[index]! <= stepIntervals[index]!.minimum + 1e-10 &&
              delta[index]! < 0) ||
              (previous[index]! >= stepIntervals[index]!.maximum - 1e-10 &&
                delta[index]! > 0))
          )
            delta[index] = 0;
          const value: number = delta[index]!;
          scale = Math.min(
            scale,
            (index < paths.length ? 12 : 0.25) /
              Math.max(index < paths.length ? 12 : 0.25, Math.abs(value)),
          );
          if (index < paths.length && value !== 0) {
            const interval: { minimum: number; maximum: number } =
              stepIntervals[index]!;
            scale = Math.min(
              scale,
              Math.max(
                0,
                (value > 0
                  ? interval.maximum - previous[index]!
                  : interval.minimum - previous[index]!) / value,
              ),
            );
          }
        }
        const before: number = feasible ? expressive(fixed) : physical(fixed);
        let accepted: boolean = false;
        for (let attempt: number = 0; attempt < 4; ++attempt) {
          const fraction: number = scale / 2 ** attempt;
          paths.forEach((_: Controls.DegreeChannel, index: number): void => {
            values[index] = Math.max(
              stepIntervals[index]!.minimum,
              Math.min(
                stepIntervals[index]!.maximum,
                previous[index]! + delta[index]! * fraction,
              ),
            );
          });
          root.translation = [...translation];
          axes.forEach((axis: number, index: number): void => {
            root.translation[axis] =
              root.translation[axis]! + delta[paths.length + index]! * fraction;
          });
          apply();
          const next: IState = state();
          if (
            feasible
              ? admitted(next) && expressive(next) < before
              : physical(next) < before
          ) {
            current = next;
            accepted = true;
            break;
          }
        }
        if (!accepted) {
          values.splice(0, values.length, ...previous);
          root.translation = translation;
          apply();
          current = state();
          reason = "bound-or-stagnated";
          break;
        }
      }

      // The final applied pose alone materializes rest and exterior public snapshots.
      const complete: Skeleton.IOutput = inspected ?? evaluate(pose);
      output = complete;
      current = state();
      const activeBounds: { path: Controls.DegreeChannel; value: number }[] =
        paths
          .filter((path: Controls.DegreeChannel): boolean => {
            const interval: { minimum: number; maximum: number } =
              Controls.bounds(path, pose);
            return (
              Math.abs(read(pose, path) - interval.minimum) < 1e-6 ||
              Math.abs(read(pose, path) - interval.maximum) < 1e-6
            );
          })
          .map(
            (
              path: Controls.DegreeChannel,
            ): { path: Controls.DegreeChannel; value: number } => ({
              path,
              value: read(pose, path),
            }),
          );
      const status: IResult["status"] = admitted(current)
        ? "admitted"
        : "unresolved";
      return {
        pose,
        root,
        output: complete,
        error: current.error,
        floorMinimum: current.minimum,
        iterations: count,
        status,
        reason: status === "admitted" ? "converged" : reason,
        supportError: current.supportError,
        softError: current.softError,
        activeBounds,
        ...(quadratic ? { quadratic } : {}),
      };
    }
    return Object.assign(
      (pose: IAutoMovieHumanPose, root: IRoot, request: IRequest): IResult =>
        run(pose, root, request, false),
      {
        inspect: (
          pose: IAutoMovieHumanPose,
          root: IRoot,
          request: IRequest,
        ): IResult => run(pose, root, request, true),
      },
    );
  }
}

/** One fixed linearization population, with a separate measured physical residual. */
interface IState {
  residual: number[];
  expressive: number[];
  minimum: number;
  supportError: number;
  softError: number;
  error: number;
}

/** One original full-foot height or clinical interval: row dot step >= bound. */
interface ILinearFloor {
  row: number[];
  bound: number;
}

/** One proposed direction and its independent local numerical certificate. */
interface IQuadraticStep {
  delta: number[];
  observation: AutoMovieHumanGrounding.IQuadratic;
}

/** Visit each required coordinate so sparse arrays cannot skip root or point admission. */
function finiteTuple(value: unknown, size: number): boolean {
  return (
    Array.isArray(value) &&
    value.length === size &&
    Array.from(
      { length: size },
      (_: unknown, index: number): number => index,
    ).every((index: number): boolean => Number.isFinite(value[index]))
  );
}

/**
 * Express the coupled least-squares quadratic through the existing public
 * Engine diagonal-PSD API. Auxiliary residual coordinates satisfy r=J*step;
 * their unit diagonal and base-residual linear term give exactly J'J and J'e,
 * while the original angular/root damping remains on the step coordinates.
 * Every original full-foot inequality and clinical interval is retained.
 * One cold portable WASM solve and at most8N existing Engine polishing steps
 * add no FK or outer update. Original-coordinate KKT1e-12 remains a numerical
 * certificate; it is not necessary for an inexact local descent direction.
 * A finite native Solved proposal still passes the unchanged actual nonlinear
 * merit, complete floor and clinical checks. Incomplete native status supplies
 * no direction. Exact nonlinear full-cloud trials remain the admission authority. Auxiliary rows require
 * O(NF+NT) storage for F source vertices and T target coordinates; each native
 * call owns its state and the Engine releases its borrowed WASM workspace.
 */
function floorDelta(
  derivatives: number[][],
  base: number[],
  damping: number[],
  preference: number[],
  values: readonly number[],
  bounds: readonly { minimum: number; maximum: number }[],
  floors: ILinearFloor[],
): IQuadraticStep {
  const n: number = derivatives.length;
  const rows: IAutoMovieQuadraticRow[] = floors.map(
    (floor: ILinearFloor): IAutoMovieQuadraticRow => ({
      indices: floor.row.map((_: number, index: number): number => index),
      weights: floor.row,
      lower: floor.bound,
      upper: null,
    }),
  );
  for (let index: number = 0; index < values.length; index++)
    rows.push({
      indices: [index],
      weights: [1],
      lower: bounds[index]!.minimum - values[index]!,
      upper: bounds[index]!.maximum - values[index]!,
    });
  for (let index: number = 0; index < base.length; index++)
    rows.push({
      indices: [
        ...derivatives.map((_: number[], column: number): number => column),
        n + index,
      ],
      weights: [
        ...derivatives.map((column: number[]): number => column[index]!),
        -1,
      ],
      lower: 0,
      upper: 0,
    });
  const problem: Parameters<typeof solveAutoMovieQuadraticProgram>[0] = {
    diagonal: [...damping, ...base.map((): number => 1)],
    linear: [...preference.map((value: number): number => -value), ...base],
    rows,
  };
  const native: ReturnType<typeof solveAutoMovieQuadraticProgram> =
    solveAutoMovieQuadraticProgram(problem);
  const result: ReturnType<typeof refineAutoMovieQuadraticProgram> | undefined =
    native.status === 1
      ? refineAutoMovieQuadraticProgram(problem, native, {
          tolerance: 1e-12,
          maximumRefinements: 8 * n,
        })
      : undefined;
  const certified: boolean =
    !!result &&
    result.maximumViolation <= 1e-12 &&
    result.stationarityResidual <= 1e-12 &&
    result.complementarityResidual <= 1e-12;
  const proposed: number[] = (certified ? result!.primal : native.primal).slice(
    0,
    n,
  );
  const usable: boolean =
    native.status === 1 &&
    proposed.length === n &&
    proposed.every(Number.isFinite);
  return {
    delta: usable ? proposed : derivatives.map((): number => 0),
    observation: {
      nativeStatus: native.status,
      nativeIterations: native.iterations,
      maximumViolation: result?.maximumViolation ?? native.maximumViolation,
      stationarityResidual:
        result?.stationarityResidual ?? native.stationarityResidual,
      ...(result
        ? { complementarityResidual: result.complementarityResidual }
        : {}),
      certified,
      refinements: result?.refinements ?? 0,
      direction: usable ? (certified ? "certified" : "inexact") : "none",
    },
  };
}

/**
 * Solve the same damped system on its feasible active-bound face. At most N
 * algebraic reductions fix outward angular coordinates; no extra FK or update
 * is acquired. Root translation columns have no angular interval. The caller
 * then limits every remaining component with one common fraction, preserving
 * the coupled direction rather than separately clipping its coordinates.
 */
function boundedDelta(
  matrix: number[][],
  right: number[],
  values: readonly number[],
  bounds: readonly { minimum: number; maximum: number }[],
): number[] {
  const fixed: Set<number> = new Set();
  let delta: number[] = linear(matrix, right);
  for (let pass: number = 0; pass < values.length; pass++) {
    const blocked: number[] = values.flatMap(
      (value: number, index: number): number[] =>
        !fixed.has(index) &&
        ((value <= bounds[index]!.minimum + 1e-10 && delta[index]! < 0) ||
          (value >= bounds[index]!.maximum - 1e-10 && delta[index]! > 0))
          ? [index]
          : [],
    );
    if (!blocked.length) break;
    for (const index of blocked) fixed.add(index);
    const reduced: number[][] = matrix.map(
      (row: number[], i: number): number[] =>
        row.map((value: number, j: number): number =>
          fixed.has(i) || fixed.has(j) ? (i === j ? 1 : 0) : value,
        ),
    );
    delta = linear(
      reduced,
      right.map((value: number, index: number): number =>
        fixed.has(index) ? 0 : value,
      ),
    );
  }
  return delta;
}
/** Transform an exact bone-relative witness with its corresponding full FK and root. */
function world(
  placements: Map<string, Skeleton.IPlacement>,
  root: AutoMovieHumanGrounding.IRoot,
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
/** Read only a caller-selected canonical angular leaf. */
function read(pose: IAutoMovieHumanPose, path: string): number {
  let node: unknown = pose;
  for (const part of path.split(".")) {
    if (typeof node !== "object" || node === null) return 0;
    node = Reflect.get(node, part);
  }
  return typeof node === "number" ? node : 0;
}
/** Write selected public controls while retaining the bilateral region contract. */
function write(pose: IAutoMovieHumanPose, path: string, value: number): void {
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
/** Pivoted elimination of a damped small clinical/root normal system. */
function linear(matrix: number[][], right: number[]): number[] {
  const n: number = right.length;
  const rows: number[][] = matrix.map((row: number[], i: number): number[] => [
    ...row,
    right[i]!,
  ]);
  for (let column: number = 0; column < n; ++column) {
    let pivot: number = column;
    for (let row: number = column + 1; row < n; ++row)
      if (Math.abs(rows[row]![column]!) > Math.abs(rows[pivot]![column]!))
        pivot = row;
    [rows[column], rows[pivot]] = [rows[pivot]!, rows[column]!];
    const divisor: number = rows[column]![column]!;
    if (Math.abs(divisor) < 1e-18) return right.map((): number => 0);
    for (let k: number = column; k <= n; ++k)
      rows[column]![k] = rows[column]![k]! / divisor;
    for (let row: number = 0; row < n; ++row) {
      if (row === column) continue;
      const factor: number = rows[row]![column]!;
      for (let k: number = column; k <= n; ++k)
        rows[row]![k] = rows[row]![k]! - factor * rows[column]![k]!;
    }
  }
  return rows.map((row: number[]): number => row[n]!);
}
