import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanIdentity } from "../../structures/IAutoMovieHumanIdentity";
import { AutoMovieHumanHeadDomain } from "./AutoMovieHumanHeadDomain";
import { AutoMovieHumanHeadNetwork } from "./AutoMovieHumanHeadNetwork";

/**
 * Fill the mouth's opening with the concentric loops of the lips, the fold lines of orbicularis oris, from the opening's rim to the closed lips' meeting line and a pocket behind it.
 *
 * Every loop has the rim's thirty-four points: seventeen along the upper lip and seventeen along the lower, from commissure to commissure, each commissure a short edge where the lips meet. From the rim inward:
 *
 * 1. The vermilion border, on the face's surface: cheilion to cheilion through the cupid's bow, whose peaks are the crista philtri points {@link PHILTRUM} of the mouth width apart, labiale superius the upper vermilion height above stomion and labiale inferius the lower one below.
 * 2. The meeting line of the closed lips at stomion, folded a little back from the lips' surface.
 * 3. The pocket's wall behind the lips, where the mouth's interior opens when the jaw drops.
 *
 * A strip of quads closes the pocket between its upper and lower walls, so the surface stays closed while the lips are.
 *
 * @param props The domain, the network, the head measurements and the opening's rim: seventeen points over the top from the middle of its side of lower `v`, the person's left, to the middle of the other side, then seventeen back under the bottom
 */
export function loopAutoMovieHumanLips(props: {
  domain: AutoMovieHumanHeadDomain;
  network: AutoMovieHumanHeadNetwork;
  head: IAutoMovieHumanIdentity.IHead;
  rim: AutoMovieHumanHeadNetwork.IPoint[];
}): void {
  const { domain, network, head, rim } = props;
  const frame = domain.frame;
  const features: IAutoMovieHumanIdentity.IFeatures = head.features;
  const half: number = rim.length / 2;
  const width: number = features.mouthWidth / 2;
  const stomion: number = frame.stomion.y;
  // x across the run of `half` points: from the person's left (+x) over the upper lip, back from the right under the lower
  const across = (m: number, upper: boolean): number => {
    const x: number = width * Math.cos((Math.PI * m) / (half - 1));
    return upper ? x : -x;
  };
  const border = (x: number, upper: boolean): number => {
    const t: number = Math.min(1, Math.abs(x) / width);
    if (!upper) return stomion - COMMISSURE - features.lowerVermilionHeight * Math.pow(1 - t * t, 0.55);
    const bow: number = 0.9 + 0.14 * Math.exp(-(((t - PHILTRUM) / 0.14) ** 2));
    return stomion + COMMISSURE + features.upperVermilionHeight * Math.pow(1 - Math.pow(t, 2.2), 0.6) * bow;
  };
  const surface = (x: number, y: number): { at: { u: number; v: number }; p: IAutoMovieVector3 } => {
    const at: { u: number; v: number } = domain.locate(AutoMovieHumanVector.of(x, y, domain.profile.front(y) + 5));
    return { at, p: domain.point(at.u, at.v) };
  };
  const vermilion: AutoMovieHumanHeadNetwork.IPoint[] = rim.map((_: AutoMovieHumanHeadNetwork.IPoint, k: number) => {
    const upper: boolean = k < half;
    const x: number = across(upper ? k : k - half, upper);
    const { at } = surface(x, border(x, upper));
    return network.on(at.u, at.v);
  });
  const inside = (name: string, back: number, open: number, narrow: number): AutoMovieHumanHeadNetwork.IPoint[] =>
    rim.map((_: AutoMovieHumanHeadNetwork.IPoint, k: number) => {
      const upper: boolean = k < half;
      const x: number = narrow * across(upper ? k : k - half, upper);
      const y: number = stomion + (upper ? open : -open);
      const { at, p } = surface(x, y);
      return network.free(`${name}.${k}`, domain.toModel(AutoMovieHumanVector.of(p.x, p.y, p.z - back)), at);
    });
  const meeting: AutoMovieHumanHeadNetwork.IPoint[] = inside("lips.meeting", MEETING.back, MEETING.open, MEETING.narrow);
  const pocket: AutoMovieHumanHeadNetwork.IPoint[] = inside("lips.pocket", POCKET.back, POCKET.open, POCKET.narrow);
  const forward: boolean = network.bands([rim, network.between(rim, vermilion, ORBICULARIS), vermilion, meeting, pocket], "mouth");
  // close the pocket: upper point k faces lower point half - 1 - k
  const lower = (k: number): AutoMovieHumanHeadNetwork.IPoint => pocket[half + (half - 1 - k)]!;
  for (let k: number = 0; k + 1 < half; ++k) {
    const q: [AutoMovieHumanHeadNetwork.IPoint, AutoMovieHumanHeadNetwork.IPoint, AutoMovieHumanHeadNetwork.IPoint, AutoMovieHumanHeadNetwork.IPoint] = [
      pocket[k]!,
      pocket[k + 1]!,
      lower(k + 1),
      lower(k),
    ];
    network.quad(forward ? q : [q[0], q[3], q[2], q[1]], "mouth", false);
  }
}

/** Share of the way from the opening's rim to the vermilion border at which the loop of orbicularis oris runs. */
const ORBICULARIS: number = 0.5;

/** Philtrum width over mouth width: crista philtri 13.3 and 11.8 mm apart over mouths of 50.9 and 48.1 mm (3D Facial Norms; Weinberg et al. 2016). Grade: derived. */
const PHILTRUM: number = 0.26;

/** Half the gap between the vermilion borders at each commissure, so the commissure is a short edge, millimetres. Conventional. */
const COMMISSURE: number = 0.5;

/** The meeting line behind the lips' surface, its half-opening and its width over the mouth's, millimetres and a share. Conventional. */
const MEETING = { back: 1.5, open: 0.25, narrow: 0.97 } as const;

/** The pocket's wall behind the lips, its half-opening and its width over the mouth's. Conventional. */
const POCKET = { back: 8, open: 2.5, narrow: 0.85 } as const;
