import type { IAutoMovieLoftRelief } from "@automovie/engine";

import type { AutoMovieHumanConicLoft } from "../conic/AutoMovieHumanConicLoft";
import { AutoMovieHumanConicSection } from "../conic/AutoMovieHumanConicSection";

/**
 * A nail as a part of its own on a digit's distal segment: one law for every finger and toe.
 *
 * The nail unit is two things. The plate is a rigid body of its own, a convex lens whose upper face is the visible nail; it is a
 * conic family in a frame fixed to the distal segment, so a rig carries it with the distal bone and a material finds it by its own
 * face. The bed is the digit's own skin under the plate: a relief of the digit's family that lowers the skin inside the nail's
 * outline, so the plate comes out through the skin along the proximal and the lateral folds, where the engine's merge traces the
 * curve and rounds the fold, and stands proud of the skin at its free edge.
 *
 * Inputs are the distal segment's frame (the last joint's centre, the distal and the dorsal direction), the digit's own skin as its
 * family lofts it, and published proportions (`IProportions`). Nothing is read from a reference body and nothing is stored per digit.
 *
 * The construction, in order:
 *
 * 1. The digit's breadth `B` across the last joint and its length `T` from that joint to the tip are read on the skin.
 * 2. The plate's width is `W = width B` and its length from the proximal fold to the tip `W / aspect`, so the proximal fold stands
 *    at `x_f = T - W / aspect` along the distal direction.
 * 3. The nail's own frame: the segment's frame rolled about the distal direction until the skin stands equally high at both edges of
 *    the plate, then pitched until its distal axis is the skin's dorsal tangent at the fold. The plate's crown is the straight line
 *    along that axis one `fold` under the skin at the fold: the plate leaves the fold parallel to the fold's skin, sinks no further,
 *    and the skin's own curve toward the tip brings the plate out through it.
 * 4. Every section of the plate is the digit's own dorsal arc carried on that line: its crown on the line, its two edges as far under
 *    the crown as the skin's edges stand under the skin's crown there. The upper face is the quarter ellipse through the crown and the
 *    edge whose side extreme stands `margin` outside the edge, under the lateral fold.
 * 5. The free edge is where the crown stands one `thickness` over the skin; the plate closes there in a short cap.
 * 6. The bed takes the skin inside the outline (the two edges, the proximal fold's half ellipse and the free edge) onto the plate's
 *    upper face. Outside the outline the fold's wall rises from the plate's edge to the skin: beside the plate over the room the digit
 *    has there, behind it over two ramps. At the free edge the plate comes down to the skin inside the outline.
 */
export namespace AutoMovieHumanNail {
  /** A point or direction in the figure's frame, mm. */
  export type V3 = [number, number, number];

  /** The distal segment's frame as the nail reads it. */
  export interface IFrame {
    /** The last joint's centre, mm. */
    origin: V3;

    /** Unit direction from the joint toward the tip. */
    distal: V3;

    /** Unit direction out of the back of the digit, square to `distal`. */
    dorsal: V3;
  }

  /** The digit's own skin: its family's surface before the bed is added. */
  export interface ISkin {
    /** The skin's point at a station and a phase of the digit's chart, mm in the figure's frame. */
    point: (station: number, phase: number) => readonly number[];

    /** The first station the nail may read, mm. */
    first: number;

    /** The station of the digit's tip, where its skin closes, mm. */
    tip: number;
  }

  /**
   * A digit's nail proportions, each a published relation or a declared estimate (`AutoMovieHumanF1Nails` holds the rows and their
   * sources).
   */
  export interface IProportions {
    /** The plate's width between the lateral folds over the digit's breadth across its last joint. */
    width: number;

    /** The plate's width over its length from the proximal fold to the digit's tip. */
    aspect: number;

    /** The plate's thickness, mm: how far its free edge stands over the skin. */
    thickness: number;

    /** How far the plate lies under the proximal fold's skin where it leaves the fold, mm. */
    fold: number;

    /**
     * The radius of the plate's upper face at its crown over the plate's width, as a gauge laid across the plate's open middle reads
     * it: it holds midway between the fold and the free edge. `null` where none is published for the digit, and the plate is then its
     * bed's own arc all along.
     */
    radius: number | null;

    /** The radius the proximal fold turns on at its apex, in the plate's plane, over the plate's width. */
    lunula: number;

    /** The farthest the plate's edges stand under its crown midway along it, over the digit's height there. */
    wrap: number;
  }

  /** What the law measured and derived, for the round's table and the pre-checks. */
  export interface IReadings {
    /** The digit's breadth across the last joint, mm. */
    breadth: number;

    /** The distance from the last joint to the tip along the segment's distal direction, mm. */
    tip: number;

    /** The plate's width, mm, after `narrowed`. */
    width: number;

    /** The share of the asked width the plate keeps where its edges would wrap past `IProportions.wrap`; 1 where they do not. */
    narrowed: number;

    /** The roll of the nail's frame about the distal direction from the segment's dorsal, radians. */
    roll: number;

    /** The pitch of the nail's frame from the segment's distal direction, radians, positive toward the dorsal side. */
    pitch: number;

    /** Where the proximal fold and the free edge stand along the nail's distal axis from the joint, mm. */
    span: [number, number];

    /** The radius of the plate's upper face at its crown, least and greatest over the visible plate, mm. */
    radius: [number, number];

    /** How far the plate's edges lie under the skin's, least and greatest over the visible plate, mm; negative where an edge stands over the skin. */
    under: [number, number];

    /** The plate's sagitta over the chord between its edges, least and greatest over the visible plate, mm. */
    sagitta: [number, number];

    /** The greatest height the bed's net was asked to hold in its three outer rings, where the engine needs zero, mm. */
    clipped: number;

    /** Where `clipped` stands in the nail's frame: `[along the distal axis from the joint, aside]`, mm. */
    clippedAt: [number, number];

    /** The control `clipped` was asked of: `[0 the bed or 1 the strip, its row, its column, the net's rows, the net's columns]`. */
    clippedIn: [number, number, number, number, number];

    /** How many passes the frame's fit took to its fixed point, each of which reads the bed's stations anew. */
    passes: number;
  }

  /** One digit's nail. */
  export interface INail {
    /** The plate, a family in the figure's frame. */
    plate: AutoMovieHumanConicLoft.IFamily;

    /** The bed, a relief of the digit's family. */
    bed: IAutoMovieLoftRelief;

