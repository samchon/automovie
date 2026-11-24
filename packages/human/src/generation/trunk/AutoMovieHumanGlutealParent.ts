import {
  AutoMovieConstructionViews,
  AutoMovieIllinois,
  AutoMovieLoftSectionNative,
  AutoMovieLoftViewRead,
  AutoMovieLoftViewSource,
  AutoMovieSolidVector,
  AutoMovieViewAxis,
  AutoMovieViewOutline,
} from "@automovie/engine";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieConstructionView,
  IAutoMovieHumanGlutealCut,
  IAutoMovieHumanGlutealParent,
  IAutoMovieLoftViewRead,
  IAutoMovieLoftViewSource,
  IAutoMovieViewAxis,
  IAutoMovieViewOutline,
  IAutoMovieViewPart,
} from "@automovie/interface";

import { AutoMovieHumanGlutealCut } from "./AutoMovieHumanGlutealCut";

/** A calibration-mm point or dimensionless direction. */
type Vec3 = AutoMovieVector3Tuple;

/** One admitted original source, before lofting or Boolean assembly. */
interface Field {
  /** Identical original production part, including its actual frame owner. */
  part: IAutoMovieViewPart;
  /** Prepared original scalar/fullness/cap owner. */
  source: IAutoMovieLoftViewSource.ISource;
}

/** Existing scalar meeting accuracy, in calibration millimetres. */
const TOLERANCE: number = 1e-9;

/** Bounded discovery subdivisions; absence of a bracket is not an absence proof. */
const BRACKETS: number = 16;

/** Source-native parent chords for a gluteal footprint; no emitted skin is read. */
export namespace AutoMovieHumanGlutealParent {
  /**
   * Read original cut points and their actual physical station/phase once for
   * the tape and its support provenance.
   */
  export function levelCutRecords(
    part: IAutoMovieViewPart,
    y: number,
    count: number,
  ): IAutoMovieHumanGlutealCut.IPoint[] | string {
    return AutoMovieHumanGlutealCut.records(part, y, count);
  }

  /**
   * Read a named world-height cut of the identical original parent field, in
   * calibration-mm X/Z.
   */
  export function levelCut(
    part: IAutoMovieViewPart,
    y: number,
    count: number,
  ): IAutoMovieHumanGlutealParent.LevelCutResult {
    return AutoMovieHumanGlutealCut.create(part, y, count);
  }

  /** Read one actual trunk without inventing an unrelated leg parent. */
  export function trunkOnly(
    part: IAutoMovieViewPart,
  ): IAutoMovieHumanGlutealParent.IParent | string {
    const field: Field | string = prepare(part);
    if (typeof field === "string") return field;
    return {
      parts: [part],
      sources: [field],
      chord(
        y: number,
        z: number,
      ): IAutoMovieHumanGlutealParent.IChord[] | string {
        if (![y, z].every(Number.isFinite))
          return "Trunk contact needs finite world Y/Z.";
        return trunkChord(field, y, z);
      },
    };
  }

  /**
   * Prepare the actual trunk and same leg once; values and jets remain separate
   * capabilities.
   */
  export function create(
    trunk: IAutoMovieViewPart,
    leg: IAutoMovieHumanGlutealParent.ICreateLeg,
  ): IAutoMovieHumanGlutealParent.IParent | string {
    const upper: Field | string = prepare(trunk);
    const lower: Field | string = prepare(leg.part);
    if (typeof upper === "string" || typeof lower === "string")
      return typeof upper === "string" ? upper : (lower as string);
    const lowerReader:
      | ((
          y: number,
          z: number,
        ) => IAutoMovieHumanGlutealParent.IChord[] | string)
      | string = legReader(lower, leg.view);
    if (typeof lowerReader === "string") return lowerReader;
    return {
      parts: [trunk, leg.part],
      sources: [upper, lower],
      chord(
        y: number,
        z: number,
      ): IAutoMovieHumanGlutealParent.IChord[] | string {
        if (![y, z].every(Number.isFinite))
          return "Gluteal parent contact needs finite world Y/Z.";
        const a: IAutoMovieHumanGlutealParent.IChord[] | string = trunkChord(
          upper,
          y,
          z,
        );
        const b: IAutoMovieHumanGlutealParent.IChord[] | string = lowerReader(
          y,
          z,
        );
        if (typeof a === "string" || typeof b === "string")
          return typeof a === "string" ? a : (b as string);
        return unite([...a, ...b]);
      },
    };
  }
}

/**
 * Retain the full original source, refusing unavailable direct fullness
 * explicitly.
 */
