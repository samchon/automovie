import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
import { AutoMovieMotionHumanRefusal, HumanSupportFrame } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../internal/motionActionContext";
import { nclose } from "../../internal/nclose";

namespace part_human_support_frame_board {
  /** The gait's speed the props are boarded at, m/s. */
  const GAIT: number = 1.2;

  /** How far past or short of the gait's speed the props move, m/s. */
  const OVER: number = 1e-3;

  /**
   * `HumanSupportFrame.board` refuses stepping from the ground onto a prop that
   * moves faster at the action's start than the gait can match, naming the
   * prop's speed and the feasible range up to the gait's; a prop no faster is
   * boarded, and a body already standing on the prop is not boarding.
   *
   * Scenarios, props translating along +X at constant speeds, boarded at 1.2
   * m/s:
   *
   * 1. A prop 1 mm/s slower than the gait is boarded.
   * 2. One 1 mm/s faster is refused on `on` with its speed and the range 0 to 1.2
   *    m/s.
   * 3. The same fast prop is not refused for a body already standing on it.
   */
  export function verify(): void {
    const context: (
      supports: HumanSupportFrame.IBoardContext["entry"]["supports"],
    ) => HumanSupportFrame.IBoardContext = (
      supports: HumanSupportFrame.IBoardContext["entry"]["supports"],
    ): HumanSupportFrame.IBoardContext => ({
      entry: { supports },
      start: 0.5,
      prop: (
        subject: string,
      ): ReturnType<HumanSupportFrame.IBoardContext["prop"]> => ({
        frame: (seconds: number): IAutoMovieRigidTransform => ({
          position: {
            x: (subject === "fast" ? GAIT + OVER : GAIT - OVER) * seconds,
            y: 0,
            z: 0,
          },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
        }),
      }),
      performer: (subject: string): never => {
        throw new Error(`no performer ${subject}`);
      },
    });
    HumanSupportFrame.board(context([]), "slow", GAIT);
    HumanSupportFrame.board(
      context([
        {
          part: "leftFoot",
          kind: "plant",
          support: { kind: "prop", subject: "fast" },
        },
      ]),
      "fast",
      GAIT,
    );
    let refusal: AutoMovieMotionHumanRefusal | undefined;
    try {
      HumanSupportFrame.board(context([]), "fast", GAIT);
    } catch (error: unknown) {
      if (error instanceof AutoMovieMotionHumanRefusal) refusal = error;
    }
    TestValidator.predicate(
      "a prop faster than the gait",
      refusal !== undefined &&
        refusal.kind === "base" &&
        refusal.axis === "on" &&
        refusal.feasible?.kind === "range" &&
        refusal.feasible.minimum === 0 &&
        refusal.feasible.maximum === GAIT &&
        nclose(Number(refusal.value), GAIT + OVER, 1e-9),
    );
  }
}

namespace part_human_support_frame_floor {
  /** Rounding of a forward-kinematics chain, metres. */
  const ROUNDING: number = 1e-9;

  /**
   * `HumanSupportFrame`'s entry readings: `contact` is what an entry part bears
   * on, the ground when it declares none; `floor` is the height of the floor
   * the planted feet touch, the lowest of their sole sockets, the ground's 0
   * with no foot planted; `at` reads a ground support as a still frame at its
   * height.
   *
   * The body is built whole (`humanFixtureBody`): the sole sockets are read
   * from the entry's pose by forward kinematics.
   *
   * Scenarios, the average man standing quiet:
   *
   * 1. His feet bear on the ground, as does a part with no contact; a left foot
   *    planted on a cart bears on the cart.
   * 2. Standing 0.5 m higher raises the floor by 0.5 m; with neither foot planted
   *    the floor is 0.
   * 3. The ground support at 1 s is still, at the origin.
   */
  export async function verify(): Promise<void> {
    const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
    const low: IAutoMovieMotionHumanActionContext<object> = motionActionContext(
      body,
      {},
    );
    const high: IAutoMovieMotionHumanActionContext<object> =
      motionActionContext(body, {}, { at: { x: 0, y: 0.5, z: 0 } });
    const onCart: Pick<IAutoMovieMotionHumanActionContext, "entry"> = {
      entry: {
        ...low.entry,
        supports: [
          {
            part: "leftFoot",
            kind: "plant",
            support: { kind: "prop", subject: "cart" },
          },
        ],
      },
    };
    TestValidator.equals(
      "the contacts",
      [
        HumanSupportFrame.contact(low, "leftFoot"),
        HumanSupportFrame.contact(low, "leftHand"),
        HumanSupportFrame.contact(onCart, "leftFoot"),
      ],
      [
        { kind: "ground" },
        { kind: "ground" },
        { kind: "prop", subject: "cart" },
      ],
    );
    const lifted: IAutoMovieMotionHumanEntryState = {
      ...low.entry,
      feet: {
        left: { ...low.entry.feet.left, planted: false },
        right: { ...low.entry.feet.right, planted: false },
      },
    };
    TestValidator.predicate(
      "the floor",
      nclose(
        HumanSupportFrame.floor(body, high.entry),
        HumanSupportFrame.floor(body, low.entry) + 0.5,
        ROUNDING,
      ) && HumanSupportFrame.floor(body, lifted) === 0,
    );
    const frame: ReturnType<typeof HumanSupportFrame.at> = HumanSupportFrame.at(
      low,
      1,
    );
    TestValidator.equals(
      "the ground",
      [frame.support, frame.position, frame.velocity, frame.acceleration],
      [
        { kind: "ground" },
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: 0 },
      ],
    );
  }
}

/**
 * `HumanSupportFrame`'s unit contract: its board and floor frames.
 *
 * Its parts, each documented with its own scenarios:
 *
 * - `human_support_frame_board`: `HumanSupportFrame.board` refuses stepping from
 *   the ground onto a prop that moves faster at the action's start than the
 *   gait can match, naming the prop's speed and the feasible range up to the
 *   gait's;
 * - `human_support_frame_floor`: `HumanSupportFrame`'s entry readings:
 */
export async function test_motions_carrier_human_support_frame(): Promise<void> {
  part_human_support_frame_board.verify();
  await part_human_support_frame_floor.verify();
}
