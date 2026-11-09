/**
 * Checked values chains and seams exchange; failed checks throw a message
 * naming the producer and the violated local premise.
 *
 * TypeScript's `number` states neither finiteness nor order, so a shared
 * module that assumes them (a natural spline dividing by its station gaps, a
 * chain builder dating its layers) fails far from the producer that broke the
 * assumption: a head chain whose layers stood 0.05 mm apart swung its spline
 * into lobes hundreds of millimetres wide, and the failure surfaced only in
 * the skin chart. The brand records an intended checking boundary in TypeScript;
 * a cast can bypass it and mutating a borrowed input can invalidate it.
 *
 * - Stations: finite, strictly increasing by at least a stated step, in
 *   millimetres; at least two.
 * - Jet: finite numbers within a stated magnitude (a layer's values, slopes or
 *   curvatures per millimetre of station).
 * - Ring: finite points `[x, y, z]` in millimetres whose projection on the
 *   horizontal plane encloses a non-zero area.
 *
 * Every check throws; none clamps, so a broken producer is named where it
 * broke the contract.
 *
 * @evidence contracts/common.md#principled-implementation The contracts a chain's producers meet (station spacing, finite jets, ring shape) are checked where data enters the kernel, so a later operator can rely on them.
 * @evidence contracts/common.md#clear-and-simple-design One diagnostic record and one checker per contract.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts These checkers throw on a failed check instead of clamping; the separately exported diagnostic record lets higher-level operations publish their own failures.
 * @evidence contracts/common.md#meaningful-documentation States each contract, its bound and why the bound has that size.
 * @evidence contracts/performance.md#efficient-algorithms Every check is linear in the values it reads.
 * @evidence contracts/performance.md#reuse-equivalent-work A checked station list is returned for the caller to keep using.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Successful checks return their borrowed arrays without retaining them globally; failures allocate thrown errors, and callers own separately constructed diagnostics.
 */
export namespace AutoMovieLoftContract {
  /**
   * A contract an optional piece broke, recorded instead of aborting the
   * figure: the piece is replaced by its base (no piece over the base
   * envelope; an aperture that cannot close one loop leaves the mouth closed).
   *
   * @evidence contracts/common.md#principled-implementation A producer, construction level, contract name and detail identify a rejected local construction for the realization's rollback/reporting path.
   * @evidence contracts/common.md#clear-and-simple-design Four plain fields carry the failure without coupling the record to an exception class or renderer.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The record reports a failure rather than treating partial geometry as successful; it does not itself enforce rollback.
   * @evidence contracts/common.md#meaningful-documentation Names the failed piece, construction level and explanatory numerical detail, with fallback owned by the producing operation.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A diagnostic is data, not a checking or rollback algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Failure records coordinate no cache or equivalent successful work.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The returned result owns its diagnostic list; each entry has four fields with caller-sized strings and no acquired handle.
   */
  export interface IDiagnostic {
    /** The piece that broke the contract, such as `human.mouth`. */
    producer: string;

    /** Its construction level (`construction-levels.md`). */
    level: number;

    /** The contract it broke. */
    contract: string;

    /** The message with its numbers. */
    detail: string;
  }

  /**
   * Borrowed stations checked for finiteness and the constructor's minimum rise, mm.
   *
   * @evidence contracts/common.md#principled-implementation The intersection brand identifies the stations checker boundary on a read-only number array.
   * @evidence contracts/common.md#clear-and-simple-design The original array remains the value rather than gaining a runtime wrapper or duplicate table.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The brand neither freezes storage nor prevents an explicit cast; callers must preserve the checked ordering and values.
   * @evidence contracts/common.md#meaningful-documentation States physical units, the minimum-rise check and borrowed ownership.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This alias runs no check; stations owns the scan.
   * @evidence contracts/performance.md#reuse-equivalent-work Consumers can share the checked array while its original contents remain unchanged.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The brand adds no runtime storage; the input's owner controls the O(N) array's lifetime.
   */
  export type Stations = readonly number[] & { readonly contract: "stations" };

  /**
   * Borrowed numbers checked against the caller's magnitude bound, finite when that bound is finite.
   *
   * @evidence contracts/common.md#principled-implementation The jet brand marks an array that passed elementwise magnitude comparisons with a supplied bound.
   * @evidence contracts/common.md#clear-and-simple-design A type intersection preserves the numerical array layout used by interpolation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts This type does not record the bound or prevent later alias mutation/casting; it cannot independently certify finiteness.
   * @evidence contracts/common.md#meaningful-documentation Distinguishes a finite caller bound from a guarantee supplied by the alias itself.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The alias chooses no algorithm; jet owns magnitude checking.
   * @evidence contracts/performance.md#reuse-equivalent-work The same checked array can feed consumers without a representation conversion, provided its contents stay unchanged.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only the original array is retained by its owner; the erased brand allocates no storage or handle.
   */
  export type Jet = readonly number[] & { readonly contract: "jet" };

