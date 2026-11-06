import { AutoMovieNaturalSpline } from "@automovie/engine";
import { AutoMovieHumanSeamUnion } from "../lofting/AutoMovieHumanSeamUnion";
import type { IAutoMovieHumanHeadIdentity } from "../structures/head/IAutoMovieHumanHeadIdentity";
import type { IAutoMovieHumanHeadInputs } from "./IAutoMovieHumanHeadInputs";
import { AutoMovieHumanHeadMath } from "./AutoMovieHumanHeadMath";
import { AutoMovieHumanHeadPrior } from "./AutoMovieHumanHeadPrior";
import { AutoMovieHumanHeadNose } from "./AutoMovieHumanHeadNose";
import type { IAutoMovieHumanHeadCompiled } from "./IAutoMovieHumanHeadCompiled";
import type { IAutoMovieHumanHeadCorrections } from "./IAutoMovieHumanHeadCorrections";
import type { IAutoMovieHumanHeadEyeOpening } from "./IAutoMovieHumanHeadEyeOpening";
import type { IAutoMovieHumanHeadLayout } from "./IAutoMovieHumanHeadLayout";
import type { IAutoMovieHumanHeadNeck } from "./IAutoMovieHumanHeadNeck";

/**
 * The head's landmark skeleton. From the neck ring and the public head inputs
 * it places, by their Farkas definitions and published relations, the
 * landmarks of the midline and beside it, and the stations and sizes the other
 * pieces read (`IAutoMovieHumanHeadLayout`), before any skin exists. Public
 * Euclidean chords close in the generating landmark plan; independent
 * source-curve observers check their actual downstream points. The retired
 * radial head pass still accepts its correction record, but is not the
 * production view lane's source or calibration loop.
 */
export namespace AutoMovieHumanHeadLandmarks {
  /** Prepare a prior's curves. */
  export function compile(
    prior: AutoMovieHumanHeadPrior.IPrior = AutoMovieHumanHeadPrior.PRIOR,
  ): IAutoMovieHumanHeadCompiled {
    return {
      prior,
      profile: AutoMovieNaturalSpline.create(
        prior.face.profileKnots,
        prior.face.profile,
      ),
      dorsum: AutoMovieNaturalSpline.create(
        prior.face.profileKnots,
        prior.face.dorsum,
      ),
    };
  }

  /** No correction: the keys as the definitions place them. */
  export const NONE: IAutoMovieHumanHeadCorrections = {
    nasion: 0,
    subnasale: 0,
    lead: 1,
    zygion: 0,
    gonion: 0,
    menton: 0,
    tape: 0,
    occiput: 0,
    ala: 0,
  };

