import {
  type AutoMovieCurveParentContext,
  type IAutoMovieCurve64 as C,
} from "@automovie/engine";

import type { IAutoMovieCurveRegion64 as R } from "../../IAutoMovieCurveRegion64";
import { ArmCurveMath as A } from "./ArmCurveMath";
import type { IAutoMovieArmMeasurements as M } from "./IAutoMovieArmMeasurements";

/** Build eight four-pole sections and their cubic Hermite continuation per arm.
 *
 * The supplied parent hierarchy must already form the measured straight neutral T chain. Interior support dimensions are resolved in that hierarchy before construction; endpoint positions and complete dP/dmm fields come from torso and hand owners.
 *
 * This operator neither straightens a posed mesh nor authors the shoulder, axilla or hand boundary skin.
 */
export class AutoMovieArmCurveFactory implements R.Factory {
  /** Region key used to collect both side groups in the common curve assembly. */
  public readonly region: string = "arms";

  /** Private copy prevents caller edits from changing an admitted section recipe. */
  private readonly measurements: M;

  /** Copy and admit the internal recipe; parent-chain agreement and upstream boundary checks occur when construction has those inputs. */
  public constructor(measurements: M) {
    this.measurements = structuredClone(measurements);
    this.admit();
  }
  /** Produce eight closed courses and twelve constant-phase rails per side, in world millimetres; endpoint ownership remains with the supplied upstream boundaries. */
  public construct(
    context: AutoMovieCurveParentContext,
    upstream: ReadonlyMap<string, C.Boundary>,
  ): R.Result {
    return this.generate(context, upstream).result;
  }

