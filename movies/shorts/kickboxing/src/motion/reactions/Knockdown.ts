import { BoutScript } from "../../shots/kickboxing/ring-bout/BoutScript";
import { FighterBody } from "../fighter/FighterBody";
import type { BodyRig } from "../rig/BodyRig";
import { Ease } from "../rig/Ease";
import { Foot } from "../rig/Foot";
import { Vec3 } from "../rig/Vec3";
import { Aftermath } from "./Aftermath";

/**
 * B's knockdown, the failed attempts to rise and the remaining stillness.
 *
 * The fall is driven by the hip joint's path and the body's roll: the head
 * snaps first, the knees buckle while the feet stay planted, the pelvis drops
 * toward the right side, then the body rolls onto the right hip, shoulder and
 * head. The runtime keeps the lowest body point on the canvas, so the
 * authored roll and hip path decide the order of mat contacts.
 *
 * @evidence contracts/common.md#implementation-and-ownership Starts from B's actual frame at the knockout second (low right guard, stance, feet) so the fall continues the displayed pose. Root position is derived from the authored hip path and the current body rotation, which makes the pelvis, not the feet, the pivot of the fall. Limbs use IK goals in a lying frame built from the fall direction.
 * @evidence contracts/common.md#authoring-interface Film seconds; world metres. Attempt timings follow the screenplay's count (head 158, brace 159, push 160, tremble 161, lower 162, settle 163, small movement 166).
 */
export class Knockdown {
  /** Hip joint height in the neutral body, metres. */
  private static readonly HIP: Vec3.Value = [0.025, 0.932, 0];

  public constructor(
    private readonly base: FighterBody.Frame,
    private readonly rig: BodyRig,
  ) {}

