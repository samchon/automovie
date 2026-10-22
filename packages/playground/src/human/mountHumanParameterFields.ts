/** Mount named scalar draft controls without generating or admitting a Human.
 * Values retain their public units. Measurements/diagnostics and schema/identity
 * are read-only; null remains explicit. Arrays retain their numeric addresses.
 * Applying the draft belongs to the sole viewer's existing server load path.
 * @evidence contracts/common.md#principled-implementation Controls edit a detached input JSON draft; only the owning viewer submits it to actual generator admission.
 * @evidence contracts/common.md#clear-and-simple-design This component owns only scalar DOM controls and their listener lifetime, never a scene or generator.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No default parameters, range guesses, unit conversions or local geometry are supplied.
 * @evidence contracts/common.md#meaningful-documentation States draft-only effects, readonly observations, null preservation and separate admission ownership.
 * @evidence contracts/performance.md#efficient-algorithms One bounded traversal rebuilds controls after an accepted input; editing serializes only the small parameter draft.
 * @evidence contracts/performance.md#reuse-equivalent-work Field edits reuse one detached draft and never regenerate until explicit apply through the owner.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One abort controller and at most ten thousand visited values belong to each refresh; refresh/dispose abort all previous listeners and release the old draft.
 */
export function mountHumanParameterFields(
  root: HTMLElement,
  onDraft: (value: unknown) => void,
): {
  refresh: (value: unknown) => void;
  dispose: () => void;
} {
  let events: AbortController = new AbortController();
  let closed: boolean = false;
  let draft: unknown;
  let visited: number = 0;
  return {
    refresh: (value: unknown): void => {
      if (closed) return;
      events.abort();
      events = new AbortController();
      root.replaceChildren();
      draft = JSON.parse(JSON.stringify(value));
      visited = 0;
      try {
        if (draft === null || typeof draft !== "object")
          throw new Error("Expected parameter object");
        fields(draft as Record<string, unknown>, [], root);
      } catch (error) {
        events.abort();
        root.textContent =
          "수치 편집 표시 실패. JSON 편집은 가능합니다: " + String(error);
      }
    },
    dispose: (): void => {
      closed = true;
      events.abort();
      draft = undefined;
      root.replaceChildren();
    },
  };

  /** Traverse actual public addresses, without inferred bilateral mirroring. */
  function fields(
    record: Record<string, unknown>,
    address: readonly string[],
    parent: HTMLElement,
  ): void {
    for (const [key, value] of Object.entries(record)) {
      if (++visited > 10000) throw new Error("Parameter field budget exceeded");
      const next: string[] = [...address, key];
      if (value !== null && typeof value === "object") {
        const group: HTMLDetailsElement = document.createElement("details");
        const title: HTMLElement = document.createElement("summary");
        title.textContent = next.join(".");
        group.append(title);
        fields(value as Record<string, unknown>, next, group);
        parent.append(group);
        continue;
      }
      if (
        !["number", "boolean", "string"].includes(typeof value) &&
        value !== null
      )
        continue;
      const label: HTMLLabelElement = document.createElement("label");
      label.append(next.join("."), " ");
      const input: HTMLInputElement = document.createElement("input");
      input.setAttribute("aria-label", next.join("."));
      input.disabled =
        next[0] === "schema" ||
        next[0] === "identity" ||
        (next[0] === "body" &&
          (next[1] === "measurements" || next[1] === "diagnostics"));
      if (typeof value === "number" || value === null) {
        input.type = "number";
        input.step = "any";
        input.value = value === null ? "" : String(value);
        input.addEventListener(
          "change",
          (): void => {
            if (
              input.value === "" &&
              (value === null ||
                (next[0] === "body" &&
                  next[1] === "controls" &&
                  key === "value"))
            )
              record[key] = null;
            else if (input.value !== "" && Number.isFinite(Number(input.value)))
              record[key] = Number(input.value);
            else {
              input.value = record[key] === null ? "" : String(record[key]);
              return;
            }
            onDraft(draft);
          },
          { signal: events.signal },
        );
      } else if (typeof value === "boolean") {
        input.type = "checkbox";
        input.checked = value;
        input.addEventListener(
          "change",
          (): void => {
            record[key] = input.checked;
            onDraft(draft);
          },
          { signal: events.signal },
        );
      } else {
        input.type = "text";
        input.value = String(value);
        input.addEventListener(
          "change",
          (): void => {
            record[key] = input.value;
            onDraft(draft);
          },
          { signal: events.signal },
        );
      }
      label.append(input);
      parent.append(label);
    }
  }
}
