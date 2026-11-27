import { Vector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanThrowObjectForm,
  IAutoMovieMotionPropLaunch,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanTrunk } from "../../compose/internal/AutoMovieMotionHumanTrunk";
import { HumanFrame } from "../../posture/internal/HumanFrame";

/*
 * Geometry added by the three precision delivery styles to the shared throw.
 */
export namespace precisionThrow {
  /*
   * A full windmill arm circle blending from the entry hand pose to the regular
   * release chamber. The radius is proportional to arm length and provisional.
   * See WBSC 2026–2029 Fast Pitch Rule 4.3.3 and Oliver et al., the windmill
   * pelvis and trunk measurements (PMC8358524).
   */
  export function windmill(
    frame: IAutoMovieMotionHumanFrame,
    arm: number,
    chamber: IAutoMovieVector3,
    rest: IAutoMovieVector3,
    progress: number,
  ): IAutoMovieVector3 {
    const angle: number = 2 * Math.PI * progress;
    const radius: number = 0.8 * arm;
    const offset: IAutoMovieVector3 = HumanFrame.point(
      { ...frame, origin: chamber },
      {
        x: 0,
        y: radius * (1 - Math.cos(angle)),
        z: radius * Math.sin(angle),
      },
    );
    return Vector3.lerp(
      rest,
      offset,
      AutoMovieEngineMotionSampling.minimumJerkShare(Math.min(progress * 5, 1)),
    );
  }

  /*
   * Prepare the two-foot bowling stance for a settled solo release. The pelvis
   * descends through knee flexion while the soles hold their entry placements.
   * The depth is a provisional share of leg length. Seiferheld et al.
   * (doi:10.3390/s23198284) distinguish support and release during the bowling
   * delivery. A carrier remains responsible for its own base and feet.
   */
  export function stance(
    context: Pick<IAutoMovieMotionHumanActionContext, StanceContext>,
    style: IAutoMovieMotionHumanThrowObjectForm.Style,
  ):
    | ((
        posture: IAutoMovieMotionHumanPosture,
        share: number,
      ) => IAutoMovieMotionHumanPosture)
    | undefined {
    if (style !== "bowling" || context.carrier !== undefined) return undefined;
    const { body, entry } = context;
    const depth: number = 0.2 * (body.measure.thigh + body.measure.shank);
    const planted: ReturnType<typeof AutoMovieMotionHumanTrunk.preparePlanted> =
      AutoMovieMotionHumanTrunk.preparePlanted(
        body,
        AutoMovieMotionHumanTrunk.footing(body, entry.posture),
      );
    return (
      posture: IAutoMovieMotionHumanPosture,
      share: number,
    ): IAutoMovieMotionHumanPosture =>
      share === 0
        ? posture
        : planted({
            ...posture,
            root: { ...posture.root, y: posture.root.y - depth * share },
          });
  }

  /*
   * Add the existing spherical collision input to a precision delivery with a
   * sized ball grip.
   */
  export function launches(
    context: Pick<IAutoMovieMotionHumanActionContext, "prop">,
    style: IAutoMovieMotionHumanThrowObjectForm.Style,
    launches: IAutoMovieMotionPropLaunch[],
  ): IAutoMovieMotionPropLaunch[] {
    if (style !== "windmill" && style !== "cricket" && style !== "bowling")
      return launches;
    return launches.map(
      (launch: IAutoMovieMotionPropLaunch): IAutoMovieMotionPropLaunch => {
        if (launch.attitude !== undefined && launch.attitude.kind !== "fixed")
          return launch;
        const grip: IAutoMovieAffordance | undefined = context
          .prop(launch.prop)
          .prop.affordances?.find(
            (affordance: IAutoMovieAffordance): boolean =>
              affordance.id === "grip",
          );
        const diameter: number | undefined = grip?.aperture;
        if (
          diameter === undefined ||
          !(diameter > 0)
        )
          return launch;
        return {
          ...launch,
          sphere: { radius: diameter / 2, centre: grip!.frame.translation },
        };
      },
    );
  }
}

/*
 * The alternatives of `StanceContext`'s site.
 */
type StanceContext = "body" | "carrier" | "entry";
