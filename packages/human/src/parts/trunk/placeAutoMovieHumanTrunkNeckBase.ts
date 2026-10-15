import { IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieHumanRingLayout } from "../../junction/IAutoMovieHumanRingLayout";
import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanTrunkFrame } from "./IAutoMovieHumanTrunkFrame";

/**
 * Perimeter of the neck's base over the neck circumference, which is taken higher, below the thyroid cartilage: the neck flares into the trapezius and the sternocleidomastoid heads at its root. Conventional; ANSUR II measures a neck base circumference this identity does not carry.
 */
const BASE_FLARE: number = 1.08;

/**
 * Place the neck base ring: on its layout's oblique plane, through the jugular notch in front and cervicale behind, with the side widths that give the base its girth.
 *
 * Both landmarks are skin points, so the anterior and posterior vertices lie exactly on them and the neck meets the trunk where anthropometry measures. The ring is an ellipse in the cut plane with the front and back semi-axes those landmarks give and a lateral semi-axis solved so its perimeter, by Ramanujan's approximation, is the neck circumference widened to the base.
 *
 * @param frame The trunk frame (either side; only midline points are read)
 * @param layout The trunk's neck base ring layout
 * @returns The twelve ring points in layout order, model frame
 */
export function placeAutoMovieHumanTrunkNeckBase(
  frame: IAutoMovieHumanTrunkFrame,
  layout: IAutoMovieHumanRingLayout,
): IAutoMovieVector3[] {
  const o: IAutoMovieVector3 = layout.frame.origin;
  const anterior: number = AutoMovieHumanVector.distance(frame.suprasternale, o);
  const posterior: number = AutoMovieHumanVector.distance(frame.cervicale, o);
  const sagittal: number = (anterior + posterior) / 2;
  const perimeter = (b: number): number =>
    Math.PI *
    (3 * (sagittal + b) - Math.sqrt((3 * sagittal + b) * (sagittal + 3 * b)));
  let low: number = 1;
  let high: number = 10 * sagittal;
  for (let i: number = 0; i < 60; ++i) {
    const b: number = (low + high) / 2;
    if (perimeter(b) > BASE_FLARE * frame.neckGirth) high = b;
    else low = b;
  }
  const lateral: number = (low + high) / 2;
  return layout.directions.map(
    (d: IAutoMovieVector3, k: number): IAutoMovieVector3 => {
      const angle: number = (2 * Math.PI * k) / layout.count;
      const c: number = Math.cos(angle);
      const s: number = Math.sin(angle);
      const a: number = c >= 0 ? anterior : posterior;
      const r: number = 1 / Math.sqrt((c * c) / (a * a) + (s * s) / (lateral * lateral));
      return AutoMovieHumanVector.offset(o, [d, r]);
    },
  );
}
