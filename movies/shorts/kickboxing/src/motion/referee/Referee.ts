import { Blocking } from "../defense/Blocking";
import { Fighter } from "../fighter/Fighter";
import { FighterBody } from "../fighter/FighterBody";
import { Footsteps } from "../footwork/Footsteps";
import type { BodyRig } from "../rig/BodyRig";
import type { Foot } from "../rig/Foot";
import { Vec3 } from "../rig/Vec3";
import { RefereeCues } from "./RefereeCues";

/**
 * The visible referee: position, walking steps, gaze and officiating gestures.
 *
 * During the bout he keeps about two metres from the fighting axis on the side
 * away from the camera, so he stays in frame behind the exchanges and never
 * crosses the fighters' paths. After the knockdown he follows the cue table
 * in {@link RefereeCues}.
 *
 * @evidence contracts/common.md#implementation-and-ownership Same footstep generator and IK as the fighters, with an upright walking stance (feet parallel, 0.42 s steps). Gestures are authored arm channels blended by smooth envelopes; gaze is a neck turn toward a world point. Closed-form in film time.
 * @evidence contracts/common.md#authoring-interface `frame(t)` returns an ordinary performer frame. World metres, radians for headings, degrees for joints.
 */
export class Referee {
  /** Footstep schedule. */
  public readonly steps: Footsteps;

  public constructor(
    public readonly rig: BodyRig,
    private readonly scene: RefereeCues.Scene,
  ) {
    this.steps = new Footsteps({
      start: -1,
      end: 180,
      desired: (t: number): Record<Footsteps.Side, Foot.Placement> =>
        Fighter.feet(this.stance(t)),
      heading: (t: number): number => this.stance(t).heading,
      busy: [],
      duration: 0.28,
      threshold: 0.08,
      overlap: 0,
      height: 0.06,
      lead: "left",
    });
  }

  /**
   * Where the referee stands and faces.
   *
   * @evidence contracts/common.md#implementation-and-ownership Keeps 2.05 m from the fighting axis on the far side with a slow sway, then hands the same position to the post-knockout cue table for continuity.
   * @evidence contracts/common.md#authoring-interface Film seconds; world X/Z metres and radians, always walking.
   */
  public stance(t: number): Fighter.Stance {
    if (t >= RefereeCues.knockdownStart)
      return RefereeCues.stance(
        t,
        this.scene,
        this.stance(RefereeCues.knockdownStart - 1e-6).origin,
      );
    const pair: Blocking.Pair = Blocking.pair(t);
    const away: Vec3.Value = Vec3.rotateY([0, 0, -1], pair.axis);
    const sway: number = 0.5 * Math.sin(t / 7.3);
    const along: Vec3.Value = Vec3.rotateY([sway, 0, 0], pair.axis);
    const x: number = pair.centre[0] + away[0] * 2.05 + along[0];
    const z: number = pair.centre[1] + away[2] * 2.05 + along[2];
    return {
      origin: [x, z],
      heading: Vec3.heading([pair.centre[0] - x, 0, pair.centre[1] - z]),
      walk: 1,
    };
  }

  /**
   * Authored frame at a film second.
   *
   * @evidence contracts/common.md#implementation-and-ownership Upright walking frame with planted feet from his schedule, cue gestures and a gaze turn split across trunk and neck.
   * @evidence contracts/common.md#authoring-interface Film seconds; returns a fresh frame.
   */
  public frame(t: number): FighterBody.Frame {
    const stance: Fighter.Stance = this.stance(t);
    const frame: FighterBody.Frame = {
      time: t,
      origin: [stance.origin[0], stance.origin[1]],
      heading: stance.heading,
      turn: 0,
      drop: 0.02 + 0.01 * Math.sin(t * 1.9),
      shift: [0, 0],
      pelvis: { tilt: 2, obliquity: 0, rotation: 0 },
      thoracic: {
        flexion: 5 + Math.sin((2 * Math.PI * t) / 3.4),
        lateral: 0,
        rotation: 0,
      },
      lumbar: { flexion: 2, lateral: 0 },
      cervical: { flexion: 4, lateral: 0, rotation: 0 },
      atlas: { flexion: 2, rotation: 0 },
      jaw: RefereeCues.mouth(t),
      wince: 0,
      girdle: {
        left: { protraction: 0, elevation: 0 },
        right: { protraction: 0, elevation: 0 },
      },
      evade: { lateral: 0, flexion: 0, drop: 0, shift: 0 },
      roll: FighterBody.IDENTITY,
      lift: [0, 0, 0],
      hands: { left: { kind: "pose" }, right: { kind: "pose" } },
      legs: { left: this.leg("left", t), right: this.leg("right", t) },
      arms: {
        left: {
          shoulder: { flexion: 6, abduction: 2, rotation: 10 },
          elbow: { flexion: 14 },
          forearm: { pronation: 30 },
          hand: relaxed(),
        },
        right: {
          shoulder: { flexion: 6, abduction: 2, rotation: 10 },
          elbow: { flexion: 14 },
          forearm: { pronation: 30 },
          hand: relaxed(),
        },
      },
      legPose: {
        left: { knee: { flexion: 8 } },
        right: { knee: { flexion: 8 } },
      },
    };
    RefereeCues.gesture(frame, t, this.scene);
    this.look(frame, RefereeCues.gaze(t, this.scene));
    return frame;
  }

  /** Turn trunk and neck so the face points at a world point. */
  private look(frame: FighterBody.Frame, point: Vec3.Value): void {
    const desired: number = Vec3.heading([
      point[0] - frame.origin[0],
      0,
      point[2] - frame.origin[1],
    ]);
    let delta: number = (frame.heading - desired) % (2 * Math.PI);
    if (delta > Math.PI) delta -= 2 * Math.PI;
    if (delta < -Math.PI) delta += 2 * Math.PI;
    const degrees: number = Math.max(
      -85,
      Math.min(85, (delta * 180) / Math.PI),
    );
    frame.thoracic.rotation += degrees * 0.25;
    frame.cervical.rotation += Math.max(-20, Math.min(20, degrees * 0.3));
    frame.atlas.rotation += Math.max(-40, Math.min(40, degrees * 0.45));
  }

  /** Planted or swinging foot. */
  private leg(side: Footsteps.Side, t: number): FighterBody.Leg {
    return {
      kind: "place",
      placement: { ...this.steps.at(side, t).placement },
    };
  }
}

/** Open, relaxed fingers. */
function relaxed(): NonNullable<
  NonNullable<FighterBody.Frame["arms"]["left"]>["hand"]
> {
  return {
    thumb: { mcpFlexion: 10, ipFlexion: 10 },
    index: { mcpFlexion: 15, pipFlexion: 20, dipFlexion: 10 },
    middle: { mcpFlexion: 18, pipFlexion: 24, dipFlexion: 12 },
    ring: { mcpFlexion: 20, pipFlexion: 28, dipFlexion: 14 },
    little: { mcpFlexion: 22, pipFlexion: 30, dipFlexion: 15 },
  };
}