  /**
   * Borrowed finite points whose X/Z shoelace sum is nonzero, in mm.
   *
   * @evidence contracts/common.md#principled-implementation The ring brand names the finite-coordinate and nonzero projected-sum check performed by ring.
   * @evidence contracts/common.md#clear-and-simple-design The point sequence remains a plain read-only tuple array used directly by loft producers.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The brand does not certify simplicity, planarity, orientation or a finite accumulated area, and aliases/casts can invalidate its intended premise.
   * @evidence contracts/common.md#meaningful-documentation Names the horizontal projection and units rather than implying a complete geometric ring validator.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This alias executes no ring traversal.
   * @evidence contracts/performance.md#reuse-equivalent-work Downstream readers share the checked original point array while the producer preserves it.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The owner retains O(N) borrowed triples; this type adds no runtime state.
   */
  export type Ring = readonly (readonly [number, number, number])[] & {
    readonly contract: "ring";
  };

  /**
   * Stations checked against their contract.
   *
   * @param producer The chain or seam that made them, for the message.
   * @param values Stations, millimetres.
   * @param least Least rise between two stations, millimetres, positive.
   * @returns The same values, branded.
   * @throws When fewer than two, one is not finite, or one rises by less than `least`.
   *
   * @evidence contracts/common.md#principled-implementation Checks positive least rise, at least two stations, finite entries and every adjacent difference before returning the original array with its intended brand.
   * @evidence contracts/common.md#clear-and-simple-design One pass owns the station admission messages so downstream spline failures can identify the producer.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not sort, merge or clamp bad stations; minimum-step and difference arithmetic rely on caller-scale premises.
   * @evidence contracts/common.md#meaningful-documentation Gives minimum count, rise units, same-array return and thrown failure effects.
   * @evidence contracts/performance.md#efficient-algorithms O(N) time and O(1) successful working storage inspect every required adjacent pair.
   * @evidence contracts/performance.md#reuse-equivalent-work Returns the exact checked array for subsequent reads, without copying or caching a second station population.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Owns no retained array; the caller keeps its input and a thrown error's lifetime belongs to its catcher.
   */
  export function stations(
    producer: string,
    values: readonly number[],
    least: number,
  ): Stations {
    if (!(least > 0))
      throw new Error(
        `${producer}: a station list needs a positive least step, not ${least}`,
      );
    if (values.length < 2)
      throw new Error(
        `${producer}: a station list needs two stations, not ${values.length}`,
      );
    for (let k: number = 0; k < values.length; k++) {
      const v: number = values[k]!;
      if (!Number.isFinite(v))
        throw new Error(
          `${producer}: layer ${k} stands at ${v}, not a finite station in millimetres`,
        );
      if (k > 0 && !(v - values[k - 1]! >= least))
        throw new Error(
          `${producer}: layer ${k} stands ${v - values[k - 1]!} mm over layer ${k - 1}; stations must rise by at least ${least} mm`,
        );
    }
    return values as Stations;
  }

  /**
   * Numbers checked to be finite and within a magnitude.
   *
   * @param producer The chain, layer and quantity, for the message.
   * @param values The numbers.
   * @param bound Largest magnitude accepted; callers requiring finite entries pass a positive finite bound.
   * @returns The same values, branded.
   * @throws When an entry is not finite or exceeds `bound`.
   *
   * @evidence contracts/common.md#principled-implementation Accepts each entry only when abs(value)<=bound; callers such as SeamStation pass finite FINITE, making accepted entries finite under that premise.
   * @evidence contracts/common.md#clear-and-simple-design A single scan and first-failure error implement one magnitude checking boundary.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not clamp entries; bound is not independently validated, so an infinite bound would also admit infinite entries.
   * @evidence contracts/common.md#meaningful-documentation States borrowed return, caller-supplied bound and element failure; the finite-bound premise is explicit here.
   * @evidence contracts/performance.md#efficient-algorithms O(N) comparisons and O(1) successful temporary storage, stopping at the first failing entry.
   * @evidence contracts/performance.md#reuse-equivalent-work Returns the same array after checking; no second numerical representation or cross-call cache is built.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Retains no input after return; failures throw one error owned by the caller's error path.
   */
  export function jet(
    producer: string,
    values: readonly number[],
    bound: number,
  ): Jet {
    for (let i: number = 0; i < values.length; i++)
      if (!(Math.abs(values[i]!) <= bound))
        throw new Error(
          `${producer}: entry ${i} is ${values[i]}, outside the finite bound ${bound}`,
        );
    return values as Jet;
  }

