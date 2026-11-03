import type { IAutoMovieHumanParameters } from "../../../../packages/human/src/structures/IAutoMovieHumanParameters";
import { HumanAnatomy } from "./HumanAnatomy";
import { HumanAnatomyShared } from "./HumanAnatomyShared";

type V3 = HumanAnatomy.V3;
type Side = "left" | "right";
type IExtremities = NonNullable<IAutoMovieHumanParameters["extremities"]>;
type IFeet = NonNullable<IExtremities["feet"]>;
type IHands = NonNullable<IExtremities["hands"]>;
const A: typeof HumanAnatomy = HumanAnatomy;

/**
 * Mirror symmetry of one construction whose paired parts take their own
 * per-side inputs, never their average. A point of one side, reflected across
 * the median plane, is rebuilt to the other side's own inputs before it is read
 * against that side: scaled in the part's frame by the ratio of the two sides'
 * inputs over the extents those inputs define, and left where no per-side
 * input defines an extent. Equal inputs leave the plain reflection, so a
 * residual is shape the inputs do not explain.
 *
 * The part frames come from the reflected source side's own locators (heel and
 * foot axis, wrist and hand axis, knee); the scales come from the inputs alone.
 *
 * - Foot: about the heel, along the foot axis by the ratio of the foot-length
 *   inputs and across it by the ratio of the foot-breadth inputs.
 * - Hand, the arm's skin distal of the wrist joint: along the wrist-to-middle
 *   knuckle axis by the ratio of the palm-length inputs and across it, in the
 *   palm's plane, by the ratio of the hand-breadth inputs.
 * - Leg below the knee: vertically, the lateral malleolus height (`ankleHeight`)
 *   moved to the target side's input, the floor and the knee held fixed and
 *   linear between them. Shank and thigh tapes are shared inputs, so nothing
 *   else moves.
 */
export namespace HumanAnatomyMirror {
  /** A rebuilding map: a reflected point to where the target side's own inputs put it. */
  export type Rebuild = (q: V3) => V3;

  /** Mirror distance that reads as an asymmetry, mm: {@link HumanAnatomyShared.MIRROR}. */
  export const MIRROR: number = HumanAnatomyShared.MIRROR;

  /** The plain reflection across the median plane. */
  export function reflect(p: V3): V3 {
    return [p[0], p[1], -p[2]];
  }

  /** The other side. */
  export function opposite(side: Side): Side {
    return side === "left" ? "right" : "left";
  }

  /** The side a chain or bone name belongs to, if any. */
  export function sideOf(name: string): Side | null {
    return /left/i.test(name) ? "left" : /right/i.test(name) ? "right" : null;
  }

  /**
   * Scale a frame's extents: about `origin`, by `along` along the unit `axis`
   * and by `across` along the unit `lateral`, points behind `from` on the axis
   * left in place. The third direction keeps its coordinate.
   */
  export function extent(origin: V3, axis: V3, lateral: V3, along: number, across: number, from: number = -Infinity): Rebuild {
    return (q: V3): V3 => {
      const r: V3 = A.sub(q, origin);
      const u: number = A.dot(r, axis);
      if (u < from) return q;

      // The point keeps its place in the frame, scaled: its offset along and
      // across the axis grows by the ratios, the remaining direction stays.
      const w: number = A.dot(r, lateral);
      return A.add(q, A.add(A.scale(axis, (along - 1) * u), A.scale(lateral, (across - 1) * w)));
    };
  }

  /**
   * Move a height `source` to `target` with the floor (0) and `knee` held
   * fixed, linear between them; heights at or above the knee stay.
   */
  export function vertical(knee: number, source: number, target: number): Rebuild {
    return (q: V3): V3 => {
      const y: number = q[1];
      if (y >= knee || source <= 0 || source >= knee) return q;

      // Piecewise linear: the floor to the malleolus, then the malleolus to the knee.
      const to: number = y <= source ? (y * target) / source : target + ((y - source) * (knee - target)) / (knee - source);
      return [q[0], to, q[2]];
    };
  }

  /** Ratio of a side's input to the other side's, 1 when either is absent. */
  function ratio(own: number | undefined, theirs: number | undefined): number {
    return own !== undefined && theirs !== undefined && theirs > 0 ? own / theirs : 1;
  }

  /**
   * The foot map onto `side`: the other foot's reflected heel and axis as the
   * frame, the two sides' foot-length and foot-breadth inputs as the scales.
   */
  export function foot(params: IAutoMovieHumanParameters, side: Side, rear: V3, axis: V3): Rebuild {
    const feet: IFeet | undefined = params.extremities?.feet;
    const own: IFeet["left"] | undefined = feet?.[side];
    const theirs: IFeet["left"] | undefined = feet?.[opposite(side)];

    // The source foot's axis, reflected, is the frame the target's extents scale in.
    const along: V3 = A.unit([axis[0], 0, -axis[2]]);
    return extent(reflect(rear), along, [-along[2], 0, along[0]], ratio(own?.footLength, theirs?.footLength), ratio(own?.footBreadth, theirs?.footBreadth));
  }

