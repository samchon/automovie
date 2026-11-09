import {
  AutoMovieIllinois,
  AutoMovieLoftSectionNative,
  AutoMovieLoftViewRead,
  AutoMovieLoftViewSource,
  AutoMovieLoftViewWorldJet,
  AutoMovieSolidVector,
  AutoMovieViewOutline,
  type IAutoMovieViewPart,
} from "@automovie/engine";

/** Numerical world-height meeting budget, calibration millimetres. */
const TOLERANCE: number = 1e-9;

/** Discovery subdivisions of each actual source partition, not a crossing certificate. */
const SUBDIVISIONS: number = 8;

/** A station's immutable original section and its actual world plane. */
interface Station {
  /** Actual axis frame in calibration millimetres. */
  frame: ReturnType<IAutoMovieViewPart["axis"]["at"]>;
  /** Null is the actual collapsed axis point, not a regular section. */
  point: ReturnType<typeof AutoMovieLoftSectionNative.point> | null;
}

/** One original point, before any loft or tessellation. */
interface Reading {
  /** World point in calibration millimetres. */
  point: AutoMovieSolidVector.Vec3;
  /** Whether the original section is exactly its zero-radius axis point. */
  collapsed: boolean;
}

/** Original horizontal cuts of the same leg field consumed by the pelvis. */
export namespace AutoMovieHumanGlutealCut {
  /** One horizontal-cut point and the actual source chart that produced it. */
  export interface IPoint {
    /** World X/Z in calibration millimetres. */
    point: [number, number];
    /** Physical station of the identical original source, calibration mm. */
    station: number;
    /** Original local polar phase, radians. */
    phase: number;
  }

  /** Preserve the existing point-only consumer without preparing another field or solving another cut. */
  export function create(
    part: IAutoMovieViewPart,
    y: number,
    count: number,
  ): [number, number][] | string {
    const cut: IPoint[] | string = records(part, y, count);
    return typeof cut === "string"
      ? cut
      : cut.map((record: IPoint): [number, number] => record.point);
  }

