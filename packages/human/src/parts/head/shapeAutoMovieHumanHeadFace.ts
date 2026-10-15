import { IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieHumanIdentity } from "../../structures/IAutoMovieHumanIdentity";
import { AutoMovieHumanHeadMath } from "./AutoMovieHumanHeadMath";
import { IAutoMovieHumanHeadForm } from "./IAutoMovieHumanHeadForm";
import { frameAutoMovieHumanHead } from "./frameAutoMovieHumanHead";

/**
 * The face mass: the mask of brows, cheeks and jaw, and the muzzle in front of it, joined smoothly.
 *
 * Both are stacks of horizontal D-shaped sections, each a superellipse front half from its widest point to its midline front. The mask's widest points follow the facial frame: the mandible's lower border, a parabola from menton to both gonia in the mandibular plane, then the ramus up to zygion, the lateral orbital rims, and frontotemporale. The muzzle is the barrel of the dental arches under the lips from the nose base to the chin, the central mass of the lower face ("the plane of the face ... broken on each side by a line from the outer corner of the cheek bone to the center of the upper lip", Bridgman 1920, Constructive Anatomy, p. 126).
 *
 * The midline profile without nose and lips takes its depths from the 3D Facial Norms tragion depths (Weinberg et al. 2016, Cleft Palate Craniofac J 53(6):e185-e197): subnasale 0.081 face heights in front of nasion and gnathion 0.042 behind it, the depths that leave t-sn 132.8 mm and t-gn 151.7 mm in men after half the bitragion width and the heights. Grade: derived.
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
  const g: IAutoMovieVector3 = frame.glabella;
  const go: IAutoMovieVector3 = frame.gonion;
  const zy: IAutoMovieVector3 = frame.zygion;
  const ft: IAutoMovieVector3 = frame.frontotemporale;
  const sto: IAutoMovieVector3 = frame.stomion;
  const subnasale: number = n.z + SUBNASALE * fh;
  const gnathion: number = n.z + GNATHION * fh;
  const pogonion: number = Math.max(gnathion + form.pogonion * fh, subnasale - form.chin * fh);
  const snY: number = me.y + SUBNASALE_HEIGHT * fh;
  const foldY: number = sto.y - LOWER_LIP * fh;

  // the mask
  const profile: (y: number) => number = AutoMovieHumanHeadMath.curve([
    [me.y, me.z - form.maskChin * fh],
    [foldY, pogonion - form.maskFold * fh],
    [sto.y, subnasale - form.maskMouth * fh],
    [snY, n.z - form.maskNose * fh],
    [frame.eye.y - 0.1 * fh, n.z - form.maskEye * fh],
    [n.y, n.z],
    [g.y, g.z],
    [g.y + 0.15 * fh, g.z - 0.08 * fh],
  ]);
  const mask: ISection[] = [];
  for (const t of [0, 0.08, 0.2, 0.4, 0.65, 1])
    mask.push({
      y: me.y + (go.y - me.y) * t,
      halfWidth: Math.max(0.1 * fw, go.x * Math.sqrt(t)),
      widest: me.z + (go.z - me.z) * t,
      front: profile(me.y + (go.y - me.y) * t),
      exponent: form.jawExponent,
    });
  for (const [y, halfWidth, widest, exponent] of [
    [(go.y + zy.y) / 2, (go.x + zy.x) / 2, (go.z + zy.z) / 2, form.ramusExponent],
    [zy.y, zy.x, zy.z, form.cheekExponent],
    [frame.eye.y, form.orbitWidth * fw, frame.cornea.z - form.orbitSetback * fh, form.orbitExponent],
    [g.y, ft.x, ft.z - form.browSetback * fh, form.browExponent],
    [g.y + 0.15 * fh, 0.6 * ft.x, ft.z - (form.browSetback + 0.05) * fh, form.browExponent],
  ] as Array<[number, number, number, number]>)
    mask.push({ y, halfWidth, widest, front: profile(y), exponent });

  // the muzzle
  const depth: number = form.muzzleDepth * fh;
  const muzzle: ISection[] = [
    { y: me.y, halfWidth: form.muzzleMenton * fw, widest: me.z - 0.7 * depth, front: me.z, exponent: 2 },
    { y: me.y + 0.04 * fh, halfWidth: 0.5 * (form.muzzleMenton + form.muzzleChin) * fw, widest: pogonion - 0.8 * depth, front: Math.max(gnathion, pogonion - 0.06 * fh), exponent: 2 },
    { y: me.y + 0.12 * fh, halfWidth: form.muzzleChin * fw, widest: pogonion - 0.75 * depth, front: pogonion, exponent: 2 },
    { y: foldY, halfWidth: form.muzzleFold * fw, widest: pogonion - 0.85 * depth, front: pogonion - 0.03 * fh, exponent: 2 },
    { y: sto.y, halfWidth: form.muzzleMouth * fw, widest: subnasale - depth, front: subnasale, exponent: 2 },
    { y: snY, halfWidth: form.muzzleBase * fw, widest: subnasale - 0.87 * depth, front: subnasale, exponent: 2 },
    { y: snY + 0.05 * fh, halfWidth: 0.6 * form.muzzleBase * fw, widest: subnasale - 0.8 * depth, front: subnasale - 0.06 * fh, exponent: 2 },
  ];
  const a: (p: IAutoMovieVector3) => number = stack(mask);
  const b: (p: IAutoMovieVector3) => number = stack(muzzle);
  const blend: number = 1.5 * form.blend * fh;
  return (p: IAutoMovieVector3): number =>
    AutoMovieHumanHeadMath.smoothMin(a(p), b(p), blend);
}

/** Subnasale in front of nasion over face height, from the 3D Facial Norms tragion depths. Grade: derived. */
const SUBNASALE: number = 0.081;

