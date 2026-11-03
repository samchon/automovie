import { HumanAnatomy } from "./HumanAnatomy";
import { HumanAnatomyArm } from "./HumanAnatomyArm";
import { HumanAnatomyShared } from "./HumanAnatomyShared";

type V3 = HumanAnatomy.V3;
type Side = "left" | "right";
const A: typeof HumanAnatomy = HumanAnatomy;
const { band } = HumanAnatomyShared;

/**
 * The landmark locators of the course observer: points on a skin found by
 * their ISO 8559-1 and ANSUR II definitions. Each reads the skin's triangles
 * and, only to place a search window or an axis, the rig's joint centres.
 *
 * Frame: forward +X, up +Y, the body's left +Z, millimetres, floor at y = 0.
 */
export namespace HumanAnatomyCourseLandmarks {
  /** One arm's bony landmarks on the skin and its segment axes. */
  export interface IArm {
    /** Radiale: the radius' superior palpable point on its outside edge; null when the elbow shows no hollow. */
    radiale: V3 | null;

    /** Stylion: the radius' inferior point; null when the wrist's section is not closed. */
    stylion: V3 | null;

    /** The shoulder joint's centre, mm. */
    shoulder: V3;

    /** Unit axis of the upper arm, shoulder to elbow. */
    upper: V3;

    /** Unit axis of the forearm, elbow to wrist. */
    fore: V3;
  }

  /**
   * How far the radiale search runs distal of the elbow joint centre, mm: de
   * Leva 1996 Table 2 puts the elbow centre 13.9 (women) and 14.3 (men) mm
   * above radiale, so the window holds more than twice that.
   */
  export const RADIALE_REACH: number = 35;

  /**
   * Half the chord over which the elbow's lateral profile is read for its
   * hollow, mm: wide enough to span the lateral epicondyle's bump and the
   * radial head's, a geometric window rather than a published one.
   */
  export const RADIALE_CHORD: number = 6;

  /**
   * Triangles whose chain passes a test.
   *
   * @param skin The skin whose chain labels are read.
   * @param keep Whether a chain's triangles are wanted, by the chain's name.
   * @returns Triangle indices in increasing order.
   */
  export function chains(skin: HumanAnatomy.ISkin, keep: (chain: string) => boolean): Uint32Array {
    const ok: boolean[] = skin.chains.map(keep);
    const out: number[] = [];

    for (let t: number = 0; t < skin.tri.length; t++) if (ok[skin.tri[t]!]) out.push(t);
    return Uint32Array.from(out);
  }

  /**
   * Whether a triangle belongs to a triangle list, by a per-skin mask built
   * once for each list so a scan over many triangles costs one lookup each.
   *
   * @param skin The skin the list indexes.
   * @param list Triangle indices; the mask is cached on the list's identity.
   * @param t The triangle asked about.
   */
  export function member(skin: HumanAnatomy.ISkin, list: Uint32Array, t: number): boolean {
    let masks: WeakMap<Uint32Array, Uint8Array> | undefined = memberships.get(skin);
    if (masks === undefined) {
      masks = new WeakMap();
      memberships.set(skin, masks);
    }

    let mask: Uint8Array | undefined = masks.get(list);
    if (mask === undefined) {
      mask = new Uint8Array(skin.tri.length);
      for (const i of list) mask[i] = 1;
      masks.set(list, mask);
    }
    return mask[t] === 1;
  }

