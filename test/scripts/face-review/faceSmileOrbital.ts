import { FACE_SMILE_RETRACTION_UNITS } from "./splitSmileRetractionBasis";

/**
 * The narrowing of the palpebral fissure a posed smile brings, per unit of
 * the width it adds to the mouth: 1.885 mm (the mean of the left eye's 1.81
 * and the right's 1.96) over 10.39 mm, the fissure heights' and the labial
 * width's changes from rest to a posed smile in 41 adults aged 20 to 36
 * measured by 3D surface imaging (Peking University; PMC12549365). The
 * fissure closes from below as the orbicularis oculi's orbital part (the
 * cheek raiser, FACS AU6) lifts the lower lid with the infraorbital
 * tissue, the component a posed smile carries with the zygomaticus
 * major's pull on the corner (AU12).
 */
export const FACE_SMILE_FISSURE_PER_LABIAL = 1.885 / 10.39;

/** One quantity for each side of the face, the subject's own left and right. */
export interface IFaceSides {
  left: number;
  right: number;
}

/**
 * Each side's cheek raiser for a smile the photograph shows but whose
 * orbital part its instrument cannot read.
 *
 * The expression transfer carries the smile's corner lift (`mouthSmile`)
 * from the photograph, but not the cheek raiser (`cheekSquint`): no
 * calibration read it across the renders and the photographs, so it stayed
 * at rest and every smiling render kept its eyes as wide as at rest, where
 * the posed smile narrows the fissure by `FACE_SMILE_FISSURE_PER_LABIAL` of
 * the mouth's widening. What a photograph cannot read is set to its
 * population's most probable value: each side's raiser is the weight at
 * which that side's fissure narrows by the norm's share of the width its
 * own smile adds, less what the smile narrows it by itself. Rates are
 * metres per unit weight on the document's own face: `labial`, the mouth's
 * width a side's smile adds; `fissure`, that side's fissure height its
 * smile changes (negative narrows); `raiser`, that side's fissure height its
 * raiser changes. A raiser that does not narrow its fissure carries
 * nothing (zero); a weight is kept within [0, `maximum`]. Pure.
 */
export function faceSmileOrbital(props: {
  smile: IFaceSides;
  labial: IFaceSides;
  fissure: IFaceSides;
  raiser: IFaceSides;
  maximum: number;
}): IFaceSides {
  if (!(props.maximum >= 0))
    throw new Error("A raiser's maximum is zero or more.");
  const side = (key: keyof IFaceSides): number => {
    const smile = Math.max(0, props.smile[key]);
    const raiser = props.raiser[key];
    if (!(raiser < 0) || smile === 0) return 0;
    const needed =
      FACE_SMILE_FISSURE_PER_LABIAL * Math.max(0, props.labial[key]) * smile;
    const own = -props.fissure[key] * smile;
    return Math.min(props.maximum, Math.max(0, (needed - own) / -raiser));
  };
  return { left: side("left"), right: side("right") };
}

/**
 * The smile's norm-coupled units held to the smile the face finally shows.
 *
 * Each side's cheek raiser (`cheekSquint`) and lip retraction
 * (`FACE_SMILE_RETRACTION_UNITS`) are set from its smile's photographed
 * weight before the identity is solved; the expression validity may then
 * yield the smile itself toward rest, and a coupled unit left at the
 * photographed smile's value would show a smile's orbital part or
 * retraction without the smile. So each side's raiser is held to at most
 * `faceSmileOrbital` for its final smile over the same `rates` (none when
 * `rates` is null, no raiser having been set), and each retraction to at
 * most its smile's final weight. A unit already at or below its coupling
 * keeps its weight; recoupling only lowers. Pure.
 */
export function faceSmileRecouple(props: {
  expression: Readonly<Record<string, number>>;
  rates: Omit<Parameters<typeof faceSmileOrbital>[0], "smile"> | null;
}): Record<string, number> {
  const expression = { ...props.expression };
  const hold = (unit: string, most: number) => {
    const weight = expression[unit];
    if (weight !== undefined && weight > most) expression[unit] = most;
  };
  if (props.rates !== null) {
    const raiser = faceSmileOrbital({
      ...props.rates,
      smile: {
        left: expression.mouthSmileLeft ?? 0,
        right: expression.mouthSmileRight ?? 0,
      },
    });
    hold("cheekSquintLeft", raiser.left);
    hold("cheekSquintRight", raiser.right);
  }
  for (const { smile, retraction } of FACE_SMILE_RETRACTION_UNITS)
    hold(retraction, expression[smile] ?? 0);
  return expression;
}
