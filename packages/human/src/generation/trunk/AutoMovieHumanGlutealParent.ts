import {
  AutoMovieConstructionViews,
  AutoMovieIllinois,
  AutoMovieLoftSectionNative,
  AutoMovieLoftViewRead,
  AutoMovieLoftViewSource,
  AutoMovieSolidVector,
  AutoMovieViewAxis,
  AutoMovieViewOutline,
  type IAutoMovieViewPart,
} from "@automovie/engine";
import type { IAutoMovieConstructionView } from "@automovie/interface";

import { AutoMovieHumanGlutealCut } from "./AutoMovieHumanGlutealCut";

/** A calibration-mm point or dimensionless direction. */
type Vec3 = AutoMovieSolidVector.Vec3;

/** One admitted original source, before lofting or Boolean assembly. */
interface Field {
  /** Identical original production part, including its actual frame owner. */
  part: IAutoMovieViewPart;
  /** Prepared original scalar/fullness/cap owner. */
  source: AutoMovieLoftViewSource.ISource;
}

/** Existing scalar meeting accuracy, in calibration millimetres. */
const TOLERANCE: number = 1e-9;

/** Bounded discovery subdivisions; absence of a bracket is not an absence proof. */
const BRACKETS: number = 16;

/** Source-native parent chords for a gluteal footprint; no emitted skin is read. */
export namespace AutoMovieHumanGlutealParent {
  /** A horizontal-cut point and its unchanged original source chart. */
  export type ILevelPoint = AutoMovieHumanGlutealCut.IPoint;

  /** Read original cut points and their actual physical station/phase once for the tape and its support provenance. */
  export function levelCutRecords(
    part: IAutoMovieViewPart,
    y: number,
    count: number,
  ): ILevelPoint[] | string {
    return AutoMovieHumanGlutealCut.records(part, y, count);
  }

  /** Read a named world-height cut of the identical original parent field, in calibration-mm X/Z. */
  export function levelCut(
    part: IAutoMovieViewPart,
    y: number,
    count: number,
  ): [number, number][] | string {
    return AutoMovieHumanGlutealCut.create(part, y, count);
  }

  /** A boundary point and the actual original chart that supplied it. */
  export interface IBoundary {
    /** World AP coordinate, calibration mm. */
    x: number;
    /** Source part name; a union keeps the actual outer boundary's owner. */
    owner: string;
    /** Physical source station, calibration mm. */
    station: number;
    /** Original polar phase, radians. */
    phase: number;
  }

  /** One occupied AP interval at the queried world height/across position. */
  export interface IChord {
    /** Posterior and anterior actual source boundaries. */
    back: IBoundary;
    /** Anterior actual source boundary. */
    front: IBoundary;
  }

  /** Shared original definitions and their local contact reader. */
  export interface IParent {
    /** The identical original parts consumed by the production parent lofts. */
    parts: readonly IAutoMovieViewPart[];
    /** Same prepared scalar/fullness/cap owners; physical jets stay available through the public reader. */
    sources: readonly {
      part: IAutoMovieViewPart;
      source: AutoMovieLoftViewSource.ISource;
    }[];
    /** Admitted source-native AP intervals, or the explicit unavailable premise. */
    chord(y: number, z: number): IChord[] | string;
  }

  /** Read one actual trunk without inventing an unrelated leg parent. */
  export function trunkOnly(part: IAutoMovieViewPart): IParent | string {
    const field: Field | string = prepare(part);
    if (typeof field === "string") return field;
    return {
      parts: [part],
      sources: [field],
      chord(y: number, z: number): IChord[] | string {
        if (![y, z].every(Number.isFinite))
          return "Trunk contact needs finite world Y/Z.";
        return trunkChord(field, y, z);
      },
    };
  }

