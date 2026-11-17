import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import type { IHumanPosture } from "../posture/IHumanPosture";

/**
 * Write the standing law's planted leg goals, either directly for one query
 * or with its fixed-yaw foot metadata supplied by prepareStandingLegs.
 *
 * @param body The unchanged body.
 * @param root Current rig origin, world metres.
 * @param yaw Current standing heading, degrees about +Y.
 * @param feet Current ankle targets, world metres.
 * @param toeOut The standing law's outward progression angle, degrees.
 * @param fixed Optional metadata from the same body/yaw/toeOut preparation.
 * @returns Fresh knee goals, foot rotations and contact vectors.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States direct/prepared inputs, world-metre and degree units, matching metadata premise and fresh output ownership.
 * @evidence contracts/development/implementation.md#principled-implementation Keeps the original two nested floor-frame transforms for each knee, the foot's +Y heading turn and its canonical metatarsophalangeal contact.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One ordered two-side writer serves direct calls and the fixed-yaw factory, so each goal rule has one owner.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No root, heading, toe-out, knee point, contact or planted flag is changed; prepared metadata must describe exactly these same fixed inputs.
 * @evidence contracts/development/implementation.md#efficient-algorithms Direct calls retain the original frame/rotation/contact constructions without allocating a preparation closure or fixed-foot records. Prepared calls share fixed trigonometry/products but retain both knee-transform addition stages and fresh outward vectors.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Only a matching unchanged body/yaw/toeOut preparation shares foot rotations/contacts and knee-frame coefficients; changing roots and ankle targets are always read independently, without storing a knee point.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The call owns only fresh goals and vectors and retains no preparation, body cache, evaluated pose or query history.
 */
export function standingLegs(
  body: IHumanBody,
  root: IAutoMovieVector3,
  yaw: number,
  feet: Record<"left" | "right", IAutoMovieVector3>,
  toeOut: number,
  fixed?: Readonly<
    Record<
      "left" | "right",
      {
        /** The fixed toe-out heading in degrees. */
        yaw: number;

        /** The heading quaternion prepared from the same yaw and toe-out. */
        rotation: IAutoMovieQuaternion;

        /** The unchanged body's local metatarsophalangeal offset, metres. */
        contact: IAutoMovieVector3;

        /** Original nested knee-frame transforms with only the root varying. */
        knee: (root: IAutoMovieVector3) => IAutoMovieVector3;
      }
    >
  >,
): IHumanPosture["limbs"] {
  const limbs: IHumanPosture["limbs"] = {};
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