  /**
   * Read one regular world-Y cut with its actual X/Z and source chart.
   * Named/critical/cap partitions and bounded discovery retain explicit missing,
   * multiple and tangent cases. These sampled points certify neither a whole
   * continuous cut nor a final blended-skin tape. Missing physical derivatives
   * remain unavailable when transversality must be checked. Discovery reads
   * only the identical native point; the accepted crossing still requires
   * the original WorldJet and its unchanged transversality test.
   */
  export function records(
    part: IAutoMovieViewPart,
    y: number,
    count: number,
  ): IPoint[] | string {
    if (!Number.isFinite(y) || !Number.isInteger(count) || count < 4)
      return `${part.name}: level cut needs a finite height and at least four integer phases.`;
    try {
      const prepared: AutoMovieLoftViewSource.IResult | null =
        AutoMovieLoftViewSource.create(part);
      if (prepared === null || prepared.source === null)
        return `${part.name}: level cut needs its admitted direct-fullness original: ${JSON.stringify(prepared?.diagnostics ?? [])}`;
      const source: AutoMovieLoftViewSource.ISource = prepared.source;
      const partitions: number[] | string = stations(part, source);
      if (typeof partitions === "string") return partitions;
      const cache: Map<number, Station | string> = new Map();
      const at: (s: number, phi: number) => Reading | string = (
        s: number,
        phi: number,
      ): Reading | string => {
        let station: Station | string | undefined = cache.get(s);
        if (station === undefined) {
          const values: AutoMovieLoftViewRead.IValues | string =
            AutoMovieLoftViewRead.values(source, s);
          station =
            typeof values === "string"
              ? values
              : {
                  frame: part.axis.at(s),
                  point: values.extents.every(
                    (value: number): boolean => value === 0,
                  )
                    ? null
                    : AutoMovieLoftSectionNative.point(values),
                };
          cache.set(s, station);
        }
        if (typeof station === "string") return station;
        if (station.point === null)
          return { point: [...station.frame.origin], collapsed: true };
        const local: [number, number] = station.point(phi);
        return {
          point: AutoMovieSolidVector.add(
            station.frame.origin,
            AutoMovieSolidVector.add(
              AutoMovieSolidVector.scale(station.frame.u, local[0]),
              AutoMovieSolidVector.scale(station.frame.v, local[1]),
            ),
          ),
          collapsed: false,
        };
      };
      const points: IPoint[] = [];
      for (let k: number = 0; k < count; k++) {
        const phi: number = (2 * Math.PI * k) / count;
        const roots: number[] = [];
        let prior: { station: number; residual: number } | undefined;
        for (const s of partitions) {
          const value: Reading | string = at(s, phi);
          if (typeof value === "string") return `${part.name}: ${value}`;
          if (!value.point.every(Number.isFinite))
            return `${part.name}: nonfinite original cut point at phase ${phi}.`;
          const residual: number = value.point[1] - y;
          if (!Number.isFinite(residual))
            return `${part.name}: nonfinite original height at phase ${phi}.`;
          if (Math.abs(residual) <= TOLERANCE) roots.push(s);
          if (
            prior !== undefined &&
            Math.abs(prior.residual) > TOLERANCE &&
            Math.abs(residual) > TOLERANCE &&
            prior.residual * residual < 0
          ) {
            const root: number | null = AutoMovieIllinois.root(
              (q: number): number => {
                const read: Reading | string = at(q, phi);
                if (typeof read === "string") throw new Error(read);
                return read.point[1] - y;
              },
              prior.station,
              s,
              TOLERANCE,
              100,
            );
            if (root === null)
              return `${part.name}: level cut did not converge at phase ${phi}.`;
            roots.push(root);
          }
          prior = { station: s, residual };
        }
        if (roots.length !== 1)
          return `${part.name}: level cut has ${roots.length} discovered crossings at phase ${phi}; one regular bracket is required and bounded absence is not a geometric absence proof.`;
        const s: number = roots[0]!;
        const read: Reading | string = at(s, phi);
        if (typeof read === "string") return `${part.name}: ${read}`;
        if (read.collapsed)
          return `${part.name}: the level cut collapses to its actual axis point at phase ${phi}.`;
        if (Math.abs(read.point[1] - y) > TOLERANCE)
          return `${part.name}: level cut has no admitted height residual.`;
        const jet: ReturnType<typeof AutoMovieLoftViewWorldJet> =
          AutoMovieLoftViewWorldJet(source, part.axis, s, phi);
        if (typeof jet === "string")
          return `${part.name}: level cut transversality is unavailable: ${jet}`;
        if (
          AutoMovieSolidVector.norm(
            AutoMovieSolidVector.sub(jet.p, read.point),
          ) > TOLERANCE
        )
          return `${part.name}: original value and physical jet do not share the cut point.`;
        if (
          Math.abs(jet.u[1]) <=
          64 * Number.EPSILON * Math.max(1, Math.hypot(...jet.u))
        )
          return `${part.name}: the source is tangent to the height plane at phase ${phi}.`;
        points.push({
          point: [read.point[0], read.point[2]],
          station: s,
          phase: phi,
        });
      }
      return points;
    } catch (error: unknown) {
      return `${part.name}: original level cut: ${error instanceof Error ? error.message : String(error)}`;
    }
  }
}

/** Reuse actual source partitions for discovery; no new shape or frame is fitted. */
function stations(
  part: IAutoMovieViewPart,
  source: AutoMovieLoftViewSource.ISource,
): number[] | string {
  const full: AutoMovieViewOutline.IOutline[] =
    source.fullness.kind === "top"
      ? [...source.fullness.shoulders]
      : [source.fullness.owner, ...(source.fullness.departures ?? [])];
  const candidates: number[] = [
    ...source.domain,
    ...part.stations,
    ...[...source.extents, ...full].flatMap(
      (outline: AutoMovieViewOutline.IOutline): number[] => [
        ...outline.knots.map(
          (knot: IAutoMovieViewPart.IKnot): number => knot.station,
        ),
        ...AutoMovieViewOutline.criticalStations(outline),
      ],
    ),
    ...source.caps.flatMap(
      (cap: AutoMovieLoftViewSource.ISource["caps"][number]): number[] =>
        cap.near === null ? [cap.pole] : [cap.pole, cap.near],
    ),
  ];
  if (!candidates.every(Number.isFinite))
    return `${part.name}: level cut has a nonfinite source partition.`;
  const anchors: number[] = [
    ...new Set(
      candidates.filter(
        (s: number): boolean => s >= source.domain[0] && s <= source.domain[1],
      ),
    ),
  ].sort((a: number, b: number): number => a - b);
  return [
    ...new Set(
      anchors.flatMap((s: number, i: number): number[] =>
        i + 1 === anchors.length
          ? [s]
          : Array.from(
              { length: SUBDIVISIONS },
              (_: unknown, k: number): number =>
                s + ((anchors[i + 1]! - s) * k) / SUBDIVISIONS,
            ),
      ),
    ),
  ].sort((a: number, b: number): number => a - b);
}
