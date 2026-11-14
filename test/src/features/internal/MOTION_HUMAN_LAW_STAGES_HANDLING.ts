import {
  createBall,
  createTool,
  createVessel,
  createWearable,
} from "@automovie/archetypes";
import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanFoot,
  HumanObject,
  type IHumanBody,
  type IHumanProp,
  catchObject,
  handshake,
} from "@automovie/motions";

import { motionHumanLawSweep } from "./motionHumanLawSweep";

const S: typeof motionHumanLawSweep = motionHumanLawSweep;

/** A power grip on the bottle's axis `y` up it, the palm from `toward`. */
const grip = (id: string, y: number, toward: number): IAutoMovieAffordance => ({
  id,
  kind: "handle",
  frame: {
    translation: { x: 0, y, z: 0 },
    rotation: Quaternion.normalize(
      Quaternion.multiply(
        Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, toward > 0 ? 180 : 0),
        Quaternion.normalize(
          Quaternion.multiply(
            Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, 90),
            Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, -90),
          ),
        ),
      ),
    ),
    scale: { x: 1, y: 1, z: 1 },
  },
  extent: null,
  grip: "power",
  aperture: 0.07,
});

/** An upright 70 by 190 mm bottle standing at a point. */
const bottle = (at: IAutoMovieVector3): IHumanProp => ({
  subject: "bottle",
  frame: { position: at, rotation: Quaternion.identity() },
  points: {},
  shapes: [
    {
      id: "glass",
      material: "glass",
      transform: {
        position: { x: 0, y: 0.095, z: 0 },
        rotation: Quaternion.identity(),
      },
      kind: "capsule",
      radius: 0.035,
      halfLength: 0.06,
    },
  ],
  affordances: [grip("low", 0.06, -1), grip("high", 0.15, 1)],
});

/**
 * Where the bottle stands for a hand: on a surface 0.15 m below the elbow
 * (Grandjean's band for light standing work), its low grip 85 % of the arm's
 * reach from that hand's resting shoulder.
 */
const place = (a: IHumanBody, hand: string): IAutoMovieVector3 => {
  const shoulder: IAutoMovieVector3 = a.rest.get(
    hand === "left" ? "leftUpperArm" : "rightUpperArm",
  )!;
  const reach: number = 0.85 * (a.measure.upperArm + a.measure.forearm);
  const top: number = a.measure.shoulderHeight - a.measure.upperArm - 0.15;
  const drop: number = shoulder.y - top - 0.06;
  return {
    x: shoulder.x,
    y: top,
    z: shoulder.z + Math.sqrt(reach * reach - drop * drop) + 0.035,
  };
};

/** The distance two people shake hands and hand a thing over at. */
const meeting = (a: IHumanBody, b: IHumanBody): number =>
  handshake.gap(a, b) +
  handshake.stance(a).sternum +
  handshake.stance(b).sternum;

/**
 * `a` picks the bottle up and hands it to `b`. The receiver takes with the
 * hand of the giver's side unless the row names theirs, so a left row is the
 * mirrored scene for both people.
 */
const handing = (
  pick: motionHumanLawSweep.Pick,
  a: IHumanBody,
  b: IHumanBody,
): motionHumanLawSweep.IScene => {
  const hand: string = pick("hand") ?? "right";
  const shoulder: IAutoMovieVector3 = a.rest.get(
    hand === "left" ? "leftUpperArm" : "rightUpperArm",
  )!;
  return S.duo(
    a,
    b,
    meeting(a, b),
    HumanChain.pair(
      S.chain()
        .act("stand", { seconds: 0.3, sway: 0 })
        .act("pickUp", { prop: "bottle", handle: "low", hand }),
      S.chain("b").act("stand", { seconds: 0.3, sway: 0 }),
    ).handOver({
      prop: "bottle",
      handle: "high",
      hand: hand as "left" | "right",
      receiverHand: (pick("receiverHand") ?? hand) as "left" | "right",
      mass: 0.5,
      ...(S.set(pick, "outcome") as object),
    }).node,
    [bottle({ x: shoulder.x, y: a.measure.hipHeight, z: 0.3 })],
  );
};

