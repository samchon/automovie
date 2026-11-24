import { solveTwoBoneIK } from "@automovie/engine";
import type {
  IAutoMovieTwoBoneIK,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieArchetypeUnits } from "../core";
import { solveQuadrupedSupportPlane } from "./solveQuadrupedSupportPlane";

/**
 * A four-bar quadruped limb solved from its neutral controls. The upper bar and
 * its folded lower carriage form one exact triangle; an oriented terminal goal
 * fixes the fourth bar and solves the proximal three.
 *
 * Public only so the package's specs can reach it: it is not part of the
 * authoring surface, and it moves to an internal subpath when one exists.
 */
export namespace AutoMovieArchetypeQuadrupedLimb {
  /**
   * Root-to-target distance admitted by one folded carriage, metres: the
   * terminal for point-only solves, or target(endpoint) for oriented solves.
   */
  export interface IRange {
    /** Inner triangle tangency, metres; zero itself cannot orient the solve. */
    minimum: number;
    /** Outer triangle tangency, metres. */
    maximum: number;
  }

  /** A chain prepared from five neutral model-space controls. */
  export interface IPrepared {
    /**
     * Read the distance band at a relative carpus/hock fold, degrees.
     *
     * @param fold Relative fold from the neutral carriage; fore rotates
     *   negatively, hind positively.
     * @returns Fresh minimum/maximum root-to-terminal distances in metres.
     * @throws {RangeError} For a nonfinite fold, a collapsed lower carriage or
     *   an unrepresentable distance band.
     */
    range: (fold: number) => IRange;

    /**
     * Solve five model-space controls with supplied root and goal unchanged.
     *
     * @param root Current attachment in the source sagittal plane, metres.
     * @param goal Exact terminal endpoint in that plane, metres.
     * @param fold Relative carpus/hock fold in degrees, with range's fore/hind
     *   convention.
     * @returns Five fresh points; the first and last copy root and goal
     *   exactly.
     * @throws {RangeError} For malformed coordinates, nonplanarity beyond
     *   construction roundoff, zero distance, unreachable geometry or
     *   unrepresentable positive bars.
     */
    solve: (
      root: IAutoMovieVector3,
      goal: IAutoMovieVector3,
      fold: number,
    ) => IAutoMovieVector3[];

    /**
     * Bind an explicit terminal-bar direction, normalized once in model space.
     *
     * @param direction Finite nonzero direction of the last bar, ankle to
     *   terminal.
     * @param supportPlane When true, the planted endpoint may determine a
     *   tilted limb plane while the proximal attachment stays fixed.
     * @returns A reader whose target/band constrain the proximal three bars.
     * @throws {RangeError} For a zero, nonfinite or unrepresentable axis, or a
     *   lateral axis under the default sagittal contract.
     */
    oriented: (
      direction: IAutoMovieVector3,
      supportPlane?: boolean,
    ) => IOriented;
  }

  /** A terminal position/direction effector using the final bar length. */
  export interface IOriented {
    /**
     * Read the proximal-three root-to-ankle band at a relative fold, degrees. A
     * nonfinite fold or degenerate/unrepresentable carriage throws RangeError.
     */
    range: (fold: number) => IRange;

    /**
     * Convert a terminal endpoint to its ankle target, metres in model space.
     * Nonfinite/nonplanar points or an unrepresentable result throw
     * RangeError.
     */
    target: (endpoint: IAutoMovieVector3) => IAutoMovieVector3;

    /** Solve the proximal three bars and the declared terminal position/axis. */
    solve: (
      root: IAutoMovieVector3,
      endpoint: IAutoMovieVector3,
      fold: number,
    ) => IAutoMovieVector3[];
  }

  /** Fold-dependent lower-carriage vector in the second bar's neutral frame. */
  interface IPiece extends IRange {
    /** Third-bar angle relative to the second, radians. */
    bend: number;
    /** Resultant lower-carriage length, metres. */
    lower: number;
    /** Resultant angle from the second bar, radians. */
    offset: number;
  }