  /**
   * A bust point (ISO 8559-1 3.1.11): the most anterior skin of one breast.
   *
   * The trunk audit's bust level is the first forward prominence of the
   * trunk's front below the armpit. A band of 0.03 S (about 50 mm) either side
   * of it holds a breast's apex wherever its nipple-free mound peaks, a
   * geometric window rather than a published one. Within it the skin is binned
   * every 4 mm across z, out to 0.15 S from the midline, which resolves the
   * apex's lateral place to 4 mm; the apex is the most anterior bin. A
   * prominence must stand more than 1 mm, the unit anthropometry records
   * (ANSUR II measures to the nearest millimetre), proud of the midline's
   * front, so a chest that only falls away from the midline has no bust point.
   *
   * @param skin The skin read.
   * @param torso Triangles of the trunk, arms and head left out.
   * @param y Height of the bust level, mm; NaN when the trunk audit found none.
   * @param S Stature, mm, scaling the window.
   * @param sign +1 for the body's left breast, -1 for its right.
   * @returns The point, or null when the side shows no prominence.
   */
  export function bustPoint(skin: HumanAnatomy.ISkin, torso: Uint32Array, y: number, S: number, sign: 1 | -1): V3 | null {
    if (!Number.isFinite(y)) return null;

    const bins: (V3 | null)[] = new Array<V3 | null>(Math.ceil((0.15 * S) / 4)).fill(null);
    for (const t of band(skin, y - 0.03 * S, y + 0.03 * S)) {
      if (!member(skin, torso, t)) continue;

      for (let k: number = 0; k < 3; k++) {
        const p: V3 = A.point(skin, skin.I[3 * t + k]!);
        if (Math.abs(p[1] - y) > 0.03 * S) continue;

        const i: number = Math.floor((sign * p[2]) / 4);
        if (i < 0 || i >= bins.length) continue;
        if (bins[i] === null || p[0] > bins[i]![0]) bins[i] = p;
      }
    }

    let best: number = -1;
    for (let i: number = 0; i < bins.length; i++) if (bins[i] !== null && (best < 0 || bins[i]![0] > bins[best]![0])) best = i;
    if (best < 2 || bins[0] === null || bins[best]![0] - bins[0]![0] <= 1) return null;
    return bins[best]!;
  }

  /**
   * The shoulder point (ISO 8559-1 3.1.1) of one side: the acromion "projected
   * vertically to the surface of the skin". The acromion caps the
   * glenohumeral joint, so the rig's shoulder joint places the bone in the
   * horizontal plane and the highest skin within 200 mm above it, found by
   * intersecting the vertical line through the joint with every triangle in
   * barycentric coordinates, gives the point.
   *
   * @param skin The skin read.
   * @param side The body's side.
   * @returns The point, or null when no skin lies above the joint.
   */
  export function shoulderPoint(skin: HumanAnatomy.ISkin, side: Side): V3 | null {
    const joint: V3 = A.joint(skin, `${side}UpperArm`);
    const [x, z]: [number, number] = [joint[0], joint[2]];
    let top: number = -Infinity;

    for (const t of band(skin, joint[1] - 200, joint[1] + 200)) {
      const c: V3[] = [0, 1, 2].map((k: number): V3 => A.point(skin, skin.I[3 * t + k]!));

      // Twice the triangle's signed area in the (x, z) plane; a vertical
      // triangle has none and cannot be crossed by a vertical line.
      const d: number = (c[1]![0] - c[0]![0]) * (c[2]![2] - c[0]![2]) - (c[1]![2] - c[0]![2]) * (c[2]![0] - c[0]![0]);
      if (Math.abs(d) < 1e-12) continue;

      // Barycentric weights of (x, z) in the triangle; all three nonnegative
      // means the line crosses it, at the weighted height.
      const l1: number = ((c[1]![0] - x) * (c[2]![2] - z) - (c[1]![2] - z) * (c[2]![0] - x)) / d;
      const l2: number = ((c[2]![0] - x) * (c[0]![2] - z) - (c[2]![2] - z) * (c[0]![0] - x)) / d;
      const l3: number = 1 - l1 - l2;
      if (l1 < 0 || l2 < 0 || l3 < 0) continue;

      const y: number = l1 * c[0]![1] + l2 * c[1]![1] + l3 * c[2]![1];
      if (y <= joint[1] + 200) top = Math.max(top, y);
    }
    return Number.isFinite(top) ? [x, top, z] : null;
  }

