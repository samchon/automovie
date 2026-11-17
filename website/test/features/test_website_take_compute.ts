import { TestValidator } from "@nestia/e2e";

import type { IPlaygroundComposition } from "../../src/playground/structures/IPlaygroundComposition";
import type { IPlaygroundRefusal } from "../../src/playground/structures/IPlaygroundRefusal";
import { SCENES } from "../../src/scenes/SCENES";
import { SceneTrack } from "../../src/scenes/SceneTrack";
import type { IScene } from "../../src/scenes/structures/IScene";
import { TakeCompute } from "../../src/takes/package/TakeCompute";
import type { ITake } from "../../src/takes/structures/ITake";
import type { ITakeResponse } from "../../src/takes/structures/ITakeResponse";

/**
 * One frame a second: the layout this test pins does not depend on the rate,
 * and each pose costs tens of milliseconds.
 */
const FPS: number = 1;

/**
 * The take worker's computation, the one path by which the playground and every scene reach the packages, gives a take whose track, figures and timeline agree with the composition, or the packages' refusal, and pairs each answer with its request.
 *
 * Scenarios:
 * 1. The dance circle's take has one frame at each whole second of its film and one at 0 s, a track of exactly frames × every entry × `SceneTrack.STRIDE` values, one figure per performer in the composition's order with its body and rest bones, each figure's track group in the order of its posed bones, no prop, a column-major 4 × 4 reflection, and a timeline whose spans are each performer's actions in order over the take's length.
 * 2. An action the vocabulary lacks gives the packages' refusal, not a throw: the axis `act` with `stand` among its alternatives.
 * 3. A take request is answered with its id and moves its track's buffer instead of copying it; a request for a body no one has is answered with its id as an error naming the bodies that exist.
 * 4. The impulse scene and an otherwise identical zero-impulse control have the same pre-impact position; only the authored forward impulse produces a forward hip displacement at one second, through the actual take worker and encoded track.
 */
