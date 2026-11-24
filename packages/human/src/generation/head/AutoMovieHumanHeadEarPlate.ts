import {
  AutoMovieLoftSectionNative,
  AutoMovieLoftViewFullSource,
  AutoMovieLoftViewRead,
  AutoMovieLoftViewSource,
  AutoMovieNaturalSpline,
  AutoMovieViewOutline,
  AutoMovieViewSection,
  AutoMovieSolidVector as Vector,
} from "@automovie/engine";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieConstructionView,
  IAutoMovieHumanHeadEarFrame,
  IAutoMovieHumanHeadEarPlate,
  IAutoMovieHumanHeadLayout,
  IAutoMovieLoftViewFullSource,
  IAutoMovieLoftViewRead,
  IAutoMovieLoftViewSource,
  IAutoMovieNaturalCubicSpline,
  IAutoMovieViewAxis,
  IAutoMovieViewOutline,
  IAutoMovieViewPart,
} from "@automovie/interface";

import { AutoMovieHumanHeadPrior } from "../AutoMovieHumanHeadPrior";
import { AutoMovieHumanHeadMassPart } from "./AutoMovieHumanHeadMassPart";
import { AutoMovieHumanHeadSourceAxis } from "./AutoMovieHumanHeadSourceAxis";
import { AutoMovieHumanHeadTree } from "./AutoMovieHumanHeadTree";

/**
 * Auricular source curves in horizontal parallel planes. Sa/sba own the entire
 * source's highest/lowest Y; their tilted chord has the supplied length. C and
 * j occupy different horizontal sections: their actual three-dimensional chord
 * is perpendicular to sa-sba and has the supplied breadth. It is not a
 * horizontal section diameter.
 *
 * At the tragal level, p2 joins an actual head-source scalp point to the
 * posterior rim along world lateral. This direction is an explicit geometric
 * convention: Cho Figure 1 names scalp distances but does not specify a
 * world-space normal formula. Both insertions sit on the actual scalp.
 * Published population ratios guide the unmeasured attachments and caps.
 *
 * @evidence contracts/common.md#principled-implementation Separates global sa/sba extrema, the tilted c-j chord and the actual scalp-to-rim p2 endpoints.
 * @evidence contracts/common.md#clear-and-simple-design One horizontal chart and original coordinate records supply the plate and its relief courses.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses no unused centre placement, parent-foot move, normal-projection substitution or reference fit.
 * @evidence contracts/common.md#meaningful-documentation Names the independent measurement sites and the remaining placement/shape conventions.
 * @evidence contracts/performance.md#efficient-algorithms Named scalp reads use bounded one-dimensional section inversions. Deferred section queries use prepared scalar/axis data and fixed native geometry.
 * @evidence contracts/performance.md#reuse-equivalent-work The same original plate supplies all ridge-course readers.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns caller-owned sources and no global head cache.
 */
export namespace AutoMovieHumanHeadEarPlate {
  /**
   * Mean within-ear d3/d8 across 150 pinnae in Liu et al. (2025),
   * Parameters.csv.
   */
  export const UPPER_HELIX_WIDTH_SHARE: number = 0.1934864781;

