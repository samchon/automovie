import { assembleHumanBodyGeneratedAnatomy } from "@automovie/human/body/anatomy/generated/assembleHumanBodyGeneratedAnatomy";
import { measureHumanBodyBasisChannels } from "@automovie/human/body/measure/measureHumanBodyBasisChannels";
import type { AutoMovieHumanoidBone } from "@automovie/interface";

import { renderBodyMeasuredControls } from "../body/bodyMeasuredControls";
import { bodyMeasuredGroups } from "../body/bodyMeasuredGroups";
import { mountBodyJointControls } from "../body/mountBodyJointControls";
import { annotateConnectedBodyReach } from "../common/annotateConnectedBodyReach";
import { connectedBodyReach } from "../common/connectedBodyReach";
import { renderConnectedBodyExteriorGaps } from "../common/renderConnectedBodyExteriorGaps";
import { renderConnectedBodyExteriorTargets } from "../common/renderConnectedBodyExteriorTargets";
import { renderConnectedBodyHeldMotions } from "../common/renderConnectedBodyHeldMotions";
import { renderConnectedBodyUnavailableChannels } from "../common/renderConnectedBodyUnavailableChannels";
import { renderConnectedBodyUnavailableParts } from "../common/renderConnectedBodyUnavailableParts";
import { renderConnectedBodyUnmeasuredChannels } from "../common/renderConnectedBodyUnmeasuredChannels";
import type { IConnectedPersonBodyControlsProps } from "./IConnectedPersonBodyControlsProps";

/**
 * Mount the person panel's body control section: the body editor's measured
 * controls by group and its joint controls, over the body partition view.
 *
 * Unavailable source targets are shown, never hidden
 * (`connectedBodyReach`). A channel with a missing endpoint is listed
 * disabled with the target named. An envelope-limited channel's row states
 * where its reach ends and why, and its scale is read within that reach. The
 * measured solve brackets in the same reach, so a target past it is refused
 * by name. The section fills its own group select, owns the search field, the
 * selected bone and the uncommitted measurement drafts, and `render` redraws
 * it from the current body.
 *
 * The "Anatomy" group lists the anatomical surface targets by request path
 * (`renderConnectedBodyExteriorTargets`), each stated in the document's
 * anatomy and solved by the builder along its bound source channel, then names what the body cannot
 * answer: unbound targets with their missing landmark, rule or tissue, the
 * anatomical parts not generated with their reason (from the generated
 * anatomy report, assembled once with no request), and the source channels
 * no measurement names. The joint group ends with the motions the rig holds.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Mounts the body editor's measured and joint controls over the person's body view.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Shows unavailable source targets and missing endpoints as named rows instead of hiding them.
 * @author Samchon
 */
export function mountConnectedPersonBodyControls(
  props: IConnectedPersonBodyControlsProps,
) {
  const { dom } = props;
  const reach = connectedBodyReach(props.body);
  const unavailable = new Set(props.body.unavailableTargets ?? []);
  const scales = new Map(
    measureHumanBodyBasisChannels(reach.basis, { measuredOnly: true }).map(
      (scale) => [scale.id, scale],
    ),
  );
  const kind = props.section.querySelector<HTMLSelectElement>(
    '[data-role="control-kind"]',
  )!;
  const container = props.section.querySelector<HTMLElement>(
    '[data-role="basis-controls"]',
  )!;
  const groups = bodyMeasuredGroups(reach.basis.channels, scales);
  // no request is stated, so every part answers with its source reason
  const anatomy = assembleHumanBodyGeneratedAnatomy({ basis: props.body });
  const targetDrafts = new Map<string, string>();
  for (const group of ["anatomy", ...groups, "pose"]) {
    const option = dom.createElement("option");
    option.value = group;
    option.textContent =
      group === "pose"
        ? "Pose · joints"
        : group === "anatomy"
          ? "Anatomy · targets and parts"
          : "Measurement · " + group;
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
      renderConnectedBodyHeldMotions(dom, container, props.body, query);
      return;
    }
    if (kind.value === "anatomy") {
      renderConnectedBodyExteriorTargets({
        dom,
        container,
        basis: reach.basis,
        query,
        drafts: targetDrafts,
        current: props.current,
        reserve: props.reserve,
        isCurrent: props.isCurrent,
        change: (next, ticket) => props.change(next, ticket),
        busy: props.busy,
        report: props.report,
        refuse: props.refuse,
      });
      renderConnectedBodyExteriorGaps(dom, container, query);
      renderConnectedBodyUnavailableParts(dom, container, anatomy, query);
      renderConnectedBodyUnmeasuredChannels(dom, container, props.body, query);
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
    annotateConnectedBodyReach(container, reach.limits);
    renderConnectedBodyUnavailableChannels(
      dom,
      container,
      reach.missing,
      unavailable,
      query,
    );
  };
  search.oninput = render;
  kind.onchange = render;
  return { render };
}