  /**
   * The person's landmarks, stations and sizes from the neck ring and the
   * inputs, before any view part, loft or skin join is constructed.
   */
  export function layout(
    compiled: IAutoMovieHumanHeadCompiled,
    inputs: Pick<IAutoMovieHumanHeadInputs, "head" | "height" | "sex" | "fat">,
    neck: IAutoMovieHumanHeadNeck,
    scale: number,
    fix: IAutoMovieHumanHeadCorrections = NONE,
  ): IAutoMovieHumanHeadLayout {
    const prior: AutoMovieHumanHeadPrior.IPrior = compiled.prior;
    const r: AutoMovieHumanHeadPrior.IRatios = prior.ratios;
    const f: AutoMovieHumanHeadPrior.IFace = prior.face;
    const p: AutoMovieHumanHeadPrior.IProfile = prior.profile;
    const fr: AutoMovieHumanHeadPrior.IFrame = prior.frame;
    const k: number = scale;
    const head: IAutoMovieHumanHeadIdentity = inputs.head;
    const y0: number = neck.level;
    const menton: number = (inputs.height - head.height) * k;
    const vertex: number = menton + head.height * k;
    const FH: number = head.faceHeight * k;
    const NH: number = head.face.nose.height * k;
    const NP: number = head.face.nose.protrusion * k;
    const L: number = head.length * k;
    const B: number = (head.length * head.cephalicIndex * k) / 100;
    // Published millimetres of the norms, at this face's size.
    const q: number = FH / p.unit;
    const centre: number = neck.x + r.forward * neck.radius;
    const gx: number = centre + L / 2;
    const nx: number = gx - p.nasion * q;
    const snx: number = gx + p.subnasale * q;
    const pgx: number = gx + p.pogonion * q;
    const fissure: number =
      ((head.face.eyePair.left.palpebralFissureHeight +
        head.face.eyePair.right.palpebralFissureHeight) *
        k) /
      2;

    // The vertical chain: the nasion stands the face height from the
    // gnathion, the chin's turn at 45 degrees between the pogonion and the
    // menton; the subnasale the nasal height under the nasion; the stomion a
    // third of the way from the subnasale to the menton.
    // Close the same two Euclidean chords algebraically. An eight-step
    // fixed point updated n after sn and left n-sn one iteration behind.
    const nasalRiseSquared: number = NH * NH - (snx - nx) ** 2;
    if (!(nasalRiseSquared > 0)) throw new Error("Head nasal height cannot span its generating sagittal endpoints");
    const nasalRise: number = Math.sqrt(nasalRiseSquared);
    const chinShare: number = (1 - Math.SQRT1_2) * p.chin * (1 - p.lip);
    const offset: number = nx - pgx;
    const rise: number = nasalRise - fix.subnasale - fix.nasion;
    const a: number = chinShare * chinShare + (1 - chinShare) ** 2;
    const b: number = 2 * (offset * chinShare + rise * (1 - chinShare));
    const c: number = offset * offset + rise * rise - FH * FH;
    const discriminant: number = b * b - 4 * a * c;
    if (!(discriminant >= 0)) throw new Error("Head face height cannot span its generating nasion and gnathion");
    const root: number = Math.sqrt(discriminant);
    const lower: number = b >= 0 ? (-2 * c) / (b + root) : (-b + root) / (2 * a);
    const sn: number = menton + lower;
    const n: number = sn + nasalRise - fix.subnasale;
    const sto: number = sn - p.lip * (sn - menton);
    const pg: number = menton + p.chin * (sto - menton);
    const eye: number = n - fissure / 2;
    const g: number = n + p.glabella * FH;

    // The pronasale: the protrusion from the subnasale, its direction closing
    // the nasal triangle whose bridge is the population's share of the
    // nasal height.
    const bridge: number = p.bridge * NH;
    const apex: number = Math.acos(
      Math.max(-1, Math.min(1, (NH * NH + NP * NP - bridge * bridge) / (2 * NH * NP))),
    );
    const up: number = Math.atan2(n - sn, nx - snx);
    const prn: P2 = [
      snx + NP * Math.cos(up - apex),
      sn + NP * Math.sin(up - apex),
    ];

    // The lips and the chin about the subnasale-pogonion line.
    const upperLip: number = head.face.mouth.upperVermilionHeight * k;
    const lowerLip: number = head.face.mouth.lowerVermilionHeight * k;
    const line = (y: number): number =>
      snx + ((pgx - snx) * (sn - y)) / Math.max(1, sn - pg);
    const ls: P2 = [line(sto + upperLip / 2) + p.lips[0]! * q, sto + upperLip / 2];
    const li: P2 = [line(sto - lowerLip / 2) + p.lips[1]! * q, sto - lowerLip / 2];
    const sl: P2 = [0, (li[1] + pg) / 2];
    sl[0] = li[0] + ((pgx - li[0]) * (li[1] - sl[1])) / (li[1] - pg) - p.sulcus * q;
    const turn: number = pg - menton;
    const contourGn: P2 = [pgx - (1 - Math.SQRT1_2) * turn, menton + (1 - Math.SQRT1_2) * turn];

    // The midline profile: the vault's ellipse about the glabella's height,
    // continued under it by its own curvature, plus a natural spline of the
    // landmarks' departures from it; nothing above the forehead.
    const top: number = vertex - g;
    const ellipse = (y: number): number => centre + (L / 2) * AutoMovieHumanHeadMath.crownShare(y, g, top);
    const base = (y: number): number => line(y);
    // `[height, forward place]` of each landmark of the profile.
    const knots: P2[] = [
      [menton, pgx - turn],
      [contourGn[1], contourGn[0]],
      [pg, pgx],
      [sl[1], sl[0]],
      [sto, base(sto)],
      [sn, snx],
      [n, nx],
      [g, gx],
      [g + 0.35 * top, ellipse(g + 0.35 * top)],
      [g + 0.7 * top, ellipse(g + 0.7 * top)],
      [vertex, ellipse(vertex)],
    ];
    const profile: AutoMovieNaturalSpline.ISpline = AutoMovieNaturalSpline.create(
      knots.map((p2: P2): number => p2[0]),
      knots.map((p2: P2): number => p2[1] - ellipse(p2[0])),
    );
    const along = (y: number): number =>
      ellipse(y) + AutoMovieNaturalSpline.evaluate(profile, y);

    // Beside the midline: the tragion the upper facial depth behind the
    // nasion at the cranial base's half width; the zygion on the arch in
    // front of it; the frontotemporale on the forehead; the gonion on the
    // mandibular plane, a fixed distance ahead of the ears' line.
    const tragionY: number = eye - fr.tragionDrop * FH;
    const half: number = (fr.base * B) / 2;
    const depth: number = Math.sqrt(
      Math.max(1, (fr.tragion * L) ** 2 - half * half - (n - tragionY) ** 2),
    );
    const tragion: P2 = [nx - depth, tragionY];
    const zygion: P2 = [tragion[0] + fr.arch * depth, eye - fr.zygion * FH];
    const frontal: P2 = [gx - fr.frontal * L, g];
    const ear: number = centre + prior.ear.forward * k;
    const goX: number = ear + prior.mandible.gonion * k;
    const plane: number =
      ((prior.mandible.plane[0]! + prior.mandible.plane[1]! * inputs.sex) * Math.PI) / 180;
    const gonion: P2 = [goX, menton + (pgx - turn - goX) * Math.tan(plane)];

    const opening = (e: PublicEye): IAutoMovieHumanHeadEyeOpening => {
      const inner: number = (head.face.intercanthalWidth * k) / 2;
      const length: number = e.palpebralFissureLength * k;
      return {
        place: inner + length / 2,
        length,
        height: e.palpebralFissureHeight * k,
        inner,
        span: length / 2,
        seat: 0,
      };
    };
    const lead: number = prn[0] - along(prn[1]);
    // The ball and the ridge meet at the tip by a soft maximum, which stands
    // out of the lead by the ridge's share there.
    const ridge: number = AutoMovieNaturalSpline.evaluate(compiled.profile, 0);
    const tipUnion: number = (ridge ** AutoMovieHumanHeadNose.NOSE + 1) ** (1 / AutoMovieHumanHeadNose.NOSE);
    const plan: IAutoMovieHumanHeadLayout = {
      scale: k,
      sex: inputs.sex,
      fat: inputs.fat,
      y0,
      neck,
      menton,
      stomion: sto,
      subnasale: sn,
      tip: prn[1],
      nasion: n,
      eye,
      vertex,
      centre,
      length: L,
      breadth: B,
      faceHeight: FH,
      faceWidth: (head.faceWidth * k) / 2 + fix.zygion,
      mandibularWidth: (head.mandibularWidth * k) / 2 + fix.gonion,
      frontalWidth: (head.minimumFrontalWidth * k) / 2,
      vault: 2,
      tape: head.circumference * k + fix.tape,
      reach: Math.sqrt(Math.max(1, L * L - (p.glabella * FH) ** 2)) - L / 2 + fix.occiput,
      noseWidth: (head.face.nose.width * k) / 2 + fix.ala,
      border: menton + fix.menton,
      noseLead: (fix.lead * Math.max(1, lead)) / tipUnion,
      mouthWidth: (head.face.mouth.width * k) / 2,
      upperLip,
      lowerLip,
      lips: [
        Math.max(0, ls[0] - along(ls[1])),
        Math.max(0, li[0] - along(li[1])),
      ],
      gap: f.gape * head.mouthOpening * k,
      joint: f.joint * head.mandibularLaterotrusion * k,
      left: opening(head.face.eyePair.left),
      right: opening(head.face.eyePair.right),
      station: AutoMovieNaturalSpline.create(
        [y0, menton, sn, eye, vertex],
        [0, 1, 2, 3, 4],
      ),
      // The nasolabial angle is the columella's rise plus the right angle less
      // the upper lip's forward lean, from the subnasale to labrale superius.
      columella:
        ((f.nasolabial[0]! + f.nasolabial[1]! * inputs.sex - 90) * Math.PI) / 180 +
        Math.atan2(ls[0] - snx, sn - ls[1]),
      // The nose's base turns into the lip over the nose's own blend width:
      // its height is the protrusion from the subnasale to the pronasale, its
      // least half extent across the base one side's alar half width, the
      // columella to the ala (a quarter of al-al). The layers follow this
      // turn (`AutoMovieHumanHeadStationDensity`), not the turn the layers.
      round: AutoMovieHumanSeamUnion.width(
        Math.hypot(prn[0] - snx, prn[1] - sn),
        ((head.face.nose.width * k) / 2 + fix.ala) / 2,
      ),
      landmarks: {
        glabella: [gx, g],
        nasion: [nx, n],
        pronasale: prn,
        subnasale: [snx, sn],
        stomion: [base(sto), sto],
        pogonion: [pgx, pg],
        menton: [pgx - turn, menton],
        gnathion: contourGn,
        tragion,
        zygion,
        frontal,
        gonion,
        occiput: n,
      },
      profile,
    };
    for (const side of ["left", "right"] as const)
      [plan[side].span, plan[side].place] = canthi(plan[side], prior.face, plan.scale);
    return plan;
  }

