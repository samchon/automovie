import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanIdentity } from "../../structures/IAutoMovieHumanIdentity";
import { AUTOMOVIE_HUMAN_FACIAL_TISSUE } from "./AUTOMOVIE_HUMAN_FACIAL_TISSUE";
import { frameAutoMovieHumanHead } from "./frameAutoMovieHumanHead";
import { profileAutoMovieHumanHead } from "./profileAutoMovieHumanHead";

/**
 * The features' gross forms over the lofted block-out: how far each point of a section moves along its direction from the spine, in the head frame.
 *
 * - Nose: a ridge from nasion to the tip and an underside back to subnasale, its height over the profile's base the dorsum's rise to pronasale, which stands the measured nasal protrusion in front of subnasale; its half-breadth grows from the bridge to the alae, whose lobes flank the tip at the measured nose width.
 * - Lips: the upper and lower vermilion's forward roll over the base, each centred on its measured height and as wide as the mouth.
 * - Orbits: inside the orbital opening the surface settles onto a dome about the eye's centre of rotation, the globe's radius plus the lids' thickness, so the lids rest on the eyeball and the socket recedes round it; above it the superciliary arch rises.
 * - Soft tissue: every term the skeleton or a muscle makes reaches the skin through the soft tissue over its site, whose depth follows body fat between the measured depths of lean and overweight young adults ({@link AUTOMOVIE_HUMAN_FACIAL_TISSUE}); the term is blurred over that depth and its height falls accordingly, so a full face hides the brow, the zygoma, the orbit's hollow and the masseter that a lean one shows. Their own prominence follows lean mass.
 * - Masses on the side of the face: the zygoma's body under the outer orbit and its arch running back to the ear above tragion; the temporal hollow above the arch behind the orbital rim, filled by fat; the masseter from the arch down to the mandible's angle, fuller with lean mass; and the buccal fat in front of it, fuller with body fat and in a child's small face under a large vault.
 *
 * @param props The head frame, the feature measurements and the guides
 * @returns The displacement in millimetres of a head-frame point along its section's direction, outward positive
 */
