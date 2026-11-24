import { AutoMovieLoftRelief, AutoMovieNaturalSpline } from "@automovie/engine";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanHeadEarPlate,
  IAutoMovieLoftRelief,
  IAutoMovieLoftViewFullSource,
  IAutoMovieNaturalCubicSpline,
} from "@automovie/interface";

type Point = [number, number];

/** Surface features with single-valued depth on the auricular sheets. */
export namespace AutoMovieHumanHeadEarSurface {
  /** A crest course declared in world space on the ear's own plate. */
  export interface ICourse {
    /** Anatomical name of the crest and its relief field. */
    name: string;
    /** Ordered crest landmarks in world millimetres. */
    points: AutoMovieVector3Tuple[];
    /** Middle and upper half-widths in mm when measured separately. */
    halfWidths?: [number, number];
    /** Which visible ends subside back into the carrier. */
    fade?: "start" | "end";
  }

  /** Conchal rim plane and anthropometric measurements, in world mm. */
  export interface IConcha {
    /** Anatomical name of the conchal relief field. */
    name: string;
    /** Rim datum in world millimetres. */
    rim: AutoMovieVector3Tuple;
    /** World direction of the long axis of the rim. */
    along: AutoMovieVector3Tuple;
    /** Rim extent along the long axis, in mm. */
    length: number;
    /** Transverse rim extent in mm. */
    breadth: number;
    /** Floor depression relative to the rim datum, in mm. */
    depth: number;
  }

