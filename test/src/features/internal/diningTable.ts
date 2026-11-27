import { AutoMovieArchetypeSeat, AutoMovieArchetypeTable } from "@automovie/archetypes";
import type {
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSeated,
  IAutoMovieMotionHumanSegment,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanObject, HumanPerformance } from "@automovie/motions";
import { HUMAN_LEXICON } from "@automovie/motions/internal";

import { everydayTake } from "./everydayTake";
import { motionComplaints } from "./motionComplaints";
import { motionHumanBody } from "./motionHumanBody";

/**
 * The seated dining scene shared by the knife-and-fork, chopsticks and
 * serving specs: the chair and table, points on the top, the take, its
 * segments by law, the mouth and the two-body run.
 */
export namespace diningTable {
  /** A utensil's working point stays on the food within this, metres. */
  export const ON: number = 0.01;
  /** A held prop drifts at most this in its hand's (or carrier's) frame, metres. */
  export const HOLD: number = 0.005;
  /** A bite reaches the mouth within this, metres: the lips' half width. */
  export const MOUTH: number = 0.06;

  /** The seated diner's chair. */
  const CHAIR: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };

  /** The seated scene at a table. */
  export function stage(): IStage {
    const chair = AutoMovieArchetypeSeat.create({ id: "chair", kind: "dining" });
    const placement = { at: CHAIR, yaw: 0, fixed: true } as const;
    const table = AutoMovieArchetypeTable.create({ id: "table", kind: "dining" });
    const top: IAutoMovieAffordance = table.affordances!.find(
      (a: IAutoMovieAffordance): boolean => a.id === "top",
    )!;
    return {
      seat: HumanObject.seat(chair, placement),
      props: [
        HumanObject.prop("chair", chair, placement),
        everydayTake.prop(
          "table",
          table,
          { x: 0, y: 0, z: CHAIR.z + 0.05 + top.depth! / 2 },
          undefined,
          true,
        ),
      ],
      height: top.frame.translation.y,
      near: CHAIR.z + 0.05,
    };
  }

  /** A point on the table top, across and ahead of its near edge. */
  export function on(s: IStage, x: number, ahead: number): IAutoMovieVector3 {
    return { x, y: s.height, z: s.near + ahead };
  }

  /** The take with the shipped verdicts. */
  export function play(
    label: string,
    body: IAutoMovieMotionHumanBody,
    props: readonly IAutoMovieMotionHumanProp[],
    chain: IAutoMovieMotionHumanChain,
  ): HumanPerformance {
    const take: HumanPerformance = everydayTake.perform(
      `dining-${label}`,
      body,
      props,
      chain,
      Object.values(HUMAN_LEXICON).flat(),
    );
    everydayTake.clean(label, take);
    return take;
  }

  /** The segments of one law, in order. */
  export function named(
    take: HumanPerformance,
    law: string,
  ): IAutoMovieMotionHumanSegment[] {
    return take
      .segments("actor")
      .filter((s: IAutoMovieMotionHumanSegment): boolean => s.law.name === law);
  }

  /** The mouth: the head bone's point carried a head's half depth forward. */
  export function mouth(take: HumanPerformance, t: number): IAutoMovieVector3 {
    return take.bones("actor", t).get("head")!.worldPosition;
  }

  /** The seated scene. */
  export interface IStage {
    /** The chair's seat. */
    seat: IAutoMovieMotionHumanSeated.ISeat;

    /** The chair and the table. */
    props: IAutoMovieMotionHumanProp[];

    /** The table top's height, metres. */
    height: number;

    /** The table's near edge, world `z`. */
    near: number;
  }

  /** One dining scenario on one body with its dominant hand. */
  export type Scene = (
    body: IAutoMovieMotionHumanBody,
    label: string,
    side: AutoMovieHumanSide,
    checks: motionComplaints.IGatherer,
  ) => void;

  /**
   * Run one dining scenario right-handed on m-average and left-handed on
   * f-small, gathering every check, and assert them under one name.
   *
   * @param name The scenario's name, in each check and the assertion.
   * @param scene The scenario.
   */
  export function run(name: string, scene: Scene): void {
    const checks: motionComplaints.IGatherer = motionComplaints();
    for (const label of ["m-average", "f-small"] as const) {
      const body: IAutoMovieMotionHumanBody = motionHumanBody(label);
      const side: AutoMovieHumanSide = label === "m-average" ? "right" : "left";
      try {
        scene(body, `${label} ${name}`, side, checks);
      } catch (error: unknown) {
        checks.check(
          `${label} ${name} refused: ${everydayTake.describe(error)}`,
          false,
        );
      }
    }
    checks.assert(`dining utensils ${name}`);
  }
}