  /** Prepare the actual trunk and same leg once; values and jets remain separate capabilities. */
  export function create(
    trunk: IAutoMovieViewPart,
    leg: { part: IAutoMovieViewPart; view: IAutoMovieConstructionView },
  ): IParent | string {
    const upper: Field | string = prepare(trunk);
    const lower: Field | string = prepare(leg.part);
    if (typeof upper === "string" || typeof lower === "string")
      return typeof upper === "string" ? upper : (lower as string);
    const lowerReader: ((y: number, z: number) => IChord[] | string) | string =
      legReader(lower, leg.view);
    if (typeof lowerReader === "string") return lowerReader;
    return {
      parts: [trunk, leg.part],
      sources: [upper, lower],
      chord(y: number, z: number): IChord[] | string {
        if (![y, z].every(Number.isFinite))
          return "Gluteal parent contact needs finite world Y/Z.";
        const a: IChord[] | string = trunkChord(upper, y, z);
        const b: IChord[] | string = lowerReader(y, z);
        if (typeof a === "string" || typeof b === "string")
          return typeof a === "string" ? a : (b as string);
        return unite([...a, ...b]);
      },
    };
  }
}

/** Retain the full original source, refusing unavailable direct fullness explicitly. */
function prepare(part: IAutoMovieViewPart): Field | string {
  const result: AutoMovieLoftViewSource.IResult | null =
    AutoMovieLoftViewSource.create(part);
  if (result === null)
    return `${part.name}: gluteal contact needs the actual prepared direct-fullness source.`;
  if (result.source === null)
    return `${part.name}: ${JSON.stringify(result.diagnostics)}`;
  return { part, source: result.source };
}

/** Read the actual level trunk's value-only native point, retaining its local values in an explicit rejection. */
function trunkChord(
  field: Field,
  y: number,
  z: number,
): AutoMovieHumanGlutealParent.IChord[] | string {
  const [first, last]: readonly [number, number] = field.source.domain;
  if (y < first || y > last) return [];
  const frame: ReturnType<IAutoMovieViewPart["axis"]["at"]> =
    field.part.axis.at(y);
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
  const values: AutoMovieLoftViewRead.IValues | string =
    AutoMovieLoftViewRead.values(field.source, y);
  if (typeof values === "string") return values;
  const across: number = z - frame.origin[2];
  if (values.extents.every((value: number): boolean => value === 0))
    return Math.abs(across) <= TOLERANCE
      ? [
          {
            back: boundary(field, frame.origin[0], y, 0),
            front: boundary(field, frame.origin[0], y, 0),
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
    ) => AutoMovieHumanGlutealParent.IBoundary | string = (
      a: number,
      b: number,
    ): AutoMovieHumanGlutealParent.IBoundary | string => {
      const phase: number | null = AutoMovieIllinois.root(
        (phi: number): number => read(phi)[1] - across,
        a,
        b,
        TOLERANCE,
        100,
      );
      if (phase === null || Math.abs(read(phase)[1] - across) > TOLERANCE)
        return `${field.part.name}: no admitted local AP chord root.`;
      return boundary(field, frame.origin[0] + read(phase)[0], y, phase);
    };
    const back: AutoMovieHumanGlutealParent.IBoundary | string = at(
      Math.PI / 2,
      (3 * Math.PI) / 2,
    );
    const front: AutoMovieHumanGlutealParent.IBoundary | string = at(
      -Math.PI / 2,
      Math.PI / 2,
    );
    return typeof back === "string" || typeof front === "string"
      ? typeof back === "string"
        ? back
        : (front as string)
      : [{ back, front }];
  } catch (error: unknown) {
    return `${field.part.name}: local AP chord at world Y/Z [${y}, ${z}] mm, source station ${y} mm, extents [${values.extents.join(", ")}] mm, shoulders [${values.shoulders.join(", ")}]: ${error instanceof Error ? error.message : String(error)}`;
  }
}