  /**
   * Author the plate and its named source/scalp endpoints together.
   *
   * @evidence contracts/common.md#principled-implementation Constructs c-j as B*q, with q perpendicular to the independently closed sa-sba chord; places p2 from the identical head source on a declared lateral line.
   * @evidence contracts/common.md#clear-and-simple-design Axis coordinates and support records are the authoritative original curves, evaluated through the engine owner.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Never identifies a tilted-axis pole with a world-height extremum or treats a local vector projection as a scalp distance.
   * @evidence contracts/common.md#meaningful-documentation States horizontal authoring, cross-station measurement and retained fairing conventions.
   * @evidence contracts/performance.md#efficient-algorithms Fixed named-input interpolation and linear section assembly/admission follow the original scalp reads at their owners' costs. Deferred section/guide queries use prepared scalar/axis data and fixed native geometry.
   * @evidence contracts/performance.md#reuse-equivalent-work One prepared original width serves each point reader.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Source closures belong to the returned plate and are released with it.
   */
  export function of(
    plan: IAutoMovieHumanHeadLayout,
    mass: IAutoMovieViewPart,
    f: IAutoMovieHumanHeadEarFrame.IFrame,
    side: string,
    head: IAutoMovieLoftViewFullSource.IReader = AutoMovieLoftViewFullSource.create(
      mass,
    ),
  ): IAutoMovieHumanHeadEarPlate.IOutput {
    const beta: number = Math.atan2(f.protrusion, f.breadth);
    const low: number = f.bottom;
    const high: number = f.top;
    const span: number = high - low;
    const sex: 0 | 1 = plan.sex === 1 ? 0 : 1;
    const prior = AutoMovieHumanHeadPrior.PRIOR.ear;
    const thickness: number = prior.rim * f.breadth;

    // ESTIMATE: place the upper insertion one scaled insertion length above the lowest point along the tilted axis.
    const attachment: number = low + prior.insertion[sex] * span;
    const lobularTop: number = low + prior.lobule[sex] * span;
    // ESTIMATE: transfer Kaur et al. (2022), Table 7's mean free lobule
    // height over ear length to the projected span of this person's ear.
    const lowerAttachment: number = low + (6.35 / 62.3) * span;
    const tragion: number = plan.landmarks.tragion[1];
    const upperStand: number =
      f.protrusion * (sex === 0 ? 8.3 / 17.3 : 9.9 / 19.5);
    // ESTIMATE: half the shift from the anterior guide to the c-j midpoint
    // puts the upper pole behind the anterior lip of the isolated plate.
    const poleX: number =
      plan.landmarks.tragion[0] +
      ((high - tragion) * f.a[0]) / f.a[1] -
      (f.breadth * f.b[0] * Math.cos(beta)) / 4;
    const poles = freePoles(head, f, poleX, upperStand, lowerAttachment - low);
    const a = Vector.scale(Vector.sub(poles.top, poles.bottom), 1 / f.length);
    const outwardAxis = Vector.unit(
      Vector.sub(f.n, Vector.scale(a, Vector.dot(f.n, a))),
    );
    if (outwardAxis === null)
      throw new Error("Ear breadth has no lateral basis around its long chord");
    const anteriorAxis = Vector.cross(a, outwardAxis);
    const q = Vector.combine([
      [-Math.sign(anteriorAxis[0]) * Math.cos(beta), anteriorAxis],
      [Math.sin(beta), outwardAxis],
    ]);
    const horizontal = Vector.sub(q, Vector.scale(a, q[1] / a[1]));
    const run: number = Math.hypot(horizontal[0], horizontal[2]);
    if (!(run > 0 && a[1] > 0))
      throw new Error("Ear c-j has no finite horizontal source run");
    const across: AutoMovieVector3Tuple = [
      horizontal[0] / run,
      0,
      horizontal[2] / run,
    ];
    const normal: AutoMovieVector3Tuple = [across[2], 0, -across[0]];
    const posterior: number = attachment + f.breadth * q[1];
    const chordX: (y: number) => number = (y: number): number =>
      plan.landmarks.tragion[0] + ((y - tragion) * a[0]) / a[1];
    const named: [number, string][] = [
      [low, "subaurale"],
      [lobularTop, "intertragic.notch"],
      [tragion, "tragal.rim"],
      [posterior, "posterior.j"],
      [attachment, "otobasion.superius"],
      [high, "superaurale"],
    ];
    named.sort(
      (a: [number, string], b: [number, string]): number => a[0] - b[0],
    );
    if (
      named[0]![0] !== low ||
      named.at(-1)![0] !== high ||
      named.some(
        (p: [number, string], i: number): boolean =>
          i > 0 && !(p[0] > named[i - 1]![0]),
      )
    )
      throw new Error(
        "Ear measurement sites do not form distinct internal source stations",
      );
    const theta = (y: number): number =>
      2 * Math.asin(Math.sqrt((y - low) / span));
    const c: [number, number, number] = AutoMovieHumanHeadMassPart.sideAt(
      mass,
      attachment,
      chordX(attachment),
      f.sign,
    );
    const notchScalp: [number, number, number] =
      AutoMovieHumanHeadMassPart.sideAt(
        mass,
        lobularTop,
        chordX(lobularTop),
        f.sign,
      );
    // One posterior half ellipse closes c-j exactly across their two levels.
    const amplitude: number = (f.breadth * run) / Math.sin(theta(posterior));
    const rimX = (y: number): number =>
      chordX(y) + amplitude * across[0] * Math.sin(theta(y));
    const scalp: [number, number, number] = AutoMovieHumanHeadMassPart.sideAt(
      mass,
      tragion,
      rimX(tragion),
      f.sign,
    );
    const rear: [number, number, number] = [
      scalp[0],
      tragion,
      scalp[2] + f.sign * f.protrusion,
    ];
    const tragal: [number, number, number] = tragalSupport(
      head.pointAt(tragion),
      rear,
      across,
      normal,
      f.sign * thickness,
      mass.samples,
    );
    const anterior: IAutoMovieNaturalCubicSpline =
      AutoMovieNaturalSpline.create(
        named.map(([s]) => theta(s)),
        named.map(([s]) => (s === tragion ? tragal[0] - chordX(s) : 0)),
      );
    const rootX = (y: number): number =>
      chordX(y) + AutoMovieNaturalSpline.evaluate(anterior, theta(y));
    const half = (y: number): number =>
      y === low || y === high ? 0 : (rimX(y) - rootX(y)) / (2 * across[0]);
    const chordZ = (y: number): number =>
      c[2] + ((y - attachment) * a[2]) / a[1];
    // The default stand defines the interior lateral interpolation. The
    // actual upper caliper belongs to the outer cap span.
    const stand: number = (f.sign * f.protrusion * 8.3) / 17.3;
    const lateral: IAutoMovieNaturalCubicSpline = AutoMovieNaturalSpline.create(
      named.map(([s]) => theta(s)),
      named.map(([s]): number => {
        if (s === low || s === high) return stand;
        if (s === lobularTop) return notchScalp[2] - chordZ(s);
        if (s === tragion) return tragal[2] - chordZ(s);
        return 0;
      }),
    );
    const rootZ = (y: number): number =>
      chordZ(y) + AutoMovieNaturalSpline.evaluate(lateral, theta(y));
    const samples: [number, string][] = [...named];
    const source: (
      read: (y: number) => number,
      angle?: boolean,
    ) => IAutoMovieViewPart.IOutline = (
      read: (y: number) => number,
      angle: boolean = true,
    ): IAutoMovieViewPart.IOutline => ({
      knots: samples.map(
        ([station, site]: [number, string]): IAutoMovieViewPart.IKnot => ({
          site,
          station,
          value: read(station),
        }),
      ),
      ...(angle
        ? { parameter: { type: "angle" as const, bottom: low, top: high } }
        : {}),
    });
    const capReach: number = UPPER_HELIX_WIDTH_SHARE * f.breadth;
    const lobuleMid: number = (low + lobularTop) / 2;
    const capReaches: [number, number] = [lobuleMid - low, capReach];
    const turn: number = (Math.PI * amplitude) / 2;
    const width: IAutoMovieViewPart.IOutline = roundPoles(
      source(half),
      capReaches,
      { radial: [turn, -turn] },
    );
    const horizontalAxis: IAutoMovieViewPart.IOutline = roundPoles(
      source((y: number): number => rootX(y) + half(y) * across[0]),
      capReaches,
      { values: [poles.bottom[0], poles.top[0]] },
    );
    const freeAxis: IAutoMovieViewPart.IOutline = roundPoles(
      source((y: number): number => rootZ(y) + half(y) * across[2]),
      capReaches,
      { values: [poles.bottom[2], poles.top[2]] },
    );
    const lowerAxis = seatLobule(
      freeAxis,
      horizontalAxis,
      width,
      across,
      mass,
      f.sign,
      thickness,
      lowerAttachment,
      lobularTop,
    );
    const lateralAxis = departAtUpperInsertion(
      lowerAxis,
      horizontalAxis,
      width,
      across,
      head,
      f.sign,
      posterior,
      attachment,
      high,
      upperStand,
    );
    const axis: IAutoMovieViewAxis.IAxis = AutoMovieHumanHeadSourceAxis.of(
      {
        x: horizontalAxis,
        y: source((y: number): number => y, false),
        z: lateralAxis,
      },
      across,
      normal,
    );
    const sites: Set<number> = new Set(
      named.map((p: [number, string]): number => p[0]),
    );
    sites.add(lowerAttachment);
    for (let i: number = 1; i < 24; i++)
      sites.add(low + (high - low) * Math.sin((Math.PI * i) / 48) ** 2);
    const upperConcha: number = ((plan.sex === 1 ? 27 : 28) * plan.scale) / 2;
    const lobuleDepth: number = (5.47 * plan.scale) / 2;
    const conchaLow: number = Math.max(low, tragion - upperConcha);
    const conchaHigh: number = Math.min(high, tragion + upperConcha);
    const depthSites: [number, string][] = [...samples];
    for (const [station, name] of [
      [conchaLow, "concha.inferior"],
      [conchaHigh, "concha.superior"],
      [lobuleMid, "lobule.fullness"],
      [high - Math.min(capReach, (high - attachment) / 2), "upper.helix.cap"],
    ] as [number, string][])
      if (depthSites.every(([other]): boolean => other !== station))
        depthSites.push([station, name]);
    depthSites.sort(([a], [b]): number => a - b);
    const angular = (y: number): number => theta(y) / Math.PI;
    const concha: readonly [number, number, number] = [
      angular(conchaLow),
      angular(tragion),
      angular(conchaHigh),
    ];
    const lobule: readonly [number, number, number] = [
      0,
      angular(lobuleMid),
      angular(lobularTop),
    ];
    const lobuleRise: number = Math.max(
      0,
      lobuleDepth - thickness * Math.sin(theta(lobuleMid)),
    );
    // An ellipse with longitudinal radius b and depth a leaves a pole with
    // r = a sqrt(2 dy / b). The corresponding derivative in this angle chart
    // is pi a sqrt(span / (2 b)).
    const lowerDepthJet: number =
      Math.PI * lobuleDepth * Math.sqrt(span / (2 * (lobuleMid - low)));
    const upperDepthJet: number =
      Math.PI * thickness * Math.sqrt(span / (2 * capReach));
    const sectionDepth = (
      sign: 1 | -1,
      inside: boolean,
    ): IAutoMovieViewPart.IOutline => ({
      parameter: { type: "angle", bottom: low, top: high },
      range:
        sign === 1
          ? { minimum: 0, maximum: null }
          : { minimum: null, maximum: 0 },
      knots: depthSites.map(([station, site]): IAutoMovieViewPart.IKnot => {
        const t: number = angular(station);
        const angle: number = theta(station);
        const base: number =
          station === low || station === high ? 0 : thickness * Math.sin(angle);
        const lobe = depthJet(t, lobule, lobuleRise);
        const backing = depthJet(t, concha, inside ? 9.65 * plan.scale : 0);
        const first: number =
          station === low
            ? lowerDepthJet
            : station === high
              ? -upperDepthJet
              : Math.PI * thickness * Math.cos(angle);
        return {
          site,
          station,
          value: sign * (base + lobe[0] + backing[0]),
          jet: {
            first: sign * (first + lobe[1] + backing[1]),
            second: sign * (-(Math.PI ** 2) * base + lobe[2] + backing[2]),
          },
        };
      }),
    });
    const outward: number = normal.reduce(
      (sum: number, v: number, i: number): number => sum + v * f.n[i]!,
      0,
    );
    const part: IAutoMovieViewPart = {
      name: `auricle.${side}`,
      axis,
      stations: [...sites].sort((a: number, b: number): number => a - b),
      front: {
        positive: { ...width, range: { minimum: 0, maximum: null } },
        negative: {
          ...width,
          knots: width.knots.map(
            ({ value, jet, ...knot }): IAutoMovieViewPart.IKnot => ({
              ...knot,
              value: -value,
              ...(jet === undefined
                ? {}
                : {
                    jet: {
                      first: jet.first === null ? null : -jet.first,
                      second: jet.second === null ? null : -jet.second,
                    },
                  }),
            }),
          ),
          range: { minimum: null, maximum: 0 },
        },
      },
      // This inward carrier is an overlap allowance behind the conchal floor,
      // not a measured cartilage or skin thickness.
      side: {
        positive: sectionDepth(1, outward < 0),
        negative: sectionDepth(-1, outward > 0),
      },
      fullness: {
        kind: "shoulder",
        shoulder: {
          knots: [low, high].map(
            (station: number): IAutoMovieViewPart.IKnot => ({
              site: "auricle.ellipse",
              station,
              value: AutoMovieViewSection.ELLIPSE,
            }),
          ),
        },
      },
      pole: "both",
      order: 32,
      samples: 128,
    };
    const actual: {
      part: IAutoMovieViewPart;
      view: IAutoMovieConstructionView;
    } = AutoMovieHumanHeadTree.source(part);
    const station: (site: string) => number = (site: string): number => {
      const knot: IAutoMovieViewPart.IKnot | undefined =
        actual.part.front.positive.knots.find(
          (k: IAutoMovieViewPart.IKnot): boolean => k.site === site,
        );
      if (knot === undefined)
        throw new Error(`Ear source has no named ${site} station`);
      return knot.station;
    };
    const actualLow: number = station("subaurale");
    const actualHigh: number = station("superaurale");
    const admitted: IAutoMovieLoftViewSource.IResult | null =
      AutoMovieLoftViewSource.create(actual.part);
    if (admitted === null || admitted.source === null)
      throw new Error(`Ear ${side} has no admitted original plate field`);
    const original: IAutoMovieLoftViewSource.ISource = admitted.source;
    const section: (at: number) => IAutoMovieHumanHeadEarPlate.ISection = (
      at: number,
    ): IAutoMovieHumanHeadEarPlate.ISection => {
      const inputs: IAutoMovieLoftViewRead.IValues | string =
        AutoMovieLoftViewRead.values(original, at);
      if (typeof inputs === "string")
        throw new Error(`Ear source section: ${inputs}`);
      const jets: IAutoMovieLoftViewRead.IJets | string =
        AutoMovieLoftViewRead.jets(original, at);
      return {
        frame: actual.part.axis.at(at),
        inputs,
        jets: typeof jets === "string" ? null : jets,
        jetFailure: typeof jets === "string" ? jets : null,
        phase: inputs.extents.every((value: number): boolean => value === 0)
          ? null
          : AutoMovieLoftSectionNative.phase(inputs),
      };
    };
    return {
      ...actual,
      source: original,
      across,
      normal,
      attachment: station("otobasion.superius"),
      posterior: station("posterior.j"),
      tragion: station("tragal.rim"),
      top: actualHigh,
      bottom: actualLow,
      section,
      point: (at: number, posteriorSide: boolean): [number, number, number] => {
        const read: IAutoMovieHumanHeadEarPlate.ISection = section(at);
        if (read.phase === null) return [...read.frame.origin];
        const local: [number, number] = read.phase(
          posteriorSide ? 0 : Math.PI,
        ).p;
        return read.frame.origin.map(
          (value: number, i: number): number =>
            value + local[0] * read.frame.u[i]! + local[1] * read.frame.v[i]!,
        ) as [number, number, number];
      },
    };
  }

