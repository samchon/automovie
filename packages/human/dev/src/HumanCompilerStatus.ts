/** Show incremental compile diagnostics independently from geometry generation. */
export namespace HumanCompilerStatus {
  /** Latest observed compiler phase; an unobserved checker never admits work. */
  let phase: string = "unknown";

  /** Join the native current-source barrier before generating or accepting a model. */
  export async function requirePassed(): Promise<string> {
    const response: Response = await fetch("/__human/compiler/admit", {
      cache: "no-store",
    });
    const verdict: { phase: string; sourceSha256?: string; error?: string } =
      await response.json();
    phase = verdict.phase;
    if (
      !response.ok ||
      phase !== "passed" ||
      typeof verdict.sourceSha256 !== "string"
    )
      throw new Error(
        verdict.error ?? "Human compiler has no passing current-source verdict",
      );
    return verdict.sourceSha256;
  }

  /** Synchronous draws also reject an observed checking or failed checker. */
  export function assertPassed(): void {
    if (phase !== "passed")
      throw new Error("Human compiler is checking or failed");
  }
  /** Bind one status panel until the development page is unloaded. */
  export function mount(): void {
    const panel: HTMLDetailsElement = document.createElement("details");
    panel.style.cssText =
      "position:fixed;bottom:48px;right:12px;z-index:10000;max-width:70vw;max-height:50vh;overflow:auto;background:#fff;border:1px solid #aab7c8;border-radius:6px;padding:6px 10px;font:12px monospace";
    const label: HTMLElement = document.createElement("summary");
    const output: HTMLPreElement = document.createElement("pre");
    output.style.whiteSpace = "pre-wrap";
    panel.append(label, output);
    document.body.append(panel);

    /** Paint the checker's actual current cycle, including failed diagnostics. */
    const show: (state: {
      phase: string;
      output: string;
      sequence: number;
    }) => void = (state: {
      phase: string;
      output: string;
      sequence: number;
    }): void => {
      phase = state.phase;
      label.textContent =
        "컴파일 " +
        ({ checking: "검사 중", passed: "통과", failed: "오류" }[state.phase] ??
          state.phase) +
        " · " +
        state.sequence;
      output.textContent = state.output;
      panel.open = state.phase === "failed";
      label.style.color = state.phase === "failed" ? "#a12b24" : "#245b92";
    };
    void fetch("/__human/compiler")
      .then(
        (
          response: Response,
        ): Promise<{ phase: string; output: string; sequence: number }> =>
          response.json(),
      )
      .then(show)
      .catch((error: unknown): void => {
        show({ phase: "failed", output: String(error), sequence: 0 });
      });
    import.meta.hot?.on("human:compiler", show);
    window.addEventListener(
      "pagehide",
      (): void => {
        import.meta.hot?.off("human:compiler", show);
        panel.remove();
      },
      { once: true },
    );
  }
}
