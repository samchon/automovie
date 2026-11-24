import {
  AutoMovieLoftViewFullSource,
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
import { AutoMovieHumanArmscyeOpening } from "../generation/arm/AutoMovieHumanArmscyeOpening";
import { AutoMovieHumanArmscyePort } from "../generation/conic/AutoMovieHumanArmscyePort";
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
  if (options.engineBody) {
    const body = AutoMovieHumanBodyLaw.define(AutoMovieHumanNeutralParameters);
    console.log(
      JSON.stringify({ assembly: inspectHumanArmscyeAssembly(body.lane) }),
    );
    return;
  }
  const context = AutoMovieHumanBodyLaw.prepareSources(
    AutoMovieHumanNeutralParameters,
  );
  const common = context.common();
  const head = context.headSource(common).source.tapeInvariant.part;
  const boundary = context.neckBoundary(common);
  inspect(
    { ...context, common: () => common, neckBoundary: () => boundary },
    head,
    options,
  );
}

function inspect(
  context: ReturnType<typeof AutoMovieHumanBodyLaw.prepareSources>,
  head: IAutoMovieViewPart,
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
  }: Options,
): void {
  const { axilla: lower, acromion: upper } = context.trunkInputs;
  const { neckBase } = context.headInputs;
  const scale = context.limbs.legs.scale;
  const neck = {
    suprasternale: neckBase.suprasternaleHeight * scale,
    side: neckBase.sideNeckPointHeight * scale,
    cervicale: neckBase.cervicaleHeight * scale,
  };
  const chordDirection = useChordDirection || anatomicalShoulder;
  const firstClearRing = useFirstClearRing || anatomicalShoulder;
  const boundary = context.neckBoundary();
  const input = AutoMovieHumanBodyLaw.bodyInput(context);
  // The torso support comparison starts from the independently wider original.
  const trunk = AutoMovieHumanBodyLaw.trunkSource(context, {
    ...input,
    trunk: {
      ...input.trunk,
      views: { ...input.trunk.views, shoulder: undefined },
    },
  });
  const sourceSites = [...trunk.sections.keys()];
  const base = trunk.sources.filter(({ name }) => name === "trunk").at(-1)
    ?.result.part;
  if (base === null || base === undefined || !(upper > lower))
    throw new Error(
      `Armscye inspection needs the original trunk and ordered axilla/acromion levels (${lower}, ${upper} mm). Available planes: ${sourceSites.join(", ")}`,
    );
  const datum = { lower, upper, neck: boundary.seat.side };
  const host =
    useDatum || anatomicalShoulder
      ? AutoMovieHumanArmscyeOpening.torso(
          base,
          datum,
          anatomicalShoulder && !acromialTorso ? 0 : 1,
        )
      : base;
  const prepared = AutoMovieHumanArmscyeOpening.prepare(host, lower, upper);
  const { wall } = prepared;
  const contact = neckContact(wall, head, boundary.seat.y, host.samples);
  const rest = context.limbRest(boundary);
  if (engineTorsoRange && !anatomicalShoulder)
    throw new Error("The torso support range needs --anatomical-shoulder");
  for (const side of ["left", "right"] as const) {
    try {
      const limb = rest.arm(side);
      const arm = context
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
      };
      if (engineTorsoRange) {
        // Two bisection levels across the same person's two breadths.
        const torsoRange = Array.from({ length: 5 }, (_, i) => {
          const share = i / 4;
          try {
            const part = AutoMovieHumanArmscyeOpening.torso(base, datum, share);
            const source = AutoMovieHumanArmscyeOpening.prepare(
              part,
              lower,
              upper,
            );
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
        : observe(host, prepared, arm, lower, upper, side, observation);
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
  prepared: AutoMovieHumanArmscyeOpening.IPrepared,
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
  },
) {
  const { chordDirection, slopeGrid, sideNeck } = options;
  const { wall } = prepared;
  const opening = prepared.arm(arm, side, options);
  const {
    shaft,
    apex,
    mark,
    reach,
    after,
    outlet,
    centre,
    address,
    physical,
    targetClock,
  } = opening;
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
  const portAt = (top: number, rows: number) =>
    opening.portAt(
      top,
      rows,
      options.engineMeridianGuide ? options.crest : undefined,
    );
  if (options.engineCrest && options.crest !== undefined)
    return {
      apex,
      outlet,
      stockCrest: inspectHumanArmscyePort.crest(
        portAt(apex, 1),
        options.crest.lateral,
      ),
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
        return {
          top,
          ...inspectHumanArmscyePort.crest(portAt(top, 1), lateral),
        };
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
    centre,
    materialPhase: (point, clock) =>
      targetClock === null ? address(point).phase : targetClock(clock),
    chordDirection,
    crest: options.crest,
    mark: outlet,
    surfaces: {
      host: surface(host, wall, centre[0]),
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