    /** The free edge's strip, a second relief of the digit's family, fine along the digit, that adds the edge's step to the bed's slope. */
    strip: IAutoMovieLoftRelief;

    /** The nail's own frame. */
    frame: IFrame;

    /**
     * The outline's middle on the digit's chart, `[station, phase]`, mm and radians, and its half extents there along the station and
     * the phase: the ellipse a declared loop is written about.
     */
    outline: { centre: [number, number]; semi: [number, number] };

    /** The plate's outline in the nail's frame, which `owns` reads. */
    plan: IPlan;

    /** The readings. */
    readings: IReadings;

    /**
     * The digit's dorsal skin as the nail sees it, at each of the plate's stations in the nail's frame: the distance along, the middle of
     * the skin's breadth, the skin's height there, the plate's half width, and the turn about the long axis that would level the skin's
     * two edges at that station alone, radians.
     */
    profile: { along: number; middle: number; height: number; edge: number; turn: number }[];
  }

  /** The plate's outline in the nail's frame: distances along the distal axis from the joint and aside from the long axis, mm. */
  export interface IPlan {
    /** Where the proximal fold's apex and the free edge's stand along. */
    span: [number, number];

    /** The proximal half ellipse: where its centre stands along, its half axis along and its half axis across. */
    bend: [number, number, number];

    /** The free edge across the plate: `[aside, along]` at offsets from one edge to the other, between which it runs straight. */
    front: [number, number][];

    /** The plate's stations along and its half width at each, between which the half width runs straight. */
    edges: [number, number][];

    /** The dorsal height of the plate's back, under which a point is not the nail's. */
    floor: number;
  }

  /**
   * Whether a point of the digit's skin belongs to the nail: inside the plate's outline in the nail's plan and on the plate's side of
   * the digit. The nail is a relief of the digit's own face and owns no vertex of the mesh, so a material finds its region by this.
   *
   * The outline is the one the bed is made from: the two edges, the proximal half ellipse and the free edge. A point of the digit's
   * underside lies inside that plan as well, so the point must also stand over the plate's back.
   *
   * @param nail The nail.
   * @param point A point in the figure's frame, mm.
   */
  export function owns(nail: INail, point: readonly number[]): boolean {
    const { frame, plan }: INail = nail;
    const d: V3 = sub(point, frame.origin);
    const [x, y, z]: [number, number, number] = [dot(d, frame.distal), dot(d, frame.dorsal), dot(d, cross(frame.distal, frame.dorsal))];
    if (!(x >= plan.span[0] && x <= tabled(plan.front, z) && y >= plan.floor)) return false;
    const [centre, deep, wide]: [number, number, number] = plan.bend;
    if (x < centre) return Math.abs(z) <= wide * Math.sqrt(Math.max(0, 1 - ((centre - x) / deep) ** 2));
    return Math.abs(z) <= tabled(plan.edges, x);
  }

  /** A table `[at, value][]` with `at` increasing, read at a place: straight between its rows and held past its ends. */
  function tabled(table: readonly [number, number][], at: number): number {
    let i: number = 0;
    while (i < table.length - 2 && at >= table[i + 1]![0]) i += 1;
    const [a, b]: [[number, number], [number, number]] = [table[i]!, table[i + 1]!];
    return a[1] + (b[1] - a[1]) * Math.max(0, Math.min(1, (at - a[0]) / (b[0] - a[0])));
  }

  /** The bed's net spacing over the ramp's half width: a roll is resolved by samplings a quarter of it apart (the lofting skill's fitting rule). */
  const NET: number = 0.5;

  /** The bed's depth under the plate's upper face over the fold's depth: the skin under the plate only has to stay inside the plate's body. */
  const UNDER: number = 0;

  /** The ramp's half width over the fold's depth. */
  const RAMP: number = 2;

  /** Phases a ring of the skin is read at before a point on it is refined: a digit's section turns by 2 degrees between two of them. */
  const RING: number = 180;

  /** The ellipse's shoulder: `sqrt(2) - 1`, the conic through the middle of a quarter ellipse. */
  const ELLIPSE: number = Math.SQRT2 - 1;

  const sub = (a: readonly number[], b: readonly number[]): V3 => [a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!];
  const dot = (a: readonly number[], b: readonly number[]): number => a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;
  const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const mix = (a: V3, p: number, b: V3, q: number): V3 => [a[0] * p + b[0] * q, a[1] * p + b[1] * q, a[2] * p + b[2] * q];
  const unit = (a: V3): V3 => {
    const n: number = Math.hypot(a[0], a[1], a[2]);
    return [a[0] / n, a[1] / n, a[2] / n];
  };

  /** One section of the plate, in its own chart about its crown. */
  interface ISection {
    /** The edge's distance from the median line, mm. */
    edge: number;

    /** The side extreme's distance from the median line, mm. */
    side: number;

    /** How far the side extreme stands under the crown, mm. */
    drop: number;

    /** The middle weight of the upper face's conic from the crown to the side extreme. */
    weight: number;

    /** How far the edge stands under the crown, mm. */
    sagitta: number;

    /** The section's turn about the plate's course from the nail's dorsal direction toward its lateral, radians. */
    turn: number;

    /** How far the plate's edge lies under the mean of the skin's two edges there, mm; negative where it stands over them. */
    under: number;

    /** Half the skin's breadth there, mm. */
    reach: number;
  }

  /** Stations along the bed the nail's frame is fitted over. */
  const BED: number = 9;

  /**
   * The middle weight of the conic from a level crown to an upright side extreme that turns on `radius` at the crown, where a conic of
   * weight `w` and depth `drop` turns on `2 w^2 side^2 / drop`, and has fallen `sagitta` at the edge. By bisection between the section
   * model's bounds of a shoulder `w / (1 + w)`, 0.03 and 0.85; where no weight between them passes through the edge, the ellipse's.
   */
  function weight(side: number, radius: number, edge: number, sagitta: number): number {
    const miss = (w: number): number => sink(side, (2 * w * w * side * side) / radius, w, edge) - sagitta;
    let [a, b]: [number, number] = [0.03 / 0.97, 0.85 / 0.15];
    if (miss(a) * miss(b) > 0) return Math.SQRT1_2;
    const rising: boolean = miss(b) > 0;
    for (let i: number = 0; i < 48; ++i) {
      const w: number = (a + b) / 2;
      if (miss(w) > 0 === rising) b = w;
      else a = w;
    }
    return (a + b) / 2;
  }