  /** Construct the same output plus its actual interpolation tensors for endpoint inspection; invalid skeleton agreement, nonincreasing courses or unresolved arithmetic throw without altering inputs. */
  public generate(
    context: AutoMovieCurveParentContext,
    upstream: ReadonlyMap<string, C.Boundary>,
  ): AutoMovieArmCurveFactory.Generated {
    const groups: R.Result["groups"][number][] = [];
    const families: Record<string, AutoMovieArmCurveFactory.Family> = {};
    for (const side of ["left", "right"] as const) {
      const p: M.Side = this.measurements.sides[side];
      const sign: number = side === "left" ? 1 : -1;
      const upperBone: string = side + "UpperArm";
      const foreBone: string = side + "LowerArm";
      // The segment gauge makes -Y distal; the proper bone hierarchy places this gauge before supports are created.
      const targetChart: C.Matrix = [
        [0, -sign, 0],
        [sign, 0, 0],
        [0, 0, 1],
      ];
      const basisFor: (bone: string) => C.Matrix = (bone: string): C.Matrix =>
        A.transpose(
          A.transpose(targetChart).map(
            (column: C.Vector): C.Vector => context.direction(bone, column),
          ) as unknown as C.Matrix,
        );
      const upperBasis: C.Matrix = basisFor(upperBone);
      const foreBasis: C.Matrix = basisFor(foreBone);
      const shoulder: C.Vector = context.point(upperBone, [0, 0, 0]);
      const elbow: C.Vector = context.point(foreBone, [0, 0, 0]);
      const wrist: C.Vector = context.point(side + "Hand", [0, 0, 0]);
      const upperDistal: C.Vector = A.scale(A.transpose(upperBasis)[1], -1);
      const foreDistal: C.Vector = A.scale(A.transpose(foreBasis)[1], -1);
      if (
        A.norm(
          A.sub(
            A.sub(elbow, shoulder),
            A.scale(upperDistal, p.upperArmLengthMm),
          ),
        ) > 1e-7 ||
        A.norm(
          A.sub(A.sub(wrist, elbow), A.scale(foreDistal, p.forearmLengthMm)),
        ) > 1e-7 ||
        A.norm(A.sub(upperDistal, foreDistal)) > 1e-10
      )
        throw new Error(
          "Actual parent-first skeleton must match the measured straight neutral T chain; update skeleton and dimensions together",
        );
      const start: C.Boundary = this.requireBoundary(
        upstream,
        side + ".upperArm.midTube",
      );
      const end: C.Boundary = this.requireBoundary(
        upstream,
        side + ".wrist.midTube",
      );
      const arcs: number[] = [];
      const rings: C.Span[][] = p.stations.map(
        (s: M.Station, i: number): C.Span[] => {
          arcs.push(
            s.segment === "upperarm"
              ? p.upperArmLengthMm * s.mechanicalFraction
              : p.upperArmLengthMm +
                  (s.segment === "forearm"
                    ? p.forearmLengthMm * s.mechanicalFraction
                    : 0),
          );
          if (i === 0) return structuredClone(start.section.spans) as C.Span[];
          if (i === p.stations.length - 1)
            return side === "right"
              ? A.rotateQuarters(end.section.spans)
              : (structuredClone(end.section.spans) as C.Span[]);
          const basis: C.Matrix =
            s.segment === "forearm" ? foreBasis : upperBasis;
          const base: C.Vector =
            s.segment === "upperarm"
              ? A.add(
                  shoulder,
                  A.scale(
                    upperDistal,
                    p.upperArmLengthMm * s.mechanicalFraction,
                  ),
                )
              : s.segment === "forearm"
                ? A.add(
                    elbow,
                    A.scale(
                      foreDistal,
                      p.forearmLengthMm * s.mechanicalFraction,
                    ),
                  )
                : elbow;
          return this.section(
            s.skin!,
            A.add(base, A.mul(basis, s.skin!.originOffsetInSegmentMm)),
            basis,
          );
        },
      );
      const distances: number[] = arcs
        .slice(1)
        .map((x: number, i: number): number => x - arcs[i]!);
      if (distances.some((x: number): boolean => !Number.isFinite(x) || x <= 0))
        throw new Error("Physical station arcs must increase strictly");
      // Interior secants and owner endpoint jets share dP/dmm units. Multiplying by ds/3 gives cubic handles for the physical span, once.
      const derivatives: C.Span[][] = rings.map(
        (ring: C.Span[], i: number): C.Span[] => {
          if (i === 0) return structuredClone(start.fullJ) as C.Span[];
          if (i === rings.length - 1)
            return side === "right"
              ? A.rotateQuarters(end.fullJ)
              : (structuredClone(end.fullJ) as C.Span[]);
          if (p.stations[i]!.longitudinalTangent === "segment-axis") {
            const axis: C.Vector =
              p.stations[i]!.segment === "forearm" ? foreDistal : upperDistal;
            return ring.map(
              (span: C.Span): C.Span =>
                span.map(
                  (): C.Vector => [...axis] as C.Vector,
                ) as unknown as C.Span,
            );
          }
          return A.difference(
            rings[i + 1]!,
            rings[i - 1]!,
            arcs[i + 1]! - arcs[i - 1]!,
          );
        },
      );
      const fields: AutoMovieArmCurveFactory.Tensor[] = distances.map(
        (ds: number, i: number): AutoMovieArmCurveFactory.Tensor => [
          rings[i]!,
          A.combine(rings[i]!, derivatives[i]!, ds / 3),
          A.combine(rings[i + 1]!, derivatives[i + 1]!, -ds / 3),
          rings[i + 1]!,
        ],
      );
      const curves: C.Cubic[] = rings.map(
        (ring: C.Span[], i: number): C.Cubic => ({
          type: "cubicBezier",
          name: side + "." + p.stations[i]!.name,
          closed: true,
          unit: "mm",
          phaseUnit: "turn",
          phaseIntervals: [0.25, 0.25, 0.25, 0.25],
          spans: ring,
        }),
      );
      for (let j: number = 0; j < 12; j++)
        curves.push({
          type: "cubicBezier",
          name: side + ".armLongitudinal.phase" + j.toString().padStart(2, "0"),
          closed: false,
          unit: "mm",
          phaseUnit: "mm",
          phaseIntervals: distances,
          spans: fields.map(
            (tensor: AutoMovieArmCurveFactory.Tensor): C.Span =>
              tensor.map(
                (net: readonly C.Span[]): C.Vector => A.angular(net, j / 12),
              ) as unknown as C.Span,
          ),
        });
      if (
        !curves
          .flatMap((c: C.Cubic): number[] => c.spans.flat(2))
          .every(Number.isFinite)
      )
        throw new Error("Unresolved binary64 arm construction");
      groups.push({ part: "arms", side, primitives: curves });
      families[side] = { arcsMm: arcs, fields, proximal: start, distal: end };
    }
    return {
      result: { groups, boundaries: [] },
      families: families as Record<
        "left" | "right",
        AutoMovieArmCurveFactory.Family
      >,
    };
  }
  /** Recover a consumed endpoint's section and dP/dmm field from the actual tensor.
   *
   * The handle difference is divided by ds/3, and the right wrist's internal half-turn phase shift is undone. Owner identity, axis and phase metadata are retained; this evaluation does not authenticate an arbitrary upstream map.
   */
  public evaluateBoundary(
    family: AutoMovieArmCurveFactory.Family,
    side: "left" | "right",
    endpoint: "proximal" | "distal",
  ): C.Boundary {
    const start: boolean = endpoint === "proximal";
    const index: number = start ? 0 : family.fields.length - 1;
    const field: AutoMovieArmCurveFactory.Tensor = family.fields[index]!;
    const ds: number = family.arcsMm[index + 1]! - family.arcsMm[index]!;
    let section: readonly C.Span[] = start ? field[0] : field[3];
    let jet: readonly C.Span[] = start
      ? A.difference(field[1], field[0], ds / 3)
      : A.difference(field[3], field[2], ds / 3);
    if (!start && side === "right") {
      section = A.rotateQuarters(section);
      jet = A.rotateQuarters(jet);
    }
    const owner: C.Boundary = start ? family.proximal : family.distal;
    return {
      id: owner.id,
      section: { ...owner.section, spans: section },
      fullJ: jet,
      longitudinalUnit: "mm",
      longitudinalAxis: owner.longitudinalAxis,
    };
  }

