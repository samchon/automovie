import {
  IAutoMovieSweepSection,
  IAutoMovieSweepSurface,
  compileAutoMovieSweep,
} from "@automovie/engine";
import { IAutoMovieVector3 } from "@automovie/interface";

import { AUTOMOVIE_HUMAN_FOOT_COLLAR } from "./AUTOMOVIE_HUMAN_FOOT_COLLAR";
import { AUTOMOVIE_HUMAN_FOOT_FORM } from "./AUTOMOVIE_HUMAN_FOOT_FORM";
import { IAutoMovieHumanFootPlan } from "./IAutoMovieHumanFootPlan";
import { interpolateAutoMovieHumanFootProfile } from "./interpolateAutoMovieHumanFootProfile";

/**
 * The foot as a solid: the foot proper, a slab over the plan between the sole and the dorsum, joined to the ankle column by a smooth union, and the distance from a point inside to the skin along a ray, which turns the solid into the sections of the foot's sweep.
 *
 * The slab's plan is the plan's two borders, joined behind by the heel's half ellipse; its top is the dorsum, highest along the plan's crest and falling to each border's rim, steeply on the medial side and slowly on the lateral (Gray 1918, "Surface Anatomy of the Lower Extremity"), raised or lowered with the medial arch; its underside is the standing surface, lifted under the medial arch by the plan's medial sole heights. Its edges are rounded, the sole's edge more broadly under the heel, where the calcaneal tuberosity rounds into the heel pad. The column continues the shared ankle B-spline through its pinned collar, using the engine's own polar section reader, then widens below the collar toward the malleoli. The malleolar and slab union starts below that boundary and reaches its original field at the higher malleolar mass centre; a quintic weight has zero first and second derivatives at both ends. This is the explicit geometric boundary condition, graded conventional rather than an anatomical regression. The engine's finite angular sampling remains an approximation of the B-spline. A smooth minimum of the two (Quilez's polynomial smooth minimum) fills the angle between them, so the front of the ankle runs into the dorsum in one curve, the instep, and the back of the heel rises into the column.
 *
 * Distances are millimetres in the foot's local frame, `x` lateral, `y` up, `z` forward; the field is negative inside and approximates the distance to the skin near it.
 *
 * @param props The plan and the ankle ring
 * @returns The solid
 */
