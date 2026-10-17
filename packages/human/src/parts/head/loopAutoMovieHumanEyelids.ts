import { IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieHumanIdentity } from "../../structures/IAutoMovieHumanIdentity";
import { AutoMovieHumanHeadDomain } from "./AutoMovieHumanHeadDomain";
import { AutoMovieHumanHeadNetwork } from "./AutoMovieHumanHeadNetwork";
import { IAutoMovieHumanHeadForm } from "./IAutoMovieHumanHeadForm";
import { curveAutoMovieHumanOrbit } from "./curveAutoMovieHumanOrbit";

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
  const curve: ReturnType<typeof curveAutoMovieHumanOrbit> =
    curveAutoMovieHumanOrbit({
      frame,
      features,
      form,
      eyeRadius: domain.eyeRadius,
    });
  for (const side of ["left", "right"] as const) {
    const sign: number = side === "left" ? 1 : -1;
    const rim: AutoMovieHumanHeadNetwork.IPoint[] = props.rims[side];
    const half: number = rim.length / 2;
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
    const lid: typeof curve.lid = (
      ...args: Parameters<typeof curve.lid>
    ): IAutoMovieVector3 => {
      const p: IAutoMovieVector3 = curve.lid(...args);
      return { ...p, x: sign * p.x };
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
    // The field and this XY course consume one reference-relative definition.
    const envelope: AutoMovieHumanHeadNetwork.IPoint[] = loop(
      (s: number, upper: boolean): IAutoMovieVector3 => {
        const p: IAutoMovieVector3 = curve.envelope(s, upper);
        return { ...p, x: sign * p.x };
      },
      null,
    );
    const middle: AutoMovieHumanHeadNetwork.IPoint[] = rim.map(
      (
        point: AutoMovieHumanHeadNetwork.IPoint,
        k: number,
      ): AutoMovieHumanHeadNetwork.IPoint => {
        const a: IAutoMovieVector3 = network.point(point);
        const b: IAutoMovieVector3 = network.point(envelope[k]!);
        const at: { u: number; v: number } = domain.onFace(
          a.x + form.orbit * (b.x - a.x),
          a.y + form.orbit * (b.y - a.y),
        );
        return network.on(at.u, at.v);
      },
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
    network.bands([rim, middle, envelope, anterior, posterior], `eye.${side}`);
    network.ring(`orbit.opening.${side}`, rim);
    network.ring(`orbit.envelope.${side}`, envelope);
  }
}