  /** Close the measured long chord between two separate scalp stands. */
  function freePoles(
    head: IAutoMovieLoftViewFullSource.IReader,
    f: IAutoMovieHumanHeadEarFrame.IFrame,
    upperX: number,
    upperStand: number,
    lowerStand: number,
  ): { bottom: AutoMovieVector3Tuple; top: AutoMovieVector3Tuple } {
    const span: number = f.top - f.bottom;
    const runSquared: number = (f.length - span) * (f.length + span);
    // The upper and lower points can change their lateral stand without
    // shortening the long chord or going below the 15 degree sagittal lean.
    const minimum: number = span * Math.tan(Math.PI / 12);
    const limit: number = Math.sqrt(Math.max(0, runSquared - minimum ** 2));
    const lower = head.pointAt(f.bottom);
    const upper = head.pointAt(f.top);
    const target: number =
      upper(sectionPhase(upper, upperX, f.sign))[2] + f.sign * upperStand;
    const bottomX = (rise: number): number =>
      upperX + Math.sqrt(Math.max(0, runSquared - rise * rise));
    const bottomZ = (rise: number): number =>
      lower(sectionPhase(lower, bottomX(rise), f.sign))[2] +
      f.sign * lowerStand;
    const edge: number = bottomZ(limit);
    const upperZ: number = Math.min(
      edge + limit,
      Math.max(edge - limit, target),
    );
    let low: number = -limit;
    let high: number = limit;
    for (;;) {
      const rise: number = (low + high) / 2;
      if (rise === low || rise === high)
        return {
          bottom: [bottomX(rise), f.bottom, upperZ - rise],
          top: [upperX, f.top, upperZ],
        };
      if (bottomZ(rise) + rise < upperZ) low = rise;
      else high = rise;
    }
  }

