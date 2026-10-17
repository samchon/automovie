import type { IAutoMovieCurve64 as C } from "@automovie/engine";

import { AutoMovieFootBoundary64 as A } from "./AutoMovieFootBoundary64";
import { AutoMovieFootMath64 as M } from "./AutoMovieFootMath64";
import { AutoMovieFootProfile64 as P } from "./AutoMovieFootProfile64";
import type { IAutoMovieFootDimensions64 as D } from "./IAutoMovieFootDimensions64";

/** The same sparse support functions emit guides and arbitrary-distance sections. */
export namespace AutoMovieFootFamily64 {
  /**
   * Generated world-millimetre guide or transverse course, before primitive emission.
   * Optional metadata binds display courses back to their generating operator.
   *
   * @author Samchon
   */
  export interface Curve {
    /** Stable semantic name within the bilateral foot network. */
    name: string;

    /** Whether the final span rejoins the first; not a regularity certificate. */
    closed: boolean;

    /** Ordered cubic P0/P1/P2/P3 coefficients in world millimetres. */
    spans: C.Span[];

    /** Internal construction purpose, such as section, guide or shared boundary. */
    role: string;

    /** Support key used when registering this longitudinal guide. */
    supportSemantic?: string;

    /** A rear cap span was prepended and needs an additional heel knot. */
    heelCap?: boolean;

    /** A distal cap span was appended and needs an additional tip knot. */
    tipCap?: boolean;

    /** Family whose section operator replaces this course's initial empty spans. */
    familyKey?: string;

    /** Requested local forward section distance in millimetres. */
    station?: number;

    /** Published phase widths; absent widths default to one unit per emitted span. */
    intervals?: number[];

    /** Published phase unit; absence selects the normalized display chart. */
    phaseUnit?: C.Cubic["phaseUnit"];
  }

  /**
   * Semantic support row at a physical forward distance in the foot frame.
   *
   * @author Samchon
   */
  export interface Row {
    /** Local forward Z in millimetres, increasing from heel toward toes. */
    distance: number;

    /** World-millimetre support points keyed by the same semantics across rows. */
    points: Record<string, C.Vector>;
  }

  /**
   * A longitudinal support guide with physical station knots for section queries.
   *
   * @author Samchon
   */
  export interface Operator {
    /** Forward-millimetre knots; one more knot than cubic spans. */
    knots: number[];

    /** Actual guide controls, shared with its emitted generating curve. */
    spans: C.Span[];

    /** Guide name used to trace the operator to the construction network. */
    name: string;
  }

  /**
   * One foot's generated operators and current upstream ankle dependency.
   * Construction appends curves and registers support guides in place.
   *
   * @author Samchon
   */
  export interface Model {
    /** Foot origin and orthonormal outward/up/forward axes, with anatomical chirality. */
    frame: M.Frame;

    /** Actual bound leg-owned ankle, retained rather than independently rebuilt. */
    ankle: C.Boundary;

    /** Ankle-to-collar control tensor preserving the supplied proximal-mm jet. */
    tensor: A.Tensor;

    /** Positive collar drop in proximal-chart millimetres. */
    drop: number;

    /** Lower collar angular controls in world millimetres. */
    collar: C.Span[];

    /** Mutable generating curves ultimately converted to published cubic primitives. */
    curves: Curve[];

    /** Family key, then support semantic, then available physical guide operators. */
    families: Record<string, Record<string, Operator[]>>;
  }

  /**
   * Transverse cubic course reconstructed from the current support family.
   *
   * @author Samchon
   */
  export interface Section {
    /** Rearfoot courses meeting two collar hits remain open; other courses close. */
    closed: boolean;

    /** World-millimetre angular controls in the selected support order. */
    spans: C.Span[];

    /** Semantic support key to its starting angular span index. */
    indices: Record<string, number>;
  }

