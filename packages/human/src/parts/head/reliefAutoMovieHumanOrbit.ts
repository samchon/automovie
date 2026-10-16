import { IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieHumanIdentity } from "../../structures/IAutoMovieHumanIdentity";
import { AUTOMOVIE_HUMAN_FACIAL_TISSUE } from "./AUTOMOVIE_HUMAN_FACIAL_TISSUE";
import { IAutoMovieHumanHeadForm } from "./IAutoMovieHumanHeadForm";
import { curveAutoMovieHumanOrbit } from "./curveAutoMovieHumanOrbit";
import { frameAutoMovieHumanHead } from "./frameAutoMovieHumanHead";

/**
 * Orbital and brow height along the head frame's anterior axis, in millimetres.
 *
 * The source and lid loops share one physical margin and reference-course evaluator. Its conventional piecewise cubic partition reaches the nasal midline, glabella and zygion; it is a support region, not a measured tissue boundary. Regional tissue depth blurs the fitted course's visibility while independent aperture measurements stay intact. This is an anterior height in the head frame, never a change to a tilted section's radial distance. The partition does not certify continuity of the sampled and subdivided skin.
 */
export function reliefAutoMovieHumanOrbit(props: {
  frame: frameAutoMovieHumanHead.IFrame;
  head: IAutoMovieHumanIdentity.IHead;
  form: IAutoMovieHumanHeadForm.IRelief;
  robust: number;
  eye: {
    radius: number;
    margin: number;
    form: IAutoMovieHumanHeadForm.IEyelids;
  };
  tissue: (site: keyof typeof AUTOMOVIE_HUMAN_FACIAL_TISSUE) => number;
  through: (
    width: number,
    depth: number,
    ridge: boolean,
  ) => { width: number; height: number };
}): (p: IAutoMovieVector3) => number {
  const { frame, head, form, eye, robust, tissue, through }: typeof props =
    props;
  const f: IAutoMovieHumanIdentity.IFeatures = head.features;
  const orbitX: number = f.intercanthalWidth / 2 + f.palpebralFissureLength / 2;
  const orbitShows: number = through(
    form.orbit.breadth * f.palpebralFissureLength,
    tissue("infraorbital"),
    false,
  ).height;
  const browRidge: { width: number; height: number } = through(
    0.2 * f.palpebralFissureLength,
    tissue("supraorbital"),
    true,
  );
  const courses: ReturnType<typeof curveAutoMovieHumanOrbit> =
    curveAutoMovieHumanOrbit({
      frame,
      features: f,
      form: eye.form,
      eyeRadius: eye.radius,
    });
  const medial: number = courses.envelope(0, true).x;
  const lateral: number = courses.envelope(1, true).x;
  if (!(medial > 0 && lateral < frame.zygion.x))
    throw new Error(
      "Orbital source courses must lie between nasal midline and zygion",
    );
  return (p: IAutoMovieVector3): number => {
    const x: number = Math.abs(p.x);
    const share: number = Math.max(
      0,
      Math.min(1, (x - medial) / (lateral - medial)),
    );
    const upper: IAutoMovieVector3 = courses.envelope(share, true);
    const lower: IAutoMovieVector3 = courses.envelope(share, false);
    // The nasal midline, glabella and zygion own the surrounding face. Compact
    // Cubic transitions join the same reference course to those shared boundaries;
    // no independently capped negative globe field competes with the eyelids.
    const across: number =
      x < medial
        ? smooth(0, medial, x)
        : 1 - smooth(lateral, frame.zygion.x, x);
    const outside: number =
      p.y > upper.y
        ? 1 - smooth(upper.y, frame.glabella.y, p.y)
        : p.y < lower.y
          ? smooth(frame.zygion.y, lower.y, p.y)
          : 1;
    const vertical: number = smooth(lower.y, upper.y, p.y);
    const target: number = lower.z + (upper.z - lower.z) * vertical;
    const orbit: number = orbitShows * across * outside * (target - p.z);
    const along: number = Math.exp(
      -(((x - orbitX) / (0.9 * f.palpebralFissureLength)) ** 2),
    );
    const brow: number =
      form.brow.height *
      head.faceHeight *
      robust *
      browRidge.height *
      along *
      Math.exp(
        -(
          ((p.y - (frame.eye.y + form.brow.level * f.palpebralFissureLength)) /
            browRidge.width) **
          2
        ),
      );
    return orbit + brow;
  };
}

/** Smooth source transition between its named inner and outer orbital reaches. */
function smooth(a: number, b: number, x: number): number {
  const t: number = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}
