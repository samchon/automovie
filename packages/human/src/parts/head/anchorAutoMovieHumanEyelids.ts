import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanIdentity } from "../../structures/IAutoMovieHumanIdentity";
import { buildAutoMovieHumanHeadTopology } from "./buildAutoMovieHumanHeadTopology";
import { frameAutoMovieHumanHead } from "./frameAutoMovieHumanHead";

/**
 * The eye module: place each eye's five loops and pocket floor, the region of the face surface that forms the lids.
 *
 * The palpebral fissure runs from endocanthion, half the intercanthal width from the midline, to exocanthion one fissure length further out, rising by {@link CANTHAL_TILT} from the inner to the outer corner. The upper lid margin opens above the line through the corners by {@link UPPER} of the fissure height and the lower below it by the rest, each arc fullest a little off the middle as the tarsal plates are (Gray 1918, "The Tarsi"). The loops, outermost first:
 *
 * 1. The orbital rim, on the skin around the orbit.
 * 2. The lid sulcus, on the skin where the lids meet the orbit.
 * 3. The lid margin, on a sphere about the eyeball's centre a lid's thickness beyond the cornea's radius, so the lids drape over the globe.
 * 4. The margin's inner edge, tucked back against the globe.
 * 5. The pocket's wall, inside the globe's volume, so the eyeball, a separate mesh on the eye bone, covers the pocket and shows through the fissure.
 *
 * @param props Topology, the skin in front of a frontal-plane point, the head frame and the feature measurements
 * @returns Local position of every eye loop and pocket vertex, by vertex index
 */
export function anchorAutoMovieHumanEyelids(props: {
  topology: buildAutoMovieHumanHeadTopology.ITopology;
  front: (x: number, y: number) => IAutoMovieVector3;
  frame: frameAutoMovieHumanHead.IFrame;
  features: IAutoMovieHumanIdentity.IFeatures;
}): Map<number, IAutoMovieVector3> {
  const { topology, frame, features } = props;
  const v = AutoMovieHumanVector.of;
  const anchors: Map<number, IAutoMovieVector3> = new Map();
  const length: number = features.palpebralFissureLength;
  const height: number = features.palpebralFissureHeight;
  const inner: number = features.intercanthalWidth / 2;
  const radius: number = AutoMovieHumanVector.distance(frame.eye, frame.cornea);
  const rise: number = length * Math.tan(CANTHAL_TILT);
  for (const [feature, sign] of [
    ["leftEye", 1],
    ["rightEye", -1],
  ] as const) {
    const loops: number[][] = topology.loops[feature];
    const eye: IAutoMovieVector3 = v(
      sign * frame.eye.x,
      frame.eye.y,
      frame.eye.z,
    );
    const middle: number = inner + length / 2;
    // the fissure's corners straddle the pupil's level
    const level: number = frame.eye.y - rise / 2;
    loops[0]!.forEach((outer: number, i: number): void => {
      const [lateral, up] = topology.rims[feature][i]!;
      const angle: number = Math.atan2(up, lateral);
      const c: number = Math.cos(angle);
      const s: number = Math.sin(angle);
      // the orbital rim, wider laterally where the orbit opens toward the temple
      anchors.set(
        outer,
        props.front(
          sign * (middle + (c >= 0 ? 0.72 : 0.62) * length * c),
          frame.eye.y + (s >= 0 ? 0.62 : 0.6) * length * s,
        ),
      );
      // the lid margin, from endocanthion (c = -1) over the lid to exocanthion (c = 1)
      const t: number = (1 + c) / 2;
      const arc = (skew: number, power: number): number =>
        Math.pow(Math.sin(Math.PI * Math.pow(t, skew)), power);
      const x: number = inner + length * t;
      const y: number =
        level +
        rise * t +
        (s >= 0
          ? UPPER * height * arc(0.9, 0.8)
          : -(1 - UPPER) * height * arc(1.1, 0.9));
      const lid = (dx: number, dy: number, out: number): IAutoMovieVector3 => {
        const px: number = sign * (middle + (x - middle) * dx);
        const py: number = frame.eye.y + (y - frame.eye.y) * dy;
        const r: number = radius + out;
        const ox: number = px - eye.x;
        const oy: number = py - eye.y;
        return v(
          px,
          py,
          eye.z + Math.sqrt(Math.max(0, r * r - ox * ox - oy * oy)),
        );
      };
      // the lid sulcus on the skin, a step beyond the margin
      const sulcus: IAutoMovieVector3 = lid(1.15, 1.45, 0);
      anchors.set(
        loops[1]![i]!,
        props.front(sulcus.x, sulcus.y + (s >= 0 ? 0.08 : -0.04) * length),
      );
      anchors.set(loops[2]![i]!, lid(1, 1, LID * radius));
      anchors.set(loops[3]![i]!, lid(0.97, 0.8, 0.02 * radius));
      anchors.set(loops[4]![i]!, lid(0.85, 0.5, -0.25 * radius));
    });
    for (const { vertex, offset } of topology.pockets[feature])
      anchors.set(
        vertex,
        v(eye.x + sign * 0.3 * length * offset[0], eye.y, eye.z + 0.5 * radius),
      );
  }
  return anchors;
}

/** Rise of exocanthion over endocanthion, radians: about 3 degrees, between the 0.8 to 2.4 of Caucasian and the 4.9 to 6.0 of Chinese young adults (Gao et al. 2025, periocular 3D photographs). Conventional pending a measured tilt in the identity. */
const CANTHAL_TILT: number = (3 * Math.PI) / 180;

/** Share of the fissure height above the line of the canthi at the pupil: the upper lid rests 1 to 2 mm over the iris and the lower at its lower edge. Conventional. */
const UPPER: number = 0.45;

/** Thickness of the lid over the globe at its margin, over the cornea's radius: about 1.5 mm. Conventional. */
const LID: number = 0.12;
