import { IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieHumanRingShape } from "../../junction/IAutoMovieHumanRingShape";
import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { AUTOMOVIE_HUMAN_TRUNK_LOOPS } from "./AUTOMOVIE_HUMAN_TRUNK_LOOPS";
import { IAutoMovieHumanTrunkFrame } from "./IAutoMovieHumanTrunkFrame";
import { profileAutoMovieHumanTrunk } from "./profileAutoMovieHumanTrunk";

/**
 * Cage radius over limit-surface radius of a regular ring of eight: the cubic B-spline through eight points on a circle of radius R passes at (4 + 2 cos 45°) / 6 of R from the centre, so a surface radius r needs a cage radius r / 0.902.
 */
const EIGHT_SPAN_LIMIT: number = (4 + 2 * Math.cos(Math.PI / 4)) / 6;

/**
 * Arm stub rings outward from the shoulder as fractions of acromion-radiale length beyond the acromion, with each ring's radii over the mid upper arm radius toward the front, below, behind and above. The first ring caps the humeral head under the deltoid, which rises above the acromion in the abducted arm; the second is the deltoid belly, the third where the deltoid narrows to its insertion. The deltoid's front, back and top scale with its measured bulk, half the difference of bideltoid and biacromial breadth. Conventional, judged on renders against Richer's plates of the shoulder (1890, "Anatomie artistique").
 */
const ARM_RINGS: Array<{
  out: number;
  rise: number;
  radii: [number, number, number, number];
}> = [
  { out: 0.02, rise: 0.02, radii: [1.24, 0.92, 1.22, 0] },
  { out: 0.15, rise: 0.015, radii: [1.17, 0.99, 1.15, 1.13] },
  { out: 0.31, rise: 0.004, radii: [1.04, 1.0, 1.04, 0.98] },
];

/**
 * Soft tissue lateral to the acromion over biacromial breadth in the mean adult: half of bideltoid less biacromial breadth is 42.5 mm on a 365.3 mm biacromial breadth in ANSUR II women and 47.4 mm on 415.7 mm in men (Gordon et al. 2014, NATICK/TR-15/007), 0.116 and 0.114. The stub's ring radii are set for this ratio and scale with the person's own. Grade: measured.
 */
const DELTOID_PER_BIACROMIAL: number = 0.115;

/**
 * Place the shoulder of one side: the arm opening on the torso, the top edge along the clavicle and the upper trapezius, the trapezius crest, and the arm stub out to mid upper arm.
 *
 * The opening's eight slots, in the arm ring's layout order, are the deltopectoral groove (front), the anterior axillary fold's root on the chest wall, the armpit's apex, the posterior fold's root, the back of the shoulder over the scapula, the back and top of the acromion and the front of the acromioclavicular joint. The axillary folds' roots are the two extraordinary vertices of the opening, where the pectoral and the latissimus diverge from the chest wall into the arm. The top edge runs along the clavicle, convex forward in its medial part and concave in its lateral third (Gray 1918), and behind it along the upper border of the trapezius from cervicale to the acromion; the crest between them rises from the side of the neck and dips to the acromion, raised by the trapezius' bulk.
 *
 * The stub's rings are perpendicular to the arm, their radii from the measured mid upper arm girth, the deltoid sized from the bideltoid breadth; the last ring is the `upperArm` cut on the site's shared ring shape.
 *
 * @param frame The side's trunk frame, left frame
 * @param profile The side's continuous body
 * @param loops Left half torso loops, modified in place at the shoulder slots
 * @param neck The neck base ring in layout order, model frame
 * @param layout The shared ring shape at this side's mid upper arm
 * @param sign 1 for the left side, -1 for the right
 * @returns The trapezius crest (c = 2, 3, 4) in the left frame, and the stub rings: three in the left frame in the left ring order, then the cut on the shared shape in the model frame
 */
