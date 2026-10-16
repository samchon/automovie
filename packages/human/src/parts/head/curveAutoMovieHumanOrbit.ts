import { IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieHumanIdentity } from "../../structures/IAutoMovieHumanIdentity";
import { IAutoMovieHumanHeadForm } from "./IAutoMovieHumanHeadForm";
import { depthAutoMovieHumanOrbit } from "./depthAutoMovieHumanOrbit";
import { frameAutoMovieHumanHead } from "./frameAutoMovieHumanHead";

/**
 * Shared physical lid and orbital courses in head-local millimetres.
 *
 * The generated globe owns the support sphere; independent fissure dimensions
 * own the aperture. The outer course uses its reference-derived reaches and
 * relative depth. Both the skin field and construction read these same curves.
 */
export function curveAutoMovieHumanOrbit(props: {
  frame: frameAutoMovieHumanHead.IFrame;
  features: IAutoMovieHumanIdentity.IFeatures;
  form: IAutoMovieHumanHeadForm.IEyelids;
  eyeRadius: number;
}): {
  lid: (
    s: number,
    upper: boolean,
    open: number,
    widen: number,
    out: number,
    gap?: number,
  ) => IAutoMovieVector3;
  envelope: (s: number, upper: boolean) => IAutoMovieVector3;
} {
  const { frame, features, form }: typeof props = props;
  const length: number = features.palpebralFissureLength;
  const height: number = features.palpebralFissureHeight;
  const inner: number = features.intercanthalWidth / 2;
  const rise: number = length * Math.tan((form.canthalTilt * Math.PI) / 180);
  const level: number = frame.eye.y - rise / 2;
  const eye: IAutoMovieVector3 = frame.eye;
  const eyeRadius: number = props.eyeRadius;
  const lid: (
    s: number,
    upper: boolean,
    open: number,
    widen: number,
    out: number,
    gap?: number,
  ) => IAutoMovieVector3 = (
    s: number,
    upper: boolean,
    open: number,
    widen: number,
    out: number,
    gap: number = form.canthus,
  ): IAutoMovieVector3 => {
    // Conventional upper/lower arc skew and profile powers express the tarsal
    // asymmetry described in Gray, Anatomy (1918), The Tarsi. They are drawing
    // calibration, not measurements; the independent fissure dimensions above
    // own the physical aperture and are never fitted to these powers.
    const arc: (skew: number, power: number) => number = (
      skew: number,
      power: number,
    ): number => Math.pow(Math.sin(Math.PI * Math.pow(s, skew)), power);
    const x: number = inner - widen + (length + 2 * widen) * s;
    const y: number =
      level +
      rise * s +
      (upper
        ? form.upper * height * arc(0.9, 0.8) * open + gap
        : -(1 - form.upper) * height * arc(1.1, 0.9) * open - gap);
    const r: number = eyeRadius + out;
    const dx: number = x - frame.eye.x;
    const dy: number = y - eye.y;
    const z: number =
      eye.z +
      Math.sqrt(Math.max(r * r - dx * dx - dy * dy, (MINIMUM_DEPTH * r) ** 2));
    return { x, y, z };
  };
  return {
    lid,
    envelope: (s: number, upper: boolean): IAutoMovieVector3 => {
      const x: number =
        inner -
        form.envelope.medial * length +
        length * (1 + form.envelope.medial + form.envelope.lateral) * s;
      const arc: number = upper
        ? Math.pow(Math.sin(Math.PI * Math.pow(s, 0.9)), 0.8)
        : Math.pow(Math.sin(Math.PI * Math.pow(s, 1.1)), 0.9);
      const extent: number = upper
        ? form.upper * height + form.envelope.above * length
        : (1 - form.upper) * height + form.envelope.below * length;
      const y: number =
        level +
        rise * s +
        (upper ? extent * arc + form.canthus : -extent * arc - form.canthus);
      const fraction: number = Math.max(0, Math.min(1, (x - inner) / length));
      const margin: IAutoMovieVector3 = lid(
        fraction,
        upper,
        1,
        0,
        form.marginThickness,
      );
      return {
        x,
        y,
        z: depthAutoMovieHumanOrbit({
          margin: margin.z,
          length,
          share: s,
          upper,
        }),
      };
    },
  };
}

/** Conventional minimum anterior depth of a margin beyond the globe projection. */
const MINIMUM_DEPTH: number = 0.25;