function prepare(part: IAutoMovieViewPart): Field | string {
  const result: IAutoMovieLoftViewSource.IResult | null =
    AutoMovieLoftViewSource.create(part);
  if (result === null)
    return `${part.name}: gluteal contact needs the actual prepared direct-fullness source.`;
  if (result.source === null)
    return `${part.name}: ${JSON.stringify(result.diagnostics)}`;
  return { part, source: result.source };
}

/**
 * Read the actual level trunk's value-only native point, retaining its local
 * values in an explicit rejection.
 */
function trunkChord(
  field: Field,
  y: number,
  z: number,
): IAutoMovieHumanGlutealParent.IChord[] | string {
  const [first, last]: readonly [number, number] = field.source.domain;
  const bottom = field.part.axis.at(first),
    top = field.part.axis.at(last);
  const station: number = first + (y - bottom.origin[1]);
  if (
    !(
      Number.isFinite(station) &&
      Math.abs(top.origin[1] - bottom.origin[1] - (last - first)) <= TOLERANCE
    )
  )
    return (
      field.part.name +
      ": AP contact needs its registered level station course."
    );
  if (station < first || station > last) return [];
  const frame: ReturnType<IAutoMovieViewPart["axis"]["at"]> =
    field.part.axis.at(station);
  if (
    Math.abs(frame.origin[1] - y) > TOLERANCE ||
    frame.u.some(
      (value: number, axis: number): boolean => value !== [1, 0, 0][axis],
    ) ||
    frame.v.some(
      (value: number, axis: number): boolean => value !== [0, 0, 1][axis],
    )
  )
    return `${field.part.name}: contact needs its actual level +X/+Z frame.`;
  const values: IAutoMovieLoftViewRead.IValues | string =
    AutoMovieLoftViewRead.values(field.source, station);
  if (typeof values === "string") return values;
  const across: number = z - frame.origin[2];
  if (values.extents.every((value: number): boolean => value === 0))
    return Math.abs(across) <= TOLERANCE
      ? [
          {
            back: boundary(field, frame.origin[0], station, 0),
            front: boundary(field, frame.origin[0], station, 0),
          },
        ]
      : [];
  if (across > values.extents[1]! || across < -values.extents[3]!) return [];
  try {
    const read: ReturnType<typeof AutoMovieLoftSectionNative.point> =
      AutoMovieLoftSectionNative.point(values);
    const at: (
      a: number,
      b: number,
    ) => IAutoMovieHumanGlutealParent.IBoundary | string = (
      a: number,
      b: number,
    ): IAutoMovieHumanGlutealParent.IBoundary | string => {
      const phase: number | null = AutoMovieIllinois.root(
        (phi: number): number => read(phi)[1] - across,
        a,
        b,
        TOLERANCE,
        100,
      );
      if (phase === null || Math.abs(read(phase)[1] - across) > TOLERANCE)
        return `${field.part.name}: no admitted local AP chord root.`;
      return boundary(field, frame.origin[0] + read(phase)[0], station, phase);
    };
    const back: IAutoMovieHumanGlutealParent.IBoundary | string = at(
      Math.PI / 2,
      (3 * Math.PI) / 2,
    );
    const front: IAutoMovieHumanGlutealParent.IBoundary | string = at(
      -Math.PI / 2,
      Math.PI / 2,
    );
    return typeof back === "string" || typeof front === "string"
      ? typeof back === "string"
        ? back
        : (front as string)
      : [{ back, front }];
  } catch (error: unknown) {
    return `${field.part.name}: local AP chord at world Y/Z [${y}, ${z}] mm, source station ${station} mm, extents [${values.extents.join(", ")}] mm, shoulders [${values.shoulders.join(", ")}]: ${error instanceof Error ? error.message : String(error)}`;
  }
}

/**
 * Prepare the actual proximal course; an AP query changes station as well as
 * phase.
 */
