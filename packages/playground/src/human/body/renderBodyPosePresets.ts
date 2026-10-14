import type { IAutoMovieHumanBodyBasisDocument } from "@automovie/human";
import type { IAutoMovieJointPose } from "@automovie/interface";

import type { BodyPosePreset } from "./BodyPosePreset";

/**
 * Render the body editor's pose presets. A preset replaces joint rows while keeping unnamed standing-posture rows. Fixed presets submit immediately. The existing sampled armsDown solve starts from those kept rows, and the worker preserves supplied non-arm rows while replacing the arm goals. Its answer is submitted only under the current intent; a later edit supersedes it. Numerical refusal preserves the display, while cleanup refusal can follow an earlier publication and promises no rollback.
 *
 * @evidence contracts/common.md#principled-implementation Fixed presets replace authored coordinate groups while preserving unnamed standing joints; solved presets evaluate the captured body and retain result authority only under the shared current intent.
 * @evidence contracts/common.md#clear-and-simple-design The renderer creates buttons and composes documents, delegating body-specific arms-down solving and final document admission to the supplied owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unsupported solving refuses instead of guessing joint rows, and a stale solution cannot overwrite a later slider or history edit.
 * @evidence contracts/common.md#meaningful-documentation The comment explains full-list replacement, standing-posture preservation, fixed versus solved application and stale or refused solve behavior.
 * @evidence contracts/performance.md#efficient-algorithms Mounting creates b buttons; applying clones d document data and filters p pose rows against s standing names and n preset rows in O(d + p(s+n)) work, with numerical solving delegated off-thread.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each preset click is a distinct authored intent; this mount caches no numerical solution across bodies or user actions.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The container owns b buttons and listeners until replacement or panel closure; each asynchronous solve retains its snapshot until completion and loses publication authority on a newer ticket.
 */
export function renderBodyPosePresets(props: {
  /** Document that creates the example buttons. */
  dom: Document;

  /** Container to which the buttons are appended. */
  container: HTMLElement;

  /** Authored and solved examples, in button order. */
  presets: readonly BodyPosePreset[];

  /** Read the current body draft at click time. */
  current: () => IAutoMovieHumanBodyBasisDocument;

  /** The joints whose rows a preset keeps unless it names them; absent is none. */
  standing?: readonly string[];

  /** Current-body numerical solver; absence refuses solved presets. */
  armsDown?: (
    document: IAutoMovieHumanBodyBasisDocument,
  ) => Promise<Pick<IAutoMovieHumanBodyBasisDocument, "pose" | "shoulders">>;

  /** Reserve the panel's shared intent before numerical work. */
  reserve: () => number;

  /** Whether a solved result still belongs to the latest intent. */
  isCurrent: (ticket: number) => boolean;

  /** Submit the composed document under its reserved intent. */
  apply: (document: IAutoMovieHumanBodyBasisDocument, ticket: number) => void;

  /** Report a current refusal without changing the admitted body. */
  refuse: (error: unknown) => void;

  /** Present a solved preset's ongoing numerical work. */
  busy: (text: string) => void;
}): void {
  for (const preset of props.presets) {
    const button: HTMLButtonElement = props.dom.createElement("button");
    button.textContent = preset.name;
    button.onclick = async (): Promise<void> => {
      const ticket: number = props.reserve();
      const draft: IAutoMovieHumanBodyBasisDocument = structuredClone(
        props.current(),
      );
      const kept: (
        named: readonly IAutoMovieJointPose[],
      ) => IAutoMovieJointPose[] = (
        named: readonly IAutoMovieJointPose[],
      ): IAutoMovieJointPose[] =>
        (draft.pose ?? []).filter(
          (row: IAutoMovieJointPose): boolean =>
            (props.standing ?? []).includes(row.bone) &&
            !named.some(
              (one: IAutoMovieJointPose): boolean => one.bone === row.bone,
            ),
        );
      try {
        if (preset.solve === undefined) {
          props.apply(
            {
              ...draft,
              pose: [
                ...kept(preset.pose ?? []),
                ...structuredClone(preset.pose ?? []),
              ],
              shoulders: structuredClone(preset.shoulders ?? []),
            },
            ticket,
          );
          return;
        }
        if (props.armsDown === undefined)
          throw new Error(
            "This viewport cannot solve the " + preset.name + " preset.",
          );
        props.busy("Solving " + preset.name + " on this body…");
        const solved: Pick<
          IAutoMovieHumanBodyBasisDocument,
          "pose" | "shoulders"
        > = await props.armsDown({
          ...draft,
          pose: kept([]),
          shoulders: [],
        });
        if (!props.isCurrent(ticket)) return;
        props.apply(
          {
            ...draft,
            pose: [...kept(solved.pose ?? []), ...(solved.pose ?? [])],
            shoulders: solved.shoulders ?? [],
          },
          ticket,
        );
      } catch (error) {
        if (props.isCurrent(ticket)) props.refuse(error);
      }
    };
    props.container.append(button);
  }
}