export function solidAutoMovieHumanFoot(props: {
  plan: IAutoMovieHumanFootPlan;
  ring: solidAutoMovieHumanFoot.IRing;
}): solidAutoMovieHumanFoot.ISolid {
  const plan: IAutoMovieHumanFootPlan = props.plan;
  const L: number = plan.length;
  const profile: (p: IAutoMovieHumanFootPlan.IProfile, f: number) => number = (
    p: IAutoMovieHumanFootPlan.IProfile,
    f: number,
  ): number => interpolateAutoMovieHumanFootProfile(p, f);
  const arc: IAutoMovieHumanFootPlan.IHeel = plan.heelArc;
  const arcZ: number = plan.heel + arc.at * L;
  const axisAt: (f: number) => number = (f: number): number => {
    const t: number = Math.max(
      0,
      Math.min(1, (f - arc.at) / (plan.axis.at - arc.at)),
    );
    const w: number = t * t * t * (10 - 15 * t + 6 * t * t);
    return plan.axis.heel + (plan.axis.forefoot - plan.axis.heel) * w;
  };
  // the dorsum over the plan: the old upper's surface, the crest falling to each border's rim
  const top: (x: number, z: number) => number = (
    x: number,
    z: number,
  ): number => {
    const f: number = (z - plan.heel) / L;
    const crest: number = axisAt(f) + profile(plan.ridge.x, f) * L;
    const lift: number =
      plan.ridge.lift *
      (plan.navicularHeight - 0.2 * L) *
      Math.exp(-(((f - 0.4) / 0.2) ** 2));
    const high: number = profile(plan.ridge.height, f) * L + lift;
    const medial: boolean = x < crest;
    const border: IAutoMovieHumanFootPlan.IBorder = medial
      ? plan.medial
      : plan.lateral;
    const reach: number =
      axisAt(f) +
      (medial ? -1 : 1) * profile(border.offset, Math.max(f, arc.at)) * L;
    const low: number = profile(border.rim, Math.max(f, arc.at)) * L;
    const t: number = Math.min(1, Math.max(0, (x - crest) / (reach - crest)));
    const dorsum: number =
      low + (high - low) * Math.sqrt(Math.max(0, 1 - t ** (medial ? 3 : 1.7)));
    // behind the talus the slab is the heel alone: its rim highest at the back's midline, lower at its sides, the calcaneal tendon's insertion between
    const k: number = Math.min(
      1,
      Math.max(0, (f - HEEL_TOP.from) / (HEEL_TOP.to - HEEL_TOP.from)),
    );
    const middle: number = Math.max(0, 1 - ((x - arc.x) / arc.width) ** 2);
    const rim: number =
      arc.rim[1] * HEEL_TOP.side +
      (arc.rim[0] * HEEL_TOP.back - arc.rim[1] * HEEL_TOP.side) * middle;
    const heel: number = rim + (dorsum - rim) * k * k * (3 - 2 * k);
    return toes(x, z, Math.min(dorsum, heel));
  };
  // past the metatarsophalangeal joints the dorsum comes down onto the toes: a ridge along each toe at the height of its root, the webs between them
  const first: IAutoMovieHumanFootPlan.IToe = plan.toes[0]!;
  const last: IAutoMovieHumanFootPlan.IToe = plan.toes[plan.toes.length - 1]!;
  const line: { x: number; z: number } = ((): { x: number; z: number } => {
    const dx: number = last.joint.x - first.joint.x;
    const dz: number = last.joint.z - first.joint.z;
    const n: number = Math.hypot(dx, dz);
    return { x: -dz / n, z: dx / n };
  })();
  const reach: number =
    (AUTOMOVIE_HUMAN_FOOT_FORM.toeRidge.reach *
      plan.toes.reduce(
        (sum: number, t: IAutoMovieHumanFootPlan.IToe): number =>
          sum + t.length,
        0,
      )) /
    plan.toes.length;
  const web: number =
    (AUTOMOVIE_HUMAN_FOOT_FORM.toeRidge.web *
      plan.toes.reduce(
        (sum: number, t: IAutoMovieHumanFootPlan.IToe): number =>
          sum + t.height,
        0,
      )) /
    plan.toes.length;
  const toes: (x: number, z: number, dorsum: number) => number = (
    x: number,
    z: number,
    dorsum: number,
  ): number => {
    // past the line of the metatarsophalangeal joints, the same for every toe
    const k: number = Math.min(
      1,
      Math.max(
        0,
        ((x - first.joint.x) * line.x + (z - first.joint.z) * line.z) / reach,
      ),
    );
    if (k === 0) return dorsum;
    let ridge: number = web;
    for (const toe of plan.toes) {
      const dx: number = x - toe.joint.x;
      const dz: number = z - toe.joint.z;
      const across: number =
        Math.abs(dx * toe.direction.z - dz * toe.direction.x) /
        (AUTOMOVIE_HUMAN_FOOT_FORM.toeRidge.width * toe.width);
      const height: number =
        toe.height *
        (toe.hallux
          ? AUTOMOVIE_HUMAN_FOOT_FORM.toeRidge.hallux
          : AUTOMOVIE_HUMAN_FOOT_FORM.toeRidge.lesser);
      ridge = Math.max(
        ridge,
        height * Math.sqrt(Math.max(0, 1 - Math.min(1, across) ** 2)),
      );
    }
    return dorsum + (ridge - dorsum) * k * k * (3 - 2 * k);
  };
  // the plantar surface: the standing surface, lifted under the medial arch toward the medial border from the footprint's curved contact edge, which reaches its farthest across where the arch is highest and runs back to the border where the arch ends
  const arch: IAutoMovieHumanFootPlan.IProfile = ARCH(plan);
  const archPeak: number = Math.max(
    1e-6,
    ...arch.map((point: readonly [number, number]): number => point[1]),
  );
  const bottom: (x: number, z: number) => number = (
    x: number,
    z: number,
  ): number => {
    const f: number = (z - plan.heel) / L;
    const { centre, half }: { centre: number; half: number } = across(z);
    const lift: number = profile(arch, f);
    const edge: number = 1 - (1 - CONTACT_EDGE) * (lift / archPeak);
    const t: number = Math.min(
      1,
      Math.max(
        0,
        ((centre - x) / Math.max(1e-6, half) - edge) / Math.max(1e-6, 1 - edge),
      ),
    );
    // C2 at both ends, so the onset leaves no line of changing curvature under raking light
    return lift * t * t * t * (10 - 15 * t + 6 * t * t);
  };
  // the plan's centre line and half breadth at a level along the foot
  const across: (z: number) => { centre: number; half: number } = (
    z: number,
  ): { centre: number; half: number } => {
    const f: number = Math.max((z - plan.heel) / L, arc.at);
    // past its joint each outer toe narrows the border onto its own outer flank, so the toes' roots end the forefoot
    const m: number = flank(
      first,
      -1,
      z,
      axisAt(f) - profile(plan.medial.offset, f) * L,
    );
    const l: number = flank(
      last,
      1,
      z,
      axisAt(f) + profile(plan.lateral.offset, f) * L,
    );
    return { centre: (m + l) / 2, half: (l - m) / 2 };
  };
  const flank: (
    toe: IAutoMovieHumanFootPlan.IToe,
    sign: number,
    z: number,
    border: number,
  ) => number = (
    toe: IAutoMovieHumanFootPlan.IToe,
    sign: number,
    z: number,
    border: number,
  ): number => {
    const along: number = (z - toe.joint.z) / toe.direction.z;
    const k: number = Math.min(
      1,
      Math.max(
        0,
        along / (AUTOMOVIE_HUMAN_FOOT_FORM.toeRidge.reach * toe.length),
      ),
    );
    if (k === 0) return border;
    const outer: number =
      toe.joint.x + toe.direction.x * along + (sign * toe.width) / 2;
    return border + (outer - border) * k * k * (3 - 2 * k);
  };
  // the sole's edge rounds broadly under the heel, the calcaneal tuberosity, and narrowly along the borders
  const soleRadius: (z: number) => number = (z: number): number => {
    const f: number = (z - plan.heel) / L;
    const k: number = Math.min(1, Math.max(0, (f - 0.02) / 0.2));
    return (HEEL_ROUND + (EDGE_ROUND - HEEL_ROUND) * k * k * (3 - 2 * k)) * L;
  };
  const slab: (p: IAutoMovieVector3) => number = (
    p: IAutoMovieVector3,
  ): number => {
    // the plan: the borders ahead of the heel arc's centre, its half ellipse behind
    let side: number;
    if (p.z >= arcZ) {
      const { centre, half }: { centre: number; half: number } = across(p.z);
      side = Math.abs(p.x - centre) - half;
    } else {
      const dx: number = (p.x - arc.x) / arc.width;
      const dz: number = (arcZ - p.z) / arc.reach;
      // scaled by the half breadth, so at the arc's centre it meets the borders' distance with the same value and slope
      side = (Math.hypot(dx, dz) - 1) * arc.width;
    }
    const x: number = p.x;
    const z: number = Math.max(p.z, plan.heel);
    const up: number = p.y - top(x, z);
    const down: number = bottom(x, z) - p.y;
    return Math.max(
      rounded(side, up, TOP_ROUND * L),
      rounded(side, down, soleRadius(p.z)),
    );
  };
  // the column: the ring's section at and above the ring, deepening below it toward the heel and the front of the talus
  const ring: solidAutoMovieHumanFoot.IRing = props.ring;
  const origin: IAutoMovieVector3 = ring.origin;
  const floor: number = COLUMN_BOTTOM * plan.ankleHeight;
  const collar: number = origin.y - AUTOMOVIE_HUMAN_FOOT_COLLAR * L;
  const columnSurface: IAutoMovieSweepSurface = compileAutoMovieSweep({
    spine: {
      points: [
        { x: origin.x / 1000, y: origin.y / 1000, z: origin.z / 1000 },
        { x: origin.x / 1000, y: floor / 1000, z: origin.z / 1000 },
      ],
      normal: { x: 0, y: 0, z: 1 },
    },
    stations: [{ at: 0, section: ring.section }],
  });
  const column: (p: IAutoMovieVector3) => number = (
    p: IAutoMovieVector3,
  ): number => {
    const t: number = Math.min(
      1,
      Math.max(0, (collar - p.y) / (collar - plan.ankleHeight)),
    );
    const s: number = t * t * t * (10 - 15 * t + 6 * t * t);
    const dx: number = p.x - origin.x;
    const dz: number = p.z - origin.z;
    const stretch: number =
      1 + (dz >= 0 ? COLUMN_DEEPEN.anterior : COLUMN_DEEPEN.posterior) * s;
    const z: number = dz / stretch;
    const turn: number = Math.atan2(-dx, z) / (2 * Math.PI);
    const radius: number = columnSurface.radius(0, turn) * 1000;
    // The source column uses the exact same engine section reader as the foot sweep.
    return rounded(Math.hypot(dx, z) - radius, floor - p.y, COLUMN_ROUND * L);
  };
  // the malleoli: bony knobs at the skeleton's landmarks, the lateral lower and further back, the medial higher and further forward (Gray 1918)
  const lateral: IAutoMovieVector3 = plan.lateralMalleolus;
  const medial: IAutoMovieVector3 = plan.medialMalleolus;
  const radii: IAutoMovieVector3 = {
    x: KNOB.side * L + KNOB.skin,
    y: KNOB.height * L,
    z: KNOB.depth * L,
  };
  const knobs: IAutoMovieVector3[] = [
    {
      x: lateral.x - KNOB.side * L,
      y: lateral.y + KNOB.lift.lateral * L,
      z: lateral.z - KNOB.behind * L,
    },
    {
      x: medial.x + KNOB.side * L,
      y: medial.y + KNOB.lift.medial * L,
      z: medial.z,
    },
  ];
  // The shared ring and the pinned collar are one extrusion. The union begins
  // below that collar and reaches its full field by the higher malleolus centre.
  // This is an explicit junction constraint, not a fitted anatomical value.
  const full: number = Math.max(
    ...knobs.map((p: IAutoMovieVector3): number => p.y),
  );
  if (!(collar > full))
    throw new Error("foot collar is not above the malleolar mass centres");
  const field: (p: IAutoMovieVector3) => number = (
    p: IAutoMovieVector3,
  ): number => {
    const c: number = column(p);
    if (p.y >= collar) return c;
    const union: number = knobs.reduce(
      (f: number, c: IAutoMovieVector3): number =>
        smoothMin(f, ellipsoid(p, c, radii), KNOB.blend * L),
      smoothMin(slab(p), c, BLEND * L),
    );
    if (p.y <= full) return union;
    const t: number = (collar - p.y) / (collar - full);
    const weight: number = t * t * t * (10 - 15 * t + 6 * t * t);
    return c + (union - c) * weight;
  };
  return {
    field,
    ray: (origin: IAutoMovieVector3, direction: IAutoMovieVector3): number => {
      if (field(origin) >= 0)
        throw new Error("foot section centre lies outside the foot");
      const at: (t: number) => number = (t: number): number =>
        field({
          x: origin.x + direction.x * t,
          y: origin.y + direction.y * t,
          z: origin.z + direction.z * t,
        });
      let lo: number = 0;
      let hi: number = STEP;
      while (at(hi) < 0) {
        lo = hi;
        hi += STEP;
        if (hi > 2 * L) throw new Error("foot section ray leaves no surface");
      }
      for (let k: number = 0; k < 40; ++k) {
        const mid: number = (lo + hi) / 2;
        if (at(mid) < 0) lo = mid;
        else hi = mid;
      }
      return (lo + hi) / 2;
    },
    top,
    bottom,
    across,
  };
}
/** Ring and solid types of {@link solidAutoMovieHumanFoot}. */
export namespace solidAutoMovieHumanFoot {
  /**
   * The ankle ring the column continues.
   *
   * @author Samchon
   */
  export interface IRing {
    /** Centre, local frame, millimetres. */
    origin: IAutoMovieVector3;

