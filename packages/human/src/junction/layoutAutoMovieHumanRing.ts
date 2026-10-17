import { AutoMovieHumanoidBone, IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieHumanLandmarks } from "../measure/IAutoMovieHumanLandmarks";
import { AutoMovieHumanVector } from "../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanSkeleton } from "../skeleton/IAutoMovieHumanSkeleton";
import { AUTOMOVIE_HUMAN_ANKLE_SECTION } from "./AUTOMOVIE_HUMAN_ANKLE_SECTION";
import { AUTOMOVIE_HUMAN_RINGS } from "./AUTOMOVIE_HUMAN_RINGS";
import { AutoMovieHumanDirection } from "./AutoMovieHumanDirection";
import { AutoMovieHumanJunctionSite } from "./AutoMovieHumanJunctionSite";
import { AutoMovieHumanPart } from "./AutoMovieHumanPart";
import { AutoMovieHumanSide } from "./AutoMovieHumanSide";
import { IAutoMovieHumanRing } from "./IAutoMovieHumanRing";
import { IAutoMovieHumanRingDefinition } from "./IAutoMovieHumanRingDefinition";
import { IAutoMovieHumanRingLayout } from "./IAutoMovieHumanRingLayout";

/**
 * Resolve the frame and vertex directions of the ring one part opens at one junction site from the person's skeleton. A part opens the ring itself from `shapeAutoMovieHumanRing`, which adds the vertex positions both parts share.
 *
 * Each site's cut is fixed by the skeleton alone, so both parts of the site compute the same frame without seeing each other:
 *
 * - `neckBase`: the plane through cervicale and suprasternale that contains the transverse axis, the oblique plane in which the base of the neck rises from the jugular notch to the seventh cervical spine. Origin where the neck bone's axis crosses it.
 * - `neckTop`: the mandibular plane through both gonia and menton. In front it follows the lower border of the mandible, behind it passes below the skull base. Origin where the neck bone's axis crosses it.
 * - `upperArm`: perpendicular to the upper arm bone, through the point of its axis midway between the acromion and the elbow joint centre, where the upper arm circumference is measured (the olecranon lies at the elbow centre's level along the arm).
 * - `wrist`: perpendicular to the forearm bone, through the radial styloid's projection on its axis, where the wrist circumference is measured.
 * - `thigh`: perpendicular to the thigh bone, midway between the hip and knee joint centres, below the gluteal fold.
 * - `ankle`: perpendicular to the shank bone, at the minimum ankle section above both malleoli, the distance above sphyrion set by {@link AUTOMOVIE_HUMAN_ANKLE_SECTION}. Its level is fitted to reference minima, not a population measurement of minimum-girth height.
 * - `ear`: through tragion, the notch at the front of the auricle's attachment, with the lateral direction as its axis. The skeleton has no otobasion landmarks yet; the origin moves to the attachment's centre when it does.
 *
 * The site axis points from the proximal part into the distal one; the proximal part's normal follows it and the distal part's is reversed. The reference is the rest-pose direction of the site's start mark projected into the cut plane: +Z for anterior on the neck, the upper arm, the thigh and the ankle; -Y for the palmar surface of the wrist, because the T-pose palm faces down; +Y for the superior point of the ear.
 *
 * @param props.skeleton The person's skeleton at rest
 * @param props.site The junction site
 * @param props.side Side of a bilateral site, null for the neck sites
 * @param props.part The part opening the ring, the site's proximal or distal part
 * @returns The ring's count, start, frame and vertex directions for that part
 * @throws {Error} When the side does not match the site's laterality or the part does not meet at the site
 */
