import type {
  IAutoMovieHumanBodyBasisDocument,
  IAutoMovieHumanBodyChannelScale,
  IAutoMovieHumanBodySimpleShape,
} from "@automovie/human";
import { HUMAN_BODY_SIMPLE_POSTURE } from "@automovie/human/body/constants/HUMAN_BODY_SIMPLE_POSTURE";
import { parseHumanBodyBasisDocument } from "@automovie/human/body/document/parseHumanBodyBasisDocument";
import { serializeHumanBodyBasisDocument } from "@automovie/human/body/document/serializeHumanBodyBasisDocument";
import { measureHumanBodyBasisChannels } from "@automovie/human/body/measure/measureHumanBodyBasisChannels";
import { humanBodySimplePosture } from "@automovie/human/body/simple/humanBodySimplePosture";
import { createHumanFaceEditor } from "@automovie/human/face/editor/createHumanFaceEditor";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
} from "@automovie/interface";
import { createAutoMovieResourceRetirement } from "@automovie/viewer";

import type { IConnectedBodyReach } from "@automovie/human/body/measure/IConnectedBodyReach";
import { connectedBodyReach } from "@automovie/human/body/measure/connectedBodyReach";
import type { IBodySimpleBody } from "./IBodySimpleBody";
import type { IBodySimpleControlsHandle } from "./IBodySimpleControlsHandle";
import type { IConnectedBodyHumeralSlot } from "./IConnectedBodyHumeralSlot";
import type { IConnectedBodyPanelModel } from "./IConnectedBodyPanelModel";
import type { IConnectedBodyPanelProps } from "./IConnectedBodyPanelProps";
import type { IConnectedBodyViewport } from "./IConnectedBodyViewport";
import { bodyAnatomyReading } from "./bodyAnatomyReading";
import { bodyFemoralReading } from "./bodyFemoralReading";
import { bodyGroundReading } from "./bodyGroundReading";
import { bodyMeasuredGroups } from "./bodyMeasuredGroups";
import { connectedBodyPanelMarkup } from "./connectedBodyPanelMarkup";
import { createBodyContactWatch } from "./createBodyContactWatch";
import { createBodyIntentGate } from "./createBodyIntentGate";
import { mountBodyUnderwearSelect } from "./mountBodyUnderwearSelect";
import { renderBodyHumeralHeadControls } from "./renderBodyHumeralHeadControls";
import { renderBodyPosePresets } from "./renderBodyPosePresets";
import { renderBodySimpleControls } from "./renderBodySimpleControls";
import { renderConnectedBodyControls } from "./renderConnectedBodyControls";
import { setConnectedBodyPreparing } from "./setConnectedBodyPreparing";

/**
 * Mount the body's shape, measurement and pose controls around an injected numerical viewport. Weight ranges, measurement rules, joint ranges and rest angles all come from the admitted basis; the panel formats and binds them. Retirement is awaited outside the synchronous history publication. A cleanup refusal reports the current committed body without restoring an earlier document or destroying its newly published preview. The loaded body's evaluable reach determines measured controls; unavailable endpoints and shortened domains remain named. Camera, clay and companion-head display stay outside the body document. Close withdraws intent, awaits contact and viewport cleanup, then removes controls; the owning page separately closes the injected head seat and simple solvers.
 *
 * @evidence contracts/common.md#principled-implementation Shared reach bounds measured inverses, monotonic intent gates asynchronous edits and file reads, and the transactional editor joins admitted document and prepared frame before awaited retirement.
 * @evidence contracts/common.md#clear-and-simple-design The panel owns DOM drafts, intent and history commands, Human owns admission and numerical inverses, and injected viewport and companion owners manage display resources.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unavailable source endpoints remain visible, measurements are not replaced by displacement statistics, stale effects are discarded, and cleanup failure cannot roll back a newly published admitted frame.
 * @evidence contracts/common.md#meaningful-documentation The comment assigns range provenance, numerical and resource ownership, unavailable reach, publication-before-retirement semantics and separate page closure of injected services.
 * @evidence contracts/performance.md#efficient-algorithms Mount scans basis channels to measure reach and construct c controls; refresh serializes d document values and rebuilds selected DOM, while model construction and contact inspection dominate in supplied workers. These full traversals preserve canonical document text and currently admitted controls rather than claiming constant redraw cost.
 * @evidence contracts/performance.md#reuse-equivalent-work Reach, channel scales and group choices are computed once per mount, measurement drafts survive redraw, simple projection owns complete-input reuse, and debounced contacts replace delayed reads while distinct document intents retain separate publication authority.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The panel retains DOM, text drafts and editor history with no local history cap; close withdraws pending authority, awaits contact and viewport retirement and clears editor and DOM reachability. The page owns independent head-seat and solver closure.
 */
