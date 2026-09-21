/**
 * The individuality channels as numeric parameters, nothing else: which
 * tissue each trait moves, the coordinate it is shaped over, and the terms
 * that displace it. `generate-individuality.ts` is a field engine that
 * evaluates these rows; a trait is added or tuned here, never in code.
 *
 * Lengths are metres in the shared body frame (+X left, +Y up, +Z forward),
 * coordinates are unitless in [0, 1], normals are unit. The clinical scales
 * each row encodes are pinned in `.wiki/04-domain-research/anatomy.md`.
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

/** How each anchor is read off the basis: a landmark, or the mean height of an endpoint's tissue. */
export const ANCHORS: Record<
  Exclude<Anchor, "mask">,
  { landmark: string } | { endpoint: string; floor: number }
> = {
  navel: { endpoint: "stomach/stomach-navel-in", floor: 0.2 },
  hip: { landmark: "joint-l-upper-leg" },
  scapula: { landmark: "joint-l-scapula" },
  clavicle: { landmark: "joint-l-clavicle" },
  shoulder: { landmark: "joint-l-shoulder" },
  xiphoid: { landmark: "joint-spine-2" },
  sacrum: { landmark: "joint-spine-4" },
};

/** The channel ids the traits publish, mirrored pairs expanded. */
export const traitChannelIds = (): string[] =>
  TRAITS.flatMap((trait) =>
    trait.mirrored ? [`${trait.id}Left`, `${trait.id}Right`] : [trait.id],
  );

/** The clinical anchors of the buttock's polar coordinate: crease at 0, waist at 1. */
const BUTTOCK_POLAR: Coordinate = {
  kind: "polar",
  lower: { side: "below" },
  upper: { side: "above" },
};

/** The bone relief of a lean body, each ridge a curve on the skin over the bone it follows. */
const SKELETON: ICurveTerm[] = [
  // the clavicle from the sternoclavicular joint to the acromion
  {
    points: [
      { anchor: "clavicle", x: 0, y: 0.008, project: "front" },
      { anchor: "shoulder", x: -0.04, y: 0.012, project: "front" },
      { anchor: "shoulder", x: -0.005, y: 0.012, project: "front" },
    ],
    sigma: 0.008,
    amplitude: 0.004,
  },
  // the costal margin from the xiphoid down and out
  {
    points: [
      { anchor: "xiphoid", x: 0, y: 0.03, project: "front" },
      { anchor: "xiphoid", x: 0.06, y: -0.005, project: "front" },
      { anchor: "xiphoid", x: 0.11, y: -0.045, project: "front" },
    ],
    sigma: 0.008,
    amplitude: 0.0035,
  },
  // four ribs round the flank above the margin, sloping down toward the
  // front as ribs do, a rib's spacing apart
  {
    points: [
      { anchor: "xiphoid", x: 0.12, y: 0.01, z: -0.06, project: "nearest" },
      { anchor: "xiphoid", x: 0.15, y: -0.01, z: 0.01, project: "nearest" },
      { anchor: "xiphoid", x: 0.11, y: -0.035, z: 0.07, project: "nearest" },
    ],
    sigma: 0.006,
    amplitude: 0.003,
    repeat: { count: 4, step: [0, 0.026, 0] },
  },
  // the iliac crest from the anterior to the posterior superior spine
  {
    points: [
      { anchor: "hip", x: 0.01, y: 0.1, z: 0.09, project: "nearest" },
      { anchor: "hip", x: 0.05, y: 0.13, z: 0.0, project: "nearest" },
      { anchor: "hip", x: -0.05, y: 0.1, z: -0.09, project: "nearest" },
    ],
    sigma: 0.009,
    amplitude: 0.005,
  },
  // the spinous processes from the sacrum up to the neck
  {
    points: [{ anchor: "sacrum", x: 0, y: 0, project: "back" }],
    sigma: 0.007,
    amplitude: 0.0025,
    repeat: { count: 15, step: [0, 0.027, 0] },
  },
];