  /**
   * Place the selected tragion height and retained t-n norm together.
   * The base half-width is the prior's declared t-t construction; the
   * selected drop law must not replace Y after X closed a different chord.
   * Zygion retains its declared share of that same forward depth.
   *
   * @evidence contracts/common.md#principled-implementation Solves the retained three-dimensional t-n chord with the actual selected height and cranial-base half-width.
   * @evidence contracts/common.md#clear-and-simple-design One immutable layout update supplies every downstream head curve.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No reference fit, stale-height X solve or compensating offset is retained; an impossible chord throws.
   * @evidence contracts/common.md#meaningful-documentation Distinguishes the retained norm and base-width convention from an individually measured tragion.
   * @evidence contracts/performance.md#efficient-algorithms One square root and a fixed-size layout copy.
   * @evidence contracts/performance.md#reuse-equivalent-work Composer and standalone readers use this same placement operation.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the returned layout; no generated geometry or global cache is retained.
   */
  export function atTragion(plan: IAutoMovieHumanHeadLayout, height: number): IAutoMovieHumanHeadLayout {
    const frame: AutoMovieHumanHeadPrior.IFrame = AutoMovieHumanHeadPrior.PRIOR.frame;
    const squared: number = (frame.tragion * plan.length) ** 2 - (frame.base * plan.breadth / 2) ** 2 - (plan.nasion - height) ** 2;
    if (!(Number.isFinite(height) && squared > 0)) throw new Error("Selected tragion height cannot span the retained t-n norm and base width");
    const depth: number = Math.sqrt(squared);
    const x: number = plan.landmarks.nasion[0] - depth;
    return { ...plan, landmarks: { ...plan.landmarks, tragion: [x, height], zygion: [x + frame.arch * depth, plan.landmarks.zygion[1]] } };
  }
}