  /**
   * Perfler et al. (2025), sec. 2.2, separate crest guides and fossa shape
   * changes on one auricular skin. Here both are depth fields along the plate
   * normal. The three zero rings of the cubic net preserve the anterior and
   * posterior silhouettes and the two collapsed poles through second order. The
   * crest courses share their authored fork and one height there.
   *
   * @evidence contracts/common.md#principled-implementation Uses named guides on one auricular sheet, a shared fork height and separate public conchal rim and floor dimensions. Depth changes are along the normal of the actual plate.
   * @evidence contracts/common.md#clear-and-simple-design One plate chart and a single field composition cover rim, branch, and bowl.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No boundary search, reference fit, cache, or output-mesh operation. The conchal floor is calibrated on the actual spline field.
   * @evidence contracts/common.md#meaningful-documentation Explains the continuity at both seams and poles, crest radius, and conchal datum.
   * @evidence contracts/performance.md#efficient-algorithms Prepares smooth bounded course segments and reads each station section once. Each net point evaluates only nearby segments, fixed conic geometry, and a fixed number of height contributions.
   * @evidence contracts/performance.md#reuse-equivalent-work All reliefs share the prepared courses, station rows, and one chart traversal.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns explicit caller-owned nets. The segment and station work is local to preparation.
   */
  export function of(
    plate: IAutoMovieHumanHeadEarPlate.IOutput,
    head: IAutoMovieLoftViewFullSource.IReader,
    seamReach: number,
    outward: AutoMovieVector3Tuple,
    breadth: number,
    radius: number,
    crestHeight: number,
    courses: readonly ICourse[],
    concha: IConcha,
  ): IAutoMovieLoftRelief[] {
    const chart = (p: AutoMovieVector3Tuple): Point => [
      p[1],
      dot(p, plate.across),
    ];
    const low: number = plate.bottom;
    const high: number = plate.top;
    const start: number = dot(outward, plate.normal) > 0 ? 0 : Math.PI;
    // Two knot spans across the inherited crest radius resolve each side of
    // the compact profile. The phase bound uses the full arc of a half circle
    // with the declared auricular breadth as its diameter.
    const pitch: number = radius / 2;
    const rows: number = Math.max(7, 3 + Math.ceil((high - low) / pitch));
    const columns: number = Math.max(
      7,
      3 + Math.ceil((Math.PI * breadth) / (2 * pitch)),
    );
    const step: Point = [(high - low) / (rows - 3), Math.PI / (columns - 3)];
    const field = (name: string): IAutoMovieLoftRelief => ({
      name,
      stations: [low, high],
      phases: [start, start + Math.PI],
      axis: outward,
      rows,
      columns,
      heights: new Array<number>(rows * columns).fill(0),
    });
    const crests: IAutoMovieLoftRelief[] = courses.map(({ name }) =>
      field(name),
    );
    const bowl: IAutoMovieLoftRelief = field(concha.name);
    const clearance: number[] = new Array<number>(rows * columns).fill(0);
    const guides: ISegment[][] = courses.map(({ points }) =>
      prepare(points.map(chart), pitch),
    );
    const centre: Point = chart(concha.rim);
    const along: Point = [concha.along[1], dot(concha.along, plate.across)];

    for (let row: number = 3; row < rows - 3; row++) {
      // A uniform cubic control's Greville abscissa is i - 1.
      const station: number = low + (row - 1) * step[0];
      const section: IAutoMovieHumanHeadEarPlate.ISection =
        plate.section(station);
      const phase = section.phase;
      if (phase === null)
        throw new Error("Auricle interior section has no phase");
      const upper: number = smoothStep(
        (station - plate.tragion) / (high - plate.tragion),
      );
      const reach: number[] = courses.map(({ halfWidths }): number =>
        halfWidths === undefined
          ? radius
          : halfWidths[0] + upper * (halfWidths[1] - halfWidths[0]),
      );
      const nearby: ISegment[][] = guides.map(
        (course: ISegment[], i: number): ISegment[] =>
          course.filter(
            ({ low, high }: ISegment): boolean =>
              station >= low - reach[i]! && station <= high + reach[i]!,
          ),
      );
      const origin: number = dot(section.frame.origin, plate.across);
      const direction: number = dot(section.frame.u, plate.across);
      const level: number = dot(section.frame.origin, outward);
      const normal: number = dot(section.frame.v, outward);
      const scalp = outwardSupport(
        head.pointAt(station),
        plate.across,
        outward,
        step[1],
      );
      for (let column: number = 3; column < columns - 3; column++) {
        const angle: number = start + (column - 1) * step[1];
        const [u, v] = phase(angle).p;
        const p: Point = [station, origin + direction * u];
        const index: number = row * columns + column;
        const front: number = level + normal * v;
        const back: number = level + normal * phase(-angle).p[1];
        // A cubic coefficient influences two spans on each side of its own
        // Greville site. Leave this much working room outside the original
        // join reach before authoring a new surface displacement.
        const scalpWall: number = scalp(p[1]);
        const gate: number = smoothStep(
          (front - scalpWall - seamReach - 2 * pitch) / radius,
        );
        // Where the field clears the protected rail, use the actual space
        // behind it down to the closer of scalp and auricular back.
        clearance[index] =
          gate * Math.max(0, front - Math.max(back, scalpWall) - radius);
        const weights: number[] = nearby.map((segments, i): number =>
          crestWeight(segments, p, reach[i]!, courses[i]!.fade),
        );
        const sum: number = weights.reduce(
          (a: number, b: number): number => a + b,
          0,
        );
        if (sum > 0) {
          // A smooth union meets each full-height crest at the same height.
          // A quarter-circle fold with half-chord r has sagitta (sqrt(2)-1) r.
          // ESTIMATE: use that shallow, symmetric section when height is free.
          const halfChord: number =
            weights.reduce(
              (value, weight, i): number => value + weight * reach[i]!,
              0,
            ) / sum;
          const height: number =
            gate *
            Math.min(crestHeight, (Math.SQRT2 - 1) * halfChord) *
            (1 -
              weights.reduce((a: number, b: number): number => a * (1 - b), 1));
          for (let i: number = 0; i < crests.length; i++)
            crests[i]!.heights[index] = (height * weights[i]!) / sum;
        }
        const dy: number = p[0] - centre[0];
        const du: number = p[1] - centre[1];
        const a: number = (2 * (dy * along[0] + du * along[1])) / concha.length;
        const b: number =
          (2 * (du * along[0] - dy * along[1])) / concha.breadth;
        bowl.heights[index] = profile(a * a + b * b);
      }
    }

    const floor: IAutoMovieHumanHeadEarPlate.ISection = plate.section(
      centre[0],
    );
    const phase = floor.phase;
    if (phase === null) throw new Error("Conchal floor has no plate section");
    const target: number =
      (centre[1] - dot(floor.frame.origin, plate.across)) /
      dot(floor.frame.u, plate.across);
    const t: number = phaseAtWidth(
      (t: number): number => phase(t).p[0],
      start,
      target,
    );
    const front: number =
      dot(floor.frame.origin, outward) +
      phase(t).p[1] * dot(floor.frame.v, outward);
    const crest: number = crests.reduce(
      (height: number, relief: IAutoMovieLoftRelief): number =>
        height + AutoMovieLoftRelief.height(relief, centre[0], t)[0],
      0,
    );
    const unit: number = AutoMovieLoftRelief.height(bowl, centre[0], t)[0];
    if (!(unit > 0))
      throw new Error("Conchal floor is outside its relief field");
    const gain: number =
      dot(concha.rim, outward) - concha.depth - front - crest;
    if (!(gain < 0))
      throw new Error("Conchal floor is not inward of the outer plate");
    // Preserve the measured target where the exposed section admits it. The
    // rear cartilage and the scalp contact take precedence where the nominal
    // caliper depth would move a coefficient past either visible boundary.
    bowl.heights = bowl.heights.map(
      (value: number, index: number): number =>
        -value * Math.min(clearance[index]!, -gain / unit),
    );
    return [...crests, bowl];
  }

  /** A C2 approach to the unmodified plate through the available depth. */
  function smoothStep(x: number): number {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    return x ** 3 * (10 + x * (-15 + 6 * x));
  }