export function reliefAutoMovieHumanHead(props: {
  frame: frameAutoMovieHumanHead.IFrame;
  head: IAutoMovieHumanIdentity.IHead;
  composition: IAutoMovieHumanIdentity.IComposition;
  profile: profileAutoMovieHumanHead.IProfile;
}): (p: IAutoMovieVector3) => number {
  const { frame, head, profile } = props;
  const f: IAutoMovieHumanIdentity.IFeatures = head.features;
  const fh: number = head.faceHeight;

  // the body's fat and lean, which set the soft tissue's depth and the prominence of the bones and muscles under it
  const fat: number = Math.min(1, Math.max(0, (props.composition.bodyFatPercentage - FAT.lean) / (FAT.full - FAT.lean)));
  const lean: number = Math.min(1, Math.max(0, (props.composition.appendicularLeanMassIndex - LEAN.low) / (LEAN.high - LEAN.low)));

  // nose
  const yNasion: number = frame.nasion.y;
  const ySub: number = profile.subnasale.y;
  const yTip: number = ySub + TIP_ABOVE_SUBNASALE * f.noseHeight;
  const rise: number = yTip - ySub;
  const zTip: number = profile.subnasale.z + Math.sqrt(Math.max(0, f.noseProtrusion ** 2 - rise * rise));
  const tipShare: number = (yNasion - yTip) / (yNasion - ySub);
  const dorsum = (y: number): number => {
    const t: number = Math.min(1, Math.max(0, (yNasion - y) / (yNasion - yTip)));
    return frame.nasion.z + (zTip - frame.nasion.z) * Math.pow(t, DORSUM_CURVE);
  };
  const tipHeight: number = zTip - profile.front(yTip);
  const nose = (x: number, y: number): number => {
    if (y > yNasion || y < ySub) return 0;
    const s: number = (yNasion - y) / (yNasion - ySub);
    const height: number =
      s <= tipShare
        ? Math.max(0, dorsum(y) - profile.front(y))
        : tipHeight * Math.sqrt(Math.max(0, 1 - ((s - tipShare) / (1 - tipShare)) ** 2));
    const half: number = f.noseWidth * lerp(BRIDGE, ALA, smooth(0, tipShare, s));
    const t: number = Math.abs(x) / half;
    const ridge: number = t >= 1 ? 0 : height * Math.pow(1 - t * t, lerp(1.6, 1.0, smooth(0, tipShare, s)));
    // the alar lobes beside the tip, low on the nose
    const ala: number =
      ALA_HEIGHT *
      tipHeight *
      Math.exp(-(((Math.abs(x) - ALA_OFFSET * f.noseWidth) / (ALA_SPREAD * f.noseWidth)) ** 2)) *
      Math.exp(-(((s - (1 + tipShare) / 2) / ALA_DEPTH) ** 2));
    return Math.max(ridge, ala);
  };

  // lips
  const mouth: number = f.mouthWidth / 2;
  const lips = (x: number, y: number): number => {
    const t: number = Math.abs(x) / (LIP_REACH * mouth);
    if (t >= 1) return 0;
    const across: number = Math.sqrt(1 - t * t);
    const upper: number =
      LIP_ROLL * fh * Math.exp(-(((y - (frame.stomion.y + 0.55 * f.upperVermilionHeight)) / (0.75 * f.upperVermilionHeight)) ** 2));
    const lower: number =
      LIP_ROLL * fh * 1.1 * Math.exp(-(((y - (frame.stomion.y - 0.5 * f.lowerVermilionHeight)) / (0.75 * f.lowerVermilionHeight)) ** 2));
    return across * (upper + lower);
  };

  // the soft tissue over each site, and how much of a bony or muscular term of a given breadth shows through it: a bump of
  // half-width w under a layer t deep reaches the skin as the bump blurred over the layer's depth, w' = sqrt(w^2 + t^2), its height
  // falling by (w / w')^2 over an area and by w / w' along a ridge
  const tissue = (site: keyof typeof AUTOMOVIE_HUMAN_FACIAL_TISSUE): number =>
    AUTOMOVIE_HUMAN_FACIAL_TISSUE[site].lean + AUTOMOVIE_HUMAN_FACIAL_TISSUE[site].gain * fat;
  const through = (width: number, depth: number, ridge: boolean): { width: number; height: number } => {
    const blurred: number = Math.hypot(width, depth);
    return { width: blurred, height: Math.pow(width / blurred, ridge ? 1 : 2) };
  };
  // the skeleton's and muscles' prominence follows lean mass, the robust brow, zygoma and jaw of a muscular build
  const robust: number = ROBUST + (1 - ROBUST) * lean;

  // orbits, lids and brows
  const eyeRadius: number = AutoMovieHumanVector.distance(frame.eye, frame.cornea) + GLOBE_ALLOWANCE;
  const orbitX: number = f.intercanthalWidth / 2 + f.palpebralFissureLength / 2;
  const orbitShows: number = through(ORBIT.breadth * f.palpebralFissureLength, tissue("infraorbital"), false).height;
  const orbit = (p: IAutoMovieVector3): number => {
    const x: number = Math.abs(p.x);
    const ex: number = (x - orbitX) / (ORBIT.across * f.palpebralFissureLength);
    const ey: number = (p.y - frame.eye.y) / ((p.y >= frame.eye.y ? ORBIT.up : ORBIT.down) * f.palpebralFissureLength);
    const rho: number = Math.hypot(ex, ey);
    const weight: number = 1 - smooth(ORBIT.inner, ORBIT.outer, rho);
    if (weight <= 0) return 0;
    const dx: number = x - frame.eye.x;
    const dy: number = p.y - frame.eye.y;
    const r: number = eyeRadius + LID;
    const dome: number = Math.max(frame.eye.z, frame.eye.z + Math.sqrt(Math.max(0, r * r - dx * dx - dy * dy)));
    // the lids drape from the margin on the globe out to the orbit's rim, filled by the orbital fat, so the surface sinks toward
    // the globe by no more than the margin's own depth under the face, less and less outward: no sulcus deeper than that line
    const allowed: number = ORBIT.sink * f.palpebralFissureLength * weight;
    return orbitShows * (dome >= p.z ? weight * (dome - p.z) : -Math.min(p.z - dome, allowed));
  };
  const browRidge = through(0.2 * f.palpebralFissureLength, tissue("supraorbital"), true);
  const brow = (p: IAutoMovieVector3): number => {
    const x: number = Math.abs(p.x);
    const along: number = Math.exp(-(((x - orbitX) / (0.9 * f.palpebralFissureLength)) ** 2));
    return (
      BROW * fh * robust * browRidge.height * along *
      Math.exp(-(((p.y - (frame.eye.y + BROW_HEIGHT * f.palpebralFissureLength)) / browRidge.width) ** 2))
    );
  };
  // masses on the side of the face, each a bump over the side's own height and depth, faded in from the face's front
  // a child's face is small under its vault: the share it falls short of the adult's face height over head height
  const youth: number = Math.max(0, ADULT_FACE_SHARE - fh / head.headHeight) / ADULT_FACE_SHARE;
  const z: IAutoMovieVector3 = frame.zygion;
  const bump = (p: IAutoMovieVector3, y: number, depth: number, ry: number, rz: number): number =>
    Math.exp(-(((p.y - y) / ry) ** 2) - ((p.z - depth) / rz) ** 2);
  const side = (p: IAutoMovieVector3): number => smooth(0.45, 0.75, Math.abs(p.x) / Math.max(1, profile.breadth(p.y)));
  const malarY: number = frame.eye.y - MALAR.below * f.palpebralFissureLength;
  const malarBody = through(0.55 * f.palpebralFissureLength, tissue("zygion"), false);
  const archRidge = through(ARCH.width * fh, tissue("zygion"), true);
  const templeHollow = through(TEMPLE.spread * fh, tissue("frontal"), false);
  const masseterBelly = through(MASSETER.across * fh, tissue("gonion"), false);
  const masses = (p: IAutoMovieVector3): number => {
    const malar: number =
      MALAR.height * fh * robust * malarBody.height *
      Math.exp(-(((Math.abs(p.x) - (frame.eye.x + MALAR.out * f.palpebralFissureLength)) / malarBody.width) ** 2)) *
      Math.exp(-(((p.y - malarY) / (0.9 * malarBody.width)) ** 2));
    // the arch: a ridge from the zygoma's body back to the root above tragion
    const t: number = Math.min(1, Math.max(0, (z.z - p.z) / Math.max(1, z.z - frame.tragion.z)));
    const archY: number = z.y + (frame.tragion.y + ARCH.root * fh - z.y) * t;
    const arch: number =
      ARCH.height * fh * robust * archRidge.height *
      Math.exp(-(((p.y - archY) / archRidge.width) ** 2)) * (p.z > frame.tragion.z + 5 ? 1 : 0);
    const temple: number =
      -TEMPLE.depth * fh * (1 - fat) * templeHollow.height *
      bump(p, z.y + TEMPLE.above * fh, z.z - TEMPLE.behind * fh, templeHollow.width, 0.8 * templeHollow.width);
    const masseter: number =
      MASSETER.height * fh * (0.5 + lean) * masseterBelly.height *
      bump(p, (z.y + frame.gonion.y) / 2, frame.gonion.z + MASSETER.forward * fh, MASSETER.up * fh, masseterBelly.width);
    const buccal: number =
      (BUCCAL.adult + BUCCAL.fat * fat + BUCCAL.growth * youth) * fh *
      bump(p, frame.stomion.y + BUCCAL.above * fh, z.z, BUCCAL.spread * fh, BUCCAL.spread * fh);
    return malar + side(p) * (arch + temple + masseter) + buccal * smooth(0.3, 0.6, Math.abs(p.x) / Math.max(1, profile.breadth(p.y)));
  };
  return (p: IAutoMovieVector3): number => {
    if (p.z <= frame.tragion.z - 10) return 0;
    return nose(p.x, p.y) + lips(p.x, p.y) + orbit(p) + brow(p) + masses(p);
  };
}

