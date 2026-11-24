import {
  AutoMovieMeshExtract,
  AutoMovieViewChain,
  AutoMovieSolidVector as Vector,
} from "@automovie/engine";
import {
  AutoMovieHumanConicSection as Conic,
  AutoMovieHumanCourseRuns as CourseRuns,
  AutoMovieHumanConicLoft as Loft,
} from "@automovie/human";
import type {
  IAutoMovieHumanConicLoft,
  IAutoMovieLoftSectionFrame,
  IAutoMovieMeshSectionChain,
  AutoMovieVector2Tuple as Point2,
  AutoMovieVector3Tuple as Point3,
} from "@automovie/interface";
import { writeFile } from "node:fs/promises";
import path from "node:path";

import { FamilyConicMpfbSource as Mpfb } from "./FamilyConicMpfbSource";

/**
 * Measure independent starter conic walls from the HM08 skin and its rig
 * centres.
 */
export namespace FamilyConicMpfbFamilies {
  /** Open walls available from this source adapter. */
  export type Name = "arm" | "leg" | "trunk";

  /**
   * Geometry and measurements of one unjoined wall. All distances are in
   * millimetres.
   */
  export interface ICandidate {
    /** The admitted loft controls with its own station chart. */
    family: IAutoMovieHumanConicLoft.IFamily;
    /** The source markers used to form the chart. */
    rigJoints: ReadonlyArray<string>;
    /** Full length of the measured jointed course in millimetres. */
    courseLength: number;
    /** Observed stations refused for cut ownership or disconnected support. */
    excluded: { station: number; reason: string }[];
    /** Stations in the uninterrupted admitted run. */
    observed: number[];
    /** Point count, RMS and maximum radial error at each withheld cut. */
    heldout: { station: number; count: number; rms: number; max: number }[];
    /** Transverse saddle observations where the source supplied both legs. */
    pelvis?: IPelvis;
  }

  /** World-mm topology bracket and medial anchor at the last separated thighs. */
  export interface IPelvis {
    /** Height of the highest inspected plane with disjoint legs. */
    separated: number;
    /** Height of the lowest inspected plane owned by both thigh courses. */
    connected: number;
    /** World position midway between the last separated medial contour points. */
    anchor: Point3;
  }

  /** Rig centres and the course data fitted to the measured widths. */
  export type Course = Pick<
    IAutoMovieHumanConicLoft.IFamily,
    "centres" | "halves" | "up"
  >;
  /** A bone segment that a different part may own. */
  export type Segment = readonly [Point3, Point3];
  /** Closed skin loop in local chart millimetres. */
  export type Cut = (
    frame: IAutoMovieLoftSectionFrame,
    foreign?: readonly Segment[],
  ) => Point2[];
  type Contours = (
    frame: IAutoMovieLoftSectionFrame,
  ) => IAutoMovieMeshSectionChain[];

  const ARM: readonly string[] = [
    "joint-l-shoulder",
    "joint-l-elbow",
    "joint-l-hand",
  ];
  const SHOULDER_AND_ARM: readonly string[] = ["joint-l-clavicle", ...ARM];
  const LEG: readonly string[] = [
    "joint-l-upper-leg",
    "joint-l-knee",
    "joint-l-ankle",
  ];
  const TRUNK: readonly string[] = ["joint-pelvis", "joint-neck"];
  // ESTIMATE: a short pilot grid with one independent midpoint per training interval.
  const INTERVALS: number = 16;

  function unit(v: Point3): Point3 {
    const result: Point3 | null = Vector.unit(v);
    if (result === null) throw new Error("Coincident course centres");
    return result;
  }

