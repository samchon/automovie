import { IAutoMovieScript } from "@automovie/interface";
import { IAutoMovieCaptionEntry, IAutoMovieCaptionSidecar, planCaptionSidecar, renderCaptionSidecar } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";



import { CAPTION_SEQUENCE } from "../internal/CAPTION_SEQUENCE";
import { CAPTION_SHOTS } from "../internal/CAPTION_SHOTS";
import { TREE_SCRIPT } from "../internal/TREE_SCRIPT";
import { createCaptionShot as shot } from "../internal/createCaptionShot";
import { nclose } from "../internal/nclose";
import { throwsError } from "../internal/predicates";
import { screenplayBeat } from "../internal/screenplayBeat";
import { screenplayNode } from "../internal/screenplayNode";

/**
 * The caption sidecar: the cut lands on the frame-atomic output clock, each
 * span joins its beat node's caption and enclosing scene slug, and the
 * serialization is deterministic pretty JSON.
 *
 * Scenarios (fps 4, runtime 2.5 s → 10 frames; the dissolve hands frames to the
 * incoming shot exactly as playback does, by hand math):
 *
 * 1. Two spans: `[0,2)` beat "duel", `[2,10)` beat "aftermath"; the incoming shot
 *    is live from its span start (`0.5 s` → frame 2).
 * 2. The duel span carries its authored caption and the EXT slug; the aftermath
 *    beat authored no caption → `caption: null` with the slug still present
 *    (the caption-less twin).
 * 3. A treeless script (tree: null), a legacy absent-tree script, and an EMPTY
 *    tree (no root to walk) all yield spans with caption and slug `null`.
 * 4. An unprefixed shot id passes through as the beat id.
 * 5. A beat parented straight under the intent has no enclosing scene → slug null
 *    while its caption survives.
 * 6. `renderCaptionSidecar` is deterministic bytes and round-trips via JSON.parse.
 * 7. Non-finite / zero fps throw.
 * 8. A 0.1-second trim at four fps rounds to zero frames and refuses instead of publishing an empty sidecar.
 *
 * @evidence contracts/testing.md#behavioral-verification Plans the real caption track and serializes it, asserting complete span records, authored text/slug joins, null and absent-tree states, bare shot ids, scene-less beats, deterministic JSON and clock/zero-frame refusals.
 * @evidence contracts/testing.md#independent-expectations The original trim lengths give 1+2-0.5=2.5 seconds and ten four-fps samples, with the incoming shot beginning at frame two. Authored fixture captions and scene payloads determine expected labels; explicit nulls and hand-derived half-open intervals are asserted without copying planner output.
 * @evidence contracts/testing.md#distinguishing-cases Preserves both captioned and caption-less spans, null/absent/empty trees, prefixed and bare ids, a beat without a scene, serialization and invalid/zero-output clocks. Slicing boundaries belong to caption_slice and actor motion/projection to pose-keypoint tests.
 * @evidence contracts/testing.md#execution-ownership The discoverable test_render_caption_sidecar owns these synchronous portable planning/serialization cases over the shared original fixtures; it writes no sidecar file and captures or encodes no frame.
 */