export const layoutAutoMovieHumanRing: (props: {
  skeleton: IAutoMovieHumanSkeleton;
  site: AutoMovieHumanJunctionSite;
  side: AutoMovieHumanSide | null;
  part: AutoMovieHumanPart;
}) => IAutoMovieHumanRingLayout = (props: {
  skeleton: IAutoMovieHumanSkeleton;
  site: AutoMovieHumanJunctionSite;
  side: AutoMovieHumanSide | null;
  part: AutoMovieHumanPart;
}): IAutoMovieHumanRingLayout => {
  const definition: IAutoMovieHumanRingDefinition =
    AUTOMOVIE_HUMAN_RINGS[props.site];
  if (definition.bilateral !== (props.side !== null))
    throw new Error(
      `junction site ${props.site} ${definition.bilateral ? "needs a side" : "has no side"}`,
    );
  if (props.part !== definition.proximal && props.part !== definition.distal)
    throw new Error(
      `part ${props.part} does not meet at junction site ${props.site}; it joins ${definition.proximal} to ${definition.distal}`,
    );
  const cut: ICut = cutSite(props.skeleton, props.site, props.side);
  const normal: IAutoMovieVector3 =
    props.part === definition.proximal
      ? cut.axis
      : AutoMovieHumanVector.of(-cut.axis.x, -cut.axis.y, -cut.axis.z);
  const reference: IAutoMovieVector3 = AutoMovieHumanVector.normalize(
    AutoMovieHumanVector.offset(cut.toward, [
      cut.axis,
      -AutoMovieHumanVector.dot(cut.toward, cut.axis),
    ]),
  );
  const binormal: IAutoMovieVector3 = AutoMovieHumanVector.cross(
    normal,
    reference,
  );
  const frame: IAutoMovieHumanRing.IFrame = {
    origin: cut.origin,
    normal,
    reference,
  };
  return {
    site: props.site,
    side: props.side,
    part: props.part,
    count: definition.count,
    start: definition.start,
    frame,
    directions: Array.from(
      { length: definition.count },
      (_: unknown, k: number): IAutoMovieVector3 => {
        const angle: number = (2 * Math.PI * k) / definition.count;
        return AutoMovieHumanVector.offset(
          AutoMovieHumanVector.of(0, 0, 0),
          [reference, Math.cos(angle)],
          [binormal, Math.sin(angle)],
        );
      },
    ),
  };
};

/** A site's cut before it is oriented for one part. */
interface ICut {
  /** Centre of the cut. */
  origin: IAutoMovieVector3;

  /** Unit axis from the proximal part into the distal one. */
  axis: IAutoMovieVector3;

  /** Rest-pose direction of the start mark, not yet projected into the cut plane. */
  toward: IAutoMovieVector3;
}

/** Rest-pose direction of each start mark a site uses, before projection. */
const TOWARD: Partial<Record<AutoMovieHumanDirection, IAutoMovieVector3>> = {
  anterior: AutoMovieHumanVector.of(0, 0, 1),
  superior: AutoMovieHumanVector.of(0, 1, 0),
};

/** The T-pose palm faces down, so the wrist's anterior, palmar surface faces -Y. */
const PALMAR: IAutoMovieVector3 = AutoMovieHumanVector.of(0, -1, 0);