  /**
   * Check another part's bone crossing against the skin face selected for this
   * part.
   */
  function crosses(
    points: Point2[],
    segment: Segment,
    { origin, u, v }: IAutoMovieLoftSectionFrame,
    w: Point3,
  ): boolean {
    const a: Point3 = Vector.sub(segment[0], origin);
    const b: Point3 = Vector.sub(segment[1], origin);
    const first: number = Vector.dot(a, w);
    const last: number = Vector.dot(b, w);
    const inside = (q: Point3): boolean =>
      encloses(points, [Vector.dot(q, u), Vector.dot(q, v)]);
    if (first === last) return first === 0 && (inside(a) || inside(b));
    const fraction: number = first / (first - last);
    return (
      fraction >= 0 &&
      fraction <= 1 &&
      inside(Vector.add(a, Vector.scale(Vector.sub(b, a), fraction)))
    );
  }

  /**
   * Closed section on the requested chart, enclosing its axis. Reject a hole
   * rather than bridge it.
   */
  function prepareContours(source: Mpfb.IGeometry): Contours {
    const read = AutoMovieMeshExtract.prepareOutline(source.body);
    return ({ origin, u, v }): IAutoMovieMeshSectionChain[] => {
      const w: Point3 = Vector.cross(v, u);
      // `tolerance` measures inter-station jumps, which are not read from this single-plane cut.
      return read(
        { origin: [...origin], axes: [w, [...u], [...v]] },
        [0],
        0,
        0,
        0,
      )[0]!.outer;
    };
  }

  /** Prepare one source and read closed cut loops without bridging gaps. */
  export function prepareCut(source: Mpfb.IGeometry): Cut {
    return selectCut(prepareContours(source));
  }

  function selectCut(contours: Contours): Cut {
    return (frame, foreign = []): Point2[] => {
      const { u, v } = frame;
      const w: Point3 = Vector.cross(v, u);
      const loop = contours(frame).find(
        ({ points, closed }): boolean => closed && encloses(points, [0, 0]),
      );
      if (loop === undefined)
        throw new Error("No closed skin section encloses the chart origin");
      if (
        foreign.some((segment): boolean =>
          crosses(loop.points, segment, frame, w),
        )
      )
        throw new Error("Skin section includes the centre of another part");
      return loop.points;
    };
  }

  /**
   * Observe the join of the thigh contours while both anatomical courses cross
   * the plane.
   */
  function measurePelvis(
    source: Mpfb.IGeometry,
    contours: Contours,
  ): IPelvis | undefined {
    const pelvis = source.joints.get("joint-pelvis");
    const lh = source.joints.get("joint-l-upper-leg");
    const lk = source.joints.get("joint-l-knee");
    const rh = source.joints.get("joint-r-upper-leg");
    const rk = source.joints.get("joint-r-knee");
    if (
      pelvis === undefined ||
      lh === undefined ||
      lk === undefined ||
      rh === undefined ||
      rk === undefined
    )
      return undefined;
    const section = (
      height: number,
    ): [IAutoMovieMeshSectionChain, IAutoMovieMeshSectionChain] => {
      const loops = contours({
        origin: [pelvis[0], height, pelvis[2]],
        u: [1, 0, 0],
        v: [0, 0, 1],
      });
      const owned = (hip: Point3, knee: Point3): IAutoMovieMeshSectionChain => {
        const along: number = (height - knee[1]) / (hip[1] - knee[1]);
        const point: Point3 = Vector.add(
          knee,
          Vector.scale(Vector.sub(hip, knee), along),
        );
        const loop = loops.find(
          ({ points, closed }): boolean =>
            closed &&
            encloses(points, [point[0] - pelvis[0], point[2] - pelvis[2]]),
        );
        if (loop === undefined)
          throw new Error(`No thigh loop at height ${height} mm`);
        return loop;
      };
      return [owned(lh, lk), owned(rh, rk)];
    };
    let separated: number = Math.max(lk[1], rk[1]);
    let connected: number = Math.min(lh[1], rh[1]);
    let [left, right] = section(separated);
    const [first, last] = section(connected);
    if (left === right || first !== last)
      throw new Error(
        "The thigh courses do not bracket a separate-to-connected pelvic cut",
      );
    // Resolve the saddle to the campaign's spatial admission tolerance, 0.01 mm.
    while (connected - separated > 0.01) {
      const height: number = (separated + connected) / 2;
      const [a, b] = section(height);
      if (a === b) connected = height;
      else {
        separated = height;
        left = a;
        right = b;
      }
    }
    const medial = (loop: IAutoMovieMeshSectionChain): Point2 =>
      loop.points.reduce(
        (a, b): Point2 => (Math.abs(b[1]) < Math.abs(a[1]) ? b : a),
      );
    const a: Point2 = medial(left);
    const b: Point2 = medial(right);
    return {
      separated,
      connected,
      anchor: [
        pelvis[0] + (a[0] + b[0]) / 2,
        separated,
        pelvis[2] + (a[1] + b[1]) / 2,
      ],
    };
  }