  /**
   * A ring checked to have finite points and a non-zero horizontal area (the
   * shoelace sum of its points in `x` and `z`).
   *
   * @param producer The chain that made it, for the message.
   * @param layer The ring's layer index, for the message.
   * @param points The ring's points in order, millimetres.
   * @returns The same points, branded.
   * @throws When a coordinate is not finite or the ring encloses no area.
   *
   * @evidence contracts/common.md#principled-implementation Scans all three coordinates for finiteness and accumulates the ordered X/Z shoelace sum, rejecting when its absolute value is not positive.
   * @evidence contracts/common.md#clear-and-simple-design Coordinate admission and projected-sum checking share one pass and one producer/layer error boundary.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not reorder or repair points; nonzero signed sum is not a simplicity, planarity or finite-area certificate, and extreme product overflow is not separately checked.
   * @evidence contracts/common.md#meaningful-documentation Gives projection, units, borrowed return and reported coordinate/area failures.
   * @evidence contracts/performance.md#efficient-algorithms O(N) point visits and a scalar area accumulator avoid a copied or triangulated polygon.
   * @evidence contracts/performance.md#reuse-equivalent-work Each edge contributes once while its current point is admitted; successful output is the caller's original point array.
   * @evidence contracts/performance.md#bound-retention-and-release-resources No temporary point population or global state survives; errors and the original array remain caller-owned.
   */
  export function ring(
    producer: string,
    layer: number,
    points: readonly (readonly [number, number, number])[],
  ): Ring {
    let area: number = 0;
    for (let i: number = 0; i < points.length; i++) {
      const p: readonly [number, number, number] = points[i]!;
      if (
        !(
          Number.isFinite(p[0]) &&
          Number.isFinite(p[1]) &&
          Number.isFinite(p[2])
        )
      )
        throw new Error(
          `${producer}: layer ${layer} point ${i} is [${p.join(", ")}], not finite`,
        );
      const q: readonly [number, number, number] =
        points[(i + 1) % points.length]!;
      area += p[0] * q[2] - q[0] * p[2];
    }
    if (!(Math.abs(area) > 0))
      throw new Error(
        `${producer}: layer ${layer}'s ring of ${points.length} points encloses no area`,
      );
    return points as Ring;
  }

  /**
   * Least rise between two layers of a chain built from rings, mm: the gap
   * `AutoMovieHumanHorizontalChain` has always kept, now a contract its
   * producers meet instead of a clamp it applies.
   */
  export const LEAST_LAYER_GAP: number = 0.05;

  /**
   * Least rise between two stations of a chain made C2 by its natural spline,
   * as a share of the stations' whole span: the spline divides by the gaps and
   * their squares. A millionth is a relative spacing policy for the supported
   * physical scales (a micrometre on a metre-long part, a nanometre on a
   * millimetre-long one), not a proof against overflow or underflow at every
   * finite double scale.
   */
  export const SPLINE_GAP_SHARE: number = 1e-6;

  /**
   * The least rise between two stations of a spline chain over these stations.
   *
   * @param values The stations, increasing, at least two.
   * @returns {@link SPLINE_GAP_SHARE} of their span, mm.
   *
   * @evidence contracts/common.md#principled-implementation Multiplies the absolute endpoint span by the named relative spacing policy; callers must still admit finite increasing stations and representable subtraction/product.
   * @evidence contracts/common.md#clear-and-simple-design One shared scalar formula keeps the station-gap policy at the contract boundary.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Adds no absolute floor or hidden cap; it does not itself validate count, ordering, zero span or extreme-scale arithmetic.
   * @evidence contracts/common.md#meaningful-documentation States input ordering/count, output units and the policy's numerical limitation beside SPLINE_GAP_SHARE.
   * @evidence contracts/performance.md#efficient-algorithms Reads the two endpoints and performs constant arithmetic without scanning interior stations.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The scalar policy computation coordinates no shared request or numerical solve.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returns a number and retains no array or resource.
   */
  export function splineGap(values: readonly number[]): number {
    return SPLINE_GAP_SHARE * Math.abs(values[values.length - 1]! - values[0]!);
  }

  /**
   * Largest magnitude of a station jet that the contract accepts: the largest
   * finite double. A jet checked against it is finite; a producer with a
   * tighter physical bound passes its own.
   */
  export const FINITE: number = Number.MAX_VALUE;
}
