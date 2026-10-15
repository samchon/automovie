import { IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieHumanMeasurements } from "../../measure/IAutoMovieHumanMeasurements";
import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanIdentity } from "../../structures/IAutoMovieHumanIdentity";
import { AutoMovieHumanHeadField } from "./AutoMovieHumanHeadField";
import { anchorAutoMovieHumanEyelids } from "./anchorAutoMovieHumanEyelids";
import { anchorAutoMovieHumanLips } from "./anchorAutoMovieHumanLips";
import { buildAutoMovieHumanHeadTopology } from "./buildAutoMovieHumanHeadTopology";
import { frameAutoMovieHumanHead } from "./frameAutoMovieHumanHead";
import { shapeAutoMovieHumanNose } from "./shapeAutoMovieHumanNose";

/**
 * Place the head cage's anchored vertices in the head frame: the feature loops and the box corners. The rings are anchored by the generator on the shared ring shapes.
 *
 * Everything else in the cage settles between these by relaxation over the skin, so these are the head's semantic coordinates: every one is set from a landmark or a measurement, never from a vertex of another person.
 *
 * - Eyes: the eye module's loops and pockets ({@link anchorAutoMovieHumanEyelids}).
 * - Mouth: the mouth module's loops and pocket ({@link anchorAutoMovieHumanLips}).
 * - Nostrils: each pocket's centre inside its ala ({@link shapeAutoMovieHumanNose}).
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
  const v = AutoMovieHumanVector.of;
  const anchors: Map<number, IAutoMovieVector3> = new Map();
  const centre: IAutoMovieVector3 = v(0, 0.1 * head.headHeight, 0);
  const onSkin = (p: IAutoMovieVector3): IAutoMovieVector3 =>
    field.project(centre, AutoMovieHumanVector.offset(p, [centre, -1]));
  /** The skin straight in front of a frontal-plane point. */
  const front = (x: number, y: number): IAutoMovieVector3 =>
    field.project(v(x, y, 0), v(0, 0, 1));

  // the eyes, the lips and the nostrils: their modules place their own regions
  for (const anchored of [
    anchorAutoMovieHumanEyelids({
      topology,
      front,
      frame,
      features: head.features,
    }),
    anchorAutoMovieHumanLips({ topology, front, frame, head }),
  ])
    for (const [vertex, position] of anchored) anchors.set(vertex, position);
  shapeAutoMovieHumanNose(frame, head).nostrils.forEach(
    (p: IAutoMovieVector3, i: number): void => {
      anchors.set(topology.nostrils[i]!, p);
    },
  );

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
