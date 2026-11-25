import type {
  IAutoMovieIntent,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanPerformanceState,
} from "@automovie/interface";
import { HumanObject } from "@automovie/motions";
import { HumanPerformanceAhead } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { standingPerformanceState } from "../../../internal/fixtures/standingPerformanceState";
import { testAffordance } from "../../../internal/fixtures/testAffordance";

/**
 * `HumanPerformanceAhead.reader` asks the first later action naming a grip's
 * prop what it demands of the grip, and `cut` states how an action is cut into
 * the next one, with what that action plants.
 *
 * The actor's chain is a stand, a `wave` naming nothing, a `draw` naming the
 * sword its law resolves, and a `sheathe` naming it too; the `draw` law plants
 * the sword's tip at a lean its resolved parameters carry.
 *
 * Scenarios:
 *
 * 1. A grip on the sword asks the `draw`, with its resolved parameters, the
 *    performer and the grip, and its aim places a world point; asked again the
 *    `draw` is found from the first search.
 * 2. A grip on a prop no later action names asks nothing; nor does one whose
 *    first naming action has no demands, or a capability the vocabulary lacks.
 * 3. A cut at an event or a share of the stand is that event or share, with the
 *    plant the next action's law states for its resolved parameters; a cut
 *    cued by another anchor or by a proximity, or no cut, is none.
 */
export async function test_unit_motions_perform_ahead(): Promise<void> {
  const sword = HumanObject.prop(
    "sword",
    { affordances: [testAffordance("tip", "handle", { x: 0, y: 1, z: 0 })] },
    { at: { x: 0, y: 0, z: 0 }, yaw: 0 },
  );
  const { state } = await standingPerformanceState([sword]);
  const stand: IAutoMovieMotionHumanActionLaw<never> = state.laws.get("stand")!;
  const asked: object[] = [];
  const planted: unknown[] = [];
  let resolved: number = 0;
  const draw: IAutoMovieMotionHumanActionLaw<never> = {
    ...stand,
    resolve: (given: object): object => {
      ++resolved;
      return { ...given, weapon: "sword", lean: 0.2 };
    },
    demands: (ahead) => {
      asked.push({
        subject: ahead.subject,
        params: ahead.params,
        prop: ahead.grip.prop,
        point: ahead.aim(
          { kind: "point", frame: "world", at: { x: 1, y: 2, z: 3 } },
          0,
        ).point,
      });
      return [];
    },
    plants: (params: never) => {
      planted.push(params);
      return { prop: "sword", end: "tip", lean: 0.2 };
    },
  };
  const sheathe: IAutoMovieMotionHumanActionLaw<never> = {
    ...stand,
    resolve: (given: object): object => ({ ...given, held: "shield" }),
  };
  const intent = (
    capability: string,
    params: object = {},
  ): IAutoMovieIntent => ({
    subject: "actor",
    capability,
    parameters: { params },
  });
  const self: IAutoMovieMotionHumanPerformanceState = {
    ...state,
    laws: new Map([
      ...state.laws,
      ["wave", stand],
      ["draw", draw],
      ["sheathe", sheathe],
    ]),
    intended: new Map([
      [
        "actor",
        [
          intent("stand"),
          intent("wave"),
          intent("draw", { hand: "right" }),
          intent("sheathe"),
        ],
      ],
    ]),
  };
  const context = state.people.get("actor")!.segments[0]!.context;
  const grip = (prop: string): IAutoMovieMotionHumanActionLaw.IGrip => ({
    prop,
    side: "right",
    posture: state.people.get("actor")!.initial,
    tool: () => {
      throw new Error("the tool is not read ahead");
    },
  });

  // 1. The first action naming the sword.
  const read = HumanPerformanceAhead.reader(self, context, 0);
  const first = read(grip("sword"));
  const again = read(grip("sword"));
  TestValidator.predicate(
    "the draw is asked",
    first.length === 0 &&
      again.length === 0 &&
      asked.length === 2 &&
      resolved === 1 &&
      JSON.stringify(asked[0]) ===
        JSON.stringify({
          subject: "actor",
          params: { hand: "right", weapon: "sword", lean: 0.2 },
          prop: "sword",
          point: { x: 1, y: 2, z: 3 },
        }),
  );

  // 2. Nothing asked.
  const before: number = asked.length;
  const unknown: Map<string, IAutoMovieMotionHumanActionLaw<never>> = new Map(
    self.laws,
  );
  unknown.delete("wave");
  TestValidator.predicate(
    "nothing asked",
    read(grip("shield")).length === 0 &&
      read(grip("lamp")).length === 0 &&
      HumanPerformanceAhead.reader(self, context, 2)(grip("shield")).length ===
        0 &&
      HumanPerformanceAhead.reader(
        { ...self, laws: unknown },
        context,
        0,
      )(grip("sword")).length === 0 &&
      asked.length === before,
  );

  // 3. Cuts.
  const cut = (until: IAutoMovieIntent["until"], ordinal: number = 1) =>
    HumanPerformanceAhead.cut(
      self,
      { ...intent("wave"), ...(until === undefined ? {} : { until }) },
      ordinal,
    );
  TestValidator.equals("a cut at an event", cut({ event: "peak" }), {
    event: "peak",
    plant: { prop: "sword", end: "tip", lean: 0.2 },
  });
  TestValidator.equals("the plant reads the resolved parameters", planted, [
    { hand: "right", weapon: "sword", lean: 0.2 },
  ]);
  TestValidator.equals("a cut at a share", cut({ share: 0.5 }, 2), {
    share: 0.5,
  });
  TestValidator.predicate(
    "no cut of its own",
    cut(undefined) === undefined &&
      cut({ of: "bell", event: "ring" }) === undefined &&
      cut({
        proximity: {
          effector: "palmRight",
          target: { kind: "point", frame: "world", at: { x: 0, y: 0, z: 0 } },
          distance: 0,
        },
      }) === undefined,
  );
}