export function test_render_caption_sidecar(): void {
  const sidecar: IAutoMovieCaptionSidecar = planCaptionSidecar({
    script: TREE_SCRIPT,
    sequence: CAPTION_SEQUENCE,
    shots: CAPTION_SHOTS,
    fps: 4,
  });
  TestValidator.equals("frame count 10", sidecar.frameCount, 10);
  TestValidator.equals("two spans", sidecar.entries.length, 2);
  TestValidator.equals("span 1", sidecar.entries[0], {
    frameStart: 0,
    frameEnd: 2,
    beat: "duel",
    caption: "two knights clash at dawn",
    slug: "EXT. CASTLE COURTYARD - DAWN",
  });
  TestValidator.equals("span 2 caption-less twin", sidecar.entries[1], {
    frameStart: 2,
    frameEnd: 10,
    beat: "aftermath",
    caption: null,
    slug: "EXT. CASTLE COURTYARD - DAWN",
  });

  const treeless: IAutoMovieCaptionSidecar = planCaptionSidecar({
    script: { ...TREE_SCRIPT, tree: null },
    sequence: CAPTION_SEQUENCE,
    shots: CAPTION_SHOTS,
    fps: 4,
  });
  TestValidator.equals(
    "treeless spans null caption and slug",
    treeless.entries.map(
      (e: IAutoMovieCaptionEntry): Array<string | null> => [
        e.beat,
        e.caption,
        e.slug,
      ],
    ),
    [
      ["duel", null, null],
      ["aftermath", null, null],
    ],
  );

  const { tree: _omitted, ...absentTree }: IAutoMovieScript = TREE_SCRIPT;
  void _omitted;
  const absent: IAutoMovieCaptionSidecar = planCaptionSidecar({
    script: absentTree,
    sequence: CAPTION_SEQUENCE,
    shots: CAPTION_SHOTS,
    fps: 4,
  });
  const emptyTree: IAutoMovieCaptionSidecar = planCaptionSidecar({
    script: { ...TREE_SCRIPT, tree: [] },
    sequence: CAPTION_SEQUENCE,
    shots: CAPTION_SHOTS,
    fps: 4,
  });
  TestValidator.equals(
    "an empty tree (no root to walk) captions null",
    emptyTree.entries.map(
      (e: IAutoMovieCaptionEntry): Array<string | null> => [e.caption, e.slug],
    ),
    [
      [null, null],
      [null, null],
    ],
  );

  TestValidator.equals(
    "absent tree (legacy shape) behaves as treeless",
    absent.entries.map(
      (e: IAutoMovieCaptionEntry): Array<string | null> => [e.caption, e.slug],
    ),
    [
      [null, null],
      [null, null],
    ],
  );

  const bare: IAutoMovieCaptionSidecar = planCaptionSidecar({
    script: { ...TREE_SCRIPT, tree: null },
    sequence: {
      ...CAPTION_SEQUENCE,
      shots: [{ shot: "raw-id", trim: null, transition: null }],
    },
    shots: [shot("raw-id", 1)],
    fps: 4,
  });
  TestValidator.equals(
    "unprefixed shot id is the beat id",
    bare.entries[0]!.beat,
    "raw-id",
  );

  const orphan: IAutoMovieCaptionSidecar = planCaptionSidecar({
    script: {
      ...TREE_SCRIPT,
      beats: [screenplayBeat("duel", "The duel")],
      tree: [
        screenplayNode({
          id: "root",
          parent: null,
          kind: "intent",
          payload: { logline: "l", theme: "t" },
        }),
        screenplayNode({
          id: "b1",
          parent: "root",
          kind: "beat",
          payload: {
            beat: "duel",
            direction: "d",
            dialogue: [],
            caption: "cap",
          },
        }),
      ],
    },
    sequence: {
      ...CAPTION_SEQUENCE,
      shots: [{ shot: "shot:duel", trim: null, transition: null }],
    },
    shots: [shot("shot:duel", 1)],
    fps: 4,
  });
  TestValidator.equals("no enclosing scene → slug null", orphan.entries[0], {
    frameStart: 0,
    frameEnd: 4,
    beat: "duel",
    caption: "cap",
    slug: null,
  });

  const text: string = renderCaptionSidecar(sidecar);
  TestValidator.equals(
    "serialization deterministic",
    renderCaptionSidecar(sidecar),
    text,
  );
  const decoded: IAutoMovieCaptionSidecar = JSON.parse(
    text,
  ) as IAutoMovieCaptionSidecar;
  TestValidator.equals(
    "serialization round-trips",
    { ...decoded, fps: sidecar.fps },
    sidecar,
  );
  TestValidator.predicate(
    "serialized clock round-trips",
    nclose(decoded.fps, sidecar.fps),
  );

  TestValidator.predicate(
    "zero fps throws",
    throwsError(
      (): IAutoMovieCaptionSidecar =>
        planCaptionSidecar({
          script: TREE_SCRIPT,
          sequence: CAPTION_SEQUENCE,
          shots: CAPTION_SHOTS,
          fps: 0,
        }),
      "fps",
    ),
  );
  TestValidator.predicate(
    "non-finite fps throws",
    throwsError(
      (): IAutoMovieCaptionSidecar =>
        planCaptionSidecar({
          script: TREE_SCRIPT,
          sequence: CAPTION_SEQUENCE,
          shots: CAPTION_SHOTS,
          fps: Number.NaN,
        }),
      "fps",
    ),
  );
  // Zero-frame policy now matches planSequenceRender: a runtime that rounds to
  // no output frames throws on the caption side too, instead of silently
  // returning an empty sidecar beside a render that errored. A 0.1 s trim at
  // fps 4 rounds to round(0.4) = 0 frames.
  TestValidator.predicate(
    "zero output frames throws (aligned with planSequenceRender)",
    throwsError(
      (): IAutoMovieCaptionSidecar =>
        planCaptionSidecar({
          script: TREE_SCRIPT,
          sequence: {
            ...CAPTION_SEQUENCE,
            shots: [
              {
                shot: "shot:duel",
                trim: { start: 0, duration: 0.1 },
                transition: null,
              },
            ],
          },
          shots: CAPTION_SHOTS,
          fps: 4,
        }),
      "at least one frame",
    ),
  );
}
