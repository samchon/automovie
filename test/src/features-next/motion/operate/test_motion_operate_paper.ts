import { createStationery } from "@automovie/archetypes";
import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionPropDrive,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain, HumanObject, HumanPerformance } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { nclose, qclose, vclose } from "../../../features/internal/predicates";

/**
 * A standing performer can turn a single supported leaf or unfold a supported
 * panel with the public hinge operation. Author a fully open cover before
 * operating the page. The Smithsonian Institution Archives' Reading Room Rules
 * direct readers to keep bound volumes supported.
 *
 * Scenarios:
 * 1. With the cover open at 180 degrees, an average man turns the 130 mm leaf of a
 *    book by 180 degrees. The leaf turns independently and the cover stays open.
 * 2. A small woman unfolds a 110 mm map panel by 180 degrees. With its crease
 *    on the opposite side from the book's spine, the edge travels the other way.
 * 3. In each fixture the hand reaches the moving edge, and after release the
 *    edge stays on the far side of the hinge for another second.
 * 4. Exact and off-grid reads agree with the ordinary posture reader, including
 *    the external articulation callback order and values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the supported cases and the independent directions and held final state.
 * @evidence contracts/development/testing.md#behavioral-verification Runs the public HumanChain operation in HumanPerformance and observes a single drive, its progress, wrist proximity, retained prop state and the resolved aim at the edge.
 * @evidence contracts/development/testing.md#independent-expectations A 180 degree turn reflects the edge across its hinge in the plane normal to the hinge line. The expected far-side points use the authored 130 mm width and 20 mm thickness or the 110 mm by 7 mm folded map. The wrist proximity uses the same 0.7 hand-length limit as the door-drive specification.
 * @evidence contracts/development/testing.md#distinguishing-cases Opposite fold directions, two body sizes, independent pre-existing cover state, during the stroke and after release. Out-of-order reads distinguish prepared and ordinary hinge display while observing the same external articulation calls.
 * @evidence contracts/development/testing.md#execution-ownership Runs two in-memory public performances with canonical bodies.
 */
