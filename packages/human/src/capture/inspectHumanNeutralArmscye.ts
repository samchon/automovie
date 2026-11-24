import {
  AutoMovieIllinois,
  AutoMovieLoftViewFullSource,
  AutoMovieViewParameter,
  AutoMovieSolidVector as V,
} from "@automovie/engine";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieLoftViewFullSource,
  IAutoMovieSolidSharedCurve,
  IAutoMovieViewPart,
} from "@automovie/interface";

import { AutoMovieHumanBodyLaw } from "../generation/AutoMovieHumanBodyLaw";
import { AutoMovieHumanNeckBoundary } from "../generation/AutoMovieHumanNeckBoundary";
import { AutoMovieHumanArmscyePort } from "../generation/conic/AutoMovieHumanArmscyePort";
import { AutoMovieHumanJoinLoop } from "../generation/conic/AutoMovieHumanJoinLoop";
import { AutoMovieHumanNeutralParameters } from "./AutoMovieHumanNeutralParameters";
import { inspectHumanArmscyeMeridians } from "./inspectHumanArmscyeMeridians";
import { inspectHumanArmscyeSlices } from "./inspectHumanArmscyeSlices";

type Options = {
  useDatum: boolean;
  chordDirection: boolean;
  firstClearRing: boolean;
  slices: boolean;
};

/**
 * Inspect one conic on each side of the actual trunk chart. The person's own
 * acromial and axillary levels supply its vertical extrema. As an ESTIMATE for
 * the anterior and posterior folds before attachment, register the protected
 * deltoid section's AP extremes on the midpoint trunk plane. A lateral half
 * section gives one monotone inverse per registration. The resulting ellipse is
 * an admissibility probe of the two actual sources.
 *
 * Wang §3.1 locates the underarm from the conjoined contours of a standing
 * scan. The independent trunk has no such conjoined contour yet, so this probe
 * uses the named regional inputs and a bounded source registration.
 *
 * @see https://mewangcl.github.io/pubs/CADParaHuman.pdf
 * @see https://www.iso.org/standard/61686.html
 */
export function inspectHumanNeutralArmscye(options: Options): void {
  const context = AutoMovieHumanBodyLaw.prepareSources(
    AutoMovieHumanNeutralParameters,
  );
  const common = context.common();
  const scoped = { ...context, common: () => common };
  const head = context.headSource(common).source.tapeInvariant.part;
  const { axilla: lower, acromion: upper } = context.trunkInputs;
  const { neckBase } = context.headInputs;
  const scale = context.limbs.legs.scale;
  const neck = {
    suprasternale: neckBase.suprasternaleHeight * scale,
    side: neckBase.sideNeckPointHeight * scale,
    cervicale: neckBase.cervicaleHeight * scale,
  };
  const boundary = context.neckBoundary(common);
  const original = { ...scoped, neckBoundary: () => boundary };
  inspect(original, head, { lower, upper, neck }, options);
}