function legReader(
  field: Field,
  view: IAutoMovieConstructionView,
):
  | ((y: number, z: number) => IAutoMovieHumanGlutealParent.IChord[] | string)
  | string {
  if (view.axis.type !== "jointed")
    return `${field.part.name}: gluteal contact needs the actual jointed leg declaration.`;
  const centres: Vec3[] = view.axis.centres.map(
    AutoMovieConstructionViews.point,
  );
  const runs: IAutoMovieViewAxis.IRun[] | string = AutoMovieViewAxis.runs(
    centres,
    view.axis.halves.map(
      (value: number): number => value * AutoMovieConstructionViews.SCALE,
    ),
  );
  if (typeof runs === "string") return runs;
  if (runs[1] === undefined || centres[2] === undefined)
    return `${field.part.name}: no actual proximal femur course.`;
  const domain: [number, number] = [
    field.source.domain[0],
    Math.min(field.source.domain[1], runs[1].end),
  ];
  const bounds: [number, number] | string = apBounds(
    field,
    domain,
    centres.slice(0, 3),
  );
  if (typeof bounds === "string") return bounds;
  const frame: ReturnType<IAutoMovieViewPart["axis"]["at"]> =
    field.part.axis.at(domain[0]);
  const end: typeof frame = field.part.axis.at(domain[1]);
  const normal: Vec3 = AutoMovieViewAxis.normal(frame);
  const endOnLine: Vec3 = AutoMovieSolidVector.add(
    frame.origin,
    AutoMovieSolidVector.scale(normal, domain[1] - domain[0]),
  );
  if (
    AutoMovieSolidVector.norm(AutoMovieSolidVector.sub(end.origin, endOnLine)) >
      TOLERANCE ||
    AutoMovieSolidVector.norm(AutoMovieSolidVector.sub(end.u, frame.u)) >
      TOLERANCE ||
    AutoMovieSolidVector.norm(AutoMovieSolidVector.sub(end.v, frame.v)) >
      TOLERANCE
  )
    return `${field.part.name}: AP contact needs its straight proximal material frame.`;
  const prepared: ReturnType<typeof AutoMovieLoftViewRead.prepare> =
    AutoMovieLoftViewRead.prepare(field.source);
  const lateral = (quarter: 1 | 3) => {
    const outline: IAutoMovieViewOutline.IOutline =
      field.source.extents[quarter];
    return {
      outline,
      stationary: [
        ...outline.knots.map(({ station }): number => station),
        ...AutoMovieViewOutline.criticalStations(outline),
      ],
    };
  };
  const negative = lateral(3);
  const positive = lateral(1);
  const extreme = (
    side: ReturnType<typeof lateral>,
    lo: number,
    hi: number,
    sign: -1 | 1,
  ): number | string => {
    let largest: number = -Infinity;
    for (const s of [
      lo,
      hi,
      ...side.stationary.filter((s: number): boolean => lo < s && s < hi),
    ]) {
      const value: number | string = AutoMovieViewOutline.value(
        side.outline,
        s,
      );
      if (typeof value === "string") return value;
      largest = Math.max(largest, sign * value);
    }
    return sign * largest;
  };
  return (
    y: number,
    z: number,
  ): IAutoMovieHumanGlutealParent.IChord[] | string => {
    const position = (x: number): Vec3 =>
      AutoMovieSolidVector.sub([x, y, z], frame.origin);
    const stationOf = (delta: Vec3): number =>
      domain[0] + AutoMovieSolidVector.dot(delta, normal);
    const a: Vec3 = position(bounds[0]);
    const b: Vec3 = position(bounds[1]);
    const sa: number = stationOf(a);
    const sb: number = stationOf(b);
    const lo: number = Math.max(domain[0], Math.min(sa, sb));
    const hi: number = Math.min(domain[1], Math.max(sa, sb));
    if (lo > hi + TOLERANCE) return [];
    const va: number = AutoMovieSolidVector.dot(a, frame.v);
    const vb: number = AutoMovieSolidVector.dot(b, frame.v);
    const medial: number | string = extreme(negative, Math.min(lo, hi), hi, -1);
    const outward: number | string = extreme(positive, Math.min(lo, hi), hi, 1);
    if (typeof medial === "string" || typeof outward === "string")
      return typeof medial === "string" ? medial : (outward as string);
    if (
      Math.max(va, vb) < medial - TOLERANCE ||
      Math.min(va, vb) > outward + TOLERANCE
    )
      return [];

    const evaluate: (x: number) => Reading | string | null = (
      x: number,
    ): Reading | string | null => {
      const delta: Vec3 = position(x);
      const station: number = stationOf(delta);
      if (station < domain[0] || station > domain[1]) return null;
      return radial(
        station,
        AutoMovieSolidVector.dot(delta, frame.u),
        AutoMovieSolidVector.dot(delta, frame.v),
        prepared,
      );
    };
    const starts: number[] = Array.from(
      { length: BRACKETS + 1 },
      (_: unknown, i: number): number =>
        bounds[0] + ((bounds[1] - bounds[0]) * i) / BRACKETS,
    );
    const readings: { x: number; value: Reading | null }[] = [];
    for (const x of starts) {
      const value: Reading | string | null = evaluate(x);
      if (typeof value === "string") return value;
      readings.push({ x, value });
    }
    const intersections: IAutoMovieHumanGlutealParent.IBoundary[] = [];
    for (let i: number = 1; i < readings.length; i++) {
      const a: (typeof readings)[number] = readings[i - 1]!;
      const b: (typeof readings)[number] = readings[i]!;
      if (
        a.value === null ||
        b.value === null ||
        a.value.residual * b.value.residual > 0
      )
        continue;
      const root: number | null = AutoMovieIllinois.root(
        (x: number): number => {
          if (x === a.x) return a.value!.residual;
          if (x === b.x) return b.value!.residual;
          const at: Reading | string | null = evaluate(x);
          return typeof at === "object" && at !== null ? at.residual : NaN;
        },
        a.x,
        b.x,
        TOLERANCE,
        100,
      );
      if (root === null)
        return `${field.part.name}: AP contact root did not converge.`;
      const at: Reading | string | null = evaluate(root);
      if (
        typeof at !== "object" ||
        at === null ||
        Math.abs(at.residual) > TOLERANCE
      )
        return `${field.part.name}: AP contact has no admitted source residual.`;
      if (
        !intersections.some(
          (old: IAutoMovieHumanGlutealParent.IBoundary): boolean =>
            Math.abs(old.x - root) <= TOLERANCE,
        )
      )
        intersections.push(boundary(field, root, at.station, at.phase));
    }
    if (intersections.length === 0)
      return `${field.part.name}: bounded AP search at world Y/Z [${y}, ${z}] mm in source stations [${lo}, ${hi}] mm has no admitted contact bracket; absence is not established.`;
    if (intersections.length % 2 !== 0)
      return `${field.part.name}: AP contact leaves its proximal source domain or has an unresolved tangency.`;
    const chords: IAutoMovieHumanGlutealParent.IChord[] = [];
    for (let i: number = 0; i < intersections.length; i += 2)
      chords.push({ back: intersections[i]!, front: intersections[i + 1]! });
    return chords;
  };
}

