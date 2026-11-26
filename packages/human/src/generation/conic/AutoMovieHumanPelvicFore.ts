import {
  AutoMovieBernstein64 as Bernstein,
  AutoMovieSolidHeightFence as HeightFence,
  AutoMovieSolidHeightPatch as HeightPatch,
  AutoMovieSolidVector as Vec,
} from "@automovie/engine";
import type { AutoMovieVector3Tuple as P3 } from "@automovie/interface";

import type { AutoMovieHumanPelvicMedialLoft as Native } from "./AutoMovieHumanPelvicMedialLoft";
import type { AutoMovieHumanPelvicMedian as Median } from "./AutoMovieHumanPelvicMedian";

/** Four actual original boundaries of each anterior perineal surface. */
export namespace AutoMovieHumanPelvicFore {
  /** The exact held exterior and receiving courses. */
  type Plan = Parameters<typeof Native.prepare>[1];

  /** One original edge of the prepared split. */
  type Arc = Plan["jets"][number]["edges"][number];

  /** Fixed-angle original control curve. */
  type Controls = (t: number) => readonly P3[];

  /** Position and both first derivatives. */
  type Reader = (u: number) => { point: P3; du: P3; dv: P3 };

  /** Derivatives along the held section for its analytic normal rate. */
  type SectionReader = Reader & {
    second: () => (u: number) => ReturnType<Reader> & { duu: P3; duv: P3 };
  };

  /** Cube-root machine spacing for the O(h²) original-course stencil. */
  const STEP = Math.cbrt(Number.EPSILON) / 2;

  /** Compare one-sided physical graph derivatives where a source edge changes. */
  export function switches(
    original: Plan,
    charts: ReturnType<typeof Native.prepare>,
    normals: readonly P3[],
    sagittal?: ReturnType<typeof Median.regularFore>,
  ) {
    return prepareBoundaries(original, charts, normals, sagittal).map(
      ({ readers: _readers, ...boundary }) => boundary,
    );
  }