    /** The shared ring's B-spline section, in metres, +x anterior and +y medial. */
    section: IAutoMovieSweepSection.IBSpline;
  }

  /**
   * The foot's solid.
   *
   * @author Samchon
   */
  export interface ISolid {
    /**
     * Signed field, negative inside, near the skin about the distance to it.
     *
     * @param p Point, local frame, millimetres
     * @returns The field
     */
    field(p: IAutoMovieVector3): number;

    /**
     * Distance from a point inside to the skin along a direction.
     *
     * @param origin Point inside, local frame
     * @param direction Unit direction
     * @returns Millimetres to the first crossing
     * @throws {Error} When the origin lies outside
     */
    ray(origin: IAutoMovieVector3, direction: IAutoMovieVector3): number;

    /** The dorsum's height over a plan point. */
    top(x: number, z: number): number;

    /** The plantar surface's height under a plan point. */
    bottom(x: number, z: number): number;

    /** The plan's centre line and half breadth at a level along the foot. */
    across(z: number): { centre: number; half: number };
  }
}

/** Radius of the rim between the side walls and the dorsum, of foot length. Grade: conventional, the old cage's rim. */
const TOP_ROUND: number = 0.03;

/** Radius of the sole's edge along the borders, of foot length: the old cage's sole inset. Grade: conventional. */
const EDGE_ROUND: number = 0.022;

