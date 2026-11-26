import type {
  IAutoMovieLoftViewFullSource as Full,
  AutoMovieVector3Tuple as P3,
  IAutoMovieViewPart as Part,
  IAutoMovieSolidSurface as Solid,
} from "@automovie/interface";

import { AutoMovieBernsteinSubdivision64 as Subdivision } from "../curve/AutoMovieBernsteinSubdivision64";
import { AutoMovieConstructionSplitCubic as Cubic } from "./AutoMovieConstructionSplitCubic";
import { AutoMovieConstructionSplitRadial as Radial } from "./AutoMovieConstructionSplitRadial";
import { AutoMovieConstructionSplitRibbon as Ribbon } from "./AutoMovieConstructionSplitRibbon";
import { AutoMovieSolidVector as Vec } from "./AutoMovieSolidVector";

/** Prepare source-owned longitudinal courses from a split's exact cut and rails. */
export namespace AutoMovieConstructionSplitCourses {
  /** Original cut position and derivatives at one native phase. */
  type Boundary = {
    point: (phase: number) => P3;
    jet: (phase: number) => Solid.IJet;
  };
  /** One separating field and its measured forward reach. */
  type Divider = {
    point: P3;
    normal: P3;
    estimatedReach: number;
    /**
     * An original shared divider course with a lower bound on its ordered
     * chord.
     */
    guide?: {
      at: (station: number) => { p: P3; d: P3 };
      transverse: (station: number) => P3;
      depth: number;
      orderingMargin: number;
      columns: number;
    };
  };
  /** One downstream owner and its fixed receiving rail. */
  type Receiver = {
    part: Part;
    field: Full.IReader;
    station: number;
    clock: Cubic.Clock;
    reach: number;
    /** Native unit direction of the outgoing course in world coordinates. */
  };
  /** One original boundary sector with its generating curves. */
  type Arc = {
    count: number;
    course: (t: number) => Cubic.Course;
    bodyPhase?: (t: number) => number;
    seam?: { id: number; reverse: boolean };
  };
  /** Original sources, fixed rails and measured divider directions for a split. */
  export interface IInput {
    /** Unchanged body field and its active cut. */
    parent: {
      field: Full.IReader;
      cut: Boundary;
      proximal: number;
      phaseStart: number;
      station: (phase: number) => number;
      /** Share of uniform anatomical progress supplied by an original contour. */
      forwardWeight?: (phase: number) => number;
    };
    /** All adjacent owners and their full native receiving domains. */
    rails: readonly Receiver[];
    /** Original parent cut over all nested anatomical guides. */
    forks: readonly [number, number][];
    /** Adjacent branch planes, with the anatomical tip estimate retained. */
    dividers: readonly Divider[];
    /** Actual anatomical forward direction. */
    forward: P3;
    /** Actual dorsal direction. */
    up: P3;
    /** Match the existing positive physical phase in the section's planes. */
    radial?: boolean;
    /** Give the generated median the shared course's physical angular jet. */
    radialContact?: boolean;
  }

  const TURN: number = 2 * Math.PI;
  const cycle = (x: number): number => ((x % TURN) + TURN) % TURN;

