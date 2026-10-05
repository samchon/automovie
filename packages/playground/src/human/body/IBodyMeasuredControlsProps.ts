import type {
  IAutoMovieHumanBodyBasis,
  IAutoMovieHumanBodyBasisDocument,
  IAutoMovieHumanBodyChannelScale,
} from "@automovie/human";

import type { IConnectedBodyMeasurement } from "./IConnectedBodyMeasurement";

/**
 * What the detailed measured controls render into and call: the container,
 * the basis and its measured scales, the selected group and search, the
 * parent's drafts and intent tickets, the off-thread solver and the panel's
 * transaction, status and refusal owners.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Carries the measured scales and the off-thread solver behind the editor's millimetre targets.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Names the group, search, drafts and transaction the detailed measured rows are rendered with.
 * @author Samchon
 */
export interface IBodyMeasuredControlsProps {
  /** The document that creates the rows. */
  dom: Document;

  /** The element the rows replace their children in. */
  container: HTMLElement;

  /** The basis whose measured channels the rows offer. */
  basis: IAutoMovieHumanBodyBasis;

  /** Each measured channel's scale and neutral reading. */
  scales: Map<string, IAutoMovieHumanBodyChannelScale>;

  /** The selected measured group. */
  kind: string;

  /** The search text, lower-cased without spaces. */
  query: string;

  /** Uncommitted typed targets by channel id, owned by the parent. */
  drafts: Map<string, string>;

  /** The current draft body document. */
  current: () => IAutoMovieHumanBodyBasisDocument;

  /** Reserve a new intent ticket. */
  reserve: () => number;

  /** Whether a ticket is still the latest intent. */
  isCurrent: (ticket: number) => boolean;

  /** Solve one measured channel for a target in metres, off the page. */
  solve: (
    shape: Record<string, number>,
    channel: string,
    targetMetres: number,
  ) => Promise<IConnectedBodyMeasurement>;

  /** Commit a body document under a ticket. */
  change: (
    document: IAutoMovieHumanBodyBasisDocument,
    ticket: number,
  ) => Promise<boolean>;

  /** Show a busy status. */
  busy: (text: string) => void;

  /** Append a report line to the status. */
  report: (text: string) => void;

  /** Report a refused input; the committed state stays. */
  refuse: (error: unknown) => void;
}
