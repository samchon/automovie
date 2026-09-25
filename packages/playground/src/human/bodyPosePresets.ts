import type {
  IAutoMovieHumanBodyBasisDocument,
  IAutoMovieHumanBodyShoulderPose,
} from "@automovie/human";
import type { IAutoMovieJointPose } from "@automovie/interface";

/**
 * One pose preset: a fixed joint list, or one the body worker solves on the
 * current body.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Names each pose preset the editor offers and whether it is typed or solved on the body.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Carries a preset's replacement joint list or the solve that produces it.
 */
export type BodyPosePreset = {
  /** Button label. */
  name: string;
  /** Non-humeral joints the preset writes; absent is none. */
  pose?: IAutoMovieJointPose[];
  /** Thorax-relative shoulder goals the preset writes; absent is none. */
  shoulders?: IAutoMovieHumanBodyShoulderPose[];
  /** Solve the joints on the current body instead of typing them. */
  solve?: "armsDown";
};

/**
 * Render the body editor's pose presets. A preset replaces the document's
 * whole joint list in one edit, as the specification states. A fixed preset
 * applies at once. A solved preset (`armsDown`) asks the worker to solve it
 * on the current body with every joint at rest, the list it will replace,
 * and applies the answer only while it is still the latest intent: a slider
 * moved during the solve supersedes it, and a refusal leaves the committed
 * body as it was with the reason on the status line.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Offers pose presets as document edits, including an arms-down rest solved at this body's own skin contact.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Applies each preset as one transaction under the latest-intent order, discarding a solve a newer edit superseded.
 */
export function renderBodyPosePresets(props: {
  dom: Document;
  container: HTMLElement;
  presets: readonly BodyPosePreset[];
  current: () => IAutoMovieHumanBodyBasisDocument;
  armsDown?: (
    document: IAutoMovieHumanBodyBasisDocument,
  ) => Promise<Pick<IAutoMovieHumanBodyBasisDocument, "pose" | "shoulders">>;
  reserve: () => number;
  isCurrent: (ticket: number) => boolean;
  apply: (document: IAutoMovieHumanBodyBasisDocument, ticket: number) => void;
  refuse: (error: unknown) => void;
  busy: (text: string) => void;
}): void {
  for (const preset of props.presets) {
    const button = props.dom.createElement("button");
    button.textContent = preset.name;
    button.onclick = async () => {
      const ticket = props.reserve();
      const draft = structuredClone(props.current());
      try {
        if (preset.solve === undefined) {
          props.apply(
            {
              ...draft,
              pose: structuredClone(preset.pose ?? []),
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
        const solved = await props.armsDown({
          ...draft,
          pose: [],
          shoulders: [],
        });
        if (!props.isCurrent(ticket)) return;
        props.apply(
          {
            ...draft,
            pose: solved.pose ?? [],
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