function inspect(
  context: ReturnType<typeof AutoMovieHumanBodyLaw.prepareSources>,
  head: IAutoMovieViewPart,
  levels: {
    lower: number;
    upper: number;
    neck: { suprasternale: number; side: number; cervicale: number };
  },
  { useDatum, chordDirection, firstClearRing, slices }: Options,
): void {
  const { lower, upper, neck } = levels;
  const boundary = context.neckBoundary();
  const trunk = AutoMovieHumanBodyLaw.trunkSource(context);
  const sourceSites = [...trunk.sections.keys()];
  const base = trunk.sources.filter((item) => item.name === "trunk").at(-1)
    ?.result.part;
  if (base === null || base === undefined || !(upper > lower))
    throw new Error(
      `Armscye inspection needs the original trunk and ordered axilla/acromion levels (${lower}, ${upper} mm). Available planes: ${sourceSites.join(", ")}`,
    );
  const host = useDatum
    ? shoulderDatum(base, lower, upper, boundary.seat.side)
    : base;
  const wall = AutoMovieLoftViewFullSource.create(host);
  const contact = neckContact(wall, head, boundary.seat.y, host.samples);
  const rest = context.limbRest(boundary);
  for (const side of ["left", "right"] as const) {
    try {
      const limb = rest.arm(side);
      const arm = context
        .limbSources({ ...rest, arm: () => limb })
        .arm(side)
        .definition().part;
      if (arm === null) throw new Error(`No original arm.${side}`);
      const result = slices
        ? {
            sections: sectionSight(wall, arm, limb.bones, side, lower),
            levelBounds: [lower, upper, boundary.seat.y].map((station) => ({
              station,
              anterior: wall.point(station, 0),
              posterior: wall.point(station, Math.PI),
            })),
          }
        : observe(host, wall, arm, lower, upper, side, {
            chordDirection,
            firstClearRing,
          });
      console.log(
        JSON.stringify({
          side,
          datum: useDatum,
          neck,
          contact,
          sourceSites,
          hostDomain: wall.domain,
          lateralOutline: host.side.positive.knots,
          chordDirection,
          firstClearRing,
          ...result,
        }),
      );
    } catch (error) {
      console.log(
        JSON.stringify({
          side,
          lower,
          upper,
          neck,
          contact,
          sourceSites,
          hostDomain: wall.domain,
          error: String(error),
        }),
      );
    }
  }
}

function sectionSight(
  wall: IAutoMovieLoftViewFullSource.IReader,
  arm: IAutoMovieViewPart,
  bones: {
    shoulder: AutoMovieVector3Tuple;
    elbow: AutoMovieVector3Tuple;
  },
  side: "left" | "right",
  axilla: number,
) {
  const shaft = AutoMovieLoftViewFullSource.create(arm);
  const mark = arm.front.positive.knots.find(
    ({ site }) => site === "deltoid",
  )?.station;
  if (mark === undefined) throw new Error("No original deltoid section");
  return inspectHumanArmscyeSlices({
    host: wall,
    child: shaft,
    side,
    joint: bones.shoulder,
    course: V.sub(bones.elbow, bones.shoulder),
    axilla,
    reach:
      Math.abs(shaft.point(mark, 0)[0] - shaft.point(mark, Math.PI)[0]) / 2,
    count: arm.samples,
  });
}

/**
 * ESTIMATE: the shoulder's transverse upper line follows the direction between
 * the existing acromion and the measured side-neck point. Dissections locate
 * lateral trapezius insertion and deltoid origin in this region. Use the
 * straight anatomical chord's derivatives where the input owns only the
 * endpoints. At the axilla use the upper arm's take-off from the person's own
 * axillary breadth toward the acromion. The original width knots and the exact
 * neck contact are kept. The chain rule converts both straight chord jets to
 * the original outline's normalized parameter.
 *
 * @see https://pmc.ncbi.nlm.nih.gov/articles/PMC2666142/
 * @see https://pmc.ncbi.nlm.nih.gov/articles/PMC12975017/
 */
