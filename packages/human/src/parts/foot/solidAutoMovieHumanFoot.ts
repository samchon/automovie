import { IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieHumanFootPlan } from "./IAutoMovieHumanFootPlan";
import { interpolateAutoMovieHumanFootProfile } from "./interpolateAutoMovieHumanFootProfile";

/**
 * The foot as a solid: the foot proper, a slab over the plan between the sole and the dorsum, joined to the ankle column by a smooth union, and the distance from a point inside to the skin along a ray, which turns the solid into the sections of the foot's sweep.
 *
 * The slab's plan is the plan's two borders, joined behind by the heel's half ellipse; its top is the dorsum, highest along the plan's crest and falling to each border's rim, steeply on the medial side and slowly on the lateral (Gray 1918, "Surface Anatomy of the Lower Extremity"), raised or lowered with the medial arch; its underside is the standing surface, lifted under the medial arch by the plan's medial sole heights. Its edges are rounded, the sole's edge more broadly under the heel, where the calcaneal tuberosity rounds into the heel pad. The column is the leg above the foot: at and above the ankle ring its section is the ring's own, and below it widens to the malleoli. A smooth minimum of the two (Quilez's polynomial smooth minimum) fills the angle between them, so the front of the ankle runs into the dorsum in one curve, the instep, and the back of the heel rises into the column.
 *
 * Distances are millimetres in the foot's local frame, `x` lateral, `y` up, `z` forward; the field is negative inside and approximates the distance to the skin near it.
 *
 * @param props The plan and the column's section
 * @returns The solid
 */
