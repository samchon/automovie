import {
  type AutoMovieConicArc,
  AutoMovieConicArcField,
  AutoMovieConicFieldJet,
  AutoMovieConicHermite,
  AutoMovieConicHermiteField,
  type AutoMovieViewConic,
  AutoMovieViewSectionField,
} from "@automovie/engine";

/** Actual regular-station scalar tuple. */
type Scalar = AutoMovieViewSectionField.IStationJet;

/** Prepared numeric/source field, without a callback or registration identity. */
type Prepared = AutoMovieViewSectionField.IPrepared;

/** The main question supplies the unchanged independent component comparator. */
type Compare = (
  actual: readonly number[],
  expected: readonly number[],
  scale: number,
  name: string,
) => void;

/** Boundary regularity questions separated from closed-form radial oracles. */
export namespace ConstructionConicFieldBoundary {
  /** A same-geometry descriptor is plain data, and malformed required fields retain the named Failure protocol. */
  export function malformed(
    at: Prepared,
    ray: AutoMovieViewConic.IRay,
    failures: string[],
  ): void {
    for (const field of ["radial", "point", "tangent", "position"] as const) {
      const broken: AutoMovieViewConic.IRay = {
        ...ray,
        [field]: null,
      } as unknown as AutoMovieViewConic.IRay;
      const result: ReturnType<typeof AutoMovieViewSectionField.readRay> =
        AutoMovieViewSectionField.readRay(at, broken);
      if (!("kind" in result) || !result.detail.includes("descriptor"))
        failures.push(
          `Malformed ray ${field} lost its named Failure protocol.`,
        );
    }
  }

  /** Guide ownership switches while compact supports approach the exact total-order-two guide limit. */
  export function tie(compare: Compare): void {
    const r: Scalar = [Math.SQRT2 - 1, 0, 0];
    const limit: readonly number[] = [3, 0, 0, 0, 0, 3 - 27 / 4];
    const observations: { s: number; phi: number; errors: number[] }[] = [];
    for (const s of [0, -0.001, 0.001, -1e-6, 1e-6, -(2 ** -40), 2 ** -40]) {
      const at: Prepared = prepared(
        [
          [3, 0, 0],
          [2 + s, 1, 0],
          [3, 0, 0],
          [2 - s, -1, 0],
        ],
        [r, r, r, r],
      );
      compare(
        radial(at, 0),
        [3, 0, 0, 0, 0, 3 - 27 / (2 + Math.abs(s)) ** 2],
        1,
        `tie guide ${s}`,
      );
      if (s === 0) continue;
      const patch: AutoMovieConicHermite.IPatch | null =
        s < 0 ? at.geometry.quarters[0]!.start : at.geometry.quarters[3]!.end;
      if (patch === null)
        throw new Error(
          `Owner-switch source ${s} has no expected short support`,
        );
      const phi: number = (s < 0 ? 1 : -1) * 0.37 * patch.angle;
      const value: AutoMovieViewSectionField.IRadialJet = radial(at, phi);
      observations.push({
        s,
        phi,
        errors: value.map((v: number, i: number): number => v - limit[i]!),
      });
      if (Math.abs(s) === 2 ** -40)
        compare(value, limit, 1, `vanishing support ${s}`);
    }
    console.log({
      nativeFieldTieLimitObservations: observations,
      scope: "finite joint-limit probes, not a continuous certificate",
    });
  }

  /** Raw native=T(s,p) and the cubic endpoint follow one moving path; reflected tangents obey det(S)=-1. */
  export function moving(compare: Compare): void {
    const e: Scalar[] = [
      [3, 0.4, 0.2],
      [2, -0.2, 0.1],
      [4, 0.3, -0.1],
      [1, 0.1, 0.2],
    ];
    const r: Scalar[] = [
      [0.2, 0.03, 0.01],
      [0.4, -0.02, 0.01],
      [0.6, 0.01, -0.02],
      [0.3, 0.02, 0.01],
    ];
    const at: Prepared = prepared(e, r);
    let count: number = 0;
    for (let q: number = 0; q < 4; q++)
      for (const end of [false, true]) {
        const arc: AutoMovieViewConic.IQuarter<AutoMovieConicFieldJet.IJet> =
          at.source.quarters[q]!;
        const numeric: AutoMovieViewConic.IQuarter = at.geometry.quarters[q]!;
        const patch: AutoMovieConicHermite.IPatch<AutoMovieConicFieldJet.IJet> | null =
          end ? arc.end : arc.start;
        const primal: AutoMovieConicHermite.IPatch | null = end
          ? numeric.end
          : numeric.start;
        if (patch === null || primal === null) continue;
        const selected: AutoMovieConicArc.IRay | null =
          AutoMovieConicHermite.locate(primal, primal.angle);
        if (
          selected === null ||
          selected.position !== "last" ||
          selected.clock !== null
        )
          throw new Error("Moving boundary has no explicit final endpoint");
        const ray: AutoMovieConicArc.IRay = end
          ? {
              ...selected,
              reverse: true,
              point: [selected.point[1], selected.point[0]],
              tangent: [-selected.tangent[1], -selected.tangent[0]],
              radial: [
                selected.radial[0],
                -selected.radial[1],
                selected.radial[2],
              ],
            }
          : selected;
        const cubic:
          | AutoMovieConicArcField.IReading
          | AutoMovieConicArcField.IFailure = AutoMovieConicHermiteField.read(
          patch,
          ray,
        );
        if (cubic.kind === "failure") throw new Error(cubic.detail);
        const a: AutoMovieConicFieldJet.IJet = arc.extents[end ? 1 : 0];
        const b: AutoMovieConicFieldJet.IJet = arc.extents[end ? 0 : 1];
        const raw: AutoMovieConicArcField.IGeometry<AutoMovieConicFieldJet.IJet> =
          AutoMovieConicArcField.evaluate(
            AutoMovieConicFieldJet.AD,
            a,
            b,
            AutoMovieConicArcField.weight(
              AutoMovieConicFieldJet.AD,
              arc.shoulder,
            ),
            patch.native,
          );
        for (let i: number = 0; i < 2; i++) {
          const expectedPoint: AutoMovieConicFieldJet.IJet =
            raw.point[end ? 1 - i : i]!;
          const expectedTangent: readonly number[] = raw.tangent[
            end ? 1 - i : i
          ]!.slice(0, 3).map((value: number): number => (end ? -value : value));
          compare(
            cubic.point[i]!,
            expectedPoint,
            1,
            `moving point ${q}/${end}/${i}`,
          );
          compare(
            cubic.tangent[i]!,
            expectedTangent,
            1,
            `moving tangent ${q}/${end}/${i}`,
          );
        }
        count++;
      }
    if (count === 0) throw new Error("No moving raw/G2 boundary was exercised");
  }
}

/** A refusal remains a named finding, not a substituted native preparation. */
function prepared(
  extents: readonly Scalar[],
  shoulders: readonly Scalar[],
): Prepared {
  const value: Prepared | AutoMovieConicArcField.IFailure =
    AutoMovieViewSectionField.prepare(extents, shoulders);
  if (value.kind === "failure") throw new Error(value.detail);
  return value;
}

/** Consume exactly the actual field's required six partials. */
function radial(
  at: Prepared,
  phi: number,
): AutoMovieViewSectionField.IRadialJet {
  const value: ReturnType<typeof AutoMovieViewSectionField.read> =
    AutoMovieViewSectionField.read(at, phi);
  if ("kind" in value) throw new Error(value.detail);
  return value;
}