/** `a` throws to `b`, who catches, over a style's distance. */
const throwing = (
  a: IHumanBody,
  b: IHumanBody,
  style: string,
  thrower: object,
  catcher: object,
): motionHumanLawSweep.IScene => {
  const distance: number =
    style === "overarm" ? 6 : style === "underarm" ? 4 : 2.5;
  const ball: ReturnType<typeof createBall> = createBall({ kind: "handball" });
  return S.duo(
    a,
    b,
    distance,
    [
    S.chain().act(
      "throwObject",
      {
        at: S.point(
          0,
          b.measure.chestHeight,
          distance -
            catchObject.REACH * (b.measure.upperArm + b.measure.forearm),
        ),
        style,
        ...thrower,
      },
      "throw",
    ),
      S.chain("b").act("catchObject", {
        from: "throw",
        ball: "ball",
        ...catcher,
      }),
    ],
    [
      HumanObject.prop("ball", ball, {
        at: { x: 0, y: 0, z: 0.3 },
        yaw: 0,
      }),
    ],
  );
};

/** A point on a wall facing the performer, on a hand's side. */
const wall = (
  hand: string | undefined,
  x: number,
  y: number,
  z: number,
): object => S.point(-x * S.sign(hand), y, z, { x: 0, y: 0, z: -1 });

/**
 * The stages of the laws that handle things: picking up and putting down a
 * bottle, handing it over and receiving it, the handshake, throwing and
 * catching, operating a mechanism, kicking a ball, using a tool, wiping and
 * dressing.
 *
 * The stagings are those of the capture cases, mirrored to the left for a
 * left hand: the bottle on a surface 0.15 m below the elbow at 85 % of the
 * arm's reach; two people at the handshake's own distance; an overarm throw
 * over 6 m, an underarm one over 4 m and a toss over 2.5 m at the catcher's
 * chest, short of it by the catching reach; a button at 1.1 m, a knob at
 * 0.95 m turned 90 degrees, a drawer at 0.85 m pulled 0.25 m and a door
 * handle at 1 m swung 35 degrees; a football (`createBall`) 0.15 m ahead of
 * the toes; each tool taken up from a bench 0.15 m below the elbow and
 * worked on its work point, a stir in a saucepan on the bench before the
 * body; and a table top 0.225 m below the
 * elbow wiped three times; a hat or spectacles (`createWearable`) taken up
 * from hip height before the right hand and put on.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the family and each staging with its numbers.
 * @evidence contracts/development/design.md#principled-representation One stage per law, keyed by the law's name, each asking the row for the parameters it can set.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Twelve laws, the ones that handle a thing or a partner's hand.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A left row mirrors the whole staging rather than reaching across the body.
 */
export const MOTION_HUMAN_LAW_STAGES_HANDLING: Readonly<
  Record<string, motionHumanLawSweep.Stage>