  /**
   * Snapshot four lengths and neutral relative angles.
   *
   * @param source Five finite neutral controls, root to terminal, metres.
   * @param fore True for a fore elbow's rear branch and negative relative fold;
   *   false for a hind stifle's front branch and positive fold.
   * @returns A source-independent prepared chain for support planning and
   *   playback.
   * @throws {RangeError} For a malformed/sparse source, nonpositive lengths,
   *   nonplanarity beyond numerical roundoff or a degenerate neutral lower
   *   carriage.
   */
  export function prepare(
    source: readonly IAutoMovieVector3[],
    fore: boolean,
  ): IPrepared {
    if (source.length !== 5)
      throw new RangeError(
        "A quadruped limb requires five actual controls and a fore/hind branch",
      );
    for (let index: number = 0; index < 5; index++)
      if (!finite(source[index]))
        throw new RangeError("Every quadruped neutral control must be finite");

    const lengths: readonly number[] = source
      .slice(1)
      .map((point: IAutoMovieVector3, index: number): number =>
        Math.hypot(
          point.x - source[index]!.x,
          point.y - source[index]!.y,
          point.z - source[index]!.z,
        ),
      );
    if (lengths.some((length: number): boolean => !(length > 0)))
      throw new RangeError(
        "A quadruped limb requires four positive finite actual lengths",
      );

    const plane: number = source[0]!.x;
    const sourceScale: number = Math.max(
      ...lengths,
      ...source.flatMap((point: IAutoMovieVector3): number[] => [
        Math.abs(point.x),
        Math.abs(point.y),
        Math.abs(point.z),
      ]),
    );
    const roundoff: number = 64 * Number.EPSILON * sourceScale;
    if (
      source.some(
        (point: IAutoMovieVector3): boolean =>
          Math.abs(point.x - plane) > roundoff,
      )
    )
      throw new RangeError(
        "Actual quadruped controls must share a sagittal plane",
      );

    const a: number = lengths[0]!;
    const b: number = lengths[1]!;
    const c: number = lengths[2]!;
    const d: number = lengths[3]!;
    const angles: readonly number[] = source
      .slice(1)
      .map((point: IAutoMovieVector3, index: number): number =>
        Math.atan2(point.z - source[index]!.z, source[index]!.y - point.y),
      );
    const neutralBend: number = angles[2]! - angles[1]!;
    const slope: number = angles[3]! - angles[2]!;
    const branch: -1 | 1 = fore ? -1 : 1;

    /**
     * Preserve neutral relative fold; an oriented terminal is removed from the
     * lower resultant.
     */
    function piece(fold: number, oriented: boolean): IPiece {
      const bend: number =
        neutralBend + branch * fold * AutoMovieArchetypeUnits.DEGREE;
      const terminal: number = oriented ? 0 : d;
      const z: number = c * Math.sin(bend) + terminal * Math.sin(bend + slope);
      const y: number =
        -b - c * Math.cos(bend) - terminal * Math.cos(bend + slope);
      const lower: number = Math.hypot(z, y);
      const minimum: number = Math.abs(a - lower);
      const maximum: number = a + lower;
      if (!(lower > 0 && maximum > minimum))
        throw new RangeError(
          "The folded quadruped carriage has no representable positive triangle band",
        );
      return { bend, lower, offset: Math.atan2(z, -y), minimum, maximum };
    }

    /** Accept binary64 sagittal noise without projecting an input point. */
    function admit(point: IAutoMovieVector3): void {
      if (!finite(point))
        throw new RangeError(
          "Quadruped goals must be finite model-space points",
        );
      const scale: number = Math.max(
        sourceScale,
        Math.abs(point.x),
        Math.abs(point.y),
        Math.abs(point.z),
      );
      if (Math.abs(point.x - plane) > 64 * Number.EPSILON * scale)
        throw new RangeError(
          "Quadruped goals must remain in the actual sagittal plane",
        );
    }

    /**
     * One strict triangle owner fits either the terminal or the oriented ankle
     * target.
     */
    function fit(
      root: IAutoMovieVector3,
      goal: IAutoMovieVector3,
      fold: number,
      oriented: boolean,
      supportPlane: boolean = false,
    ): IAutoMovieVector3[] {
      admit(root);
      if (!finite(goal))
        throw new RangeError(
          "Quadruped goals must be finite model-space points",
        );
      if (supportPlane && goal.x !== root.x)
        return solveQuadrupedSupportPlane(
          root,
          goal,
          (planar: IAutoMovieVector3): IAutoMovieVector3[] =>
            fit(root, planar, fold, oriented),
        );
      admit(goal);
      const lower: IPiece = piece(fold, oriented);
      const dy: number = goal.y - root.y;
      const dz: number = goal.z - root.z;
      const distance: number = Math.hypot(dy, dz);
      if (
        !(
          distance > 0 &&
          distance >= lower.minimum &&
          distance <= lower.maximum
        )
      )
        throw new RangeError(
          `Quadruped reach ${distance} m is outside [${lower.minimum}, ${lower.maximum}] m or has no direction at fold ${fold} degrees`,
        );
      let triangle: IAutoMovieTwoBoneIK;
      try {
        triangle = solveTwoBoneIK(a, lower.lower, distance);
      } catch (error) {
        throw new RangeError(
          error instanceof Error
            ? error.message
            : "The admitted quadruped triangle is unrepresentable",
        );
      }
      if (triangle.clamped)
        throw new RangeError(
          "A clamped or unrepresentable quadruped triangle cannot satisfy its goal",
        );
      const upper: number =
        Math.atan2(dz, -dy) +
        branch * triangle.lift * AutoMovieArchetypeUnits.DEGREE;
      const elbow: IAutoMovieVector3 = {
        x: root.x,
        y: root.y - a * Math.cos(upper),
        z: root.z + a * Math.sin(upper),
      };
      const lowerDistance: number = Math.hypot(
        goal.y - elbow.y,
        goal.z - elbow.z,
      );
      if (!(lowerDistance > 0))
        throw new RangeError(
          "The solved quadruped lower carriage has no representable direction",
        );
      const middle: number =
        Math.atan2(goal.z - elbow.z, elbow.y - goal.y) - lower.offset;
      const wrist: IAutoMovieVector3 = {
        x: root.x,
        y: elbow.y - b * Math.cos(middle),
        z: elbow.z + b * Math.sin(middle),
      };
      const ankle: IAutoMovieVector3 = oriented
        ? { ...goal }
        : {
            x: root.x,
            y: wrist.y - c * Math.cos(middle + lower.bend),
            z: wrist.z + c * Math.sin(middle + lower.bend),
          };
      return [{ ...root }, elbow, wrist, ankle];
    }

    /**
     * Refuse a solved representation that cannot retain the four positive
     * lengths.
     */
    function checked(solved: IAutoMovieVector3[]): IAutoMovieVector3[] {
      if (solved.some((point: IAutoMovieVector3): boolean => !finite(point)))
        throw new RangeError(
          "The quadruped solution has unrepresentable coordinates",
        );
      for (let index: number = 0; index < 4; index++) {
        const length: number = Math.hypot(
          solved[index + 1]!.x - solved[index]!.x,
          solved[index + 1]!.y - solved[index]!.y,
          solved[index + 1]!.z - solved[index]!.z,
        );
        if (
          !(
            length > 0 &&
            Math.abs(length - lengths[index]!) <=
              64 * Number.EPSILON * Math.max(length, lengths[index]!)
          )
        )
          throw new RangeError(
            "The quadruped solution cannot represent all four actual lengths",
          );
      }
      return solved;
    }

    piece(0, false);
    return {
      range: (fold: number): IRange => {
        const lower: IPiece = piece(fold, false);
        return { minimum: lower.minimum, maximum: lower.maximum };
      },
      solve: (
        root: IAutoMovieVector3,
        goal: IAutoMovieVector3,
        fold: number,
      ): IAutoMovieVector3[] =>
        checked([...fit(root, goal, fold, false), { ...goal }]),
      oriented: (
        direction: IAutoMovieVector3,
        supportPlane: boolean = false,
      ): IOriented => {
        if (!finite(direction))
          throw new RangeError("A terminal direction must be finite");
        const magnitude: number = Math.hypot(
          direction.x,
          direction.y,
          direction.z,
        );
        if (!(magnitude > 0))
          throw new RangeError(
            "A terminal direction must have representable positive magnitude",
          );
        const axis: IAutoMovieVector3 = {
          x: direction.x / magnitude,
          y: direction.y / magnitude,
          z: direction.z / magnitude,
        };
        if (!supportPlane && Math.abs(axis.x) > 64 * Number.EPSILON)
          throw new RangeError(
            "The terminal direction must remain in the actual sagittal plane",
          );
        const terminal: IAutoMovieVector3 = {
          x: d * axis.x,
          y: d * axis.y,
          z: d * axis.z,
        };

        /**
         * Move from the exact terminal endpoint to the constrained proximal
         * target.
         */
        function target(endpoint: IAutoMovieVector3): IAutoMovieVector3 {
          if (!finite(endpoint))
            throw new RangeError("The terminal endpoint must be finite");
          if (!supportPlane) admit(endpoint);
          const goal: IAutoMovieVector3 = {
            x: endpoint.x - terminal.x,
            y: endpoint.y - terminal.y,
            z: endpoint.z - terminal.z,
          };
          if (!finite(goal))
            throw new RangeError("The terminal target must be representable");
          if (!supportPlane) admit(goal);
          return goal;
        }
        return {
          range: (fold: number): IRange => {
            const lower: IPiece = piece(fold, true);
            return { minimum: lower.minimum, maximum: lower.maximum };
          },
          target,
          solve: (
            root: IAutoMovieVector3,
            endpoint: IAutoMovieVector3,
            fold: number,
          ): IAutoMovieVector3[] =>
            checked([
              ...fit(root, target(endpoint), fold, true, supportPlane),
              { ...endpoint },
            ]),
        };
      },
    };
  }

  /** Admit finite coordinates without dereferencing a missing/sparse control. */
  function finite(point: IAutoMovieVector3 | null | undefined): boolean {
    return point !== null && point !== undefined;
  }
}