function shoulderDatum(
  part: IAutoMovieViewPart,
  lower: number,
  upper: number,
  neck: AutoMovieVector3Tuple,
): IAutoMovieViewPart {
  const change = (
    outline: IAutoMovieViewPart.IOutline,
    side: 1 | -1,
  ): IAutoMovieViewPart.IOutline => {
    const at = (s: number): number =>
      AutoMovieViewParameter.at(outline.parameter, s);
    const acromion = outline.knots.find((knot) => knot.station === upper);
    const axilla = outline.knots.find((knot) => knot.station === lower);
    if (acromion === undefined || axilla === undefined)
      throw new Error(
        "The torso outline does not declare both armscye heights",
      );
    const span =
      at(outline.knots.at(-1)!.station) - at(outline.knots[0]!.station);
    const neckRadius = neck[2] * side - part.axis.at(neck[1]).origin[2];
    const author = (
      knot: IAutoMovieViewPart.IKnot,
      slope: number,
    ): IAutoMovieViewPart.IKnot => {
      const inverse = AutoMovieViewParameter.inverseJet(
        outline.parameter,
        knot.station,
      );
      if (inverse === null)
        throw new Error("An armscye knot leaves its regular outline chart");
      return {
        ...knot,
        jet: {
          first: slope * inverse[0] * span,
          second: slope * inverse[1] * span * span,
        },
      };
    };
    const shoulderLine = author(
      acromion,
      (neckRadius - acromion.value) / (neck[1] - upper),
    );
    const underarmLine = author(
      axilla,
      (acromion.value - axilla.value) / (upper - lower),
    );
    return {
      ...outline,
      knots: outline.knots.map((knot) =>
        knot === acromion
          ? shoulderLine
          : knot === axilla
            ? underarmLine
            : knot,
      ),
    };
  };
  return {
    ...part,
    side: {
      positive: change(part.side.positive, 1),
      negative: change(part.side.negative, -1),
    },
  };
}

/** The original head's lower field is exact here, before the upper tape fit. */
function neckContact(
  trunk: IAutoMovieLoftViewFullSource.IReader,
  head: IAutoMovieViewPart,
  station: number,
  samples: number,
) {
  const original = AutoMovieLoftViewFullSource.create(head);
  const retained = AutoMovieLoftViewFullSource.create(
    AutoMovieHumanNeckBoundary.retainHead(head, station),
  );
  const keys = ["p", "u", "v", "uu", "uv", "vv"] as const;
  const maximum = { p: 0, u: 0, v: 0, uu: 0, uv: 0, vv: 0 };
  const retainedDifference = { ...maximum };
  for (let index = 0; index < samples; ++index) {
    const phase = (2 * Math.PI * index) / samples;
    const a = trunk.jet(station, phase);
    const b = retained.jet(station, phase);
    const c = original.jet(station, phase);
    for (const key of keys)
      maximum[key] = Math.max(maximum[key], V.norm(V.sub(a[key], b[key])));
    for (const key of keys)
      retainedDifference[key] = Math.max(
        retainedDifference[key],
        V.norm(V.sub(b[key], c[key])),
      );
  }
  return { station, domain: retained.domain, maximum, retainedDifference };
}

