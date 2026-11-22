import { solveTwoBoneIK } from "@automovie/engine";
import type {
  IAutoMovieTwoBoneIK,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieArchetypeUnits } from "../core";
import { solveQuadrupedSupportPlane } from "./solveQuadrupedSupportPlane";

/**
 * A four-bar quadruped limb solved from its neutral controls.
 * The upper bar and its folded lower carriage form one exact triangle; an
 * oriented terminal goal fixes the fourth bar and solves the proximal three.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the source controls, the two-piece triangle, degrees/metres and fixed root/terminal goals; unreachable requests refuse instead of changing the support.
 * @evidence contracts/development/design.md#principled-representation Four control-bar lengths and the lower carriage's neutral relative angles define each solve independently of species proportions or a gait's follow coefficient.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One prepared chain exposes its geometric distance band and exact-root solve to the shared ride; the ride owns support planning and the rest-pose solver keeps its different distal-carriage contract.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No species branches, surrogate standing-angle table, moving attachment, stretched bone or projected terminal goal substitutes for the chain.
 */
export namespace AutoMovieArchetypeQuadrupedLimb {
  /**
   * Root-to-target distance admitted by one folded carriage, metres: the
   * terminal for point-only solves, or target(endpoint) for oriented solves.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Both bounds are metres, mathematical tangencies are included, and a zero root-to-goal distance remains orientation-degenerate even when the lower bound is zero.
   * @evidence contracts/development/design.md#principled-representation The interval is [abs(a-lower), a+lower], where a is the first length and lower the folded sum of the last three bars for a point goal, or second/third bars for an oriented terminal goal.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The support planner consumes the same bounds that solve admits; no separate anatomical or tuned range can drift from this geometry.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No clinical ROM, biological reach fraction, speed-specific margin or hidden tolerance changes either bound.
   */
  export interface IRange {
    /** Inner triangle tangency, metres; zero itself cannot orient the solve. */
    minimum: number;
    /** Outer triangle tangency, metres. */
    maximum: number;
  }

  /**
   * A chain prepared from five neutral model-space controls.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the neutral snapshot, model-space fixed root/goal, relative fold in degrees and five independently owned solved points.
   * @evidence contracts/development/design.md#principled-representation A prepared geometric chain retains four scalar lengths, lower relative angles, its sagittal plane and its fore/hind branch; every call returns fresh results.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Point-only range/solve and a declared terminal-direction binding serve the ride's support planner; callers cannot mutate prepared lengths or controls.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts There is no global cache, species dispatch, aliased source array, inferred clinical constraint or mutable per-frame continuation state.
   */
  export interface IPrepared {
    /**
     * Read the distance band at a relative carpus/hock fold, degrees.
     *
     * @param fold Relative fold from the neutral carriage; fore rotates negatively, hind positively.
     * @returns Fresh minimum/maximum root-to-terminal distances in metres.
     * @throws {RangeError} For a nonfinite fold, a collapsed lower carriage or an unrepresentable distance band.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Gives fold convention, SI bounds and numerical-degeneracy refusals without asserting anatomical limits.
     * @evidence contracts/development/implementation.md#principled-implementation Sum the three lower vectors with their neutral relative angles plus the declared signed fold, then return abs(a-lower) and a+lower.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One lower-piece calculation returns the two scalar triangle bounds.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No goal-dependent projection, source replacement, empirical reach multiplier or biological coefficient affects the result.
     * @evidence contracts/development/implementation.md#efficient-algorithms Three trigonometric vector terms and fixed scalar arithmetic take constant work.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the same prepared lengths and lower-piece calculation as solve, so support planning and admission agree.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one fresh two-number record and retains no call results or external resources.
     */
    range: (fold: number) => IRange;

