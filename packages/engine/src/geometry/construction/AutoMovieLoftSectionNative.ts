import { AutoMovieConicFieldJet } from "./AutoMovieConicFieldJet";
import { AutoMovieLoftAdmissionError } from "./AutoMovieLoftAdmissionError";
import type { AutoMovieLoftViewRead } from "./AutoMovieLoftViewRead";
import type { AutoMoviePolarSector } from "./AutoMoviePolarSector";
import { AutoMovieViewChain } from "./AutoMovieViewChain";
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

/** A scalar `[value, ds, dss]` in physical station mm. */
type Station = AutoMovieViewSectionField.IStationJet;

/** A chain's phase reader. */
type Reader = (phi: number) => AutoMovieViewChain.IReading | null;

/**
 * Cartesian readings of the original native scalar generating field.
 * Explicit numeric rejection uses the internal admission error; exceptions
 * raised by input getters are not intercepted or reclassified here.
 *
 * A source that declares touch offsets or quarter split points
 * (`IAutoMovieViewPart.ITop`) is read as its conic chain
 * (`AutoMovieViewChain`): the guide on support line q stands at its extent
 * along the chart axis and its touch offset across it, with the tangent of
 * that support line; each split point of a quarter stands at its own (u, v)
 * with the tangent at its angle, in the quarter's order; each arc keeps its
 * own shoulder. Every chain reading takes its point and direction from the
 * chain's one ray reader, so Point0 and value read the arc point alone and
 * the derivative capabilities add their jets on that same ray. The chain is
 * G1, so its radius is C1 in phase; at a join whose curvatures differ the
 * second phase derivatives are the starting arc's alone. Such a source
 * therefore has no eight-scalar boundary law (`AutoMovieLoftSectionBoundary`
 * refuses it) and its loft declares C1 (`AutoMovieViewLoft`). A source
 * without them keeps the four-quarter reading unchanged.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes fixed local-quarter geometry, global polar phase and physical station derivatives, and the chain's G1 joins with their sided second phase derivatives and where that policy is admitted.
 * @evidence contracts/development/design.md#principled-representation The native value, radial, point and jet readers share the same polar chart, in millimetres and radians. The split chain carries its actual contacts, tangent angles and piece shoulders.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The curve, phase, radial, value, chain, point and jet factories expose distinct outputs of the same station geometry to the loft and its consumers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A rejected chain or ray stays rejected, with its original phase and orientation preserved. Value and Point0 require no unavailable derivatives.
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
   * @evidence contracts/development/implementation.md#principled-implementation Uses the same NUMBER preparation, quarter restoration and capability-specific readers as point and phase; a declared chain prepares its arcs once for both.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One station descriptor separates preparation from each required evaluation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not memoize arbitrary algebra callbacks, require physical2, change input access order, retain failed preparations or alter native admission.
   * @evidence contracts/development/common.md#meaningful-documentation The returned Point0 and phase operations retain their individual finite-output checks.
   * @evidence contracts/development/implementation.md#efficient-algorithms One fixed four-quarter numeric preparation replaces two identical station preparations.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Both actual operations share this call's unchanged numeric source; no station or trial map is introduced.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The descriptor owns fixed source records only until the caller releases it.
   */
  export function curve(inputs: AutoMovieLoftViewRead.IValues): ICurve {
    if (declares(inputs)) {
      const input: AutoMovieViewChain.IFieldInput = need(valued(inputs));
      return { point: chainPoint(section(input)), phase: chainPhase(reader(input)) };
    }
    const geometry: AutoMovieViewConic.ICurve = prepare(inputs);
    return { point: pointFrom(geometry), phase: phaseFrom(geometry) };
  }

  /**
   * Prepare finite value/phase geometry using NUMBER alone.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Actual extent/shoulder values enter the shared numeric quarter factory, independently of physical station2 availability; a declared chain reads its jets at constant station values, whose phase partials are the chain's own.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One numeric preparation returns a reusable phase-only reader.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not request physical jets, create a principal interpolant or substitute a legacy section after source failure.
   * @evidence contracts/development/common.md#meaningful-documentation Output local vectors are value, first phase and second phase, in mm/radians.
   * @evidence contracts/development/implementation.md#efficient-algorithms Fixed quarter preparation and one numeric lookup per phase, without AD, length integration or observation partitions; a chain reads one AD arc per phase.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Numeric preparation is shared by every call through the returned closure.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns its closure and four quarters until release; each result owns new vectors.
   */
  export function phase(
    inputs: AutoMovieLoftViewRead.IValues,
  ): (phi: number) => Phase {
    if (declares(inputs)) return chainPhase(reader(need(valued(inputs))));
    return phaseFrom(prepare(inputs));
  }

  /**
   * Prepare the existing radial phase jet without inspection partitions.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Uses the same NUMBER curvature, G2 preparation and radius evaluator as ViewSection.bare/radius; a declared chain returns its own radius and phase partials.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A radial-only factory serves scalar constraints without constructing observations or measures.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Retains the original radius arithmetic and NaN tuple on source/query failure, a chain fault or unmet ray included; it does not obtain radius from a reconstructed point.
   * @evidence contracts/development/common.md#meaningful-documentation Inputs are positive extent/shoulder values and outputs are mm per angular derivative order; required failure diagnostics remain caller-owned.
   * @evidence contracts/development/implementation.md#efficient-algorithms Fixed geometry preparation and one existing radius query; no native-turn partition, samples or length work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The closure reuses its one prepared source at every requested angle.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Caller-owned fixed geometry and fresh radial tuples retain no global cache.
   */
  export function radial(
    inputs: AutoMovieLoftViewRead.IValues,
  ): (phi: number) => AutoMoviePolarSector.Jet {
    if (declares(inputs)) {
      const input: AutoMovieViewChain.IFieldInput | string = valued(inputs);
      const read: Reader | string =
        typeof input === "string" ? input : AutoMovieViewChain.jets(input);
      if (typeof read === "string")
        return (): AutoMoviePolarSector.Jet => [NaN, NaN, NaN];
      return (phi: number): AutoMoviePolarSector.Jet => {
        const at: AutoMovieViewChain.IReading | null = read(phi);
        return at === null
          ? [NaN, NaN, NaN]
          : [at.radial[0], at.radial[2], at.radial[5]];
      };
    }
    const geometry: AutoMovieViewConic.ICurve = prepare(inputs);
    return (phi: number): AutoMoviePolarSector.Jet =>
      AutoMovieViewConic.radius(geometry, phi);
  }

  /**
   * Prepare the original radius value required by scalar dimension constraints.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Uses the same NUMBER curvature and G2 geometry admission as radial, then its owner's value-only inverse kernel; a declared chain returns the length of its ray reader's arc point.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Scalar constraints explicitly request value, while radial retains its original three-component contract.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves input getter exceptions and source/query refusal; no phase or physical derivatives are claimed or replaced.
   * @evidence contracts/development/common.md#meaningful-documentation The closure returns calibration length or NaN when its required source/value cannot be read.
   * @evidence contracts/development/implementation.md#efficient-algorithms One four-quarter preparation serves value queries without tangent, radial2 or curvature conversion; a chain reads its arc point without AD.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Only this caller's unchanged numeric geometry is shared.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns fixed geometry until the closure is released; no global cache exists.
   */
  export function value(
    inputs: AutoMovieLoftViewRead.IValues,
  ): (phi: number) => number {
    if (declares(inputs)) {
      const input: AutoMovieViewChain.IFieldInput | string = valued(inputs);
      if (typeof input === "string") return (): number => NaN;
      const chain: AutoMovieViewChain.ISection = AutoMovieViewChain.of(
        AutoMovieViewChain.primal(input),
      );
      return (phi: number): number => AutoMovieViewChain.radius(chain, phi);
    }
    const geometry: AutoMovieViewConic.ICurve = prepare(inputs);
    return (phi: number): number => AutoMovieViewConic.value(geometry, phi);
  }

  /**
   * The numeric chain of a source declaring touch offsets or split points.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The same guide, split and shoulder mapping every chain reading uses, at the station's values.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One mapping and one chain preparation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A four-quarter source, a malformed layout or a chain fault returns its named refusal; no four-quarter section stands in.
   * @evidence contracts/development/common.md#meaningful-documentation Returns the chain with its arcs and join curvatures for the loft's compatibility rows and an inspecting trace.
   * @evidence contracts/development/implementation.md#efficient-algorithms One O(K) preparation.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure preparation coordinates no requests.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh chain and retains nothing.
   */
  export function chain(
    inputs: AutoMovieLoftViewRead.IValues,
  ): AutoMovieViewChain.ISection | string {
    if (!declares(inputs))
      return "the source declares no touch offset or split; it is a four-quarter section";
    const input: AutoMovieViewChain.IFieldInput | string = valued(inputs);
    if (typeof input === "string") return input;
    const prepared: AutoMovieViewChain.ISection = AutoMovieViewChain.of(
      AutoMovieViewChain.primal(input),
    );
    return prepared.fault ?? prepared;
  }

  /**
   * Prepare exactly the finite Cartesian value capability of the native source.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Same admitted NUMBER geometry and shared raw/G2 inverse produce the identical physically restored primal coordinates; a declared chain's point is its ray reader's arc point.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Point0 is separate from phase/physical2 and never fabricates those derivative fields.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves source admission, small negative phases, signed quarter rotation, inverse residual and positive finite norm; uncomputed derivatives are not asserted available and a chain point needs none.
   * @evidence contracts/development/common.md#meaningful-documentation Returns a fresh local mm pair; invalid geometry/query raises the same admission-error family, and collapsed poles remain the caller's explicit capability.
   * @evidence contracts/development/implementation.md#efficient-algorithms Fixed preparation precedes one unchanged inverse and point reading, omitting tangent/polar2/log-curvature work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The caller-owned closure retains one immutable station preparation across phases.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only fixed source geometry is retained until the closure is released; every point is fresh.
   */
  export function point(
    inputs: AutoMovieLoftViewRead.IValues,
  ): (phi: number) => [number, number] {
    if (declares(inputs)) return chainPoint(section(need(valued(inputs))));
    return pointFrom(prepare(inputs));
  }

  /**
   * Prepare actual physical source2 and retain its one numeric primal lookup.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The proved radial source2 reader and the Cartesian polar product rule define all six total2 vectors of the same native field; a declared chain's AD radius Hessian, from the actual station jets of its points, tangents and shoulders, enters the same product rule on its ray reader's direction.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One caller-owned station preparation feeds one numeric ray and one same-ray source evaluation per phase.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Never forms source3/4 or a rectangular jet; invalid required inputs/outputs fail without a curve fallback.
   * @evidence contracts/development/common.md#meaningful-documentation Source derivatives use physical station mm; the ray's already restored quarter owns phase orientation; a chain's second phase derivatives at a sided join are the starting arc's.
   * @evidence contracts/development/implementation.md#efficient-algorithms Fixed station AD preparation plus one numeric inverse and one selected AD reading per phase.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The private copied preparation reuses successful metadata validation across phases and the same descriptor supplies its point; failures and exceptions are not retained.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Prepared AD/numeric data and one validation bit belong to the existing caller-owned closure; outputs own fresh vectors and no global cache is retained.
   */
  export function jet(
    inputs: AutoMovieLoftViewRead.IJets,
  ): (phi: number) => Jet {
    if (declares(inputs)) {
      const read: Reader = reader(
        need(
          controls(inputs.extents, inputs.shoulders, inputs.touch, need(lists(inputs.splits, inputs.pieces))),
        ),
      );
      return (phi: number): Jet => {
        const at: AutoMovieViewChain.IReading = met(read, phi);
        return cartesianJet(towards(at.point), at.radial);
      };
    }
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
      return cartesianJet(direction(ray), radial);
    };
  }
}

