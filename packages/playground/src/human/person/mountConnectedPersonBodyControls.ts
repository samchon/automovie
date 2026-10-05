import { measureHumanBodyBasisChannels } from "@automovie/human";
import type { AutoMovieHumanoidBone } from "@automovie/interface";

import { renderBodyMeasuredControls } from "../body/bodyMeasuredControls";
import { bodyMeasuredGroups } from "../body/bodyMeasuredGroups";
import { mountBodyJointControls } from "../body/mountBodyJointControls";
import { annotateConnectedPersonReach } from "./annotateConnectedPersonReach";
import { connectedPersonBodyReach } from "./connectedPersonBodyReach";
import type { IConnectedPersonBodyControlsProps } from "./IConnectedPersonBodyControlsProps";
import { renderConnectedPersonUnavailableChannels } from "./renderConnectedPersonUnavailableChannels";

/**
 * Mount the person panel's body control section: the body editor's measured
 * controls by group and its joint controls, over the body partition view.
 *
 * Unavailable source targets are shown, never hidden
 * (`connectedPersonBodyReach`). A channel with a missing endpoint is listed
 * disabled with the target named. An envelope-limited channel's row states
 * where its reach ends and why, and its scale is read within that reach. The
 * measured solve brackets in the same reach, so a target past it is refused
 * by name. The section fills its own group select, owns the search field, the
 * selected bone and the uncommitted measurement drafts, and `render` redraws
 * it from the current body.
 *
 * @author Samchon
 */
export function mountConnectedPersonBodyControls(props: IConnectedPersonBodyControlsProps) {
  const { dom } = props;
  const reach = connectedPersonBodyReach(props.body);
  const unavailable = new Set(props.body.unavailableTargets ?? []);
  const scales = new Map(
    measureHumanBodyBasisChannels(reach.basis, { measuredOnly: true }).map((scale) => [scale.id, scale]),
  );
  const kind = props.section.querySelector<HTMLSelectElement>('[data-role="control-kind"]')!;
  const container = props.section.querySelector<HTMLElement>('[data-role="basis-controls"]')!;
  const groups = bodyMeasuredGroups(reach.basis.channels, scales);
  for (const group of [...groups, "pose"]) {
    const option = dom.createElement("option");
    option.value = group;
    option.textContent = group === "pose" ? "Pose · joints" : "Measurement · " + group;
    kind.append(option);
  }
  const drafts = new Map<string, string>();
  let bone: AutoMovieHumanoidBone = "neck";
  const search = dom.createElement("input");
  search.type = "search";
  search.placeholder = "Find a body control: neck, waist, shoulder, knee…";
  search.setAttribute("aria-label", "Find a body control");
  search.style.width = "100%";
  container.before(search);
  const render = (): void => {
    const query = search.value.toLowerCase().replace(/\s/g, "");
    container.replaceChildren();
    if (kind.value === "pose") {
      mountBodyJointControls({
        dom,
        container,
        basis: props.body,
        bone,
        query,
        current: props.current,
        select: (selected) => {
          bone = selected;
        },
        redraw: render,
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
      basis: reach.basis,
      scales,
      kind: kind.value,
      query,
      drafts,
      current: props.current,
      reserve: props.reserve,
      isCurrent: props.isCurrent,
      solve: props.solve,
      change: (next, ticket) => props.change(next, ticket),
      busy: props.busy,
      report: props.report,
      refuse: props.refuse,
    });
    annotateConnectedPersonReach(container, reach.limits);
    renderConnectedPersonUnavailableChannels(dom, container, reach.missing, unavailable, query);
  };
  search.oninput = render;
  kind.onchange = render;
  return { render };
}