    /**
     * Solve five model-space controls with supplied root and goal unchanged.
     *
     * @param root Current attachment in the source sagittal plane, metres.
     * @param goal Exact terminal endpoint in that plane, metres.
     * @param fold Relative carpus/hock fold in degrees, with range's fore/hind convention.
     * @returns Five fresh points; the first and last copy root and goal exactly.
     * @throws {RangeError} For malformed coordinates, nonplanarity beyond construction roundoff, zero distance, unreachable geometry or unrepresentable positive bars.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States frame, metres/degrees, exact endpoint copies, four preserved lengths and explicit unsupported-geometry refusals.
     * @evidence contracts/development/implementation.md#principled-implementation Admit raw reach before calling the engine's solveTwoBoneIK, reject any clamped result and rotate the unchanged lower carriage onto its solved fore/hind branch.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit finite plane and reach, solve the upper triangle, recover the lower orientation and emit all five controls.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Root and goal never move and raw distance is never clamped. Only an admitted triangle's cosine is bounded to [-1,1]; a scale-derived plane admission accepts roundoff without projecting inputs.
     * @evidence contracts/development/implementation.md#efficient-algorithms Constant scalar/trigonometric work, five fresh output points and four representability checks; no iteration, search or runtime physical simulation.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses prepared lengths/angles and the same band as range; one triangle direction resolves every lower joint.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Every point belongs to the caller; mutation and out-of-order calls cannot change the prepared fixed scalar state.
     */
    solve: (
      root: IAutoMovieVector3,
      goal: IAutoMovieVector3,
      fold: number,
    ) => IAutoMovieVector3[];

    /**
     * Bind an explicit terminal-bar direction, normalized once in model space.
     *
     * @param direction Finite nonzero direction of the last bar, ankle to terminal.
     * @param supportPlane When true, the planted endpoint may determine a tilted limb plane while the proximal attachment stays fixed.
     * @returns A reader whose target/band constrain the proximal three bars.
     * @throws {RangeError} For a zero, nonfinite or unrepresentable axis, or a lateral axis under the default sagittal contract.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Distinguishes a terminal direction effector from point-only carriage and states normalization, model frame and refusals.
     * @evidence contracts/development/implementation.md#principled-implementation Normalize the declared axis, subtract the terminal length along it and solve the remaining three bars with the existing relative carpus/hock fold.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure Validate/snapshot one axis, then share the prepared piece, fit and four-length checks through range/target/solve.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The effector direction is explicit input; no invented fetlock angle, species case, changed root, clipped foot target or stretched bar makes the goal attainable.
     * @evidence contracts/development/implementation.md#efficient-algorithms One constant-size axis normalization prepares constant-time band, target and closed-form solve operations.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares all source geometry and the strict engine-backed triangle owner with point-only solves.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains three normalized scalar components per binding and no input vector alias or growing sample state.
     */
    oriented: (
      direction: IAutoMovieVector3,
      supportPlane?: boolean,
    ) => IOriented;
  }

  /**
   * A terminal position/direction effector using the final bar length.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Range is root-to-ankle, target converts a terminal endpoint to that ankle, and solve emits all five model-space controls with the declared terminal axis.
   * @evidence contracts/development/design.md#principled-representation The final vector d*u is fixed by the explicit unit direction; only the proximal three bars participate in the radial triangle band at a relative fold.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The shared ride uses the same target and range for root planning that solve uses for exact foot placement and orientation.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Position and orientation are explicit effector constraints, not implicit biological constants or an angle chosen to make one floor fixture pass.
   */
  export interface IOriented {
    /**
     * Read the proximal-three root-to-ankle band at a relative fold, degrees.
     * A nonfinite fold or degenerate/unrepresentable carriage throws RangeError.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Gives metres from root to target(endpoint), not root to the terminal, and preserves the existing relative fold convention.
     * @evidence contracts/development/implementation.md#principled-implementation The folded second/third resultant has length L; the first length a gives [abs(a-L),a+L].
     * @evidence contracts/development/implementation.md#clear-and-simple-structure Delegate to the same lower-piece owner with the explicitly constrained terminal vector removed.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No terminal-radius allowance, anthropometric margin or position clamp changes the radial band.
     * @evidence contracts/development/implementation.md#efficient-algorithms Constant trigonometric/scalar work and one fresh bound pair.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the neutral relative fold and source lengths prepared for solve.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains no range result and creates no external resource.
     */
    range: (fold: number) => IRange;

    /**
     * Convert a terminal endpoint to its ankle target, metres in model space.
     * Nonfinite/nonplanar points or an unrepresentable result throw RangeError.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the exact target(endpoint)=endpoint-d*u relation, finite sagittal input and fresh result.
     * @evidence contracts/development/implementation.md#principled-implementation Subtract the terminal length times the prepared normalized ankle-to-terminal axis.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the point, subtract one fixed vector and admit representable output.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The terminal endpoint and axis do not move to fit reach or avoid geometry; the caller owns sole contact.
     * @evidence contracts/development/implementation.md#efficient-algorithms Three multiply/subtract operations and finite/plane admission take constant work.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the prepared terminal vector for support planning and solve.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh vector and retains no caller point.
     */
    target: (endpoint: IAutoMovieVector3) => IAutoMovieVector3;

