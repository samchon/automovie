import { Vector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanBase,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanRise,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { stand } from "../../actions/internal/stand";
import { AutoMovieMotionHumanArmChain } from "../../compose/AutoMovieMotionHumanArmChain";
import { courseHumanLegs } from "../../compose/internal/courseHumanLegs";
import { lowerHumanPosture } from "../../posture/internal/lowerHumanPosture";
import { HumanTrunk } from "../HumanTrunk";
import type { prepareRiseFeet } from "./prepareRiseFeet";
import { prepareRisePalmRoll } from "./prepareRisePalmRoll";
import type { prepareSeatedRoot } from "./prepareSeatedRoot";
import { riseRested } from "./riseRested";
import { seated } from "./seated";

/**
 * A rise's body at a second (`rise.plan`): the edging forward and the feet
 * drawn back while seated, then the seat socket's path forward and up over the
 * drawn feet with the trunk flexing and returning upright, the legs planned
 * once over the rise, the hands resting on the thighs or the armrests and
 * leaving them, the palms rolled as they bear and the bearing arm chain
 * continued until they are released. Read from the plan's context, body, seat
 * course, feet and timing.
 *
 * @param scope What the plan's body is read from.
 * @returns The risen posture at a second.
 */
export function riseBody(
  scope: riseBody.IScope,
): (seconds: number) => IAutoMovieMotionHumanPosture {
  const {
    context,
    body,
    yaw,
    pitch0,
    relaxed,
    legged,
    legsAt,
    rests,
    entryRoot,
    edged,
    edging,
    begin,
    goal,
    drawn,
    prepared,
    away,
    rising,
    flex,
    pitchAt,
    peak,
    duration,
    seatOff,
    releasing,
    released,
    STOOD,
    LAG,
  }: riseBody.IScope = scope;
  // The rising body with its legs' goals at a second, before the hands.
  const bodyAt = (t: number): IAutoMovieMotionHumanPosture => {
    const joints: IAutoMovieMotionHumanPosture["joints"] = { ...relaxed };
    if (t < prepared) {
      const socket: IAutoMovieVector3 =
        edged !== undefined ? edged(AutoMovieEngineMotionSampling.minimumJerkShare(t / edging)) : begin;
      const root: IAutoMovieVector3 = entryRoot(socket);
      return {
        root,
        yaw,
        pitch: pitch0,
        roll: 0,
        joints,
        limbs: legsAt(root, t),
      };
    }
    const u: number = t - prepared;
    const forward: number = AutoMovieEngineMotionSampling.minimumJerkShare(
      (u - away) / (STOOD * rising - away),
    );
    const up: number = AutoMovieEngineMotionSampling.minimumJerkShare(
      (u - away - LAG * rising) / ((STOOD - LAG) * rising - away),
    );
    const socket: IAutoMovieVector3 = {
      x: begin.x + (goal.x - begin.x) * forward,
      y: begin.y + (goal.y - begin.y) * up,
      z: begin.z + (goal.z - begin.z) * forward,
    };
    const pitch: number =
      u < flex
        ? pitchAt(u, peak)
        : peak * (1 - AutoMovieEngineMotionSampling.minimumJerkShare((u - flex) / (rising - flex)));
    const tilt: ReturnType<typeof HumanTrunk.incline> = HumanTrunk.incline(
      joints,
      pitch,
      HumanTrunk.pelvisLimit(
        body,
        seated.root(body, socket, { yaw, pitch: 0, roll: 0 }),
        yaw,
        drawn,
      ),
    );
    const root: IAutoMovieVector3 = seated.root(body, socket, {
      yaw,
      pitch: tilt.pitch,
      roll: 0,
    });
    return {
      root,
      yaw,
      pitch: tilt.pitch,
      roll: 0,
      joints: tilt.joints,
      limbs: legged(root, drawn),
    };
  };
  // The legs planned once over the rise from the legs it is entered with,
  // on the lowered body the hands rest on (`courseHumanLegs`): every reader
  // places the thighs the hands lie on alike.
  const legs: courseHumanLegs.Seeded = courseHumanLegs({
    body,
    posture: (t: number): IAutoMovieMotionHumanPosture =>
      lowerHumanPosture(body, bodyAt(t)),
    span: { start: 0, end: duration },
    instants: [prepared, seatOff],
    entry: context.entry.pose,
  });
  const risingPosture: (seconds: number) => IAutoMovieMotionHumanPosture = (
    seconds: number,
  ): IAutoMovieMotionHumanPosture => {
    const t: number = Math.min(duration, Math.max(0, seconds));
    return riseRested(
      body,
      legs(bodyAt(t), t),
      rests,
      yaw,
      t < prepared
        ? 1
        : 1 - AutoMovieEngineMotionSampling.minimumJerkShare((t - prepared - away) / releasing),
    );
  };
  const palmRoll: ReturnType<typeof prepareRisePalmRoll> = prepareRisePalmRoll(
    body,
    risingPosture(seatOff),
    (["left", "right"] as const).filter(
      (side: AutoMovieHumanSide): boolean => rests?.[side] === undefined,
    ),
  );
  const supported = (t: number): IAutoMovieMotionHumanPosture =>
    palmRoll(
      risingPosture(t),
      AutoMovieEngineMotionSampling.minimumJerkShare((t - prepared) / away) *
        (1 - AutoMovieEngineMotionSampling.minimumJerkShare((t - seatOff) / releasing)),
    );
  const bearing: ReturnType<typeof AutoMovieMotionHumanArmChain.continued> =
    AutoMovieMotionHumanArmChain.continued(body, released, supported);
  const rose: (seconds: number) => IAutoMovieMotionHumanPosture = (
    seconds: number,
  ): IAutoMovieMotionHumanPosture =>
    seconds < released ? bearing(seconds) : risingPosture(seconds);

  return rose;
}

/** What a rise's body reads. */
export namespace riseBody {
  /** What a rise plan reads its body from. */
  export interface IScope {
    /** The action's context. */
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanRise.IParams>;

    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** The seated heading, degrees. */
    yaw: number;

    /** The entry's trunk pitch, degrees. */
    pitch0: number;

    /** The relaxed upright joints. */
    relaxed: IAutoMovieMotionHumanPosture["joints"];

    /** The legs' goals on a root over set feet (`stand.prepareLegs`). */
    legged: ReturnType<typeof stand.prepareLegs>;

    /** The legs while the feet are drawn back (`prepareRiseFeet`). */
    legsAt: ReturnType<typeof prepareRiseFeet>;

    /** The seat's armrests the hands push on, if any. */
    rests: IAutoMovieMotionHumanBase.ISeat["armrests"];

    /** The seated root from a socket (`prepareSeatedRoot`). */
    entryRoot: ReturnType<typeof prepareSeatedRoot>;

    /** The socket's edging forward on the seat, if it edges. */
    edged: ReturnType<typeof Vector3.prepareLerp> | undefined;

    /** The edging's seconds. */
    edging: number;

    /** The socket where the rise begins. */
    begin: IAutoMovieVector3;

    /** The socket where the rise stands. */
    goal: IAutoMovieVector3;

    /** The drawn feet. */
    drawn: Record<AutoMovieHumanSide, IAutoMovieVector3>;

    /** The seconds before the rise, edging and drawing the feet. */
    prepared: number;

    /** The rise's seconds to seat-off. */
    away: number;

    /** The rise's seconds. */
    rising: number;

    /** The trunk's flexion seconds. */
    flex: number;

    /**
     * The trunk's pitch while it flexes.
     *
     * @param t Seconds of the rise.
     * @param peak The peak flexion, degrees.
     * @returns The pitch, degrees.
     */
    pitchAt: (t: number, peak: number) => number;

    /** The peak trunk flexion, degrees. */
    peak: number;

    /** The plan's seconds. */
    duration: number;

    /** Seat-off, seconds. */
    seatOff: number;

    /** The hands' release's seconds. */
    releasing: number;

    /** When the hands are released, seconds. */
    released: number;

    /** The share of the rise at which the socket stands (`rise.STOOD`). */
    STOOD: number;

    /** The socket's rise's delay behind its forward travel (`rise.LAG`). */
    LAG: number;
  }
}
