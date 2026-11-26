import type { IAutoMovieMotionHumanAidWalk } from "@automovie/interface";

import type { IPlaygroundComposition } from "../../playground/structures/IPlaygroundComposition";
import type { IScene } from "../structures/IScene";
import { SceneBuild } from "./SceneBuild";

const { act, mutual, object, person, scene, seat }: typeof SceneBuild =
  SceneBuild;

/**
 * One floor aid's stage: the aid, the body that fits its mark and where it
 * stands.
 */
interface IAidStage {
  /** The aid. */
  kind: IAutoMovieMotionHumanAidWalk["kind"];

  /** The scene body that walks with it. */
  body: string;

  /** The aid's floor position, metres. */
  x: number;

  /** The aid's floor position, metres. */
  z: number;

  /** The aid producer's height dimension, metres. */
  height: number;
}

/** The three recorded floor-aid props and the body that fits each stage mark. */
const AIDS: readonly IAidStage[] = [
  { kind: "cane", body: "m1", x: -0.29, z: 0.16, height: 0.9 },
  { kind: "walker", body: "m1", x: 0, z: 0.13, height: 0.9 },
  { kind: "crutch", body: "f1", x: -0.24, z: 0.16, height: 0.9 },
];

/** One route starts, changes heading and comes to a grounded stop. */
const ROUTE: readonly IAutoMovieMotionHumanAidWalk.IStation[] = [
  { x: 0, z: 0.18, seconds: 0.84 },
  { x: 0.035, z: 0.36, turn: 16, seconds: 0.9 },
  { x: 0.095, z: 0.51, turn: 25, seconds: 1.05 },
];

/** The walker route keeps each bilateral lift within a short staged reach. */
const WALKER_ROUTE: typeof ROUTE = [
  { x: 0, z: 0.12, seconds: 0.84 },
  { x: 0.018, z: 0.24, turn: 8, seconds: 0.9 },
  { x: 0.049, z: 0.34, turn: 15, seconds: 1.05 },
];

/**
 * Aid travel and an interrupted room walk followed by a supported seat
 * transfer.
 */
export const SCENES_ASSISTANCE: readonly IScene[] = [
  ...AIDS.map(({ kind, body, x, z, height }: IAidStage): IScene => {
    const walker: boolean = kind === "walker";
    const aid: IPlaygroundComposition.IObject = {
      ...object(
        "aid",
        kind === "crutch" ? "createCrutch" : "createMobilityAid",
        kind === "crutch" ? undefined : kind,
        x,
        z,
        0,
        0,
        { height },
      ),
      aidWalk: { subject: "walker" },
    };
    return scene(
      {
        id: `walking-with-${kind}`,
        title:
          kind === "crutch"
            ? "Walking with a forearm crutch"
            : `Walking with a ${kind}`,
        summary:
          "The walker begins moving, turns, and comes to a stop with the aid set on the floor.",
        setting: "everyday",
        roles: { walker: "walker" },
        needs: [],
        view: "three-quarter",
        bodySwap: false,
      },
      `walking-with-${kind}`,
      [
        person("walker", body, 0, 0, 0, [
          act("aidWalk", {
            kind,
            prop: "aid",
            stations: walker ? WALKER_ROUTE : ROUTE,
          }),
        ]),
      ],
      [aid],
    );
  }),
  scene(
    {
      id: "supported-chair-to-bed",
      title: "From the chair to the bed",
      summary:
        "One person steadies another as they rise from a chair, move beside the bed, and sit down before their hands separate.",
      setting: "everyday",
      roles: { helper: "helper", recipient: "recipient" },
      needs: [],
      view: "three-quarter",
      bodySwap: false,
    },
    "chair-to-bed",
    [
      person("helper", "m1", -0.14, -0.36, 160, [act("stand", { hold: 0.25 })]),
      person("recipient", "f1", -0.2, -0.72, -90, [
        act("sit", { seat: seat("chair"), hold: 0.25 }),
      ]),
    ],
    [
      object("chair", "createSeat", "dining", 0.22, -0.72, -90),
      object("bed", "createBed", "single", 0.45, 0.5, 0, 0, { height: 0.49 }),
    ],
    [
      mutual(
        "assistedTransfer",
        { helper: "helper", helped: "recipient" },
        {
          from: { prop: "chair", point: "seat" },
          to: { prop: "bed", point: "rightSide", along: -0.66 },
          clasp: { x: -0.2, y: 0.88, z: -0.43 },
          seconds: 0.55,
        },
      ),
    ],
  ),
];
