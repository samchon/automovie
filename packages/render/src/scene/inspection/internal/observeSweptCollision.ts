import { AutoMovieEngineValidation } from "@automovie/engine";
import type {
  IAutoMovieSceneCollision as Collision,
  IAutoMovieInspectionDiagnostics as Diagnostic,
  IAutoMovieSweptCapsuleCollision as Sweep,
} from "@automovie/interface";

import { createCollisionFinding } from "./createCollisionFinding";

/*
 * Check a layer's source-certified motion cells between placed frames.
 *
 * Each cell takes its allowed depth from the layer's whole-part named windows
 * active over the entire closed cell; a window that starts or ends inside the
 * cell defers it, and pairs inside one managed group are excluded. Without
 * certified cells, every deformable body and the layer as a whole disclose
 * their motion between frames as unverified, without holding a required layer
 * back.
 * Parameter props: The layer's cells, windows, parts, clocks, budget and report
 * sinks.
 */
export function observeSweptCollision(
  props: observeSweptCollision.IProps,
): void {
  const { sweeps, allowances, groups, budget, key, report, findings } = props;
  if (sweeps === undefined) {
    // Disclosure of motion no source certified, not an obligation the layer
    // declared, so it never holds a required layer back.
    report(key("sweeps"), "unsupported", "no-certified-motion-cells", false, {
      basis: "swept",
    });
    for (const group of new Set(
      [...groups.values()]
        .filter(
          (group: Collision.IGroup): boolean =>
            group.kind === "deformable-body",
        )
        .map((group: Collision.IGroup): string => group.id),
    ))
      report(
        key("sweeps", group),
        "unsupported",
        "uncertified-cord-motion",
        false,
        { basis: "swept" },
      );
    return;
  }
  const cells: Set<string> = new Set();
  for (const interval of sweeps) {
    const paths: [string, string] =
      interval.paths[0] < interval.paths[1]
        ? [interval.paths[0], interval.paths[1]]
        : [interval.paths[1], interval.paths[0]];
    const { startSeconds, endSeconds } = interval.props;
    if (!paths[0].trim() || paths[0] === paths[1])
      throw new Error("Invalid collision motion pair");
    const identity: string = key("sweep", ...paths, String(startSeconds));
    if (cells.has(identity)) throw new Error("Repeated collision motion cell");
    cells.add(identity);
    const location = { paths, basis: "swept" as const };
    const group: Collision.IGroup | undefined = groups.get(paths[0]);
    const other: Collision.IGroup | undefined = groups.get(paths[1]);
    if (
      group !== undefined &&
      other !== undefined &&
      group.id === other.id &&
      group.kind === other.kind
    ) {
      report(identity, "excluded", group.kind, undefined, location);
      continue;
    }
    const allowance: number | "split" = cellAllowance(
      allowances,
      paths,
      startSeconds,
      endSeconds,
    );
    if (allowance === "split") {
      report(
        identity,
        "deferred",
        "allowance-boundary-inside-cell",
        undefined,
        location,
      );
      continue;
    }
    const sweep: Sweep.IResult =
      AutoMovieEngineValidation.measureSweptCapsuleCollision({
        ...interval.props,
        maxPenetration: allowance,
        maxIntervals: Math.min(interval.props.maxIntervals, budget.sweptCells),
      });
    budget.sweptCells -= sweep.compared;
    if (sweep.status === "deferred") {
      report(identity, "deferred", sweep.reason, undefined, location);
      continue;
    }
    const proxy: boolean =
      sweep.status === "proxy" ||
      (sweep.status === "clear" && sweep.basis === "proxy");
    report(
      identity,
      proxy ? "deferred" : "checked",
      "proxy-motion-only",
      undefined,
      location,
    );
    if (sweep.status === "clear") continue;
    findings.push(
      createCollisionFinding(
        identity,
        paths,
        "sweep",
        !proxy,
        sweep.separation,
        allowance,
        sweep.point,
        {
          time: {
            filmSeconds: sweep.seconds + interval.filmOffset,
            ...(props.shotPath === undefined
              ? {}
              : { shot: { path: props.shotPath, seconds: sweep.seconds } }),
          },
          interval: {
            from: sweep.startSeconds + interval.filmOffset,
            to: sweep.endSeconds + interval.filmOffset,
          },
        },
      ),
    );
  }
}

/*
 * The motion cells of one layer and the sinks the observer shares with them.
 */
export namespace observeSweptCollision {
  /*
   * A source-certified motion cell between two named parts.
   */
  export interface ICell {
    /*
     * The two part paths.
     */
    readonly paths: readonly [string, string];
    /*
     * The Engine cell, without the depth the layer's windows decide.
     */
    readonly props: Omit<Sweep.IProps, "maxPenetration">;
    /*
     * Film seconds minus layer seconds.
     */
    readonly filmOffset: number;
  }

  /*
   * The cells, windows, groups, budget and report sinks of one layer.
   */
  export interface IProps {
    /*
     * Certified cells, or undefined when the source supplies none.
     */
    readonly sweeps: readonly ICell[] | undefined;
    /*
     * The layer's named windows.
     */
    readonly allowances: readonly Collision.IAllowance[];
    /*
     * The managed group of each collected part.
     */
    readonly groups: ReadonlyMap<string, Collision.IGroup>;
    /*
     * Interval work the frame may still spend.
     */
    readonly budget: { sweptCells: number };
    /*
     * The layer's coverage key builder.
     */
    readonly key: (...parts: string[]) => string;
    /*
     * The layer's coverage sink; `required` overrides the layer's requirement.
     */
    readonly report: (
      identity: string,
      status: Diagnostic.ICoverage["status"],
      reason: string,
      required?: boolean,
      location?: Pick<Diagnostic.ICoverage, "paths" | "basis">,
    ) => void;
    /*
     * The frame's finding sink.
     */
    readonly findings: Diagnostic.IFinding[];
    /*
     * The layer's shot path, when known.
     */
    readonly shotPath?: string;
  }
}

/*
 * The tightest whole-part named allowance active over a whole closed motion
 * cell, zero when none names the pair, or "split" when a window starts or ends
 * inside it. Joint-scoped windows cannot attribute a capsule cell.
 */
function cellAllowance(
  allowances: readonly Collision.IAllowance[],
  [first, second]: readonly [string, string],
  start: number,
  end: number,
): number | "split" {
  let limit: number | null = null;
  for (const entry of allowances) {
    if (
      !(
        (entry.first === first && entry.second === second) ||
        (entry.first === second && entry.second === first)
      ) ||
      entry.firstJoints !== undefined ||
      entry.secondJoints !== undefined
    )
      continue;
    if (entry.endSeconds <= start || entry.startSeconds > end) continue;
    if (entry.startSeconds > start || entry.endSeconds <= end) return "split";
    limit =
      limit === null
        ? entry.maxPenetration
        : Math.min(limit, entry.maxPenetration);
  }
  return limit ?? 0;
}