export function mountConnectedBodyPanel<Model extends IConnectedBodyPanelModel>(
  app: HTMLElement,
  props: IConnectedBodyPanelProps<Model>,
): {
  /** Settles after initial admission or its reported refusal. */
  ready: Promise<void>;

  /** Release this panel and its acquired viewport, preserving cleanup failures. */
  close: () => Promise<void>;

  /** Admitted history state, absent before initialization or after close. */
  snapshot: () =>
    | ReturnType<
        ReturnType<
          typeof createHumanFaceEditor<Model, IAutoMovieHumanBodyBasisDocument>
        >["snapshot"]
      >
    | undefined;

  /** Submit a document under a fresh intent; false includes refusal, closure, supersession or failed retirement after publication. */
  change: (document: IAutoMovieHumanBodyBasisDocument) => Promise<boolean>;

  /** Parse and submit document text, reporting admission refusal in the panel. */
  load: (text: string) => Promise<void>;
} {
  const dom: Document = app.ownerDocument;
  // Unavailable source targets are shown, never hidden (renderConnectedBodyControls).
  const reach: IConnectedBodyReach = connectedBodyReach(props.basis);
  const scales: Map<string, IAutoMovieHumanBodyChannelScale> = new Map(
    measureHumanBodyBasisChannels(reach.basis, { measuredOnly: true }).map(
      (
        scale: IAutoMovieHumanBodyChannelScale,
      ): [string, IAutoMovieHumanBodyChannelScale] => [scale.id, scale],
    ),
  );
  const groups: string[] = bodyMeasuredGroups(reach.basis.channels, scales);
  app.innerHTML = connectedBodyPanelMarkup(groups);
  const element: <T extends HTMLElement>(id: string) => T = <
    T extends HTMLElement,
  >(
    id: string,
  ): T => app.querySelector<T>("#" + id)!;
  const controlKind: HTMLSelectElement = app.querySelector<HTMLSelectElement>(
    '[data-role="control-kind"]',
  )!;
  const basisControls: HTMLElement = app.querySelector<HTMLElement>(
    '[data-role="basis-controls"]',
  )!;
  const underwear: HTMLSelectElement = mountBodyUnderwearSelect(
    dom,
    element("editing"),
  );
  const viewport: IConnectedBodyViewport<Model> = props.viewport(
    element<HTMLCanvasElement>("body-canvas"),
  );
  let editor:
    | ReturnType<
        typeof createHumanFaceEditor<Model, IAutoMovieHumanBodyBasisDocument>
      >
    | undefined;
  const humeral: IConnectedBodyHumeralSlot = {};
  let closed: boolean = false;
  let draft: IAutoMovieHumanBodyBasisDocument = structuredClone(props.initial);
  const intents: ReturnType<typeof createBodyIntentGate> =
    createBodyIntentGate();
  // Typed measurement targets are UI drafts. A committed pose rebuilds rows
  // without converting an unfinished number into document geometry.
  const measurementDrafts: Map<string, string> = new Map();
  let bone: AutoMovieHumanoidBone = "leftUpperArm";
  const status: (text: string, state: string) => void = (
    text: string,
    state: string,
  ): void => {
    element("body-status").textContent = text;
    element("body-status").dataset.state = state;
  };
  const withdraw: () => number = (): number => {
    contacts.cancel();
    editor?.cancel();
    viewport.cancel();
    return intents.reserve();
  };
  const refuse: (error: unknown) => void = (error: unknown): void => {
    withdraw();
    if (editor !== undefined) draft = editor.snapshot().document;
    humeral.controls?.refresh(draft.humeralHeads, true);
    status(error instanceof Error ? error.message : String(error), "error");
  };
  const contacts: ReturnType<typeof createBodyContactWatch<Model>> =
    createBodyContactWatch({
      build: viewport.build,
      dispose: viewport.dispose,
      settleRetirements: viewport.settleRetirements,
      isCurrent: intents.isCurrent,
      report: (text: string): void => {
        element("body-status").textContent += String.fromCharCode(10) + text;
      },
    });
  const seatHead: (model: Model) => void = (model: Model): void => {
    props.seat(
      element<HTMLInputElement>("face").checked ? model : null,
      editor?.snapshot().document ?? draft,
    );
  };
  const settle: () => Promise<void> = async (): Promise<void> => {
    try {
      await viewport.settleRetirements();
    } catch (cause) {
      throw new Error(
        "Resource cleanup failed; the displayed body is retained: " +
          (cause instanceof Error ? cause.message : String(cause)),
        { cause },
      );
    }
  };
  const refresh: () => void = (): void => {
    const state: ReturnType<NonNullable<typeof editor>["snapshot"]> =
      editor!.snapshot();
    draft = state.document;
    status(
      state.error ??
        `${state.document.name}\n${state.model.parts} material regions · ${(state.document.pose?.length ?? 0) + (state.document.shoulders?.length ?? 0)} posed joints · committed numerical state`,
      state.status,
    );
    element<HTMLButtonElement>("body-undo").disabled = !state.canUndo;
    element<HTMLButtonElement>("body-redo").disabled = !state.canRedo;
    element<HTMLTextAreaElement>("document-json").value =
      serializeHumanBodyBasisDocument(
        state.document,
        props.basis.anatomicalAssembly,
      );
    underwear.value = state.document.underwear?.style ?? "";
    humeral.controls?.refresh(state.document.humeralHeads);
    void simple.refresh({
      shape: state.document.shape,
      ...(state.document.anatomy === undefined
        ? {}
        : { anatomy: state.document.anatomy }),
    });
    renderControls();
  };
  const change: (
    next: IAutoMovieHumanBodyBasisDocument,
    ticket?: number,
  ) => Promise<boolean> = async (
    next: IAutoMovieHumanBodyBasisDocument,
    ticket: number = withdraw(),
  ): Promise<boolean> => {
    if (closed) return false;
    if (!intents.isCurrent(ticket)) return false;
    draft = structuredClone(next);
    status("Building the latest body…", "building");
    try {
      const success: boolean = await editor!.edit(next);
      if (intents.isCurrent(ticket)) {
        if (success) seatHead(editor!.snapshot().model);
        refresh();
        if (!success)
          humeral.controls?.refresh(
            editor!.snapshot().document.humeralHeads,
            true,
          );
      }
      await settle();
      if (!intents.isCurrent(ticket)) return false;
      if (success)
        void contacts
          .after(editor!.snapshot().document, ticket)
          .catch((error: unknown): void => {
            if (intents.isCurrent(ticket)) refuse(error);
          });
      return success;
    } catch (error) {
      if (intents.isCurrent(ticket)) refuse(error);
      return false;
    }
  };
  const applyText: (text: string, ticket?: number) => Promise<void> = async (
    text: string,
    ticket: number = withdraw(),
  ): Promise<void> => {
    if (closed) throw new Error("The connected body panel is closed.");
    try {
      if (intents.isCurrent(ticket))
        await change(
          parseHumanBodyBasisDocument(text, props.basis.anatomicalAssembly),
          ticket,
        );
    } catch (error) {
      if (intents.isCurrent(ticket)) refuse(error);
    }
  };
  const renderControls: () => void = (): void =>
    renderConnectedBodyControls({
      dom,
      container: basisControls,
      kind: (): string => controlKind.value,
      query: (): string =>
        element<HTMLInputElement>("body-control-search")
          .value.toLowerCase()
          .replace(/\s/g, ""),
      basis: props.basis,
      reach,
      scales,
      drafts: measurementDrafts,
      bone: (): AutoMovieHumanoidBone => bone,
      select: (selected: AutoMovieHumanoidBone): void => {
        bone = selected;
      },
      current: (): IAutoMovieHumanBodyBasisDocument => draft,
      change,
      reserve: withdraw,
      isCurrent: intents.isCurrent,
      solve: props.simple.solveMeasurement,
      busy: (text: string): void => status(text, "building"),
      report: (text: string): void => {
        element("body-status").textContent += String.fromCharCode(10) + text;
      },
      refuse,
    });
  for (const button of app.querySelectorAll<HTMLButtonElement>("[data-view]"))
    button.onclick = (): void =>
      viewport.cameraView(Number(button.dataset.view));
  element("fit-view").onclick = viewport.fitView;
  element<HTMLInputElement>("clay").onchange = (): void =>
    viewport.setClay(element<HTMLInputElement>("clay").checked);
  element<HTMLInputElement>("shadows").onchange = (): void =>
    viewport.setShadows(element<HTMLInputElement>("shadows").checked);
  element<HTMLInputElement>("face").onchange = async (): Promise<void> => {
    if (editor === undefined) return;
    const ticket: number = intents.currentTicket();
    try {
      seatHead(editor.snapshot().model);
      await settle();
    } catch (error) {
      if (intents.isCurrent(ticket)) refuse(error);
    }
  };
  underwear.onchange = (): void => {
    const next: IAutoMovieHumanBodyBasisDocument = structuredClone(draft);
    if (underwear.value === "") delete next.underwear;
    else
      next.underwear = {
        ...next.underwear,
        style: underwear.value as NonNullable<typeof next.underwear>["style"],
      };
    void change(next);
  };
  controlKind.onchange = renderControls;
  const search: HTMLInputElement = dom.createElement("input");
  search.id = "body-control-search";
  search.type = "search";
  search.placeholder = "Find a control: waist, hip, shoulder, knee…";
  search.setAttribute("aria-label", "Find a body control");
  search.style.width = "100%";
  search.oninput = renderControls;
  basisControls.before(search);
  for (const action of ["undo", "redo", "reset"] as const)
    element("body-" + action).onclick = async (): Promise<void> => {
      const ticket: number = withdraw();
      status("Restoring the selected body…", "building");
      try {
        const success: boolean = await editor![action]();
        if (intents.isCurrent(ticket)) {
          if (success) seatHead(editor!.snapshot().model);
          refresh();
        }
        await settle();
      } catch (error) {
        if (intents.isCurrent(ticket)) refuse(error);
      }
    };
  // the trunk's joints the age posture bends, which pose presets keep
  const standing: string[] = [
    ...HUMAN_BODY_SIMPLE_POSTURE.thoracic.map(
      ([bone]: (typeof HUMAN_BODY_SIMPLE_POSTURE.thoracic)[number]): string =>
        bone,
    ),
    HUMAN_BODY_SIMPLE_POSTURE.compensation,
  ];
  const simple: IBodySimpleControlsHandle = renderBodySimpleControls({
    dom,
    container: element("simple-controls"),
    expand: props.simple.expand,
    project: props.simple.project,
    wholeSource: props.simple.wholeSource,
    current: (): IBodySimpleBody => ({
      shape: draft.shape,
      ...(draft.anatomy === undefined ? {} : { anatomy: draft.anatomy }),
    }),
    reserveIntent: withdraw,
    currentIntent: intents.currentTicket,
    isCurrentIntent: intents.isCurrent,
    // the simple body also stands in the posture its age implies: its rows
    // replace the standing joints' and keep every other joint's
    onApply: (
      shape: Record<string, number>,
      ticket: number,
      values: IAutoMovieHumanBodySimpleShape,
    ): void => {
      const posture: ReturnType<typeof humanBodySimplePosture> =
        humanBodySimplePosture(props.basis, values);
      void change(
        {
          ...structuredClone(draft),
          shape,
          pose: [
            ...(draft.pose ?? []).filter(
              (row: IAutoMovieJointPose): boolean =>
                !standing.includes(row.bone),
            ),
            ...posture,
          ],
        },
        ticket,
      );
    },
    onRefuse: refuse,
    onBusy: (text: string): void => status(text, "building"),
    onPreparing: (active: boolean): void =>
      setConnectedBodyPreparing(
        dom,
        "the simple-tier reader (whole person with the standard head)",
        active,
      ),
    onDraftChanged: (): void =>
      status("Simple body draft changed; apply again.", "ready"),
  });
  humeral.controls = renderBodyHumeralHeadControls({
    dom,
    container: element("humeral-head-controls"),
    current: (): IAutoMovieHumanBodyBasisDocument => draft,
    onChange: (next: IAutoMovieHumanBodyBasisDocument): void => {
      void change(next);
    },
    onRefuse: refuse,
  });
  renderBodyPosePresets({
    dom,
    container: element("pose-presets"),
    presets: props.poses,
    current: (): IAutoMovieHumanBodyBasisDocument => draft,
    standing,
    armsDown: viewport.armsDown,
    reserve: withdraw,
    isCurrent: intents.isCurrent,
    apply: (
      document: IAutoMovieHumanBodyBasisDocument,
      ticket: number,
    ): void => {
      void change(document, ticket);
    },
    refuse,
    busy: (text: string): void => status(text, "building"),
  });
  element("document-apply").onclick = (): void => {
    const ticket: number = withdraw();
    void applyText(element<HTMLTextAreaElement>("document-json").value, ticket);
  };
  element("body-save").onclick = (): void => {
    const document: IAutoMovieHumanBodyBasisDocument =
      editor!.snapshot().document;
    props.download(
      document.id + ".json",
      serializeHumanBodyBasisDocument(document, props.basis.anatomicalAssembly),
      "application/json",
    );
  };
  element("body-glb").onclick = async (): Promise<void> => {
    const state: ReturnType<NonNullable<typeof editor>["snapshot"]> =
      editor!.snapshot();
    const ticket: number = intents.currentTicket();
    try {
      const bytes: Uint8Array<ArrayBuffer> = await viewport.export(
        state.document,
      );
      if (intents.isCurrent(ticket) && editor!.snapshot().model === state.model)
        props.download(state.document.id + ".glb", bytes, "model/gltf-binary");
    } catch (error) {
      if (intents.isCurrent(ticket)) refuse(error);
    }
  };
  // Inspect combined shaped rests rather than assuming a neutral basis's
  // previous contact observation also holds for the current selected source.
  // The reading is absolute for the committed document: any entry is a
  // finding, and a segment named twice passes through itself.
  element("body-contacts").onclick = async (): Promise<void> => {
    const ticket: number = withdraw();
    status("Measuring which skin segments cross…", "building");
    try {
      const posed: Model = await viewport.build(
        editor!.snapshot().document,
        true,
        true,
      );
      const reading: Model["crossings"] = posed.crossings;
      const anatomy: string | null = bodyAnatomyReading(posed.anatomy ?? null);
      const femoral: string | null = bodyFemoralReading(posed.femoralHeads);
      const ground: string | null = bodyGroundReading(posed.groundSupport);
      await createAutoMovieResourceRetirement([
        (): void => viewport.dispose(posed),
        (): Promise<void> => settle(),
      ])();
      if (!intents.isCurrent(ticket)) return;
      const text: string | null = contacts.describe(reading);
      status(
        [
          text ?? "This build does not supply a crossing reading.",
          anatomy,
          femoral,
          ground,
        ]
          .filter((line: string | null): boolean => line !== null)
          .join("\n"),
        text === null ? "error" : "ready",
      );
    } catch (error) {
      if (intents.isCurrent(ticket)) refuse(error);
    }
  };
  element("body-load").onclick = (): void =>
    element<HTMLInputElement>("body-file").click();
  element<HTMLInputElement>("body-file").onchange = async (): Promise<void> => {
    const input: HTMLInputElement = element<HTMLInputElement>("body-file");
    const file: File | undefined = input.files?.[0];
    if (file === undefined) return;
    input.value = "";
    const ticket: number = withdraw();
    try {
      const text: string = await file.text();
      if (!intents.isCurrent(ticket)) return;
      await applyText(text, ticket);
    } catch (error) {
      if (intents.isCurrent(ticket)) refuse(error);
    }
  };
  const ready: Promise<void> = (async (): Promise<void> => {
    const ticket: number = intents.reserve();
    try {
      const model: Model = await viewport.build(props.initial);
      if (!intents.isCurrent(ticket)) {
        await createAutoMovieResourceRetirement([
          (): void => viewport.dispose(model),
          (): Promise<void> => settle(),
        ])();
        return;
      }
      editor = createHumanFaceEditor({
        document: props.initial,
        model,
        build: viewport.build,
        publish: viewport.publish,
        dispose: viewport.dispose,
      });
      viewport.publish(model);
      seatHead(model);
      viewport.fitView();
      element<HTMLFieldSetElement>("editing").disabled = false;
      refresh();
      await settle();
    } catch (error) {
      if (intents.isCurrent(ticket)) refuse(error);
    }
  })();
  const close: () => Promise<void> = createAutoMovieResourceRetirement([
    (): void => {
      closed = true;
      withdraw();
    },
    (): Promise<void> => contacts.close(),
    (): Promise<void> => viewport.close(),
    async (): Promise<void> => {
      await ready;
      editor = undefined;
      app.replaceChildren();
    },
  ]);
  return {
    ready,
    close,
    snapshot: ():
      | ReturnType<NonNullable<typeof editor>["snapshot"]>
      | undefined => editor?.snapshot(),
    change: (document: IAutoMovieHumanBodyBasisDocument): Promise<boolean> =>
      change(document),
    load: (text: string): Promise<void> => applyText(text),
  };
}