/** Gnathion behind nasion over face height, from the same norms. Grade: derived. */
const GNATHION: number = -0.042;

/** Subnasale above menton over face height: lower face height 73.1 and 66.4 mm over 127.2 and 118.6 mm (3D Facial Norms). Grade: derived. */
const SUBNASALE_HEIGHT: number = 0.567;

/** The labiomental fold below stomion over face height: lower lip height sto-sl 19.2 mm over 127.2 mm (3D Facial Norms). Grade: derived. */
const LOWER_LIP: number = 0.15;

/** One horizontal section of a D-shaped stack. */
interface ISection {
  y: number;
  halfWidth: number;
  widest: number;
  front: number;
  exponent: number;
}

/** Signed distance from a stack of D-shaped sections interpolated along the height, closed at its ends. */
const stack = (sections: ISection[]): ((p: IAutoMovieVector3) => number) => {
  const of = (key: "halfWidth" | "widest" | "front" | "exponent"): ((y: number) => number) =>
    AutoMovieHumanHeadMath.curve(sections.map((s: ISection): [number, number] => [s.y, s[key]]));
  const halfWidth = of("halfWidth");
  const widest = of("widest");
  const front = of("front");
  const exponent = of("exponent");
  const bottom: number = Math.min(...sections.map((s: ISection): number => s.y));
  const top: number = Math.max(...sections.map((s: ISection): number => s.y));
  return (p: IAutoMovieVector3): number => {
    if (p.y < bottom - 1 || p.y > top) return 1e3;
    const fade: number =
      AutoMovieHumanHeadMath.smoothStep(bottom - 1, bottom + 2, p.y) *
      (1 - AutoMovieHumanHeadMath.smoothStep(top - 8, top, p.y));
    const half: number = Math.max(1, halfWidth(p.y) * fade);
    const centre: number = widest(p.y);
    const depth: number = Math.max(1, front(p.y) - centre);
    const n: number = exponent(p.y);
    const dx: number = Math.abs(p.x);
    const dz: number = p.z - centre;
    const s: number =
      Math.pow(dx / half, n) + Math.pow(dz > 0 ? dz / depth : -dz / (0.3 * depth), n);
    return AutoMovieHumanHeadMath.radial(Math.sqrt(dx * dx + dz * dz), s, n);
  };
};
