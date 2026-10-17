import type {
  IAutoMovieHumanConstructionNet,
  IAutoMovieHumanCurveSupplement,
  inspectAutoMovieHumanCurveDesign as Inspect,
} from "@automovie/human";

import { HumanCurveDesignInspectionState } from "./HumanCurveDesignInspectionState";
import type { IHumanViewerSession } from "./IHumanViewerSession";

/** Mount the visible inspection selector and editable saved physical supplement.
 * The existing page renders supplied nets with its existing drawer/disposal.
 * Capture reads the same state metadata, including the saved control-polygon
 * visibility. Hiding controls changes drawing only, retaining the same curves.
 * No renderer, hidden capture override,
 * source-reference loader or surface generator is created here.
 *
 * @evidence contracts/common.md#principled-implementation Submits named physical measurements and explicit representation to the admitted Human callback and displays structured refusal without changing identity.
 * @evidence contracts/common.md#clear-and-simple-design Visible selectors, physical JSON editor, comparison checkbox and capture metadata share one inspection state.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The representation is explicit and defaults to external R6b; the new pants route is labeled unapproved rather than silently replacing the old route.
 * @evidence contracts/common.md#meaningful-documentation States the drawing owner, the independent existing surface and the saved physical supplement.
 * @evidence contracts/performance.md#efficient-algorithms Only explicit apply or representation change requests generation; ordinary refresh reuses cached state.
 * @evidence contracts/performance.md#reuse-equivalent-work The editor retains the previous valid design through failed edits and source switching.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned disposer removes every acquired editor listener and DOM element; the page disposes replaced editors.

 */