/** Radius of the sole's edge round the back of the heel, of foot length, the calcaneal tuberosity under its fat pad. Grade: conventional, set against renders. */
const HEEL_ROUND: number = 0.07;

/** Reach of the fillet between the column and the slab, of foot length: the instep's curve and the heel's rise into the column. Grade: conventional, set against renders. */
const BLEND: number = 0.06;

/** The heel's top behind the talus, of foot length, rising from the back of the heel to the dorsum over its span of foot length. Grade: conventional, set against the reference's heel sections. */
const HEEL_TOP: {
  readonly back: 1;
  readonly side: 1;
  readonly from: 0.08;
  readonly to: 0.3;
} = { back: 1, side: 1, from: 0.08, to: 0.3 } as const;

/** The column ends this share of the lateral malleolus height above the ground, inside the heel. Conventional. */
const COLUMN_BOTTOM: number = 0.8;

/** Growth of the column's depth from the ring down to the malleoli: in front over the talus, behind toward the heel. Conventional, set against renders. */
const COLUMN_DEEPEN: { readonly anterior: 0.15; readonly posterior: 0.2 } = {
  anterior: 0.15,
  posterior: 0.2,
} as const;

/** The malleoli as ellipsoids, in foot lengths: half-breadth inward of the landmark, half-height, half-depth, the lift of the centre above the landmark, the skin over the bone in millimetres, and their blend into the column. Conventional, the old cage's relief radii. */
const KNOB: {
  readonly side: 0.03;
  readonly height: 0.06;
  readonly depth: 0.05;
  readonly behind: 0.01;
  readonly lift: { readonly lateral: 0.045; readonly medial: 0.035 };
  readonly skin: 2;
  readonly blend: 0.03;
} = {
  side: 0.03,
  height: 0.06,
  depth: 0.05,
  behind: 0.01,
  lift: { lateral: 0.045, medial: 0.035 },
  skin: 2,
  blend: 0.03,
} as const;

