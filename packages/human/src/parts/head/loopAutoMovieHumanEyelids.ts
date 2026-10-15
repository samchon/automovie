import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanIdentity } from "../../structures/IAutoMovieHumanIdentity";
import { AutoMovieHumanHeadDomain } from "./AutoMovieHumanHeadDomain";
import { AutoMovieHumanHeadNetwork } from "./AutoMovieHumanHeadNetwork";

/**
 * Fill each eye's opening with the concentric loops of the lids, the fold lines of orbicularis oculi, from the opening's rim to the palpebral fissure.
 *
 * Every loop has the rim's thirty points: fifteen over the upper lid and fifteen under the lower, from canthus to canthus, the canthi being short edges where the two lids meet. From the rim inward:
 *
 * 1. The lid sulcus, on the face's surface: the upper lid's crease where the lid meets the orbit's roof and the lower lid's junction with the cheek, a lid's height beyond the margin.
 * 2. The anterior lid margin, resting on the eyeball: on the sphere about the eye's centre of rotation through the corneal apex, out by the lid margin's thickness, along the fissure's measured length and height.
 * 3. The posterior lid margin, where the lid touches the globe and the fissure opens onto the eyeball.
 *
 * The fissure runs from endocanthion, half the intercanthal width from the midline, to exocanthion one fissure length further out, rising by {@link CANTHAL_TILT} from the inner to the outer corner. The upper margin opens above the line of the canthi by {@link UPPER} of the fissure height and the lower below it by the rest, each arc fullest a little off the middle as the tarsal plates are (Gray 1918, "The Tarsi").
 *
 * @param props The domain, the network, the feature measurements and each opening's rim: fifteen points over the top from the middle of its side of lower `v` to the middle of the other side, then fifteen back under the bottom
 */
export function loopAutoMovieHumanEyelids(props: {
  domain: AutoMovieHumanHeadDomain;
  network: AutoMovieHumanHeadNetwork;
  features: IAutoMovieHumanIdentity.IFeatures;
  rims: Record<"left" | "right", AutoMovieHumanHeadNetwork.IPoint[]>;
}): void {
  const { domain, network, features } = props;
  const frame = domain.frame;
  const length: number = features.palpebralFissureLength;
  const height: number = features.palpebralFissureHeight;
  const inner: number = features.intercanthalWidth / 2;
  const eyeRadius: number = AutoMovieHumanVector.distance(frame.eye, frame.cornea) + GLOBE_ALLOWANCE;
  const rise: number = length * Math.tan(CANTHAL_TILT);
  for (const side of ["left", "right"] as const) {
    const sign: number = side === "left" ? 1 : -1;
    const rim: AutoMovieHumanHeadNetwork.IPoint[] = props.rims[side];
    const half: number = rim.length / 2;
    const eye: IAutoMovieVector3 = AutoMovieHumanVector.of(sign * frame.eye.x, frame.eye.y, frame.eye.z);
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
    const lid = (s: number, upper: boolean, open: number, widen: number, out: number, gap: number = CANTHUS): IAutoMovieVector3 => {
      const arc = (skew: number, power: number): number =>
        Math.pow(Math.sin(Math.PI * Math.pow(s, skew)), power);
      const x: number = inner - widen + (length + 2 * widen) * s;
      const y: number =
        level +
        rise * s +
        (upper ? UPPER * height * arc(0.9, 0.8) * open + gap : -(1 - UPPER) * height * arc(1.1, 0.9) * open - gap);
      const r: number = eyeRadius + out;
      const dx: number = x - frame.eye.x;
      const dy: number = y - eye.y;
      const z: number = eye.z + Math.sqrt(Math.max(r * r - dx * dx - dy * dy, (MINIMUM_DEPTH * r) ** 2));
      return AutoMovieHumanVector.of(sign * x, y, z);
    };
    const loop = (
      make: (s: number, upper: boolean) => IAutoMovieVector3,
      free: string | null,
    ): AutoMovieHumanHeadNetwork.IPoint[] =>
      Array.from({ length: rim.length }, (_: unknown, k: number): AutoMovieHumanHeadNetwork.IPoint => {
        const upper: boolean = k < half;
        const p: IAutoMovieVector3 = make(place(upper ? k : k - half, upper), upper);
        const at: { u: number; v: number } = domain.locate(p);
        return free === null ? network.on(at.u, at.v) : network.free(`${free}.${side}.${k}`, domain.toModel(p), at);
      });
    // the sulcus lies on the face: found over the domain from a point well in front of the globe
    const sulcus: AutoMovieHumanHeadNetwork.IPoint[] = loop((s: number, upper: boolean) => {
      const p: IAutoMovieVector3 = lid(s, upper, upper ? SULCUS.upper : SULCUS.lower, SULCUS.widen, 0, SULCUS.gap);
      return AutoMovieHumanVector.of(p.x, p.y, frame.cornea.z + 10);
    }, null);
    const anterior: AutoMovieHumanHeadNetwork.IPoint[] = loop(
      (s: number, upper: boolean) => lid(s, upper, 1, 0, MARGIN_THICKNESS),
      "lid.anterior",
    );
    const posterior: AutoMovieHumanHeadNetwork.IPoint[] = loop(
      (s: number, upper: boolean) => lid(s, upper, POSTERIOR_OPEN, -0.3, CONTACT),
      "lid.posterior",
    );
    network.bands([rim, network.between(rim, sulcus, ORBIT), sulcus, anterior, posterior], `eye.${side}`);
  }
}

/** Share of the way from the opening's rim to the lid sulcus at which the orbital loop runs. */
const ORBIT: number = 0.5;

/** Rise of exocanthion over endocanthion, radians: about 3 degrees, between the 0.8 to 2.4 of Caucasian and the 4.9 to 6.0 of Chinese young adults (Gao et al. 2025, periocular 3D photographs). Conventional pending a measured tilt in the identity. */
const CANTHAL_TILT: number = (3 * Math.PI) / 180;

/** Share of the fissure height above the line of the canthi at the pupil: the upper lid rests 1 to 2 mm over the iris and the lower at its lower edge. Conventional. */
const UPPER: number = 0.45;

/** Half the gap between the upper and lower margins at the canthi, so each canthus is a short edge, millimetres. Conventional. */
const CANTHUS: number = 0.3;

/** Thickness of the lid margin from its posterior edge on the globe to its anterior edge, millimetres: about 2 mm. Conventional pending a measured value. */
const MARGIN_THICKNESS: number = 2;

/** Gap left between the posterior margin and the globe, millimetres, so the eyeball never shows through the lid. Conventional. */
const CONTACT: number = 0.3;

/** How far the posterior margin closes over the anterior's opening, so the margin's thickness faces the fissure. */
const POSTERIOR_OPEN: number = 0.94;

/** The lid sulcus as multiples of the margin's opening, its widening beyond the canthi and its half-opening there, millimetres, so the loops round each canthus stay open rather than meeting in a crease. Conventional. */
const SULCUS = { upper: 1.9, lower: 2.0, widen: 4, gap: 2.5 } as const;

/** Allowance over the apex distance for the globe's sclera beside the cornea, millimetres: the scleral sphere of about 12 mm sits a millimetre in front of the centre of rotation. Derived from the eye module's globe. */
const GLOBE_ALLOWANCE: number = 0.6;

/** Least depth of a lid point in front of the eye's centre, over the sphere's radius, where the canthi lie beyond the globe's outline. Conventional. */
const MINIMUM_DEPTH: number = 0.25;
