import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanUnseat,
  IAutoMovieVector3,
} from "@automovie/interface";

import { mixHumanPosture } from "../posture/internal/mixHumanPosture";
import type { KnockdownFloor } from "../reaction/KnockdownFloor";
import { HumanMountedFrame } from "./HumanMountedFrame";
import { HumanUnseatFlight } from "./HumanUnseatFlight";
import { HumanUnseatPose } from "./HumanUnseatPose";

/**
 * A rider dragged behind a stirrup (`HumanUnseat`'s `drag`): the body on its
 * back behind the foot held in the stirrup, until a breakaway stirrup lets go.
 */
export namespace HumanUnseatDrag {
  /** The drag's inputs. */
  export interface IDrag {
    /** The law's context. */
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanUnseat>;

    /** The carrier. */
    support: IAutoMovieMotionHumanPropReader;

    /** The carrier contact's frame reader. */
    carrier: HumanMountedFrame.Reader;

    /** The seated posture at a local second. */
    seatedAt: (t: number) => IAutoMovieMotionHumanPosture;

    /** The release, local seconds. */
    release: number;

    /** The stirrup contact. */
    stirrup: string;

    /** The dragged foot's side. */
    side: AutoMovieHumanSide;

    /** Seconds after the release the stirrup lets go; never when absent. */
    free: number | undefined;

    /** Seconds lying after the stop. */
    lie: number;

    /** The fitted lie. */
    lying: KnockdownFloor.IFold;

    /** The lying root's height. */
    floor: number;

    /** The contact window builder. */
    window: (
      part: string,
      kind: IAutoMovieMotionHumanContactWindow["kind"],
      from: number,
      to: number,
      on?: string,
    ) => IAutoMovieMotionHumanContactWindow;
  }

  /**
   * A drag: from the release the body is drawn over `HumanUnseatPose.DRAW` onto
   * its back behind the stirrup, the foot held in it and the head away from the
   * carrier, sliding as the carrier goes; a breakaway stirrup lets the foot go
   * at `free` and the body slides to a stop.
   *
   * @param props The inputs.
   * @returns The plan.
   */
  export function drag(props: IDrag): IAutoMovieMotionHumanActionPlan {
    const {
      context,
      support,
      carrier,
      seatedAt,
      release,
      side,
      lie,
      lying,
      floor,
    } = props;
    const legLength: number =
      context.body.measure.thigh + context.body.measure.shank;
    const dragged = (film: number): IAutoMovieMotionHumanPosture => {
      const foot: IAutoMovieVector3 = HumanMountedFrame.contact(
        support,
        props.stirrup,
        film,
      );
      const ahead: IAutoMovieVector3 = Quaternion.rotateVector(
        carrier(film).rotation,
        { x: 0, y: 0, z: 1 },
      );
      const level: IAutoMovieVector3 = Vector3.normalize({
        x: ahead.x,
        y: 0,
        z: ahead.z,
      });
      const root: IAutoMovieVector3 = {
        ...Vector3.subtract(foot, Vector3.scale(level, legLength)),
        y: floor,
      };
      const yaw: number = (Math.atan2(level.x, level.z) * 180) / Math.PI;
      const shown: IAutoMovieMotionHumanPosture = {
        ...seatedAt(release),
        root,
        yaw,
        pitch: lying.pitch,
        roll: 0,
        joints: { ...(lying.joints as IAutoMovieMotionHumanPosture["joints"]) },
        limbs: {},
      };
      return {
        ...shown,
        limbs: {
          [`${side}Leg`]: {
            point: foot,
            bend: Vector3.add(foot, { x: 0, y: legLength, z: 0 }),
            planted: true,
          },
        },
      };
    };
    const freed: number | undefined =
      props.free === undefined ? undefined : release + props.free;
    const slide: HumanUnseatFlight.IFlight | undefined =
      freed === undefined
        ? undefined
        : HumanUnseatFlight(
            dragged(context.start + freed).root,
            Vector3.scale(
              Vector3.subtract(
                dragged(context.start + freed + 1 / 240).root,
                dragged(context.start + freed - 1 / 240).root,
              ),
              120,
            ),
            { x: 0, y: 0, z: 0 },
            floor,
          );
    const duration: number =
      freed === undefined
        ? release + HumanUnseatPose.DRAW + lie
        : freed + slide!.stop + lie;
    const on: string = context.params.on;
    return {
      duration,
      events: [
        { name: "release", share: release / duration },
        ...(freed === undefined
          ? []
          : [{ name: "free", share: freed / duration }]),
      ],
      contacts: [
        props.window("seat", "seat", 0, release / duration, on),
        props.window(
          `${side}Foot`,
          "plant",
          0,
          freed === undefined ? 1 : freed / duration,
          on,
        ),
        props.window(
          "back",
          "lie",
          (release + HumanUnseatPose.DRAW) / duration,
          1,
        ),
      ],
      base: { kind: "lying" },
      posture: (time: number): IAutoMovieMotionHumanPosture => {
        const t: number = Math.max(0, Math.min(duration, time));
        if (t <= release) return seatedAt(t);
        if (freed !== undefined && t > freed)
          return {
            ...dragged(context.start + freed),
            root: HumanUnseatFlight.at(slide!, t - freed),
            limbs: {},
          };
        const shown: IAutoMovieMotionHumanPosture = dragged(context.start + t);
        return t >= release + HumanUnseatPose.DRAW
          ? shown
          : mixHumanPosture(
              seatedAt(release),
              shown,
              minimumJerk.share((t - release) / HumanUnseatPose.DRAW),
            );
      },
    };
  }
}
