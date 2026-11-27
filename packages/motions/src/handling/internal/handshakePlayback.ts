import { AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbReference,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPlayback,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrehension,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanBend } from "../../compose/AutoMovieMotionHumanBend";
import type { HumanPrehension } from "../HumanPrehension";

/** The physical clasp, its three transport windows and the base the hand rides. */
interface ITrack {
  body: IAutoMovieMotionHumanBody;
  side: AutoMovieHumanSide;
  base: IAutoMovieMotionHumanActionPlan;
  reach: number;
  shake: number;
  back: number;
  duration: number;
  release: number;
  clasp: IAutoMovieMotionHumanHand.IWrist;
  fingers: IAutoMovieMotionHumanPosture["joints"];
  reference: IAutoMovieHumanLimbReference;
  out: IAutoMovieMotionHumanPrehension.ITransport;
  home: IAutoMovieMotionHumanPrehension.ITransport;
  shapeAt: ReturnType<typeof HumanPrehension.prepareShape>;
  returnShape: ReturnType<typeof HumanPrehension.prepareShape>;
  amplitude: number;
  frequency: number;
}
/** The record of `IHandshakePlaybackResult`'s site. */
type IHandshakePlaybackResult = {
  posture: IAutoMovieMotionHumanActionPlan["posture"];
  phases: readonly IAutoMovieMotionHumanPlayback.IPhase[];
};

/** Sample the reach, held handshake and withdrawal by their actual events. */
export function handshakePlayback(track: ITrack): IHandshakePlaybackResult {
  const {
    body,
    side,
    base,
    reach,
    shake,
    back,
    duration,
    release,
    clasp,
    fingers,
    reference,
    out,
    home,
    shapeAt,
    returnShape,
    amplitude,
    frequency,
  } = track;
  const limb: `${AutoMovieHumanSide}Arm` = `${side}Arm`;
  const radiansPerSecond: number = 2 * Math.PI * frequency;
  /** The hand transport and grip strength at the requested second. */
  interface IHandMotion {
    wrist: IAutoMovieVector3;
    rotation: IAutoMovieQuaternion;
    digits: IAutoMovieMotionHumanPosture["joints"];
    /** Absent through contact, when the fully anchored grip owns the arm. */
    weight?: number;
  }
  /** One phase evaluates its own transport, not the other phases. */
  type HandAt = (seconds: number) => IHandMotion;
  const reaching: HandAt = (seconds: number): IHandMotion => ({
    wrist: out.wrist(seconds),
    rotation: out.turn(seconds),
    digits: shapeAt(seconds / reach),
    ...(seconds >= reach ? {} : { weight: AutoMovieEngineMotionSampling.minimumJerkShare(seconds / reach) }),
  });
  const pump: HandAt = (seconds: number): IHandMotion => {
    const elapsed: number = seconds - reach;
    const lift: number =
      amplitude *
      Math.sin(radiansPerSecond * elapsed) *
      Math.sin((Math.PI * elapsed) / shake) ** 2;
    return {
      wrist: { ...clasp.point, y: clasp.point.y + lift },
      rotation: clasp.rotation,
      digits: fingers,
    };
  };
  const returning: HandAt = (seconds: number): IHandMotion => {
    const elapsed: number = seconds - reach - shake;
    const share: number = AutoMovieEngineMotionSampling.minimumJerkShare(elapsed / back);
    return {
      wrist: home.wrist(elapsed),
      rotation: home.turn(elapsed),
      digits: returnShape(share),
      weight: Math.max(0, 1 - share),
    };
  };
  /** Apply a phase on the actual base at the requested instant. */
  const write =
    (read: HandAt): IAutoMovieMotionHumanActionPlan["posture"] =>
    (time, _channels, resolution, projection): IAutoMovieMotionHumanPosture => {
      const posture: IAutoMovieMotionHumanPosture = base.posture(
        time,
        undefined,
        resolution,
        projection,
      );
      const { wrist, rotation, digits, weight }: IHandMotion = read(time);
      return {
        ...posture,
        joints: { ...posture.joints, ...digits },
        limbs: {
          ...posture.limbs,
          [limb]: {
            point: wrist,
            rotation,
            bend: AutoMovieMotionHumanBend.hang(body, posture, side),
            ...(weight === undefined
              ? { planted: true, reference: reference }
              : { reference: { ...reference, weight } }),
          },
        },
      };
    };
  const approach: IAutoMovieMotionHumanActionPlan["posture"] = write(reaching);
  const shakeAt: IAutoMovieMotionHumanActionPlan["posture"] = write(pump);
  const withdraw: IAutoMovieMotionHumanActionPlan["posture"] = write(returning);
  return {
    posture: (
      seconds,
      channels,
      resolution,
      projection,
    ): IAutoMovieMotionHumanPosture => {
      const time: number = Math.min(duration, Math.max(0, seconds));
      const read: typeof approach =
        time <= reach ? approach : time <= release ? shakeAt : withdraw;
      return read(time, channels, resolution, projection);
    },
    phases: [
      {
        from: 0,
        to: reach,
        sample: (...args) => ({ posture: approach(...args) }),
      },
      {
        from: reach,
        to: release,
        sample: (...args) => ({ posture: shakeAt(...args) }),
      },
      {
        from: release,
        to: duration,
        sample: (...args) => ({ posture: withdraw(...args) }),
      },
    ],
  };
}