const cutSite: (
  skeleton: IAutoMovieHumanSkeleton,
  site: AutoMovieHumanJunctionSite,
  side: AutoMovieHumanSide | null,
) => ICut = (
  skeleton: IAutoMovieHumanSkeleton,
  site: AutoMovieHumanJunctionSite,
  side: AutoMovieHumanSide | null,
): ICut => {
  const joint: (bone: AutoMovieHumanoidBone) => IAutoMovieVector3 = (
    bone: AutoMovieHumanoidBone,
  ): IAutoMovieVector3 => {
    const found: IAutoMovieHumanSkeleton.IJoint | undefined =
      skeleton.joints.find(
        (j: IAutoMovieHumanSkeleton.IJoint): boolean => j.bone === bone,
      );
    if (found === undefined) throw new Error(`skeleton lacks bone ${bone}`);
    return found.position;
  };
  const landmarks: IAutoMovieHumanLandmarks = skeleton.landmarks;
  const lateral: IAutoMovieHumanLandmarks.ISide =
    side === "right" ? landmarks.right : landmarks.left;
  const bone: (name: string) => AutoMovieHumanoidBone = (
    name: string,
  ): AutoMovieHumanoidBone => `${side}${name}` as AutoMovieHumanoidBone;
  const anterior: IAutoMovieVector3 = TOWARD.anterior!;
  switch (site) {
    case "neckBase":
      return {
        ...planeCut(
          joint("neck"),
          joint("head"),
          landmarks.cervicale.position,
          landmarks.suprasternale.position,
          AutoMovieHumanVector.offset(landmarks.cervicale.position, [
            AutoMovieHumanVector.of(1, 0, 0),
            1,
          ]),
        ),
        toward: anterior,
      };
    case "neckTop":
      return {
        ...planeCut(
          joint("neck"),
          joint("head"),
          landmarks.right.gonion.position,
          landmarks.left.gonion.position,
          landmarks.menton.position,
        ),
        toward: anterior,
      };
    case "upperArm": {
      const shoulder: IAutoMovieVector3 = joint(bone("UpperArm"));
      const elbow: IAutoMovieVector3 = joint(bone("LowerArm"));
      return {
        ...axisCut(
          shoulder,
          elbow,
          AutoMovieHumanVector.offset(
            AutoMovieHumanVector.of(0, 0, 0),
            [lateral.acromion.position, 0.5],
            [elbow, 0.5],
          ),
        ),
        toward: anterior,
      };
    }
    case "wrist":
      return {
        ...axisCut(
          joint(bone("LowerArm")),
          joint(bone("Hand")),
          lateral.stylion.position,
        ),
        toward: PALMAR,
      };
    case "thigh": {
      const hip: IAutoMovieVector3 = joint(bone("UpperLeg"));
      const knee: IAutoMovieVector3 = joint(bone("LowerLeg"));
      return {
        ...axisCut(
          hip,
          knee,
          AutoMovieHumanVector.offset(
            AutoMovieHumanVector.of(0, 0, 0),
            [hip, 0.5],
            [knee, 0.5],
          ),
        ),
        toward: anterior,
      };
    }
    case "ankle": {
      const knee: IAutoMovieVector3 = joint(bone("LowerLeg"));
      const ankle: IAutoMovieVector3 = joint(bone("Foot"));
      const height: number =
        lateral.sphyrion.position.y +
        AUTOMOVIE_HUMAN_ANKLE_SECTION.aboveSphyrion *
          lateral.lateralMalleolus.position.y;
      const axis: IAutoMovieVector3 = AutoMovieHumanVector.normalize(
        AutoMovieHumanVector.offset(ankle, [knee, -1]),
      );
      return {
        origin: AutoMovieHumanVector.offset(knee, [
          axis,
          (height - knee.y) / axis.y,
        ]),
        axis,
        toward: anterior,
      };
    }
    case "ear":
      return {
        origin: lateral.tragion.position,
        axis: AutoMovieHumanVector.of(side === "right" ? -1 : 1, 0, 0),
        toward: TOWARD.superior!,
      };
  }
};

/** Cut perpendicular to the bone from `from` to `to`, through the projection of `at` on its axis. */
const axisCut: (
  from: IAutoMovieVector3,
  to: IAutoMovieVector3,
  at: IAutoMovieVector3,
) => Omit<ICut, "toward"> = (
  from: IAutoMovieVector3,
  to: IAutoMovieVector3,
  at: IAutoMovieVector3,
): Omit<ICut, "toward"> => {
  const axis: IAutoMovieVector3 = AutoMovieHumanVector.normalize(
    AutoMovieHumanVector.offset(to, [from, -1]),
  );
  return {
    origin: AutoMovieHumanVector.offset(from, [
      axis,
      AutoMovieHumanVector.dot(
        AutoMovieHumanVector.offset(at, [from, -1]),
        axis,
      ),
    ]),
    axis,
  };
};

/**
 * Cut in the plane through three points, oriented along the bone from `from` to `to`, with its origin where that bone's axis crosses the plane.
 */
const planeCut: (
  from: IAutoMovieVector3,
  to: IAutoMovieVector3,
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
  c: IAutoMovieVector3,
) => Omit<ICut, "toward"> = (
  from: IAutoMovieVector3,
  to: IAutoMovieVector3,
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
  c: IAutoMovieVector3,
): Omit<ICut, "toward"> => {
  const bone: IAutoMovieVector3 = AutoMovieHumanVector.offset(to, [from, -1]);
  const raw: IAutoMovieVector3 = AutoMovieHumanVector.normalize(
    AutoMovieHumanVector.cross(
      AutoMovieHumanVector.offset(b, [a, -1]),
      AutoMovieHumanVector.offset(c, [a, -1]),
    ),
  );
  const axis: IAutoMovieVector3 =
    AutoMovieHumanVector.dot(raw, bone) < 0
      ? AutoMovieHumanVector.of(-raw.x, -raw.y, -raw.z)
      : raw;
  const t: number =
    AutoMovieHumanVector.dot(AutoMovieHumanVector.offset(a, [from, -1]), axis) /
    AutoMovieHumanVector.dot(bone, axis);
  return {
    origin: AutoMovieHumanVector.offset(from, [bone, t]),
    axis,
  };
};
