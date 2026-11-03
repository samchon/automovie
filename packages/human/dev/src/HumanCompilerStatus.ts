/** Show incremental compile diagnostics independently from geometry generation.
 * The diagnostics are advisory: generation and capture never wait on them.
 */
export namespace HumanCompilerStatus {
  /** Hash the current source inventory so a model records what it reflects. */
  export async function currentSource(): Promise<string> {
    const response: Response = await fetch("/__human/compiler/source", {
      cache: "no-store",
    });
    const value: { sourceSha256?: string; error?: string } =
      await response.json();
    if (!response.ok || typeof value.sourceSha256 !== "string")
      throw new Error(value.error ?? "Human source hash is unavailable");
    return value.sourceSha256;
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
