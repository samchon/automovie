import { IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieHumanIdentity } from "../../structures/IAutoMovieHumanIdentity";
import { AutoMovieHumanHeadMath } from "./AutoMovieHumanHeadMath";
import { IAutoMovieHumanHeadForm } from "./IAutoMovieHumanHeadForm";
import { frameAutoMovieHumanHead } from "./frameAutoMovieHumanHead";

/**
 * The face mass: three smooth solids joined by smooth unions, the masses figure drawing builds the face from ("the masses of the head are the cranium, the skeleton of the face, and the jaw", Bridgman 1920, Constructive Anatomy, p. 124).
 *
 * - Midface: the zygomatic and maxillary mass, a superellipsoid widest at zygion, from the orbits' floor to below the nose base, its front behind the nasal profile.
 * - Jaw: the mandible with its soft tissue, a superellipsoid as wide as the gonia at its back and tapering forward to the chin's width at pogonion, its lower border at menton.
 * - Muzzle: the barrel of the dental arches under the lips, from the nose base to the labiomental fold, its front at subnasale.
 *
 * Each solid is C1 and the unions are smooth, so the face has no crease the cage could not follow. The midline depths take subnasale 0.081 face heights in front of nasion and gnathion 0.042 behind it from the 3D Facial Norms tragion depths (t-sn 132.8 mm and t-gn 151.7 mm in men after half the bitragion width and the heights; Weinberg et al. 2016, Cleft Palate Craniofac J 53(6):e185-e197). Grade: derived; the solids' proportions are the calibrated coefficients of {@link IAutoMovieHumanHeadForm}.
 *
 * @param frame The head frame and its landmarks
 * @param head The head measurements
 * @param form Form coefficients
 * @returns Signed distance from the face mass, millimetres
 */
export function shapeAutoMovieHumanHeadFace(
  frame: frameAutoMovieHumanHead.IFrame,
  head: IAutoMovieHumanIdentity.IHead,
  form: IAutoMovieHumanHeadForm,
): (p: IAutoMovieVector3) => number {
  const fh: number = head.faceHeight;
  const fw: number = head.faceWidth;
  const me: IAutoMovieVector3 = frame.menton;
  const n: IAutoMovieVector3 = frame.nasion;
  const go: IAutoMovieVector3 = frame.gonion;
  const zy: IAutoMovieVector3 = frame.zygion;
  const sto: IAutoMovieVector3 = frame.stomion;
  const subnasale: number = n.z + SUBNASALE * fh;
  const gnathion: number = n.z + GNATHION * fh;
  const pogonion: number = Math.max(
    gnathion + form.pogonion * fh,
    subnasale - form.chin * fh,
  );
  const snY: number = me.y + SUBNASALE_HEIGHT * fh;
  const foldY: number = sto.y - LOWER_LIP * fh;

  const midface = solid({
    centre: [0, zy.y, zy.z],
    across: zy.x,
    front: n.z - form.midfaceFront * fh - zy.z,
    back: 0.8 * Math.max(1, n.z - zy.z),
    up: frame.eye.y + form.midfaceTop * fh - zy.y,
    down: zy.y - (snY - form.midfaceBottom * fh),
    horizontal: form.cheekExponent,
    vertical: form.midfaceExponent,
    taper: null,
    tilt: 0,
  });
  // the jaw lies along the mandibular plane, its lower border the line from gonion to menton
  const tilt: number = Math.atan2(go.y - me.y, me.z - go.z);
  const lift: number = form.jawLift * fh;
  const jawCentre: [number, number, number] = [
    0,
    go.y + lift * Math.cos(tilt),
    go.z + lift * Math.sin(tilt),
  ];
  const along: number =
    (pogonion - jawCentre[2]) * Math.cos(tilt) -
    (me.y + 0.12 * fh - jawCentre[1]) * Math.sin(tilt);
  const jaw = solid({
    centre: jawCentre,
    across: go.x,
    front: along,
    back: 0.6 * along,
    up: form.jawTop * fh,
    down: lift,
    horizontal: form.jawExponent,
    vertical: form.jawBorder,
    taper: { width: (form.chinWidth * fw) / go.x, exponent: form.jawTaper },
    tilt,
  });
  const depth: number = form.muzzleDepth * fh;
  const muzzleY: number = (snY + foldY) / 2;
  const muzzle = solid({
    centre: [0, muzzleY, subnasale - depth],
    across: form.muzzleMouth * fw,
    front: depth,
    back: depth,
    up: snY + form.muzzleTop * fh - muzzleY,
    down: muzzleY - foldY,
    horizontal: 2,
    vertical: form.muzzleExponent,
    taper: null,
    tilt: 0,
  });
  const k: number = form.blend * fh;
  return (p: IAutoMovieVector3): number =>
    AutoMovieHumanHeadMath.smoothMin(
      AutoMovieHumanHeadMath.smoothMin(midface(p), jaw(p), k),
      muzzle(p),
      0.6 * k,
    );
}

