import { AutoMovieConicFieldJet } from "./AutoMovieConicFieldJet";
import { AutoMovieLoftAdmissionError } from "./AutoMovieLoftAdmissionError";
import type { AutoMovieLoftViewRead } from "./AutoMovieLoftViewRead";
import type { AutoMoviePolarSector } from "./AutoMoviePolarSector";
import { AutoMovieViewConic } from "./AutoMovieViewConic";
import { AutoMovieViewSectionField } from "./AutoMovieViewSectionField";
import { AutoMovieViewSectionReading } from "./AutoMovieViewSectionReading";

/** Local value/phase-only capability, requiring no physical station derivative. */
type Phase = { p: [number, number]; t: [number, number]; tt: [number, number] };

/** Exactly the six Cartesian total-order-two components. */
type Jet = Phase & {
  s: [number, number];
  ss: [number, number];
  st: [number, number];
};

/** The same primal point supplies its normalized radial and quarter rotation. */
interface Direction {
  p: [number, number];
  radial: [number, number];
  turn: [number, number];
}

/**
 * Cartesian readings of the original native scalar generating field.
 * Explicit numeric rejection uses the internal admission error; exceptions
 * raised by input getters are not intercepted or reclassified here.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes fixed local-quarter geometry, global polar phase and physical station derivatives.
 * @evidence contracts/development/design.md#principled-representation Represents Cartesian readings of the original native scalar generating field: companion namespace of 7 members (`ICurve`, `curve`, `phase`, `radial`, `value`, `point`, ...); units and frames named in its text: local, radians, second. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieLoftSectionNative` in packages/engine/src/geometry/construction/AutoMovieLoftSectionNative.ts; its surface is the 7 members listed and the text shows 35 other files naming it, mostly packages/human (24), packages/engine (8), test (3), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace AutoMovieLoftSectionNative {
  /**
   * Two separate capabilities of one immutable numeric station preparation.
   *
   * @evidence contracts/development/design.md#principled-representation Both methods consume the same prepared native conics and original phase clock.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Point0 and phase derivatives remain distinct operations over one station.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A Point0 request evaluates no phase or physical derivatives and neither method substitutes failed geometry.
   * @evidence contracts/development/common.md#meaningful-documentation Coordinates use local mm and phase derivatives use radians; no physical-station jet is claimed.
   */
  export interface ICurve {
    /**
     * Read only the actual finite local Cartesian point.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Read only the actual finite local Cartesian point.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; the contract it fixes is: Read only the actual finite local Cartesian point.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it declares one operation and adds no layer.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; nothing here can special-case a value.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; the cost an implementation may incur is not constrained by this signature.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it coordinates no work itself.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it owns no state, handle or task.
     */
    point(phi: number): [number, number];

    /**
     * Explicitly read that same original point and its first two phase derivatives.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Explicitly read that same original point and its first two phase derivatives.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; the contract it fixes is: Explicitly read that same original point and its first two phase derivatives.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it declares one operation and adds no layer.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; nothing here can special-case a value.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; the cost an implementation may incur is not constrained by this signature.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it coordinates no work itself.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it owns no state, handle or task.
     */
    phase(phi: number): Phase;
  }

  /**
   * Prepare the numeric source once when a consumer needs Point0 inversion and a later phase tangent.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Uses the same NUMBER preparation, quarter restoration and capability-specific readers as point and phase.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One station descriptor separates preparation from each required evaluation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not memoize arbitrary algebra callbacks, require physical2, change input access order, retain failed preparations or alter native admission.
   * @evidence contracts/development/common.md#meaningful-documentation The returned Point0 and phase operations retain their individual finite-output checks.
   * @evidence contracts/development/implementation.md#efficient-algorithms One fixed four-quarter numeric preparation replaces two identical station preparations.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Both actual operations share this call's unchanged numeric source; no station or trial map is introduced.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The descriptor owns fixed source records only until the caller releases it.
   */
  export function curve(inputs: AutoMovieLoftViewRead.IValues): ICurve {
    const geometry: AutoMovieViewConic.ICurve = prepare(inputs);
    return { point: pointFrom(geometry), phase: phaseFrom(geometry) };
  }

  /**
   * Prepare finite value/phase geometry using NUMBER alone.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Actual extent/shoulder values enter the shared numeric quarter factory, independently of physical station2 availability.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One numeric preparation returns a reusable phase-only reader.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not request physical jets, create a principal interpolant or substitute a legacy section after source failure.
   * @evidence contracts/development/common.md#meaningful-documentation Output local vectors are value, first phase and second phase, in mm/radians.
   * @evidence contracts/development/implementation.md#efficient-algorithms Fixed quarter preparation and one numeric lookup per phase, without AD, length integration or observation partitions.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Numeric preparation is shared by every call through the returned closure.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns its closure and four quarters until release; each result owns new vectors.
   */
  export function phase(
    inputs: AutoMovieLoftViewRead.IValues,
  ): (phi: number) => Phase {
    return phaseFrom(prepare(inputs));
  }

  /**
   * Prepare the existing radial phase jet without inspection partitions.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Uses the same NUMBER curvature, G2 preparation and radius evaluator as ViewSection.bare/radius.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A radial-only factory serves scalar constraints without constructing observations or measures.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Retains the original radius arithmetic and NaN tuple on source/query failure; it does not obtain radius from a reconstructed point.
   * @evidence contracts/development/common.md#meaningful-documentation Inputs are positive extent/shoulder values and outputs are mm per angular derivative order; required failure diagnostics remain caller-owned.
   * @evidence contracts/development/implementation.md#efficient-algorithms Fixed geometry preparation and one existing radius query; no native-turn partition, samples or length work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The closure reuses its one prepared source at every requested angle.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Caller-owned fixed geometry and fresh radial tuples retain no global cache.
   */
  export function radial(
    inputs: AutoMovieLoftViewRead.IValues,
  ): (phi: number) => AutoMoviePolarSector.Jet {
    const geometry: AutoMovieViewConic.ICurve = prepare(inputs);
    return (phi: number): AutoMoviePolarSector.Jet =>
      AutoMovieViewConic.radius(geometry, phi);
  }

  /**
   * Prepare the original radius value required by scalar dimension constraints.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Uses the same NUMBER curvature and G2 geometry admission as radial, then its owner's value-only inverse kernel.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Scalar constraints explicitly request value, while radial retains its original three-component contract.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves input getter exceptions and source/query refusal; no phase or physical derivatives are claimed or replaced.
   * @evidence contracts/development/common.md#meaningful-documentation The closure returns calibration length or NaN when its required source/value cannot be read.
   * @evidence contracts/development/implementation.md#efficient-algorithms One four-quarter preparation serves value queries without tangent, radial2 or curvature conversion.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Only this caller's unchanged numeric geometry is shared.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns fixed geometry until the closure is released; no global cache exists.
   */
  export function value(
    inputs: AutoMovieLoftViewRead.IValues,
  ): (phi: number) => number {
    const geometry: AutoMovieViewConic.ICurve = prepare(inputs);
    return (phi: number): number => AutoMovieViewConic.value(geometry, phi);
  }

  /**
   * Prepare exactly the finite Cartesian value capability of the native source.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Same admitted NUMBER geometry and shared raw/G2 inverse produce the identical physically restored primal coordinates.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Point0 is separate from phase/physical2 and never fabricates those derivative fields.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves source admission, small negative phases, signed quarter rotation, inverse residual and positive finite norm; uncomputed derivatives are not asserted available.
   * @evidence contracts/development/common.md#meaningful-documentation Returns a fresh local mm pair; invalid geometry/query raises the same admission-error family, and collapsed poles remain the caller's explicit capability.
   * @evidence contracts/development/implementation.md#efficient-algorithms Fixed preparation precedes one unchanged inverse and point reading, omitting tangent/polar2/log-curvature work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The caller-owned closure retains one immutable station preparation across phases.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only fixed source geometry is retained until the closure is released; every point is fresh.
   */
  export function point(
    inputs: AutoMovieLoftViewRead.IValues,
  ): (phi: number) => [number, number] {
    return pointFrom(prepare(inputs));
  }

  /**
   * Prepare actual physical source2 and retain its one numeric primal lookup.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The proved radial source2 reader and the Cartesian polar product rule define all six total2 vectors of the same native field.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One caller-owned station preparation feeds one numeric ray and one same-ray source evaluation per phase.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Never forms source3/4 or a rectangular jet; invalid required inputs/outputs fail without a curve fallback.
   * @evidence contracts/development/common.md#meaningful-documentation Source derivatives use physical station mm; the ray's already restored quarter owns phase orientation.
   * @evidence contracts/development/implementation.md#efficient-algorithms Fixed station AD preparation plus one numeric inverse and one selected AD reading per phase.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The private copied preparation reuses successful metadata validation across phases and the same descriptor supplies its point; failures and exceptions are not retained.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Prepared AD/numeric data and one validation bit belong to the existing caller-owned closure; outputs own fresh vectors and no global cache is retained.
   */
  export function jet(
    inputs: AutoMovieLoftViewRead.IJets,
  ): (phi: number) => Jet {
    const source: ReturnType<typeof AutoMovieViewSectionField.prepare> =
      AutoMovieViewSectionField.prepare(inputs.extents, inputs.shoulders);
    if (source.kind === "failure")
      throw new AutoMovieLoftAdmissionError(
        `Native physical source2: ${source.detail}`,
      );

    /** Successful metadata validation of these unexposed, copied numeric records. */
    let verified: boolean = false;
    return (phi: number): Jet => {
      const ray: AutoMovieViewConic.IRay = locate(source.geometry, phi);
      const fault: string | null = verified
        ? null
        : AutoMovieViewSectionReading.validate(source);
      if (fault === null) verified = true;
      const radial: ReturnType<typeof AutoMovieViewSectionField.readRay> =
        fault === null
          ? AutoMovieViewSectionReading.evaluate(source, ray)
          : { kind: "failure", detail: fault };
      if ("kind" in radial)
        throw new AutoMovieLoftAdmissionError(
          `Native physical source2: ${radial.detail}`,
        );
      const at: Direction = direction(ray);
      const value: Phase = polarPhase(at, [radial[0], radial[2], radial[5]]);
      return admit({
        ...value,
        s: [radial[1] * at.radial[0], radial[1] * at.radial[1]],
        ss: [radial[3] * at.radial[0], radial[3] * at.radial[1]],
        st: [
          radial[4] * at.radial[0] + radial[1] * at.turn[0],
          radial[4] * at.radial[1] + radial[1] * at.turn[1],
        ],
      });
    };
  }
}

