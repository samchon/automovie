/**
 * The vocabulary an individuality trait is written in: gates over measured
 * quantities, anchors on the neutral body, a region, a coordinate, a
 * profile, displacement terms, skin points and curves for relief, and the
 * trait record that names a channel's endpoints. `individualityParameters.ts`
 * holds the rows; `generate-individuality.ts` evaluates them.
 */
/** A smooth step from 0 at `from` to 1 at `to` over a measured quantity; `from > to` steps down. */
export interface IGate {
  measure:
    | "height"
    | "absX"
    | "normalX"
    | "absNormalX"
    | "normalZ"
    | "backwardNormalZ";
  /** For `height` and `absX`, the reference the bounds are offset from. */
  anchor?: Anchor;
  from: number;
  to: number;
}

/** A point of the neutral body a parameter is measured from. */
export type Anchor =
  /** The height of the navel: the centroid of the tissue the navel endpoint moves. */
  | "navel"
  /** The left hip joint landmark. */
  | "hip"
  /** The left scapula landmark. */
  | "scapula"
  /** The left sternoclavicular landmark. */
  | "clavicle"
  /** The left shoulder joint landmark. */
  | "shoulder"
  /** The lowest thoracic spine landmark, the xiphoid's height. */
  | "xiphoid"
  /** The lumbosacral landmark at the top of the pelvis. */
  | "sacrum"
  /** The mean height of the trait's own tissue mask. */
  | "mask";

/** The tissue a trait moves: an endpoint's own falloff, or a set of gates over the surface, times more gates. */
export interface IRegion {
  /** The source endpoint whose displacement magnitude, normalized, is the tissue weight. */
  endpoint?: string;
  /** Weight below this fraction of the endpoint's largest displacement is outside the tissue. */
  floor?: number;
  /** Laplacian smoothing of the weight before use: sweeps and relaxation. */
  smooth?: { sweeps: number; relax: number };
  /** Multiplied into the weight, each a smooth step over a measured quantity. */
  gates: IGate[];
}

/** A rim selector: the rim vertices of the mask below or above a height. */
export interface IRimSelection {
  /** `below` keeps rim vertices under the height, `above` those over it; `all` keeps the rim. */
  side: "below" | "above" | "all";
  anchor?: Anchor;
  /** Height offset from the anchor (or absolute when no anchor). */
  height?: number;
  /** When `interior` is true, mask vertices (not just the rim) past the height are the seeds. */
  interior?: boolean;
}

/** The scalar coordinate a term's profile is read over. */
export type Coordinate =
  /** 0 on the lower seeds, 1 on the upper seeds, by geodesic distance ratio inside the mask. */
  | { kind: "polar"; lower: IRimSelection; upper: IRimSelection }
  /** Geodesic distance in metres from the most lateral skin point in a slab around an anchor. */
  | {
      kind: "lateralPoint";
      anchor: Anchor;
      /** Height offset of the slab centre from the anchor and its half height. */
      height: number;
      halfHeight: number;
      /** Half depth of the slab around the anchor's Z. */
      halfDepth: number;
    }
  /** The mask weight itself, for a trait shaped by the isolines of its tissue. */
  | { kind: "mask" }
  /** Height above an anchor, metres, for a band placed by anatomy. */
  | { kind: "height"; anchor: Anchor };

/** A unitless profile over a coordinate. */
export type Profile =
  | { kind: "plateau"; rise: number; fall: number }
  | { kind: "bell"; centre: number; sigma: number }
  | { kind: "step"; from: number; to: number }
  | { kind: "constant" };

/** One displacement term: a direction, an amplitude in metres, a profile over the coordinate, and gates. */
export interface ITerm {
  direction: "normal" | "up" | "down";
  amplitude: number;
  profile: Profile;
  gates?: IGate[];
}

/**
 * A point on the skin, offset from an anchor and projected onto the front
 * or back surface by its `x` and `y`, or, with a `z`, onto the nearest
 * vertex in space (a flank, where the skin faces sideways).
 */
export interface ISkinPoint {
  anchor: Anchor;
  x: number;
  y: number;
  z?: number;
  project: "front" | "back" | "nearest";
}

/** A groove or ridge along a polyline on the skin: signed amplitude (negative cuts in) with a bell of `sigma` across. */
export interface ICurveTerm {
  points: ISkinPoint[];
  sigma: number;
  amplitude: number;
  /** Extra gates on the vertices the curve reaches. */
  gates?: IGate[];
  /** Repeat the curve `count` times, each shifted by `step` (metres) before projection: a row of ribs, a chain of vertebrae. */
  repeat?: { count: number; step: [number, number, number] };
}

/**
 * Relief over a region: the curves' bells summed (clamped to one as the
 * groove field G), plus `raise` on the tissue between them, `(1 - G)`.
 */
export interface IRelief {
  curves: ICurveTerm[];
  /** Mirror every curve across X as well, for a midline trait with two sides. */
  bothSides: boolean;
  raise?: { amplitude: number; gates: IGate[] };
}

export interface IEndpointSpec {
  id: string;
  terms?: ITerm[];
  relief?: IRelief;
}

export interface ITraitSpec {
  /** Channel id; a mirrored trait gets `Left`/`Right` appended and `/l-` endpoints reflected. */
  id: string;
  group: string;
  mirrored: boolean;
  region: IRegion;
  coordinate?: Coordinate;
  positive: IEndpointSpec;
  negative?: IEndpointSpec;
}
