import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { AUTOMOVIE_HUMAN_FOOT_GRID } from "./AUTOMOVIE_HUMAN_FOOT_GRID";
import { IAutoMovieHumanFootDraft } from "./IAutoMovieHumanFootDraft";
import { IAutoMovieHumanFootPlan } from "./IAutoMovieHumanFootPlan";
import { interpolateAutoMovieHumanFootProfile } from "./interpolateAutoMovieHumanFootProfile";

/**
 * The malleoli, each a fraction of foot length: the bony knobs either side of the ankle, the lateral the lower and the more prominent (Gray 1918). Grade: conventional, set against renders. The hollows beside the calcaneal tendon and the tendon's own line are the plan's fitted `hollow` and `tendon`.
 */
const RELIEF: Record<
  "lateralMalleolus" | "medialMalleolus",
  { lift: number; radius: number; depth: number }
> = {
  /** Centre above the lowest point, extent and prominence. */
  lateralMalleolus: { lift: 0.045, radius: 0.055, depth: 0.035 },
  /** Centre above the tip, extent and prominence. */
  medialMalleolus: { lift: 0.035, radius: 0.06, depth: 0.03 },
};

/**
 * Shape the upper's interior, from the ankle ring down to its boundary.
 *
 * Each upper vertex lies on a meridian, the path from the ring down to the upper's edge in the direction the grid gives it about the ankle. The grid is read in polar terms about the hole's centre: a vertex's ring of the square grid (its Chebyshev distance from the hole) and its place around that ring give its angle about the ankle and its fraction of the way from the ring to the edge, so the vertices in each loop round the hole share their angles' spacing and each meridian is cut evenly. A meridian drops straight down from the ring, as the leg does, until it meets the dorsal surface, then follows that surface out to the edge. The dorsal surface is a height over the plan: highest along the plan's crest, falling to each border's rim height, steeply on the medial side and slowly on the lateral, and raised or lowered with the medial arch. In front this makes the instep's concave turn from the ankle onto the convex dorsum; at the sides and behind, where the crest is far and the rim close, it makes the near-vertical walls of the heel and the malleolar region. The loop next to the ring keeps the ring's own section straight below it, so the joined limit surface keeps the measured ankle girth at the junction. The relief then adds the malleoli at the skeleton's landmarks and the hollows beside the calcaneal tendon.
 *
 * @param plan The foot's plan
 * @param draft The draft whose upper boundary is placed; its interior is filled in place
 */