  /**
   * Expand width/height proportions into local outward/up/forward supports.
   * All scalar positions are millimetres; optional profile fractions add quarter
   * supports, while absent fractions leave only the four cardinal supports.
   */
  export function profile(
    p: D.Profile,
    center: number,
    width: number,
    sole: number,
    top: number,
    w: number,
  ): Record<string, C.Vector> {
    return P.profile(p, center, width, sole, top, w);
  }
  /**
   * Interpolate each available semantic support across increasing physical Z rows.
   * PCHIP slopes are computed in the local foot chart, then transported into world
   * jets and cubic handles with interval/3 scaling. Semantics with fewer than two
   * rows emit no rail. No samples of a separately authored surface are fitted.
   */
  export function rails(
    name: string,
    stations: readonly Row[],
    semantics: readonly string[],
    frame: M.Frame,
  ): Curve[] {
    const result: Curve[] = [];
    for (const semantic of semantics) {
      const rows: Row[] = stations.filter(
        (r: Row): boolean => r.points[semantic] !== undefined,
      );
      if (rows.length < 2) continue;
      const x: number[] = rows.map((r: Row): number => r.distance);
      const values: C.Vector[] = rows.map(
        (r: Row): C.Vector => r.points[semantic]!,
      );
      const local: C.Vector[] = values.map(
        (v: C.Vector): C.Vector => M.local(frame, v),
      );
      const derivatives: number[][] = [0, 1, 2].map((axis: number): number[] =>
        M.pchip(
          x,
          local.map((v: C.Vector): number => v[axis]!),
        ),
      );
      const jets: C.Vector[] = rows.map(
        (_: Row, i: number): C.Vector =>
          M.direction(frame.basis, [
            derivatives[0]![i]!,
            derivatives[1]![i]!,
            derivatives[2]![i]!,
          ]),
      );
      const spans: C.Span[] = x
        .slice(1)
        .map(
          (v: number, i: number): C.Span => [
            values[i]!,
            M.add(values[i]!, M.mul(jets[i]!, (v - x[i]!) / 3)),
            M.sub(values[i + 1]!, M.mul(jets[i + 1]!, (v - x[i]!) / 3)),
            values[i + 1]!,
          ],
        );
      result.push({
        name: name + "." + semantic,
        role: "generatingGuide",
        closed: false,
        spans,
        supportSemantic: semantic,
      });
    }
    return result;
  }
  /**
   * Associate emitted support controls with their physical forward knots.
   * Heel/tip caps add their corresponding knots. Registers references in model.families
   * so section evaluation and display use the same controls. A knot/span mismatch throws.
   */
  export function register(
    model: Model,
    key: string,
    curves: readonly Curve[],
    rows: readonly Row[],
    heel?: number,
    tip?: number,
  ): void {
    const family: Record<string, Operator[]> =
      model.families[key] ?? (model.families[key] = {});
    for (const curve of curves) {
      const semantic: string | undefined = curve.supportSemantic;
      if (!semantic) continue;
      const knots: number[] = rows
        .filter((r: Row): boolean => r.points[semantic] !== undefined)
        .map((r: Row): number => r.distance);
      if (curve.heelCap) knots.unshift(heel!);
      if (curve.tipCap) knots.push(tip!);
      if (knots.length !== curve.spans.length + 1)
        throw new Error("Support knots must describe actual curve spans");
      (family[semantic] ?? (family[semantic] = [])).push({
        knots,
        spans: curve.spans,
        name: curve.name,
      });
    }
  }
  /**
   * Evaluate a transverse course from registered guides at forward distance in millimetres.
   * Selects a containing or nearest operator for each semantic. In-range queries invert
   * its monotone forward coordinate with 48 bisections; outside knots use the existing
   * polynomial extrapolation policy. Two main-collar hits produce an open rearfoot
   * course with collar jets; otherwise ordered foot or toe supports produce a closed course.
   * Unknown families throw; callers must supply the required semantic coverage.
   */
  export function section(
    model: Model,
    key: string,
    distance: number,
  ): Section {
    const family: Record<string, Operator[]> | undefined = model.families[key];
    if (!family) throw new Error("Unknown foot family " + key);
    const frame: M.Frame = model.frame;
    const world: Record<string, C.Vector> = {};
    for (const [semantic, operators] of Object.entries(family)) {
      const cost: (op: Operator) => number = (op: Operator): number =>
        distance >= op.knots[0]! && distance <= op.knots[op.knots.length - 1]!
          ? 0
          : Math.min(
              Math.abs(distance - op.knots[0]!),
              Math.abs(distance - op.knots[op.knots.length - 1]!),
            );
      const op: Operator = operators.reduce(
        (a: Operator, b: Operator): Operator => (cost(b) < cost(a) ? b : a),
      );
      let index: number = 0;
      while (index < op.knots.length - 2 && distance >= op.knots[index + 1]!)
        index++;
      const span: C.Span = op.spans[index]!;
      if (
        distance < op.knots[0]! ||
        distance > op.knots[op.knots.length - 1]!
      ) {
        const a: number = M.local(frame, span[0])[2];
        const b: number = M.local(frame, span[3])[2];
        world[semantic] = M.bezier(span, (distance - a) / (b - a));
        continue;
      }
      let lo: number = 0;
      let hi: number = 1;
      for (let i: number = 0; i < 48; i++) {
        const t: number = (lo + hi) / 2;
        if (M.local(frame, M.bezier(span, t))[2] < distance) lo = t;
        else hi = t;
      }
      world[semantic] = M.bezier(span, (lo + hi) / 2);
    }
    const up: C.Vector = frame.basis[1];
    const outward: C.Vector = frame.basis[0];
    let names: string[];
    let points: C.Vector[];
    let closed: boolean;
    let cardinals: Record<number, C.Vector>;
    let jets: readonly [C.Vector, C.Vector] | undefined;
    const hits: [C.Vector, C.Vector][] =
      key === "main"
        ? M.intersections(
            model.collar,
            A.fullJ(model.tensor, 1),
            frame,
            distance,
          )
        : [];
    if (hits.length === 2) {
      names = [
        "ankleOuterShoulder",
        "outer",
        "plantarOuter",
        "sole",
        "plantarInner",
        "inner",
        "ankleInnerShoulder",
      ];
      points = [
        hits[1]![0],
        ...names.map((n: string): C.Vector => world[n]!),
        hits[0]![0],
      ];
      closed = false;
      cardinals = { 2: M.mul(up, -1), 4: M.mul(outward, -1), 6: up };
      jets = [hits[1]![1], hits[0]![1]];
    } else if (key === "main") {
      return {
        closed: true,
        spans: P.closed(world, up, outward),
        indices: Object.fromEntries(
          P.names.map((name: string, i: number): [string, number] => [name, i]),
        ),
      };
    } else {
      names = ["outer", "dorsum", "inner", "sole"];
      points = names.map((n: string): C.Vector => world[n]!);
      closed = true;
      cardinals = {
        0: up,
        1: M.mul(outward, -1),
        2: M.mul(up, -1),
        3: outward,
      };
    }
    const indices: Record<string, number> = Object.fromEntries(
      names.map((n: string, i: number): [string, number] => [
        n,
        i + (closed ? 0 : 1),
      ]),
    );
    return {
      closed,
      spans: M.course(points, closed, up, cardinals, jets),
      indices,
    };
  }
  /**
   * Query a world-millimetre point on the same evaluated section.
   * A string selects a semantic support; numeric theta in [0,1] divides the angular
   * course equally by span count, not by arc length or physical longitudinal phase.
   * The caller must provide an available semantic or supported numeric range.
   */
  export function point(
    model: Model,
    key: string,
    distance: number,
    theta: number | string,
  ): C.Vector {
    const s: Section = section(model, key, distance);
    if (typeof theta === "string") return s.spans[s.indices[theta]!]![0];
    const phase: number = theta * s.spans.length;
    const index: number = Math.min(Math.trunc(phase), s.spans.length - 1);
    return M.bezier(s.spans[index]!, phase - index);
  }
  /**
   * Expose the actual generated spans without refitting or copying their controls.
   * Explicit phase units/intervals are retained; guides without them use one normalized
   * unit per span. This display metadata does not change the physical section operator.
   */
  export function primitive(curve: Curve): C.Cubic {
    return {
      type: "cubicBezier",
      name: curve.name,
      closed: curve.closed,
      unit: "mm",
      phaseUnit: curve.phaseUnit ?? "normalized",
      phaseIntervals: curve.intervals ?? curve.spans.map((): number => 1),
      spans: curve.spans,
    };
  }
}