> = {
  pickUp: (
    pick: motionHumanLawSweep.Pick,
    a: IHumanBody,
  ): motionHumanLawSweep.IScene => {
    const hand: string = pick("hand") ?? "right";
    return S.solo(
      a,
      S.chain()
        .act("stand", { seconds: 0.4, sway: 0 })
        .act("pickUp", { prop: "bottle", handle: "low", hand }),
      [bottle(place(a, hand))],
    );
  },
  putDown: (
    pick: motionHumanLawSweep.Pick,
    a: IHumanBody,
  ): motionHumanLawSweep.IScene => {
    const hand: string = pick("hand") ?? "right";
    const at: IAutoMovieVector3 = place(a, hand);
    return S.solo(
      a,
      S.chain()
        .act("stand", { seconds: 0.4, sway: 0 })
        .act("pickUp", { prop: "bottle", handle: "low", hand })
        .act("putDown", { prop: "bottle", at, yaw: 0, hand }),
      [bottle(at)],
    );
  },
  handOver: handing,
  receive: handing,
  handshake: (
    pick: motionHumanLawSweep.Pick,
    a: IHumanBody,
    b: IHumanBody,
  ): motionHumanLawSweep.IScene =>
    S.duo(
      a,
      b,
      meeting(a, b),
      HumanChain.pair(
        S.chain().act("stand", { seconds: 0.4, sway: 0 }),
        S.chain("b").act("stand", { seconds: 0.4, sway: 0 }),
      ).handshake(S.set(pick, "hand") as object).node,
    ),
  throwObject: (
    pick: motionHumanLawSweep.Pick,
    a: IHumanBody,
    b: IHumanBody,
  ): motionHumanLawSweep.IScene =>
    throwing(a, b, pick("style") ?? "overarm", S.set(pick, "hand"), {}),
  catchObject: (
    pick: motionHumanLawSweep.Pick,
    a: IHumanBody,
    b: IHumanBody,
  ): motionHumanLawSweep.IScene =>
    throwing(a, b, "toss", {}, S.set(pick, "hands", "side")),
  operate: (
    pick: motionHumanLawSweep.Pick,
    a: IHumanBody,
  ): motionHumanLawSweep.IScene => {
    const hand: string | undefined = pick("hand");
    const kind: string = pick("mechanism") ?? "button";
    const mechanism: object =
      kind === "knob"
        ? { kind, at: wall(hand, 0.2, 0.95, 0.5), turn: 90 }
        : kind === "slider"
          ? { kind, at: wall(hand, 0.15, 0.85, 0.5), travel: 0.25 }
          : kind === "hinge"
            ? {
                kind,
                at: wall(hand, 0.2, 1.0, 0.7),
                hinge: S.point(-0.55 * S.sign(hand), 1.0, 0.7),
                swing: 35,
              }
            : { kind, at: wall(hand, 0.15, 1.1, 0.5) };
    return S.solo(
      a,
      S.chain().act("operate", {
        mechanism,
        ...(hand === undefined ? {} : { hand }),
      }),
    );
  },
  kickBall: (
    pick: motionHumanLawSweep.Pick,
    a: IHumanBody,
  ): motionHumanLawSweep.IScene => {
    const foot: "left" | "right" = pick("foot") === "left" ? "left" : "right";
    const ankle: IAutoMovieVector3 = a.rest.get(`${foot}Foot`)!;
    const football: ReturnType<typeof createBall> = createBall({
      kind: "football",
    });
    const radius: number = football.affordance("grip").aperture! / 2;
    return S.solo(
      a,
      S.chain().act("kickBall", {
        ball: "ball",
        ...S.set(pick, "foot"),
      }),
      [
        HumanObject.prop("ball", football, {
          at: {
            x: ankle.x,
            y: 0,
            z: ankle.z + HumanFoot.offset(a, foot, "toe").z + 0.15 + radius,
          },
          yaw: 0,
        }),
      ],
    );
  },
  useTool: (
    pick: motionHumanLawSweep.Pick,
    a: IHumanBody,
  ): motionHumanLawSweep.IScene => {
    const hand: string = pick("hand") ?? "right";
    const tool: string = pick("tool") ?? "hammer";
    const bench: number = a.measure.shoulderHeight - a.measure.upperArm - 0.15;
    const props: IHumanProp[] = [
      HumanObject.prop(
        "tool",
        createTool({
          kind: tool === "stir" ? "spoon" : (tool as createTool.Kind),
        }),
        {
          position: {
            x: a.rest.get(hand === "left" ? "leftUpperArm" : "rightUpperArm")!
              .x,
            y: bench,
            z: 0.3,
          },
          rotation: Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 90),
        },
      ),
    ];
    if (tool === "stir")
      props.push(
        HumanObject.prop("pot", createVessel({ kind: "saucepan" }), {
          at: { x: 0, y: bench, z: 0.4 },
          yaw: 0,
        }),
      );
    return S.solo(
      a,
      S.chain()
        .act("stand", { seconds: 0.3, sway: 0 })
        .act("pickUp", {
          prop: "tool",
          handle: "grip",
          hand,
          use: {
            tip: "face",
            line: tool === "saw" || tool === "screwdriver" ? "forearm" : "square",
          },
        })
        .act("useTool", {
          tool,
          prop: "tool",
          on:
            tool === "stir"
              ? { kind: "prop", subject: "pot", point: "inside" }
              : tool === "screwdriver"
                ? wall(hand, 0.2, 1.15, 0.55)
                : wall(hand, 0.2, 0.85, 0.5),
          cycles: 3,
          hand,
        }),
      props,
    );
  },
  wipe: (
    pick: motionHumanLawSweep.Pick,
    a: IHumanBody,
  ): motionHumanLawSweep.IScene => {
    const hand: string | undefined = pick("hand");
    return S.solo(
      a,
      S.chain().act("wipe", {
        on: S.point(
          0.15 * S.sign(hand),
          a.measure.shoulderHeight - a.measure.upperArm - 0.225,
          0.4,
        ),
        cycles: 3,
        ...(hand === undefined ? {} : { hand }),
      }),
    );
  },
  dress: (
    pick: motionHumanLawSweep.Pick,
    a: IHumanBody,
  ): motionHumanLawSweep.IScene => {
    const item: string = pick("item") ?? "hat";
    return S.solo(
      a,
      S.chain()
        .act("stand", { seconds: 0.3 })
        .act("pickUp", { prop: "item", handle: "hold", hand: "right" })
        .act("dress", { item, prop: "item", hand: "right" }),
      [
        HumanObject.prop(
          "item",
          createWearable({ kind: item === "hat" ? "hat" : "spectacles" }),
          {
            at: { x: -0.2, y: a.measure.hipHeight, z: 0.35 },
            yaw: item === "hat" ? 0 : 180,
          },
        ),
      ],
    );
  },
};
