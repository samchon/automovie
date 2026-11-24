import {
  AutoMovieIllinois,
  AutoMovieLoftViewFullSource,
  AutoMovieViewParameter,
  AutoMovieSolidVector as V,
  bracketedMinimum,
} from "@automovie/engine";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanBodyLane,
  IAutoMovieLoftViewFullSource,
  IAutoMovieSolidSharedCurve,
  IAutoMovieViewPart,
} from "@automovie/interface";

import { AutoMovieHumanBodyLaw } from "../generation/AutoMovieHumanBodyLaw";
import { AutoMovieHumanNeckBoundary } from "../generation/AutoMovieHumanNeckBoundary";
import { AutoMovieHumanTrunkRows } from "../generation/AutoMovieHumanTrunkRows";
import { AutoMovieHumanArmscyePort } from "../generation/conic/AutoMovieHumanArmscyePort";
import { AutoMovieHumanJoinLoop } from "../generation/conic/AutoMovieHumanJoinLoop";
import { AutoMovieHumanNeutralParameters } from "./AutoMovieHumanNeutralParameters";
import { inspectHumanArmscyeAssembly } from "./inspectHumanArmscyeAssembly";
import { inspectHumanArmscyeMeridians } from "./inspectHumanArmscyeMeridians";
import { inspectHumanArmscyePort } from "./inspectHumanArmscyePort";
import { inspectHumanArmscyeSlices } from "./inspectHumanArmscyeSlices";
import { inspectHumanArmscyeSlopeGrid } from "./inspectHumanArmscyeSlopeGrid";

type Options = {
  useDatum: boolean;
  chordDirection: boolean;
  firstClearRing: boolean;
  slices: boolean;
  slopeGrid: boolean;
  anatomicalShoulder: boolean;
  enginePort: boolean;
  engineCrestRange: boolean;
  engineTorsoRange: boolean;
  acromialTorso: boolean;
  engineMeridianGuide: boolean;
  engineBody: boolean;
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
  const body = options.engineBody
    ? AutoMovieHumanBodyLaw.define(AutoMovieHumanNeutralParameters)
    : undefined;
  const context =
    body?.prepared ?? AutoMovieHumanBodyLaw.prepareSources(AutoMovieHumanNeutralParameters);
  const common = context.common();
  const scoped = { ...context, common: () => common };
  const head = body === undefined
    ? context.headSource(common).source.tapeInvariant.part
    : undefined;
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
  inspect(original, head, { lower, upper, neck }, options, body?.lane);
}