/** Subnasale in front of nasion over face height, from the 3D Facial Norms tragion depths. Grade: derived. */
const SUBNASALE: number = 0.081;

/** Gnathion behind nasion over face height, from the same norms. Grade: derived. */
const GNATHION: number = -0.042;

/** Subnasale above menton over face height: lower face height 73.1 and 66.4 mm over 127.2 and 118.6 mm (3D Facial Norms). Grade: derived. */
const SUBNASALE_HEIGHT: number = 0.567;

/** The labiomental fold below stomion over face height: lower lip height sto-sl 19.2 mm over 127.2 mm (3D Facial Norms). Grade: derived. */
const LOWER_LIP: number = 0.15;

/**
 * A superellipsoid with its own semi-axis in each direction, so its halves can differ, optionally narrowing toward its front and tilted about the transverse axis. Its value is the generalized superellipsoid `H^v + |dy/b|^v` with `H` the horizontal superellipse of exponent `h`; distances are exact along rays from the centre.
 */
const solid = (props: {
  centre: [number, number, number];
  across: number;
  front: number;
  back: number;
  up: number;
  down: number;
  horizontal: number;
  vertical: number;
  taper: { width: number; exponent: number } | null;
  /** Rotation about the transverse axis, radians, raising the solid's back. */
  tilt: number;
}): ((p: IAutoMovieVector3) => number) => {
  const cos: number = Math.cos(props.tilt);
  const sin: number = Math.sin(props.tilt);
  const front: number = Math.max(1, props.front);
  const back: number = Math.max(1, props.back);
  const up: number = Math.max(1, props.up);
  const down: number = Math.max(1, props.down);
  return (p: IAutoMovieVector3): number => {
    const dx: number = Math.abs(p.x - props.centre[0]);
    const ty: number = p.y - props.centre[1];
    const tz: number = p.z - props.centre[2];
    const dy: number = ty * cos + tz * sin;
    const dz: number = tz * cos - ty * sin;
    const forward: number = Math.min(1, Math.max(0, dz / front));
    const across: number =
      props.taper === null
        ? props.across
        : props.across *
          (1 -
            (1 - props.taper.width) * Math.pow(forward, props.taper.exponent));
    const h: number = props.horizontal;
    const v: number = props.vertical;
    const horizontal: number = Math.pow(
      Math.pow(dx / Math.max(1, across), h) +
        Math.pow(Math.abs(dz) / (dz > 0 ? front : back), h),
      1 / h,
    );
    const s: number =
      Math.pow(horizontal, v) +
      Math.pow(Math.abs(dy) / (dy > 0 ? up : down), v);
    return AutoMovieHumanHeadMath.radial(
      Math.sqrt(dx * dx + dy * dy + dz * dz),
      s,
      v,
    );
  };
};