    /**
     * Solve the proximal three bars and the declared terminal position/axis.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Inputs are fixed model-space root/terminal and relative fold in degrees; five fresh outputs preserve four lengths and the supplied root/endpoint exactly, with RangeError for unsupported geometry.
     * @evidence contracts/development/implementation.md#principled-implementation Fit the first bar against the folded second/third resultant to target(endpoint), then append the exact terminal endpoint along the declared final axis.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure Convert the goal, invoke the shared strict engine-backed triangle fit and check all four represented bar lengths.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No goal/root projection, final-axis relaxation or engine-clamped miss is returned as a successful contact.
     * @evidence contracts/development/implementation.md#efficient-algorithms Constant closed-form scalar work and five fresh points; no iteration or simulation.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the same target/band operations as root planning and the same triangle/length-validation owners as point-only solving.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Every output point is independent; no source/goal alias or mutable sample cache is retained.
     */
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
   * @param fore True for a fore elbow's rear branch and negative relative fold; false for a hind stifle's front branch and positive fold.
   * @returns A source-independent prepared chain for support planning and playback.
   * @throws {RangeError} For a malformed/sparse source, nonpositive lengths, nonplanarity beyond numerical roundoff or a degenerate neutral lower carriage.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the five-point model-space input, metres/degrees, fore/hind branch and source/solve refusal categories.
   * @evidence contracts/development/implementation.md#principled-implementation Read four Euclidean lengths and lower relative sagittal angles once. Solve the first bar and folded rigid lower carriage as a triangle with admitted raw reach and unchanged endpoints.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit source geometry, prepare the folded lower piece, then expose its band and the closed solve.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reads no species standing angles or follow share and changes no source point. A scale-derived binary64 plane bound admits arithmetic noise only; no clinical limit, projected reach, shifted root or fixture coefficient is introduced.
   * @evidence contracts/development/implementation.md#efficient-algorithms Preparation examines five controls/four bars once; every range and solve takes constant work with no retained history.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Prepared scalar lengths and neutral angle differences serve every fold and sample; source arrays are not revisited.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains fixed scalar source values and closures, not the source array or points; fresh results acquire no handles or caches.
   */
  export function prepare(
    source: readonly IAutoMovieVector3[],
    fore: boolean,
  ): IPrepared {
    if (
      !Array.isArray(source) ||
      source.length !== 5 ||
      typeof fore !== "boolean"
    )
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
    if (
      lengths.some(
        (length: number): boolean => !(Number.isFinite(length) && length > 0),
      )
    )
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

    /** Preserve neutral relative fold; an oriented terminal is removed from the lower resultant. */
    function piece(fold: number, oriented: boolean): IPiece {
      if (!Number.isFinite(fold))
        throw new RangeError("A quadruped limb fold must be finite degrees");
      const bend: number =
        neutralBend + branch * fold * AutoMovieArchetypeUnits.DEGREE;
      const terminal: number = oriented ? 0 : d;
      const z: number = c * Math.sin(bend) + terminal * Math.sin(bend + slope);
      const y: number =
        -b - c * Math.cos(bend) - terminal * Math.cos(bend + slope);
      const lower: number = Math.hypot(z, y);
      const minimum: number = Math.abs(a - lower);
      const maximum: number = a + lower;
      if (
        !(
          Number.isFinite(lower) &&
          lower > 0 &&
          Number.isFinite(maximum) &&
          maximum > minimum
        )
      )
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

    /** One strict triangle owner fits either the terminal or the oriented ankle target. */
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
          Number.isFinite(distance) &&
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
      if (triangle.clamped || !Number.isFinite(triangle.lift))
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
      if (!(Number.isFinite(lowerDistance) && lowerDistance > 0))
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

    /** Refuse a solved representation that cannot retain the four positive lengths. */
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
        if (!(Number.isFinite(magnitude) && magnitude > 0))
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

        /** Move from the exact terminal endpoint to the constrained proximal target. */
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
    return (
      point !== null &&
      point !== undefined &&
      Number.isFinite(point.x) &&
      Number.isFinite(point.y) &&
      Number.isFinite(point.z)
    );
  }
}
