import { renderBodyMeasuredControls } from "./bodyMeasuredControls";
import type { IConnectedBodyControlsProps } from "./IConnectedBodyControlsProps";
import { mountBodyJointControls } from "./mountBodyJointControls";
import { renderBodyReachNotes } from "./renderBodyReachNotes";

/**
 * Render the body editor's detailed controls for the selected group: the
 * joint controls for `pose`, otherwise the measured controls of that group
 * over the reach the body view can evaluate, followed by what it cannot
 * (`renderBodyReachNotes`). The controls bind to the panel's transaction
 * hooks and own no document state.
 *
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
  renderBodyReachNotes(dom, container, props.reach, query);
}