  /** Prepare all exact boundary courses before any vertices are created. */
  export function prepare(
    {
      parent,
      rails,
      forks,
      dividers,
      forward,
      radial = false,
      radialContact = false,
    }: IInput,
    join: boolean,
  ) {
    const seams = dividers.map(({ normal, estimatedReach, guide }, i) => {
      const ends = forks[i]!.map(parent.cut.jet);
      const reach = Math.min(rails[i]!.reach, rails[i + 1]!.reach);
      const saddle =
        guide ??
        (() => {
          const cubic = Cubic.prepareSaddle(
            ends,
            normal,
            forward,
            reach,
            estimatedReach,
          );
          return {
            at: (s: number) => ({
              p: Cubic.value(cubic.cubic, s),
              d: Cubic.first(cubic.cubic, s),
            }),
            transverse: cubic.transverse,
            depth: cubic.depth,
            orderingMargin: cubic.pairedChordBound,
            columns: deflectionSamples(cubic.cubic),
            bounded: cubic.bounded,
          };
        })();
      const count = Math.max(
        saddle.columns,
        ...[i, i + 1].map((j): number => {
          const { clock, part } = rails[j]!;
          const a = clock.phase(ends[0]!.p);
          const b = clock.phase(ends[1]!.p);
          return Math.max(
            2,
            Math.ceil((part.samples * cycle(j === i ? a - b : b - a)) / TURN),
          );
        }),
      );
      return {
        ...saddle,
        count,
        reach,
        estimatedReach,
        bound: saddle.orderingMargin,
        bounded: "bounded" in saddle && saddle.bounded === true,
        endpoints: ends.every(
          ({ p }, k): boolean =>
            Vec.norm(Vec.sub(saddle.at(k).p, p)) <=
            16 * Number.EPSILON * Math.max(1, Vec.norm(p)),
        ),
      };
    });
    const refused = seams.flatMap(
      ({ reach, depth, bound, endpoints }, i): string[] =>
        depth > 0 && reach > depth && bound > 0 && endpoints
          ? []
          : [`divider ${i} has no regular bounded saddle`],
    );
    if (radial && rails.some(({ clock }) => clock.ray === undefined))
      return "The physical branch correspondence requires an original radial axis";
    if (refused.length !== 0) return refused.join(", ");
    const side = (p: P3, j: number, i: number): number =>
      (i <= j ? -1 : 1) *
      Vec.dot(Vec.sub(p, dividers[j]!.point), dividers[j]!.normal);
    const preserveSecond: boolean = dividers.some(
      ({ guide }) => guide !== undefined,
    );
    const jets = rails.map(({ part, clock }, i) => {
      const halfspaces = radial
        ? dividers.map(({ point, normal }, k) => ({
            point,
            normal: Vec.scale(normal, i <= k ? -1 : 1),
          }))
        : [];
      const left = i - 1;
      const right = i;
      const paths: {
        count: number;
        point: (t: number) => { p: P3; d: P3 };
        angle: (t: number) => { value: number; rate: number };
        direction: (from: P3, to: P3) => (t: number) => P3;
        second: (t: number, speed: P3, frm: P3, to: P3) => P3;
        bodyPhase?: (t: number) => number;
        seam?: Arc["seam"];
      }[] = [];
      const constrain = (
        ray: P3,
        at: P3,
        reach: number,
        against: number,
      ): P3 => {
        const scale = Math.min(
          1,
          ...dividers.map(({ normal }, k): number => {
            const adverse =
              against * (i <= k ? -1 : 1) * reach * Vec.dot(normal, ray);
            if (adverse <= 0) return 1;
            const distance = Math.max(0, side(at, k, i));
            return distance / (distance + adverse);
          }),
        );
        return Vec.scale(ray, scale);
      };
      const outer = (
        a: [number, number, number],
        b: [number, number, number],
      ): void => {
        const begin = forks[a[0]]![a[1]]! + a[2];
        const end = forks[b[0]]![b[1]]! + b[2];
        const bodyPhase = (t: number): number => begin + (end - begin) * t;
        const native = (t: number): Solid.IJet => parent.cut.jet(bodyPhase(t));
        const p0 = native(0);
        const p1 = native(1);
        const bearing = (j: Solid.IJet, direction: P3): number =>
          Math.atan2(
            Vec.dot(direction, Vec.unit(j.v)!),
            Vec.dot(direction, Cubic.unitCross(j)),
          );
        const point = (t: number) => {
          const j = native(t);
          return { p: j.p, d: Vec.scale(j.v, end - begin) };
        };
        const angle = (t: number) => {
          const j = point(t);
          return { value: clock.phase(j.p), rate: clock.rate(j.p, j.d) };
        };
        paths.push({
          bodyPhase,
          point,
          angle,
          second: (t, speed): P3 => Cubic.normalSecond(native(t), speed),
          count: Math.max(
            2,
            Math.ceil(
              (part.samples * cycle(angle(1).value - angle(0).value)) / TURN,
            ),
          ),
          direction: (from, to) => {
            const first: number = bearing(p0, from);
            const difference: number = bearing(p1, to) - first;
            const turn: number = Math.atan2(
              Math.sin(difference),
              Math.cos(difference),
            );
            return (t: number): P3 => {
              if (t === 0) return from;
              if (t === 1) return to;
              const j = native(t);
              const angle: number = first + t * turn;
              // ESTIMATE. Carry the shortest change in the fork's bearing
              // in the original parent tangent frame along its phase.
              return Vec.combine([
                [Math.cos(angle), Cubic.unitCross(j)],
                [Math.sin(angle), Vec.unit(j.v)!],
              ]);
            };
          },
        });
      };
      const medial = (k: number, reverse: boolean): void => {
        const seam = seams[k]!;
        const span = reverse ? -1 : 1;
        const origin = reverse ? 1 : 0;
        const begin = clock.phase(seam.at(reverse ? 1 : 0).p);
        const end = clock.phase(seam.at(reverse ? 0 : 1).p);
        const width = cycle(end - begin);
        const at = (t: number): number => origin + span * t;
        const basis = (s: number) => ({
          along: Vec.unit(seam.at(s).d)!,
          across: seam.transverse(s),
        });
        const coeff = (s: number, ray: P3): [number, number] => {
          const { along, across } = basis(s);
          const mixed = Vec.dot(along, across);
          return Vec.solve2(1, mixed, mixed, Vec.dot(across, across), [
            Vec.dot(ray, along),
            Vec.dot(ray, across),
          ])!;
        };
        const normal = (s: number): P3 => {
          const { along, across } = basis(s);
          return Vec.unit(Vec.cross(along, across))!;
        };
        paths.push({
          seam: { id: k, reverse },
          count: seam.count,
          point: (t) => {
            const { p, d } = seam.at(at(t));
            return { p, d: Vec.scale(d, span) };
          },
          angle: (t) => ({ value: cycle(begin + width * t), rate: width }),
          second: (t, speed, from, to): P3 => {
            const end: 0 | 1 = t <= 0.5 ? 0 : 1;
            const fork: number = at(end);
            const native = parent.cut.jet(forks[k]![fork]!);
            if (t === end) return Cubic.normalSecond(native, speed);
            // ESTIMATE. Carry the two measured fork curvatures toward a ruled
            // section at the saddle. The cubic taper is the least degree that
            // leaves zero value and two derivatives at that common centre.
            const share: number = Math.abs(1 - 2 * t) ** 3;
            if (radial) {
              // Transport the selected course tangent in the original saddle
              // frame. The fork supplies the complete curvature in that
              // direction, including when the cell uses a physical ray.
              const [u, v] = coeff(at(t), speed);
              const { along, across } = basis(fork);
              const original = Vec.combine([
                [u, along],
                [v, across],
              ]);
              const curvature = Vec.dot(
                Cubic.normalSecond(native, original),
                normal(fork),
              );
              return Vec.scale(normal(at(t)), share * curvature);
            }
            const curvature: number = Vec.dot(
              Cubic.normalSecond(native, end === 0 ? from : to),
              normal(fork),
            );
            return Vec.scale(
              normal(at(t)),
              share * curvature * Vec.dot(speed, speed),
            );
          },
          direction: (from, to) => {
            const [a, c] = coeff(0, reverse ? to : from);
            const [b, d] = coeff(1, reverse ? from : to);
            return (t: number): P3 => {
              if (t === 0) return from;
              if (t === 1) return to;
              const s = at(t);
              const { along, across } = basis(s);
              // Both source jets carry their actual values. T changes the sign of
              // its forward component at the shared physical saddle, so its
              // coefficient uses the same zero. The transverse term is affine.
              return Vec.unit(
                Vec.combine([
                  [(1 - 2 * s) * ((1 - s) * a - s * b), along],
                  [(1 - s) * c + s * d, across],
                ]),
              )!;
            };
          },
        });
      };
      if (left < 0) {
        outer([right, 0, 0], [right, 1, 0]);
        medial(right, true);
      } else if (right >= forks.length) {
        outer([left, 1, 0], [left, 0, TURN]);
        medial(left, false);
      } else {
        outer([right, 0, 0], [left, 0, 0]);
        medial(left, false);
        outer([left, 1, 0], [right, 1, 0]);
        medial(right, true);
      }
      const corners = paths.map((path, j): P3 => {
        const next = paths[(j + 1) % paths.length]!;
        const before = Vec.unit(path.point(1).d)!;
        const after = Vec.unit(next.point(0).d)!;
        return Vec.unit(Vec.sub(after, before))!;
      });
      const nativeEdges: Arc[] = paths.map((path, j) => {
        const start = corners[(j + corners.length - 1) % corners.length]!;
        const end = corners[j]!;
        const direction = path.direction(start, end);
        const rates = radial
          ? []
          : [0, 1].map((t): number => {
              const angle = path.angle(t);
              const q = clock.read(angle.value);
              // Convert the directed geometric clock to physical speed. The native
              // phase may run in either sense around this same receiving loop.
              const incoming =
                (Vec.norm(q.v) * angle.rate) / Math.abs(clock.rate(q.p, q.v));
              const transverse = Vec.norm(
                Vec.cross(path.point(t).d, t === 0 ? start : end),
              );
              return transverse / incoming;
            });
        return {
          count: path.count,
          bodyPhase: path.bodyPhase,
          seam: path.seam,
          course: (t): Cubic.Course => {
            const { p, d } = path.point(t);
            if (radial) {
              const weight =
                path.bodyPhase === undefined
                  ? 0
                  : (parent.forwardWeight?.(path.bodyPhase(t)) ?? 0);
              return Radial.course(
                {
                  p,
                  d,
                  across: direction(t),
                  normalSecond: (speed) => path.second(t, speed, start, end),
                },
                clock.read(clock.phase(p)),
                clock,
                halfspaces,
                weight === 0 ? undefined : { axis: forward, weight },
              );
            }
            const phase = positiveClock(t, rates[0]!, rates[1]!);
            const q = clock.read(path.angle(phase).value);
            const reach = Vec.dot(Vec.sub(q.p, p), forward) / 3;
            const connection = Cubic.connection(
              p,
              q,
              forward,
              (j): P3 => constrain(Cubic.unitCross(j), j.p, reach, 1),
              (): P3 => constrain(direction(t), p, reach, -1),
            );
            return preserveSecond
              ? Cubic.withCurvature(
                  connection,
                  (speed): P3 => path.second(t, speed, start, end),
                  q,
                )
              : connection;
          },
        };
      });
      const edges: Arc[] =
        radial && radialContact
          ? nativeEdges.map(
              (edge, j): Arc =>
                edge.seam === undefined
                  ? edge
                  : {
                      ...edge,
                      course: Radial.inherit(
                        nativeEdges[
                          (j + nativeEdges.length - 1) % nativeEdges.length
                        ]!.course,
                        edge.course,
                        nativeEdges[(j + 1) % nativeEdges.length]!.course,
                        clock,
                      ),
                    },
            )
          : nativeEdges;
      const courses = edges.map(({ count, course }) =>
        Array.from(
          { length: count },
          (_, j): Cubic.Course => course(j / count),
        ),
      );
      const all = courses.flat();
      const face = all.map(({ controls }) => controls);
      const lines =
        join && !radial
          ? edges.map((edge, j) =>
              Ribbon.prepareCoursePlane(
                edge.course,
                edges[(j + 1) % edges.length]!.course,
              ),
            )
          : undefined;
      const ribbons: Ribbon.Ribbon[] | undefined = lines?.map((line, j) =>
        Ribbon.prepareCourseRibbon(
          lines[(j + lines.length - 1) % lines.length]!,
          line,
          preserveSecond,
        ),
      );
      const railSpacing = Math.max(
        ...face.map((c, j): number =>
          Vec.norm(Vec.sub(c.at(-1)!, face[(j + 1) % face.length]!.at(-1)!)),
        ),
      );
      const rows = Math.max(
        2,
        ...face.map(deflectionSamples),
        Math.ceil(
          Math.max(
            ...face.map((c): number =>
              c
                .slice(1)
                .reduce(
                  (q, x, j): number => q + Vec.norm(Vec.sub(x, c[j]!)),
                  0,
                ),
            ),
          ) / railSpacing,
        ),
      );
      const minimumSide = Math.min(
        ...face.flatMap((c) =>
          c
            .slice(1)
            .flatMap((p) => dividers.map((_, k): number => side(p, k, i))),
        ),
      );
      let minimumProgress = Infinity;
      const positive = (row: readonly number[]): boolean =>
        row.every((x): boolean => x >= 0) && row.some((x): boolean => x > 0);
      const advanceCertified = face.map((c): boolean => {
        const along = radial
          ? Vec.unit(Vec.sub(c.at(-1)!, c[0]))!
          : forward;
        const increments = c.slice(1).map((p, k): number => {
          const q = c[k]!;
          const advance = Vec.dot(Vec.sub(p, q), along);
          minimumProgress = Math.min(minimumProgress, advance);
          // Subtraction, the three projected products and their addition use
          // at most six rounded binary64 operations for one projected edge.
          const error =
            6 *
            Number.EPSILON *
            along.reduce(
              (sum, axis, j) =>
                sum + Math.abs(axis) * (Math.abs(p[j]!) + Math.abs(q[j]!)),
              0,
            );
          return Math.abs(advance) <= error ? 0 : advance;
        });
        if (positive(increments)) return true;
        // A negative coefficient does not imply backward motion. The convex
        // hull of each restricted derivative still gives a sufficient exact
        // sign certificate over its half-domain.
        return radial && Subdivision.splitS(increments, 0.5).every(positive);
      });
      const directed = advanceCertified.every((certified) => certified);
      const radii = radial
        ? face.flatMap((c) => {
            const ray = clock.ray!(c[0]);
            return c.map((p): number =>
              Vec.dot(Vec.sub(p, ray.origin), ray.direction),
            );
          })
        : [];
      const minimumRadius = radial ? Math.min(...radii) : undefined;
      const courseJunctionError = edges.map((e, j): number =>
        Math.max(
          ...e
            .course(1)
            .controls.map((p, k): number =>
              Vec.norm(
                Vec.sub(p, courses[(j + 1) % courses.length]![0]!.controls[k]!),
              ),
            ),
        ),
      );
      return {
        edges,
        courses,
        ribbons,
        all,
        rows,
        evidence: {
          part: part.name,
          rows,
          medialAndExteriorColumns: edges.map((x) => x.count),
          minimumSide,
          minimumProgress,
          minimumRadius,
          directed,
          courseJunctionError,
        },
      };
    });
    return { seams, jets, side };
  }

  /**
   * Apply the requested 0.01 mm geometric resolution to a chord. The deviation
   * of a twice-differentiable curve from a chord is at most max |C''| h²/8.
   */
  function deflectionSamples(controls: Cubic.Controls): number {
    const degree: number = controls.length - 1;
    const bound: number = Math.max(
      ...controls.slice(2).map((p, i): number =>
        Vec.norm(
          Vec.combine([
            [1, p],
            [-2, controls[i + 1]!],
            [1, controls[i]!],
          ]),
        ),
      ),
    );
    return Math.ceil(Math.sqrt((degree * (degree - 1) * bound) / (8 * 0.01)));
  }

  /** Positive normalized clock with exact endpoint speeds. */
  function positiveClock(t: number, first: number, last: number): number {
    // Gregory and Delbourgo, 1982. https://doi.org/10.1093/imanum/2.2.123
    const e = 1 - t;
    return (t * t + first * t * e) / (t * t + (first + last) * t * e + e * e);
  }
}