  /**
   * B's frame at t ≥ the knockout second.
   *
   * @evidence contracts/common.md#implementation-and-ownership Derives the root from an authored hip path and body roll so the pelvis pivots; limbs get lying-frame goals; attempts modulate roll, head and left arm by the screenplay's count seconds.
   * @evidence contracts/common.md#authoring-interface Film seconds from the knockout; returns a fresh frame. The runtime settles the result onto the canvas.
   */
  public frame(t: number): FighterBody.Frame {
    const ko: number = BoutScript.finish.at;
    const frame: FighterBody.Frame = structuredClone(this.base);
    frame.time = t;
    const d: Vec3.Value = Aftermath.fallDirection;
    const lieYaw: number = Vec3.heading(d) - Math.PI / 2;
    const front: Vec3.Value = Vec3.rotateY([1, 0, 0], lieYaw);
    const yaw0: number = this.base.heading + this.base.turn;

    // Roll onto the right side, push-up attempt and tremble.
    const attempt: number = Ease.plateau(t, 159.6, 160.6, 161.6, 162.6);
    const tremble: number =
      Ease.plateau(t, 160.8, 161.0, 161.8, 162.0) *
      Math.sin(t * 2 * Math.PI * 9) *
      2.5;
    const rollDeg: number =
      -25 * Ease.ramp(t, ko + 0.22, ko + 0.5) -
      50 * Ease.ramp(t, ko + 0.5, ko + 1.0) -
      15 * Ease.ramp(t, ko + 1.0, ko + 1.3) +
      26 * attempt +
      tremble;
    const yaw: number = Ease.angle(
      yaw0,
      lieYaw,
      Ease.smooth((t - ko - 0.1) / 1.0),
    );
    const roll: number = (rollDeg * Math.PI) / 180;
    const q: readonly [number, number, number, number] = [
      Math.sin(roll / 2),
      0,
      0,
      Math.cos(roll / 2),
    ];
    const yawQ: readonly [number, number, number, number] = [
      0,
      Math.sin(yaw / 2),
      0,
      Math.cos(yaw / 2),
    ];

    // Hip joint path: buckle in place, then down and along the fall direction.
    const standing: Vec3.Value = this.hipsAt(this.base);
    const buckled: Vec3.Value = Vec3.add(
      standing,
      Vec3.add(Vec3.scale(d, 0.12), [0, 0.6 - standing[1], 0]),
    );
    const lying: Vec3.Value = [
      Aftermath.fallenHips[0],
      0.15 + 0.06 * attempt,
      Aftermath.fallenHips[1],
    ];
    const hips: Vec3.Value =
      t < ko + 0.5
        ? Vec3.lerp(standing, buckled, Ease.smooth((t - ko - 0.1) / 0.4))
        : Vec3.lerp(buckled, lying, Ease.smooth((t - ko - 0.5) / 0.5));
    const rotation: readonly [number, number, number, number] = multiply(
      yawQ,
      q,
    );
    const origin: Vec3.Value = Vec3.sub(
      hips,
      Vec3.rotate(Knockdown.HIP, rotation),
    );

    // Express the root through the frame's fields: heading carries the yaw, roll the rest.
    frame.heading = yaw;
    frame.turn = 0;
    frame.shift = [0, 0];
    frame.drop = 0;
    frame.evade = { lateral: 0, flexion: 0, drop: 0, shift: 0 };
    frame.origin = [origin[0], origin[2]];
    frame.lift = [0, origin[1], 0];
    frame.roll = q;

    // Head snaps to his left, the trunk folds right, then everything goes slack.
    const snap: number = Ease.pulse(t, ko, ko + 0.1, ko + 0.9);
    const slack: number = Ease.ramp(t, ko + 0.2, ko + 1.2);
    const lift: number = Ease.plateau(t, 157.7, 158.2, 162.3, 163.2);
    frame.atlas = { flexion: 4, rotation: 32 * snap + 10 * slack };
    frame.cervical = {
      flexion: 10 * slack,
      lateral: 18 * snap - 22 * slack * (1 - lift) + 12 * lift,
      rotation: 10 * snap,
    };
    frame.thoracic = {
      flexion: 12 * slack + 2 * Math.sin((2 * Math.PI * t) / 2.4) - 8 * attempt,
      lateral: -10 * Ease.pulse(t, ko + 0.1, ko + 0.45, ko + 1.1),
      rotation: 6 * slack,
    };
    frame.lumbar = { flexion: 14 * slack, lateral: -6 * snap };
    frame.pelvis = { tilt: 0, obliquity: 0, rotation: 0 };
    frame.jaw = 10 * slack + 8 * snap;
    frame.girdle = {
      left: { protraction: 8 * slack, elevation: 0 },
      right: { protraction: 0, elevation: 0 },
    };

    // Lying frame: hips at `lying`, head along d, front along `front`.
    const at = (
      alongHead: number,
      alongFront: number,
      height: number,
    ): Vec3.Value =>
      Vec3.add(
        [Aftermath.fallenHips[0], height, Aftermath.fallenHips[1]],
        Vec3.add(Vec3.scale(d, alongHead), Vec3.scale(front, alongFront)),
      );
    const limp: number = Ease.ramp(t, ko + 0.15, ko + 0.6);
    const down: number = Ease.ramp(t, ko + 0.45, ko + 1.15);
    const brace: number = Ease.plateau(t, 158.7, 159.3, 163.0, 163.8);
    const twitch: number = Ease.pulse(t, 165.9, 166.2, 166.7);

    // Arms: right arm forward beside the head, left arm over the front, bracing during attempts.
    frame.hands.right = {
      kind: "point",
      point: Vec3.lerp(
        Vec3.add(standing, Vec3.add(Vec3.scale(front, 0.25), [0, -0.15, 0])),
        at(0.75, 0.3, 0.09),
        down,
      ),
      amount: limp,
    };
    const leftRest: Vec3.Value = at(0.25, 0.32, 0.22 + 0.04 * twitch);
    const leftBrace: Vec3.Value = at(0.42, 0.34, 0.09);
    frame.hands.left = {
      kind: "point",
      point: Vec3.lerp(
        Vec3.add(standing, Vec3.add(Vec3.scale(front, 0.2), [0, 0.15, 0])),
        Vec3.lerp(leftRest, leftBrace, brace),
        down,
      ),
      elbow: Vec3.lerp(at(0.5, 0.15, 0.35), at(0.58, 0.18, 0.09), brace),
      weight: 0.4 * down,
      amount: limp,
    };

    // Legs: planted while the knees buckle, then slack along the canvas behind the hips.
    const fold: number = Ease.ramp(t, ko + 0.6, ko + 1.2);
    const draw: number = Ease.plateau(t, 158.8, 159.4, 162.4, 163.4);
    for (const side of ["left", "right"] as const) {
      const leg: FighterBody.Leg = this.base.legs[side];
      const planted: Vec3.Value =
        leg.kind === "place"
          ? Foot.goals(leg.placement, this.rig.footVector).ankle
          : standing;
      const top: boolean = side === "left";
      const ankle: Vec3.Value = at(
        top ? -0.76 + 0.3 * draw : -0.84,
        top ? 0.3 + 0.12 * draw : 0.18,
        top ? 0.17 : 0.08,
      );
      const knee: Vec3.Value = at(
        top ? -0.38 + 0.08 * draw : -0.42,
        top ? 0.2 + 0.18 * draw : 0.1,
        top ? 0.2 : 0.1,
      );
      frame.legs[side] =
        t < ko + 0.6
          ? leg
          : {
              kind: "point",
              ankle: Vec3.lerp(planted, ankle, fold),
              knee: Vec3.lerp(
                Vec3.add(
                  planted,
                  Vec3.add([0, 0.45 - 0.25 * fold, 0], Vec3.scale(front, 0.25)),
                ),
                knee,
                fold,
              ),
            };
    }
    return frame;
  }

  /** World hip joint of a frame's root (ignoring roll, which is identity before the fall). */
  private hipsAt(frame: FighterBody.Frame): Vec3.Value {
    const root: BodyRig.Placement = FighterBody.placement(frame);
    return Vec3.add(root.position, Vec3.rotate(Knockdown.HIP, root.rotation));
  }
}

/** Hamilton product a * b. */
function multiply(
  a: readonly [number, number, number, number],
  b: readonly [number, number, number, number],
): [number, number, number, number] {
  return [
    a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
    a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
    a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
    a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2],
  ];
}