  /** Even–odd test of polygon containment in the plane. */
  function encloses(points: readonly Point2[], [u, v]: Point2): boolean {
    let inside: boolean = false;
    for (let i: number = 0; i < points.length; ++i) {
      const [x, y]: Point2 = points[i]!;
      const [a, b]: Point2 = points[(i + 1) % points.length]!;
      if (y > v !== b > v && u < x + ((v - y) * (a - x)) / (b - y))
        inside = !inside;
    }
    return inside;
  }

  /**
   * Keep the torso in a sagittal chart and allow its flesh line to move in that
   * chart.
   */
  function trunk(centres: Point3[], lower?: IPelvis): Course {
    const [pelvis, neck] = centres as [Point3, Point3];
    return {
      centres: [
        [pelvis[0], lower?.connected ?? pelvis[1], pelvis[2]],
        [pelvis[0], neck[1], pelvis[2]],
      ],
      halves: [],
      up: [1, 0, 0],
    };
  }

  /**
   * Round the observed joints so their axis curvature stays below the
   * reciprocal cut radius. The course owner refuses overlapping turns.
   */
  export function roundedCourse(
    centres: Point3[],
    cut: Cut,
    up: Point3 = [1, 0, 0],
  ): Course {
    const halves: number[] = centres.slice(1, -1).map((joint, i): number => {
      const from: Point3 = unit(Vector.sub(joint, centres[i]!));
      const to: Point3 = unit(Vector.sub(centres[i + 2]!, joint));
      const cosine: number = Vector.dot(from, to);
      const turn: number = Math.acos(Math.max(-1, Math.min(1, cosine)));
      if (turn === 0) return 0;
      const tangent: Point3 = unit(Vector.add(from, to));
      const bisector = Loft.axis({
        centres: [joint, Vector.add(joint, tangent)],
        halves: [],
        up,
      });
      const radius: number = Math.max(
        ...cut(bisector.at(0)).map(([u, v]): number => Math.hypot(u, v)),
      );
      // The quintic turn's peak angular rate is (15/16) * angle / halfLength.
      return radius * turn;
    });
    return { centres, halves, up };
  }

  /**
   * Centre the field in its cut box; fall back to the measured axis when the
   * box centre is outside the skin.
   */
  export function centred(
    points: Point2[],
    mirror: boolean,
  ): { origin: Point2; points: Point2[] } {
    const xs: number[] = points.map((p): number => p[0]);
    const ys: number[] = points.map((p): number => p[1]);
    const middle: Point2 = [
      (Math.min(...xs) + Math.max(...xs)) / 2,
      mirror ? 0 : (Math.min(...ys) + Math.max(...ys)) / 2,
    ];
    const origin: Point2 = encloses(points, middle) ? middle : [0, 0];
    return {
      origin,
      points: points.map(([u, v]): Point2 => [u - origin[0], v - origin[1]]),
    };
  }