export function shapeAutoMovieHumanFootUpper(
  plan: IAutoMovieHumanFootPlan,
  draft: IAutoMovieHumanFootDraft,
): void {
  const { columns, rows } = AUTOMOVIE_HUMAN_FOOT_GRID;
  const L: number = plan.length;
  const A: number = plan.ankleHeight;
  const upper: Array<Array<IAutoMovieVector3 | null>> = draft.upper;
  const edge = (
    row: (k: number) => IAutoMovieVector3,
    at: number,
    count: number,
  ): IAutoMovieVector3 => {
    const k: number = Math.min(Math.floor(at), count - 2);
    return lerp(row(k), row(k + 1), at - k);
  };
  const boundary = ([bi, bj]: [number, number]): IAutoMovieVector3 => {
    if (Math.abs(bi) < 1e-9)
      return edge((k: number): IAutoMovieVector3 => upper[0]![k]!, bj, rows);
    if (Math.abs(bi - (columns - 1)) < 1e-9)
      return edge(
        (k: number): IAutoMovieVector3 => upper[columns - 1]![k]!,
        bj,
        rows,
      );
    if (Math.abs(bj) < 1e-9)
      return edge((k: number): IAutoMovieVector3 => upper[k]![0]!, bi, columns);
    return edge(
      (k: number): IAutoMovieVector3 => upper[k]![rows - 1]!,
      bi,
      columns,
    );
  };
  const surface = (x: number, z: number): number => {
    const f: number = (z - plan.heel) / L;
    const crest: number =
      plan.axis + interpolateAutoMovieHumanFootProfile(plan.ridge.x, f) * L;
    const lift: number =
      plan.ridge.lift *
      (plan.navicularHeight - 0.2 * L) *
      Math.exp(-(((f - 0.4) / 0.2) ** 2));
    const top: number =
      interpolateAutoMovieHumanFootProfile(plan.ridge.height, f) * L + lift;
    const medial: boolean = x < crest;
    const border: IAutoMovieHumanFootPlan.IBorder = medial
      ? plan.medial
      : plan.lateral;
    const reach: number =
      plan.axis +
      (medial ? -1 : 1) *
        interpolateAutoMovieHumanFootProfile(border.offset, f) *
        L;
    const low: number = interpolateAutoMovieHumanFootProfile(border.rim, f) * L;
    const t: number = Math.min(1, Math.max(0, (x - crest) / (reach - crest)));
    return (
      low + (top - low) * Math.sqrt(Math.max(0, 1 - t ** (medial ? 3 : 1.7)))
    );
  };
  const centre: IAutoMovieVector3 = plan.ankle.origin;
  const meridian = (
    ring: IAutoMovieVector3,
    end: IAutoMovieVector3,
  ): IAutoMovieVector3[] => {
    const out: IAutoMovieVector3 = AutoMovieHumanVector.normalize(
      AutoMovieHumanVector.of(ring.x - centre.x, 0, ring.z - centre.z),
    );
    const foot: IAutoMovieVector3 = AutoMovieHumanVector.of(
      ring.x + 3 * out.x,
      0,
      ring.z + 3 * out.z,
    );
    const knee: number = Math.min(ring.y - 5, surface(foot.x, foot.z));
    const path: IAutoMovieVector3[] = [ring];
    for (let k: number = 1; k <= DROP; ++k)
      path.push(
        lerp(ring, AutoMovieHumanVector.of(foot.x, knee, foot.z), k / DROP),
      );
    for (let k: number = 1; k <= SPREAD; ++k) {
      const x: number = foot.x + ((end.x - foot.x) * k) / SPREAD;
      const z: number = foot.z + ((end.z - foot.z) * k) / SPREAD;
      path.push(
        AutoMovieHumanVector.of(
          x,
          k === SPREAD ? end.y : Math.max(end.y, Math.min(surface(x, z), knee)),
          z,
        ),
      );
    }
    return path;
  };
  const inward = (p: IAutoMovieVector3, depth: number): IAutoMovieVector3 => {
    const d: IAutoMovieVector3 = AutoMovieHumanVector.normalize(
      AutoMovieHumanVector.of(centre.x - p.x, 0, centre.z - p.z),
    );
    return AutoMovieHumanVector.offset(p, [d, depth]);
  };
  const lateral: IAutoMovieVector3 = AutoMovieHumanVector.offset(
    plan.lateralMalleolus,
    [AutoMovieHumanVector.of(0, 1, 0), RELIEF.lateralMalleolus.lift * L],
  );
  const medial: IAutoMovieVector3 = AutoMovieHumanVector.offset(
    plan.medialMalleolus,
    [AutoMovieHumanVector.of(0, 1, 0), RELIEF.medialMalleolus.lift * L],
  );
  for (let i: number = 0; i < columns; ++i)
    for (let j: number = 0; j < rows; ++j) {
      const at: shapeAutoMovieHumanFootUpper.IPolar | null =
        shapeAutoMovieHumanFootUpper.polar(i, j);
      if (at === null || upper[i]![j] !== null) continue;
      const ring: IAutoMovieVector3 = shapeAutoMovieHumanFootUpper.ring(
        plan.ankle,
        at.angle,
      );
      if (at.fraction === 0) {
        upper[i]![j] = ring;
        continue;
      }
      let p: IAutoMovieVector3 = sample(
        meridian(ring, boundary(at.edge)),
        at.fraction,
      );
      if (at.loop === 2) {
        // the loop next to the ring is a straight collar of the ring's own section; the two collar vertices beside each corner of the hole stand out by 1 / cos 22.5 degrees so their mean, which the corner's limit takes, falls on the ring
        const eighths: number = (at.angle * 8) / Math.PI;
        const out: number =
          Math.abs(eighths - Math.round(eighths)) < 1e-9 &&
          Math.round(eighths) % 2 !== 0
            ? 1 / Math.cos(Math.PI / 8)
            : 1;
        upper[i]![j] = AutoMovieHumanVector.of(
          centre.x + (ring.x - centre.x) * out,
          p.y,
          centre.z + (ring.z - centre.z) * out,
        );
        continue;
      }
      const degrees: number = Math.abs((at.angle * 180) / Math.PI);
      const hollow: IAutoMovieHumanFootPlan.IHollow = plan.hollow;
      const tendon: IAutoMovieHumanFootPlan.IHollow = plan.tendon;
      p = inward(
        p,
        plan.relief *
          hollow.depth *
          L *
          Math.exp(-(((degrees - hollow.angle) / hollow.width) ** 2)) *
          Math.exp(-(((p.y - hollow.at * A) / (hollow.spread * A)) ** 2)) +
          plan.relief *
            tendon.depth *
            L *
            Math.exp(-(((degrees - tendon.angle) / tendon.width) ** 2)) *
            Math.exp(-(((p.y - tendon.at * A) / (tendon.spread * A)) ** 2)),
      );
      p = bump(
        p,
        lateral,
        RELIEF.lateralMalleolus.radius * L,
        plan.relief * RELIEF.lateralMalleolus.depth * L,
        1,
      );
      p = bump(
        p,
        medial,
        RELIEF.medialMalleolus.radius * L,
        plan.relief * RELIEF.medialMalleolus.depth * L,
        -1,
      );
      upper[i]![j] = p;
    }
}
/** The polar reading of the upper's grid and the ankle section, shared with the knitting of its charts. */
export namespace shapeAutoMovieHumanFootUpper {
  /**
   * Where an upper vertex lies about the ankle.
   *
   * @author Samchon
   */
  export interface IPolar {
    /** Angle about the ankle in plan, radians, 0 in front and positive laterally. */
    angle: number;