  /** Admit the supplied four-quarter canonical shape and constant physical jet; common publish/bind owns provenance, while variable endpoint fields remain unsupported here. */
  private requireBoundary(
    upstream: ReadonlyMap<string, C.Boundary>,
    id: string,
  ): C.Boundary {
    const b: C.Boundary | undefined = upstream.get(id);
    if (
      b === undefined ||
      b.id !== id ||
      b.section.name !== id ||
      b.section.type !== "cubicBezier" ||
      b.section.unit !== "mm" ||
      b.section.closed !== true ||
      b.section.phaseUnit !== "turn" ||
      b.section.spans.length !== 4 ||
      b.section.phaseIntervals.length !== 4 ||
      b.section.phaseIntervals.some((w: number): boolean => w !== 0.25) ||
      b.fullJ.length !== 4 ||
      b.longitudinalUnit !== "mm"
    )
      throw new Error(
        "Actual canonical four-span one-turn boundary required: " + id,
      );
    if (
      b.longitudinalAxis.length !== 3 ||
      !b.longitudinalAxis.every(Number.isFinite) ||
      Math.abs(A.norm(b.longitudinalAxis) - 1) > 1e-10 ||
      ![...b.section.spans.flat(2), ...b.fullJ.flat(2)].every(
        Number.isFinite,
      ) ||
      b.section.spans.some(
        (s: C.Span): boolean =>
          s.length !== 4 || s.some((v: C.Vector): boolean => v.length !== 3),
      ) ||
      b.fullJ.some(
        (s: C.Span): boolean =>
          s.length !== 4 || s.some((v: C.Vector): boolean => v.length !== 3),
      )
    )
      throw new Error("Invalid actual P/full-J tensor");
    const reference: C.Vector = b.fullJ[0]![0];
    if (
      b.fullJ.some((s: C.Span): boolean =>
        s.some((v: C.Vector): boolean => A.norm(A.sub(v, reference)) > 1e-10),
      ) ||
      Math.abs(A.dot(reference, b.longitudinalAxis) - 1) > 1e-10
    )
      throw new Error(
        "This port retains the original constant physical endpoint-field admission; variable-field generalization is unproven",
      );
    return b;
  }