/** Share one caller-owned numeric station without changing this capability's admission. */
function phaseFrom(
  geometry: AutoMovieViewConic.ICurve,
): (phi: number) => Phase {
  if (geometry.failure !== null)
    throw new AutoMovieLoftAdmissionError(
      `Native value source: ${geometry.failure}`,
    );
  return (phi: number): Phase => {
    const ray: AutoMovieViewConic.IRay = locate(geometry, phi);
    const at: Direction = direction(ray);
    return polarPhase(at, ray.radial);
  };
}

/** Share one caller-owned numeric station without changing this capability's admission. */
function pointFrom(
  geometry: AutoMovieViewConic.ICurve,
): (phi: number) => [number, number] {
  if (geometry.failure !== null)
    throw new AutoMovieLoftAdmissionError(
      `Native value source: ${geometry.failure}`,
    );
  return (phi: number): [number, number] => {
    const ray: Pick<AutoMovieViewConic.IRay, "point" | "quarter"> | null =
      AutoMovieViewConic.point(geometry, phi);
    if (ray === null)
      throw new AutoMovieLoftAdmissionError(
        "The native source has no admitted finite phase reading.",
      );
    const p: [number, number] = cartesian(ray);
    const size: number = Math.hypot(p[0], p[1]);
    if (!(Number.isFinite(size) && size > 0))
      throw new AutoMovieLoftAdmissionError(
        "The native primal point has no finite positive norm.",
      );
    return p;
  };
}

