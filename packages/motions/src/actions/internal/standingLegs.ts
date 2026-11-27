import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFoot } from "../../posture/HumanFoot";
import { HumanFrame } from "../../posture/HumanFrame";

/** The record of `IFixedEntryItem`'s site. */
type IFixedEntryItem = {
  /** The fixed toe-out heading in degrees. */
  yaw: number;

  /** The heading quaternion prepared from the same yaw and toe-out. */
  rotation: IAutoMovieQuaternion;

  /** The unchanged body's local metatarsophalangeal offset, metres. */
  contact: IAutoMovieVector3;

  /** Original nested knee-frame transforms with only the root varying. */
  knee: (root: IAutoMovieVector3) => IAutoMovieVector3;
};

/**
 * Write the standing law's planted leg goals, either directly for one query or
 * with its fixed-yaw foot metadata supplied by prepareStandingLegs.
 *
 * @param body The unchanged body.
 * @param root Current rig origin, world metres.
 * @param yaw Current standing heading, degrees about +Y.
 * @param feet Current ankle targets, world metres.
 * @param toeOut The standing law's outward progression angle, degrees.
 * @param fixed Optional metadata from the same body/yaw/toeOut preparation.
 * @returns Fresh knee goals, foot rotations and contact vectors.
 */
export function standingLegs(
  body: IAutoMovieMotionHumanBody,
  root: IAutoMovieVector3,
  yaw: number,
  feet: Record<AutoMovieHumanSide, IAutoMovieVector3>,
  toeOut: number,
  fixed?: Readonly<Record<AutoMovieHumanSide, IFixedEntryItem>>,
): IAutoMovieMotionHumanPosture["limbs"] {
  const limbs: IAutoMovieMotionHumanPosture["limbs"] = {};
  for (const side of ["left", "right"] as const) {
    const prepared: NonNullable<typeof fixed>["left"] | undefined =
      fixed?.[side];
    const heading: number =
      prepared?.yaw ?? yaw + (side === "left" ? toeOut : -toeOut);
    limbs[`${side}Leg`] = {
      point: feet[side],
      bend:
        prepared === undefined
          ? HumanFrame.point(
              {
                origin: HumanFrame.point(
                  { origin: root, yaw },
                  body.rest.get(`${side}LowerLeg`)!,
                ),
                yaw: heading,
              },
              { x: 0, y: 0, z: 1 },
            )
          : prepared.knee(root),
      rotation:
        prepared === undefined
          ? HumanFrame.turn(heading)
          : { ...prepared.rotation },
      planted: true,
      contact:
        prepared === undefined
          ? HumanFoot.offset(body, side, "mtp")
          : { ...prepared.contact },
    };
  }
  return limbs;
}