  /**
   * Polygon crossings along a ray, ordered from its origin. A vertex can be
   * read from either incident edge.
   */
  function intersections(
    points: readonly Point2[],
    origin: Point2,
    direction: Point2,
  ): number[] {
    const hits: number[] = [];
    for (let i: number = 0; i < points.length; ++i) {
      const [x, y] = points[i]!;
      const [u, v] = points[(i + 1) % points.length]!;
      const dx: number = u - x;
      const dy: number = v - y;
      const det: number = direction[0] * dy - direction[1] * dx;
      if (det === 0) continue;
      const a: number = x - origin[0];
      const b: number = y - origin[1];
      const t: number = (a * dy - b * dx) / det;
      const edge: number = (a * direction[1] - b * direction[0]) / det;
      if (t > 0 && edge >= 0 && edge <= 1) hits.push(t);
    }
    return hits.sort((a, b): number => a - b);
  }

  /**
   * The four guides of the bare limb or bilateral layout, with a measured
   * shoulder per quarter.
   */
  export function fields(points: Point2[], mirror: boolean): number[] {
    const extreme = (dimension: 0 | 1, sign: 1 | -1): Point2 =>
      points.reduce(
        (a, b): Point2 => (sign * b[dimension] > sign * a[dimension] ? b : a),
      );
    const sagittal = (direction: 1 | -1): Point2 => [
      direction * intersections(points, [0, 0], [direction, 0]).at(-1)!,
      0,
    ];
    const front: Point2 = mirror ? sagittal(1) : extreme(0, 1);
    const back: Point2 = mirror ? sagittal(-1) : extreme(0, -1);
    const side: Point2 = extreme(1, 1);
    const guides: Point2[] = mirror
      ? [front, side, back]
      : [front, side, back, extreme(1, -1)];
    const values: number[] = mirror
      ? [front[0], ...side, back[0]]
      : guides.flat();
    for (let i: number = 0; i < (mirror ? 2 : 4); ++i) {
      const a: Point2 = guides[i]!;
      const b: Point2 = guides[(i + 1) % guides.length]!;
      const corner: Point2 = i % 2 === 0 ? [a[0], b[1]] : [b[0], a[1]];
      const mid: Point2 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      const shoulder: number | undefined = intersections(points, mid, [
        corner[0] - mid[0],
        corner[1] - mid[1],
      ]).find((t): boolean => t < 1);
      // When the chord already lies outside a concavity, the quarter ellipse is the simple tape wall.
      // Its rational conic weight is 1/sqrt(2), so its shoulder share is sqrt(2) - 1.
      values.push(shoulder ?? Math.SQRT2 - 1);
    }
    return values;
  }

  /** Read nested medians and subarc shoulders on the actually observed limb contour. */
  function refinedFields(
    points: Point2[],
    layout: ReturnType<typeof Conic.limb>,
  ): number[] {
    const basic: number[] = fields(points, false);
    const values: number[] = Array.from(
      { length: Conic.units(layout).length },
      (): number => 0,
    );
    const { at, shoulders } = Conic.offsets(layout);
    const anchors: (Point2 | null)[] = layout.anchors.map(() => null);
    const tangents: Point2[] = [];
    layout.anchors.forEach(({ kind, pick }, index): void => {
      if (kind !== "u" && kind !== "v") return;
      const q: number = (kind === "v" ? 1 : 0) + (pick === "min" ? 2 : 0);
      const anchor: Point2 = [basic[2 * q]!, basic[2 * q + 1]!];
      anchors[index] = anchor;
      tangents[index] = q % 2 === 0
        ? [0, q === 0 ? 1 : -1]
        : [q === 1 ? -1 : 1, 0];
      values[at[index]!] = anchor[0];
      values[at[index]! + 1] = anchor[1];
    });
    const read = (i: number, j: number, fallback: number) => {
      const a: Point2 = anchors[i]!, b: Point2 = anchors[j]!;
      const corner: Point2 = Conic.meet(a, tangents[i]!, b, tangents[j]!);
      const mid: Point2 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      const d: Point2 = [corner[0] - mid[0], corner[1] - mid[1]];
      const share: number = Conic.clamp(
        intersections(points, mid, d).find((x): boolean => x < 1) ?? fallback,
      );
      return { share, a, b, mid, d };
    };
    for (const index of Conic.dependents(layout)) {
      const [i, j] = Conic.neighbours(index, anchors);
      const { share, a, b, mid, d } = read(i, j, 0.5);
      anchors[index] = [mid[0] + share * d[0], mid[1] + share * d[1]];
      tangents[index] = [b[0] - a[0], b[1] - a[1]];
      values[at[index]!] = share;
    }
    for (let i: number = 0; i < anchors.length; ++i) {
      const { share } = read(i, (i + 1) % anchors.length, Math.SQRT2 - 1);
      values[shoulders + i] = Conic.shoulder(share, layout, i);
    }
    return values;
  }

