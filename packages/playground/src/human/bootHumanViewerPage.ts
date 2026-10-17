import { IAutoMovieHumanTraits } from "@automovie/human";

import type { HumanViewerPage } from "./HumanViewerPage";
import { IHumanViewerSession } from "./IHumanViewerSession";
import { IHumanViewerTextureState } from "./IHumanViewerTextureState";
import { hashHumanViewerSession } from "./hashHumanViewerSession";
import { lightHumanViewer } from "./lightHumanViewer";

/** Surface/construction composition selected by the page. */
type DisplayMode = HumanViewerPage.DisplayMode;

/** Mount persistence and the automation API after page operations are installed.
 * Loading and controls use the same admitted Human, scene and capture path.
 *
 * @evidence contracts/common.md#principled-implementation Loads through ordinary public session admission and publishes existing operations.
 * @evidence contracts/common.md#clear-and-simple-design Boot owns document controls and API publication; rendering stays in its installed module.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No capture-only model, fixture or renderer is created.
 * @evidence contracts/common.md#meaningful-documentation States installation order and shared operation ownership.
 * @evidence contracts/performance.md#efficient-algorithms Reads one session and mounts one control set.
 * @evidence contracts/performance.md#reuse-equivalent-work Interactive and automation paths share the admitted Human.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The page releases controls and its API on disposal.
 */
export function bootHumanViewerPage(page: HumanViewerPage): void {
  const open: HTMLInputElement = document.createElement("input");
  open.type = "file";
  open.accept = "application/json,.json";
  open.addEventListener("change", (): void => {
    const file: File | undefined = open.files?.[0];
    if (file === undefined) return;
    file
      .text()
      .then((text: string): void => {
        page.accept(
          JSON.parse(text) as IHumanViewerSession,
          `Resumed ${file.name}.`,
        );
      })
      .catch(page.error);
    open.value = "";
  });
  page.mount(
    "#session",
    page.button("Save", page.save),
    open,
    page.button("Reset to default", (): void => {
      page.accept(
        page.sessionFromTraits(page.DEFAULT_TRAITS),
        "Reset to the default person.",
      );
    }),
  );
  // ── boot ────────────────────────────────────────────────────────────────────
  const stored: string | null = localStorage.getItem(page.STORAGE_KEY);
  let resumed: boolean = false;
  if (stored !== null) {
    try {
      resumed = page.accept(
        JSON.parse(stored) as IHumanViewerSession,
        "Resumed the saved session from local storage.",
      );
    } catch (cause) {
      page.error(cause);
    }
  }
  if (!resumed)
    page.accept(
      page.sessionFromTraits(page.DEFAULT_TRAITS),
      "Showing the default person.",
    );
  page.traitsDraft = structuredClone(page.current!.session.traits);
  page.renderPanels();
  page.resize();
  page.frame();
  (
    window as unknown as {
      __automovieHuman: unknown;
    }
  ).__automovieHuman = {
    renderer: page.rendererName,
    frames: (): number => page.frames,
    session: (): IHumanViewerSession => structuredClone(page.current.session),
    hash: (): Promise<string> => hashHumanViewerSession(page.current.session),
    load: (session: IHumanViewerSession): boolean =>
      page.accept(session, "Loaded a session."),
    loadTraits: (props: {
      traits: IAutoMovieHumanTraits;
      statureScale?: number;
    }): boolean => {
      try {
        const traits: IAutoMovieHumanTraits = structuredClone(props.traits);
        if (props.statureScale !== undefined)
          traits.stature =
            page.sessionFromTraits({ ...traits, stature: null }).identity.body
              .stature * props.statureScale;
        page.traitsDraft = traits;
        return page.accept(page.sessionFromTraits(traits), "Loaded traits.");
      } catch (cause) {
        page.error(cause);
        return false;
      }
    },
    error: (): string => document.querySelector("#error")!.textContent ?? "",
    textures: (): IHumanViewerTextureState => page.observeTextures(),
    save: page.save,
    setHidden: (ids: string[]): void => {
      page.hidden.clear();
      for (const id of ids) page.hidden.add(id);
      page.applyVisibility();
      page.renderParts();
    },
    setHand: (next: "profile" | "paddle"): boolean => {
      page.hand = next;
      return page.accept(page.current.session, `Hand: ${next}.`);
    },
    setStick: (next: boolean): void => {
      page.showStick = next;
      page.applyVisibility();
    },
    setRelief: (next: boolean): void => {
      page.relief = next;
      page.applyRelief();
    },
    setDisplay: (next: DisplayMode): void => {
      page.displayMode = next;
      page.applyDisplayMode();
    },
    setAssembly: (next: "parts" | "joined"): boolean => {
      page.assembly = next;
      return page.accept(page.current.session, `Skin: ${next}.`);
    },
    parts: (): string[] =>
      page.current.model.parts.map((p: { id: string }): string => p.id),
    setLight: (next: lightHumanViewer.ILight | "raking" | null): boolean => {
      page.pageLight =
        next === "raking"
          ? { ...lightHumanViewer.PRESETS.raking }
          : next === null
            ? null
            : { ...next };
      return page.frame();
    },
    setView: (next: Partial<typeof page.view>): boolean => {
      page.view = { ...page.view, ...next };
      return page.frame();
    },
    capture: page.capture,
  };
}
