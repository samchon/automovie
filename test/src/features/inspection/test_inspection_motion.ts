import {
  type AutoMoviePhysicsCache,
  type IAutoMovieMark,
  markAutoMovieRomOvershoot,
  markAutoMovieSkeleton,
} from "@automovie/engine";
import type { IAutoMoviePhysicalProfile } from "@automovie/interface";
import {
  type IAutoMovieInspectionHandle,
  type IAutoMovieInspectionTrail,
  applyAutoMovieInspection,
  markAutoMovieInspectionTrails,
  planAutoMovieInspectionTrailTimes,
  sampleAutoMovieInspectionTrails,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { InspectionScene } from "../internal/InspectionScene";

/**
 * Motion is read from stills through sampled paths and marks handed over per second: the instrument samples where objects go, and draws whatever a producer hands it at the drawn second.
 *
 * Scenarios:
 *
 * 1. An object moving one metre per second along X, sampled at five seconds, gives one moving trail: a polyline and five ticks through its positions, and the tick of the drawn second, 2, emphasised.
 * 2. An object that does not move gives one tick, no line, and is reported stationary.
 * 3. A trail pattern matching nothing is refused, and so is an empty list of times.
 * 4. Skeleton marks handed to the inspection at one second and then the next are drawn only at their own second: the second update replaces the first second's joints.
 * 5. A range overshoot at one joint is drawn as a flagged point in the flag colour and listed under a flag entry of the legend.
 * 6. A request reaching 0.5 s at 4 ticks per second plans the trail times 1.5, 1.75, 2, 2.25 and 2.5 around the drawn second 2, clips them to 0, 0.25 and 0.5 at the start of the subject, and refuses a drawn second outside the subject.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Seeks a scene through the trail sampler, draws its marks and the engine's skeleton and overshoot marks through the public inspection, and reads the marks, the drawn points and the legend.
 * @evidence contracts/development/testing.md#independent-expectations Positions follow from the authored motion of one metre per second, the emphasised tick is the authored drawn second, and the flag colour is the palette's documented magenta.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts a moving object against a still one, a match against none, one second's marks against the next, and a flagged joint against an unflagged one. The producers' own rules belong to their engine tests.
 * @evidence contracts/development/testing.md#execution-ownership This named portable unit builds its own scene and seek and starts no solver, browser, server or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 6 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: An object moving one metre per second along X, sampled at five seconds).
 */
export async function test_inspection_motion(): Promise<void> {
  const mover: THREE.Mesh = InspectionScene.quad("mover", 0, 0.2);
  const post: THREE.Mesh = InspectionScene.quad("post", 5, 0.2);
  const stage: THREE.Scene = InspectionScene.scene(mover, post);
  const seek = async (seconds: number): Promise<void> => {
    mover.position.set(seconds, 0, 0);
  };
  const times: number[] = [0, 1, 2, 3, 4];

  // 1. A moving object.
  const [moving]: IAutoMovieInspectionTrail[] = await sampleAutoMovieInspectionTrails({ scene: stage, pattern: "mover", times, seek });
  TestValidator.equals("five samples along X", [moving!.path, moving!.positions, moving!.stationary], [
    "mover",
    [0, 0, 0, 1, 0, 0, 2, 0, 0, 3, 0, 0, 4, 0, 0],
    false,
  ]);
  const marks: IAutoMovieMark[] = markAutoMovieInspectionTrails([moving!], 2);
  TestValidator.equals(
    "a line, five ticks and the drawn second emphasised",
    marks.map((mark: IAutoMovieMark) => [mark.kind, mark.shape.type, (mark.shape as IAutoMovieMark.IPoints).points.length / 3]),
    [
      ["trail", "polyline", 5],
      ["trail", "points", 5],
      ["trail/now", "points", 1],
    ],
  );
  TestValidator.equals("the emphasised tick is the second drawn", (marks[2]!.shape as IAutoMovieMark.IPoints).points, [2, 0, 0]);

  // 2. A still object.
  const [still]: IAutoMovieInspectionTrail[] = await sampleAutoMovieInspectionTrails({ scene: stage, pattern: "post", times, seek });
  TestValidator.equals(
    "one tick and stationary",
    [still!.stationary, markAutoMovieInspectionTrails([still!], 0).map((mark: IAutoMovieMark) => [mark.kind, mark.shape.type])],
    [
      true,
      [
        ["trail", "points"],
        ["trail/now", "points"],
      ],
    ],
  );

  // 3. Refusals.
  await TestValidator.error("a pattern matching nothing", (): Promise<unknown> => sampleAutoMovieInspectionTrails({ scene: stage, pattern: "ghost", times, seek }));
  await TestValidator.error("no times", (): Promise<unknown> => sampleAutoMovieInspectionTrails({ scene: stage, pattern: "mover", times: [], seek }));

  // 4. Marks per second.
  const profile: IAutoMoviePhysicalProfile = {
    segments: [{ bone: "root" }, { bone: "tip" }],
    joints: [{ parent: "root", child: "tip" }],
  } as unknown as IAutoMoviePhysicalProfile;
  const skeleton = (seconds: number): IAutoMovieMark[] =>
    markAutoMovieSkeleton({
      bodies: [{ id: "arm", profile }],
      frame: {
        seconds,
        bodies: {
          arm: {
            root: { position: { x: seconds, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0, w: 1 } },
            tip: { position: { x: seconds, y: 1, z: 0 }, rotation: { x: 0, y: 0, z: 0, w: 1 } },
          },
        },
      } as unknown as AutoMoviePhysicsCache.IFrame,
    });
  const handle: IAutoMovieInspectionHandle = applyAutoMovieInspection({
    scene: stage,
    request: InspectionScene.ask({ marks: ["bone", "joint"] }),
    marks: skeleton(0),
  });
  const joints = (): number[] => InspectionScene.dots(stage).flatMap((dots: THREE.Points) => InspectionScene.points(dots).map((p) => p.at[0]!));
  TestValidator.equals("the first second's joints", joints(), [0, 0]);
  handle.update(skeleton(1));
  TestValidator.equals("only the next second's joints after an update", joints(), [1, 1]);
  handle.restore();

  // 5. A flagged joint.
  const flagged: IAutoMovieInspectionHandle = applyAutoMovieInspection({
    scene: stage,
    request: InspectionScene.ask({ marks: ["joint", "rom"] }),
    marks: [
      ...skeleton(0),
      ...markAutoMovieRomOvershoot([{ path: "arm/tip", at: { x: 0, y: 1, z: 0 }, overshoot: 7 }]),
    ],
  });
  TestValidator.predicate(
    "the overshoot is a magenta point",
    InspectionScene.dots(stage).some((dots: THREE.Points) =>
      InspectionScene.points(dots).some((p) => p.color === 0xff00ff && p.at[1] === 1),
    ),
  );
  TestValidator.equals("and a flag entry", flagged.legend, [
    { label: "joint", color: 0xff7eb6, count: 2 },
    { label: "range overshoot (flagged)", color: 0xff00ff, count: 1 },
  ]);
  flagged.restore();

  // 6. Trail times from the request.
  const window = { reach: 0.5, ticks: 4 };
  TestValidator.equals(
    "the grid through the drawn second, clipped to the subject",
    [
      planAutoMovieInspectionTrailTimes({ request: window, seconds: 2, durationSeconds: 10 }),
      planAutoMovieInspectionTrailTimes({ request: window, seconds: 0, durationSeconds: 10 }),
    ],
    [
      [1.5, 1.75, 2, 2.25, 2.5],
      [0, 0.25, 0.5],
    ],
  );
  TestValidator.error("a second outside the subject", (): unknown =>
    planAutoMovieInspectionTrailTimes({ request: window, seconds: 11, durationSeconds: 10 }),
  );
}