/** Share of the brow's, the zygoma's and the jaw's prominence left at the least lean mass. Conventional. */
const ROBUST: number = 0.55;

/** Body fat percentages between which the face's soft tissue goes from the lean young adult's depth to the overweight one's (body mass index under 25 and over), and between which the buccal fat goes from lean to full, and the temporal hollow from empty to filled. Conventional. */
const FAT = { lean: 12, full: 32 } as const;

/** Appendicular lean mass indices between which the masseter goes from slight to full, kilograms per square metre. Conventional, about the NHANES female and male means at 20 (Kelly et al. 2009). */
const LEAN = { low: 6.5, high: 9.5 } as const;

/** The adult face's share of head height, morphological face height over head height: about 119 over 222 mm (3D Facial Norms and the converter's adults). Derived. */
const ADULT_FACE_SHARE: number = 0.54;

/** The zygoma's body: height over face height, its centre outward and below the eye's centre over fissure length. Conventional. */
const MALAR = { height: 0.022, out: 0.45, below: 0.7 } as const;

/** The zygomatic arch: height and half-width over face height, and its root's rise above tragion. Conventional. */
const ARCH = { height: 0.012, width: 0.035, root: 0.03 } as const;

/** The temporal hollow: depth, centre above zygion and behind it, and spread, over face height. Conventional. */
const TEMPLE = { depth: 0.02, above: 0.28, behind: 0.18, spread: 0.13 } as const;