  /** Prepare the native edges for both the owner changes and physical rows. */
  function prepareBoundaries(
    original: Plan,
    charts: ReturnType<typeof Native.prepare>,
    normals: readonly P3[],
    sagittal?: ReturnType<typeof Median.regularFore>,
  ) {
    return original.jets.map(({ edges }, side) => {
      const height = normals[side]!;
      const section = Vec.unit(
        Vec.sub([0, 1, 0], Vec.scale(height, height[1])),
      )!;
      const span = Vec.cross(height, section);
      const edge = edges.find(({ seam }) => seam === undefined)!;
      const sources = nativeFences(charts[side]!, edge, sagittal);
      const readers = sources.map(({ name, count, at, normal }) => ({
        read: HeightFence.prepare(name, count, section, at),
        normal,
      }));
      const corners = [
        {
          name: "fore-parent",
          ends: [
            [0, 0],
            [3, 0],
          ],
        },
        {
          name: "fore-thigh",
          ends: [
            [0, 1],
            [1, 0],
          ],
        },
        {
          name: "center-thigh",
          ends: [
            [2, 1],
            [1, 1],
          ],
        },
        {
          name: "center-parent",
          ends: [
            [2, 0],
            [3, 1],
          ],
        },
      ].map(({ name, ends }) => {
        const [a, b] = ends.map(([side, t]) => {
          const source = sources[side!]!;
          const jet = source.at(t!);
          const n = source.normal(t!);
          const z = Vec.dot(n.value, height);
          const slope = -Vec.dot(n.value, span) / z;
          const longitudinal = -Vec.dot(n.value, section) / z;
          const ds = Vec.dot(jet.along, section);
          const dx = Vec.dot(jet.along, span) / ds;
          const dm =
            (-Vec.dot(n.rate, span) - slope * Vec.dot(n.rate, height)) /
            (z * ds);
          const dl =
            (-Vec.dot(n.rate, section) -
              longitudinal * Vec.dot(n.rate, height)) /
            (z * ds);
          return {
            name: source.name,
            p: jet.p,
            n: Vec.unit(n.value)!,
            slope,
            longitudinal,
            ds,
            dx,
            dm,
            dl,
          };
        });
        const p = a!.p;
        const s = Vec.dot(p, section);
        const x = Vec.dot(p, span);
        const tiny = 64 * Number.EPSILON * Math.max(1, Vec.norm(p));
        const hits = readers
          .flatMap(({ read }) => read.at(s))
          .filter(({ p: q }) => Vec.norm(Vec.sub(q, p)) > tiny);
        const tangency = Vec.norm(Vec.cross(a!.n, b!.n));
        const junction = {
          name,
          s,
          x,
          a,
          b,
          tangency,
          position: Vec.norm(Vec.sub(a!.p, b!.p)),
          hits,
        };
        if (hits.length !== 1 || hits[0]!.tangent === null)
          return { ...junction, proof: null };
        const q = hits[0]!;
        const ray = q.tangent!;
        const width = Vec.dot(Vec.sub(q.p, p), span);
        const rise = Vec.dot(Vec.sub(q.p, p), height);
        const slopeQ = Vec.dot(ray, height) / Vec.dot(ray, span);
        const deltaX = a!.dx - b!.dx;
        const deltaSlope = a!.dm - b!.dm;
        const required = deltaSlope / deltaX;
        const cubic =
          (6 * rise) / width ** 2 - (4 * a!.slope + 2 * slopeQ) / width;
        // Differentiating m(s)=f_x(s,xBoundary(s)) separates the common mixed jet
        // from the change of xBoundary' when a different boundary becomes active.
        const mixed = [
          a!.dm - required * a!.dx,
          b!.dm - required * b!.dx,
          (a!.dl - b!.dl) / deltaX,
        ];
        const coefficient = (required - cubic) / (2 * width ** 2);
        return {
          ...junction,
          proof: {
            width,
            rise,
            slopeQ,
            deltaX,
            deltaSlope,
            required,
            cubic,
            jump: deltaSlope - cubic * deltaX,
            mixed,
            coefficient,
            midpointOffset: (coefficient * width ** 4) / 16,
          },
        };
      });
      return {
        part: charts[side]!.part,
        height,
        section,
        span,
        corners,
        readers,
      };
    });
  }

  /** Prepare one physical quartic section from the four unchanged native curves. */
  export function prepareLoft(
    original: Plan,
    charts: ReturnType<typeof Native.prepare>,
    normals: readonly P3[],
    sagittal: ReturnType<typeof Median.regularFore>,
  ) {
    const observed = prepareBoundaries(original, charts, normals, sagittal);
    return observed.map(({ part, height, section, span, corners, readers }) => {
      const anchors = corners
        .flatMap(({ s, proof }) =>
          proof === null ? [] : [{ s, alpha: proof.coefficient }],
        )
        .sort((a, b) => a.s - b.s);
      const [first, last] = anchors;
      if (anchors.length !== 2 || !(last!.s > first!.s))
        throw new Error(
          `${part} needs two distinct solved physical section owner changes`,
        );
      const levels = [
        ...new Set(readers.flatMap(({ read }) => read.heights)),
      ].sort((a, b) => a - b);
      const prepare = HeightPatch.prepare(
        part,
        { height, section, span },
        readers,
        [
          { s: first!.s, coefficient: first!.alpha },
          { s: last!.s, coefficient: last!.alpha },
        ],
      );
      const at = (s: number) => {
        const row = prepare(s);
        return {
          ...row,
          at(x: number) {
            const { height: z, longitudinal: ds, transverse: dx } = row.at(x);
            return { z, ds, dx };
          },
          prepareTransverseSecond: row.transverseSecond,
        };
      };
      return { part, height, section, span, corners, levels, at, row: prepare };
    });
  }
  type Boundary = { p: P3; along: P3; inward: P3 };
  type Normal = { value: P3; rate: P3 };
  type NativeChart = ReturnType<typeof Native.prepare>[number];