  /**
   * The front (+1) or back (-1) of a sagittal profile at a height: the most
   * anterior crossing in front of the spine line or the most posterior
   * crossing behind it.
   *
   * @param lines Polylines of a median section, mm.
   * @param y Height, mm.
   * @param spine The spine line's x at that height, mm.
   * @param sign +1 for the front, -1 for the back.
   * @returns The crossing's x, or NaN when the profile holds none.
   */
  export function profile(lines: { points: V3[] }[], y: number, spine: number, sign: 1 | -1): number {
    let out: number = NaN;

    for (const l of lines)
      for (let i: number = 0; i + 1 < l.points.length; i++) {
        const a: V3 = l.points[i]!;
        const b: V3 = l.points[i + 1]!;
        if (a[1] >= y === b[1] >= y) continue;

        // The segment's x where it crosses the height, by linear interpolation.
        const x: number = a[0] + ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]);
        if (sign * (x - spine) <= 0) continue;
        if (Number.isNaN(out) || sign * x > sign * out) out = x;
      }
    return out;
  }

  /**
   * An arm's radiale and stylion.
   *
   * Radiale, the radial head's superior palpable point on its outside edge,
   * lies on the skin in the hollow just distal of the lateral epicondyle,
   * where the epicondyle's bump gives way to the radial head. Along the
   * forearm's axis from the elbow joint centre to 35 mm distal, every
   * millimetre, the section normal to the axis is read for its furthest reach
   * away from the body; radiale is the skin point of the station whose reach
   * lies deepest inside the chord of its neighbours 6 mm either side. A
   * profile whose deepest station is at the window's end is still falling
   * there and holds no hollow, so it has no radiale. The joint only places
   * the search window and the axis.
   *
   * Stylion, the radius' inferior point, stands 1.5 mm proximal of the wrist
   * centre (de Leva 1996), at the section's furthest reach toward the thumb.
   *
   * @param skin The skin read, with its rig's joints.
   * @param side The body's side.
   */
  export function arm(skin: HumanAnatomy.ISkin, side: Side): IArm {
    const shoulder: V3 = A.joint(skin, `${side}UpperArm`);
    const elbow: V3 = A.joint(skin, `${side}LowerArm`);
    const wrist: V3 = A.joint(skin, `${side}Hand`);
    const thumb: V3 = A.joint(skin, `${side}ThumbMetacarpal`);
    const upper: V3 = A.unit(A.sub(elbow, shoulder));
    const fore: V3 = A.unit(A.sub(wrist, elbow));
    const region: Uint32Array = HumanAnatomyArm.limb(skin, [shoulder, elbow, wrist]);

    // The skin point of a section that reaches furthest along a direction.
    const reach: (o: V3, n: V3, d: V3) => V3 | null = (o: V3, n: V3, d: V3): V3 | null => {
      const c: HumanAnatomy.ICut | null = A.cut(skin, o, n, o, region);
      if (c === null || !c.contained) return null;
      return c.points.reduce((a: V3, b: V3): V3 => (A.dot(A.sub(b, o), d) > A.dot(A.sub(a, o), d) ? b : a));
    };

    // The lateral sections along the forearm from just proximal of the elbow
    // centre, so the first station's chord has its proximal neighbour. Lateral
    // is away from the body's median plane, taken square to the forearm.
    const away: V3 = A.unit(A.reject([0, 0, side === "left" ? 1 : -1], fore));
    const lateral: (V3 | null)[] = [];
    for (let s: number = -RADIALE_CHORD; s <= RADIALE_REACH + RADIALE_CHORD; s += 1) lateral.push(reach(A.add(elbow, A.scale(fore, s)), fore, away));

    // Lateral reach of a station from the elbow centre, mm along `away`.
    const out: (k: number) => number = (k: number): number => {
      const p: V3 | null = lateral[k]!;
      return p === null ? NaN : A.dot(A.sub(p, elbow), away);
    };

    // The hollow: the station lying deepest inside its neighbours' chord.
    const first: number = RADIALE_CHORD;
    const last: number = lateral.length - 1 - RADIALE_CHORD;
    let radiale: V3 | null = null;
    let deepest: number = 0;
    let at: number = -1;
    for (let k: number = first; k <= last; k++) {
      const sag: number = (out(k - RADIALE_CHORD) + out(k + RADIALE_CHORD)) / 2 - out(k);
      if (sag > deepest) {
        deepest = sag;
        radiale = lateral[k]!;
        at = k;
      }
    }
    if (at === first || at === last) radiale = null;

    // Stylion: toward the thumb, at 1.5 mm proximal of the wrist centre.
    const stylionAt: V3 = A.sub(wrist, A.scale(fore, 1.5));
    const radial: V3 = A.unit(A.reject(A.sub(thumb, wrist), fore));
    return { radiale, stylion: reach(stylionAt, fore, radial), shoulder, upper, fore };
  }
}

/** Triangle masks of each skin's triangle lists, built once per list. */
const memberships: WeakMap<HumanAnatomy.ISkin, WeakMap<Uint32Array, Uint8Array>> = new WeakMap();