/** The masseter: height, its centre in front of gonion, and its vertical and horizontal spread, over face height. Conventional. */
const MASSETER = { height: 0.012, forward: 0.17, up: 0.22, across: 0.1 } as const;

/** Buccal fat over face height: an adult lean face's slight hollow, its gain with body fat and in a small face, its centre above stomion and spread. Conventional. */
const BUCCAL = { adult: -0.006, fat: 0.025, growth: 0.12, above: 0.05, spread: 0.12 } as const;

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const smooth = (a: number, b: number, x: number): number => {
  const t: number = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Pronasale above subnasale over nose height. Conventional. */
const TIP_ABOVE_SUBNASALE: number = 0.17;

/** Exponent of the dorsum's rise from nasion to the tip, under 1 for the bridge's early lift. Conventional. */
const DORSUM_CURVE: number = 0.85;

/** Half-breadth of the nose at the bridge and at the alae over nose width. Conventional; the alae's is half of alare-alare. */
const BRIDGE: number = 0.2;
const ALA: number = 0.5;

/** The alar lobes: height over the tip's, centre off the midline and spread over nose width, and their reach along the nose's height. Conventional. */
const ALA_HEIGHT: number = 0.5;
const ALA_OFFSET: number = 0.3;
const ALA_SPREAD: number = 0.13;
const ALA_DEPTH: number = 0.12;

/** The lips' forward roll over face height, and their reach past the mouth's corners over half its width. Conventional. */
const LIP_ROLL: number = 0.04;
const LIP_REACH: number = 1.05;

/** The orbital opening: half-breadth, half-height above and below the eye's centre over fissure length, the breadth of its hollow that the infraorbital tissue softens, the deepest the lids sink at the fissure, the share of it inside which the lids lie fully on their dome, and the share beyond which the face is untouched. Conventional. */
const ORBIT = { across: 0.95, up: 0.65, down: 0.55, inner: 0.25, outer: 1.25, breadth: 0.35, sink: 0.32 } as const;

/** Allowance over the apex distance for the sclera beside the cornea, millimetres. */
const GLOBE_ALLOWANCE: number = 0.6;

/** Lid thickness over the globe, millimetres. Conventional. */
const LID: number = 2;

/** Superciliary arch height over face height and its height above the eye's centre over fissure length. Conventional. */
const BROW: number = 0.018;
const BROW_HEIGHT: number = 0.62;