  /** Form poles and shared node handles from dimensions in the resolved section chart; the same rolled directions define incoming and outgoing handles, giving angular C1 at each node. */
  private section(
    p: NonNullable<M.Station["skin"]>,
    origin: C.Vector,
    worldBasis: C.Matrix,
  ): C.Span[] {
    const basis: C.Matrix = A.product(worldBasis, p.sectionBasisInSegment);
    const [u, v, n]: readonly C.Vector[] = A.transpose(basis);
    const angle: number = (p.rollOffsetDegrees * Math.PI) / 180;
    const co: number = Math.cos(angle);
    const si: number = Math.sin(angle);
    const points: C.Vector[] = [0, 1, 2, 3].map((i: number): C.Vector => {
      const du: number = (p.cardinalShapeURatios[i]! * p.breadthMm) / 2;
      const dv: number = (p.cardinalShapeVRatios[i]! * p.depthMm) / 2;
      return A.add(
        A.add(
          A.add(origin, A.scale(u!, p.centerOffsetUmm + du * co - dv * si)),
          A.scale(v!, p.centerOffsetVmm + du * si + dv * co),
        ),
        A.scale(n!, p.cardinalNormalOffsetsMm[i]!),
      );
    });
    const rolledU: C.Vector = A.add(A.scale(u!, co), A.scale(v!, si));
    const rolledV: C.Vector = A.add(A.scale(u!, -si), A.scale(v!, co));
    const directions: C.Vector[] = [
      rolledV,
      A.scale(rolledU, -1),
      A.scale(rolledV, -1),
      rolledU,
    ];
    const handles: number[] = [0, 1, 2, 3].map(
      (i: number): number =>
        p.quarterRoundingRatio *
        (p.roundingRule === "oppositeCardinalSpan"
          ? A.norm(A.sub(points[i % 2]!, points[(i % 2) + 2]!)) / 2
          : Math.min(
              Math.abs(
                A.dot(A.sub(points[(i + 1) % 4]!, points[i]!), directions[i]!),
              ),
              Math.abs(
                A.dot(A.sub(points[i]!, points[(i + 3) % 4]!), directions[i]!),
              ),
            )),
    );
    // The original opposite-span rule uses the opposite axis for each tangent.
    if (p.roundingRule === "oppositeCardinalSpan") {
      const h: number[] = [...handles];
      for (let i: number = 0; i < 4; i++) handles[i] = h[(i + 1) % 4]!;
    }
    return [0, 1, 2, 3].map(
      (i: number): C.Span => [
        points[i]!,
        A.add(points[i]!, A.scale(directions[i]!, handles[i]!)),
        A.sub(
          points[(i + 1) % 4]!,
          A.scale(directions[(i + 1) % 4]!, handles[(i + 1) % 4]!),
        ),
        points[(i + 1) % 4]!,
      ],
    );
  }