  /**
   * Build the segment set from genuine source joint pairs and leave absent
   * pairs unobserved.
   */
  export function segments(
    source: Mpfb.IGeometry,
    joints: readonly string[],
  ): Segment[] {
    return joints.slice(1).flatMap((joint, i): Segment[] => {
      const a: Point3 | undefined = source.joints.get(joints[i]!);
      const b: Point3 | undefined = source.joints.get(joint);
      return a === undefined || b === undefined ? [] : [[a, b]];
    });
  }

  /**
   * Measure conic controls on training cuts and score generated sections at the
   * intervening cuts.
   */
  export function extract(
    source: Mpfb.IGeometry,
    names: readonly Name[] = ["arm", "leg", "trunk"],
    armDepth: number = 0,
  ): ICandidate[] {
    if (!Number.isInteger(armDepth) || armDepth < 0 || armDepth > 2)
      throw new Error("The supported arm observations use four, eight or sixteen conics");
    const contours: Contours = prepareContours(source);
    const cut: Cut = selectCut(contours);
    const pelvis: IPelvis | undefined = names.some(
      (name): boolean => name !== "arm",
    )
      ? measurePelvis(source, contours)
      : undefined;
    return names.map((name): ICandidate => {
      const rigJoints = { arm: ARM, leg: LEG, trunk: TRUNK }[name];
      const centres = rigJoints.map((joint): Point3 => {
        const centre = source.joints.get(joint);
        if (centre === undefined)
          throw new Error(`${name}: missing HM08 joint ${joint}`);
        return [...centre];
      });
      const course: Course =
        name === "trunk" ? trunk(centres, pelvis) : roundedCourse(centres, cut);
      const axis = Loft.axis(course);
      const courseLength = CourseRuns.joints(course.centres, course.halves).at(
        -1,
      )!;
      const refine: boolean = name === "arm" && armDepth > 0;
      const layout = name === "trunk" ? Conic.bilateral(0) : Conic.limb(refine ? armDepth : 0);
      const right = (joints: readonly string[]): string[] =>
        joints.map((joint): string => joint.replace("-l-", "-r-"));
      const foreign: Segment[] =
        name === "trunk"
          ? [
              ...segments(source, SHOULDER_AND_ARM),
              ...segments(source, right(SHOULDER_AND_ARM)),
            ]
          : [
              ...segments(source, TRUNK),
              ...(name === "leg" ? segments(source, right(LEG)) : []),
            ];
      const excluded: ICandidate["excluded"] = [];
      const runs: { station: number; origin: Point2; points: Point2[] }[][] = [
        [],
      ];
      // The small half-cell inset avoids coincident planes through end vertices of an open wall.
      for (let i: number = 0; i <= 2 * INTERVALS; ++i) {
        const station: number =
          (courseLength * (i + 0.5)) / (2 * INTERVALS + 1);
        try {
          const row = centred(cut(axis.at(station), foreign), layout.mirror);
          runs.at(-1)!.push({ station, ...row });
        } catch (error: unknown) {
          excluded.push({
            station,
            reason: error instanceof Error ? error.message : String(error),
          });
          if (runs.at(-1)!.length > 0) runs.push([]);
        }
      }
      const rows = runs.reduce((longest, run) =>
        run.length > longest.length ? run : longest,
      );
      if (rows.length < 3)
        throw new Error(
          `${name}: fewer than three contiguous conic sections: ${JSON.stringify(excluded)}`,
        );
      for (const run of runs)
        if (run !== rows)
          for (const { station } of run)
            excluded.push({
              station,
              reason: "Separated cut beyond the uninterrupted run",
            });
      excluded.sort((a, b): number => a.station - b.station);
      const training = rows
        .filter((_, i): boolean => i % 2 === 0 || i === rows.length - 1)
        .map((row) => ({
          ...row,
          values: refine
            ? refinedFields(row.points, layout)
            : fields(row.points, layout.mirror),
        }));
      const family: IAutoMovieHumanConicLoft.IFamily = {
        name,
        ...course,
        layout,
        knots: training.map(({ station }): number => station),
        values: training[0]!.values.map((_, field): number[] =>
          training.map(({ values }): number => values[field]!),
        ),
        origin: {
          u: training.map(({ origin }): number => origin[0]),
          v: training.map(({ origin }): number => origin[1]),
        },
        ...(name === "trunk" ? {} : { rootSectionMark: training[0]!.station }),
      };
      const stations = rows.map(({ station }): number => station);
      const result = Loft.create(family, stations);
      if (result.chain === null || result.diagnostics.length > 0)
        throw new Error(
          `${name}: candidate loft refused: ${JSON.stringify(result.diagnostics)}`,
        );
      const read = Loft.reader(family);
      const publishedAxis = Loft.axis(family);
      const heldout = rows
        .filter((_, i): boolean => i % 2 === 1 && i < rows.length - 1)
        .map(({ station, points, origin }) => {
          const section = Conic.chain(read(station), layout);
          const before = axis.at(station);
          const offset: Point3 = Vector.sub(
            publishedAxis.at(station).origin,
            before.origin,
          );
          const u: number = Vector.dot(before.u, offset);
          const v: number = Vector.dot(before.v, offset);
          const errors = points.map(([x, y]): number => {
            const a: number = x + origin[0] - u;
            const b: number = y + origin[1] - v;
            return Math.abs(
              AutoMovieViewChain.radius(section, Math.atan2(b, a)) -
                Math.hypot(a, b),
            );
          });
          if (!errors.every(Number.isFinite))
            throw new Error(`${name}: missing radial read at ${station} mm`);
          return {
            station,
            count: errors.length,
            rms: Math.sqrt(
              errors.reduce((sum, e): number => sum + e * e, 0) / errors.length,
            ),
            max: Math.max(...errors),
          };
        });
      return {
        family,
        rigJoints,
        courseLength,
        excluded,
        observed: stations,
        heldout,
        ...(name !== "arm" && pelvis !== undefined ? { pelvis } : {}),
      };
    });
  }

  /**
   * Regenerate candidate records from the pinned public mesh and write them
   * with their source identity.
   */
  export async function main(): Promise<void> {
    const output: string | undefined = process.argv
      .find((arg): boolean => arg.startsWith("--out="))
      ?.slice(6);
    const file: string | undefined = process.argv
      .find((arg): boolean => arg.startsWith("--mesh="))
      ?.slice(7);
    const { source, ...geometry } = await Mpfb.load(file);
    const candidates = extract(geometry);
    if (output !== undefined)
      await writeFile(
        output,
        JSON.stringify({ source, candidates }, undefined, 2) + "\n",
      );
    for (const item of candidates)
      console.log(
        `${item.family.name}: ${item.family.knots.length} knots, ${item.heldout.length} held-out sections, max ${Math.max(...item.heldout.map(({ max }): number => max)).toFixed(2)} mm: ${item.excluded.length} refused cuts`,
      );
  }
}

if (
  typeof require !== "undefined" &&
  typeof module !== "undefined" &&
  require.main === module &&
  path.parse(process.argv[1] ?? "").name === "FamilyConicMpfbFamilies"
)
  FamilyConicMpfbFamilies.main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