function observe(
  host: IAutoMovieViewPart,
  wall: IAutoMovieLoftViewFullSource.IReader,
  arm: IAutoMovieViewPart,
  lower: number,
  upper: number,
  side: "left" | "right",
  options: {
    chordDirection: boolean;
    firstClearRing: boolean;
  },
) {
  const { chordDirection, firstClearRing } = options;
  const shaft = AutoMovieLoftViewFullSource.create(arm);
  const mark = arm.front.positive.knots.find(
    ({ site }) => site === "deltoid",
  )?.station;
  if (mark === undefined || !(mark > shaft.domain[0] && mark < shaft.domain[1]))
    throw new Error(
      `${arm.name} has deltoid at ${mark} and original domain ${shaft.domain.join(" to ")} mm`,
    );
  if (!(lower > wall.domain[0] && upper < wall.domain[1]))
    throw new Error(
      `The axilla/acromion span ${lower} to ${upper} mm leaves the retained trunk`,
    );
  const markOrigin = arm.axis.at(mark).origin;
  const middle = (lower + upper) / 2;
  const quarter =
    side === "left"
      ? ([0, Math.PI] as const)
      : ([Math.PI, 2 * Math.PI] as const);
  const phaseAt = (
    station: number,
    x: number,
    read = wall.pointAt(station),
  ): number => {
    const phase = AutoMovieIllinois.root(
      (angle) => read(angle)[0] - x,
      ...quarter,
      1e-9,
      100,
    );
    if (phase === null || Math.abs(read(phase)[0] - x) > 1e-7)
      throw new Error(
        `Deltoid AP coordinate ${x} mm has no bounded lateral trunk address at ${station} mm`,
      );
    return phase;
  };
  const apertures = [shaft.point(mark, 0)[0], shaft.point(mark, Math.PI)[0]];
  const height = (upper - lower) / 2;
  const address = (point: AutoMovieVector3Tuple) => {
    const [station, phase] = AutoMovieHumanJoinLoop.address(
      arm,
      shaft.domain,
      point,
      mark,
    );
    const radius = V.norm(V.sub(point, arm.axis.at(station).origin));
    return { station, phase, radius };
  };
  const normal = (
    loop: IAutoMovieSolidSharedCurve.Loop,
    clock: number,
  ): AutoMovieVector3Tuple => {
    const q = loop(clock);
    const jet = wall.jet(...q.point);
    const away = V.sub(jet.p, host.axis.at(q.point[0]).origin);
    const cross = V.cross(jet.u, jet.v);
    return V.scale(cross, Math.sign(V.dot(cross, away)) / V.norm(cross));
  };
  const at = (loop: IAutoMovieSolidSharedCurve.Loop, clock: number) => {
    const q = loop(clock);
    const jet = wall.jet(...q.point);
    const [s, t] = q.first,
      [ss, tt] = q.second;
    const first = V.add(V.scale(jet.u, s), V.scale(jet.v, t));
    const second = V.add(
      V.add(V.scale(jet.u, ss), V.scale(jet.v, tt)),
      V.add(
        V.add(V.scale(jet.uu, s * s), V.scale(jet.uv, 2 * s * t)),
        V.scale(jet.vv, t * t),
      ),
    );
    return { point: jet.p, first, second };
  };
  const reach = Math.abs(apertures[0]! - apertures[1]!) / 2;
  const corrected = (loop: IAutoMovieSolidSharedCurve.Loop) => {
    try {
      const result = AutoMovieHumanArmscyePort.place({
        master: {
          hostAt: loop,
          normal: (clock) => normal(loop, clock),
          at: (clock) => at(loop, clock),
        },
        host: wall,
        hostAxis: host.axis,
        childAxis: arm.axis,
        address: (point) => {
          try {
            return address(point);
          } catch {
            return null;
          }
        },
        owns: (p) => (side === "left" ? p[2] > 0 : p[2] < 0),
        count: arm.samples,
        reachShare: reach / (loop(0).point[0] - loop(Math.PI).point[0]),
        tolerance: 0.001,
      });
      return {
        from: result.from,
        mark: result.mark,
        extent: result.extent,
        arcs: result.arcs,
        clocks: result.clocks,
      };
    } catch (error) {
      return { error: String(error) };
    }
  };
  // The source axis carries fore-aft lean. Prescribe the conic in world AP
  // coordinates and recover the parent's angular values and exact two jets.
  const origin = arm.axis.at(shaft.domain[0]).origin;
  const axis = V.sub(markOrigin, origin);
  const inclination = axis[0] / axis[1];
  const depthCentre = (apertures[0]! + apertures[1]!) / 2;
  const depthRadius = (apertures[0]! - apertures[1]!) / 2;
  const centreX = (s: number): number =>
    depthCentre + (s - markOrigin[1]) * inclination;
  const physical: IAutoMovieSolidSharedCurve.Loop = (clock) => {
    const cos = Math.cos(clock);
    const sin = Math.sin(clock);
    const s = middle + height * cos;
    const ds = -height * sin;
    const dds = -height * cos;
    const x = centreX(s) + depthRadius * sin;
    const dpX = inclination * ds + depthRadius * cos;
    const ddpX = inclination * dds - depthRadius * sin;
    const phase = phaseAt(s, x);
    const { u, v, uu, uv, vv } = wall.jet(s, phase);
    const dp = (dpX - u[0] * ds) / v[0];
    const ddp =
      (ddpX -
        u[0] * dds -
        uu[0] * ds ** 2 -
        2 * uv[0] * ds * dp -
        vv[0] * dp ** 2) /
      v[0];
    return { point: [s, phase], first: [ds, dp], second: [dds, ddp] };
  };
  const outlet = firstClearRing
    ? clearOutlet({
        wall,
        shaft,
        arm,
        limit: mark + reach,
        side,
        phaseAt,
        after: Math.max(
          ...Array.from(
            { length: arm.samples },
            (_, i) =>
              address(
                wall.point(...physical((2 * Math.PI * i) / arm.samples).point),
              ).station,
          ),
        ),
      })
    : mark;
  const elbow = arm.front.positive.knots.find(
    ({ site }) => site === "elbow",
  )?.station;
  if (elbow === undefined || !(elbow > outlet && elbow <= shaft.domain[1]))
    throw new Error("No retained original elbow beyond the armscye outlet");
  const physicalLoop = inspectHumanArmscyeMeridians({
    host: wall,
    child: shaft,
    reach,
    count: arm.samples,
    loop: physical,
    centre: [middle, phaseAt(middle, centreX(middle))],
    materialPhase: (p) => address(p).phase,
    chordDirection,
    mark: outlet,
    surfaces: {
      host: surface(host, wall, middle),
      child: {
        ...surface(arm, shaft, outlet),
        domain: [outlet, elbow],
      },
    },
  });
  const began = performance.now();
  const physicalPort = corrected(physical);
  return {
    lower,
    upper,
    mark,
    outlet,
    physicalLoop,
    physicalPort,
    moveMilliseconds: performance.now() - began,
  };
}