export function test_motion_operate_paper(): void {
  for (const kind of ["book", "map"] as const) {
    const book: boolean = kind === "book";
    const body: IAutoMovieMotionHumanBody = motionHumanBody(
      book ? "m-average" : "f-small",
    );
    const width: number = book ? 0.13 : 0.11;
    const thickness: number = book ? 0.02 : 0.007;
    const model: ReturnType<typeof createStationery> = createStationery({
      kind,
      width,
      thickness,
    });
    const articulation: "page" | "fold" = book ? "page" : "fold";
    const point: "page-edge" | "fold-edge" = book ? "page-edge" : "fold-edge";
    const at: IAutoMovieVector3 = {
      x: -body.measure.shoulderHalfWidth + (book ? width / 2 : -width / 2),
      y: 0.6 * body.measure.stature,
      z: 0.3,
    };
    const tracks: readonly IAutoMovieMotionHumanProp.ITrack[] = book
      ? [
          {
            articulation: "hinge",
            start: 0,
            duration: 0.5,
            travel: (): number => 180,
          },
        ]
      : [];
    const target: { kind: "prop"; subject: string; point: string } = {
      kind: "prop",
      subject: "paper",
      point,
    };
    /** Create an independent fixture that records its model's pose observations. */
    const stage = (
      observations: string[],
    ): IAutoMovieMotionHumanPerformance => {
      const prop: IAutoMovieMotionHumanProp = HumanObject.prop(
        "paper",
        model,
        { at, yaw: 0, fixed: true },
        undefined,
        undefined,
        tracks,
      );
      const articulate: NonNullable<IAutoMovieMotionHumanProp["articulate"]> =
        prop.articulate!;
      return new HumanPerformance({
        seed: "supported-paper",
        props: [
          {
            ...prop,
            articulate: (state: Readonly<Record<string, number>>) => {
              observations.push(JSON.stringify(state));
              return articulate(state);
            },
          },
        ],
        performers: [
          {
            subject: "reader",
            body,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
        ],
        composition: HumanChain.subject("reader")
          .stand({ hold: 1 })
          .operate({
            hand: "right",
            kind: { kind: "hinge", at: target, swing: 180 },
          })
          .stand({ hold: 1 }).node,
      });
    };
    const observed: string[] = [];
    const performance: IAutoMovieMotionHumanPerformance = stage(observed);
    const operation: IAutoMovieMotionHumanSegment =
      performance.segments("reader")[1]!;
    const drives: readonly IAutoMovieMotionPropDrive[] =
      operation.plan.drives ?? [];
    TestValidator.predicate(
      `${kind}: the operation drives only the edge's hinge`,
      drives.length === 1 && drives[0]!.articulation === articulation,
    );
    const drive: IAutoMovieMotionPropDrive = drives[0]!;
    const strokeStart: number =
      operation.start + drive.from * operation.plan.duration;
    const strokeEnd: number =
      operation.start + drive.to * operation.plan.duration;
    const ordinaryObserved: string[] = [];
    const ordinary: IAutoMovieMotionHumanPerformance = stage(ordinaryObserved);
    const reader: IAutoMovieMotionHumanActionPlan =
      ordinary.segments("reader")[1]!.plan;
    const posture: IAutoMovieMotionHumanActionPlan["posture"] = reader.posture;
    let ordinaryReads: number = 0;
    reader.posture = (...args: Parameters<typeof posture>) => {
      ++ordinaryReads;
      return Reflect.apply(posture, reader, args);
    };
    const interior: number = strokeStart + 0.371 * (strokeEnd - strokeStart);
    for (const seconds of [
      strokeEnd,
      interior,
      strokeStart,
      strokeEnd + 0.013,
      interior,
    ]) {
      observed.length = 0;
      ordinaryObserved.length = 0;
      const actual: ReturnType<typeof performance.bones> = performance.bones(
        "reader",
        seconds,
      );
      const expected: ReturnType<typeof ordinary.bones> = ordinary.bones(
        "reader",
        seconds,
      );
      TestValidator.predicate(
        `${kind}: hand and body match ordinary evaluation at ${seconds} s`,
        actual.size === expected.size &&
          [...expected].every(([name, bone]) => {
            const sample: typeof bone | undefined = actual.get(name);
            return (
              sample !== undefined &&
              vclose(sample.worldPosition, bone.worldPosition, 1e-12) &&
              qclose(sample.worldRotation, bone.worldRotation, 1e-12)
            );
          }),
      );
      TestValidator.equals(
        `${kind}: articulation calls occur in the same order at ${seconds} s`,
        observed,
        ordinaryObserved,
      );
    }
    TestValidator.predicate(
      `${kind}: the replaced reader reaches the ordinary path`,
      ordinaryReads > 0,
    );
    const midway: Readonly<Record<string, number>> = performance.state(
      "paper",
      (strokeStart + strokeEnd) / 2,
    );
    TestValidator.predicate(
      book
        ? "the page turns while the cover stays open"
        : "the map panel moves during the stroke",
      midway[articulation]! > 0 &&
        midway[articulation]! < 180 &&
        (!book || nclose(midway.hinge!, 180, 1e-9)),
    );

    // Reflect the free edge across its hinge in the plane perpendicular to it.
    const hingeX: number = ((book ? -1 : 1) * width) / 2;
    const hingeY: number = book ? (thickness + 0.0001) / 2 : thickness / 2;
    const edgeY: number = book ? hingeY : (3 * thickness) / 4;
    const expected: IAutoMovieVector3 = {
      x: at.x + 3 * hingeX,
      y: at.y + 2 * hingeY - edgeY,
      z: at.z,
    };
    for (const seconds of [
      strokeEnd,
      operation.start + operation.plan.duration + 1,
    ]) {
      const state: Readonly<Record<string, number>> = performance.state(
        "paper",
        seconds,
      );
      const aimed: IAutoMovieVector3 = performance.aim(target, seconds, {
        root: { x: 0, y: 0, z: 0 },
        yaw: 0,
        heights: { low: 0.5, middle: 1, high: 1.5 },
        range: 1,
        body,
        bones: () => performance.bones("reader", seconds),
      }).point;
      TestValidator.predicate(
        `${kind}: the moved edge holds its far-side position at ${seconds.toFixed(2)} s`,
        nclose(state[articulation]!, 180, 1e-9) &&
          (!book || nclose(state.hinge!, 180, 1e-9)) &&
          vclose(aimed, expected, 1e-3),
      );
    }
    const wrist: IAutoMovieVector3 = performance
      .bones("reader", strokeEnd)
      .get("rightHand")!.worldPosition;
    TestValidator.predicate(
      `${kind}: the operating wrist reaches the moving edge`,
      Math.hypot(
        wrist.x - expected.x,
        wrist.y - expected.y,
        wrist.z - expected.z,
      ) <=
        0.7 * body.measure.hand,
    );
  }
}
