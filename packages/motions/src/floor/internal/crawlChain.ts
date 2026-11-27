import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanRange } from "../../compose/internal/AutoMovieMotionHumanRange";
import { HumanFoot } from "../../posture/internal/HumanFoot";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { crawlFrame } from "./crawlFrame";

/*
 * Upright lengths and lateral places read by this chain's preparation.
 */
const MEASURED: ReadonlySet<AutoMovieHumanoidBone> = new Set([
  "leftUpperArm",
  "rightUpperArm",
  "leftUpperLeg",
  "rightUpperLeg",
  "leftLowerLeg",
  "rightLowerLeg",
]);

/*
 * Build the chain for a body.
 * Parameter body: The body.
 * Parameter standing: The standing posture the walk starts from.
 * Parameter frame: The floor frame of the heading, its origin under the root.
 * Parameter forward: The heading's unit vector.
 * Returns: The chain.
 */
export function crawlChain(
  body: IAutoMovieMotionHumanBody,
  standing: IAutoMovieMotionHumanPosture,
  frame: IAutoMovieMotionHumanFrame,
  forward: IAutoMovieVector3,
): crawlChain.IChain {
  const yaw: number = frame.yaw;
  const DEG: number = 180 / Math.PI;
  const upright: ReturnType<typeof poseBones> = poseBones(
    body,
    resolveHumanPosture(body, {
      ...crawlFrame.posed(body, yaw, 0, 0, 0, 0),
      root: standing.root,
    }),
    undefined,
    MEASURED,
  );
  const floor: ReturnType<typeof HumanFrame.prepare> =
    HumanFrame.prepare(frame);
  const at: (bone: AutoMovieHumanoidBone) => IAutoMovieVector3 = (
    bone: AutoMovieHumanoidBone,
  ): IAutoMovieVector3 => floor.local(upright.get(bone)!.worldPosition);
  const chest: IAutoMovieVector3 = Vector3.subtract(
    Vector3.lerp(at("leftUpperArm"), at("rightUpperArm"), 0.5),
    Vector3.lerp(at("leftUpperLeg"), at("rightUpperLeg"), 0.5),
  );
  const thigh: number = body.measure.thigh;
  const shank: number = body.measure.shank;
  const t: number = Vector3.length(chest);
  const l: number = crawlChain.LEG * (thigh + shank);
  const r: number =
    crawlChain.ARM * (body.measure.upperArm + body.measure.forearm);
  const wrists: Record<AutoMovieHumanSide, IAutoMovieVector3> =
    crawlFrame.wrists(body, standing, forward);
  const wv: number = (wrists.left.y + wrists.right.y) / 2;
  const ball = (side: AutoMovieHumanSide): IAutoMovieVector3 => {
    const from: IAutoMovieHumanLimbGoal = standing.limbs[`${side}Leg`]!;
    return floor.local(
      HumanFoot.point(body, side, "mtp", {
        ankle: from.point,
        rotation: from.rotation ?? HumanFrame.turn(yaw),
      }),
    );
  };
  const balls: Record<AutoMovieHumanSide, IAutoMovieVector3> = {
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
        Math.min(1, (l * l + shank * shank - thigh * thigh) / (2 * l * shank)),
      ),
    ) * DEG;

  // The leg at an elevation over the foot pivoted on its ball, the heel
  // lifted as far as the shank leans forward.
  const pivot: ReturnType<typeof HumanFoot.preparePivot> =
    HumanFoot.preparePivot(body, "left", "mtp", { x: 0, y: 0, z: 0 }, yaw);
  const unturned: ReturnType<typeof HumanFrame.prepare> = HumanFrame.prepare({
    origin: { x: 0, y: 0, z: 0 },
    yaw,
  });
  /*
   * Fixed foot and leg offsets for one exact elevation, before current
   * translation.
   */
  interface IGeometry {
    /*
     * Degrees of heel lift.
     */
    heel: number;
    /*
     * Current native pivot's ankle offset, heading-local metres.
     */
    ankle: IAutoMovieVector3;
    /*
     * Hip offset forward from the ankle, metres.
     */
    along: number;
    /*
     * Hip offset above the ankle, metres.
     */
    up: number;
  }
  const geometryAt: (lam: number) => IGeometry = (lam: number): IGeometry => {
    const heel: number = Math.min(extension, Math.max(0, 90 - lam + kappa));
    return {
      heel,
      ankle: unturned.local(pivot(-heel).ankle),
      along: l * Math.cos(lam / DEG),
      up: l * Math.sin(lam / DEG),
    };
  };
  const upper: (
    u: number,
    v: number,
    geometry: IGeometry,
  ) => crawlChain.IPlanar = (
    u: number,
    v: number,
    geometry: IGeometry,
  ): crawlChain.IPlanar => ({ u: u + geometry.along, v: v + geometry.up });
  const legAt: (mu: number, lam: number) => crawlChain.ILeg = (
    mu: number,
    lam: number,
  ): crawlChain.ILeg => {
    const geometry: IGeometry = geometryAt(lam);
    const a: crawlChain.IPlanar = {
      u: mu + geometry.ankle.z,
      v: ballY + geometry.ankle.y,
    };
    return {
      lam,
      heel: geometry.heel,
      ankle: a,
      hips: upper(a.u, a.v, geometry),
    };
  };
  const planar = (p: IAutoMovieVector3): crawlChain.IPlanar => ({
    u: p.z,
    v: p.y,
  });
  const angle = (
    a: crawlChain.IPlanar,
    vertex: crawlChain.IPlanar,
    b: crawlChain.IPlanar,
  ): number => {
    const x: crawlChain.IPlanar = { u: a.u - vertex.u, v: a.v - vertex.v };
    const y: crawlChain.IPlanar = { u: b.u - vertex.u, v: b.v - vertex.v };
    const cosine: number =
      (x.u * y.u + x.v * y.v) / (Math.hypot(x.u, x.v) * Math.hypot(y.u, y.v));
    return Math.acos(Math.max(-1, Math.min(1, cosine))) * DEG;
  };
  // The first elevation, scanning down by a degree, at which a residual
  // stops being positive, refined by bisection; the one nearest to it
  // when none is (the shoulders a hair beyond the straight leg's reach).
  const descend = (residual: (lam: number) => number, from: number): number => {
    let hi: number = from;
    let lo: number | null = null;
    let nearest: IOfDescendNearest = {
      lam: from,
      residual: Infinity,
    };
    for (let lam: number = from; lam >= crawlChain.LOWEST; lam -= 1) {
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
    const geometry: IGeometry = geometryAt(mid);
    const hips: crawlChain.IPlanar = upper(
      0 + geometry.ankle.z,
      ballY + geometry.ankle.y,
      geometry,
    );
    if (hips.v + t * Math.sin(mid / DEG) > wv + r) hi = mid;
    else lo = mid;
  }
  const straight: crawlChain.ILeg = legAt(0, (lo + hi) / 2);
  const plank: number = straight.hips.u + t * Math.cos(straight.lam / DEG);

  // The shoulders plumb over the wrists, no further out than the plank;
  // the hips a trunk from them on the leg's arc, the higher place.
  const shape = (mu: number, wristU: number): crawlChain.IShape => {
    const shoulders: crawlChain.IPlanar = {
      u: Math.min(wristU, mu + plank),
      v: wv + r,
    };
    const leg: crawlChain.ILeg = legAt(
      mu,
      descend((lam: number): number => {
        const geometry: IGeometry = geometryAt(lam);
        const hips: crawlChain.IPlanar = upper(
          mu + geometry.ankle.z,
          ballY + geometry.ankle.y,
          geometry,
        );
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
  const rest: crawlChain.IPlanar = {
    u: (at("leftLowerLeg").z + at("rightLowerLeg").z) / 2,
    v: (at("leftLowerLeg").y + at("rightLowerLeg").y) / 2,
  };
  const hipRest: crawlChain.IPlanar = planar(
    Vector3.lerp(at("leftUpperLeg"), at("rightUpperLeg"), 0.5),
  );
  const resting: number =
    Math.atan2(rest.u - hipRest.u, hipRest.v - rest.v) * DEG;
  const turn: number =
    Math.acos(
      Math.max(
        -1,
        Math.min(1, (l * l + thigh * thigh - shank * shank) / (2 * l * thigh)),
      ),
    ) * DEG;
  const fold: number =
    180 -
    lean -
    resting +
    turn -
    ((AutoMovieMotionHumanRange.limit("leftUpperLeg", "flexion") ?? 120) -
      crawlChain.SPARE);
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
    lean,
    folding,
    plank,
    wrists,
    palms: {
      left: at("leftUpperArm").x - wrists.left.x,
      right: at("rightUpperArm").x - wrists.right.x,
    },
    balls,
  };
}

/*
 * The inchworm's reaches, solved on its body in its middle plane: a chain from
 * the feet's balls to the wrists, from which the fold's and the plank's
 * distances from the feet to the hands are read, and the shape at each
 * placement of the hands and the feet that seeds its stance's solve (the walk's
 * postures are the support planner's, `crawlInchworm`).
 *
 * Each foot pivots on its ball with the ankle at its standing angle to the
 * shank, the heel lifting as far as the shank leans forward (the leg's lean and
 * the knee's bend), up to the toes' extension range; the leg runs at `LEG` of
 * its length to the hip joints; the trunk is the hip joints' middle to the
 * shoulders'; the arm runs straight at `ARM` of its length to the wrist over
 * its flat palm. The places of the hands and the feet leave the chain one
 * freedom, closed by how bearing hands are held: the arms hang plumb, the
 * shoulders an arm over the wrists, as the plank is cued ("hands under the
 * shoulders"). The hips then lie a trunk from the shoulders on the leg's arc,
 * at the higher of the two places (the pike above the line from the feet to the
 * shoulders), so the hip angle (the leg's to the trunk's) opens as the hands go
 * out and closes as the feet come in. The plank is the straight body, the
 * furthest the hands go; the fold is the shape whose hip flexes to `SPARE`
 * short of the end of its range, the flexion read from the hip angle, the
 * trunk's upright lean, the thigh's rest angle and its turn off the leg's line
 * by the bent knee (the spine's own flexion, which would fold further, is not
 * used). A dog's arms in line with the trunk are not reached: the dog and the
 * plank stand the hands nearly as far from the feet, so the distance cannot
 * tell them apart.
 */
export namespace crawlChain {
  /*
   * Degrees the fold keeps short of the end of the hip's flexion range
   * (provisional).
   */
  export const SPARE: number = 5;

  /*
   * The leg's reach from the hip joint to the ankle as a share of the thigh and
   * the shank: the knee just short of locked (provisional).
   */
  export const LEG: number = 0.99;

  /*
   * The arm's reach from the shoulder to the wrist as a share of the upper arm
   * and the forearm: the elbow just short of locked (as `crawl.ARM`).
   */
  export const ARM: number = 0.98;

  /*
   * The leg's lowest elevation the chain is sought at, degrees over the floor.
   */
  export const LOWEST: number = 5;

  /*
   * A point of the middle plane.
   */
  export interface IPlanar {
    /*
     * Metres forward along the heading from the frame's origin.
     */
    u: number;

    /*
     * Metres up from the floor.
     */
    v: number;
  }

  /*
   * The leg of the chain.
   */
  export interface ILeg {
    /*
     * The leg's elevation over the floor toward the hands, degrees; 90 upright.
     */
    lam: number;

    /*
     * The heel's lift about the ball, degrees.
     */
    heel: number;

    /*
     * The ankles' middle.
     */
    ankle: IPlanar;

    /*
     * The hip joints' middle.
     */
    hips: IPlanar;
  }

  /*
   * The chain solved.
   */
  export interface IShape extends ILeg {
    /*
     * The shoulder joints' middle.
     */
    shoulders: IPlanar;

    /*
     * The hip angle between the leg and the trunk, degrees.
     */
    hip: number;
  }

  /*
   * The chain built for one body standing.
   */
  export interface IChain {
    /*
     * The chain with the feet's balls' middle at `mu` and the wrists' at
     * `wrist`, both along the heading in metres.
     */
    shape(mu: number, wrist: number): IShape;

    /*
     * The trunk's forward lean from the hips to the shoulders upright, degrees.
     */
    lean: number;

    /*
     * How far before the balls the wrists reach in the fold, metres.
     */
    folding: number;

    /*
     * How far before the balls the wrists reach in the plank, metres.
     */
    plank: number;

    /*
     * Each wrist from its flat palm, metres in the heading's frame.
     */
    wrists: Record<AutoMovieHumanSide, IAutoMovieVector3>;

    /*
     * Each palm's lateral place under its shoulder, metres in the floor frame.
     */
    palms: Record<AutoMovieHumanSide, number>;

    /*
     * Each foot's ball standing, in the floor frame.
     */
    balls: Record<AutoMovieHumanSide, IAutoMovieVector3>;
  }
}

/*
 * The record of `IOfDescendNearest`'s site.
 */
type IOfDescendNearest = { lam: number; residual: number };