  /** Check finite dimensions, fixed course topology and orientation-preserving nonsingular section charts; this is numerical construction admission, not biological validation or an orthogonality fit. */
  private admit(): void {
    if (
      typeof this.measurements.identity !== "string" ||
      !this.measurements.identity
    )
      throw new Error("A measured identity is required");
    for (const side of ["left", "right"] as const) {
      const p: M.Side = this.measurements.sides[side];
      if (
        ![p.upperArmLengthMm, p.forearmLengthMm].every(
          (x: number): boolean => Number.isFinite(x) && x > 0,
        ) ||
        p.stations.length !== 8
      )
        throw new Error(
          "Two positive segment lengths and the original eight named stations are required",
        );
      const names: Set<string> = new Set();
      for (const [i, s] of p.stations.entries()) {
        if (
          typeof s.name !== "string" ||
          !s.name ||
          names.has(s.name) ||
          !["upperarm", "elbow", "forearm"].includes(s.segment) ||
          !Number.isFinite(s.mechanicalFraction) ||
          s.mechanicalFraction < 0 ||
          s.mechanicalFraction > 1
        )
          throw new Error("Invalid named mechanical station");
        if (
          s.segment !==
            [
              "upperarm",
              "upperarm",
              "upperarm",
              "elbow",
              "forearm",
              "forearm",
              "forearm",
              "forearm",
            ][i] ||
          (s.segment === "elbow" && s.mechanicalFraction !== 0)
        )
          throw new Error(
            "The original section topology and elbow joint station must be retained",
          );
        names.add(s.name);
        if (
          s.longitudinalTangent !== undefined &&
          (s.longitudinalTangent !== "segment-axis" ||
            i === 0 ||
            i === p.stations.length - 1)
        )
          throw new Error(
            "Only an interior support can request a segment-axis continuation; owner jets cannot be replaced",
          );
        if (i === 0 || i === p.stations.length - 1) {
          if (s.skin !== undefined)
            throw new Error(
              "Canonical owner skin cannot be independently parameterized",
            );
          continue;
        }
        const q: NonNullable<M.Station["skin"]> | undefined = s.skin;
        if (
          q === undefined ||
          ![q.breadthMm, q.depthMm, q.quarterRoundingRatio].every(
            (x: number): boolean => Number.isFinite(x) && x > 0,
          ) ||
          q.quarterRoundingRatio > 1 ||
          ![
            q.centerOffsetUmm,
            q.centerOffsetVmm,
            q.rollOffsetDegrees,
            ...q.originOffsetInSegmentMm,
            ...q.cardinalShapeURatios,
            ...q.cardinalShapeVRatios,
            ...q.cardinalNormalOffsetsMm,
            ...q.sectionBasisInSegment.flat(),
          ].every(Number.isFinite) ||
          q.originOffsetInSegmentMm.length !== 3 ||
          q.sectionBasisInSegment.length !== 3 ||
          q.sectionBasisInSegment.some(
            (row: C.Vector): boolean => row.length !== 3,
          ) ||
          [
            q.cardinalShapeURatios,
            q.cardinalShapeVRatios,
            q.cardinalNormalOffsetsMm,
          ].some((a: readonly number[]): boolean => a.length !== 4) ||
          ![
            "oppositeCardinalSpan",
            "minimumAdjacentCardinalProjection",
          ].includes(q.roundingRule)
        )
          throw new Error("Invalid finite sparse skin measurements");
        // Preserve the supplied general linear chart: orthonormalizing it would change its section poles and handles.
        const columns: C.Matrix = A.transpose(q.sectionBasisInSegment);
        const determinant: number =
          columns[0][0] *
            (columns[1][1] * columns[2][2] - columns[1][2] * columns[2][1]) -
          columns[1][0] *
            (columns[0][1] * columns[2][2] - columns[0][2] * columns[2][1]) +
          columns[2][0] *
            (columns[0][1] * columns[1][2] - columns[0][2] * columns[1][1]);
        if (!Number.isFinite(determinant) || determinant <= 0)
          throw new Error(
            "Measured section chart must be finite, nonsingular and proper",
          );
      }
      if (
        p.stations[0]!.segment !== "upperarm" ||
        p.stations.at(-1)!.segment !== "forearm"
      )
        throw new Error("Owner boundaries must bracket the mechanical chain");
    }
  }
}
export namespace AutoMovieArmCurveFactory {
  /** Four longitudinal Bernstein rows, each holding the same four angular cubic spans in world millimetres. */
  export type Tensor = readonly [
    readonly C.Span[],
    readonly C.Span[],
    readonly C.Span[],
    readonly C.Span[],
  ];

  /** Actual tensors and owner operators needed to inspect physical endpoint continuation.
   *
   * @author Samchon
   */
  export interface Family {
    /** Increasing shoulder-relative mechanical arc coordinates in millimetres, one per ring; an owner skin ring can be offset from its nominal joint course. */
    arcsMm: readonly number[];

    /** One tensor per adjacent ring pair; its local parameter is normalized over that pair's physical arc interval. */
    fields: readonly Tensor[];

    /** Torso-owned upper-arm section and physical jet as supplied to this construction. */
    proximal: C.Boundary;

    /** Hand-owned wrist section and physical jet in canonical owner phase order. */
    distal: C.Boundary;
  }

  /** Primitive delivery and the interpolation fields that generated it.
   *
   * @author Samchon
   */
  export interface Generated {
    /** Both side groups; this consumer publishes no newly owned endpoint boundaries. */
    result: R.Result;

    /** Side-specific tensors used by evaluateBoundary, without fitting display samples. */
    families: Record<"left" | "right", Family>;
  }
}
