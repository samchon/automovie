import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionHumanRange } from "../compose/AutoMovieMotionHumanRange";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { crawlFrame } from "./crawlFrame";

/**
 * The inchworm's body in its middle plane: a chain from the feet's balls to
 * the wrists, solved from where the hands and the feet are.
 *
 * Each foot pivots on its ball with the ankle at its standing angle to the
 * shank, the heel lifting as far as the shank leans forward (the leg's
 * lean and the knee's bend), up to the toes' extension range; the leg
 * runs at `LEG` of its length to the hip joints; the trunk is the hip
 * joints' middle to the shoulders'; the arm runs straight at `ARM` of its
 * length to the wrist over its flat palm. The
 * places of the hands and the feet leave the chain one freedom, closed by
 * how bearing hands are held: the arms hang plumb, the shoulders an arm
 * over the wrists, as the plank is cued ("hands under the shoulders"). The
 * hips then lie a trunk from the shoulders on the leg's arc, at the higher
 * of the two places (the pike above the line from the feet to the
 * shoulders), so the hip angle (the leg's to the trunk's) opens as the
 * hands go out and closes as the feet come in. The plank is the straight
 * body, the furthest the hands go; the fold is the shape whose hip flexes
 * to `SPARE` short of the end of its range, the flexion read from the hip
 * angle, the trunk's upright lean, the thigh's rest angle and its turn off
 * the leg's line by the bent knee (the spine's own flexion, which would
 * fold further, is not used). A dog's arms in line with the trunk are not
 * reached: the dog and the plank stand the hands nearly as far from the
 * feet, so the distance cannot tell them apart.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the chain, the rule that closes its freedom, and the two key shapes, with provisional values marked.
 * @evidence contracts/development/design.md#principled-representation A solver built once per plan from the body, read at each instant.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The shares, the shapes and the one builder.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every length is the body's; no key posture is typed.
 */
export namespace crawlChain {
  /** Degrees the fold keeps short of the end of the hip's flexion range (provisional). */
  export const SPARE: number = 5;

  /** The leg's reach from the hip joint to the ankle as a share of the thigh and the shank: the knee just short of locked (provisional). */
  export const LEG: number = 0.99;

  /** The arm's reach from the shoulder to the wrist as a share of the upper arm and the forearm: the elbow just short of locked (as `crawl.ARM`). */
  export const ARM: number = 0.98;

  /** The leg's lowest elevation the chain is sought at, degrees over the floor. */
  export const LOWEST: number = 5;

  /**
   * A point of the middle plane.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its direction and unit.
   * @evidence contracts/development/design.md#principled-representation Two coordinates of the plane the chain lies in.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The lateral places stay with the limbs, not here.
   */
  export interface IPlanar {
    /** Metres forward along the heading from the frame's origin. */
    u: number;

    /** Metres up from the floor. */
    v: number;
  }

  /**
   * The leg of the chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and unit.
   * @evidence contracts/development/design.md#principled-representation The leg's elevation fixes the foot's lift and both joints.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Four members, all read by the inchworm.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The ankle follows from the foot's pivot on its ball.
   */
  export interface ILeg {
    /** The leg's elevation over the floor toward the hands, degrees; 90 upright. */
    lam: number;

    /** The heel's lift about the ball, degrees. */
    heel: number;

    /** The ankles' middle. */
    ankle: IPlanar;

    /** The hip joints' middle. */
    hips: IPlanar;
  }

  /**
   * The chain solved.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and unit.
   * @evidence contracts/development/design.md#principled-representation The leg, the shoulders and the hip angle that place the whole body.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members over the leg's.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The wrists are where the hands put them, so they are not repeated.
   */
  export interface IShape extends ILeg {
    /** The shoulder joints' middle. */
    shoulders: IPlanar;

    /** The hip angle between the leg and the trunk, degrees. */
    hip: number;
  }

  /**
   * The chain built for one body standing.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning, frame and unit.
   * @evidence contracts/development/design.md#principled-representation The solve and the body's places it was built from.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The members the inchworm reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The key reaches are solved, not typed.
   */
  export interface IChain {
    /** The chain with the feet's balls' middle at `mu` and the wrists' at `wrist`, both along the heading in metres. */
    shape(mu: number, wrist: number): IShape;

    /** How far before the balls the wrists reach in the fold, metres. */
    folding: number;

    /** How far before the balls the wrists reach in the plank, metres. */
    plank: number;

    /** The trunk's forward lean from the hips to the shoulders upright, degrees. */
    lean: number;

    /** Each wrist from its flat palm, metres in the heading's frame. */
    wrists: Record<"left" | "right", IAutoMovieVector3>;