  /** Read the actual flank phase at one sagittal coordinate. */
  export function sectionPhase(
    point: (phase: number) => AutoMovieVector3Tuple,
    x: number,
    side: 1 | -1,
  ): number {
    let a: number = 0;
    let b: number = Math.PI;
    if (point(a)[0] < x || point(side * b)[0] > x)
      throw new Error("Ear attachment is outside the original scalp section");
    for (;;) {
      const middle: number = (a + b) / 2;
      if (middle === a || middle === b) return side * middle;
      if (point(side * middle)[0] > x) a = middle;
      else b = middle;
    }
  }

  /** Carry the nominal p1 departure slope at the upper scalp datum. */
  function departAtUpperInsertion(
    lateral: IAutoMovieViewPart.IOutline,
    sagittal: IAutoMovieViewPart.IOutline,
    radius: IAutoMovieViewPart.IOutline,
    across: [number, number, number],
    scalp: IAutoMovieLoftViewFullSource.IReader,
    side: 1 | -1,
    rearHeight: number,
    insertion: number,
    top: number,
    protrusion: number,
  ): IAutoMovieViewPart.IOutline {
    const z = readOutline(lateral);
    const x = readOutline(sagittal)(insertion);
    const h = readOutline(radius)(insertion);
    const anterior: number = x.value - h.value * across[0];
    const point = scalp.pointAt(insertion);
    const { u, v } = scalp.jet(insertion, sectionPhase(point, anterior, side));
    if (x.stationJet === null || h.stationJet === null || v[0] === 0)
      throw new Error(
        "Ear upper attachment has no regular scalp departure slope",
      );
    const frontSlope: number = x.stationJet[0] - h.stationJet[0] * across[0];
    const scalpSlope: number = u[2] + ((frontSlope - u[0]) * v[2]) / v[0];
    const current = z(insertion);
    if (current.stationJet === null)
      throw new Error("Ear upper attachment has no regular lateral slope");
    const slope: number =
      scalpSlope +
      h.stationJet[0] * across[2] +
      (side * protrusion) / (top - insertion);
    const low: number = lateral.knots[0]!.station;
    const stationToAngle: number =
      Math.PI * Math.sqrt((insertion - low) * (top - insertion));
    const delta: number = (slope - current.stationJet[0]) * stationToAngle;
    const fixed = { first: 0, second: 0 };
    const correction: IAutoMovieViewPart.IKnot[] = [
      { ...lateral.knots[0]!, value: 0, jet: fixed },
      {
        site: "attachment.incoming",
        station: rearHeight,
        value: 0,
        jet: fixed,
      },
      {
        site: "otobasion.superius",
        station: insertion,
        value: 0,
        jet: { first: delta, second: 0 },
      },
      { ...lateral.knots.at(-1)!, value: 0, jet: fixed },
    ];
    return displace(lateral, correction);
  }

