import { annotateConnectedBodyReach } from "../common/annotateConnectedBodyReach";
import { renderConnectedBodyUnavailableChannels } from "../common/renderConnectedBodyUnavailableChannels";
import { renderBodyMeasuredControls } from "./bodyMeasuredControls";
import type { IConnectedBodyControlsProps } from "./IConnectedBodyControlsProps";
import { mountBodyJointControls } from "./mountBodyJointControls";

/**
 * Render the body editor's detailed controls for the selected group: the
 * joint controls for `pose`, otherwise the measured controls of that group
 * over the reach the body view can evaluate, followed by what it cannot,
 * through the owners the person editor shares
 * (`annotateConnectedBodyReach`, `renderConnectedBodyUnavailableChannels`).
 * The controls bind to the panel's transaction hooks and own no document
 * state.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Shows the joint controls or one group's measured channels, and what the body view cannot evaluate.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Renders only channels with a measurement rule, in millimetres, over the reach the body view can evaluate.
 * @author Samchon
 */
export function renderConnectedBodyControls(props: IConnectedBodyControlsProps): void {
  const { dom, container } = props;
  const kind = props.kind();
  const query = props.query();
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
      redraw: () => renderConnectedBodyControls(props),
      change: (next) => {
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
    change: (next, ticket) => props.change(next, ticket),
    busy: props.busy,
    report: props.report,
    refuse: props.refuse,
  });
  annotateConnectedBodyReach(container, props.reach.limits);
  renderConnectedBodyUnavailableChannels(dom, container, props.reach.missing, new Set(props.reach.basis.unavailableTargets ?? []), query);
}