/** The shared geometry-only preparation preserves NUMBER operation and input order. */
function prepare(
  inputs: AutoMovieLoftViewRead.IValues,
): AutoMovieViewConic.ICurve {
  const ops: AutoMovieConicFieldJet.IAlgebra<number> =
    AutoMovieConicFieldJet.NUMBER;
  const extents: AutoMovieLoftViewRead.IValues["extents"] = inputs.extents;
  const shoulders: AutoMovieLoftViewRead.IValues["shoulders"] =
    inputs.shoulders;
  const curvatures: ReturnType<typeof AutoMovieViewConic.curvatures<number>> =
    AutoMovieViewConic.curvatures(ops, inputs.extents, inputs.shoulders);
  const geometry: AutoMovieViewConic.ICurve =
    AutoMovieViewConic.prepareGeometry(ops, extents, shoulders, curvatures);
  if (geometry.failure === null) return geometry;

  // This tuple was computed by this numeric preparation. Do not reread
  // caller-owned extent/shoulder accessors to decorate a failed result.
  // Preserve nonfinite curvature values by name without another solve.
  return {
    ...geometry,
    failure:
      geometry.failure +
      "; operands=" +
      JSON.stringify({ curvatures }, (_key: string, value: unknown): unknown =>
        typeof value === "number" && !Number.isFinite(value)
          ? String(value)
          : value,
      ),
  };
}

