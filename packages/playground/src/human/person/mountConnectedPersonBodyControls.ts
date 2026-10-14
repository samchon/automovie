import { assembleHumanBodyGeneratedAnatomy } from "@automovie/human/body/anatomy/generated/assembleHumanBodyGeneratedAnatomy";
import { measureHumanBodyBasisChannels } from "@automovie/human/body/measure/measureHumanBodyBasisChannels";
import type { AutoMovieHumanoidBone } from "@automovie/interface";

import { bodyMeasuredGroups } from "../body/bodyMeasuredGroups";
import { mountBodyJointControls } from "../body/mountBodyJointControls";
import { renderBodyMeasuredControls } from "../body/renderBodyMeasuredControls";
import { annotateConnectedBodyReach } from "../common/annotateConnectedBodyReach";
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
 * The shape-only measured solver returns a reading before complete-person anatomy/admission; its report remains a solver reading rather than independent final-person readback. Rendering preserves drafts, but the numerical transports and panel own pending work and close.
 *
 * @evidence contracts/common.md#principled-implementation Paired evaluable reach drives measured scales/solves and explicit unavailable rows, while body/anatomy/pose edits share the panel's complete-person intent and transaction authority.
 * @evidence contracts/common.md#clear-and-simple-design This section owns group/search/bone and input drafts, delegates canonical measured/joint/anatomy row rendering, and leaves numerical construction/admission/history to existing owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing endpoints/tissues/held motions stay named, reach is not extrapolated and shape-only solver readings do not claim independent final-person anatomy or accepted history.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies paired reach, generated no-request anatomy, draft/selection ownership, solver-reading provenance and separate pending-work lifetime.
 * @evidence contracts/performance.md#efficient-algorithms Initial mount computes real measured channel displacement scales and one generated no-request anatomy report, retaining their actual source/numerical traversal costs; each repaint searches and builds the selected measured/anatomy/pose rows plus corresponding reach annotations, with existing row owners accounting for their scans.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One scale Map, reach and no-request anatomy report are reused within the source-bound mounted section; mutable document state is read at event/render time rather than cached across edits.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The section retains one source-bound scale/report set, finite source-channel/target draft maps and current bone/search state; repaint replaces row DOM, parent close removes the section, and externally retained handles or pending transport tasks remain their actual owners' responsibility.
 *
 * @author Samchon
 */
export function mountConnectedPersonBodyControls(
  props: IConnectedPersonBodyControlsProps,
): {
  /** Repaint selected controls from current body draft while preserving text drafts. */ render: () => void;
} {
  const { dom }: Pick<IConnectedPersonBodyControlsProps, "dom"> = props;
  const reach: IConnectedPersonBodyControlsProps["reach"] = props.reach;
  const unavailable: Set<string> = new Set(props.body.unavailableTargets ?? []);
  const scales: Map<
    string,
    ReturnType<typeof measureHumanBodyBasisChannels>[number]
  > = new Map(
    measureHumanBodyBasisChannels(reach.basis, { measuredOnly: true }).map(
      (
        scale: ReturnType<typeof measureHumanBodyBasisChannels>[number],
      ): [string, ReturnType<typeof measureHumanBodyBasisChannels>[number]] => [
        scale.id,
        scale,
      ],
    ),
  );
  const kind: HTMLSelectElement =
    props.section.querySelector<HTMLSelectElement>(
      '[data-role="control-kind"]',
    )!;
  const container: HTMLElement = props.section.querySelector<HTMLElement>(
    '[data-role="basis-controls"]',
  )!;
  const groups: string[] = bodyMeasuredGroups(reach.basis.channels, scales);
  // no request is stated, so every part answers with its source reason
  const anatomy: ReturnType<typeof assembleHumanBodyGeneratedAnatomy> =
    assembleHumanBodyGeneratedAnatomy({ basis: props.body });
  const targetDrafts: Map<string, string> = new Map();
  for (const group of ["anatomy", ...groups, "pose"]) {
    const option: HTMLOptionElement = dom.createElement("option");
    option.value = group;
    option.textContent =
      group === "pose"
        ? "Pose · joints"
        : group === "anatomy"
          ? "Anatomy · targets and parts"
          : "Measurement · " + group;
    kind.append(option);
  }
  const drafts: Map<string, string> = new Map();
  let bone: AutoMovieHumanoidBone = "neck";
  const search: HTMLInputElement = dom.createElement("input");
  search.type = "search";
  search.placeholder = "Find a body control: neck, waist, shoulder, knee…";
  search.setAttribute("aria-label", "Find a body control");
  search.style.width = "100%";
  container.before(search);
  const render: () => void = (): void => {
    const query: string = search.value.toLowerCase().replace(/\s/g, "");
    container.replaceChildren();
    if (kind.value === "pose") {
      mountBodyJointControls({
        dom,
        container,
        basis: props.body,
        bone,
        query,
        current: props.current,
        select: (selected: AutoMovieHumanoidBone): void => {
          bone = selected;
        },
        redraw: render,
        change: (
          next: ReturnType<IConnectedPersonBodyControlsProps["current"]>,
        ): void => {
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
        change: (
          next: ReturnType<IConnectedPersonBodyControlsProps["current"]>,
          ticket: number,
        ): Promise<boolean> => props.change(next, ticket),
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
      change: (
        next: ReturnType<IConnectedPersonBodyControlsProps["current"]>,
        ticket: number,
      ): Promise<boolean> => props.change(next, ticket),
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