  /** Continue the anterior scalp contact through the named free lobule height. */
  function seatLobule(
    lateral: IAutoMovieViewPart.IOutline,
    sagittal: IAutoMovieViewPart.IOutline,
    radius: IAutoMovieViewPart.IOutline,
    across: [number, number, number],
    mass: IAutoMovieViewPart,
    side: 1 | -1,
    thickness: number,
    insertion: number,
    notch: number,
  ): IAutoMovieViewPart.IOutline {
    const z = readOutline(lateral);
    const x = readOutline(sagittal);
    const half = readOutline(radius);
    const bottom = lateral.knots[0]!;
    const top = lateral.knots.at(-1)!;
    const middle: number = (insertion + notch) / 2;
    const displacement = (station: number, inset: number): number => {
      const h: number = half(station).value;
      const anterior: number = x(station).value - h * across[0];
      const scalp = AutoMovieHumanHeadMassPart.sideAt(
        mass,
        station,
        anterior,
        side,
      );
      return scalp[2] - side * inset - (z(station).value - h * across[2]);
    };
    const fixed = { first: 0, second: 0 };
    const anchors: IAutoMovieViewPart.IKnot[] = [
      { ...bottom, value: 0, jet: fixed },
      {
        site: "otobasion.inferius",
        station: insertion,
        value: displacement(insertion, 0),
      },
      {
        site: "lobule.root",
        station: middle,
        value: displacement(middle, thickness),
      },
      { site: "intertragic.notch", station: notch, value: 0, jet: fixed },
      { ...top, value: 0, jet: fixed },
    ];
    return displace(lateral, anchors);
  }

