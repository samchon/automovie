import type { IAutoMovieHumanBodyBasisDocument } from "@automovie/human";

import { annotateConnectedBodyReach } from "../common/annotateConnectedBodyReach";
import { renderConnectedBodyUnavailableChannels } from "../common/renderConnectedBodyUnavailableChannels";
import type { IConnectedBodyControlsProps } from "./IConnectedBodyControlsProps";
import { mountBodyJointControls } from "./mountBodyJointControls";
import { renderBodyMeasuredControls } from "./renderBodyMeasuredControls";

/**
 * Render the body editor's detailed controls for the selected group: the joint controls for `pose`, otherwise the measured controls of that group over the reach the body view can evaluate, followed by what it cannot, through the owners the person editor shares (`annotateConnectedBodyReach`, `renderConnectedBodyUnavailableChannels`). The controls bind to the panel's transaction hooks and own no document state.
 *
 * @evidence contracts/common.md#principled-implementation Pose rows use the original rig basis, while measured rows use evaluable reach and the shared measurement predicate; unavailable channels are displayed rather than receiving fabricated targets.
 * @evidence contracts/common.md#clear-and-simple-design One group dispatch delegates actual controls to joint and measured owners, then shared reach annotations explain the loaded view's limitations without taking document ownership.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The dispatcher uses supplied basis reach and transaction hooks, keeps unavailable channels visible, and does not bypass admission by publishing a local model.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes pose and measured groups, names shared reach owners and assigns document state and transactions to the panel.
 * @evidence contracts/performance.md#efficient-algorithms The selected renderer scans its relevant basis rows and constructs their DOM; reach annotations scan displayed controls and missing channels, with O(c+u) output storage for c eligible and u unavailable rows.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This redraw replaces DOM and owns no repeated numerical result; draft maps and worker reuse remain with the supplied parent and solver.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Replacing container children releases old control reachability and installs the selected rows and listeners; the parent owns the container lifetime, drafts, workers and asynchronous transactions.
 */
export function renderConnectedBodyControls(
  props: IConnectedBodyControlsProps,
): void {
  const dom: Document = props.dom;
  const container: HTMLElement = props.container;
  const kind: string = props.kind();
  const query: string = props.query();
  container.replaceChildren();
  if (kind === "pose") {
    mountBodyJointControls({
      dom,
      container,
      basis: props.basis,
      bone: props.bone(),
      query,
      current: props.current,
      select: props.select,
      redraw: (): void => renderConnectedBodyControls(props),
      change: (next: IAutoMovieHumanBodyBasisDocument): void => {
        void props.change(next);
      },
      refuse: props.refuse,
    });
    return;
  }
  renderBodyMeasuredControls({
    dom,
    container,
    basis: props.reach.basis,
    scales: props.scales,
    kind,
    query,
    drafts: props.drafts,
    current: props.current,
    reserve: props.reserve,
    isCurrent: props.isCurrent,
    solve: props.solve,
    change: (
      next: IAutoMovieHumanBodyBasisDocument,
      ticket: number,
    ): Promise<boolean> => props.change(next, ticket),
    busy: props.busy,
    report: props.report,
    refuse: props.refuse,
  });
  annotateConnectedBodyReach(container, props.reach.limits);
  renderConnectedBodyUnavailableChannels(
    dom,
    container,
    props.reach.missing,
    new Set(props.reach.basis.unavailableTargets ?? []),
    query,
  );
}
