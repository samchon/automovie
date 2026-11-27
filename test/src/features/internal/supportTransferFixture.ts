import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanPropReader,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
import { AutoMovieMotionHumanSupport, AutoMovieMotionHumanRefusal } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * Synthetic support tracks for the boarding transfer specification.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the shared named-support test inputs and time-varying geometry.
 * @evidence contracts/development/design.md#principled-representation Fixture dimensions and travel use metres, with yaw in degrees on the film clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Shares the portable prop reader and the refusal cases used by the feature spec.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Authored dimensions and known track motion determine the witnesses independently of the transfer planner.
 */
export namespace supportTransferFixture {
  /**
   * Exercise refusal cases with the same entry and an otherwise valid crossing.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the common admitted entry and the changed inputs in each refusal.
   * @evidence contracts/development/implementation.md#principled-implementation Submits exactly one changed destination, docking mode or track per refusal and checks the reported axis.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Takes the valid setup from the caller and submits the invalid variants through the public planner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses authored geometry and track changes to decide the expected refusal.
   * @evidence contracts/development/implementation.md#efficient-algorithms Each named case calls the planner once and reads its refusal without sampling extra poses.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the caller's body, entry and valid fixture readers.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The variants are local to this specification and no hosts are opened.
   */
  export function checkRefusals(
    context: Parameters<typeof AutoMovieMotionHumanSupport.supportTransfer>[0],
    movingProps: Parameters<typeof AutoMovieMotionHumanSupport.supportTransfer>[0]["prop"],
    newEdge: number,
  ): void {
    const { start, params } = context;
    const { seconds } = params;
    const platform: IAutoMovieMotionHumanPropReader = context.prop("platform");
    const deck: IAutoMovieMotionHumanPropReader = context.prop("car");
    const gangway: IAutoMovieMotionHumanPropReader = movingProps("platform");
    const movingDeck: IAutoMovieMotionHumanPropReader = movingProps("car");
    const movingParams: typeof params = { ...params, docking: "co-moving" };
    /** Check the failed admission axis using the admitted dock fixture. */
    const reject = (
      changes: Partial<Parameters<typeof AutoMovieMotionHumanSupport.supportTransfer>[0]>,
      axis: string,
      scenario: string = axis,
    ): void => {
      try {
        AutoMovieMotionHumanSupport.supportTransfer({ ...context, ...changes });
      } catch (error) {
        TestValidator.predicate(
          "The transfer refuses " + scenario + " on " + axis,
          error instanceof AutoMovieMotionHumanRefusal && error.axis === axis,
        );
        return;
      }
      TestValidator.predicate(
        "The transfer refuses " + scenario + " on " + axis,
        false,
      );
    };
    reject(
      {
        params: {
          ...context.params,
          from: { prop: "platform", surface: "missing" },
        },
      },
      "from",
    );
    reject(
      { params: { ...context.params, landing: { x: 2, z: 0 } } },
      "landing",
    );
    reject(
      {
        prop: (id) =>
          id === "platform"
            ? platform
            : surface("car", newEdge + 0.7, 0, () => 0),
      },
      "to",
    );
    reject({ prop: movingProps }, "from", "shared motion in stationary mode");
    reject(
      {
        params: {
          ...movingParams,
          docking: "unknown" as typeof movingParams.docking,
        },
      },
      "docking",
    );
    const badDeck =
      (frame: IAutoMovieMotionHumanPropReader["frame"]) =>
      (id: string): IAutoMovieMotionHumanPropReader =>
        id === "platform" ? platform : { ...deck, frame };
    reject(
      {
        prop: badDeck((t) => ({
          ...deck.frame(t),
          position: { ...deck.frame(t).position, x: Number.NaN },
        })),
      },
      "to",
      "nonfinite entry frame",
    );
    reject(
      {
        params: movingParams,
        prop: badDeck((t) =>
          t === start
            ? deck.frame(t)
            : {
                ...deck.frame(t),
                rotation: { x: 0, y: 0, z: 0, w: 0 },
              },
        ),
      },
      "to",
      "non-unit live rotation",
    );
    const wideDeck: IAutoMovieMotionHumanPropReader = surface(
      "car",
      newEdge + 0.5,
      0,
      () => 50,
      (t: number): number => (0.08 * (t - start)) / seconds,
      0,
      102,
    );
    const offCentre: typeof params = {
      ...movingParams,
      landing: { ...movingParams.landing!, x: -50 },
    };
    AutoMovieMotionHumanSupport.supportTransfer({
      ...context,
      params: offCentre,
      prop: (id: string): IAutoMovieMotionHumanPropReader =>
        id === "platform"
          ? platform
          : { ...wideDeck, frame: () => wideDeck.frame(start) },
    });
    reject(
      {
        params: offCentre,
        prop: (id) => (id === "platform" ? platform : wideDeck),
      },
      "to",
      "yaw moving an off-centre landing while the deck centre stays fixed",
    );
    reject(
      {
        params: movingParams,
        prop: (id: string): IAutoMovieMotionHumanPropReader =>
          id === "platform"
            ? gangway
            : surface(
                "car",
                newEdge + 0.5,
                0,
                (t: number): number => 1.1 * gangway.frame(t).position.x,
                () => 0,
              ),
      },
      "to",
      "independent deck drift in co-moving mode",
    );
    // The prop origin stays fixed and the yaw stays below 0.1 degrees,
    // but the 100 m offset moves the rectangle by centimetres.
    reject(
      {
        params: movingParams,
        prop: (id: string): IAutoMovieMotionHumanPropReader =>
          id === "platform"
            ? platform
            : surface(
                "car",
                newEdge + 0.5,
                0,
                () => -100,
                (t: number): number => (0.05 * (t - start)) / seconds,
                100,
              ),
      },
      "to",
      "deck yaw about a distant prop origin",
    );
    const movingDeckOnly = (id: string): IAutoMovieMotionHumanPropReader =>
      id === "platform" ? platform : movingDeck;
    reject({ prop: movingDeckOnly }, "to");
  }
  /**
   * Create a horizontal metre-deep fixture with X travel and offset in metres and yaw in degrees.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States units, rectangle depth and axes.
   * @evidence contracts/development/implementation.md#principled-implementation Places one horizontal rectangle at a prop-local offset from the authored moving pivot.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The callback supplies translation and yaw and the affordance supplies the rectangle.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Deliberately includes arbitrary local offsets, so the planner must use named socket geometry.
   * @evidence contracts/development/implementation.md#efficient-algorithms Builds one fixed-size rectangle with a constant number of reads from each callback per sample.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The returned reader supplies both its authored rest frame and its live motion.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The fixture retains two caller functions and plain geometry data.
   */
  export function surface(
    subject: string,
    z: number,
    y: number,
    travel: (time: number) => number,
    yaw: (time: number) => number = (time: number): number => 10 * travel(time),
    offsetX: number = 0,
    width: number = 2,
  ): IAutoMovieMotionHumanPropReader {
    const frame = (time: number): IAutoMovieRigidTransform => ({
      position: { x: travel(time), y, z },
      rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, yaw(time)),
    });
    return {
      frame,
      prop: {
        subject,
        frame: frame(0),
        points: {},
        affordances: [
          {
            id: "floor",
            kind: "surface",
            width,
            depth: 1,
            extent: null,
            frame: {
              translation: { x: offsetX, y: 0, z: 0 },
              rotation: Quaternion.identity(),
              scale: { x: 1, y: 1, z: 1 },
            },
          },
        ],
      },
    };
  }
}