/** Prepare the actual proximal course; an AP query changes station as well as phase. */
function legReader(
  field: Field,
  view: IAutoMovieConstructionView,
):
  | ((y: number, z: number) => AutoMovieHumanGlutealParent.IChord[] | string)
  | string {
  if (view.axis.type !== "jointed")
    return `${field.part.name}: gluteal contact needs the actual jointed leg declaration.`;
  const centres: Vec3[] = view.axis.centres.map(
    AutoMovieConstructionViews.point,
  );
  const runs: AutoMovieViewAxis.IRun[] | string = AutoMovieViewAxis.runs(
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
  return (
    y: number,
    z: number,
  ): AutoMovieHumanGlutealParent.IChord[] | string => {
    const cache: Map<number, Reading | string | null> = new Map();
    const evaluate: (x: number) => Reading | string | null = (
      x: number,
    ): Reading | string | null => {
      if (cache.has(x)) return cache.get(x)!;
      const value: Reading | string | null = radial(field, [x, y, z], domain);
      cache.set(x, value);
      return value;
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
    const intersections: AutoMovieHumanGlutealParent.IBoundary[] = [];
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
          (old: AutoMovieHumanGlutealParent.IBoundary): boolean =>
            Math.abs(old.x - root) <= TOLERANCE,
        )
      )
        intersections.push(boundary(field, root, at.station, at.phase));
    }
    if (intersections.length === 0)
      return `${field.part.name}: bounded AP search has no admitted contact bracket; absence is not established.`;
    if (intersections.length % 2 !== 0)
      return `${field.part.name}: AP contact leaves its proximal source domain or has an unresolved tangency.`;
    const chords: AutoMovieHumanGlutealParent.IChord[] = [];
    for (let i: number = 0; i < intersections.length; i += 2)
      chords.push({ back: intersections[i]!, front: intersections[i + 1]! });
    return chords;
  };
}

/** Value-only radial residual in the actual source plane, without a closest surface foot. */
interface Reading {
  /** Query distance minus the actual whole-section radius, mm. */
  residual: number;
  /** Actual source-plane station, mm. */
  station: number;
  /** Original local polar phase, radians. */
  phase: number;
}

/** Intersect a world point's normal plane with the original proximal course. */
function radial(
  field: Field,
  point: Vec3,
  domain: [number, number],
): Reading | string | null {
  const plane: (station: number) => number = (station: number): number => {
    const frame: ReturnType<IAutoMovieViewPart["axis"]["at"]> =
      field.part.axis.at(station);
    return AutoMovieSolidVector.dot(
      AutoMovieSolidVector.sub(point, frame.origin),
      AutoMovieViewAxis.normal(frame),
    );
  };
  const a: number = plane(domain[0]);
  const b: number = plane(domain[1]);
  if (!Number.isFinite(a) || !Number.isFinite(b))
    return `${field.part.name}: nonfinite original course projection.`;
  if (a * b > 0) return null;
  const station: number | null = AutoMovieIllinois.root(
    plane,
    domain[0],
    domain[1],
    TOLERANCE,
    100,
  );
  if (station === null || Math.abs(plane(station)) > TOLERANCE)
    return `${field.part.name}: no admitted original source-plane projection.`;
  const frame: ReturnType<IAutoMovieViewPart["axis"]["at"]> =
    field.part.axis.at(station);
  const delta: Vec3 = AutoMovieSolidVector.sub(point, frame.origin);
  const u: number = AutoMovieSolidVector.dot(delta, frame.u);
  const v: number = AutoMovieSolidVector.dot(delta, frame.v);
  const phase: number = Math.atan2(v, u);
  const values: AutoMovieLoftViewRead.IValues | string =
    AutoMovieLoftViewRead.values(field.source, station);
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
    return `${field.part.name}: ${error instanceof Error ? error.message : String(error)}`;
  }
}

/** Conservative original-source box used only to bracket the local implicit residual. */
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
): AutoMovieHumanGlutealParent.IBoundary {
  return { x, owner: field.part.name, station, phase };
}

/** Union only local occupied AP intervals, retaining each actual outer owner. */
function unite(
  chords: AutoMovieHumanGlutealParent.IChord[],
): AutoMovieHumanGlutealParent.IChord[] {
  const sorted: AutoMovieHumanGlutealParent.IChord[] = [...chords].sort(
    (
      a: AutoMovieHumanGlutealParent.IChord,
      b: AutoMovieHumanGlutealParent.IChord,
    ): number => a.back.x - b.back.x,
  );
  const out: AutoMovieHumanGlutealParent.IChord[] = [];
  for (const chord of sorted) {
    const last: AutoMovieHumanGlutealParent.IChord | undefined = out.at(-1);
    if (last === undefined || chord.back.x > last.front.x + TOLERANCE)
      out.push({ ...chord });
    else if (chord.front.x > last.front.x) last.front = chord.front;
  }
  return out;
}
