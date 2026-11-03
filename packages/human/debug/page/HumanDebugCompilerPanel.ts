import { HUMAN_DEBUG_ROUTES } from "../contracts/HUMAN_DEBUG_ROUTES";
import type { IHumanDebugCompilerState } from "../contracts/IHumanDebugCompilerState";

/**
 * A corner panel showing the separate type checker's latest cycle.
 *
 * The verdict is advisory: the page loads, generates and draws whatever the check says. The panel
 * reads the compiler route when the page loads and again whenever it is opened; nothing is pushed to
 * the page, which never refreshes by itself. It starts open while the cycle failed.
 */
export namespace HumanDebugCompilerPanel {
  /** Mount the panel until the page unloads. */
  export function mount(): void {
    const panel: HTMLDetailsElement = document.createElement("details");
    panel.id = "compiler";
    const label: HTMLElement = document.createElement("summary");
    const output: HTMLPreElement = document.createElement("pre");
    panel.append(label, output);
    document.body.append(panel);
    const show: (state: IHumanDebugCompilerState, open: boolean) => void = (state: IHumanDebugCompilerState, open: boolean): void => {
      label.textContent =
        "컴파일 " + ({ checking: "검사 중", passed: "통과", failed: "오류", unknown: "로그 없음" }[state.phase] ?? state.phase);
      output.textContent = state.output;
      if (open) panel.open = state.phase === "failed";
      panel.dataset.phase = state.phase;
    };
    const read: (open: boolean) => void = (open: boolean): void =>
      void fetch(HUMAN_DEBUG_ROUTES.compiler, { cache: "no-store" })
        .then((response: Response): Promise<IHumanDebugCompilerState> => response.json())
        .then((state: IHumanDebugCompilerState): void => show(state, open))
        .catch((error: unknown): void => show({ phase: "unknown", output: String(error), log: "", cycle: null }, open));
    read(true);
    panel.addEventListener("toggle", (): void => {
      if (panel.open) read(false);
    });
  }
}
