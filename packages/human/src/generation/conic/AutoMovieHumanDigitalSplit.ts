import {
  AutoMovieLoftViewFullSource as Full,
  type ISplitCourseInput,
  AutoMovieConstructionSkinCut as SkinCut,
  AutoMovieConstructionSplitCompose as Split,
  AutoMovieSolidVector as Vec,
  prepareSplitStrips,
} from "@automovie/engine";
import type {
  IAutoMovieConstructionNode,
  IAutoMovieConstructionSplit,
  IAutoMovieLoftViewFullSource,
  IAutoMovieSolidSurface,
  IAutoMovieViewPart,
  AutoMovieVector3Tuple as P3,
} from "@automovie/interface";

import { physicalClock, support } from "./AutoMovieHumanDigitalSection";
import { AutoMovieHumanSkinDivide as Divide } from "./AutoMovieHumanSkinDivide";

const TURN = 2 * Math.PI;
const RECEIVING_SITES = [
  "root",
  "base",
  "shaft 0",
  "joint 1",
  "shaft 1",
  "joint 2",
];

interface Digit {
  /** The original posed digit's skin and two bone landmarks. */
  part: IAutoMovieViewPart;
  /** The proximal segment of this digit, in the parent's physical frame. */
  bounds: Divide.IDigit;
}

/**
 * The person's proximal phalanx and adjacent native skin determine the
 * branching row.
 */
export namespace AutoMovieHumanDigitalSplit {
  /**
   * Read the actual regular parent boundary and immutable native receiving
   * rails.
   */
  export function source(
    parent: IAutoMovieViewPart,
    kind: "hand" | "foot",
    digits: readonly Digit[],
    up: P3,
  ) {
    const host = Full.create(parent);
    const site = kind === "hand" ? "knuckles" : "ball";
    const mark = parent.front.positive.knots.find(
      (k): boolean => k.site === site,
    )?.station;
    if (mark === undefined || host.regular === null)
      return `${parent.name}: there is no original regular ${site} boundary`;
    const count = Math.max(
      parent.samples,
      ...digits.map(({ part }) => part.samples),
    );
    const phases = Array.from(
      { length: count },
      (_, k): number => (TURN * k) / count,
    );
    const basis = Split.basis(parent.axis.at(mark), 1)!;
    const heads = digits.map(({ bounds }) => bounds.first);
    const heading = Vec.cross(Vec.sub(heads.at(-1)!, heads[0]!), up);
    const axis = Vec.unit(heading);
    if (axis === null)
      return `${parent.name}: anatomical head row has no section plane`;
    const forward = Vec.scale(axis, Math.sign(Vec.dot(heading, basis.z)));
    const center = Vec.scale(
      heads.reduce(Vec.add, [0, 0, 0]),
      1 / heads.length,
    );
    const rail = digits.map(({ part, bounds }) => {
      const field = Full.create(part);
      const observed = part.side.positive.knots.flatMap(({ station, site }) => {
        if (
          !RECEIVING_SITES.includes(site) ||
          !(station > field.domain[0] && station < field.domain[1])
        )
          return [];
        const at = section(field, station);
        const samples = phases.map(at.point);
        const rear = support(at, Vec.scale(basis.z, -1), samples);
        return [
          {
            station,
            at,
            samples,
            progress: Vec.dot(Vec.sub(rear.p, basis.origin), basis.z),
          },
        ];
      });
      // The named joint or shaft row owns the actual distal field. When an
      // entire digit lies behind the flat mark, keep its latest eligible row.
      const chosen =
        observed.find(({ progress }): boolean => progress > 0) ??
        observed.at(-1);
      if (chosen === undefined) return part.name;
      const centroid = Vec.scale(
        chosen.samples.reduce(Vec.add, [0, 0, 0]),
        1 / count,
      );
      const { u, v } = part.axis.at(chosen.station);
      return {
        ...chosen,
        part,
        field,
        bounds,
        clock: physicalClock(chosen.at, chosen.samples, centroid, u, v),
      };
    });
    const missing = rail.filter((r): r is string => typeof r === "string");
    if (missing.length !== 0)
      return `No original receiving rows for ${missing.join(", ")}`;
    const donors = rail.filter((r) => typeof r !== "string");
    // The dorsal MCP/MTP-to-PIP distance in the primary study measured these
    // two physical landmarks. ESTIMATE for the person's unmeasured web tip.
    // https://doi.org/10.1053/j.jfas.2019.07.005
    const ratio = kind === "foot" ? 0.72 : 0.51;
    const tips = donors.map(({ part, field, bounds }) => {
      const axis = Vec.unit(Vec.sub(bounds.second, bounds.first))!;
      const prominence = (bone: P3): P3 => {
        const difference = (s: number): number =>
          Vec.dot(Vec.sub(part.axis.at(s).origin, bone), axis);
        let [a, b] = field.domain;
        if (difference(a) >= 0) b = a;
        else if (difference(b) <= 0) a = b;
        while (a < b) {
          const m = (a + b) / 2;
          if (m === a || m === b) break;
          if (difference(m) < 0) a = m;
          else b = m;
        }
        const ring = section(field, (a + b) / 2);
        const tape = phases.map(ring.point);
        return tape.every((p): boolean => Vec.norm(Vec.sub(p, tape[0]!)) === 0)
          ? tape[0]!
          : support(ring, up, tape).p;
      };
      return Vec.combine([
        [1 - ratio, prominence(bounds.first)],
        [ratio, prominence(bounds.second)],
      ]);
    });
    const dividers = donors.slice(0, -1).map((left, i) => {
      const right = donors[i + 1]!;
      const web = Divide.web(left.bounds, right.bounds, up);
      const a = support(left.at, web.normal, left.samples).p;
      const b = support(right.at, Vec.scale(web.normal, -1), right.samples).p;
      const offset = Vec.dot(
        Vec.sub(Vec.scale(Vec.add(a, b), 0.5), web.point),
        web.normal,
      );
      return {
        point: Vec.add(web.point, Vec.scale(web.normal, offset)),
        normal: web.normal,
        tip: Vec.scale(Vec.add(tips[i]!, tips[i + 1]!), 0.5),
      };
    });
    const [low, high] = host.regular;
    const regularEnd = section(host, high);
    const limit = support(
      regularEnd,
      Vec.scale(forward, -1),
      phases.map(regularEnd.point),
    ).p;
    // The latest parallel plane is jointly owned by all phases in the regular
    // span. The strict crossing bracket needs only its floating-point margin.
    const offset = Math.min(
      0,
      Vec.dot(Vec.sub(limit, center), forward) -
        4 * Number.EPSILON * Vec.norm(limit),
    );
    const origin = Vec.add(center, Vec.scale(forward, offset));
    const bounds: [number, number] =
      offset === 0 ? [host.domain[0], host.domain[1]] : [low, high];
    const stations =
      offset === 0
        ? parent.stations
        : [
            low,
            ...parent.stations.filter((s): boolean => s > low && s < high),
            high,
          ];
    const cut = SkinCut.create({
      surface: {
        domain: bounds,
        period: TURN,
        orientation: 1,
        name: parent.name,
        jet: host.jet,
        point: host.point,
        pointAt: host.pointAt,
      },
      planes: [{ normal: forward, point: origin }],
      into: 1,
      stations,
      samples: count,
    });
    if (typeof cut === "string") return cut;
    const boundary = {
      point:
        cut.point ??
        ((phase: number): P3 => host.point(cut.at(phase)[0], phase)),
      jet: (phase: number): IAutoMovieSolidSurface.IJet => {
        const [s, ds, dds] = cut.at(phase);
        const j = host.jet(s, phase);
        return {
          ...j,
          v: Vec.add(j.v, Vec.scale(j.u, ds)),
          uv: Vec.add(j.uv, Vec.scale(j.uu, ds)),
          vv: Vec.combine([
            [1, j.vv],
            [2 * ds, j.uv],
            [ds * ds, j.uu],
            [dds, j.u],
          ]),
        };
      },
    };
    const forks = Split.forks(
      boundary.point,
      dividers,
      phases.map(boundary.point),
    );
    if (typeof forks === "string") return forks;
    const rails = donors.map((d) => ({
      ...d,
      reach: Vec.dot(
        Vec.sub(support(d.at, Vec.scale(forward, -1), d.samples).p, origin),
        forward,
      ),
    }));
    const unreachable = rails.filter(({ reach }): boolean => !(reach > 0));
    if (unreachable.length !== 0)
      return `The parent passes ${unreachable.map(({ part }) => part.name).join(", ")}`;
    const input: ISplitCourseInput = {
      parent: {
        field: host,
        cut: boundary,
        proximal: parent.stations
          .filter((s): boolean => s < cut.reach[0])
          .at(-1)!,
        phaseStart: forks.at(-1)![0],
        station: (phase): number => cut.at(phase)[0],
      },
      rails,
      forks,
      dividers: dividers.map((d) => ({
        ...d,
        estimatedReach: Vec.dot(Vec.sub(d.tip, origin), forward),
      })),
      forward,
      up,
    };
    return { input, cut };
  }