  /** The farthest scalp point along the plate normal at a given chart width. */
  function outwardSupport(
    point: (phase: number) => AutoMovieVector3Tuple,
    across: AutoMovieVector3Tuple,
    outward: AutoMovieVector3Tuple,
    phaseStep: number,
  ): (across: number) => number {
    const count: number = Math.ceil((2 * Math.PI) / phaseStep);
    const taps: Point[] = Array.from(
      { length: count + 1 },
      (_, i: number): Point => {
        const world: AutoMovieVector3Tuple = point((2 * Math.PI * i) / count);
        return [dot(world, across), dot(world, outward)];
      },
    );
    return (u: number): number => {
      let farthest: number = -Infinity;
      for (let i: number = 1; i < taps.length; i++) {
        const [a, v] = taps[i - 1]!;
        const [b, w] = taps[i]!;
        if (a === b || u < Math.min(a, b) || u > Math.max(a, b)) continue;
        farthest = Math.max(farthest, v + ((u - a) * (w - v)) / (b - a));
      }
      return farthest;
    };
  }

  /** A normalized compact polynomial with zero slope and curvature at its rim. */
  function profile(r2: number): number {
    return r2 < 1 ? (1 - r2) ** 3 : 0;
  }

  /** Invert the actual monotone outer half section to locate the floor. */
  function phaseAtWidth(
    read: (t: number) => number,
    start: number,
    target: number,
  ): number {
    let low: number = start;
    let high: number = start + Math.PI;
    const a: number = read(low);
    const b: number = read(high);
    if (!(target > Math.min(a, b) && target < Math.max(a, b)))
      throw new Error("Conchal floor is outside the plate width");
    while (true) {
      const mid: number = (low + high) / 2;
      if (mid === low || mid === high) return mid;
      if (read(mid) < target === a < b) low = mid;
      else high = mid;
    }
  }

  interface ISegment {
    origin: Point;
    delta: Point;
    lengthSquared: number;
    station: number;
    span: number;
    end: number;
    low: number;
    high: number;
  }

  /** Sample each natural course in chord length at the net's physical pitch. */
  function prepare(points: Point[], pitch: number): ISegment[] {
    const lengths: number[] = [0];
    for (let i: number = 1; i < points.length; i++) {
      const [y, u] = points[i - 1]!;
      const [nextY, nextU] = points[i]!;
      lengths.push(lengths[i - 1]! + Math.hypot(nextY - y, nextU - u));
    }
    const y: IAutoMovieNaturalCubicSpline = AutoMovieNaturalSpline.create(
      lengths,
      points.map((p: Point): number => p[0]),
    );
    const u: IAutoMovieNaturalCubicSpline = AutoMovieNaturalSpline.create(
      lengths,
      points.map((p: Point): number => p[1]),
    );
    const segments: ISegment[] = [];
    let previous: Point = points[0]!;
    let station: number = 0;
    for (let i: number = 1; i < lengths.length; i++) {
      const start: number = lengths[i - 1]!;
      const span: number = lengths[i]! - start;
      const count: number = Math.ceil(span / pitch);
      for (let j: number = 1; j <= count; j++) {
        const s: number = start + (j / count) * span;
        const next: Point = [
          AutoMovieNaturalSpline.evaluate(y, s),
          AutoMovieNaturalSpline.evaluate(u, s),
        ];
        const delta: Point = [next[0] - previous[0], next[1] - previous[1]];
        const lengthSquared: number = delta[0] ** 2 + delta[1] ** 2;
        if (lengthSquared > 0)
          segments.push({
            origin: previous,
            delta,
            lengthSquared,
            station,
            span: s - station,
            end: lengths.at(-1)!,
            low: Math.min(previous[0], next[0]),
            high: Math.max(previous[0], next[0]),
          });
        previous = next;
        station = s;
      }
    }
    return segments;
  }

  /** Round a free crest end from its course's own half-width. */
  function crestWeight(
    segments: readonly ISegment[],
    p: Point,
    reach: number,
    fade: ICourse["fade"],
  ): number {
    let best: number = Infinity;
    let along: number = 0;
    for (const {
      origin,
      delta,
      lengthSquared,
      station,
      span,
      end,
    } of segments) {
      const y: number = p[0] - origin[0];
      const u: number = p[1] - origin[1];
      const t: number = Math.max(
        0,
        Math.min(1, (y * delta[0] + u * delta[1]) / lengthSquared),
      );
      const distance: number =
        (y - t * delta[0]) ** 2 + (u - t * delta[1]) ** 2;
      if (distance >= best) continue;
      best = distance;
      const at: number = station + t * span;
      along = fade === "start" ? at : end - at;
    }
    return (
      profile(best / reach ** 2) *
      (fade === undefined ? 1 : smoothStep(along / reach))
    );
  }

  function dot(a: AutoMovieVector3Tuple, b: AutoMovieVector3Tuple): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }
}