  /**
   * Add a local angular displacement while retaining both source jets at each
   * bind.
   */
  function displace(
    lateral: IAutoMovieViewPart.IOutline,
    anchors: IAutoMovieViewPart.IKnot[],
  ): IAutoMovieViewPart.IOutline {
    const z = readOutline(lateral);
    const delta = readOutline({ ...lateral, knots: anchors });
    const knots = [...lateral.knots];
    for (const knot of anchors)
      if (knots.every(({ station }) => station !== knot.station))
        knots.push(knot);
    knots.sort((a, b) => a.station - b.station);
    return {
      ...lateral,
      knots: knots.map(({ site, station }): IAutoMovieViewPart.IKnot => {
        const a = z(station);
        const b = delta(station);
        return {
          site,
          station,
          value: a.value + b.value,
          jet: {
            first: (a.parameterJet[0] + b.parameterJet[0]) * Math.PI,
            second: (a.parameterJet[1] + b.parameterJet[1]) * Math.PI ** 2,
          },
        };
      }),
    };
  }

  /** Prepare one declared angular scalar for use at its anatomical sites. */
  function readOutline(
    outline: IAutoMovieViewPart.IOutline,
  ): (station: number) => IAutoMovieViewOutline.IReading {
    const source = AutoMovieViewOutline.create(outline);
    if ("detail" in source) throw new Error(`Ear outline: ${source.detail}`);
    return (station: number): IAutoMovieViewOutline.IReading => {
      const reading = AutoMovieViewOutline.at(source, station);
      if (typeof reading === "string")
        throw new Error(`Ear outline: ${reading}`);
      return reading;
    };
  }