    /** Each palm's lateral place under its shoulder, metres in the floor frame. */
    palms: Record<"left" | "right", number>;

    /** Each foot's ball standing, in the floor frame. */
    balls: Record<"left" | "right", IAutoMovieVector3>;
  }

  /**
   * Build the chain for a body.
   *
   * @param body The body.
   * @param standing The standing posture the walk starts from.
   * @param frame The floor frame of the heading, its origin under the root.
   * @param forward The heading's unit vector.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input, its frame and the result; the namespace gives the rule.
   * @evidence contracts/development/implementation.md#principled-implementation The trunk, its lean and the thigh's rest angle are read off the rig's joints in the relaxed upright pose and the balls off the standing feet, so every length is the body's; the fold is held inside the hip's flexion range, and the fold and the plank are solved by bisection on the same chain.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A leg by its elevation, the shoulders over the wrists, the hips by one scan and a bisection.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The scan comes down from the hips high, so the place kept is the upper one, and the shoulders go no further than the plank, where the two places meet; where the heel's lift leaves the arc a hair short of the shoulders, the nearest elevation is kept, never the scan's floor.
   * @evidence contracts/development/implementation.md#efficient-algorithms One forward kinematics per plan; each shape is a few hundred closed-form evaluations.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `crawlFrame` for the wrists and the upright pose and `HumanFoot` for the feet.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The chain holds the body's few lengths and places only.
   */
  export function of(
    body: IHumanBody,
    standing: IHumanPosture,
    frame: HumanFrame.IFrame,
    forward: IAutoMovieVector3,
  ): IChain {
    const yaw: number = frame.yaw;
    const DEG: number = 180 / Math.PI;
    const upright: ReturnType<typeof poseBones> = poseBones(
      body,
      resolveHumanPosture(body, {
        ...crawlFrame.posed(yaw, 0, 0, 0, 0),
        root: standing.root,
      }),
    );
    const at = (bone: AutoMovieHumanoidBone): IAutoMovieVector3 =>
      HumanFrame.local(frame, upright.get(bone)!.worldPosition);
    const chest: IAutoMovieVector3 = Vector3.subtract(
      Vector3.lerp(at("leftUpperArm"), at("rightUpperArm"), 0.5),
      Vector3.lerp(at("leftUpperLeg"), at("rightUpperLeg"), 0.5),
    );
    const thigh: number = body.measure.thigh;
    const shank: number = body.measure.shank;
    const t: number = Vector3.length(chest);
    const l: number = LEG * (thigh + shank);
    const r: number = ARM * (body.measure.upperArm + body.measure.forearm);
    const wrists: Record<"left" | "right", IAutoMovieVector3> =
      crawlFrame.wrists(body, standing, forward);
    const wv: number = (wrists.left.y + wrists.right.y) / 2;
    const ball = (side: "left" | "right"): IAutoMovieVector3 => {
      const from: IHumanPosture.IGoal = standing.limbs[`${side}Leg`]!;
      return HumanFrame.local(
        frame,
        HumanFoot.point(body, side, "mtp", {
          ankle: from.point,
          rotation: from.rotation ?? HumanFrame.turn(yaw),
        }),
      );
    };
    const balls: Record<"left" | "right", IAutoMovieVector3> = {
      left: ball("left"),
      right: ball("right"),
    };
    const ballY: number = (balls.left.y + balls.right.y) / 2;
    const extension: number =
      AutoMovieMotionHumanRange.limit("leftToes", "flexion") ?? 90;
    // How much further forward than the leg's line the shank leans, the
    // knee bent toward the front to shorten the leg to `l`.
    const kappa: number =
      Math.acos(
        Math.max(
          -1,
          Math.min(
            1,
            (l * l + shank * shank - thigh * thigh) / (2 * l * shank),
          ),
        ),
      ) * DEG;

    // The leg at an elevation over the foot pivoted on its ball, the heel
    // lifted as far as the shank leans forward.
    const legAt = (mu: number, lam: number): ILeg => {
      const heel: number = Math.min(extension, Math.max(0, 90 - lam + kappa));
      const ankle: IAutoMovieVector3 = HumanFrame.local(
        { origin: { x: 0, y: 0, z: 0 }, yaw },
        HumanFoot.pivot(body, "left", "mtp", { x: 0, y: 0, z: 0 }, yaw, -heel)
          .ankle,
      );
      const a: IPlanar = { u: mu + ankle.z, v: ballY + ankle.y };
      return {
        lam,
        heel,
        ankle: a,
        hips: {
          u: a.u + l * Math.cos(lam / DEG),
          v: a.v + l * Math.sin(lam / DEG),
        },
      };
    };
    const planar = (p: IAutoMovieVector3): IPlanar => ({ u: p.z, v: p.y });
    const angle = (a: IPlanar, vertex: IPlanar, b: IPlanar): number => {
      const x: IPlanar = { u: a.u - vertex.u, v: a.v - vertex.v };
      const y: IPlanar = { u: b.u - vertex.u, v: b.v - vertex.v };
      const cosine: number =
        (x.u * y.u + x.v * y.v) / (Math.hypot(x.u, x.v) * Math.hypot(y.u, y.v));
      return Math.acos(Math.max(-1, Math.min(1, cosine))) * DEG;
    };
    // The first elevation, scanning down by a degree, at which a residual
    // stops being positive, refined by bisection; the one nearest to it
    // when none is (the shoulders a hair beyond the straight leg's reach).
    const descend = (
      residual: (lam: number) => number,
      from: number,
    ): number => {
      let hi: number = from;
      let lo: number | null = null;
      let nearest: { lam: number; residual: number } = {
        lam: from,
        residual: Infinity,
      };
      for (let lam: number = from; lam >= LOWEST; lam -= 1) {
        const value: number = residual(lam);
        if (value <= 0) {
          lo = lam;
          break;
        }
        if (value < nearest.residual) nearest = { lam, residual: value };
        hi = lam;
      }
      if (lo === null) return nearest.lam;
      for (let i: number = 0; i < 30; i++) {
        const mid: number = (lo + hi) / 2;
        if (residual(mid) <= 0) lo = mid;
        else hi = mid;
      }
      return (lo + hi) / 2;
    };

    // The plank: the straight body whose shoulders stand an arm over the
    // wrists, and how far before the balls they stand.
    let lo: number = 0;
    let hi: number = 90;
    for (let i: number = 0; i < 40; i++) {
      const mid: number = (lo + hi) / 2;
      if (legAt(0, mid).hips.v + t * Math.sin(mid / DEG) > wv + r) hi = mid;
      else lo = mid;
    }
    const straight: ILeg = legAt(0, (lo + hi) / 2);
    const plank: number = straight.hips.u + t * Math.cos(straight.lam / DEG);

    // The shoulders plumb over the wrists, no further out than the plank;
    // the hips a trunk from them on the leg's arc, the higher place.
    const shape = (mu: number, wristU: number): IShape => {
      const shoulders: IPlanar = {
        u: Math.min(wristU, mu + plank),
        v: wv + r,
      };
      const leg: ILeg = legAt(
        mu,
        descend((lam: number): number => {
          const hips: IPlanar = legAt(mu, lam).hips;
          return Math.hypot(shoulders.u - hips.u, shoulders.v - hips.v) - t;
        }, 120),
      );
      return { ...leg, shoulders, hip: angle(leg.ankle, leg.hips, shoulders) };
    };

    // The fold: how far before the balls the wrists stand when the hip
    // flexes to `SPARE` short of its range. The pelvis turns with the
    // trunk's line less its upright lean, and the thigh lies off the leg's
    // line by the bent knee's turn and off the pelvis at rest by its rest
    // angle, so the flexion is 180 less the hip angle, the lean and the rest
    // angle, plus the turn; the angle opens as the hands go out.
    const lean: number = Math.atan2(chest.z, chest.y) * DEG;
    const rest: IPlanar = {
      u: (at("leftLowerLeg").z + at("rightLowerLeg").z) / 2,
      v: (at("leftLowerLeg").y + at("rightLowerLeg").y) / 2,
    };
    const hipRest: IPlanar = planar(
      Vector3.lerp(at("leftUpperLeg"), at("rightUpperLeg"), 0.5),
    );
    const resting: number =
      Math.atan2(rest.u - hipRest.u, hipRest.v - rest.v) * DEG;
    const turn: number =
      Math.acos(
        Math.max(
          -1,
          Math.min(
            1,
            (l * l + thigh * thigh - shank * shank) / (2 * l * thigh),
          ),
        ),
      ) * DEG;
    const fold: number =
      180 -
      lean -
      resting +
      turn -
      ((AutoMovieMotionHumanRange.limit("leftUpperLeg", "flexion") ?? 120) -
        SPARE);
    lo = 0;
    hi = plank;
    for (let i: number = 0; i < 40; i++) {
      const mid: number = (lo + hi) / 2;
      if (shape(0, mid).hip < fold) lo = mid;
      else hi = mid;
    }
    const folding: number = (lo + hi) / 2;

    return {
      shape,
      folding,
      plank,
      lean,
      wrists,
      palms: {
        left: at("leftUpperArm").x - wrists.left.x,
        right: at("rightUpperArm").x - wrists.right.x,
      },
      balls,
    };
  }
}