export function mountHumanCurveDesignControls(props: {
  container: HTMLElement;
  identityKey: string;
  inspect: (props: {
    detailed?: IAutoMovieHumanCurveSupplement;
    pelvisRepresentation?: "external-r6b" | "pants-r6";
  }) => Inspect.Result;
  currentSkin: () => IAutoMovieHumanConstructionNet[];
  show: (
    display: ReturnType<HumanCurveDesignInspectionState["display"]>,
  ) => void;
  initialDetailed?: IAutoMovieHumanCurveSupplement;
  initialSource?: "current-skin" | "curve-design";
  initialCompare?: boolean;
  initialShowControlPoints?: boolean;
  initialPelvisRepresentation?: "external-r6b" | "pants-r6";
  onChange?: (
    selection: NonNullable<IHumanViewerSession["curveDesign"]>,
  ) => void;
}): {
  captureMetadata: () => Record<string, unknown>;
  savedDetailed: () => IAutoMovieHumanCurveSupplement | null;
  refresh: () => void;
  dispose: () => void;
} {
  const state: HumanCurveDesignInspectionState =
    new HumanCurveDesignInspectionState(props.identityKey);
  const select: HTMLSelectElement = document.createElement("select");
  select.ariaLabel = "구조선 출처";
  for (const [value, label] of [
    ["current-skin", "기존 피부 생성 구조선"],
    ["curve-design", "새 중립 곡선 설계"],
  ] as const) {
    const option: HTMLOptionElement = document.createElement("option");
    option.value = value;
    option.textContent = label;
    select.append(option);
  }
  const input: HTMLTextAreaElement = document.createElement("textarea");
  const representation: HTMLSelectElement = document.createElement("select");
  representation.ariaLabel = "골반 곡선 표현";
  for (const [value, label] of [
    ["external-r6b", "기존 외곽 R6b 곡선"],
    ["pants-r6", "새 골반 R6 후보 (형상 검토 전)"],
  ] as const) {
    const option: HTMLOptionElement = document.createElement("option");
    option.value = value;
    option.textContent = label;
    representation.append(option);
  }
  representation.value = props.initialPelvisRepresentation ?? "external-r6b";
  input.ariaLabel = "곡선 생성용 실제 측정 치수";
  input.value =
    props.initialDetailed === undefined
      ? ""
      : JSON.stringify(props.initialDetailed, null, 2);
  const apply: HTMLButtonElement = document.createElement("button");
  apply.textContent = "측정 치수 적용";
  const compareLabel: HTMLLabelElement = document.createElement("label");
  const compare: HTMLInputElement = document.createElement("input");
  compare.type = "checkbox";
  compare.checked = props.initialCompare ?? false;
  select.value = props.initialSource ?? "current-skin";
  state.select(select.value as "current-skin" | "curve-design");
  compareLabel.append(compare, " 별도로 생성된 기존 피부 함께 보기");
  const message: HTMLOutputElement = document.createElement("output");
  const controlsLabel: HTMLLabelElement = document.createElement("label");
  const controls: HTMLInputElement = document.createElement("input");
  controls.type = "checkbox";
  controls.checked = props.initialShowControlPoints ?? true;
  controls.ariaLabel = "제어점·제어다각형 표시";
  controlsLabel.append(controls, " 제어점·제어다각형 표시");
  const metadata: () => Record<string, unknown> = (): Record<
    string,
    unknown
  > => ({
    ...state.metadata(compare.checked),
    requestedPelvisRepresentation: representation.value,
    showControlPoints: controls.checked,
    candidateQualification:
      representation.value === "pants-r6"
        ? "New geometry epoch; author form correction and complete self-review remain pending."
        : "Existing external R6b design route; independent skin is unchanged.",
  });
  const display: () => ReturnType<typeof state.display> = (): ReturnType<
    typeof state.display
  > => ({
    ...state.display(props.currentSkin, compare.checked),
    metadata: metadata(),
  });
  const show: () => void = (): void => {
    const current: ReturnType<typeof display> = display();
    message.textContent =
      current.label +
      (current.findings.length
        ? ": " +
          current.findings
            .map(
              (finding: Inspect.Finding): string =>
                finding.path + " " + finding.message,
            )
            .join("; ")
        : "");
    props.show(current);
    const detailed: IAutoMovieHumanCurveSupplement | null =
      state.savedDetailed();
    props.onChange?.({
      source: select.value as "current-skin" | "curve-design",
      ...(detailed === null ? {} : { detailed }),
      compareExistingSurface: compare.checked,
      showControlPoints: controls.checked,
      pelvisRepresentation: representation.value as "external-r6b" | "pants-r6",
    });
  };
  const choose: () => void = (): void => {
    state.select(select.value as "current-skin" | "curve-design");
    if (select.value === "curve-design" && state.savedDetailed() === null)
      update();
    else show();
  };
  const update: () => void = (): void => {
    try {
      const detailed: IAutoMovieHumanCurveSupplement | undefined =
        input.value.trim() === ""
          ? undefined
          : (JSON.parse(input.value) as IAutoMovieHumanCurveSupplement);
      state.update(
        props.inspect({
          detailed,
          pelvisRepresentation: representation.value as
            | "external-r6b"
            | "pants-r6",
        }),
      );
    } catch (cause: unknown) {
      state.update({
        status: "invalid-measurements",
        identityValidity: "unchanged",
        findings: [
          {
            path: "$detailed",
            kind: "invalid",
            message: cause instanceof Error ? cause.message : String(cause),
          },
        ],
      });
    }
    show();
  };
  select.addEventListener("change", choose);
  compare.addEventListener("change", show);
  controls.addEventListener("change", show);
  apply.addEventListener("click", update);
  representation.addEventListener("change", update);
  props.container.append(
    select,
    representation,
    input,
    apply,
    compareLabel,
    controlsLabel,
    message,
  );
  if (props.initialDetailed !== undefined || select.value === "curve-design")
    update();
  else show();
  return {
    refresh: show,
    captureMetadata: metadata,
    savedDetailed: (): IAutoMovieHumanCurveSupplement | null =>
      state.savedDetailed(),
    dispose: (): void => {
      select.removeEventListener("change", choose);
      compare.removeEventListener("change", show);
      controls.removeEventListener("change", show);
      apply.removeEventListener("click", update);
      representation.removeEventListener("change", update);
      for (const element of [
        select,
        representation,
        input,
        apply,
        compareLabel,
        controlsLabel,
        message,
      ])
        element.remove();
    },
  };
}
