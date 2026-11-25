import { createPerformShotSubjectFramer } from "@automovie/engine";
import type {
  IAutoMovieClip,
  IAutoMovieCompiledFormation,
  IAutoMovieFramedSubject,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * Group framing keeps the opening fit and reads the current union's center.
 *
 * Scenarios:
 *
 * 1. Two unmeasured subjects open six metres apart. The opening box is 1.7 metres
 *    tall and has radius three.
 * 2. Translation starts before rotation has authority, so the baked frame starts
 *    only when both channels have begun. Its moving union changes base on
 *    forward and reverse seeks, keeping the opening height and radius.
 * 3. The framer reads the unmeasured subjects' fallback rigs during opening fit
 *    and never requests either rig from its changing-time function.
 */
export function test_engine_film_subject_framer_group(): void {
  const moving: IAutoMovieClip = {
    id: "cross",
    name: null,
    duration: 1,
    loop: false,
    tracks: [
      {
        channel: { kind: "node", node: "mover", path: "translation" },
        times: [0.25, 1],
        values: [2, 0, 0, 8, 0, 0],
        interpolation: "linear",
      },
      {
        channel: { kind: "node", node: "mover", path: "rotation" },
        times: [0.5, 1],
        values: [0, 0, 0, 1, 0, 0, 0, 1],
        interpolation: "linear",
      },
    ],
  };
  const queried: string[] = [];
  const context: Parameters<typeof createPerformShotSubjectFramer>[0] = {
    staged: { scene: { nodes: [] } },
    nodePositions: new Map<string, IAutoMovieVector3>([
      ["mover", { x: 0, y: 0, z: 0 }],
      ["still", { x: 6, y: 0, z: 0 }],
    ]),
    formationById: new Map<string, IAutoMovieCompiledFormation>(),
    formationPoints: new Map<string, IAutoMovieVector3>(),
    targetAt: undefined,
    skeleton: (node: string): null => {
      queried.push(node);
      return null;
    },
  };
  const framer: ReturnType<typeof createPerformShotSubjectFramer> =
    createPerformShotSubjectFramer(context, {
      models: undefined,
      formationMotions: [],
      motions: {},
      objectMotions: [moving],
      rotations: new Map<string, IAutoMovieQuaternion>(),
    });
  const subject: IAutoMovieFramedSubject = framer({
    kind: "group",
    nodes: ["mover", "still"],
  });
  TestValidator.predicate(
    "opening group fit is the six-metre union",
    subject.base.x === 3 &&
      subject.base.y === 0 &&
      subject.base.z === 0 &&
      subject.height === 1.7 &&
      subject.radius === 3,
  );
  if (subject.at === null)
    throw new Error("the driven group lost its time reader");
  const at: NonNullable<IAutoMovieFramedSubject["at"]> = subject.at;
  const beforeRotation: IAutoMovieVector3 = at(0.375);
  const close: IAutoMovieVector3 = at(1);
  const reverse: IAutoMovieVector3 = at(0.625);
  TestValidator.predicate(
    "two started channels govern the group center at each seek",
    beforeRotation.x === 3 &&
      close.x === 7 &&
      reverse.x === 5.5 &&
      at(0).x === 3,
  );
  TestValidator.equals(
    "fallback geometry is read before sampling time",
    queried,
    ["mover", "still"],
  );
}
