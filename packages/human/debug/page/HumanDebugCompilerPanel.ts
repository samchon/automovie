import { HUMAN_DEBUG_ROUTES } from "../contracts/HUMAN_DEBUG_ROUTES";
import type { IHumanDebugCompilerState } from "../contracts/IHumanDebugCompilerState";

/**
 * A corner panel showing the separate type checker's latest cycle, and the read the page gates on.
 *
 * The page generates only on a passed cycle (`read`); until then it shows the compiler's messages.
 * The panel reads the compiler route when the page loads and again whenever it is opened, and it
 * starts open while the cycle failed.
 */
export namespace HumanDebugCompilerPanel {
  /**
   * Read the compile collector's latest cycle.
   *
   * @returns The cycle; an unreachable route is `unknown` with the reason as its output.
   */
  export async function read(): Promise<IHumanDebugCompilerState> {
    try {
      const response: Response = await fetch(HUMAN_DEBUG_ROUTES.compiler, { cache: "no-store" });
      return (await response.json()) as IHumanDebugCompilerState;
    } catch (error) {
      return { phase: "unknown", output: String(error), log: "", cycle: null };
    }
  }

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
    const refresh: (open: boolean) => void = (open: boolean): void =>
      void read().then((state: IHumanDebugCompilerState): void => show(state, open));
    refresh(true);
    panel.addEventListener("toggle", (): void => {
      if (panel.open) refresh(false);
    });
  }
}