/** A source declaring touch offsets, splits or split lists is read as its chain. */
function declares(inputs: { touch?: unknown; splits?: unknown; pieces?: unknown }): boolean {
  return inputs.touch !== undefined || inputs.splits !== undefined || inputs.pieces !== undefined;
}

/** Each quarter's ordered split points: one split as a one-point list, a split list as it stands; a source declaring both is refused. */
function lists<T>(splits: readonly T[] | undefined, pieces: readonly (readonly T[])[] | undefined): (readonly T[])[] | undefined | string {
  if (splits !== undefined && pieces !== undefined) return "the source declares both one split per quarter and a split list per quarter";
  if (splits !== undefined) return splits.map((split: T): T[] => [split]);
  return pieces === undefined ? undefined : pieces.map((list: readonly T[]): readonly T[] => list);
}

/** A chain fault is an admission refusal for the readers that require a section. */
function need<T>(value: T | string): T {
  if (typeof value === "string")
    throw new AutoMovieLoftAdmissionError(
      `Native split-quarter chain: ${value}`,
    );
  return value;
}

/** A value-only source's chain inputs at constant station jets. */
function valued(
  inputs: AutoMovieLoftViewRead.IValues,
): AutoMovieViewChain.IFieldInput | string {
  const lift = (v: number): Station => [v, 0, 0];
  const quarters: (readonly number[][])[] | undefined | string = lists(inputs.splits, inputs.pieces);
  if (typeof quarters === "string") return quarters;
  return controls(
    inputs.extents.map(lift),
    inputs.shoulders.map(lift),
    inputs.touch?.map(lift),
    quarters?.map((list: readonly number[][]): Station[][] => list.map((split: number[]): Station[] => split.map(lift))),
  );
}