export const TRAITS: ITraitSpec[] = [
  {
    // Gonzalez 2006: the inferior pole descends over the infragluteal crease
    // and heaps above it while the superior pole flattens; the lift inverts it.
    id: "buttocksPtosis",
    group: "buttocks",
    mirrored: false,
    region: {
      endpoint: "buttocks/buttocks-volume-incr",
      floor: 0.2,
      // the intergluteal cleft is held: two medial faces carried down
      // together cross each other at the sacrum
      gates: [
        { measure: "normalZ", from: 0.2, to: -0.2 },
        { measure: "absX", from: 0.012, to: 0.04 },
      ],
    },
    coordinate: BUTTOCK_POLAR,
    positive: {
      id: "buttocks/buttocks-ptosis-incr",
      terms: [
        {
          direction: "down",
          amplitude: 0.012,
          profile: { kind: "plateau", rise: 0.45, fall: 0.6 },
        },
        {
          direction: "normal",
          amplitude: 0.008,
          profile: { kind: "bell", centre: 0.3, sigma: 0.15 },
        },
        {
          direction: "normal",
          amplitude: -0.004,
          profile: { kind: "bell", centre: 0.75, sigma: 0.2 },
        },
      ],
    },
    negative: {
      id: "buttocks/buttocks-ptosis-decr",
      terms: [
        {
          direction: "up",
          amplitude: 0.012,
          profile: { kind: "plateau", rise: 0.3, fall: 0.55 },
        },
        {
          direction: "normal",
          amplitude: 0.008,
          profile: { kind: "bell", centre: 0.7, sigma: 0.2 },
        },
        {
          direction: "normal",
          amplitude: -0.003,
          profile: { kind: "bell", centre: 0.2, sigma: 0.18 },
        },
      ],
    },
  },
  {
    // Igwe grade I: the apron reaches the pubic hairline. The front of the
    // lower abdomen from the navel to the hip joints' height, between the
    // anterior iliac spines, carried forward and down over a fixed pubic edge.
    id: "stomachOverhang",
    group: "stomach",
    mirrored: false,
    region: {
      gates: [
        { measure: "height", anchor: "navel", from: 0.05, to: 0.01 },
        { measure: "height", anchor: "hip", from: -0.015, to: 0.01 },
        { measure: "absX", from: 0.12, to: 0.06 },
        { measure: "normalZ", from: 0.1, to: 0.5 },
      ],
    },
    coordinate: {
      kind: "polar",
      lower: { side: "below", anchor: "hip", height: 0.03 },
      upper: { side: "above", anchor: "navel", height: -0.005, interior: true },
    },
    positive: {
      id: "stomach/stomach-overhang-incr",
      terms: [
        {
          direction: "down",
          amplitude: 0.01,
          profile: { kind: "plateau", rise: 0.35, fall: 0.6 },
        },
        {
          direction: "normal",
          amplitude: 0.02,
          profile: { kind: "plateau", rise: 0.35, fall: 0.6 },
        },
      ],
    },
  },
  {
    // Android fat at the flanks (WHO waist-to-hip): the tissue the waist
    // circumference grows, on its lateral faces, in a band under the waist.
    id: "flankFat",
    group: "torso",
    mirrored: false,
    region: {
      endpoint: "torso/measure-waist-circ-incr",
      floor: 0.15,
      gates: [{ measure: "absNormalX", from: 0.3, to: 0.8 }],
    },
    coordinate: { kind: "height", anchor: "mask" },
    positive: {
      id: "torso/flank-fat-incr",
      terms: [
        {
          direction: "normal",
          amplitude: 0.02,
          profile: { kind: "bell", centre: -0.01, sigma: 0.045 },
        },
        {
          direction: "down",
          amplitude: 0.004,
          profile: { kind: "bell", centre: -0.01, sigma: 0.045 },
        },
      ],
    },
  },
  {
    // Gynoid fat on the outer thigh (the saddlebag): the tissue the upper
    // leg fat grows, on its lateral face, a hand below the hip joint.
    id: "outerThighFat",
    group: "legs",
    mirrored: true,
    region: {
      endpoint: "legs/l-upperleg-fat-incr",
      floor: 0.15,
      gates: [{ measure: "normalX", from: 0.3, to: 0.8 }],
    },
    coordinate: { kind: "height", anchor: "hip" },
    positive: {
      id: "legs/l-outer-thigh-fat-incr",
      terms: [
        {
          direction: "normal",
          amplitude: 0.02,
          profile: { kind: "bell", centre: -0.12, sigma: 0.06 },
        },
        {
          direction: "down",
          amplitude: 0.004,
          profile: { kind: "bell", centre: -0.12, sigma: 0.06 },
        },
      ],
    },
  },
  {
    // The trochanteric hollow between the iliac crest and the greater
    // trochanter, deepened or filled around the most lateral skin point a
    // little above the hip joint.
    id: "hipDip",
    group: "hip",
    mirrored: true,
    region: { gates: [] },
    coordinate: {
      kind: "lateralPoint",
      anchor: "hip",
      height: 0.03,
      halfHeight: 0.015,
      halfDepth: 0.04,
    },
    positive: {
      id: "hip/l-hip-dip-incr",
      terms: [
        {
          direction: "normal",
          amplitude: -0.015,
          profile: { kind: "bell", centre: 0, sigma: 0.05 },
        },
      ],
    },
    negative: {
      id: "hip/l-hip-dip-decr",
      terms: [
        {
          direction: "normal",
          amplitude: 0.012,
          profile: { kind: "bell", centre: 0, sigma: 0.05 },
        },
      ],
    },
  },
  {
    // Rectus abdominis: the linea alba, three tendinous intersections (at
    // the navel, halfway and at the xiphoid) and the linea semilunaris cut
    // into the front of the abdomen, the blocks between them raised.
    id: "absDefinition",
    group: "stomach",
    mirrored: false,
    region: {
      gates: [
        { measure: "absX", from: 0.1, to: 0.08 },
        { measure: "height", anchor: "navel", from: -0.09, to: -0.06 },
        { measure: "height", anchor: "navel", from: 0.21, to: 0.17 },
        { measure: "normalZ", from: 0.3, to: 0.6 },
      ],
    },
    positive: {
      id: "stomach/abs-definition-incr",
      relief: {
        bothSides: false,
        curves: [
          {
            points: [
              { anchor: "navel", x: 0, y: -0.04, project: "front" },
              { anchor: "navel", x: 0, y: 0.19, project: "front" },
            ],
            sigma: 0.006,
            amplitude: -0.005,
          },
          {
            points: [
              { anchor: "navel", x: -0.06, y: 0.015, project: "front" },
              { anchor: "navel", x: 0.06, y: 0.015, project: "front" },
            ],
            sigma: 0.006,
            amplitude: -0.005,
          },
          {
            points: [
              { anchor: "navel", x: -0.06, y: 0.075, project: "front" },
              { anchor: "navel", x: 0.06, y: 0.075, project: "front" },
            ],
            sigma: 0.006,
            amplitude: -0.005,
          },
          {
            points: [
              { anchor: "navel", x: -0.06, y: 0.135, project: "front" },
              { anchor: "navel", x: 0.06, y: 0.135, project: "front" },
            ],
            sigma: 0.006,
            amplitude: -0.005,
          },
          {
            points: [
              { anchor: "navel", x: 0.07, y: -0.06, project: "front" },
              { anchor: "navel", x: 0.07, y: 0.19, project: "front" },
            ],
            sigma: 0.007,
            amplitude: -0.005,
          },
          {
            points: [
              { anchor: "navel", x: -0.07, y: -0.06, project: "front" },
              { anchor: "navel", x: -0.07, y: 0.19, project: "front" },
            ],
            sigma: 0.007,
            amplitude: -0.005,
          },
        ],
        raise: {
          amplitude: 0.003,
          gates: [{ measure: "absX", from: 0.075, to: 0.06 }],
        },
      },
    },
  },
  {
    // Deltoid definition: the belly raised and the border cut, read off the
    // isolines of the shoulder muscle endpoint over the deltoid's attachment.
    id: "deltoidDefinition",
    group: "arms",
    mirrored: true,
    region: {
      endpoint: "arms/l-upperarm-shoulder-muscle-incr",
      floor: 0.1,
      smooth: { sweeps: 3, relax: 0.5 },
      gates: [],
    },
    coordinate: { kind: "mask" },
    positive: {
      id: "arms/l-deltoid-definition-incr",
      terms: [
        {
          direction: "normal",
          amplitude: -0.008,
          profile: { kind: "bell", centre: 0.5, sigma: 0.2 },
        },
        {
          direction: "normal",
          amplitude: 0.003,
          profile: { kind: "step", from: 0.6, to: 1 },
        },
      ],
    },
  },
  {
    // Scapular definition: the medial border and inferior angle raised as a
    // ridge with a groove medial to it, on both sides of the back.
    id: "scapularDefinition",
    group: "torso",
    mirrored: false,
    region: { gates: [{ measure: "backwardNormalZ", from: 0.3, to: 0.7 }] },
    positive: {
      id: "torso/scapular-definition-incr",
      relief: {
        bothSides: true,
        curves: [
          {
            points: [
              { anchor: "scapula", x: -0.025, y: -0.05, project: "back" },
              { anchor: "scapula", x: -0.015, y: -0.17, project: "back" },
            ],
            sigma: 0.01,
            amplitude: 0.0055,
          },
          {
            points: [
              { anchor: "scapula", x: -0.015, y: -0.17, project: "back" },
            ],
            sigma: 0.015,
            amplitude: 0.003,
          },
          {
            points: [
              { anchor: "scapula", x: -0.045, y: -0.05, project: "back" },
              { anchor: "scapula", x: -0.035, y: -0.17, project: "back" },
            ],
            sigma: 0.01,
            amplitude: -0.0035,
          },
        ],
      },
    },
  },
  {
    // The skeleton showing through a lean body: clavicles, costal margin
    // and ribs, iliac crests and the spinous processes as ridges, on both
    // sides; the essential-fat band is where these read on a real body.
    id: "skeletalProminence",
    group: "torso",
    mirrored: false,
    region: { gates: [] },
    positive: {
      id: "torso/skeletal-prominence-incr",
      relief: { bothSides: true, curves: SKELETON },
    },
  },
];