  /** A positive C2 profile made from two quintic steps in the angle chart. */
  function depthJet(
    t: number,
    [low, middle, high]: readonly [number, number, number],
    height: number,
  ): [number, number, number] {
    if (height === 0 || t <= low || t >= high) return [0, 0, 0];
    const scale: number =
      t <= middle ? 1 / (middle - low) : -1 / (high - middle);
    const u: number = t <= middle ? (t - low) * scale : (t - high) * scale;
    const v: number = 1 - u;
    return [
      height * u ** 3 * (10 - 15 * u + 6 * u * u),
      30 * height * u * u * v * v * scale,
      60 * height * u * v * (1 - 2 * u) * scale * scale,
    ];
  }

  /**
   * Seat the anterior tragal support one carrier half-thickness into the scalp
   * along the declared p2 lateral direction.
   */
  function tragalSupport(
    scalp: ReturnType<IAutoMovieLoftViewFullSource.IReader["pointAt"]>,
    rear: [number, number, number],
    across: [number, number, number],
    normal: [number, number, number],
    inset: number,
    samples: number,
  ): [number, number, number] {
    const depth = (phase: number): number => {
      const point = scalp(phase);
      return (
        normal[0] * (point[0] - rear[0]) +
        normal[2] * (point[2] - inset - rear[2])
      );
    };
    const step: number = (Math.PI * Math.sign(inset)) / Math.ceil(samples / 2);
    let phase: number = 0;
    let previous: number = depth(phase);
    let width: number = -Infinity;
    for (let i: number = 1; i <= Math.ceil(samples / 2); i++) {
      const next: number = i * step;
      const value: number = depth(next);
      if (value > 0 !== previous > 0) {
        let a: number = phase;
        let b: number = next;
        for (;;) {
          const m: number = (a + b) / 2;
          if (m === a || m === b) break;
          if (depth(m) > 0 === previous > 0) a = m;
          else b = m;
        }
        const point = scalp((a + b) / 2);
        const extent: number =
          across[0] * (point[0] - rear[0]) +
          across[2] * (point[2] - inset - rear[2]);
        if (extent < 0) width = Math.max(width, extent);
      }
      phase = next;
      previous = value;
    }
    if (!Number.isFinite(width))
      throw new Error(
        "Ear tragal chord has no anterior meeting with the scalp",
      );
    return [rear[0] + width * across[0], rear[1], rear[2] + width * across[2]];
  }