  /**
   * The hand map onto `side`, for the arm's skin distal of the wrist joint:
   * the other side's reflected wrist, middle knuckle and thumb base as the
   * frame, the two sides' palm-length and hand-breadth inputs as the scales.
   *
   * @param joint The source side's joint centre by bone name, unreflected.
   */
  export function hand(params: IAutoMovieHumanParameters, side: Side, joint: (bone: string) => V3): Rebuild {
    const hands: IHands | undefined = params.extremities?.hands;
    const own: IHands["left"] | undefined = hands?.[side];
    const theirs: IHands["left"] | undefined = hands?.[opposite(side)];
    const other: Side = opposite(side);

    // The source hand's wrist, middle knuckle and thumb base, reflected, frame
    // the palm: its length along the wrist-to-knuckle axis, its breadth across.
    const wrist: V3 = reflect(joint(`${other}Hand`));
    const axis: V3 = A.unit(A.sub(reflect(joint(`${other}MiddleProximal`)), wrist));
    const lateral: V3 = A.unit(A.reject(A.sub(reflect(joint(`${other}ThumbMetacarpal`)), wrist), axis));
    return extent(wrist, axis, lateral, ratio(own?.palmLength, theirs?.palmLength), ratio(own?.handBreadth, theirs?.handBreadth), 0);
  }

  /**
   * The leg map onto `side`, below the knee: the lateral malleolus height of
   * the source side's input moved to the target side's, in the skin's units.
   *
   * @param knee The target side's knee joint height.
   * @param scale Skin units per input millimetre.
   */
  export function leg(params: IAutoMovieHumanParameters, side: Side, knee: number, scale: number = 1): Rebuild {
    const feet: IFeet | undefined = params.extremities?.feet;
    const own: number | undefined = feet?.[side]?.ankleHeight;
    const theirs: number | undefined = feet?.[opposite(side)]?.ankleHeight;
    if (own === undefined || theirs === undefined) return (q: V3): V3 => q;
    return vertical(knee, theirs * scale, own * scale);
  }

  /**
   * The limb maps of a person by chain: an `arm` chain's point takes the hand
   * map, a `leg` chain's the leg map, onto the side opposite its own chain;
   * any other chain is plainly reflected.
   *
   * @param joint Joint centre by bone name.
   * @param scale Skin units per input millimetre.
   */
  export function limbs(params: IAutoMovieHumanParameters, joint: (bone: string) => V3, scale: number = 1): (chain: string, q: V3) => V3 {
    const maps: Map<string, Rebuild> = new Map();

    // The map onto a side, built once: its frame needs the joints of the other side.
    const of: (kind: "arm" | "leg", side: Side) => Rebuild = (kind: "arm" | "leg", side: Side): Rebuild => {
      const key: string = `${kind}.${side}`;
      let found: Rebuild | undefined = maps.get(key);
      if (found === undefined) {
        found = (kind === "arm" ? hand(params, side, joint) : leg(params, side, joint(`${side}LowerLeg`)[1], scale));
        maps.set(key, found);
      }
      return found;
    };

    return (chain: string, q: V3): V3 => {
      const side: Side | null = sideOf(chain);
      const kind: string = chain.split(".")[0]!;
      if (side === null || (kind !== "arm" && kind !== "leg")) return q;
      return of(kind, opposite(side))(q);
    };
  }

  /**
   * The worst distance from every fourth vertex of the chains, reflected and
   * rebuilt by `map` with its own chain's name, to the nearest skin, mm.
   */
  export function offset(skin: HumanAnatomy.ISkin, chains: RegExp, map: (chain: string, q: V3) => V3): number {
    const points: V3[] = [];
    const keep: boolean[] = skin.chains.map((c: string): boolean => chains.test(c));
    const seen: Uint8Array = new Uint8Array(skin.P.length / 3);
    let count: number = 0;

    // Each vertex of the chains once, every fourth read: the distance field is
    // smooth over a few millimetres, and a defect spans many vertices.
    for (let t: number = 0; t < skin.tri.length; t++) {
      if (!keep[skin.tri[t]!]) continue;

      const chain: string = skin.chains[skin.tri[t]!]!;
      for (let k: number = 0; k < 3; k++) {
        const v: number = skin.I[3 * t + k]!;
        if (seen[v]) continue;

        seen[v] = 1;
        if (count++ % 4 === 0) points.push(map(chain, reflect(A.point(skin, v))));
      }
    }

    let worst: number = 0;
    for (const d of A.distances(skin, points, 6)) if (Number.isFinite(d)) worst = Math.max(worst, d);
    return worst;
  }
}