  /** Same four source readers as the oblique census, with analytic normal rates. */
  export function nativeFences(
    chart: NativeChart,
    edge: Arc,
    sagittal?: ReturnType<typeof Median.regularFore>,
  ) {
    const first =
      edge.course(0).controls[0][0] > edge.course(1).controls[0][0] ? 0 : 1;
    const fore = profile(controls(edge), first, 2 * first - 1);
    const center = chart.course(0.5);
    const half = Math.ceil(chart.columns / 2);
    const across = (
      name: string,
      read: Reader,
      second: SectionReader["second"],
      inward: number,
    ) => {
      const differential = second();
      return {
        name,
        count: chart.rows,
        at: (t: number): Boundary => {
          const q = read(t);
          return { p: q.point, along: q.du, inward: Vec.scale(q.dv, inward) };
        },
        normal: (t: number): Normal => {
          const q = differential(t);
          return {
            value: Vec.cross(q.du, q.dv),
            rate: Vec.add(Vec.cross(q.duu, q.dv), Vec.cross(q.du, q.duv)),
          };
        },
      };
    };
    const rail = (name: string, end: 0 | 1) => ({
      name,
      count: half,
      at: (t: number): Boundary => {
        const q = chart.atV(t / 2)(end);
        return {
          p: q.point,
          along: Vec.scale(q.dv, 0.5),
          inward: Vec.scale(q.du, 1 - 2 * end),
        };
      },
      normal: (t: number): Normal => {
        const q = chart.profile(t / 2);
        return end === 0
          ? { value: [q.slope, -1, 0], rate: [q.slopeFirst / 2, 0, 0] }
          : { value: q.normal, rate: Vec.scale(q.nFirst, 0.5) };
      },
    });
    const originalParent = rail("parent-sagittal", 0);
    const parent =
      sagittal === undefined
        ? originalParent
        : {
            ...originalParent,
            at: (t: number): Boundary => {
              const q = sagittal(t);
              return { p: q.point, along: q.first, inward: chart.outward };
            },
            normal: (t: number): Normal => {
              const q = sagittal(t);
              return {
                value: [q.first[1], -q.first[0], 0],
                rate: [q.second[1], -q.second[0], 0],
              };
            },
          };
    return [
      across("fore-fork", fore, fore.second, 1),
      rail("receiving-thigh", 1),
      across("common-center", center.first, center.second, -1),
      parent,
    ] as const;
  }
  /** The unchanged native control polygon at its original angular address. */
  export const controls =
    (edge: Arc): Controls =>
    (t) =>
      edge.course(t).controls;

  /** Second-order one-sided or central derivative of the exact control curve. */
  export function profile(
    read: Controls,
    t: number,
    direction: number,
  ): SectionReader {
    const c = read(t);
    const a = Bernstein.tangent(c);
    const b =
      t >= STEP && t <= 1 - STEP
        ? Bernstein.scale(
            Bernstein.add(read(t + STEP), read(t - STEP), -1),
            direction / (2 * STEP),
          )
        : (() => {
            const sign = t < STEP ? 1 : -1;
            const one = Bernstein.add(read(t + sign * STEP), c, -1);
            const two = Bernstein.add(read(t + 2 * sign * STEP), c, -1);
            return Bernstein.scale(
              Bernstein.add(one, two, -0.25),
              (2 * direction * sign) / STEP,
            );
          })();
    const first: Reader = (u) => ({
      point: Bernstein.value(c, u),
      du: Bernstein.value(a, u),
      dv: Bernstein.value(b, u),
    });
    const second: SectionReader["second"] = () => {
      const duu = Bernstein.tangent(a);
      const duv = Bernstein.tangent(b);
      return (u) => ({
        ...first(u),
        duu: Bernstein.value(duu, u),
        duv: Bernstein.value(duv, u),
      });
    };
    return Object.assign(first, { second });
  }
}