/**
 * The view source's chain at one station: guide q on its support line at its
 * extent along the chart axis and its touch offset (the `v` of the `+u`/`-u`
 * guides, the `u` of the `+v`/`-v` guides) across it, tangent along that line
 * in increasing phase; then quarter q's split points in order, each at its
 * (u, v) with the tangent at its angle; the arcs' shoulders in chain order
 * (the quarter's own shoulder for the arc leaving its guide, each split
 * point's shoulder for the arc it starts).
 */
function controls(
  extents: readonly Station[],
  shoulders: readonly Station[],
  touch: readonly Station[] | undefined,
  quarters: readonly (readonly (readonly Station[])[])[] | undefined,
): AutoMovieViewChain.IFieldInput | string {
  if (
    extents.length !== 4 ||
    shoulders.length !== 4 ||
    (touch !== undefined && touch.length !== 4) ||
    (quarters !== undefined &&
      (quarters.length !== 4 ||
        quarters.some((list: readonly (readonly Station[])[]): boolean => list.some((split: readonly Station[]): boolean => split.length !== 4))))
  )
    return "a chain section needs four extents, shoulders and touch offsets and four quarters of four-role split points";
  type R = AutoMovieConicFieldJet.IJet;
  const J = AutoMovieConicFieldJet.fromStation;
  const constant = (c: number): R => [c, 0, 0, 0, 0, 0];
  const negate = (j: R): R => [-j[0], -j[1], -j[2], -j[3], -j[4], -j[5]];
  const across = (q: number): R =>
    touch === undefined ? constant(0) : J(touch[q]!);
  const guides: [R, R][] = [
    [J(extents[0]!), across(0)],
    [across(1), J(extents[1]!)],
    [negate(J(extents[2]!)), across(2)],
    [across(3), negate(J(extents[3]!))],
  ];
  const lines: [number, number][] = [
    [0, 1],
    [-1, 0],
    [0, -1],
    [1, 0],
  ];
  const points: [R, R][] = [];
  const tangents: [R, R][] = [];
  const pieces: R[] = [];
  for (let q: number = 0; q < 4; ++q) {
    points.push(guides[q]!);
    tangents.push([constant(lines[q]![0]), constant(lines[q]![1])]);
    pieces.push(J(shoulders[q]!));
    for (const split of quarters?.[q] ?? []) {
      const [u, v, angle, shoulder] = split as readonly [Station, Station, Station, Station];

      // cos and sin of the angle's station jet, by the chain rule.
      const [a, a1, a2] = angle;
      const c: number = Math.cos(a);
      const s: number = Math.sin(a);
      points.push([J(u), J(v)]);
      tangents.push([
        J([c, -s * a1, -c * a1 * a1 - s * a2]),
        J([s, c * a1, -s * a1 * a1 + c * a2]),
      ]);
      pieces.push(J(shoulder));
    }
  }
  return { points, tangents, shoulders: pieces };
}