export function placeAutoMovieHumanTrunkShoulder(
  frame: IAutoMovieHumanTrunkFrame,
  profile: profileAutoMovieHumanTrunk.IProfile,
  loops: IAutoMovieVector3[][],
  neck: IAutoMovieVector3[],
  layout: IAutoMovieHumanRingShape,
  sign: number,
): placeAutoMovieHumanTrunkShoulder.IOutput {
  const V: typeof AutoMovieHumanVector = AutoMovieHumanVector;
  const S: number = frame.stature;
  const A: IAutoMovieVector3 = frame.acromion;
  const G: IAutoMovieVector3 = frame.shoulder;
  const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
  const ax: number = frame.levels.axilla;
  const axillaHalf: number = profile.half(ax);
  const left = (p: IAutoMovieVector3): IAutoMovieVector3 =>
    V.of(sign * p.x, p.y, p.z);
  // the axilla, mid shoulder and top loops
  const [AX, MID, TOP]: number[] = [3, 2, 1].map(
    (k: number): number => AUTOMOVIE_HUMAN_TRUNK_LOOPS - k,
  );

  // the opening
  // slots between the chest wall under the arm (0) and the acromion (1)
  const reach: number = Math.max(A.x - axillaHalf, 0.03 * S);
  const across = (t: number): number => A.x - (1 - t) * reach;
  loops[TOP]![6] = V.of(across(0.88), A.y + 0.004 * S, A.z - 0.004 * S);
  loops[TOP]![5] = V.of(across(0.7), A.y - 0.003 * S, A.z + 0.022 * S);
  loops[TOP]![7] = V.of(across(0.66), A.y - 0.004 * S, A.z - 0.028 * S);
  loops[MID]![5] = V.of(
    across(0.5),
    G.y - 0.01 * S,
    lerp(profile.front(G.y), A.z, 0.25),
  );
  loops[MID]![7] = V.of(
    across(0.46),
    G.y - 0.014 * S,
    lerp(profile.back(G.y), A.z, 0.2),
  );
  loops[AX]![5] = V.of(
    across(0.06),
    lerp(ax, G.y, 0.25),
    lerp(profile.widest(ax), profile.front(ax), 0.5),
  );
  loops[AX]![6] = V.of(
    across(0.3),
    lerp(ax, G.y, 0.5),
    profile.widest(ax) - 0.004 * S,
  );
  loops[AX]![7] = V.of(
    across(0.06),
    lerp(ax, G.y, 0.1),
    lerp(profile.widest(ax), profile.back(ax), 0.55),
  );

  // the clavicle, its medial part convex forward
  const cl: IAutoMovieVector3 = frame.clavicale;
  const skin: number = 0.004 * S + 0.06 * Math.max(0, frame.fat - 12);
  for (const [j, t] of [
    [3, 0.3],
    [4, 0.62],
  ] as const) {
    const bulge: number =
      Math.sin(Math.PI * t) * 0.008 * S * (t < 0.5 ? 1 : 0.3);
    loops[TOP]![j] = V.of(
      lerp(cl.x, A.x, t),
      lerp(cl.y, A.y, t) + skin + 0.003 * S,
      lerp(cl.z, A.z, t) + bulge + skin + 0.006 * S,
    );
  }
  // the back edge: the trapezius rounding over just below and behind its crest
  const c7: IAutoMovieVector3 = frame.cervicale;
  for (const [j, t] of [
    [9, 0.4],
    [8, 0.72],
  ] as const)
    loops[TOP]![j] = V.of(
      lerp(0.03 * S, A.x - 0.03 * S, t),
      lerp(c7.y - 0.012 * S, A.y - 0.008 * S, Math.pow(t, 1.3)),
      lerp(c7.z - 0.004 * S, A.z - 0.04 * S, Math.pow(t, 0.8)) -
        0.01 * S * Math.sin(Math.PI * t),
    );
  // the neck base ring's slots of this side
  const ring = (k: number): IAutoMovieVector3 =>
    left(neck[sign > 0 ? k : (12 - k) % 12]!);
  loops[TOP]![0] = ring(0);
  loops[TOP]![1] = ring(1);
  loops[TOP]![2] = ring(2);
  loops[TOP]![10] = ring(4);
  loops[TOP]![11] = ring(5);
  loops[TOP]![12] = ring(6);

  // the trapezius crest from the side of the neck to the acromion
  const side: IAutoMovieVector3 = ring(3);
  const crest: IAutoMovieVector3[] = [side];
  for (const t of [0.36, 0.7])
    crest.push(
      V.of(
        lerp(side.x, A.x - 0.006 * S, t),
        lerp(side.y, A.y + 0.004 * S, Math.pow(t, 1.3)) +
          0.003 * S * Math.sin(Math.PI * t) * frame.muscle,
        lerp(side.z, A.z - 0.006 * S, t) - 0.004 * S,
      ),
    );

  // the arm stub, layout order of the left arm: front, then down, back and up
  const radius: number = frame.armGirth / (2 * Math.PI);
  // the deltoid's measured bulk over its value for the mean shoulder, the stub's rings scale with it
  const deltoid: number = Math.min(
    1.6,
    Math.max(
      0.7,
      frame.deltoid / (DELTOID_PER_BIACROMIAL * (2 * frame.acromion.x)),
    ),
  );
  const top: number = A.y + 0.01 * S * deltoid - G.y;
  const rings: IAutoMovieVector3[][] = ARM_RINGS.map(({ out, rise, radii }) => {
    const x: number = A.x + out * frame.upperArmLength;
    const cy: number = G.y + rise * frame.upperArmLength;
    const [front, below, behind, above] = radii;
    const r: [number, number, number, number] = [
      (radius * front * deltoid) / EIGHT_SPAN_LIMIT,
      (radius * below) / EIGHT_SPAN_LIMIT,
      (radius * behind * deltoid) / EIGHT_SPAN_LIMIT,
      (above === 0 ? top : radius * above * deltoid) / EIGHT_SPAN_LIMIT,
    ];
    return Array.from(
      { length: 8 },
      (_: unknown, k: number): IAutoMovieVector3 => {
        const angle: number = (k / 8) * 2 * Math.PI;
        const dz: number = Math.cos(angle);
        const dy: number = -Math.sin(angle);
        return V.of(
          x,
          cy + dy * (dy <= 0 ? r[1] : r[3]),
          G.z + dz * (dz >= 0 ? r[0] : r[2]),
        );
      },
    );
  });
  const cut: IAutoMovieVector3[] = layout.positions;
  return { crest, rings, cut };
}
/** Output type of {@link placeAutoMovieHumanTrunkShoulder}. */
export namespace placeAutoMovieHumanTrunkShoulder {
  /**
   * The shoulder's points beyond the torso loops.
   *
   * @author Samchon
   */
  export interface IOutput {
    /** Trapezius crest at c = 2 (the neck ring's side), 3 and 4, left frame. */
    crest: IAutoMovieVector3[];

    /** Stub rings outward from the opening, left frame, the left arm's ring order. */
    rings: IAutoMovieVector3[][];

    /** The `upperArm` cut on the shared shape, layout order, model frame. */
    cut: IAutoMovieVector3[];
  }
}
