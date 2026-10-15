import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanIdentity } from "../../structures/IAutoMovieHumanIdentity";
import { buildAutoMovieHumanHeadTopology } from "./buildAutoMovieHumanHeadTopology";
import { frameAutoMovieHumanHead } from "./frameAutoMovieHumanHead";

/**
 * The mouth module: place the mouth's five loops and pocket floor, the region of the face surface that forms the closed lips.
 *
 * The loops, outermost first:
 *
 * 1. The outer lip border: along the nose base between the alar bases above, out beside the modioli at the corners, and through the labiomental fold below.
 * 2. The vermilion border: cheilion to cheilion through the cupid's bow, whose peaks are the crista philtri points {@link PHILTRUM} of the mouth width apart, labiale superius the upper vermilion height above stomion and labiale inferius the lower one below.
 * 3. The lip crest, halfway, the vermilion's most forward line.
 * 4. The closed lips' meeting line at stomion.
 * 5. The pocket's wall behind the lips, where the mouth's interior opens when the jaw drops.
 *
 * @param props Topology, the skin in front of a frontal-plane point, the head frame and measurements
 * @returns Local position of every mouth loop and pocket vertex, by vertex index
 */
export function anchorAutoMovieHumanLips(props: {
  topology: buildAutoMovieHumanHeadTopology.ITopology;
  front: (x: number, y: number) => IAutoMovieVector3;
  frame: frameAutoMovieHumanHead.IFrame;
  head: IAutoMovieHumanIdentity.IHead;
}): Map<number, IAutoMovieVector3> {
  const { topology, frame, head } = props;
  const features: IAutoMovieHumanIdentity.IFeatures = head.features;
  const fh: number = head.faceHeight;
  const v = AutoMovieHumanVector.of;
  const anchors: Map<number, IAutoMovieVector3> = new Map();
  const half: number = features.mouthWidth / 2;
  const sto: number = frame.stomion.y;
  const subnasale: number = frame.menton.y + SUBNASALE_HEIGHT * fh;
  const fold: number = sto - LOWER_LIP * fh;
  const alar: number = 0.45 * features.noseWidth;
  const bulge: number = PROTRUSION * fh;
  const at = (x: number, y: number, out: number): IAutoMovieVector3 => {
    const p: IAutoMovieVector3 = props.front(x, y);
    return v(p.x, p.y, p.z + out);
  };
  const loops: number[][] = topology.loops.mouth;
  loops[0]!.forEach((outer: number, i: number): void => {
    const [dx, dy] = topology.rims.mouth[i]!;
    const ax: number = Math.abs(dx);
    const side: number = Math.sign(dx);
    anchors.set(
      outer,
      dy > 0
        ? props.front(dx * alar, subnasale + 0.015 * fh * ax)
        : dy < 0
          ? props.front(dx * 0.85 * half, fold + 0.01 * fh * ax)
          : props.front(side * 1.3 * half, sto),
    );
    // place along the vermilion border: the midline, the bow's peak, its slope and the corner's approach
    const bow: number =
      dy === 0 ? 1 : ax < 0.2 ? 0 : ax < 0.5 ? PHILTRUM : ax < 0.8 ? 0.6 : 0.85;
    const x: number = side * half * bow;
    const rise: number =
      dy > 0
        ? features.upperVermilionHeight *
          (ax < 0.2 ? 0.9 : ax < 0.5 ? 1 : ax < 0.8 ? 0.7 : 0.35)
        : dy < 0
          ? -1 *
            features.lowerVermilionHeight *
            (ax < 0.2 ? 1 : ax < 0.5 ? 0.97 : ax < 0.8 ? 0.75 : 0.35)
          : 0;
    const out: number = bulge * (1 - (x / half) ** 2);
    anchors.set(loops[1]![i]!, at(x, sto + rise, 0.6 * out));
    anchors.set(loops[2]![i]!, at(0.98 * x, sto + 0.5 * rise, out));
    anchors.set(
      loops[3]![i]!,
      at(0.95 * x, sto + Math.sign(rise) * 0.004 * fh, out - 0.025 * fh),
    );
    anchors.set(
      loops[4]![i]!,
      at(0.85 * x, sto + Math.sign(rise) * 0.012 * fh, out - 0.07 * fh),
    );
  });
  for (const { vertex, offset } of topology.pockets.mouth)
    anchors.set(vertex, at(0.6 * half * offset[0], sto, -0.1 * fh));
  return anchors;
}

/** Philtrum width over mouth width: crista philtri 13.3 and 11.8 mm apart over mouths of 50.9 and 48.1 mm (3D Facial Norms; Weinberg et al. 2016). Grade: derived. */
const PHILTRUM: number = 0.26;

/** Forward bulge of the lips over the face mass, over face height; the lips' own curvature is the vermilion loops'. Conventional. */
const PROTRUSION: number = 0.015;

/** Subnasale above menton over face height: lower face height 73.1 and 66.4 mm over 127.2 and 118.6 mm (3D Facial Norms). Grade: derived. */
const SUBNASALE_HEIGHT: number = 0.567;

/** The labiomental fold below stomion over face height: lower lip height sto-sl 19.2 mm over 127.2 mm (3D Facial Norms). Grade: derived. */
const LOWER_LIP: number = 0.15;
