/** Explicit geometric landmark addresses; targets and fitted sizes never enter. */
export namespace AutoMovieHumanHeadDefinition {
  /** A point in the registered millimetre frame. */
  export type Point = [number, number, number];

  /** A closed colour boundary and the actual lip-contact point. */
  export interface ILips {
    /** Samples of the same boundary used by the albedo consumer. */
    border: readonly Point[];
    /** Stomion on the actual median contact line. */
    contact: Point;
  }

  /** Geometrically supported addresses; omission is an explicit unresolved site. */
  export interface IAddresses {
    /** Nasion at its documented anatomical site, distinct from sellion. */
    nasion?: Point;
    /** Gnathion on the observed mandibular border, distinct from a support direction. */
    gnathion?: Point;
    /** Outer convex alar points, distinct from alar crease points. */
    alare?: [Point, Point];
    /** Visible vermilion and contact geometry. */
    lips?: ILips;
  }

  /** Identity distances, with unavailable anatomical addresses kept non-finite. */
  export interface IMeasures {
    /** Nasion to gnathion. */
    faceHeight: number;
    /** Nasion to observed subnasale. */
    noseHeight: number;
    /** Left to right outer ala. */
    noseWidth: number;
    /** Upper border to stomion. */
    upperLip: number;
    /** Stomion to lower border. */
    lowerLip: number;
  }

  /** Read only supported identities; no substituted prominence or crease fills a missing address. */
  export function measure(addresses: IAddresses, subnasale: Point): IMeasures {
    const crossings: Point[] = addresses.lips === undefined ? [] : median(addresses.lips.border);
    const upper: Point | undefined = crossings.reduce<Point | undefined>((best: Point | undefined, p: Point): Point => best === undefined || p[1] > best[1] ? p : best, undefined);
    const lower: Point | undefined = crossings.reduce<Point | undefined>((best: Point | undefined, p: Point): Point => best === undefined || p[1] < best[1] ? p : best, undefined);
    return {
      faceHeight: addresses.nasion === undefined || addresses.gnathion === undefined ? NaN : distance(addresses.nasion, addresses.gnathion),
      noseHeight: addresses.nasion === undefined ? NaN : distance(addresses.nasion, subnasale),
      noseWidth: addresses.alare === undefined ? NaN : distance(addresses.alare[0], addresses.alare[1]),
      upperLip: upper === undefined || addresses.lips === undefined ? NaN : distance(upper, addresses.lips.contact),
      lowerLip: lower === undefined || addresses.lips === undefined ? NaN : distance(lower, addresses.lips.contact),
    };
  }

  /** Intersections of a closed physical colour boundary with the median plane. */
  export function median(points: readonly Point[]): Point[] {
    const out: Point[] = [];
    for (let i: number = 0; i < points.length; i++) {
      const a: Point = points[i]!;
      const b: Point = points[(i + 1) % points.length]!;
      if (Math.abs(a[2]) < 1e-9) out.push([...a]);
      if ((a[2] < 0 && b[2] > 0) || (a[2] > 0 && b[2] < 0)) {
        const t: number = -a[2] / (b[2] - a[2]);
        out.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1]), 0]);
      }
    }
    return out;
  }

  /** Euclidean distance between independently supplied physical addresses. */
  function distance(a: Point, b: Point): number {
    return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  }
}