export function solidAutoMovieHumanFoot(props: {
  plan: IAutoMovieHumanFootPlan;
  column: solidAutoMovieHumanFoot.IColumn;
}): solidAutoMovieHumanFoot.ISolid {
  const plan: IAutoMovieHumanFootPlan = props.plan;
  const L: number = plan.length;
  const profile = (p: IAutoMovieHumanFootPlan.IProfile, f: number): number =>
    interpolateAutoMovieHumanFootProfile(p, f);
  const arc: IAutoMovieHumanFootPlan.IHeel = plan.heelArc;
  const arcZ: number = plan.heel + arc.at * L;
  // the dorsum over the plan: the old upper's surface, the crest falling to each border's rim
  const top = (x: number, z: number): number => {
    const f: number = (z - plan.heel) / L;
    const crest: number = plan.axis + profile(plan.ridge.x, f) * L;
    const lift: number =
      plan.ridge.lift * (plan.navicularHeight - 0.2 * L) * Math.exp(-(((f - 0.4) / 0.2) ** 2));
    const high: number = profile(plan.ridge.height, f) * L + lift;
    const medial: boolean = x < crest;
    const border: IAutoMovieHumanFootPlan.IBorder = medial ? plan.medial : plan.lateral;
    const reach: number = plan.axis + (medial ? -1 : 1) * profile(border.offset, Math.max(f, arc.at)) * L;
    const low: number = profile(border.rim, Math.max(f, arc.at)) * L;
    const t: number = Math.min(1, Math.max(0, (x - crest) / (reach - crest)));
    const dorsum: number = low + (high - low) * Math.sqrt(Math.max(0, 1 - t ** (medial ? 3 : 1.7)));
    // behind the talus the slab is the heel alone: its rim highest at the back's midline, lower at its sides, the calcaneal tendon's insertion between
    const k: number = Math.min(1, Math.max(0, (f - HEEL_TOP.from) / (HEEL_TOP.to - HEEL_TOP.from)));
    const middle: number = Math.max(0, 1 - ((x - arc.x) / arc.width) ** 2);
    const rim: number = arc.rim[1] * HEEL_TOP.side + (arc.rim[0] * HEEL_TOP.back - arc.rim[1] * HEEL_TOP.side) * middle;
    const heel: number = rim + (dorsum - rim) * k * k * (3 - 2 * k);
    return Math.min(dorsum, heel);
  };
  // the plantar surface: the standing surface, lifted under the medial arch toward the medial border
  const bottom = (x: number, z: number): number => {
    const f: number = (z - plan.heel) / L;
    const { centre, half } = across(z);
    const medial: number = Math.min(1, Math.max(0, (centre - x) / Math.max(1e-6, half)));
    return profile(ARCH(plan), f) * medial * medial * (3 - 2 * medial);
  };
  // the plan's centre line and half breadth at a level along the foot
  const across = (z: number): { centre: number; half: number } => {
    const f: number = Math.max((z - plan.heel) / L, arc.at);
    const m: number = plan.axis - profile(plan.medial.offset, f) * L;
    const l: number = plan.axis + profile(plan.lateral.offset, f) * L;
    return { centre: (m + l) / 2, half: (l - m) / 2 };
  };
  // the sole's edge rounds broadly under the heel, the calcaneal tuberosity, and narrowly along the borders
  const soleRadius = (z: number): number => {
    const f: number = (z - plan.heel) / L;
    const k: number = Math.min(1, Math.max(0, (f - 0.02) / 0.2));
    return (HEEL_ROUND + (EDGE_ROUND - HEEL_ROUND) * k * k * (3 - 2 * k)) * L;
  };
  const slab = (p: IAutoMovieVector3): number => {
    // the plan: the borders ahead of the heel arc's centre, its half ellipse behind
    let side: number;
    if (p.z >= arcZ) {
      const { centre, half } = across(p.z);
      side = Math.abs(p.x - centre) - half;
    } else {
      const dx: number = (p.x - arc.x) / arc.width;
      const dz: number = (arcZ - p.z) / arc.reach;
      side = (Math.hypot(dx, dz) - 1) * Math.min(arc.width, arc.reach);
    }
    const x: number = p.x;
    const z: number = Math.max(p.z, plan.heel);
    const up: number = p.y - top(x, z);
    const down: number = bottom(x, z) - p.y;
    return Math.max(rounded(side, up, TOP_ROUND * L), rounded(side, down, soleRadius(p.z)));
  };
  const C: solidAutoMovieHumanFoot.IColumn = props.column;
  const column = (p: IAutoMovieVector3): number => {
    const s: solidAutoMovieHumanFoot.ISection = C.section(Math.min(p.y, C.top));
    const dx: number = p.x - s.x;
    const dz: number = p.z - s.z;
    const ax: number = dx >= 0 ? s.lateral : s.medial;
    const az: number = dz >= 0 ? s.anterior : s.posterior;
    const r: number = Math.hypot(dx / ax, dz / az);
    const size: number = Math.min(ax, az);
    return Math.max((r - 1) * size, C.bottom - p.y);
  };
  const field = (p: IAutoMovieVector3): number => smoothMin(slab(p), column(p), BLEND * L);
  return {
    field,
    ray: (origin: IAutoMovieVector3, direction: IAutoMovieVector3): number => {
      if (field(origin) >= 0) throw new Error("foot section centre lies outside the foot");
      const at = (t: number): number =>
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
/** Column, section and solid types of {@link solidAutoMovieHumanFoot}. */
export namespace solidAutoMovieHumanFoot {
  /**
   * The leg's column above the foot.
   *
   * @author Samchon
   */
  export interface IColumn {
    /** Height above which the section holds the ring's, millimetres. */
    top: number;

    /** Height below which the column ends inside the slab. */
    bottom: number;

    /**
     * The column's horizontal section at a height.
     *
     * @param y Height, millimetres
     * @returns Its centre and four half-axes
     */
    section(y: number): ISection;
  }

  /**
   * A horizontal section of the column: an egg of four quarter ellipses.
   *
   * @author Samchon
   */
  export interface ISection {
    /** Centre, lateral. */
    x: number;

    /** Centre, forward. */
    z: number;

    /** Half-axis toward the lateral side. */
    lateral: number;

    /** Half-axis toward the medial side. */
    medial: number;

    /** Half-axis forward. */
    anterior: number;

    /** Half-axis backward. */
    posterior: number;
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
const HEEL_TOP = { back: 1, side: 1, from: 0.08, to: 0.3 } as const;

/** March step of a ray before bisection, millimetres; under half the thinnest part's thickness. */
const STEP: number = 1;

/** Lift of the plantar surface under the medial arch at the medial border, of foot length: the plan's medial sole heights over the arch, nothing under the heel and the ball. */
const ARCH = (plan: IAutoMovieHumanFootPlan): IAutoMovieHumanFootPlan.IProfile => {
  const at = (f: number): number => interpolateAutoMovieHumanFootProfile(plan.medial.sole, f);
  return [
    [0.16, 0],
    [0.32, at(0.32) * plan.length],
    [0.48, at(0.48) * plan.length],
    [0.64, 0],
  ];
};

/** A rounded corner of two half-space distances: the corner rounded with radius `r`. */
const rounded = (a: number, b: number, r: number): number =>
  Math.hypot(Math.max(a + r, 0), Math.max(b + r, 0)) + Math.min(Math.max(a + r, b + r), 0) - r;

/** Polynomial smooth minimum (Quilez). */
const smoothMin = (a: number, b: number, k: number): number => {
  const h: number = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - (h * h * k) / 4;
};
