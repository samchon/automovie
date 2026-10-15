import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanIdentity } from "../../structures/IAutoMovieHumanIdentity";
import { AutoMovieHumanHeadDomain } from "./AutoMovieHumanHeadDomain";
import { AutoMovieHumanHeadNetwork } from "./AutoMovieHumanHeadNetwork";
import { IAutoMovieHumanHeadForm } from "./IAutoMovieHumanHeadForm";

/**
 * Fill each eye's opening with the concentric loops of the lids, the fold lines of orbicularis oculi, from the opening's rim to the palpebral fissure.
 *
 * Every loop has the rim's thirty points: fifteen over the upper lid and fifteen under the lower, from canthus to canthus, the canthi being short edges where the two lids meet. From the rim inward:
 *
 * 1. The lid sulcus, on the face's surface: the upper lid's crease where the lid meets the orbit's roof and the lower lid's junction with the cheek, a lid's height beyond the margin.
 * 2. The anterior lid margin, resting on the eyeball: on the sphere about the eye's centre of rotation through the corneal apex, out by the lid margin's thickness, along the fissure's measured length and height.
 * 3. The posterior lid margin, where the lid touches the globe and the fissure opens onto the eyeball.
 *
 * The fissure runs from endocanthion, half the intercanthal width from the midline, to exocanthion one fissure length further out, rising by the form's canthal tilt from the inner to the outer corner. The upper margin opens above the line of the canthi by the form's share of the fissure height and the lower below it by the rest, each arc fullest a little off the middle as the tarsal plates are (Gray 1918, "The Tarsi").
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
  const { domain, network, features, form } = props;
  const frame = domain.frame;
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
    const place = (m: number, upper: boolean): number => {
      const t: number = (1 - Math.cos((Math.PI * m) / (half - 1))) / 2;
      const fromFirst: number = upper ? t : 1 - t;
      return lateralFirst ? 1 - fromFirst : fromFirst;
    };
    // a point of the fissure's outline, opened by `open` of the lid's arc and set `out` beyond the globe
    const lid = (
      s: number,
      upper: boolean,
      open: number,
      widen: number,
      out: number,
      gap: number = form.canthus,
    ): IAutoMovieVector3 => {
      const arc = (skew: number, power: number): number =>
        Math.pow(Math.sin(Math.PI * Math.pow(s, skew)), power);
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
    const loop = (
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
          const at: { u: number; v: number } = domain.locate(p);
          return free === null
            ? network.on(at.u, at.v)
            : network.free(`${free}.${side}.${k}`, domain.toModel(p), at);
        },
      );
    // the sulcus lies on the face: found over the domain from a point well in front of the globe
    const sulcus: AutoMovieHumanHeadNetwork.IPoint[] = loop(
      (s: number, upper: boolean) => {
        const p: IAutoMovieVector3 = lid(
          s,
          upper,
          upper ? form.sulcus.upper : form.sulcus.lower,
          form.sulcus.widen,
          0,
          form.sulcus.gap,
        );
        return AutoMovieHumanVector.of(p.x, p.y, frame.cornea.z + 10);
      },
      null,
    );
    const anterior: AutoMovieHumanHeadNetwork.IPoint[] = loop(
      (s: number, upper: boolean) => lid(s, upper, 1, 0, form.marginThickness),
      "lid.anterior",
    );
    const posterior: AutoMovieHumanHeadNetwork.IPoint[] = loop(
      (s: number, upper: boolean) =>
        lid(s, upper, form.posteriorOpen, -0.3, form.contact),
      "lid.posterior",
    );
    network.bands(
      [
        rim,
        network.between(rim, sulcus, form.orbit),
        sulcus,
        anterior,
        posterior,
      ],
      `eye.${side}`,
    );
  }
}

/** Allowance over the apex distance for the globe's sclera beside the cornea, millimetres: the scleral sphere of about 12 mm sits a millimetre in front of the centre of rotation. Derived from the eye module's globe. */
const GLOBE_ALLOWANCE: number = 0.6;

/** Least depth of a lid point in front of the eye's centre, over the sphere's radius, where the canthi lie beyond the globe's outline. Conventional. */
const MINIMUM_DEPTH: number = 0.25;