/** The admitted numeric chain of these inputs. */
function section(
  input: AutoMovieViewChain.IFieldInput,
): AutoMovieViewChain.ISection {
  const chain: AutoMovieViewChain.ISection = AutoMovieViewChain.of(
    AutoMovieViewChain.primal(input),
  );
  if (chain.fault !== null)
    throw new AutoMovieLoftAdmissionError(
      `Native split-quarter chain: ${chain.fault}`,
    );
  return chain;
}

/** The admitted jet reader of these inputs. */
function reader(input: AutoMovieViewChain.IFieldInput): Reader {
  return need(AutoMovieViewChain.jets(input));
}

/** A met ray's reading, or the refusal. */
function met(read: Reader, phi: number): AutoMovieViewChain.IReading {
  const at: AutoMovieViewChain.IReading | null = read(phi);
  if (at === null)
    throw new AutoMovieLoftAdmissionError(
      "The split-quarter chain has no admitted finite phase reading.",
    );
  return at;
}

/** Point0 of a chain: its ray reader's arc point, with no derivative. */
function chainPoint(
  chain: AutoMovieViewChain.ISection,
): (phi: number) => [number, number] {
  return (phi: number): [number, number] => {
    const at: AutoMovieViewChain.IRead | null = AutoMovieViewChain.read(
      chain,
      phi,
    );
    if (at === null)
      throw new AutoMovieLoftAdmissionError(
        "The split-quarter chain has no admitted finite phase reading.",
      );
    return towards(at.point).p;
  };
}

