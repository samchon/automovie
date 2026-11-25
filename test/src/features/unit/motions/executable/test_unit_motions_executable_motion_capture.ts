import type {
  IAutoMovieCaptureInstant,
  IAutoMovieCaptureSubject,
  IAutoMovieCaptureTime,
  IAutoMovieHumanCanonicalBody,
  IAutoMovieMark,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";
import type {
  IMotionCaptureCase,
  IMotionCaptureProps,
} from "@automovie/motions/internal";
import {
  markMotionCaptureCase,
  planMotionCaptureInstants,
  planMotionCaptureProps,
} from "@automovie/motions/internal";
import {
  parseAutoMovieCapturePlanRequest,
  planAutoMovieCapture,
  planAutoMovieCaptureFrames,
  resolveAutoMovieInspectionColors,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import type { IHumanFixture } from "../../../internal/fixtures/IHumanFixture";
import { humanFixture } from "../../../internal/fixtures/humanFixture";

/** The scenarios of `test_unit_motions_executable_capture_annotation`. */
namespace ScenarioCaptureAnnotation {
  /**
   * A motion case's trail, targets and drift samples become inspection marks of
   * three kinds the `marks` key selects, in the case's own colours, with drift
   * beyond its limit flagged.
   *
   * Scenarios:
   *
   * 1. A case with one red trail, one green target and drift samples of 2 mm and 9
   *    mm against a 5 mm limit gives a polyline, a point and two drift marks: the
   *    9 mm sample flagged, the 2 mm one not.
   * 2. The kinds are `case/d04040`, `case/40a040` and `case/drift`, labelled `trail
   *    d04040`, `target 40a040` and `drift`, and the inspection's colour law
   *    accepts them in one picture.
   * 3. A capture planned with `marks=case` against a subject supplying these kinds
   *    is accepted, and so is `marks=case/drift`; `marks=trail` is refused, since
   *    the case's marks are not the inspection's own trails.
   * 4. A trail and a target sharing red make one kind labelled `trail and target
   *    d04040`, so the colour law still holds.
   * 5. An empty trail and an empty drift set give no mark, and a one-point trail is
   *    drawn as a point.
   */
  export function test_unit_motions_executable_capture_annotation(): void {
    const at: (x: number, y: number, z: number) => IAutoMovieVector3 = (
      x: number,
      y: number,
      z: number,
    ): IAutoMovieVector3 => ({ x, y, z });

    // 1. One of each.
    const marks: IAutoMovieMark[] = markMotionCaptureCase({
      trails: [
        { color: 0xd04040, points: [at(0, 0, 0), at(0.5, 0, 0), at(1, 0, 0)] },
      ],
      targets: [{ at: at(1, 1, 0), radius: 0.03, color: 0x40a040 }],
      drift: [
        {
          samples: [
            { at: at(0.1, 0, 0.2), drift: 0.002 },
            { at: at(0.3, 0, 0.2), drift: 0.009 },
          ],
          limit: 0.005,
        },
      ],
    });
    TestValidator.equals(
      "shapes, paths and flags",
      marks.map((mark: IAutoMovieMark): unknown[] => [
        mark.path,
        mark.shape.type,
        mark.flagged,
        mark.anchor,
      ]),
      [
        ["case/trail/0", "polyline", false, null],
        ["case/target/0", "points", false, null],
        ["case/drift/0/within", "points", false, null],
        ["case/drift/0/beyond", "points", true, null],
      ],
    );
    TestValidator.equals(
      "the flagged sample is the 9 mm one",
      marks[3]!.shape.type === "points" ? marks[3]!.shape.points : [],
      [0.3, 0, 0.2],
    );

    // 2. Three kinds, accepted by the colour law.
    const kinds: Map<string, ILegendEntry> = resolveAutoMovieInspectionColors({
      marks,
      reserved: [{ use: "the flag", color: 0xff00ff }],
      recolor: [],
    });
    TestValidator.equals(
      "three kinds in the legend",
      [...kinds].map(([kind, entry]: [string, ILegendEntry]): unknown[] => [
        kind,
        entry.label,
      ]),
      [
        ["case/d04040", "trail d04040"],
        ["case/40a040", "target 40a040"],
        ["case/drift", "drift"],
      ],
    );

    // 3. Selectable by the marks key.
    const subject: IAutoMovieCaptureSubject = {
      name: "walk",
      durationSeconds: 2,
      fps: 30,
      width: 64,
      height: 64,
      views: ["front"],
      drawables: [],
      marks: [...kinds.keys()],
    };
    const plans: (marks: string) => number = (pattern: string): number =>
      planAutoMovieCapture({
        request: parseAutoMovieCapturePlanRequest(
          new URLSearchParams(`at=1&marks=${pattern}`),
        ),
        subject,
        cuts: [],
      }).cells.length;
    TestValidator.equals("marks=case plans", plans("case"), 1);
    TestValidator.equals("marks=case/drift plans", plans("case/drift"), 1);
    let refused: boolean = false;
    try {
      plans("trail");
    } catch {
      refused = true;
    }
    TestValidator.predicate("marks=trail is refused", refused);

    // 4. A shared colour is one kind.
    const shared: IAutoMovieMark[] = markMotionCaptureCase({
      trails: [{ color: 0xd04040, points: [at(0, 0, 0), at(1, 0, 0)] }],
      targets: [{ at: at(1, 0, 0), radius: 0.02, color: 0xd04040 }],
      drift: [],
    });
    TestValidator.equals(
      "one kind for one colour",
      [
        ...new Set(
          shared.map(
            (mark: IAutoMovieMark): string => `${mark.kind} ${mark.label}`,
          ),
        ),
      ],
      ["case/d04040 trail and target d04040"],
    );

    // 5. Degenerate overlays.
    const sparse: IAutoMovieMark[] = markMotionCaptureCase({
      trails: [
        { color: 0x3070c0, points: [] },
        { color: 0xc07030, points: [at(2, 0, 0)] },
      ],
      targets: [],
      drift: [{ samples: [], limit: 0.005 }],
    });
    TestValidator.equals(
      "only the one-point trail, as a point",
      sparse.map((mark: IAutoMovieMark): unknown[] => [
        mark.path,
        mark.shape.type,
      ]),
      [["case/trail/1", "points"]],
    );
  }

  /** One labelled colour in a case annotation legend. */
  interface ILegendEntry {
    label: string;
    color: number;
  }
}

/** The scenarios of `test_unit_motions_executable_capture_instants`. */
namespace ScenarioCaptureInstants {
  /**
   * A motion case's labelled instants become the instants its capture draws and
   * names: one per millisecond, in the case's order, with every distinct label of
   * instants that coincide.
   *
   * Scenarios:
   *
   * 1. Instants at 0, 1.2575 and 2.42 with labels `start`, `grip closes` and
   *    `release` stay three, in order, with their labels and seconds unchanged.
   * 2. Two instants 5e-16 s apart, 1.886634915062088 `grip closed` and
   *    1.8866349150620885 `release starts`, become one at the first second named
   *    `grip closed / release starts`.
   * 3. Two instants within one millisecond that share a label become one named once.
   * 4. Instants a millisecond apart, 1.000 and 1.001, stay two.
   * 5. No instant gives none.
   */
  export function test_unit_motions_executable_capture_instants(): void {
    // 1. Distinct instants.
    const distinct: IAutoMovieCaptureInstant[] = [
      { seconds: 0, label: "start" },
      { seconds: 1.2575, label: "grip closes" },
      { seconds: 2.42, label: "release" },
    ];
    TestValidator.equals(
      "distinct instants stay",
      planMotionCaptureInstants(distinct),
      distinct,
    );

    // 2. A coinciding pair with two labels.
    TestValidator.equals(
      "one still named by both",
      planMotionCaptureInstants([
        { seconds: 1.886634915062088, label: "grip closed" },
        { seconds: 1.8866349150620885, label: "release starts" },
      ]),
      [{ seconds: 1.886634915062088, label: "grip closed / release starts" }],
    );

    // 3. A coinciding pair with one label.
    TestValidator.equals(
      "one label once",
      planMotionCaptureInstants([
        { seconds: 3.2, label: "end" },
        { seconds: 3.2000001, label: "end" },
      ]),
      [{ seconds: 3.2, label: "end" }],
    );

    // 4. A millisecond apart.
    TestValidator.equals(
      "a millisecond apart stays two",
      planMotionCaptureInstants([
        { seconds: 1, label: "a" },
        { seconds: 1.001, label: "b" },
      ]).length,
      2,
    );

    // 5. None.
    TestValidator.equals("none", planMotionCaptureInstants([]), []);
    // Four frames occupy 0, 1/4, 1/2 and 3/4 s; the last second is an explicit end sample.
    const frames = planAutoMovieCaptureFrames({
      durationSeconds: 1,
      fps: 4,
      sampling: { kind: "at", seconds: [1] },
      events: [0, 0.5],
      cuts: [0.5],
      window: 1,
    });
    TestValidator.equals(
      "clipped and duplicate event windows share frame indices",
      frames.times.map((time: IAutoMovieCaptureTime) => [
        time.frame,
        time.seconds,
      ]),
      [
        [0, 0],
        [1, 0.25],
        [2, 0.5],
        [3, 0.75],
        [null, 1],
      ],
    );
    TestValidator.equals(
      "first event window is clipped at the first frame",
      frames.windows[0]?.clipped,
      true,
    );
  }
}

/** The scenarios of `test_unit_motions_executable_plan_motion_capture_props`. */
namespace ScenarioPlanMotionCaptureProps {
  /**
   * `planMotionCaptureProps` plans a capture case's playback props at 32 frames a
   * second: the case's own instants first, then every grid frame up to the last
   * instant that is not one of them, each figure posed at every second, and a
   * ghost keeping its opacity.
   *
   * A case drawn at 0.1 s and 0.05 s with one performer and one ghost of the
   * average man; its grid runs `floor(0.1 · 32) + 1` = 4 frames.
   *
   * Scenarios:
   *
   * 1. The seconds are the two instants then 0, 1/32, 2/32 and 3/32; the props last
   *    4/32 s.
   * 2. The performer is posed at each of those seconds, in order, with no colour;
   *    the ghost keeps its 0.4 opacity and its colour.
   * 3. Absent trails, targets, drift and boxes are empty.
   */
  export async function test_unit_motions_executable_plan_motion_capture_props(): Promise<void> {
    const fixture: IHumanFixture = await humanFixture("m-average");
    const body: IAutoMovieHumanCanonicalBody.IBody = {
      skeleton: fixture.skeleton,
      profile: fixture.profile,
      joints: [],
    };
    const asked: number[] = [];
    const pose = (seconds: number): IAutoMoviePose => {
      asked.push(seconds);
      return { skeleton: fixture.skeleton.id, root: null, joints: [] };
    };
    const capture: IMotionCaptureCase = {
      name: "probe",
      times: [
        { seconds: 0.1, label: "a" },
        { seconds: 0.05, label: "b" },
      ],
      performers: [{ id: "a", body, pose }],
      ghosts: [{ id: "g", body, pose, opacity: 0.4, color: 0xff0000 }],
    };
    const props: IMotionCaptureProps = planMotionCaptureProps(capture, {
      width: 720,
      height: 720,
    });
    const seconds: number[] = [0.1, 0.05, 0, 1 / 32, 2 / 32, 3 / 32];
    TestValidator.equals(
      "the instants and the grid",
      [props.fps, props.seconds, props.durationSeconds],
      [32, seconds, 4 / 32],
    );
    TestValidator.equals(
      "the figures",
      [
        props.performers[0]!.poses.length,
        props.performers[0]!.color,
        props.ghosts[0]!.opacity,
        props.ghosts[0]!.color,
        asked,
      ],
      [6, null, 0.4, 0xff0000, [...seconds, ...seconds]],
    );
    TestValidator.equals(
      "the empty overlays",
      [props.trails, props.targets, props.drift, props.boxes],
      [[], [], [], []],
    );
  }
}

/**
 * The `motion_capture` family's own logic, one scenario group per namespace
 * above: each group's scenarios are documented on it.
 */
export async function test_unit_motions_executable_motion_capture(): Promise<void> {
  ScenarioCaptureAnnotation.test_unit_motions_executable_capture_annotation();
  ScenarioCaptureInstants.test_unit_motions_executable_capture_instants();
  await ScenarioPlanMotionCaptureProps.test_unit_motions_executable_plan_motion_capture_props();
}
