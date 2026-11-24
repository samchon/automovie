import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanActionKey,
  IAutoMovieAngleRange,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanCrabWalk,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanHand } from "../posture/HumanHand";
import { mixHumanPosture } from "../posture/mixHumanPosture";

/**
 * One limb of the crawl: its channel, its contact part, its diagonal group and
 * where it stands from the pelvis.
 */
interface ILimb {
  /** The limb's channel. */
  limb: AutoMovieHumanLimb;

  /** The contact part at its end. */
  part: IAutoMovieMotionHumanContactWindow["part"];

  /**
   * Its phase in the stride cycle: 0 for the right hand and the left foot, one
   * half for the other pair.
   */
  phase: number;

  /**
   * Its end's stance from the pelvis in the crawl's frame (`+z` the travel),
   * metres.
   */
  stance: IAutoMovieVector3;

  /** Its middle joint's hint from the end, in the same frame, metres. */
  bend: IAutoMovieVector3;
}

/** The trunk's bones that arch, from the pelvis up. */
const TRUNK: readonly AutoMovieHumanoidBone[] = [
  "spine",
  "chest",
  "upperChest",
];

/** The world's down. */
const DOWN: IAutoMovieVector3 = { x: 0, y: -1, z: 0 };

/** The crawl's two trunk variants. */
type Variant = "plain" | "backbend";

/** One way of holding the trunk over the four supports. */
interface IShape {
  /** The whole body's pitch, degrees: negative tips it onto its back. */
  pitch: number;

  /** The trunk's whole extension, degrees, shared among its bones by their room. */
  arch: number;

  /**
   * The neck's flexion, degrees: positive looks toward the feet, negative hangs
   * the head back.
   */
  neck: number;
}

/**
 * A supine quadrupedal crawl, the crab walk (`IAutoMovieMotionHumanCrabWalk`).
 * The body settles from where it is onto its hands, planted behind the
 * shoulders, and its feet, planted ahead of the hips, with the pelvis lifted to
 * the authored height, then travels in the diagonal sequence of a quadrupedal
 * walk: the right hand and the left foot swing together while the other pair
 * bears, then the other pair. The travel follows one minimum-jerk progress, so
 * the crawl leaves and arrives at rest; each swinging end lifts on a half sine
 * over its swing. The hands and the feet are the only contacts. A full backbend
 * arches the spine and hangs the head back, and is refused for a body whose
 * spine and chest cannot extend as far.
 *
 * Sources: the diagonal sequence of quadrupedal walking (Hildebrand,
 * Symmetrical gaits of horses, Science 150, 1965) carried to a supine crawl;
 * the trunk and stance values are authored.
 */
export namespace crabWalk {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionKey = "crabWalk";

  /** Cancel table: a get-up may cut it once it has settled onto its supports. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    getUp: [
      {
        window: ["settled", 1],
        kind: "inertialize",
        entry: 0,
        blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate,
      },
    ],
  };

  /**
   * How long the body takes to settle onto its four supports, seconds:
   * authored.
   */
  export const SETTLE: number = 0.8;

  /** A stride's length, in statures: authored. */
  export const STRIDE: number = 0.18;

  /** How long one stride cycle takes, seconds: authored, a slow crawl. */
  export const CYCLE: number = 0.9;

  /**
   * How far above the floor a planted palm's surface lies, metres: the floor
   * contact's skin.
   */
  export const SKIN: number = 0.005;

  /** How high a swinging end lifts, metres: authored. */
  export const LIFT: number = 0.06;

  /** The trunk and the head over the supports, plain and in a full backbend. */
  export const SHAPES: Readonly<Record<Variant, IShape>> = {
    plain: { pitch: -70, arch: 0, neck: 25 },
    backbend: { pitch: -95, arch: 70, neck: -45 },
  };