  /**
   * How far the conic from a level crown to an upright side extreme has fallen a distance from the median line. The conic is the rational
   * quadratic on the crown `(0, 0)`, the corner `(side, 0)` and the side extreme `(side, drop)` with the middle weight `w`: at parameter
   * `t` it stands `side (2 w t (1 - t) + t^2) / D` from the median line and `drop t^2 / D` under the crown, `D = (1 - t)^2 + 2 w t (1 - t) + t^2`.
   */
  export function sink(side: number, drop: number, w: number, z: number): number {
    let [a, b]: [number, number] = [0, 1];
    for (let i: number = 0; i < 48; ++i) {
      const t: number = (a + b) / 2;
      if ((side * (2 * w * t * (1 - t) + t * t)) / ((1 - t) * (1 - t) + 2 * w * t * (1 - t) + t * t) < z) a = t;
      else b = t;
    }
    const t: number = (a + b) / 2;
    return (drop * t * t) / ((1 - t) * (1 - t) + 2 * w * t * (1 - t) + t * t);
  }

  /** The quintic step from 0 at 0 to 1 at 1, C2 at both ends. */
  export function step(t: number): number {
    const x: number = Math.max(0, Math.min(1, t));
    return x * x * x * (10 + x * (-15 + 6 * x));
  }

  /** A skin read in a frame: `[along the distal axis, dorsal height, lateral]` from the frame's origin. */
  interface IReader {
    /** The frame's lateral direction, `distal x dorsal`. */
    lateral: V3;

    /** The chart point's frame coordinates. */
    at: (station: number, phase: number) => V3;

    /** The station whose point at a phase stands a distance along the distal axis. */
    station: (x: number, phase: number) => number;

    /** The phase and station of the dorsal skin at a distance along and a lateral offset. */
    find: (x: number, z: number) => { station: number; phase: number; height: number };

    /** The skin's ring a distance along, at `RING` equal steps of phase from 0. */
    ring: (x: number) => V3[];

    /** The skin's lateral extent at a distance along: `[least, greatest]`. */
    extent: (x: number) => [number, number];
  }

  /** Read a skin in a frame. */
  function reader(skin: ISkin, frame: IFrame): IReader {
    const lateral: V3 = cross(frame.distal, frame.dorsal);
    const at = (station: number, phase: number): V3 => {
      const d: V3 = sub(skin.point(station, phase), frame.origin);
      return [dot(d, frame.distal), dot(d, frame.dorsal), dot(d, lateral)];
    };
    // The distance along grows with the station on the distal segment, so a bisection finds the station. Twenty-four halvings take a
    // distal segment of 30 mm under 2e-6 mm, the chord error of the net a digit's skin is read on (`AutoMovieHumanF1Nails`).
    const station = (x: number, phase: number): number => {
      let [low, high]: [number, number] = [skin.first, skin.tip];
      for (let i: number = 0; i < 24; ++i) {
        const middle: number = (low + high) / 2;
        if (at(middle, phase)[0] < x) low = middle;
        else high = middle;
      }
      return (low + high) / 2;
    };
    const lateralAt = (x: number, phase: number): V3 => at(station(x, phase), phase);
    // The skin's ring a distance along, read once at `RING` phases: every question about that distance starts from it.
    const rings: Map<number, V3[]> = new Map();
    const ring = (x: number): V3[] => {
      let made: V3[] | undefined = rings.get(x);
      if (made === undefined) rings.set(x, (made = Array.from({ length: RING }, (_: unknown, k: number): V3 => lateralAt(x, (2 * Math.PI * k) / RING))));
      return made;
    };
    // The dorsal phase: where the skin crosses the median plane on the dorsal side, found once on a scan and refined by bisection.
    const crossing = (x: number, z: number, from: number, to: number): number => {
      let [a, b]: [number, number] = [from, to];
      const sign: number = Math.sign(lateralAt(x, a)[2] - z);
      for (let i: number = 0; i < 48; ++i) {
        const middle: number = (a + b) / 2;
        if (Math.sign(lateralAt(x, middle)[2] - z) === sign) a = middle;
        else b = middle;
      }
      return (a + b) / 2;
    };
    const find = (x: number, z: number): { station: number; phase: number; height: number } => {
      const count: number = RING;
      const around: V3[] = ring(x);
      let best: { phase: number; height: number } | null = null;
      for (let k: number = 0; k < count; ++k) {
        const [a, b]: [number, number] = [(2 * Math.PI * k) / count, (2 * Math.PI * (k + 1)) / count];
        const [p, q]: [V3, V3] = [around[k]!, around[(k + 1) % count]!];
        if (p[2] - z === 0 || (p[2] - z) * (q[2] - z) < 0) {
          const phase: number = crossing(x, z, a, b);
          const height: number = lateralAt(x, phase)[1];
          if (best === null || height > best.height) best = { phase, height };
        }
      }
      if (best === null) throw new Error("nail: the skin has no dorsal point " + x.toFixed(2) + " mm along and " + z.toFixed(2) + " mm aside; it spans " + Math.min(...around.map((p: V3): number => p[2])).toFixed(2) + " to " + Math.max(...around.map((p: V3): number => p[2])).toFixed(2) + " mm there");
      return { station: station(x, best.phase), phase: best.phase, height: best.height };
    };
    const extent = (x: number): [number, number] => {
      let [least, greatest]: [number, number] = [Infinity, -Infinity];
      for (const p of ring(x)) {
        least = Math.min(least, p[2]);
        greatest = Math.max(greatest, p[2]);
      }
      return [least, greatest];
    };
    return { lateral, at, station, ring, find, extent };
  }

