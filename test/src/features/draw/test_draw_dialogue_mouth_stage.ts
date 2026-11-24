import type {
  IAutoMovieDialogueMouthTrack,
  IAutoMovieDrawnMouth,
  IAutoMovieHumanSkeleton,
  IAutoMovieSkeleton,
} from "@automovie/interface";
import {
  AutoMovieDialogueMouthStage,
  AutoMoviePlayer,
  createAutoMovieHumanPolygonFigure,
  createImportedModelObject,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { createHumanPolygonFixture } from "../internal/createHumanPolygonFixture";
import {
  IDENTITY_TRANSFORM,
  keyframe,
  makeMotion,
  makePose,
} from "../internal/fixtures";
import { nclose } from "../internal/predicates";

/** A one-bone rig the players below pose. */
const SKELETON: IAutoMovieSkeleton = {
  id: "mouth-rig",
  bones: [
    { bone: "hips", parent: null, rest: IDENTITY_TRANSFORM, constraint: null },
  ],
};

/**
 * The draw page shows each speaking actor's dialogue mouth on the figures
 * render drives under the actor's scene node, with no code of the film's own,
 * and records what those figures showed.
 *
 * Scenarios:
 *
 * 1. A model with a `jawOpen` morph, driven by `AutoMoviePlayer` under the node
 *    `ana`, opens `jawOpen` to 0.5 at second 11 / 24, where ana's envelope jaw
 *    is 6 of its 12 mm, and the stage records the visemes `{ aa: 0.5, sil: 0.5
 *    }` it showed.
 * 2. At second 14 / 24, after ana's line, the morph returns to its authored 0 and
 *    nothing is recorded for ana.
 * 3. A primitive model without mouth morphs under `ben`, also driven by a player,
 *    shows nothing though ben speaks, so ben has no record.
 * 4. The polygon man under `cal` opens its cartoon face's jaw to the 12 mm of
 *    frame 12, rebuilding the face, and the stage records that jaw.
 * 5. An actor with no node in the scene is skipped, and `clear` empties the
 *    record.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists each figure, the second it is shown at and the mouth and record it must give.
 * @evidence contracts/development/testing.md#behavioral-verification Places real `AutoMoviePlayer` models and a real polygon figure under named groups and calls `AutoMovieDialogueMouthStage.show` as the draw page does after a placement, reading the morph influence, the face object and the record. A page that left the mouth to the film, recorded a mouth no figure drew, or kept a mouth past its line fails.
 * @evidence contracts/development/testing.md#independent-expectations The envelope line gives `aa` at the jaw's fraction of the 12 mm maximum opening, 6 / 12 = 0.5, and `applyExpression` documents the `aa` preset's `jawOpen` factor of 1, so the morph reads 0.5; frame 12's jaw is the track's own 12 mm.
 * @evidence contracts/development/testing.md#distinguishing-cases Pairs a speaking and a silent second, a model with and one without a mouth morph, a viseme and a jaw representation, and a present and an absent node; sampling belongs to `test_engine_dialogue_mouth_sample` and the measurement to `test_draw_drawn_video_mouths`.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through `test_draw_dialogue_mouth_stage`; no page or renderer is created.
 */
export function test_draw_dialogue_mouth_stage(): void {
  const track: IAutoMovieDialogueMouthTrack = {
    fps: 24,
    lines: ["ana", "ben", "cal", "dee"].map(
      (actor: string): IAutoMovieDialogueMouthTrack.ILine => ({
        line: `${actor}-1`,
        actor,
        startFrame: 10,
        endFrame: 13,
        jaw: [0, 6, 12],
        ranges: null,
      }),
    ),
  };
  const root: THREE.Scene = new THREE.Scene();
  const node: (name: string, child: THREE.Object3D) => void = (
    name: string,
    child: THREE.Object3D,
  ): void => {
    const group: THREE.Group = new THREE.Group();
    group.name = name;
    group.add(child);
    root.add(group);
  };
  const motion: ReturnType<typeof makeMotion> = makeMotion(
    [keyframe(0, makePose([])), keyframe(2, makePose([]))],
    2,
  );

  // A model whose one mesh has a `jawOpen` morph, and one with no morphs.
  const mesh: THREE.Mesh = new THREE.Mesh(new THREE.BufferGeometry());
  mesh.morphTargetDictionary = { jawOpen: 0 };
  mesh.morphTargetInfluences = [0];
  const face: THREE.Group = new THREE.Group();
  face.add(mesh);
  const vrm: ReturnType<typeof createImportedModelObject> =
    createImportedModelObject({ object: face });
  const ana: AutoMoviePlayer = new AutoMoviePlayer(vrm, SKELETON, motion);
  node("ana", vrm.object);
  const plain: THREE.Group = new THREE.Group();
  plain.add(new THREE.Mesh(new THREE.BufferGeometry()));
  const primitive: ReturnType<typeof createImportedModelObject> =
    createImportedModelObject({ object: plain });
  const ben: AutoMoviePlayer = new AutoMoviePlayer(primitive, SKELETON, motion);
  node("ben", primitive.object);

  // The polygon man.
  const input: Pick<IAutoMovieHumanSkeleton.IOutput, "bones" | "posed"> =
    createHumanPolygonFixture();
  const cal: createAutoMovieHumanPolygonFigure.IFigure =
    createAutoMovieHumanPolygonFigure({ evaluate: () => input });
  node("cal", cal.object);
  const faces: () => THREE.Object3D[] = (): THREE.Object3D[] =>
    cal.drawing.head.object.children.filter(
      (child: THREE.Object3D): boolean => child.type === "Group",
    );

  const stage: AutoMovieDialogueMouthStage = new AutoMovieDialogueMouthStage(
    track,
  );
  // One placement of every figure, then the page's showing; whether the
  // showing rebuilt the polygon man's authored face.
  let rebuilt: boolean = false;
  const place: (seconds: number) => IAutoMovieDrawnMouth[] = (
    seconds: number,
  ): IAutoMovieDrawnMouth[] => {
    ana.update(seconds);
    ben.update(seconds);
    cal.place(input);
    const authored: THREE.Object3D | undefined = faces()[0];
    stage.clear();
    stage.show(root, seconds);
    rebuilt = faces().length === 1 && faces()[0] !== authored;
    return stage.drawn();
  };

  // 1, 3 and 5. A speaking second.
  const speaking: IAutoMovieDrawnMouth[] = place(11 / 24);
  const record: (actor: string) => IAutoMovieDrawnMouth | undefined = (
    actor: string,
  ): IAutoMovieDrawnMouth | undefined =>
    speaking.find(
      (mouth: IAutoMovieDrawnMouth): boolean => mouth.actor === actor,
    );
  TestValidator.predicate(
    "a player's model opens its mouth morph and is recorded with its visemes",
    nclose(mesh.morphTargetInfluences[0]!, 0.5) &&
      record("ana")?.jaw === undefined &&
      nclose(record("ana")?.visemes?.aa ?? -1, 0.5) &&
      nclose(record("ana")?.visemes?.sil ?? -1, 0.5),
  );
  TestValidator.equals(
    "a model without mouth morphs and an actor with no node record nothing",
    [record("ben"), record("dee")],
    [undefined, undefined],
  );

  // 4. The polygon man at frame 12.
  const opened: IAutoMovieDrawnMouth[] = place(12 / 24);
  TestValidator.predicate(
    "the polygon man opens its jaw and is recorded with it",
    rebuilt &&
      opened.find(
        (mouth: IAutoMovieDrawnMouth): boolean => mouth.actor === "cal",
      )?.jaw === 12,
  );

  // 2. After the lines.
  const after: IAutoMovieDrawnMouth[] = place(14 / 24);
  TestValidator.predicate(
    "after a line the authored mouth returns and nothing is recorded",
    mesh.morphTargetInfluences[0] === 0 && after.length === 0 && !rebuilt,
  );

  // 5. Clearing.
  stage.show(root, 11 / 24);
  stage.clear();
  TestValidator.equals("clear forgets every record", stage.drawn(), []);
  cal.dispose();
}
