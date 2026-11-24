/** Explicit native view selection, separate from the seven core presets and the legacy default. */
export namespace FamilyConicCaptureViews {
  /**
   * Native inspection adds top; legacy callers retain their original six-direction order.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Native capture requires top in addition to the existing six whole-figure directions.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One ordered literal list retains legacy order and appends top only for native capture.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The core camera preset inventory and legacy default outputs are unchanged.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant-size list construction uses constant work and space.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Figure, Deviation and source-only capture share this same native view plan.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns the returned list; no cache or resource survives.
   * @evidence contracts/development/common.md#meaningful-documentation The comment states legacy order and the native top addition.
   */
  export function whole(native: boolean): string[] {
    const legacy: string[] = [
      "front",
      "back",
      "left",
      "right",
      "high-oblique",
      "low-oblique",
    ];
    return native ? [...legacy, "top"] : legacy;
  }

  /**
   * Plan regional comparison directions from the requested views. A twin
   * exchanges left and right in the same plan. An underside is a below view.
   */
  export function comparison(
    zone: string,
    original: (zone: string) => string[],
  ): string[] {
    const name: string = zone.replace(/\.twin$/, "");
    if (name === "nose")
      return [
        "front",
        "left",
        "right",
        "high-oblique",
        "low-oblique",
        "low-oblique-other-side",
        "underside",
      ];
    const requested: string[] = original(name);
    const regions: readonly string[] = [
      "head", "hand", "foot", "shoulder", "ear", "neck", "hip", "chest",
    ];
    const planned: string[] = regions.includes(name)
      ? [...new Set([...requested, "front", "back", "left", "high-oblique", "low-oblique"])]
      : requested;
    return planned.map((view: string): string =>
      zone.endsWith(".twin")
        ? view === "left"
          ? "right"
          : view === "right"
            ? "left"
            : view
        : view,
    );
  }
}
