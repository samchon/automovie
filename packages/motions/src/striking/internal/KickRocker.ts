import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieVector3,
} from "@automovie/interface";

import { walkLeg } from "../../actions/internal/walkLeg";
import { HumanFoot } from "../../posture/internal/HumanFoot";
import type { KickChamber } from "./KickChamber";

/**
 * The kicking leg's plant on its forefoot rocker: as the weight leaves the foot
 * its ankle bends no further than the share of the weight it still bears allows
 * (`walkLeg.dorsal`), a weightless ankle's at the launch, so the heel rises
 * about the toes' joint with the toes kept flat (`walkLeg.heelRise`, as
 * `rangeSteppingFoot` rocks a stepping foot). A plant held flat left the foot
 * at the loaded limit as it left the floor (the cover breach's door kick: 39
 * degrees, 19 past a weightless ankle).
 *
 * @param body The body.
 * @param side The kicking side.
 * @param plant The kicking leg on the floor at the launch.
 * @returns The rocker for a hip, the plant's displacement and the ankle's
 *   dorsal limit.
 */
export function KickRocker(
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
  plant: KickChamber.IKey,
): KickRocker.Reader {
  const sole: ReturnType<typeof HumanFoot.headingPitch> =
    HumanFoot.headingPitch(plant.rotation);
  const roll: number = HumanFoot.roll(plant.rotation);
  const mtp: IAutoMovieVector3 = HumanFoot.point(body, side, "mtp", {
    ankle: plant.ankle,
    rotation: plant.rotation,
  });
  return (
    hip: IAutoMovieVector3,
    moved: IAutoMovieVector3,
    dorsal: number,
  ): KickRocker.IRocked => {
    const pivot: IAutoMovieVector3 = Vector3.add(mtp, moved);
    const pitch: number = walkLeg.heelRise(
      body,
      side,
      hip,
      pivot,
      sole.heading,
      sole.pitch,
      walkLeg.ROCKER,
      dorsal,
    );
    return {
      foot:
        pitch === sole.pitch
          ? {
              ankle: Vector3.add(plant.ankle, moved),
              rotation: plant.rotation,
            }
          : HumanFoot.pivot(
              body,
              side,
              "mtp",
              pivot,
              sole.heading,
              pitch,
              0,
              roll,
            ),
      toes: sole.pitch - pitch,
    };
  };
}

/** Companion types of {@link KickRocker}. */
export namespace KickRocker {
  /**
   * The rocker at a hip, the plant's displacement in world metres and the
   * ankle's dorsal limit in degrees.
   */
  export type Reader = (
    hip: IAutoMovieVector3,
    moved: IAutoMovieVector3,
    dorsal: number,
  ) => IRocked;

  /** The plant's foot on its forefoot rocker. */
  export interface IRocked {
    /** The foot's placement. */
    foot: IAutoMovieMotionHumanFoot.IPlacement;

    /** The toes' extension from the foot, degrees, keeping them flat. */
    toes: number;
  }
}