  /**
   * One digit's nail.
   *
   * @param name The plate's chain name.
   * @param bed The bed's relief name.
   * @param segment The distal segment's frame.
   * @param skin The digit's own skin.
   * @param proportions The digit's row.
   * @param margin How far the plate's side extreme stands outside its edge, under the lateral fold, mm: room for the merge's rail.
   */
  export function create(name: string, bed: string, segment: IFrame, skin: ISkin, proportions: IProportions, margin: number): INail {
    // 1. Breadth across the joint and length to the tip, in the segment's frame.
    const first: IReader = reader(skin, segment);
    const across: [number, number] = first.extent(0);
    const breadth: number = across[1] - across[0];
    let width: number = proportions.width * breadth;
    let half: number = width / 2;
    const tip0: number = first.at(skin.tip, 0)[0];
    let fold0: number = tip0 - width / proportions.aspect;
    // The middle of the skin's breadth a distance along: the dorsal profile and the plate's edges are read about it.
    const mid = (r: IReader, x: number): number => {
      const [a, b]: [number, number] = r.extent(x);
      return (a + b) / 2;
    };
    if (!(fold0 > 0)) throw new Error("nail: " + name + "'s proximal fold stands " + fold0.toFixed(2) + " mm from the last joint, behind it");

    // 3. The nail's frame from the digit's own skin, over the whole bed. A rigid plate lies on its bed along its whole length, so
    // no one station sets its frame: at `BED` stations from the fold nine tenths of the way to the tip, the long axis is the straight
    // line fitted by least squares to the middles of the skin's breadth (the segment's axis runs to the pad's far point and stands off
    // them), and the roll is the mean of the turns that would level the skin's two edges at each station. A fixed point of both.
    let frame: IFrame = segment;
    let roll: number = 0;
    const midway0: number = (fold0 + tip0) / 2;
    const bed0: number[] = Array.from({ length: BED }, (_: unknown, k: number): number => fold0 + (0.9 * (tip0 - fold0) * k) / (BED - 1));
    const mean = (values: readonly number[]): number => values.reduce((sum: number, x: number): number => sum + x, 0) / values.length;
    let passes: number = 0;
    for (let i: number = 0, last: number = Infinity; i < 24 && Math.abs(last) > 1e-7; ++i) {
      passes = i + 1;
      const off: IReader = reader(skin, frame);
      const middles: number[] = bed0.map((x: number): number => mid(off, x));
      const slope: number = bed0.reduce((sum: number, x: number, k: number): number => sum + (x - mean(bed0)) * (middles[k]! - mean(middles)), 0) / bed0.reduce((sum: number, x: number): number => sum + (x - mean(bed0)) ** 2, 0);
      const shift: number = mean(middles) - slope * mean(bed0);
      const centred: IFrame = {
        origin: [0, 1, 2].map((k: number): number => frame.origin[k]! + off.lateral[k]! * shift) as V3,
        distal: unit(mix(frame.distal, 1, off.lateral, slope)),
        dorsal: frame.dorsal,
      };
      const on: IReader = reader(skin, centred);
      const base: [number, number] = on.extent(fold0);
      // A skin that stands higher on the `+lateral` side faces away from it, so the dorsal direction leans to the lower side.
      const turn: number = mean(
        bed0.map((x: number): number => {
          const d: [number, number] = on.extent(x);
          const e: number = Math.min(half * Math.min(1, (d[1] - d[0]) / (base[1] - base[0])), 0.45 * (d[1] - d[0]));
          return -Math.atan2(on.find(x, (d[0] + d[1]) / 2 + e).height - on.find(x, (d[0] + d[1]) / 2 - e).height, 2 * e);
        }),
      );
      roll += turn;
      last = Math.abs(turn) + Math.abs(slope) + Math.abs(shift);
      frame = { origin: centred.origin, distal: centred.distal, dorsal: unit(mix(centred.dorsal, Math.cos(turn), on.lateral, Math.sin(turn))) };
    }
    // Pitch: a plate is straight along its length and lies on the digit from the fold on, so its line is the taut line over the dorsal
    // skin from the fold's point: the steepest rise of the skin's median profile seen from that point, read every quarter millimetre
    // from half a millimetre on. On a skin that only falls away that is its tangent at the fold; on one with a rise before the tip the
    // line rests on the rise.
    const rolled: IReader = reader(skin, frame);

    // 2, bounded. The plate's edges stay on the digit's back: midway along the plate they stand no farther under the crown than `wrap`
    // of the digit's height there. Where the asked width would wrap farther, the plate is narrowed, and shortened with it, to that.
    const [atFold, atMiddle]: [[number, number], [number, number]] = [rolled.extent(fold0), rolled.extent(midway0)];
    const tall: number = Math.max(...rolled.ring(midway0).map((p: V3): number => p[1])) - Math.min(...rolled.ring(midway0).map((p: V3): number => p[1]));
    const centre: number = (atMiddle[0] + atMiddle[1]) / 2;
    const fall = (e: number): number => rolled.find(midway0, centre).height - (rolled.find(midway0, centre + e).height + rolled.find(midway0, centre - e).height) / 2;
    const asked: number = Math.min(half * Math.min(1, (atMiddle[1] - atMiddle[0]) / (atFold[1] - atFold[0])), 0.49 * (atMiddle[1] - atMiddle[0]));
    let kept: number = asked;
    if (fall(asked) > proportions.wrap * tall)
      for (let [a, b, i]: [number, number, number] = [0, asked, 0]; i < 40; ++i) {
        kept = (a + b) / 2;
        if (fall(kept) > proportions.wrap * tall) b = kept;
        else a = kept;
      }
    const narrowed: number = kept / (half * Math.min(1, (atMiddle[1] - atMiddle[0]) / (atFold[1] - atFold[0])));
    width *= narrowed;
    half *= narrowed;
    fold0 = tip0 - width / proportions.aspect;
    const foldHeight: number = rolled.find(fold0, mid(rolled, fold0)).height;
    const end: number = rolled.at(skin.tip, 0)[0];
    let rise: number = -Infinity;
    for (let x: number = fold0 + 0.5; x < end - 0.25; x += 0.25) rise = Math.max(rise, (rolled.find(x, mid(rolled, x)).height - foldHeight) / (x - fold0));
    // The bed's net needs its three outer rings zero, so three cells before the tip the bed must already lower nothing: the plate's
    // face must stand `UNDER` folds over the skin there. Where the skin falls away too late for that (a short toe whose back slopes
    // all the way to its tip), the line is raised until it does.
    const last: number = end - 3 * NET * RAMP * proportions.fold;
    if (last > fold0 + 1) rise = Math.max(rise, (rolled.find(last, mid(rolled, last)).height + UNDER * proportions.fold - (foldHeight - proportions.fold)) / (last - fold0));
    const pitch: number = Math.atan(rise);
    const lateral: V3 = rolled.lateral;
    const distal: V3 = unit(mix(frame.distal, Math.cos(pitch), frame.dorsal, Math.sin(pitch)));
    frame = { origin: frame.origin, distal, dorsal: cross(lateral, distal) };
    const read: IReader = reader(skin, frame);

    // 2 and 3 in the nail's frame: the fold's point is the skin's point found above, the crown line one fold under it.
    const foldPoint: { station: number; phase: number } = rolled.find(fold0, mid(rolled, fold0));
    const at: V3 = sub(skin.point(foldPoint.station, foldPoint.phase), frame.origin);
    const fold: number = dot(at, frame.distal);
    const crown: number = dot(at, frame.dorsal) - proportions.fold;
    const tip: number = read.at(skin.tip, 0)[0];
    const height = (x: number): number => read.find(x, mid(read, x)).height;

    // 5. The free edge: where the crown line stands one thickness over the skin and stays so to the tip. Read back from the tip a tenth
    // of a millimetre at a time to the last place it does not, then by bisection: a skin that dips and rises again under the plate
    // (the thumb's fitted dorsum does, by 0.2 mm) has an earlier place where the line is that far over it, which is not the plate's end.
    const proud = (x: number): number => crown - height(x) - proportions.thickness;
    let high: number = tip - 1e-3;
    if (proud(high) < 0) throw new Error("nail: " + name + "'s plate never stands a thickness over the skin before the tip");
    let low: number = high;
    while (low > fold && proud(low) >= 0) {
      high = low;
      low -= 0.1;
    }
    low = Math.max(low, fold);
    for (let i: number = 0; i < 48; ++i) {
      const middle: number = (low + high) / 2;
      if (proud(middle) < 0) low = middle;
      else high = middle;
    }
    // The plate's sections end one thickness before the free edge's place on the middle line and its cap closes on from there.
    const free: number = (low + high) / 2;
    const edge: number = free - proportions.thickness;
    if (!(edge > fold)) throw new Error("nail: " + name + "'s plate is shorter than it is thick");
    // The plate's arch along its length. A plate is convex along its length as well as across (the fingernail curvature literature
    // states it so; no normal lengthwise radius was found in it), and it grows on its bed, so its crown takes the bed's own arch:
    // over the straight line from the fold to the free edge it stands by as much as the skin's middle line stands over its own chord
    // between those two places. Both ends keep their definitions, one fold under the skin at the fold and one thickness over it at
    // the free edge, and between them the crown runs from under the digit's back to over it. Held straight, the plate lay a fold
    // under the back all along (run 15-09-05: 5.69 mm against a back at 6.14). Read one net cell apart.
    const archCount: number = Math.max(2, Math.ceil((free - fold) / (NET * RAMP * proportions.fold)) + 1);
    const [backAtFold, backAtFree]: [number, number] = [height(fold), height(free)];
    const arch: [number, number][] = Array.from({ length: archCount }, (_: unknown, k: number): [number, number] => {
      const x: number = fold + ((free - fold) * k) / (archCount - 1);
      return [x, k === 0 || k === archCount - 1 ? 0 : height(x) - (backAtFold + ((backAtFree - backAtFold) * k) / (archCount - 1))];
    });
    const lifted = (x: number): number => (x <= fold || x >= free ? 0 : tabled(arch, x));

    // 4. The sections at the knots, a millimetre apart at most, from the hidden root to the free edge.
    // The plate runs on under the proximal fold two ramps, the room the fold's blend and the bed's ramp need, and no farther: the
    // published 4 mm of plate hidden under the fold (Michelucci 2023) is not modelled, because a digit twists along its length (the
    // big toe's two sides stand 2 mm apart in height at its fold and level midway) and a long straight root showed through the skin on
    // the lower side (probe 13-28-55, a lobe 3.7 mm long).
    const root: number = Math.max(fold - 2 * RAMP * proportions.fold, read.at(skin.first, foldPoint.phase)[0] + 1);
    const count: number = Math.ceil(edge - root) + 1;
    const stations: number[] = Array.from({ length: count }, (_: unknown, i: number): number => root + ((edge - root) * i) / (count - 1));
    const reach = (x: number): number => {
      const [a, b]: [number, number] = read.extent(x);
      return (b - a) / 2;
    };
    const reachAtFold: number = reach(fold);
    // The plate keeps its share of the digit's breadth where the tip narrows, so its edges run along the skin and never past its sides.
    const edgeAt = (x: number): number => half * Math.min(1, reach(x) / reachAtFold);
    // The plate's arc across. A plate lies on its bed across as it does along. At the fold and at the free edge its section is the
    // bed's: its edges stand under its crown by what the skin's edges stand under the skin's crown there (`bedArc`), so the plate is
    // one fold under the skin all across at the fold and one thickness over it all across at the free edge. The published radius is
    // the plate's own arc where a gauge reads it, on its open middle: midway its edges stand the published circle's sagitta under its
    // crown. Between, the difference of the two, read midway (`ownArc`), runs out to nothing at both ends by `4 t (1 - t)`, the lowest
    // polynomial that is one midway and zero at both ends. A digit with no published radius has no difference to add. One circle held
    // from fold to free edge set a finger's edges 1.1 mm under the skin at the fold and 1.7 mm over it at the far end (run 15-27-45).
    const bedArc = (x: number, e: number): number => height(x) - (read.find(x, mid(read, x) + e).height + read.find(x, mid(read, x) - e).height) / 2;
    const halfway: number = (fold + free) / 2;
    const gauged: number = (proportions.radius ?? 0) * width;
    const ownArc: number = proportions.radius === null ? 0 : gauged - Math.sqrt(gauged * gauged - edgeAt(halfway) ** 2) - bedArc(halfway, edgeAt(halfway));
    const section = (x: number): ISection => {
      const e: number = edgeAt(x);
      // A digit twists along its length (the big toe's two sides stand 2 mm apart in height at its fold and level midway), and the
      // plate, which grows on it, twists with it: each section is turned about the course until the skin's two edges would stand
      // equally high in it, by the angle the two heights ask for. A plate held square all along showed its root through the skin on
      // the lower side (probes 13-27-27 to 13-32-21: a lobe 2 to 3.7 mm long on the big toe).
      const [up, down]: [number, number] = [read.find(x, mid(read, x) + e).height, read.find(x, mid(read, x) - e).height];
      const turn: number = -Math.atan2(up - down, 2 * e);
      // The edge's depth under the crown: the bed's own here and the plate's own share of the published difference. A bed that is flat
      // or hollow across leaves a plate as good as flat, on a radius of a thousand widths. The section's circle is the one through
      // its crown and its two edges: a chord `2 e` with the sagitta `s` lies on the radius `(e^2 + s^2) / (2 s)`.
      const share: number = Math.max(0, Math.min(1, (x - fold) / (free - fold)));
      const sagitta: number = Math.max((e * e) / (2000 * width), height(x) - (up + down) / 2 + 4 * share * (1 - share) * ownArc);
      const arcRadius: number = (e * e + sagitta * sagitta) / (2 * sagitta);
      const under: number = (up + down) / 2 - (crown + lifted(x) - sagitta);
      // The side extreme stands outside the edge by the margin's share of the half width, so it narrows with the plate and stays within
      // the digit's breadth. The upper face is the conic from the level crown to the upright side extreme that turns on the published
      // radius at the crown and passes through the edge (`weight`). The body under it is as deep as that conic on purpose: the
      // bedded skin, half a fold under the face, lies well inside it, so the plate meets the skin along one curve only. A shell one
      // thickness deep met the bed along its underside as well (probe 13-18-26: nine of ten traces lost, `crossings left 4`).
      const side: number = e * (1 + margin / half);
      const w: number = weight(side, arcRadius, e, sagitta);
      return { edge: e, side, drop: (2 * w * w * side * side) / arcRadius, weight: w, sagitta, turn, under, reach: reach(x) };
    };
    // A rigid plate twists at one rate along its length: the sections take the straight line fitted to the turns the skin asks for at
    // each of them, by least squares. Each station's own turn follows the skin's small unevenness, most where the tip narrows and the
    // two edges stand close (probe 13-34-20: the middle toe's blend folded before its far corner).
    const loose: ISection[] = stations.map(section);
    const [meanX, meanTurn]: [number, number] = [stations.reduce((sum: number, x: number): number => sum + x, 0) / count, loose.reduce((sum: number, s: ISection): number => sum + s.turn, 0) / count];
    const rate: number = stations.reduce((sum: number, x: number, i: number): number => sum + (x - meanX) * (loose[i]!.turn - meanTurn), 0) / stations.reduce((sum: number, x: number): number => sum + (x - meanX) ** 2, 0);
    const sections: ISection[] = loose.map((s: ISection, i: number): ISection => ({ ...s, turn: meanTurn + rate * (stations[i]! - meanX) }));
    const shallow: number = Math.min(...sections.map((s: ISection): number => s.drop));
    // The course runs under the crown line half a thickness over the shallowest section's floor, so every section holds it and the
    // cap, which closes on the course, ends inside the digit: the skin must stand over the cap's pole, or the pole would show through it
    // and the meeting curve would run over the one point of the plate that has no chart (probe 13-24-46: `rails` at the toe.middle's pole).
    const below: number = shallow + proportions.thickness / 2;
    // The cap is one thickness long, the plate's end face a quarter round, and shorter where the tip's skin falls away sooner than
    // that: the longest of a thickness and its halves whose pole the skin still covers.
    const pole = (length: number): number => crown - below - height(Math.min(tip - 1e-3, edge + length));
    let cap: number = proportions.thickness;
    while (!(pole(cap) < 0) && cap > proportions.thickness / 64) cap /= 2;
    if (!(pole(cap) < 0)) throw new Error("nail: " + name + "'s plate would end " + pole(cap).toFixed(2) + " mm out of the skin");
    const world = (x: number, y: number): V3 => [0, 1, 2].map((k: number): number => frame.origin[k]! + frame.distal[k]! * x + frame.dorsal[k]! * y) as V3;
    const plate: AutoMovieHumanConicLoft.IFamily = {
      name,
      centres: [world(root, crown - below), world(edge, crown - below)],
      halves: [],
      up: frame.dorsal,
      layout: AutoMovieHumanConicSection.bilateral(0),
      knots: stations.map((x: number): number => x - root),
      values: [
        // front (+u) extreme on the median line, the crown: u, mm
        sections.map((): number => below),
        // side (+v) extreme: u, mm
        sections.map((s: ISection): number => below - s.drop),
        // side (+v) extreme: v, mm
        sections.map((s: ISection): number => s.side),
        // back (-u) extreme on the median line: u, mm
        sections.map((s: ISection): number => below - s.drop - proportions.thickness),
        // shoulder of the upper face's arc, share
        sections.map((s: ISection): number => s.weight / (1 + s.weight)),
        // shoulder of the lower face's arc, share
        sections.map((): number => ELLIPSE),
      ],
      // The root closes under the fold, never seen. The free edge closes in a cap one thickness long: the plate's end face, a quarter
      // round as high as the plate stands over the skin there. A longer cap would bring the plate's crown down under the skin before
      // its end, and the free edge would dive where the nail has a ledge.
      tips: [
        { from: 0, tip: -proportions.thickness, covered: true },
        // The cap starts on the last knot's own number: `edge - root` and the knot `(root + (edge - root)) - root` may stand one unit in the
        // last place apart, which the loft refuses as two stations (run 13-48-20, the big toe's plate).
        { from: stations[count - 1]! - root, tip: stations[count - 1]! - root + cap },
      ],
      // The engine's chart has `v = u x t` for the course's direction `t`, the opposite of the nail's lateral `t x u`, and a roll turns
      // `u` toward `v`: a section's turn toward the lateral is the roll's negative.
      roll: { knots: stations.map((x: number): number => x - root), values: sections.map((s: ISection): number => -s.turn) },
      pitch: NET * RAMP * proportions.fold,
    };

    // 6. The bed. The plate's upper face over the nail's plane, and how far inside the outline a point of that plane stands.
    const ramp: number = RAMP * proportions.fold;
    const between = (x: number): ISection => {
      let i: number = 0;
      while (i < sections.length - 2 && x >= stations[i + 1]!) i += 1;
      const [a, b]: [ISection, ISection] = [sections[i]!, sections[i + 1]!];
      const t: number = Math.max(0, Math.min(1, (x - stations[i]!) / (stations[i + 1]! - stations[i]!)));
      const lerp = (p: number, q: number): number => p + (q - p) * t;
      return { edge: lerp(a.edge, b.edge), side: lerp(a.side, b.side), drop: lerp(a.drop, b.drop), weight: lerp(a.weight, b.weight), sagitta: lerp(a.sagitta, b.sagitta), turn: lerp(a.turn, b.turn), under: lerp(a.under, b.under), reach: lerp(a.reach, b.reach) };
    };
    const face = (x: number, z: number): number => {
      const s: ISection = between(x);
      // The section turned by `turn` about the course point, `below` under the crown line: its point `v` aside and `u` over the course
      // stands `v cos + u sin` aside and `u cos - v sin` over it in the nail's frame. The `v` under a lateral place by a fixed point.
      const over = (v: number): number => below - sink(s.side, s.drop, s.weight, Math.min(Math.abs(v), s.side));
      let v: number = z;
      for (let i: number = 0; i < 6; ++i) v = (z - over(v) * Math.sin(s.turn)) / Math.cos(s.turn);
      return crown + lifted(x) - below + over(v) * Math.cos(s.turn) - v * Math.sin(s.turn);
    };
    // The free edge across the plate: an edge of the plate, drawn by the outline's rule. A trimmed nail's free edge follows the tip,
    // so its line is the tip's own plan contour moved back along the nail's axis by as far as its apex stands before the tip: an
    // offset aside, it stands that distance behind the farthest place at which the digit's skin still reaches that offset. The
    // contour is read on the skin's extents from the tip back, a tenth of a millimetre apart on the stations the apex was searched
    // over, each side by its own extent, and placed between two stations by the straight line through their readings; the line is
    // tabled at offsets one net cell apart. Derived instead as the place where the plate stands a thickness over the skin at each
    // offset, it depended on the plate's arc and the tip's at once and came out a gable (run 15-27-45).
    const frontCount: number = 2 * Math.ceil(half / (NET * ramp)) + 1;
    const sides: [number, number, number][] = [];
    for (let x: number = tip - 1e-3; x > fold; x -= 0.1) {
      const [least, greatest]: [number, number] = read.extent(x);
      sides.push([x, least, greatest]);
      if (least <= -half && greatest >= half) break;
    }
    const past = (row: [number, number, number], z: number): number => (z >= 0 ? row[2] - z : z - row[1]);
    const front: [number, number][] = Array.from({ length: frontCount }, (_: unknown, k: number): [number, number] => {
      const z: number = -half + (2 * half * k) / (frontCount - 1);
      const found: number = sides.findIndex((row: [number, number, number]): boolean => past(row, z) >= 0);
      if (found < 0) return [z, sides[sides.length - 1]![0] - (tip - free)];
      if (found === 0) return [z, sides[0]![0] - (tip - free)];
      const [here, before]: [number, number] = [past(sides[found]!, z), past(sides[found - 1]!, z)];
      return [z, sides[found]![0] + (0.1 * here) / (here - before) - (tip - free)];
    });
    const frontLeast: number = Math.min(...front.map((row: [number, number]): number => row[1]));
    const frontMost: number = Math.max(...front.map((row: [number, number]): number => row[1]));
    // The lateral fold's wall takes the room the digit has beside the plate: from the plate's edge out to the skin's side, and one
    // thickness at least. Jung's width is measured between the lowest points of the lateral grooves, so the plate keeps its width
    // and the wall rises outside it; it ends where the skin turns under, so the relief never moves skin past the digit's side.
    const room = (s: ISection): number => Math.max(proportions.thickness, s.reach - s.edge);
    // The outline's proximal end is one curve tangent to both edges, since the folds are one groove round the plate: the half ellipse
    // with the plate's half width across and `deep` along, centred at `bend`. An ellipse's end turns on its other half axis squared
    // over this one, so with `deep = half / (2 lunula)` the fold's apex turns on the stated radius `lunula W`. The wall's outer border
    // is the ellipse about the same centre that is the lateral wall wider across and two ramps longer along, the room the digit has
    // along its length behind the fold.
    const deep: number = half / (2 * proportions.lunula);
    const bend: number = fold + deep;
    const wide: number = between(bend).edge;
    const beside: number = room(between(bend));
    const lowering = (x: number, y: number, z: number, sharp: boolean): number => {
      const s: ISection = between(x);
      // At the folds the wall lies outside the outline; `limit` is the outline's half width at this distance along. Behind `bend` the
      // share falls from the outline to the wall's outer border along the ray from the ellipses' centre: a point `r` along that ray,
      // where the outline stands `r / inner` and the border `r / outer`.
      let [share, limit]: [number, number] = [step(1 + (s.edge - Math.abs(z)) / room(s)), s.edge];
      if (x < bend) {
        const [along, aside]: [number, number] = [bend - x, Math.abs(z)];
        const inner: number = Math.hypot(along / deep, aside / wide);
        const outer: number = Math.hypot(along / (deep + 2 * ramp), aside / (wide + beside));
        share = inner <= 1 ? 1 : outer >= 1 ? 0 : step((1 / outer - 1) / (1 / outer - 1 / inner));
        limit = along >= deep ? 0 : wide * Math.sqrt(1 - (along / deep) ** 2);
      }
      // At the free edge the ramp lies inside the outline, the plate coming down to the tip's skin over the last two ramps before its
      // apex. It is drawn twice: by the bed's own net as that slope, which the net resolves, and by the edge's strip, fine along the
      // digit, as the difference between a step one thickness long and that slope.
      const left: number = tabled(front, z) - x;
      const slope: number = step(left / (2 * ramp));
      // Outside the outline the wall goes down to the plate's edge, not on down the plate's side: the face is read at the outline there.
      // Read on down the side it asked the net for 2 to 3.7 mm at its border (run 14-39-31, `clipped`).
      const over: number = y - (face(x, Math.max(-limit, Math.min(limit, z))) - UNDER * proportions.fold);
      // The relief is the nail's own surface: inside the outline the skin goes to the plate's face, down where the face lies under it
      // and up where the face stands over it, toward the free edge.
      return share * (sharp ? step(left / proportions.thickness) - slope : slope) * over;
    };
    const cell: number = NET * ramp;
    const reachOut: number = 2 * ramp + 3 * cell;
    // The window's phases, read on the skin's ring midway along the plate: from the dorsal line each way round to the lateral wall's
    // end, or to the skin's side where it turns under before that, and three cells on, which the net's zero rings take.
    const midway: number = (fold + edge) / 2;
    const walled: number = between(midway).edge + room(between(midway));
    const around: V3[] = read.ring(midway);
    const around0: number = read.find(midway, mid(read, midway)).phase;
    const start: number = Math.round((around0 / (2 * Math.PI)) * RING) % RING;
    const walk = (direction: 1 | -1): { steps: number; length: number } => {
      let [length, extra, steps]: [number, number, number] = [0, 0, 0];
      let reached: boolean = false;
      while (extra < 3 * cell && steps < RING / 2) {
        const p: V3 = around[(((start + direction * steps) % RING) + RING) % RING]!;
        const q: V3 = around[(((start + direction * (steps + 1)) % RING) + RING) % RING]!;
        const piece: number = Math.hypot(q[1] - p[1], q[2] - p[2]);
        if (Math.abs(q[2]) >= walled || (Math.abs(p[2]) > half / 2 && Math.abs(q[2]) < Math.abs(p[2]))) reached = true;
        length += piece;
        if (reached) extra += piece;
        steps += 1;
      }
      return { steps, length };
    };
    const [down, up]: [{ steps: number; length: number }, { steps: number; length: number }] = [walk(-1), walk(1)];
    const opening: number = (2 * Math.PI * (start - down.steps)) / RING;
    const span: number = (2 * Math.PI * (down.steps + up.steps)) / RING;
    const girth: number = down.length + up.length;
    const columns: number = Math.max(7, Math.ceil(girth / cell) + 3);
    const phases: [number, number] = [opening < 0 ? opening + 2 * Math.PI : opening, 0];
    // A window along the digit that holds two distances along the nail at every one of its columns. A row of the digit's chart is not
    // a line across the nail, whose frame is pitched and rolled against the digit's course, so the stations are read at every
    // column's phase and the window runs from the least to the greatest; cut at one phase, the strip's last rows and outer columns
    // still lay before the free edge at the sides (run 15-09-05, `clippedIn`).
    const windowed = (from: number, to: number): [number, number] => {
      let [least, greatest]: [number, number] = [Infinity, -Infinity];
      for (let j: number = 0; j < columns; ++j) {
        const phase: number = phases[0] + (span * (j - 1)) / (columns - 3);
        least = Math.min(least, read.station(from, phase));
        greatest = Math.max(greatest, read.station(Math.min(tip, to), phase));
      }
      return [least, Math.min(skin.tip - 1e-6, greatest)];
    };
    const net: { stations: [number, number]; phases: [number, number] } = { stations: windowed(fold - reachOut, frontMost + reachOut), phases };
    const rows: number = Math.max(7, Math.ceil((net.stations[1] - net.stations[0]) / cell) + 3);
    let clipped: number = 0;
    let clippedAt: [number, number] = [0, 0];
    let clippedIn: [number, number, number, number, number] = [0, 0, 0, 0, 0];
    // A net's heights over the window's phases between two stations. Each control stands at its Greville abscissa: control `i` of `n`
    // at parameter `i - 1` of `[0, n - 3]`. The back of a row ends at its own two sides, the controls that stand farthest to either
    // side in it; a control past them lies on the underside, where the lateral offset reads as the back's again, and holds zero.
    const fill = (count: number, from: number, to: number, sharp: boolean): number[] => {
      const out: number[] = [];
      for (let i: number = 0; i < count; ++i) {
        const s: number = Math.max(skin.first, Math.min(skin.tip, from + ((to - from) * (i - 1)) / (count - 3)));
        const points: V3[] = Array.from({ length: columns }, (_: unknown, j: number): V3 => read.at(s, net.phases[0] + (span * (j - 1)) / (columns - 3)));
        let [least, greatest]: [number, number] = [0, 0];
        for (let j: number = 1; j < columns; ++j) {
          if (points[j]![2] < points[least]![2]) least = j;
          if (points[j]![2] > points[greatest]![2]) greatest = j;
        }
        for (let j: number = 0; j < columns; ++j) {
          const p: V3 = points[j]!;
          const d: number = j < Math.min(least, greatest) || j > Math.max(least, greatest) ? 0 : lowering(p[0], p[1], p[2], sharp);
          const outer: boolean = i < 3 || j < 3 || i >= count - 3 || j >= columns - 3;
          if (outer && Math.abs(d) > clipped) {
            clipped = Math.abs(d);
            clippedAt = [p[0], p[2]];
            clippedIn = [sharp ? 1 : 0, i, j, count, columns];
          }
          out.push(outer ? 0 : -d);
        }
      }
      return out;
    };
    const heights: number[] = fill(rows, net.stations[0], net.stations[1], false);
    // The free edge's strip: the bed's window round the digit, and along it from two ramps and three of its own cells before the
    // apex to three cells past it; its cells along are a quarter of the step's length, one thickness (the lofting skill's rule).
    const fine: number = proportions.thickness / 4;
    const band: [number, number] = windowed(frontLeast - 2 * ramp - 3 * fine, frontMost + 3 * fine);
    const lines: number = Math.max(7, Math.ceil((band[1] - band[0]) / fine) + 3);
    const steps: number[] = fill(lines, band[0], band[1], true);
    const visible: ISection[] = sections.filter((_: unknown, i: number): boolean => stations[i]! >= fold);
    // A conic of middle weight `w` from a level start to an upright end turns on the radius `2 w^2 side^2 / drop` at its start.
    const radii: number[] = visible.map((s: ISection): number => (2 * s.weight * s.weight * s.side * s.side) / s.drop);
    const sagittas: number[] = visible.map((s: ISection): number => s.sagitta);
    return {
      plate,
      bed: { name: bed, stations: net.stations, phases: [net.phases[0], net.phases[0] + span], axis: frame.dorsal, rows, columns, heights },
      strip: { name: bed + ".edge", stations: band, phases: [net.phases[0], net.phases[0] + span], axis: frame.dorsal, rows: lines, columns, heights: steps },
      frame,
      plan: {
        span: [fold, free],
        bend: [bend, deep, wide],
        front,
        edges: stations.map((x: number, i: number): [number, number] => [x, sections[i]!.edge]),
        // The plate's back stands its deepest section's drop and one thickness under the crown line (the plate family's back extreme).
        floor: crown - Math.max(...sections.map((s: ISection): number => s.drop)) - proportions.thickness,
      },
      profile: stations.map((x: number, i: number): { along: number; middle: number; height: number; edge: number; turn: number } => ({ along: x, middle: mid(read, x), height: height(x), edge: loose[i]!.edge, turn: loose[i]!.turn })),
      outline: {
        centre: [read.station(midway, around0), around0],
        semi: [(read.station(edge, around0) - read.station(fold, around0)) / 2, Math.abs(Math.asin(Math.sin(read.find(midway, mid(read, midway) + between(midway).edge).phase - around0)))],
      },
      readings: {
        breadth,
        tip: tip0,
        width,
        narrowed,
        roll,
        pitch,
        span: [fold, free],
        under: [Math.min(...visible.map((s: ISection): number => s.under)), Math.max(...visible.map((s: ISection): number => s.under))],
        radius: [Math.min(...radii), Math.max(...radii)],
        sagitta: [Math.min(...sagittas), Math.max(...sagittas)],
        clipped,
        clippedAt,
        clippedIn,
        passes,
      },
    };
  }
}
