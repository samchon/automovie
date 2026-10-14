import { portraitNeckReferenceChin } from "./portraitNeckReferenceChin";
import { portraitNeckShape } from "./portraitNeckShape";
import type { IPortraitNeckShape } from "./structures/IPortraitNeckShape";

/**
 * Resolve the neck sections a subject builds with. A supplied neck is authored
 * in absolute head-frame millimetres and is returned as given, so the caller's
 * heights are never reinterpreted. An omitted neck takes the default sections
 * shifted vertically by the subject's actual chin height minus the height the
 * default was authored below, preserving each section's vertical offset from
 * the chin datum when a longer or shorter face lowers or raises it. This does
 * not preserve every distance to independently authored collar vertices.
 * Radii, axes and the crop shape are unchanged.
 *
 * Without the shift, a face lengthened within its documented scale range moved
 * the chin below the fixed default section and the cervical builder refused it.
 * A nonfinite chin height refuses. Heights are millimetres in the head frame
 * with +Y up.
 *
 * @evidence contracts/common.md#principled-implementation Omitted default sections shift only Y by actual chin minus the source reference chin, preserving their chin-relative vertical offsets.
 * @evidence contracts/common.md#clear-and-simple-design Supplied absolute head-frame sections are returned unchanged; omission returns independent upper/lower/crop records from the single default owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A non-finite chin refuses and supplied heights are never silently reinterpreted; radii, axes and crop proportions are not fitted to a target.
 * @evidence contracts/common.md#meaningful-documentation The prose gives millimetres/+Y, borrowed supplied-input behavior, copied shifted defaults and the original longer/shorter-face attachment cause.
 * @evidence contracts/performance.md#efficient-algorithms Three section records and one chin difference require constant time/space; no head or neck mesh population is traversed.
 * @evidence contracts/performance.md#reuse-equivalent-work The canonical default and reference chin are shared immutable inputs, while each omitted-neck result owns its three shifted copies.
 * @evidence contracts/performance.md#bound-retention-and-release-resources An authored input is borrowed as declared and must remain caller-owned; generated defaults have no retained host or live resource.
 */
export function resolvePortraitNeckShape(
  chinY: number,
  input?: IPortraitNeckShape,
): IPortraitNeckShape {
  if (!Number.isFinite(chinY))
    throw new Error("A default neck needs a finite chin height.");
  if (input !== undefined) return input;
  const shift: number = chinY - portraitNeckReferenceChin;
  const lowered: (section: IPortraitNeckShape["upper"]) => {
    y: number;
    width: number;
    front: number;
    back: number;
    centre: number;
  } = (
    section: IPortraitNeckShape["upper"],
  ): {
    y: number;
    width: number;
    front: number;
    back: number;
    centre: number;
  } => ({
    ...section,
    y: section.y + shift,
  });
  return {
    upper: lowered(portraitNeckShape.upper),
    lower: lowered(portraitNeckShape.lower),
    crop: lowered(portraitNeckShape.crop),
  };
}