/** A chain's point and its first two phase derivatives on its ray reader's direction. */
function chainPhase(read: Reader): (phi: number) => Phase {
  return (phi: number): Phase => {
    const at: AutoMovieViewChain.IReading = met(read, phi);
    return polarPhase(towards(at.point), [
      at.radial[0],
      at.radial[2],
      at.radial[5],
    ]);
  };
}

/** The direction of an arc point, admitted finite and away from the course point. */
function towards(point: readonly [number, number]): Direction {
  const size: number = Math.hypot(point[0], point[1]);
  if (!(Number.isFinite(size) && size > 0))
    throw new AutoMovieLoftAdmissionError(
      "The native primal point has no finite positive norm.",
    );
  const radial: [number, number] = [point[0] / size, point[1] / size];
  return { p: [point[0], point[1]], radial, turn: [-radial[1], radial[0]] };
}

/** The six Cartesian vectors of a radial Hessian `[r, s, phi, ss, sphi, phiphi]` along one ray. */
function cartesianJet(at: Direction, radial: readonly number[]): Jet {
  const value: Phase = polarPhase(at, [radial[0]!, radial[2]!, radial[5]!]);
  return admit({
    ...value,
    s: [radial[1]! * at.radial[0], radial[1]! * at.radial[1]],
    ss: [radial[3]! * at.radial[0], radial[3]! * at.radial[1]],
    st: [
      radial[4]! * at.radial[0] + radial[1]! * at.turn[0],
      radial[4]! * at.radial[1] + radial[1]! * at.turn[1],
    ],
  });
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
