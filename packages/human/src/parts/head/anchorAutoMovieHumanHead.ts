import { IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieHumanMeasurements } from "../../measure/IAutoMovieHumanMeasurements";
import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanIdentity } from "../../structures/IAutoMovieHumanIdentity";
import { AutoMovieHumanHeadField } from "./AutoMovieHumanHeadField";
import { buildAutoMovieHumanHeadTopology } from "./buildAutoMovieHumanHeadTopology";
import { frameAutoMovieHumanHead } from "./frameAutoMovieHumanHead";

/**
 * Place the head cage's anchored vertices in the head frame: the feature loops and the box corners. The rings are anchored by the generator on the shared ring shapes.
 *
 * Everything else in the cage settles between these by relaxation over the skin, so these are the head's semantic coordinates: every one is set from a landmark or a measurement, never from a vertex of another person.
 *
 * - Eyes: the orbital rim on the skin around the eye; the lid sulcus, the lid margin and its inner edge on spheres about the eyeball's centre a lid's thickness out, the margin tracing the palpebral fissure from endocanthion to exocanthion. This is the neutral eye region the eye module refines.
 * - Mouth: the outer lip border along the nose base and the labiomental fold, the vermilion border with its cupid's bow, the lip crest and the closed inner edge. This is the neutral mouth region the mouth module refines.
 * - Box corners: the zygomatic prominences, the frontal eminences, the parietal eminences and the occiput behind the mastoids.
 *
 * @param props Topology, field, frame and measurements
 * @returns Local position of every anchored vertex, by vertex index
 */
