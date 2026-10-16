import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanIdentity } from "../../structures/IAutoMovieHumanIdentity";
import { AutoMovieHumanHeadDomain } from "./AutoMovieHumanHeadDomain";
import { AutoMovieHumanHeadNetwork } from "./AutoMovieHumanHeadNetwork";
import { IAutoMovieHumanHeadForm } from "./IAutoMovieHumanHeadForm";

/**
 * Fill each eye's opening with a geometric orbital envelope and the lid-margin loops of orbicularis oculi.
 *
 * Every loop has the rim's thirty points: fifteen over the upper lid and fifteen under the lower, from canthus to canthus, the canthi being short edges where the two lids meet. From the rim inward:
 *
 * 1. An orbital envelope on the anterior face, whose medial, lateral, superior and inferior reaches are independently fitted in aperture-width units. This geometric course is not labelled as a clinically located sulcus or orbital rim.
 * 2. The anterior lid margin, on its reference sphere: on the sphere about the eye's centre of rotation through the corneal apex, out by the lid margin's thickness, along the fissure's measured length and height.
 * 3. The posterior lid margin, on its own reference sphere at the aperture's inner boundary; clearance from the actual ellipsoidal eye is checked independently.
 *
 * The fissure runs from endocanthion, half the intercanthal width from the midline, to exocanthion one input fissure-length value further out in the transverse direction, rising by the form's canthal tilt from the inner to the outer corner. That transverse construction does not independently establish the clinical three-dimensional chord. The upper margin opens above the line of the canthi by the form's share of the fissure height and the lower below it by the rest, each arc fullest a little off the middle as the tarsal plates are (Gray 1918, "The Tarsi").
 *
 * @param props The domain, the network, the feature measurements, the loops' placement ({@link IAutoMovieHumanHeadForm.IEyelids}) and each opening's rim: fifteen points over the top from the middle of its side of lower `v` to the middle of the other side, then fifteen back under the bottom
 */
export function loopAutoMovieHumanEyelids(props: {
  domain: AutoMovieHumanHeadDomain;
  network: AutoMovieHumanHeadNetwork;
  features: IAutoMovieHumanIdentity.IFeatures;
  form: IAutoMovieHumanHeadForm.IEyelids;
  rims: Record<"left" | "right", AutoMovieHumanHeadNetwork.IPoint[]>;
}): void {
  const { domain, network, features, form }: typeof props = props;
  const frame: AutoMovieHumanHeadDomain["frame"] = domain.frame;
  const length: number = features.palpebralFissureLength;
  const height: number = features.palpebralFissureHeight;
  const inner: number = features.intercanthalWidth / 2;
  const eyeRadius: number =
    AutoMovieHumanVector.distance(frame.eye, frame.cornea) + GLOBE_ALLOWANCE;
  const rise: number = length * Math.tan((form.canthalTilt * Math.PI) / 180);
  for (const side of ["left", "right"] as const) {
    const sign: number = side === "left" ? 1 : -1;
    const rim: AutoMovieHumanHeadNetwork.IPoint[] = props.rims[side];
    const half: number = rim.length / 2;
    const eye: IAutoMovieVector3 = AutoMovieHumanVector.of(
      sign * frame.eye.x,
      frame.eye.y,
      frame.eye.z,
    );
    const level: number = frame.eye.y - rise / 2;
    // the rim's lower-v side is lateral on the left eye and medial on the right
    const lateralFirst: boolean = side === "left";
    // place m of a run of `half` points: 0 at the medial canthus, 1 at the lateral, closer together at the corners
    const place: (m: number, upper: boolean) => number = (
      m: number,
      upper: boolean,
    ): number => {
      const t: number = (1 - Math.cos((Math.PI * m) / (half - 1))) / 2;
      const fromFirst: number = upper ? t : 1 - t;
      return lateralFirst ? 1 - fromFirst : fromFirst;
    };
    // a point of the fissure's outline, opened by `open` of the lid's arc and set `out` beyond the globe
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
        Math.sqrt(
          Math.max(r * r - dx * dx - dy * dy, (MINIMUM_DEPTH * r) ** 2),
        );
      return AutoMovieHumanVector.of(sign * x, y, z);
    };
    const loop: (
      make: (s: number, upper: boolean) => IAutoMovieVector3,
      free: string | null,
    ) => AutoMovieHumanHeadNetwork.IPoint[] = (
      make: (s: number, upper: boolean) => IAutoMovieVector3,
      free: string | null,
    ): AutoMovieHumanHeadNetwork.IPoint[] =>
      Array.from(
        { length: rim.length },
        (_: unknown, k: number): AutoMovieHumanHeadNetwork.IPoint => {
          const upper: boolean = k < half;
          const p: IAutoMovieVector3 = make(
            place(upper ? k : k - half, upper),
            upper,
          );
          const at: { u: number; v: number } =
            free === null ? domain.onFace(p.x, p.y) : domain.locate(p);
          return free === null
            ? network.on(at.u, at.v)
            : network.free(`${free}.${side}.${k}`, domain.toModel(p), at);
        },
      );
    // A geometric orbital envelope, not a clinically located lid crease: the medial and lateral reaches are independent.
    const envelope: AutoMovieHumanHeadNetwork.IPoint[] = loop(
      (s: number, upper: boolean): IAutoMovieVector3 => {
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
        return AutoMovieHumanVector.of(sign * x, y, domain.profile.front(y));
      },
      null,
    );
    const anterior: AutoMovieHumanHeadNetwork.IPoint[] = loop(
      (s: number, upper: boolean): IAutoMovieVector3 =>
        lid(s, upper, 1, 0, form.marginThickness),
      "lid.anterior",
    );
    const posterior: AutoMovieHumanHeadNetwork.IPoint[] = loop(
      (s: number, upper: boolean): IAutoMovieVector3 =>
        lid(s, upper, form.posteriorOpen, -0.3, form.contact),
      "lid.posterior",
    );
    network.bands(
      [
        rim,
        network.between(rim, envelope, form.orbit),
        envelope,
        anterior,
        posterior,
      ],
      `eye.${side}`,
    );
    network.ring(`orbit.opening.${side}`, rim);
    network.ring(`orbit.envelope.${side}`, envelope);
  }
}

/** Allowance over the apex distance for the globe's sclera beside the cornea, millimetres: the scleral sphere of about 12 mm sits a millimetre in front of the centre of rotation. Derived from the eye module's globe. */
const GLOBE_ALLOWANCE: number = 0.6;

/** Least depth of a lid point in front of the eye's centre, over the sphere's radius, where the canthi lie beyond the globe's outline. Conventional. */
const MINIMUM_DEPTH: number = 0.25;