/**
 * Keep the first complete original section past the parent curve that has
 * lateral clearance at every sampled azimuth. Invert the actual host at the
 * point's AP coordinate. A point outside the AP range of a level section cannot
 * lie inside that section. The clearance comes from the campaign overlap
 * tolerance.
 */
function clearOutlet(input: {
  wall: IAutoMovieLoftViewFullSource.IReader;
  shaft: IAutoMovieLoftViewFullSource.IReader;
  arm: IAutoMovieViewPart;
  after: number;
  limit: number;
  side: "left" | "right";
  phaseAt: (
    station: number,
    x: number,
    read: (phase: number) => AutoMovieVector3Tuple,
  ) => number;
}): number {
  const { wall, shaft, arm, after, limit, side, phaseAt } = input;
  const sense = side === "left" ? 1 : -1;
  const phases = Array.from(
    { length: arm.samples },
    (_, i) => (2 * Math.PI * i) / arm.samples,
  );
  const clear = arm.stations.find((station) => {
    if (!(station > after && station < Math.min(limit, shaft.domain[1])))
      return false;
    const ring = shaft.pointAt(station);
    return phases.every((phase) => {
      const [x, y, z] = ring(phase);
      if (y < wall.domain[0] || y > wall.domain[1]) return false;
      const section = wall.pointAt(y);
      if (x < section(Math.PI)[0] || x > section(0)[0]) return true;
      return sense * (z - section(phaseAt(y, x, section))[2]) > 0.01;
    });
  });
  if (clear === undefined)
    throw new Error(
      "No original arm section clears the retained torso inside one fold reach",
    );
  return clear;
}

function surface(
  part: IAutoMovieViewPart,
  read: IAutoMovieLoftViewFullSource.IReader,
  station: number,
) {
  const jet = read.jet(station, 0);
  const radial = V.sub(jet.p, part.axis.at(station).origin);
  const orientation: 1 | -1 = V.dot(V.cross(jet.u, jet.v), radial) > 0 ? 1 : -1;
  return {
    name: part.name,
    orientation,
    domain: [read.domain[0], read.domain[1]] as [number, number],
    period: 2 * Math.PI,
    point: read.point,
    pointAt: read.pointAt,
    jet: read.jet,
  };
}