export function anchorAutoMovieHumanHead(props: {
  topology: buildAutoMovieHumanHeadTopology.ITopology;
  field: AutoMovieHumanHeadField;
  frame: frameAutoMovieHumanHead.IFrame;
  measurements: IAutoMovieHumanMeasurements;
}): Map<number, IAutoMovieVector3> {
  const { topology, field, frame } = props;
  const head: IAutoMovieHumanIdentity.IHead = props.measurements.identity.head;
  const fh: number = head.faceHeight;
  const fw: number = head.faceWidth;
  const v = AutoMovieHumanVector.of;
  const anchors: Map<number, IAutoMovieVector3> = new Map();
  const centre: IAutoMovieVector3 = v(0, 0.1 * head.headHeight, 0);
  const onSkin = (p: IAutoMovieVector3): IAutoMovieVector3 =>
    field.project(centre, AutoMovieHumanVector.offset(p, [centre, -1]));
  /** The skin straight in front of a frontal-plane point. */
  const front = (x: number, y: number): IAutoMovieVector3 =>
    field.project(v(x, y, 0), v(0, 0, 1));

  // eyes
  const fissure: number = EYE.fissureWidth * fw;
  const radius: number = AutoMovieHumanVector.distance(frame.eye, frame.cornea);
  for (const [feature, sign] of [["leftEye", 1], ["rightEye", -1]] as const) {
    const loops: number[][] = topology.loops[feature];
    const eye: IAutoMovieVector3 = v(sign * frame.eye.x, frame.eye.y, frame.eye.z);
    const rim: number[] = loops[0]!;
    rim.forEach((outer: number, i: number): void => {
      const [lateral, up] = topology.rims[feature][i]!;
      const angle: number = Math.atan2(up, lateral);
      const c: number = Math.cos(angle);
      const s: number = Math.sin(angle);
      const along = (a: number, b: number): number => (c >= 0 ? a : b) * c;
      // orbital rim, on the skin
      anchors.set(
        outer,
        front(
          eye.x + sign * along(0.72 * fissure, 0.62 * fissure),
          eye.y + (s >= 0 ? 0.62 : 0.6) * fissure * s,
        ),
      );
      // lid sulcus, lid margin and inner edge, on spheres about the eyeball
      const margin = (): [number, number] => {
        const x: number = 0.5 * fissure * c;
        const tilt: number = EYE.canthalTilt * fissure * c;
        const open: number =
          s >= 0
            ? EYE.upperMargin * fissure * Math.pow(Math.abs(s), 0.8)
            : -EYE.lowerMargin * fissure * Math.pow(Math.abs(s), 0.9);
        return [x, tilt + open];
      };
      const [mx, my] = margin();
      const lid = (x: number, y: number, out: number): IAutoMovieVector3 => {
        const px: number = eye.x + sign * x;
        const py: number = eye.y + y;
        const r: number = radius + out;
        const dx: number = px - eye.x;
        const dy: number = py - eye.y;
        const z: number = eye.z + Math.sqrt(Math.max(0, r * r - dx * dx - dy * dy));
        return v(px, py, z);
      };
      // the lid sulcus on the skin, where the lid meets the orbit
      anchors.set(
        loops[1]![i]!,
        front(eye.x + sign * 1.15 * mx, eye.y + 1.45 * my + (s >= 0 ? 0.08 : -0.04) * fissure),
      );
      anchors.set(loops[2]![i]!, lid(mx, my, 1.4));
      anchors.set(loops[3]![i]!, lid(0.97 * mx, 0.8 * my, 0.2));
      // the pocket behind the lids, inside the eyeball's volume so the eyeball covers it
      anchors.set(loops[4]![i]!, lid(0.85 * mx, 0.5 * my, -0.25 * radius));
    });
    for (const { vertex, offset } of topology.pockets[feature])
      anchors.set(vertex, v(eye.x + sign * 0.3 * fissure * offset[0], eye.y, eye.z + 0.5 * radius));
  }

  // mouth
  const half: number = MOUTH.width * fw * 0.5;
  const snY: number = frame.menton.y + 0.567 * fh;
  const sto: IAutoMovieVector3 = frame.stomion;
  const mouth: number[][] = topology.loops.mouth;
  mouth[0]!.forEach((outer: number, i: number): void => {
    const [dx, dy] = topology.rims.mouth[i]!;
    const ax: number = Math.abs(dx);
    const rimX: number =
      dy > 0 ? dx * 0.75 * half : dy < 0 ? dx * 0.85 * half : Math.sign(dx) * 1.3 * half;
    const rimY: number =
      dy > 0 ? snY + 0.015 * fh * ax : dy < 0 ? sto.y - 0.15 * fh + 0.01 * fh * ax : sto.y;
    anchors.set(outer, front(rimX, rimY));
    const bow: number = dy === 0 ? 1 : ax < 0.2 ? 0 : ax < 0.5 ? 0.26 : ax < 0.8 ? 0.6 : 0.85;
    const x: number = dy === 0 ? Math.sign(dx) * half : Math.sign(dx) * half * bow;
    const height: number =
      dy > 0
        ? MOUTH.upperVermilion * fh * (ax < 0.2 ? 0.9 : ax < 0.5 ? 1 : ax < 0.8 ? 0.7 : 0.35)
        : dy < 0
          ? -MOUTH.lowerVermilion * fh * (ax < 0.2 ? 1 : ax < 0.5 ? 0.97 : ax < 0.8 ? 0.75 : 0.35)
          : 0;
    const bulge: number = MOUTH.protrusion * fh * (1 - (x / half) ** 2);
    const base = (px: number, py: number, out: number): IAutoMovieVector3 => {
      const p: IAutoMovieVector3 = front(px, py);
      return v(p.x, p.y, p.z + out);
    };
    anchors.set(mouth[1]![i]!, base(x, sto.y + height, 0.6 * bulge));
    anchors.set(mouth[2]![i]!, base(0.98 * x, sto.y + 0.5 * height, bulge));
    anchors.set(
      mouth[3]![i]!,
      base(0.95 * x, sto.y + Math.sign(height) * 0.004 * fh, bulge - 0.025 * fh),
    );
    // the pocket behind the closed lips, where the mouth's interior will open
    anchors.set(
      mouth[4]![i]!,
      base(0.85 * x, sto.y + Math.sign(height) * 0.012 * fh, bulge - 0.07 * fh),
    );
  });

  for (const { vertex, offset } of topology.pockets.mouth)
    anchors.set(vertex, (() => {
      const p: IAutoMovieVector3 = front(0.6 * half * offset[0], sto.y);
      return v(p.x, p.y, p.z - 0.1 * fh);
    })());

  // box corners
  const B: number = props.measurements.headBreadth / 2;
  const corner = (
    pair: [number, number],
    x: number,
    y: number,
    z: number,
  ): void => {
    anchors.set(pair[0], onSkin(v(x, y, z)));
    anchors.set(pair[1], onSkin(v(-x, y, z)));
  };
  corner(
    topology.corners.cheek,
    0.75 * frame.zygion.x,
    (frame.zygion.y + frame.eye.y) / 2 - 0.08 * fh,
    frame.zygion.z + 0.15 * fh,
  );
  corner(
    topology.corners.occiput,
    0.68 * B,
    frame.tragion.y - 0.12 * head.headHeight,
    0.6 * frame.opisthocranion.z,
  );
  corner(
    topology.corners.temple,
    0.92 * frame.frontotemporale.x,
    frame.glabella.y + 0.38 * (frame.vertex.y - frame.glabella.y),
    frame.frontotemporale.z,
  );
  corner(
    topology.corners.parietal,
    0.8 * B,
    frame.eurion.y + 0.35 * (frame.vertex.y - frame.eurion.y),
    0.5 * frame.opisthocranion.z,
  );
  return anchors;
}

/** Eye proportions of the 3D Facial Norms adult means over face width, and the fissure's shape. Grade: derived, the eye module replaces them. */
const EYE = {
  /** Palpebral fissure en-ex over face width: 28.8 / 137.6 and 27.8 / 129.8. */
  fissureWidth: 0.21,
  /** Upper lid margin above the pupil over fissure width. */
  upperMargin: 0.17,
  /** Lower lid margin below the pupil over fissure width. */
  lowerMargin: 0.2,
  /** Rise of exocanthion over endocanthion, over fissure width, about four degrees. */
  canthalTilt: 0.035,
};

/** Mouth proportions of the 3D Facial Norms adult means over face width and face height. Grade: derived, the mouth module replaces them. */
const MOUTH = {
  /** Mouth width ch-ch over face width: 50.9 / 137.6 and 48.1 / 129.8. */
  width: 0.37,
  /** Upper vermilion ls-sto over face height: 7.5 / 127.2. */
  upperVermilion: 0.059,
  /** Lower vermilion sto-li over face height: 8.7 / 127.2. */
  lowerVermilion: 0.068,
  /** Forward bulge of the lips over the base surface, over face height. */
  protrusion: 0.015,
};