/** Field of an axis-aligned ellipsoid, negative inside, about the distance near its surface. */
const ellipsoid: (
  p: IAutoMovieVector3,
  c: IAutoMovieVector3,
  r: IAutoMovieVector3,
) => number = (
  p: IAutoMovieVector3,
  c: IAutoMovieVector3,
  r: IAutoMovieVector3,
): number =>
  (Math.hypot((p.x - c.x) / r.x, (p.y - c.y) / r.y, (p.z - c.z) / r.z) - 1) *
  Math.min(r.x, r.y, r.z);

/** Radius of the column's lower rim, of foot length. Grade: conventional, set against renders. */
const COLUMN_ROUND: number = 0.05;

/** March step of a ray before bisection, millimetres; under half the thinnest part's thickness. */
const STEP: number = 1;

/** The footprint's contact edge where the arch is highest, as the medial share `(centre - x) / half` from -1 at the lateral border to 1 at the medial: the contact there keeps 35% of the breadth from the lateral border. That share is the Chippaux-Smirak index, the isthmus's least contact breadth over the forefoot's greatest (used for footprints by Forriol and Pascual 1990, Foot Ankle 11(2):101-104); footprints divide into flat and not flat at 0.6 (PLoS ONE 2014, doi:10.1371/journal.pone.0115808), and 0.35 is a well-arched foot below it, applied to the local breadth. Grade: conventional within a measured bound. */
const CONTACT_EDGE: number = -1 + 2 * 0.35;

/** Lift of the plantar surface under the medial arch at the medial border, of foot length: the plan's medial sole heights over the arch, nothing under the heel and the ball. */
const ARCH: (
  plan: IAutoMovieHumanFootPlan,
) => IAutoMovieHumanFootPlan.IProfile = (
  plan: IAutoMovieHumanFootPlan,
): IAutoMovieHumanFootPlan.IProfile => {
  const at: (f: number) => number = (f: number): number =>
    interpolateAutoMovieHumanFootProfile(plan.medial.sole, f);
  return [
    [0.16, 0],
    [0.32, at(0.32) * plan.length],
    [0.48, at(0.48) * plan.length],
    [0.64, 0],
  ];
};

/** A rounded corner of two half-space distances: the corner rounded with radius `r`. */
const rounded: (a: number, b: number, r: number) => number = (
  a: number,
  b: number,
  r: number,
): number =>
  Math.hypot(Math.max(a + r, 0), Math.max(b + r, 0)) +
  Math.min(Math.max(a + r, b + r), 0) -
  r;

/** Polynomial smooth minimum (Quilez). */
const smoothMin: (a: number, b: number, k: number) => number = (
  a: number,
  b: number,
  k: number,
): number => {
  const h: number = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - (h * h * k) / 4;
};