/**
 * The lid margin's lateral half-span that stands its canthi, the margin's
 * medial and lateral extremes, the fissure length apart in 3D, and the
 * fissure's centre that puts the medial canthus half the intercanthal width
 * off the midline: `[span, place]`.
 */
function canthi(
  o: IAutoMovieHumanHeadEyeOpening,
  face: AutoMovieHumanHeadPrior.IFace,
  scale: number,
): [number, number] {
  const series = (h: readonly number[], unit: number, t: number): number =>
    unit *
    (h[0]! * Math.cos(t) +
      h[1]! * Math.sin(t) +
      h[2]! * Math.cos(2 * t) +
      h[3]! * Math.sin(2 * t) +
      h[4]! * Math.cos(3 * t) +
      h[5]! * Math.sin(3 * t));
  let span: number = o.length / 2;
  let medial: number = -span;
  for (let pass: number = 0; pass < 4; pass++) {
    let lo: Vec3 = [0, 0, Infinity];
    let hi: Vec3 = [0, 0, -Infinity];
    for (let i: number = 0; i < 720; i++) {
      const t: number = (2 * Math.PI * i) / 720;
      const p: Vec3 = [
        series(face.margin[0]!, scale, t),
        series(face.margin[1]!, o.height / 2, t),
        series(face.margin[2]!, span, t),
      ];
      if (p[2] < lo[2]) lo = p;
      if (p[2] > hi[2]) hi = p;
    }
    const f: number = o.length / AutoMovieHumanHeadMath.dist(lo, hi);
    span *= f;
    medial = lo[2] * f;
  }
  return [span, o.inner - medial];
}

/** A point of a section. */
type P2 = [number, number];

/** The public eye. */
type PublicEye = IAutoMovieHumanHeadIdentity["face"]["eyePair"]["left"];

/** A point. */
type Vec3 = [number, number, number];