  /**
   * Let the radius open with root distance and carry a finite centre tangent
   * from the long chord at each pole. The upper helix width is the local cap
   * reach. The old value and two angular derivatives carry the interior curve
   * exactly into both new spans.
   */
  function roundPoles(
    outline: IAutoMovieViewPart.IOutline,
    reaches: [number, number],
    {
      values,
      radial,
    }: { values?: [number, number]; radial?: [number, number] },
  ): IAutoMovieViewPart.IOutline {
    const read = readOutline(outline);
    const bottom: IAutoMovieViewPart.IKnot = outline.knots[0]!;
    const top: IAutoMovieViewPart.IKnot = outline.knots.at(-1)!;
    const lower: number =
      bottom.station +
      Math.min(reaches[0], (outline.knots[1]!.station - bottom.station) / 2);
    const upper: number =
      top.station -
      Math.min(reaches[1], (top.station - outline.knots.at(-2)!.station) / 2);
    const ends: [number, number] = values ?? [bottom.value, top.value];
    const curvature: number = ((ends[1] - ends[0]) * Math.PI ** 2) / 2;
    const inherited = (
      site: string,
      station: number,
    ): IAutoMovieViewPart.IKnot => {
      const reading: IAutoMovieViewOutline.IReading = read(station);
      return {
        site,
        station,
        value: reading.value,
        jet: {
          first: reading.parameterJet[0] * Math.PI,
          second: reading.parameterJet[1] * Math.PI ** 2,
        },
      };
    };
    return {
      ...outline,
      knots: [
        {
          ...bottom,
          value: ends[0],
          jet: {
            first: radial?.[0] ?? 0,
            second: radial === undefined ? curvature : 0,
          },
        },
        inherited("lobular.cap", lower),
        ...outline.knots
          .slice(1, -1)
          .map(({ site, station }) => inherited(site, station)),
        inherited("superior.cap", upper),
        {
          ...top,
          value: ends[1],
          jet: {
            first: radial?.[1] ?? 0,
            second: radial === undefined ? -curvature : 0,
          },
        },
      ],
    };
  }
}
