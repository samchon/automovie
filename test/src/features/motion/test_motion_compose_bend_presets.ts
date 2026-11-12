import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  AutoMovieMotionHumanBend,
  HumanFrame,
  type IHumanBody,
} from "@automovie/motions";

import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * The elbow presets (`AutoMovieMotionHumanBend.ARM`) lie where their
 * documents place an elbow, and an elbow turned about the shoulder-to-wrist
 * line (`AutoMovieMotionHumanBend.turn`) keeps its circle, on the average
 * man.
 *
 * The presets are shares of the upper arm from the shoulder at rest, out,
 * up and forward. Their documents say: `hang`, `tucked`, `behind`, `front`,
 * `folded` and `forward` are below the shoulder; `hang`, `tucked` and
 * `behind` behind it and `front`, `folded` and `forward` ahead of it;
 * `tucked` is closer to the flank than `hang`; `akimbo` is out wide below
 * the shoulder and `raised` out wide above it. The bend point a preset gives
 * is that offset from the shoulder at rest, mirrored for the left arm,
 * carried by the heading.
 *
 * The turn is the swivel about the line from the shoulder (the rest
 * shoulder carried by the posture, the chain the solver prepares) to the
 * wrist, counter-clockwise seen from the wrist. With the wrist straight
 * ahead of the shoulder, the viewer looks along -Z with +X on their right,
 * so an elbow below the line turned by 90 degrees goes to +X.
 *
 * Scenarios:
 * 1. Every preset lies on the side of the shoulder its document says.
 * 2. `arm` gives the shoulder plus the shares times the upper arm, mirrored
 *    by side, at headings 0 and 90, and `out` widens it.
 * 3. `turn` by 90 carries an elbow below a forward line to +X at the same
 *    distance; by 360, and by 50 then -50, it gives the elbow back; an elbow
 *    on the line stays.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads each preset through `arm` and turns elbows with `turn` on a real body; a preset on the wrong side, a mirror lost, a heading ignored or a turn in the wrong sense fails.
 * @evidence contracts/development/testing.md#independent-expectations Each side is the preset's document; the turned place is worked out in the comment from the stated sense.
 * @evidence contracts/development/testing.md#distinguishing-cases Eight presets, both arms, two headings, an extra outward share, three turns and an elbow on the line.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit on one prepared body; it runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation States each preset's documented place, the turn's sense worked out and the 3 scenarios.
 */
export function test_motion_compose_bend_presets(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  const near = (
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
    e: number = 1e-9,
  ): boolean =>
    Math.abs(a.x - b.x) <= e &&
    Math.abs(a.y - b.y) <= e &&
    Math.abs(a.z - b.z) <= e;
  const A = AutoMovieMotionHumanBend.ARM;

  // 1. The documented places.
  const below = ["hang", "tucked", "behind", "front", "folded", "forward"];
  for (const name of below)
    complaints.check(`${name} is below the shoulder`, A[name as "hang"].up < 0);
  for (const name of ["hang", "tucked", "behind"])
    complaints.check(
      `${name} is behind the shoulder`,
      A[name as "hang"].forward < 0,
    );
  for (const name of ["front", "folded", "forward"])
    complaints.check(
      `${name} is ahead of the shoulder`,
      A[name as "hang"].forward > 0,
    );
  complaints.check("tucked is closer than hang", A.tucked.out < A.hang.out);
  complaints.check(
    "akimbo is out wide below the shoulder and raised out wide above it",
    A.akimbo.out > A.hang.out &&
      A.akimbo.up < 0 &&
      A.raised.out > A.hang.out &&
      A.raised.up > 0,
  );

  // 2. The bend point.
  const body: IHumanBody = motionHumanBody("m-average");
  const length: number = body.measure.upperArm;
  const root: IAutoMovieVector3 = { x: 0.4, y: 0.02, z: -0.7 };
  for (const side of ["left", "right"] as const) {
    const sign: number = side === "left" ? 1 : -1;
    const shoulder: IAutoMovieVector3 = body.rest.get(`${side}UpperArm`)!;
    for (const yaw of [0, 90])
      for (const [name, shares] of Object.entries(A)) {
        const got: IAutoMovieVector3 = AutoMovieMotionHumanBend.arm(
          body,
          { root, yaw },
          side,
          name as AutoMovieMotionHumanBend.Arm,
          0.2,
        );
        const want: IAutoMovieVector3 = HumanFrame.point(
          { origin: root, yaw },
          {
            x: shoulder.x + sign * (shares.out + 0.2) * length,
            y: shoulder.y + shares.up * length,
            z: shoulder.z + shares.forward * length,
          },
        );
        complaints.check(
          `${side} ${name} at heading ${yaw} is the shoulder plus its shares`,
          near(got, want),
        );
      }

    // 3. The turn.
    const s: IAutoMovieVector3 = shoulder;
    const props: AutoMovieMotionHumanBend.ISolve = {
      body,
      posture: { root: { x: 0, y: 0, z: 0 }, yaw: 0 },
      side,
      point: { x: s.x, y: s.y, z: s.z + 0.5 },
    };
    const elbow: IAutoMovieVector3 = { x: s.x, y: s.y - 0.1, z: s.z + 0.25 };
    complaints.check(
      `${side}: a quarter turn carries an elbow below the line to +X`,
      near(AutoMovieMotionHumanBend.turn(props, elbow, 90), {
        x: s.x + 0.1,
        y: s.y,
        z: s.z + 0.25,
      }),
    );
    complaints.check(
      `${side}: a full turn and a turn undone give the elbow back`,
      near(AutoMovieMotionHumanBend.turn(props, elbow, 360), elbow) &&
        near(
          AutoMovieMotionHumanBend.turn(
            props,
            AutoMovieMotionHumanBend.turn(props, elbow, 50),
            -50,
          ),
          elbow,
        ),
    );
    const on: IAutoMovieVector3 = { x: s.x, y: s.y, z: s.z + 0.2 };
    complaints.check(
      `${side}: an elbow on the line stays`,
      near(AutoMovieMotionHumanBend.turn(props, on, 75), on),
    );
  }
  complaints.assert("every elbow preset and turn is as documented");
}