function inspect(
  context: ReturnType<typeof AutoMovieHumanBodyLaw.prepareSources>,
  head: IAutoMovieViewPart | undefined,
  levels: {
    lower: number;
    upper: number;
    neck: { suprasternale: number; side: number; cervicale: number };
  },
  {
    useDatum,
    chordDirection: useChordDirection,
    firstClearRing: useFirstClearRing,
    slices,
    slopeGrid,
    anatomicalShoulder,
    enginePort,
    engineCrestRange,
    engineTorsoRange,
    acromialTorso,
    engineMeridianGuide,
    engineBody,
  }: Options,
  lane?: IAutoMovieHumanBodyLane.IDefinition,
): void {
  const { lower, upper, neck } = levels;
  const chordDirection = useChordDirection || anatomicalShoulder;
  const firstClearRing = useFirstClearRing || anatomicalShoulder;
  const boundary = context.neckBoundary();
  const trunk = lane === undefined
    ? AutoMovieHumanBodyLaw.trunkSource(context)
    : undefined;
  const sourceSites = trunk === undefined ? [] : [...trunk.sections.keys()];
  const base = lane?.sourceParts.get("trunk") ??
    trunk?.sources.filter((item) => item.name === "trunk").at(-1)?.result.part;
  if (base === null || base === undefined || !(upper > lower))
    throw new Error(
      `Armscye inspection needs the original trunk and ordered axilla/acromion levels (${lower}, ${upper} mm). Available planes: ${sourceSites.join(", ")}`,
    );
  const host =
    useDatum || anatomicalShoulder
      ? shoulderDatum(
          base, lower, upper, boundary.seat.side,
          anatomicalShoulder && !acromialTorso ? 0 : 1,
        )
      : base;
  const wall = AutoMovieLoftViewFullSource.create(host);
  const contact = head === undefined
    ? undefined
    : neckContact(wall, head, boundary.seat.y, host.samples);
  const rest = context.limbRest(boundary);
  const openings: Array<Parameters<typeof inspectHumanArmscyeAssembly>[2][number]> = [];
  if (engineTorsoRange && !anatomicalShoulder)
    throw new Error("The torso support range needs --anatomical-shoulder");
  for (const side of ["left", "right"] as const) {
    try {
      const limb = rest.arm(side);
      const arm = lane?.sourceParts.get(`arm.${side}`) ?? context
        .limbSources({ ...rest, arm: () => limb })
        .arm(side)
        .definition().part;
      if (arm === null) throw new Error(`No original arm.${side}`);
      const observation = {
        chordDirection,
        firstClearRing,
        slopeGrid,
        medialTorso: anatomicalShoulder,
        crest: anatomicalShoulder
          ? { height: upper, lateral: context.trunkInputs.biacromial / 2 }
          : undefined,
        sideNeck: anatomicalShoulder ? boundary.seat.side : undefined,
        enginePort,
        engineCrestRange,
        engineMeridianGuide,
        engineBody,
      };
      if (engineTorsoRange) {
        // Two bisection levels across the same person's two breadths.
        const torsoRange = Array.from({ length: 5 }, (_, i) => {
          const share = i / 4;
          try {
            const part = shoulderDatum(base, lower, upper, boundary.seat.side, share);
            const source = AutoMovieLoftViewFullSource.create(part);
            return {
              share,
              ...observe(part, source, arm, lower, upper, side, {
                ...observation,
                slopeGrid: false,
                firstClearRing: true,
                engineCrest: true,
                engineCrestRange: false,
              }),
            };
          } catch (error) {
            return { share, error: String(error) };
          }
        });
        console.log(JSON.stringify({ side, torsoRange }));
        continue;
      }
      const result = slices
        ? {
            sections: sectionSight(wall, arm, limb.bones, side, lower, upper),
            levelBounds: [lower, upper, boundary.seat.y].map((station) => ({
              station,
              anterior: wall.point(station, 0),
              posterior: wall.point(station, Math.PI),
            })),
          }
        : observe(host, wall, arm, lower, upper, side, observation);
      if (engineBody && "port" in result && result.port !== undefined) {
        openings.push({ side, port: result.port, guide: result.guide });
        continue;
      }
      console.log(
        JSON.stringify({
          side,
          datum: useDatum || anatomicalShoulder,
          anatomicalShoulder,
          acromialTorso,
          shoulderAxis: limb.bones.shoulder,
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
  if (lane !== undefined)
    console.log(JSON.stringify({ assembly: inspectHumanArmscyeAssembly(lane, host, openings) }));
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
  acromion: number,
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
    acromion,
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
  supportShare: number,
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
    // ESTIMATE: the independent torso retains the axillary breadth at the
    // acromial level. The existing axilla rule already subtracts the person's
    // upper-arm tape radius from the bony width. The connection can then own
    // the upper arm's lateral soft-tissue course between both source sheets.
    // https://mreed.umtri.umich.edu/Anthro/Hotzman_2011_ANSURIII_Measurements_a548497.pdf
    const breadth = supportShare === 1
      ? acromion.value
      : axilla.value + supportShare * (acromion.value - axilla.value);
    const shoulderLine = author(
      { ...acromion, value: breadth },
      (neckRadius - breadth) / (neck[1] - upper),
    );
    const underarmLine = author(
      axilla,
      (breadth - axilla.value) / (upper - lower),
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
    slopeGrid: boolean;
    medialTorso: boolean;
    crest?: { height: number; lateral: number };
    sideNeck?: AutoMovieVector3Tuple;
    enginePort: boolean;
    engineCrestRange: boolean;
    engineCrest?: true;
    engineMeridianGuide: boolean;
    engineBody: boolean;
  },
) {
  const { chordDirection, firstClearRing, slopeGrid, medialTorso, sideNeck } =
    options;
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
  const reach = Math.abs(apertures[0]! - apertures[1]!) / 2;
  let apex = upper;
  if (sideNeck !== undefined) {
    const lateral = side === "left" ? 1 : -1;
    const original = wall.point(
      upper,
      side === "left" ? Math.PI / 2 : (3 * Math.PI) / 2,
    );
    const neck: AutoMovieVector3Tuple = [
      sideNeck[0],
      sideNeck[1],
      lateral * sideNeck[2],
    ];
    const course = V.sub(neck, original);
    const length = V.norm(course);
    if (!(length > reach))
      throw new Error("The upper seam has no one-fold reach before the neck");
    apex += (reach * course[1]) / length;
  }
  const middle = (lower + apex) / 2;
  const height = (apex - lower) / 2;
  const root = medialTorso ? arm.axis.jet?.(shaft.domain[0]) : null;
  const address = (point: AutoMovieVector3Tuple) => {
    if (root !== undefined && root !== null) {
      const { value, first } = root;
      const from = V.sub(point, value.origin);
      const normal = V.cross(value.v, value.u);
      const step = V.dot(from, normal) / V.dot(first.origin, normal);
      if (step < 0 && (sideNeck !== undefined || step >= -reach)) {
        const q = V.sub(from, V.scale(first.origin, step));
        return {
          station: shaft.domain[0] + step,
          phase: Math.atan2(V.dot(q, value.v), V.dot(q, value.u)),
          radius: V.norm(q),
        };
      }
    }
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
  const rim =
    firstClearRing || sideNeck !== undefined
      ? Array.from({ length: arm.samples }, (_, i) =>
          wall.point(...physical((2 * Math.PI * i) / arm.samples).point),
        )
      : [];
  const after = firstClearRing
    ? Math.max(...rim.map((point) => address(point).station))
    : null;
  // Clock the upper meridian by the stock's superior point. Its actual
  // tangent distinguishes anterior and posterior, even when the local radial
  // image of the opening is not monotone.
  const superiorClock = (station: number) => {
    const point = shaft.pointAt(station);
    const step = (2 * Math.PI) / arm.samples;
    const phases = Array.from({ length: arm.samples }, (_, i) => i * step);
    const highest = phases.reduce(
      (best, p) => (point(p)[1] > point(best)[1] ? p : best),
      0,
    );
    const top = bracketedMinimum(
      (p) => -point(p)[1],
      highest - step,
      highest + step,
      0.001 / reach,
    ).at;
    const sense = Math.sign(shaft.jet(station, top).v[0]);
    if (sense === 0)
      throw new Error("The upper arm outline has no directed anterior tangent");
    return (clock: number): number => top + sense * clock;
  };
  const forwardOriginal = (station: number): boolean => {
    const phase = superiorClock(station);
    return rim.every((point, i) => {
      const stock = shaft.jet(station, phase((2 * Math.PI * i) / arm.samples));
      return V.dot(stock.u, V.sub(stock.p, point)) > 0;
    });
  };
  const outlet =
    after !== null
      ? clearOutlet({
          wall,
          shaft,
          arm,
          limit: mark + reach,
          side,
          phaseAt,
          after,
          accept: sideNeck === undefined ? undefined : forwardOriginal,
        })
      : mark;
  if (slopeGrid)
    return {
      after,
      slope: inspectHumanArmscyeSlopeGrid({
        host,
        wall,
        arm,
        mark,
        outlet,
        reach,
        side,
        from: Math.max(wall.domain[0], lower - reach),
        to: wall.domain[1],
        address: (p) => {
          try {
            const measured = address(p);
            return measured.station < mark ? measured : null;
          } catch {
            return null;
          }
        },
      }),
    };
  const portAt = (top: number, rows: number) => {
    const station = (lower + top) / 2;
    const x = centreX(station);
    const crest = options.engineMeridianGuide ? options.crest : undefined;
    const lateral = side === "left" ? 1 : -1;
    return {
      host,
      arm,
      wall,
      outlet,
      start: shaft.domain[0],
      side,
      centre: [station, phaseAt(station, x)] as [number, number],
      centreX,
      radius: depthRadius,
      height: (top - lower) / 2,
      phaseExtent:
        Math.abs(phaseAt(station, x - depthRadius) - phaseAt(station, x + depthRadius)) / 2,
      rows,
      ...(crest === undefined
        ? {}
        : {
            meridian: {
              clock: 0,
              section: { axis: 2 as const, value: (lateral * crest.lateral) / 1000 },
              through: { axis: 1 as const, value: crest.height / 1000 },
            },
          }),
    };
  };
  const targetClock = sideNeck === undefined ? null : superiorClock(outlet);
  if (options.engineBody && targetClock !== null) {
    const stock = shaft.pointAt(outlet);
    const span = Math.max(...rim.map((point, i) =>
      V.norm(V.sub(point, stock(targetClock((2 * Math.PI * i) / arm.samples)))),
    ));
    const rows = Math.ceil(span / AutoMovieHumanTrunkRows.MAX_GAP);
    return { port: inspectHumanArmscyePort.definition(portAt(apex, rows)), guide: rim };
  }
  if (options.engineCrest && options.crest !== undefined)
    return {
      apex,
      outlet,
      stockCrest: inspectHumanArmscyePort.crest(portAt(apex, 1), options.crest.lateral),
    };
  if (options.engineCrestRange) {
    if (sideNeck === undefined || options.crest === undefined)
      throw new Error("The stock crest range needs --anatomical-shoulder");
    const neck = Math.min(sideNeck[1], wall.domain[1]);
    const lateral = options.crest.lateral;
    // Two bisection levels give a coarse measurement of the anatomical range.
    const crestRange = Array.from({ length: 5 }, (_, i) => {
      const top = i === 4 ? neck : apex + ((neck - apex) * i) / 4;
      try {
        return { top, ...inspectHumanArmscyePort.crest(portAt(top, 1), lateral) };
      } catch (error) {
        return { top, error: String(error) };
      }
    });
    return { apex, outlet, crestRange };
  }
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
    materialPhase: (point, clock) =>
      targetClock === null ? address(point).phase : targetClock(clock),
    chordDirection,
    crest: options.crest,
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
  const enginePort = options.enginePort
    ? inspectHumanArmscyePort({
        ...portAt(apex, physicalLoop.registered.rows),
        guide: physicalLoop.guide,
      })
    : undefined;
  return {
    lower,
    upper,
    apex,
    mark,
    outlet,
    after,
    physicalLoop,
    physicalPort,
    enginePort,
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
  accept?: (station: number) => boolean;
  phaseAt: (
    station: number,
    x: number,
    read: (phase: number) => AutoMovieVector3Tuple,
  ) => number;
}): number {
  const { wall, shaft, arm, after, limit, side, phaseAt, accept } = input;
  const sense = side === "left" ? 1 : -1;
  const phases = Array.from(
    { length: arm.samples },
    (_, i) => (2 * Math.PI * i) / arm.samples,
  );
  const clear = arm.stations.find((station) => {
    if (!(station > after && station < Math.min(limit, shaft.domain[1])))
      return false;
    const ring = shaft.pointAt(station);
    const separated = phases.every((phase) => {
      const [x, y, z] = ring(phase);
      if (y < wall.domain[0] || y > wall.domain[1]) return false;
      const section = wall.pointAt(y);
      if (x < section(Math.PI)[0] || x > section(0)[0]) return true;
      return sense * (z - section(phaseAt(y, x, section))[2]) > 0.01;
    });
    return separated && (accept?.(station) ?? true);
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