/** Forward the raw requested phase to its one numeric owner, including tiny negative distances. */
function locate(
  geometry: AutoMovieViewConic.ICurve,
  phi: number,
): AutoMovieViewConic.IRay {
  const ray: AutoMovieViewConic.IRay | null = AutoMovieViewConic.read(
    geometry,
    phi,
  );
  if (ray === null)
    throw new AutoMovieLoftAdmissionError(
      "The native source has no admitted finite phase reading.",
    );
  return ray;
}

/** Quarter rotations are exact sign/swaps; the native inverse has already restored its own reflection. */
function direction(ray: AutoMovieViewConic.IRay): Direction {
  const p: [number, number] = cartesian(ray);
  const size: number = Math.hypot(p[0], p[1]);
  if (!(Number.isFinite(size) && size > 0))
    throw new AutoMovieLoftAdmissionError(
      "The native primal point has no finite positive norm.",
    );
  const radial: [number, number] = [p[0] / size, p[1] / size];
  return { p, radial, turn: [-radial[1], radial[0]] };
}

/** Preserve the exact quarter sign/swaps, including signed zero, for both capabilities. */
function cartesian(
  ray: Pick<AutoMovieViewConic.IRay, "point" | "quarter">,
): [number, number] {
  const [x, z]: readonly [number, number] = ray.point;
  return ray.quarter === 0
    ? [x, z]
    : ray.quarter === 1
      ? [-z, x]
      : ray.quarter === 2
        ? [-x, -z]
        : [z, -x];
}

/** Exactly value/phase/phase2 of rho*er; physical source partials are not required here. */
function polarPhase(
  at: Direction,
  radial: readonly [number, number, number],
): Phase {
  if (!radial.every(Number.isFinite))
    throw new AutoMovieLoftAdmissionError(
      "The native radial phase jet is not finite.",
    );
  return admit({
    p: [...at.p],
    t: [
      radial[1] * at.radial[0] + radial[0] * at.turn[0],
      radial[1] * at.radial[1] + radial[0] * at.turn[1],
    ],
    tt: [
      (radial[2] - radial[0]) * at.radial[0] + 2 * radial[1] * at.turn[0],
      (radial[2] - radial[0]) * at.radial[1] + 2 * radial[1] * at.turn[1],
    ],
  });
}

/** Each capability validates exactly its required returned vectors after conversion. */
function admit<T extends Phase>(out: T): T {
  if (
    !Object.values(out).every(
      (row: unknown): boolean =>
        Array.isArray(row) && row.every(Number.isFinite),
    )
  )
    throw new AutoMovieLoftAdmissionError(
      "The native field has no finite requested Cartesian reading.",
    );
  return out;
}
