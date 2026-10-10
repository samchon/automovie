import { portraitNeckReferenceChin } from "./portraitNeckReferenceChin";
import { portraitNeckShape } from "./portraitNeckShape";
import type { IPortraitNeckShape } from "./structures/IPortraitNeckShape";

/**
 * Resolve the neck sections a subject builds with. A supplied neck is authored
 * in absolute head-frame millimetres and is returned as given, so the caller's
 * heights are never reinterpreted. An omitted neck takes the default sections
 * shifted vertically by the subject's actual chin height minus the height the
 * default was authored below, so the cervical sections stay the same distance
 * below the mandibular collar they attach to when a longer or shorter face
 * lowers or raises the chin. Radii, axes and the crop shape are unchanged.
 *
 * Without the shift, a face lengthened within its documented scale range moved
 * the chin below the fixed default section and the cervical builder refused it.
 * A nonfinite chin height refuses. Heights are millimetres in the head frame
 * with +Y up.
 */
export function resolvePortraitNeckShape(
  chinY: number,
  input?: IPortraitNeckShape,
): IPortraitNeckShape {
  if (!Number.isFinite(chinY))
    throw new Error("A default neck needs a finite chin height.");
  if (input !== undefined) return input;
  const shift = chinY - portraitNeckReferenceChin;
  const lowered = (section: IPortraitNeckShape["upper"]) => ({
    ...section,
    y: section.y + shift,
  });
  return {
    upper: lowered(portraitNeckShape.upper),
    lower: lowered(portraitNeckShape.lower),
    crop: lowered(portraitNeckShape.crop),
  };
}