  /** Prepare the regular original fan and its normal construction declaration. */
  export function prepare(
    parent: IAutoMovieViewPart,
    kind: "hand" | "foot",
    digits: readonly Digit[],
    up: P3,
    host: IAutoMovieConstructionNode,
    parts: readonly IAutoMovieConstructionNode[],
  ) {
    const native = source(parent, kind, digits, up);
    if (typeof native === "string") return native;
    const bandNames = parts.map(({ name }) => `${name}.web`);
    const geometry = prepareSplitStrips(native.input, bandNames);
    if (typeof geometry === "string") return geometry;
    const children = parts.map(
      (part, i): IAutoMovieConstructionSplit.IChild => ({
        part,
        partFace: part.name,
        partEnd: "bottom",
        band: bandNames[i]!,
        rail: native.input.rails[i]!.reach / 1000,
      }),
    );
    const [first, ...outer] = native.input.forks;
    const node: IAutoMovieConstructionSplit = {
      type: "split",
      name: `fan.${parent.name}`,
      host,
      hostFace: parent.name,
      hostEnd: "top",
      seam: first!,
      outer: outer.map((seam) => ({ seam })),
      count: geometry.count,
      rows: geometry.rows,
      children: children as IAutoMovieConstructionSplit["children"],
    };
    return {
      node,
      bands: geometry.bands,
      cut: native.cut.at,
      rails: new Map(
        native.input.rails.map(({ part, station }) => [part.name, station]),
      ),
    };
  }
}

/** Bind the point sampler once to the caller's explicit station. */
function section(field: IAutoMovieLoftViewFullSource.IReader, station: number) {
  return {
    point: field.pointAt(station),
    jet: (phase: number): IAutoMovieSolidSurface.IJet =>
      field.jet(station, phase),
  };
}
