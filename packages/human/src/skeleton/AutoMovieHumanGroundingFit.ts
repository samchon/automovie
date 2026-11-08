import { AutoMovieHumanStateAdmission } from "../instance/AutoMovieHumanStateAdmission";
import type { IAutoMovieHumanPose } from "../structures/pose/IAutoMovieHumanPose";
import type { AutoMovieHumanClinicalIk as Ik } from "./AutoMovieHumanClinicalIk";
import type { AutoMovieHumanGrounding as Grounding } from "./AutoMovieHumanGrounding";
import { AutoMovieHumanGroundingQuadratic as Quadratic } from "./AutoMovieHumanGroundingQuadratic";
import { AutoMovieHumanGroundingState as State } from "./AutoMovieHumanGroundingState";
import { AutoMovieHumanRigControls as Controls } from "./AutoMovieHumanRigControls";
import type { AutoMovieHumanSkeleton as Skeleton } from "./AutoMovieHumanSkeleton";
import type { AutoMovieHumanSkeletonMath as M } from "./AutoMovieHumanSkeletonMath";

/** One request owns validation, local probes, shared-fraction line search and final nonlinear admission. */
export namespace AutoMovieHumanGroundingFit {
  /** Preserve the original run sequence over the prepared body's copied point groups. */
  export function run(
    evaluate: Skeleton.PoseEvaluator,
    groups: Map<Controls.Joint, M.Vector[]>,
    seed: IAutoMovieHumanPose,
    initial: Grounding.IRoot,
    request: Grounding.IRequest,
    inspect: boolean,
  ): Grounding.IResult {
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
      !State.finiteTuple(initial?.translation, 3) ||
      !State.finiteTuple(initial?.rotation, 4) ||
      Math.abs(Math.hypot(...initial.rotation) - 1) > 1e-6 ||
      [...request.targets, ...soft].some(
        (target: Ik.ITarget): boolean =>
          target === null ||
          typeof target !== "object" ||
          !Controls.isJoint(target.bone) ||
          !State.finiteTuple(target.position, 3) ||
          (target.localPoint !== undefined &&
            !State.finiteTuple(target.localPoint, 3)),
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
    const root: Grounding.IRoot = structuredClone(initial);
    const values: number[] = paths.map(
      (path: Controls.DegreeChannel, index: number): number =>
        Math.max(
          bounds[index]!.minimum,
          Math.min(bounds[index]!.maximum, State.read(pose, path)),
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
    const workspace: State.IWorkspace = State.prepare({
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
    });

    let count: number = 0;
    let quadratic: Grounding.IQuadratic | undefined;
    let reason: Grounding.IResult["reason"] = inspect
      ? "constraints-violated"
      : "budget-exhausted";
    const inspected: Skeleton.IOutput | undefined = inspect
      ? evaluate(pose)
      : undefined;
    workspace.output = inspected ?? workspace.apply();
    let current: State.IState = workspace.state();
    for (; !inspect && count < limit; ++count) {
      const fixed: State.IState = current;
      const feasible: boolean = workspace.admitted(fixed);
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
      const originalOutput: Skeleton.IProjection = workspace.output;
      const base: number[] = [
        ...fixed.residual,
        ...(feasible ? fixed.expressive : []),
      ];
      const intervals: { minimum: number; maximum: number }[] = paths.map(
        (path: Controls.DegreeChannel): { minimum: number; maximum: number } =>
          Controls.bounds(path, pose),
      );
      const derivatives: number[][] = [];
      const floorBase: number[] = eliminateY ? workspace.heights() : [];
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
          if (!eliminateY) derivative.splice(request.targets.length * 3, 0, 0);
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
        workspace.apply(false);
        const moved: State.IState = workspace.state();
        const applied: number = values[column]! - previous[column]!;
        derivatives.push(
          [...moved.residual, ...(feasible ? moved.expressive : [])].map(
            (value: number, index: number): number =>
              Math.abs(applied) < 1e-10 ? 0 : (value - base[index]!) / applied,
          ),
        );
        floorDerivatives.push(
          eliminateY
            ? workspace
                .heights()
                .map((value: number, index: number): number =>
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
        State.write(pose, path, previous[index]!),
      );
      workspace.output = originalOutput;
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
      const coupled: Quadratic.ILinearFloor[] = paths.flatMap(
        (
          _: Controls.DegreeChannel,
          index: number,
        ): Quadratic.ILinearFloor[] => [
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
      const step: Quadratic.IQuadraticStep | undefined =
        eliminateY || dependent
          ? Quadratic.floorDelta(
              derivatives,
              base,
              damping,
              preference,
              previous,
              bounds,
              [
                ...floorBase.map(
                  (height: number, index: number): Quadratic.ILinearFloor => ({
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
        step?.delta ??
        Quadratic.boundedDelta(matrix, right, previous, intervals);
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
      const before: number = feasible
        ? workspace.expressive(fixed)
        : workspace.physical(fixed);
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
        workspace.apply();
        const next: State.IState = workspace.state();
        if (
          feasible
            ? workspace.admitted(next) && workspace.expressive(next) < before
            : workspace.physical(next) < before
        ) {
          current = next;
          accepted = true;
          break;
        }
      }
      if (!accepted) {
        values.splice(0, values.length, ...previous);
        root.translation = translation;
        workspace.apply();
        current = workspace.state();
        reason = "bound-or-stagnated";
        break;
      }
    }

    // The final applied pose alone materializes rest and exterior public snapshots.
    const complete: Skeleton.IOutput = inspected ?? evaluate(pose);
    workspace.output = complete;
    current = workspace.state();
    const activeBounds: { path: Controls.DegreeChannel; value: number }[] =
      paths
        .filter((path: Controls.DegreeChannel): boolean => {
          const interval: { minimum: number; maximum: number } =
            Controls.bounds(path, pose);
          return (
            Math.abs(State.read(pose, path) - interval.minimum) < 1e-6 ||
            Math.abs(State.read(pose, path) - interval.maximum) < 1e-6
          );
        })
        .map(
          (
            path: Controls.DegreeChannel,
          ): { path: Controls.DegreeChannel; value: number } => ({
            path,
            value: State.read(pose, path),
          }),
        );
    const status: Grounding.IResult["status"] = workspace.admitted(current)
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
}