  /**
   * Plan a crab walk.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} On `height` outside what the limbs can hold, on `to`
   *   for a non-finite travel, and on `backbend` for a spine that cannot arch
   *   that far.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanCrabWalk.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const body: IAutoMovieMotionHumanBody = context.body;
    const params: IAutoMovieMotionHumanCrabWalk.IParams = context.params;
    const stature: number = body.measure.stature;
    const height: number = (params.height ?? 0.22) * stature;
    if (!(height >= 0.1 * stature && height <= 0.6 * body.measure.hipHeight))
      throw new HumanRefusal({
        kind: "parameter",
        axis: "height",
        value: params.height ?? 0.22,
        feasible: {
          kind: "range",
          unit: "stature",
          minimum: 0.1,
          maximum: (0.6 * body.measure.hipHeight) / stature,
        },
        reason:
          "the bent arms and legs hold the pelvis only within this height",
        fix: "give a pelvis height inside the range",
      });
    const to: IAutoMovieVector3 = params.to;
    const shape: IShape =
      SHAPES[params.backbend === true ? "backbend" : "plain"];
    // The trunk's extension, shared among its bones by the room each has.
    const rooms: readonly number[] = TRUNK.map(
      (bone: AutoMovieHumanoidBone): number => {
        const flexion: IAutoMovieAngleRange | null | undefined =
          body.bones.get(bone)?.constraint?.flexion;
        return flexion === null || flexion === undefined
          ? 0
          : Math.max(0, -flexion.min);
      },
    );
    const room: number = rooms.reduce(
      (a: number, b: number): number => a + b,
      0,
    );
    if (shape.arch > room)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "backbend",
        value: true,
        feasible: { kind: "range", unit: "deg", minimum: 0, maximum: room },
        reason: `a full backbend arches the trunk by ${shape.arch} degrees; this body's spine and chest extend by ${room.toFixed(0)}`,
        fix: "crawl without the backbend",
      });
    const arched: IAutoMovieMotionHumanPosture["joints"] = {};
    TRUNK.forEach((bone: AutoMovieHumanoidBone, k: number): void => {
      if (room > 0) arched[bone] = [(-shape.arch * rooms[k]!) / room, 0, 0];
    });

    // The travel in the world, and the heading the body takes: the feet lead
    // along it, or the head does.
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    const turn: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
      { x: 0, y: 1, z: 0 },
      entry.yaw,
    );
    const travel: IAutoMovieVector3 = Quaternion.rotateVector(turn, {
      x: to.x,
      y: 0,
      z: to.z,
    });
    const distance: number = Vector3.length(travel);
    const along: IAutoMovieVector3 =
      distance > 1e-9
        ? Vector3.scale(travel, 1 / distance)
        : Quaternion.rotateVector(turn, { x: 0, y: 0, z: 1 });
    const ahead: IAutoMovieVector3 =
      params.lead === "head" ? Vector3.scale(along, -1) : along;
    const yaw: number = (Math.atan2(ahead.x, ahead.z) * 180) / Math.PI;
    const facing: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
      { x: 0, y: 1, z: 0 },
      yaw,
    );
    const frame: (local: IAutoMovieVector3) => IAutoMovieVector3 = (
      local: IAutoMovieVector3,
    ): IAutoMovieVector3 => Quaternion.rotateVector(facing, local);

    // The root, at the feet's level, placed so the pitched body's hips sit
    // at the authored height over the pelvis's place.
    const radians: number = (shape.pitch * Math.PI) / 180;
    const hip: number = body.measure.hipHeight;
    const pelvis: IAutoMovieVector3 = {
      x: entry.root.x,
      y: height,
      z: entry.root.z,
    };
    const root: (at: IAutoMovieVector3) => IAutoMovieVector3 = (
      at: IAutoMovieVector3,
    ): IAutoMovieVector3 =>
      Vector3.add(
        { x: at.x, y: height - hip * Math.cos(radians), z: at.z },
        frame({ x: 0, y: 0, z: -hip * Math.sin(radians) }),
      );

    // The four ends' stances: the feet ahead of the hips, the hands behind
    // the shoulders, each a little wider than its girdle.
    const ankle: number =
      body.rest.get("leftFoot")?.y ?? 0.08 * (stature / 1.75);
    const palm: number = SKIN;
    const trunk: number =
      (body.rest.get("leftUpperArm")?.y ?? hip + 0.3 * stature) -
      (body.rest.get("hips")?.y ?? hip);
    // The hands sit well behind the shoulders, so the forearms incline and
    // the wrists extend within their range to lay the palms flat.
    const shoulderBack: number = trunk * Math.sin(-radians) + 0.15 * stature;
    const feetAhead: number = 0.32 * stature;
    const limbs: readonly ILimb[] = [
      {
        limb: "rightArm",
        part: "rightHand",
        phase: 0,
        stance: {
          x: -1.2 * body.measure.shoulderHalfWidth,
          y: palm,
          z: -shoulderBack,
        },
        bend: { x: -0.1, y: 0.25, z: -0.15 },
      },
      {
        limb: "leftLeg",
        part: "leftFoot",
        phase: 0,
        stance: { x: 1.3 * body.measure.hipHalfWidth, y: ankle, z: feetAhead },
        bend: { x: 0.05, y: 0.5, z: -0.1 },
      },
      {
        limb: "leftArm",
        part: "leftHand",
        phase: 0.5,
        stance: {
          x: 1.2 * body.measure.shoulderHalfWidth,
          y: palm,
          z: -shoulderBack,
        },
        bend: { x: 0.1, y: 0.25, z: -0.15 },
      },
      {
        limb: "rightLeg",
        part: "rightFoot",
        phase: 0.5,
        stance: { x: -1.3 * body.measure.hipHalfWidth, y: ankle, z: feetAhead },
        bend: { x: -0.05, y: 0.5, z: -0.1 },
      },
    ];

    // The strides and the clock.
    const cycles: number = Math.max(
      1,
      Math.ceil(distance / (STRIDE * stature)),
    );
    const stride: number = distance / cycles;
    const travelling: number = cycles * CYCLE;
    const duration: number = SETTLE + travelling;
    const progress: (seconds: number) => number = (seconds: number): number =>
      cycles *
      minimumJerk.share(
        Math.min(1, Math.max(0, (seconds - SETTLE) / travelling)),
      );
    const at: (cycle: number) => number = (cycle: number): number => {
      // The second the progress reaches a cycle count, by bisection on the
      // monotone progress.
      let lo: number = SETTLE;
      let hi: number = duration;
      for (let k: number = 0; k < 40; ++k) {
        const mid: number = (lo + hi) / 2;
        if (progress(mid) < cycle) lo = mid;
        else hi = mid;
      }
      return hi;
    };

    // Where an end stands along the travel at a progress, and its lift.
    const step: (l: ILimb, u: number) => readonly [number, number] = (
      l: ILimb,
      u: number,
    ): readonly [number, number] => {
      const c: number = u - l.phase;
      if (c <= 0) return [0, 0];
      const k: number = Math.floor(c);
      const f: number = c - k;
      if (k >= cycles) return [cycles, 0];
      if (f >= 0.5) return [k + 1, 0];
      const s: number = minimumJerk.share(f / 0.5);
      return [k + s, Math.sin(Math.PI * s) * LIFT];
    };
    const crawl: (seconds: number) => IAutoMovieMotionHumanPosture = (
      seconds: number,
    ): IAutoMovieMotionHumanPosture => {
      const u: number = progress(seconds);
      const centre: IAutoMovieVector3 = Vector3.add(
        pelvis,
        Vector3.scale(along, (u / cycles) * distance),
      );
      const goals: IAutoMovieMotionHumanPosture["limbs"] = {};
      for (const l of limbs) {
        const [walked, lift] = step(l, u);
        const point: IAutoMovieVector3 = Vector3.add(
          Vector3.add(
            { x: pelvis.x, y: 0, z: pelvis.z },
            Vector3.scale(along, walked * stride),
          ),
          Vector3.add(frame(l.stance), { x: 0, y: lift, z: 0 }),
        );
        // An end bears only once the body has settled onto its supports.
        const planted: boolean = lift === 0 && seconds >= SETTLE;
        if (l.part === "leftHand" || l.part === "rightHand") {
          // The palm lies flat on the floor, the fingers toward the feet.
          const side: AutoMovieHumanSide =
            l.part === "leftHand" ? "left" : "right";
          const wrist: IAutoMovieMotionHumanHand.IWrist = HumanHand.place(
            body,
            side,
            "palm",
            point,
            HumanHand.rotation(side, { fingers: ahead, palm: DOWN }),
            "flat",
          );
          goals[l.limb] = {
            point: wrist.point,
            rotation: wrist.rotation,
            bend: Vector3.add(wrist.point, frame(l.bend)),
            planted,
          } satisfies IAutoMovieHumanLimbGoal;
        } else
          goals[l.limb] = {
            point,
            rotation: facing,
            bend: Vector3.add(point, frame(l.bend)),
            planted,
          } satisfies IAutoMovieHumanLimbGoal;
      }
      return {
        root: root(centre),
        yaw,
        pitch: shape.pitch,
        roll: 0,
        joints: {
          ...HumanHand.shape("left", "flat"),
          ...HumanHand.shape("right", "flat"),
          ...arched,
          neck: [shape.neck, 0, 0],
        },
        limbs: goals,
      };
    };

    // The contacts: each end bears between its swings.
    const contacts: IAutoMovieMotionHumanContactWindow[] = [];
    for (const l of limbs) {
      let from: number = SETTLE;
      for (let k: number = 0; k < cycles; ++k) {
        const lift: number = at(k + l.phase);
        const land: number = at(k + l.phase + 0.5);
        if (lift > from)
          contacts.push({
            part: l.part,
            kind: "plant",
            from: from / duration,
            to: lift / duration,
            support: { kind: "ground" },
          });
        from = land;
      }
      contacts.push({
        part: l.part,
        kind: "plant",
        from: from / duration,
        to: 1,
        support: { kind: "ground" },
      });
    }
    return {
      duration,
      events: [
        { name: "settled", share: SETTLE / duration },
        { name: "arrived", share: 1 },
      ],
      contacts,
      posture: (seconds: number): IAutoMovieMotionHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        if (t >= SETTLE) return crawl(t);
        return mixHumanPosture(
          entry,
          crawl(SETTLE),
          minimumJerk.share(t / SETTLE),
        );
      },
    };
  }
}
