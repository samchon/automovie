import type {
  AutoMovieHumanoidRegion,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanLieDown,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

import { HumanFoot } from "../../posture/internal/HumanFoot";
import { HumanMaterialContact } from "../../posture/internal/HumanMaterialContact";

/**
 * The lie's base window from the settled instant: the seat bearing for a seated
 * position, else the back lying for every lying position (the contact parts
 * have no chest or side); the plan adds the feet's pivots after it.
 *
 * Part of `lieDown.plan`, which prepares it once per plan.
 *
 * @param prepared What the plan prepared for it.
 * @returns The plan's `contacts`.
 */
export function lieDownContacts(
  prepared: lieDownContacts.IPrepared,
): IAutoMovieMotionHumanContactWindow[] {
  const {
    body,
    posture,
    position,
    sitting,
    settled,
  }: lieDownContacts.IPrepared = prepared;
  if (sitting)
    return [
      {
        // Seated on the floor, the seat bears, and the base the next action is entered on is a seated one.
        part: "seat",
        kind: "seat",
        from: settled,
        to: 1,
        support: { kind: "ground" },
      },
    ];
  const region: AutoMovieHumanoidRegion =
    position === "prone"
      ? "sternum"
      : position.endsWith("Left")
        ? "ribsLeft"
        : position.endsWith("Right")
          ? "ribsRight"
          : "upperBack";
  const torso: IAutoMovieMotionHumanContactWindow.IMaterial | undefined =
    HumanMaterialContact.prepareFloor(
      body,
      new Set(["hips", "spine", "chest"]),
    )(posture, 0);
  const head: IAutoMovieMotionHumanContactWindow.IMaterial | undefined =
    HumanMaterialContact.prepareFloor(body, new Set(["head"]))(posture, 0);
  const near = (
    data: IAutoMovieMotionHumanContactWindow.IMaterial | undefined,
  ): data is IAutoMovieMotionHumanContactWindow.IMaterial =>
    data !== undefined && Math.abs(data.clearance) <= HumanFoot.BEARING;
  return [
    ...(near(torso)
      ? [
          {
            part:
              region === "upperBack" ? ("back" as const) : ("chest" as const),
            kind: "lie" as const,
            region,
            from: settled,
            to: 1,
            support: { kind: "ground" as const },
            material: torso,
          },
        ]
      : []),
    ...(near(head)
      ? [
          {
            part: "head" as const,
            kind: "bear" as const,
            region: "headBack" as const,
            from: settled,
            to: 1,
            support: { kind: "ground" as const },
            material: head,
          },
        ]
      : []),
  ];
}

/** The `contacts` of `lieDown.plan`, built from what that plan prepared. */
export namespace lieDownContacts {
  /** What `lieDown.plan` prepared for its `contacts`. */
  export interface IPrepared {
    /** Body carrying the displayed colliders. */
    body: IAutoMovieMotionHumanBody;
    /** The settled posture whose exterior receives support. */
    posture: IAutoMovieMotionHumanPosture;
    /** The intended lying position. */
    position: IAutoMovieMotionHumanLieDown.Position;
    /** The `sitting` `lieDown.plan` prepared. */
    sitting: boolean;

    /** The `settled` `lieDown.plan` prepared. */
    settled: number;
  }
}