/**
 * Value-only radial residual in the actual source plane, without a closest
 * surface foot.
 */
interface Reading {
  /** Query distance minus the actual whole-section radius, mm. */
  residual: number;
  /** Actual source-plane station, mm. */
  station: number;
  /** Original local polar phase, radians. */
  phase: number;
}

/** Value-only radial residual at the exact projection onto the straight femur. */
function radial(
  station: number,
  u: number,
  v: number,
  prepared: ReturnType<typeof AutoMovieLoftViewRead.prepare>,
): Reading | string {
  const phase: number = Math.atan2(v, u);
  const values: IAutoMovieLoftViewRead.IValues | string =
    prepared.values(station);
  if (typeof values === "string") return values;
  if (values.extents.every((value: number): boolean => value === 0))
    return { residual: Math.hypot(u, v), station, phase };
  try {
    const local: [number, number] =
      AutoMovieLoftSectionNative.point(values)(phase);
    return {
      residual: Math.hypot(u, v) - Math.hypot(...local),
      station,
      phase,
    };
  } catch (error: unknown) {
    return error instanceof Error ? error.message : String(error);
  }
}

/**
 * Conservative original-source box used only to bracket the local implicit
 * residual.
 */
function apBounds(
  field: Field,
  domain: [number, number],
  centres: Vec3[],
): [number, number] | string {
  let radius: number = 0;
  for (const outline of field.source.extents) {
    const stations: number[] = [
      domain[0],
      domain[1],
      ...outline.knots.map((k: IAutoMovieViewPart.IKnot): number => k.station),
      ...AutoMovieViewOutline.criticalStations(outline),
    ].filter((s: number): boolean => s >= domain[0] && s <= domain[1]);
    for (const station of stations) {
      const value: number | string = AutoMovieViewOutline.value(
        outline,
        station,
      );
      if (typeof value === "string") return value;
      radius = Math.max(radius, Math.abs(value));
    }
  }
  const reach: number = Math.SQRT2 * radius;
  return [
    Math.min(...centres.map((p: Vec3): number => p[0])) - reach,
    Math.max(...centres.map((p: Vec3): number => p[0])) + reach,
  ];
}

/** A source-owned endpoint; no scalar jet is invented by the contact solve. */
function boundary(
  field: Field,
  x: number,
  station: number,
  phase: number,
): IAutoMovieHumanGlutealParent.IBoundary {
  return { x, owner: field.part.name, station, phase };
}

/** Union only local occupied AP intervals, retaining each actual outer owner. */
function unite(
  chords: IAutoMovieHumanGlutealParent.IChord[],
): IAutoMovieHumanGlutealParent.IChord[] {
  const sorted: IAutoMovieHumanGlutealParent.IChord[] = [...chords].sort(
    (
      a: IAutoMovieHumanGlutealParent.IChord,
      b: IAutoMovieHumanGlutealParent.IChord,
    ): number => a.back.x - b.back.x,
  );
  const out: IAutoMovieHumanGlutealParent.IChord[] = [];
  for (const chord of sorted) {
    const last: IAutoMovieHumanGlutealParent.IChord | undefined = out.at(-1);
    if (last === undefined || chord.back.x > last.front.x + TOLERANCE)
      out.push({ ...chord });
    else if (chord.front.x > last.front.x) last.front = chord.front;
  }
  return out;
}
