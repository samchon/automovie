import { AutoMovieConicFieldJet } from "./AutoMovieConicFieldJet";
import type { AutoMovieLoftViewRead } from "./AutoMovieLoftViewRead";
import { AutoMovieViewConic } from "./AutoMovieViewConic";
import { AutoMovieViewSectionField } from "./AutoMovieViewSectionField";

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
 *
 * @evidence contracts/common.md#principled-implementation Shared native geometry and radial source2 produce Cartesian phase/station derivatives by the analytic polar product rule.
 * @evidence contracts/common.md#clear-and-simple-design Separate phase-only and physical-total2 station factories share one primal direction conversion.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses the same numeric ray once, preserves raw negative phases and applies no second reflection, coordinate fit or missing derivative.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes fixed local-quarter geometry, global polar phase and physical station derivatives.
 * @evidence contracts/performance.md#efficient-algorithms Fixed four-quarter station preparation precedes one numeric inverse per phase; AD only evaluates the selected source piece after that inverse.
 * @evidence contracts/performance.md#reuse-equivalent-work The caller-owned phase closure reuses its station geometry and the same ray supplies the Cartesian primal and source2 dispatch.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only caller-owned prepared geometry and fresh local vectors are retained; no module cache exists.
 */
export namespace AutoMovieLoftSectionNative {
  /**
   * Prepare finite value/phase geometry using NUMBER alone.
   *
   * @evidence contracts/common.md#principled-implementation Actual extent/shoulder values enter the shared numeric quarter factory, independently of physical station2 availability.
   * @evidence contracts/common.md#clear-and-simple-design One numeric preparation returns a reusable phase-only reader.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not request physical jets, create a principal interpolant or substitute a legacy section after source failure.
   * @evidence contracts/common.md#meaningful-documentation Output local vectors are value, first phase and second phase, in mm/radians.
   * @evidence contracts/performance.md#efficient-algorithms Fixed quarter preparation and one numeric lookup per phase, without AD, length integration or observation partitions.
   * @evidence contracts/performance.md#reuse-equivalent-work Numeric preparation is shared by every call through the returned closure.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns its closure and four quarters until release; each result owns new vectors.
   */
  export function phase(
    inputs: AutoMovieLoftViewRead.IValues,
  ): (phi: number) => Phase {
    const ops: AutoMovieConicFieldJet.IAlgebra<number> =
      AutoMovieConicFieldJet.NUMBER;
    const geometry: AutoMovieViewConic.ICurve =
      AutoMovieViewConic.prepareGeometry(
        ops,
        inputs.extents,
        inputs.shoulders,
        AutoMovieViewConic.curvatures(ops, inputs.extents, inputs.shoulders),
      );
    if (geometry.failure !== null)
      throw new Error(`Native value source: ${geometry.failure}`);
    return (phi: number): Phase => {
      const ray: AutoMovieViewConic.IRay = locate(geometry, phi);
      const at: Direction = direction(ray);
      return polarPhase(at, ray.radial);
    };
  }

  /**
   * Prepare actual physical source2 and retain its one numeric primal lookup.
   *
   * @evidence contracts/common.md#principled-implementation The proved radial source2 reader and the Cartesian polar product rule define all six total2 vectors of the same native field.
   * @evidence contracts/common.md#clear-and-simple-design One caller-owned station preparation feeds one numeric ray and one same-ray source evaluation per phase.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Never forms source3/4 or a rectangular jet; invalid required inputs/outputs fail without a curve fallback.
   * @evidence contracts/common.md#meaningful-documentation Source derivatives use physical station mm; the ray's already restored quarter owns phase orientation.
   * @evidence contracts/performance.md#efficient-algorithms Fixed station AD preparation plus one numeric inverse and one selected AD reading per phase.
   * @evidence contracts/performance.md#reuse-equivalent-work readRay reuses the exact descriptor that supplies the Cartesian point, avoiding a second inverse.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Prepared AD/numeric data belongs to the returned closure; outputs own fresh vectors and no query cache is retained.
   */
  export function jet(
    inputs: AutoMovieLoftViewRead.IJets,
  ): (phi: number) => Jet {
    const source: ReturnType<typeof AutoMovieViewSectionField.prepare> =
      AutoMovieViewSectionField.prepare(inputs.extents, inputs.shoulders);
    if (source.kind === "failure")
      throw new Error(`Native physical source2: ${source.detail}`);
    return (phi: number): Jet => {
      const ray: AutoMovieViewConic.IRay = locate(source.geometry, phi);
      const radial: ReturnType<typeof AutoMovieViewSectionField.readRay> =
        AutoMovieViewSectionField.readRay(source, ray);
      if ("kind" in radial)
        throw new Error(`Native physical source2: ${radial.detail}`);
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
    throw new Error("The native source has no admitted finite phase reading.");
  return ray;
}

/** Quarter rotations are exact sign/swaps; the native inverse has already restored its own reflection. */
function direction(ray: AutoMovieViewConic.IRay): Direction {
  const [x, z]: readonly [number, number] = ray.point;
  const p: [number, number] =
    ray.quarter === 0
      ? [x, z]
      : ray.quarter === 1
        ? [-z, x]
        : ray.quarter === 2
          ? [-x, -z]
          : [z, -x];
  const size: number = Math.hypot(p[0], p[1]);
  if (!(Number.isFinite(size) && size > 0))
    throw new Error("The native primal point has no finite positive norm.");
  const radial: [number, number] = [p[0] / size, p[1] / size];
  return { p, radial, turn: [-radial[1], radial[0]] };
}

/** Exactly value/phase/phase2 of rho*er; physical source partials are not required here. */
function polarPhase(
  at: Direction,
  radial: readonly [number, number, number],
): Phase {
  if (!radial.every(Number.isFinite))
    throw new Error("The native radial phase jet is not finite.");
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
    throw new Error(
      "The native field has no finite requested Cartesian reading.",
    );
  return out;
}