export function test_website_take_compute(): void {
  const composition: IPlaygroundComposition = SCENES.find(
    (scene: IScene): boolean => scene.id === "dance-circle",
  )!.composition!;

  // 1. The take.
  const made: ITake | IPlaygroundRefusal = TakeCompute.take(composition, FPS);
  if (!("track" in made))
    throw new Error(`The dance circle was refused: ${made.message}`);
  TestValidator.equals(
    "a frame at 0 s and at every whole second of the film",
    made.track.frames,
    Math.floor(made.duration * FPS) + 1,
  );
  const width: number = made.track.orders.reduce(
    (sum: number, order: string[]): number => sum + order.length,
    0,
  );
  TestValidator.equals(
    "the track holds every entry of every frame",
    made.track.values.length,
    made.track.frames * width * SceneTrack.STRIDE,
  );
  TestValidator.equals(
    "one figure per performer, in order, with its body",
    made.figures.map((f: ITake.IFigure): [string, string] => [
      f.subject,
      f.body,
    ]),
    composition.performers.map(
      (p: IPlaygroundComposition.IPerformer): [string, string] => [
        p.subject,
        p.body,
      ],
    ),
  );
  TestValidator.predicate(
    "each figure has its rest bones",
    made.figures.every((f: ITake.IFigure): boolean => f.bones.length !== 0),
  );
  TestValidator.equals(
    "a group per figure and none for props",
    [made.track.orders.length, made.props.length],
    [composition.performers.length, 0],
  );
  TestValidator.equals(
    "each figure's group reads back in its order",
    SceneTrack.sample(made.track, 0).map(
      (group: SceneTrack.IPlacement[]): string[] =>
        group.map((p: SceneTrack.IPlacement): string => p.bone),
    ),
    made.track.orders,
  );
  TestValidator.equals("a 4 x 4 reflection", made.reflection.length, 16);
  TestValidator.equals(
    "the timeline is each performer's actions over the take",
    [
      made.timeline.duration,
      made.timeline.tracks.map(
        (track: { spans: { name: string; overlay: boolean }[] }): string[] =>
          track.spans
            .filter((s: { overlay: boolean }): boolean => !s.overlay)
            .map((s: { name: string }): string => s.name),
      ),
    ],
    [
      made.duration,
      composition.performers.map(
        (p: IPlaygroundComposition.IPerformer): string[] =>
          p.actions.map((a: IPlaygroundComposition.IAction): string => a.name),
      ),
    ],
  );

  // 2. A refusal is answered, not thrown.
  const refused: ITake | IPlaygroundRefusal = TakeCompute.take(
    {
      ...composition,
      performers: [
        {
          ...composition.performers[0]!,
          actions: [
            { name: "stand", params: {} },
            { name: "levitate", params: {} },
          ],
        },
      ],
      mutuals: [],
    },
    FPS,
  );
  if ("track" in refused) throw new Error("An unknown action was performed");
  TestValidator.equals("the refusal's axis", refused.axis, "act");
  TestValidator.predicate(
    "the refusal offers stand",
    refused.alternatives.includes("stand"),
  );

  // 3. Answers carry their ids and move the track.
  const answered: { response: ITakeResponse; transfer: ArrayBuffer[] } =
    TakeCompute.answer({ kind: "take", id: 7, composition, fps: FPS });
  if (answered.response.kind !== "take")
    throw new Error(`The take was answered with ${answered.response.kind}`);
  TestValidator.equals("the take's id", answered.response.id, 7);
  TestValidator.predicate(
    "the track's buffer is moved",
    answered.transfer.length === 1 &&
      answered.transfer[0] === answered.response.take.track.values.buffer,
  );
  const unknown: ITakeResponse = TakeCompute.answer({
    kind: "body",
    id: 8,
    body: "nobody",
  }).response;
  TestValidator.predicate(
    "an unknown body is an error with its id naming the bodies",
    unknown.kind === "error" &&
      unknown.id === 8 &&
      unknown.message.includes("m1"),
  );

  // 4. Forwarded force has an effect that dropping the force cannot pass.
  const impulsed: IPlaygroundComposition | null | undefined = SCENES.find(
    (scene: IScene): boolean => scene.id === "balance-impulse",
  )?.composition;
  if (impulsed === null || impulsed === undefined || !impulsed.forces?.length)
    throw new Error("The impulse scene must carry its authored impulse");
  const zero: IPlaygroundComposition = {
    ...impulsed,
    forces: impulsed.forces.map(
      (
        force: NonNullable<IPlaygroundComposition["forces"]>[number],
      ): NonNullable<IPlaygroundComposition["forces"]>[number] => ({
        ...force,
        impulse: { x: 0, y: 0, z: 0 },
      }),
    ),
  };
  const pushed: ITake | IPlaygroundRefusal = TakeCompute.take(impulsed, FPS);
  const still: ITake | IPlaygroundRefusal = TakeCompute.take(zero, FPS);
  if (!("track" in pushed))
    throw new Error(`The authored impulse was refused: ${pushed.message}`);
  if (!("track" in still))
    throw new Error(`The zero impulse was refused: ${still.message}`);
  const hip: (take: ITake, seconds: number) => SceneTrack.IPlacement = (
    take: ITake,
    seconds: number,
  ): SceneTrack.IPlacement => {
    const placed: SceneTrack.IPlacement | undefined = SceneTrack.sample(
      take.track,
      seconds,
    )[0]?.find(
      (entry: SceneTrack.IPlacement): boolean => entry.bone === "hips",
    );
    if (placed === undefined)
      throw new Error("The take lacks the hip placement");
    return placed;
  };
  const pushedBefore: SceneTrack.IPlacement = hip(pushed, 0);
  const stillBefore: SceneTrack.IPlacement = hip(still, 0);
  // Figure entries are in Human's frame; the player's parent applies this
  // column-major matrix to place them in the authored world.
  const worldZ: (take: ITake, seconds: number) => number = (
    take: ITake,
    seconds: number,
  ): number => {
    const position: SceneTrack.IPlacement["position"] = hip(
      take,
      seconds,
    ).position;
    return (
      take.reflection[2]! * position[0] +
      take.reflection[6]! * position[1] +
      take.reflection[10]! * position[2] +
      take.reflection[14]!
    );
  };
  TestValidator.predicate(
    "the force and zero control begin at the same hip position",
    pushedBefore.position.every(
      (coordinate: number, axis: number): boolean =>
        Math.abs(coordinate - stillBefore.position[axis]!) <= 1e-9,
    ),
  );
  TestValidator.predicate(
    "the authored forward impulse reaches the displayed take",
    worldZ(pushed, 1) > worldZ(still, 1),
  );
}