    /** Fraction of the way from the ring (0) to the upper's edge (1). */
    fraction: number;

    /** Which loop round the hole the vertex lies on: 1 the ring itself, 2 the loop next to it, and so on outward. */
    loop: number;

    /** Fractional grid position where the vertex's ray from the hole's centre meets the upper's edge. */
    edge: [number, number];
  }

  /**
   * Read an upper grid position in polar terms about the ankle hole.
   *
   * @param i Column
   * @param j Row
   * @returns Its angle, its fraction of the way out and where its ray meets the edge, or null at the hole's centre
   */
  export function polar(i: number, j: number): IPolar | null {
    const { columns, rows, holeColumn, holeRow } = AUTOMOVIE_HUMAN_FOOT_GRID;
    const di: number = i - holeColumn - 1;
    const dj: number = j - holeRow - 1;
    const r: number = Math.max(Math.abs(di), Math.abs(dj));
    if (r === 0) return null;
    const degrees: number =
      dj === r
        ? (45 * di) / r
        : di === r
          ? 90 - (45 * dj) / r
          : dj === -r
            ? 180 - (45 * di) / r
            : -90 + (45 * dj) / r;
    const reach: number = Math.min(
      di > 0
        ? (columns - 2 - holeColumn) / di
        : di < 0
          ? (holeColumn + 1) / -di
          : Infinity,
      dj > 0
        ? (rows - 2 - holeRow) / dj
        : dj < 0
          ? (holeRow + 1) / -dj
          : Infinity,
    );
    return {
      angle: (degrees * Math.PI) / 180,
      fraction: (1 - 1 / r) / (reach - 1 / r),
      loop: r,
      edge: [holeColumn + 1 + reach * di, holeRow + 1 + reach * dj],
    };
  }

  /**
   * The point of the ankle ring's section in a direction.
   *
   * At the ring's own eight directions this is the shared ring vertex; between them the distance blends the two neighbouring vertices' by a cosine, so a meridian between two ring vertices starts on the section's smooth outline.
   *
   * @param ankle The ankle section
   * @param angle Angle in plan, radians, 0 in front and positive laterally
   * @returns The point of the section in that direction
   */
  export function ring(
    ankle: IAutoMovieHumanFootPlan.IAnkle,
    angle: number,
  ): IAutoMovieVector3 {
    const sx: number = Math.sin(angle);
    const sz: number = Math.cos(angle);
    const n: number = ankle.radii.length;
    const at: number = ((((angle / (2 * Math.PI)) * n) % n) + n) % n;
    const k: number = Math.floor(at);
    const w: number = (1 - Math.cos(Math.PI * (at - k))) / 2;
    const t: number = ankle.radii[k]! * (1 - w) + ankle.radii[(k + 1) % n]! * w;
    return AutoMovieHumanVector.of(
      ankle.origin.x + t * sx,
      ankle.origin.y,
      ankle.origin.z + t * sz,
    );
  }
}

/** Steps sampling the meridian's straight drop from the ring. */
const DROP: number = 6;

/** Steps sampling the meridian over the dorsal surface. */
const SPREAD: number = 24;

const lerp = (
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
  t: number,
): IAutoMovieVector3 =>
  AutoMovieHumanVector.of(
    a.x + (b.x - a.x) * t,
    a.y + (b.y - a.y) * t,
    a.z + (b.z - a.z) * t,
  );

/** The point at a fraction of a polyline's length. */
const sample = (
  path: IAutoMovieVector3[],
  fraction: number,
): IAutoMovieVector3 => {
  const lengths: number[] = [0];
  for (let k: number = 1; k < path.length; ++k)
    lengths.push(
      lengths[k - 1]! + AutoMovieHumanVector.distance(path[k - 1]!, path[k]!),
    );
  const target: number = fraction * lengths[lengths.length - 1]!;
  for (let k: number = 1; k < path.length; ++k)
    if (lengths[k]! >= target)
      return lerp(
        path[k - 1]!,
        path[k]!,
        (target - lengths[k - 1]!) /
          Math.max(1e-9, lengths[k]! - lengths[k - 1]!),
      );
  return path[path.length - 1]!;
};

/** Push a point sideways by a Gaussian of its distance from a centre. */
const bump = (
  p: IAutoMovieVector3,
  centre: IAutoMovieVector3,
  radius: number,
  depth: number,
  side: number,
): IAutoMovieVector3 =>
  AutoMovieHumanVector.offset(p, [
    AutoMovieHumanVector.of(side, 0, 0),
    depth *
      Math.exp(-((AutoMovieHumanVector.distance(p, centre) / radius) ** 2)),
  ]);
