import type { IAutoMovieHumanSurfaceMeasurements as M } from "@automovie/human";

/**
 * Mount the explicit physical-rest surface document editor on the ordinary page.
 * Applying uses the same session admission as saved JSON; refused edits retain
 * the previous visible generation. Missing anatomical charts stay visibly
 * partial and do not receive geometry from the previous cage route.
 *
 * @evidence contracts/common.md#principled-implementation Edits the public physical target document and delegates both generation and refusal to ordinary session admission.
 * @evidence contracts/common.md#clear-and-simple-design One fieldset owns source selection and physical JSON without creating a second scene or Human instance.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Supplies no generated measurements, reference controls, automatic clinical conversion or alternate geometry.
 * @evidence contracts/common.md#meaningful-documentation States partial status, admission and the retained-display failure effect.
 * @evidence contracts/performance.md#efficient-algorithms Parses only on explicit apply; refresh does not generate geometry.
 * @evidence contracts/performance.md#reuse-equivalent-work Session admission delegates coefficient reuse to the current Human's one-entry physical-document cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The owner disposes this fieldset and its two listeners on session replacement or page teardown.
 */
export function mountHumanSurfaceControls(props: {
  container: HTMLElement;
  initial?: M;
  diagnostics: readonly string[];
  selectSurface: (input: M | undefined) => boolean;
}): {dispose: () => void} {
  const field: HTMLFieldSetElement = document.createElement("fieldset");
  const legend: HTMLLegendElement = document.createElement("legend");
  legend.textContent = "같은 곡면에서 생성한 피부·구조선";
  const input: HTMLTextAreaElement = document.createElement("textarea");
  input.ariaLabel = "T 기본자세 외피의 물리 치수";
  input.value = props.initial === undefined ? "" : JSON.stringify(props.initial, null, 2);
  const apply: HTMLButtonElement = document.createElement("button");
  apply.type = "button";
  apply.textContent = "물리 치수로 외피 생성";
  const previous: HTMLButtonElement = document.createElement("button");
  previous.type = "button";
  previous.textContent = "기존 피부 경로 선택";
  const message: HTMLOutputElement = document.createElement("output");
  message.textContent = props.initial === undefined
    ? "새 외피: T 기본자세의 명시 치수 문서가 필요합니다. 임의 측정값은 채우지 않습니다."
    : "부분 생성 외피: " + props.diagnostics.join("; ");
  /** A refused edit leaves the current scene, with the page's original cause. */
  function submit(): void {
    try {
      const next: M = JSON.parse(input.value) as M;
      if (!props.selectSurface(next))
        message.textContent = "외피 입력 거부: 이전 유효 표시를 유지합니다. 오류 원인을 확인하세요.";
    } catch (cause: unknown) {
      message.textContent = "입력 거부: 이전 유효 표시 유지. " +
        (cause instanceof Error ? cause.message : String(cause));
    }
  }
  /** This is an explicit source change, never an automatic geometry fallback. */
  function choosePrevious(): void { props.selectSurface(undefined); }
  apply.addEventListener("click", submit);
  previous.addEventListener("click", choosePrevious);
  field.append(legend, input, apply, previous, message);
  props.container.append(field);
  return {dispose: (): void => {
    apply.removeEventListener("click", submit);
    previous.removeEventListener("click", choosePrevious);
    field.remove();
  }};
}
