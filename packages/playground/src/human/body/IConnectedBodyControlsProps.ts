import type {
  IAutoMovieHumanBodyBasis,
  IAutoMovieHumanBodyBasisDocument,
  IAutoMovieHumanBodyChannelScale,
} from "@automovie/human";
import type { AutoMovieHumanoidBone } from "@automovie/interface";

import type { IConnectedBodyReach } from "../common/IConnectedBodyReach";
import type { IConnectedBodyMeasurement } from "./IConnectedBodyMeasurement";

/**
 * Inputs of `renderConnectedBodyControls`: where the controls go, which group
 * and search text select them, what the body view can evaluate, and the
 * panel's transaction hooks.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Carries the group and search that select which detailed channels and joints the editor shows.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Names the body view's evaluable reach and the transaction hooks the detailed controls edit through.
 * @author Samchon
 */
export interface IConnectedBodyControlsProps {
  /** Document that creates the control elements. */
  dom: Document;

  /** Element the controls replace their children in. */
  container: HTMLElement;

  /** Selected control group: a measurement group or `pose`. */
  kind: () => string;

  /** Search text, lower case without spaces. */
  query: () => string;

  /** The full body view, whose joints the pose controls bind. */
  basis: IAutoMovieHumanBodyBasis;

  /** What the body view can evaluate; measured controls use its basis. */
  reach: IConnectedBodyReach;

  /** Measured channel scales over the reach basis. */
  scales: Map<string, IAutoMovieHumanBodyChannelScale>;

  /** Typed measurement targets not yet solved, by channel. */
  drafts: Map<string, string>;

  /** The joint the pose controls show. */
  bone: () => AutoMovieHumanoidBone;

  /** Show another joint. */
  select: (bone: AutoMovieHumanoidBone) => void;

  /** The current draft document. */
  current: () => IAutoMovieHumanBodyBasisDocument;

  /** Commit a document, under a reserved intent ticket when given. */
  change: (document: IAutoMovieHumanBodyBasisDocument, ticket?: number) => Promise<boolean>;

  /** Reserve a new intent, withdrawing pending work. */
  reserve: () => number;

  /** Whether an intent ticket is still the latest. */
  isCurrent: (ticket: number) => boolean;

  /** Solve one measured channel for a target in metres off the page. */
  solve: (shape: Record<string, number>, channel: string, targetMetres: number) => Promise<IConnectedBodyMeasurement>;

  /** Show a building status. */
  busy: (text: string) => void;

  /** Append a line to the status. */
  report: (text: string) => void;

  /** Refuse with a reason, keeping the committed body. */
  refuse: (error: unknown) => void;
}
