import {
  IAutoMovieHumanAppearance,
  IAutoMovieHumanExpression,
  IAutoMovieHumanIdentity,
  IAutoMovieHumanPose,
  IAutoMovieHumanTraits,
} from "@automovie/human";
import { AutoMovieHumanoidBone } from "@automovie/interface";

import { HUMAN_VIEWER_CHOICES } from "./HUMAN_VIEWER_CHOICES";
import type { HumanViewerPage } from "./HumanViewerPage";
import { IHumanViewerSession } from "./IHumanViewerSession";
import { createHumanViewerDocumentForm } from "./createHumanViewerDocumentForm";
import { createHumanViewerExpressionEditor } from "./createHumanViewerExpressionEditor";
import { createHumanViewerPoseEditor } from "./createHumanViewerPoseEditor";
import { frameHumanViewerCamera } from "./frameHumanViewerCamera";
import { humanViewerPartIds } from "./humanViewerPartIds";

/** Framing scale owned by the Human page. */
type Scale = HumanViewerPage.Scale;

/** Surface/construction composition selected by the page. */
type DisplayMode = HumanViewerPage.DisplayMode;

/** Install document editors, part isolation, and view controls.
 *
 * @evidence contracts/common.md#principled-implementation Each edit is admitted through the same session path and each visibility edit updates current scene parts.
 * @evidence contracts/common.md#clear-and-simple-design Document controls are separate from session admission and rendering.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses the admitted public documents and the same live page instances; no fixture or capture-only geometry is substituted.
 * @evidence contracts/common.md#meaningful-documentation Describes the module's page responsibility and ownership boundary.
 * @evidence contracts/performance.md#efficient-algorithms Panel rebuild is linear in document fields, skeleton bones and model parts.
 * @evidence contracts/performance.md#reuse-equivalent-work Session identity controls Human reuse; edits and captures use the current accepted state rather than a second model.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Replacing panel DOM releases detached listeners; the page separately disposes mounted curve controls.
 */
export function installHumanViewerPanels(page: HumanViewerPage): void {
  // ── panels ──────────────────────────────────────────────────────────────────
  function button(label: string, onClick: () => void): HTMLButtonElement {
    const b: HTMLButtonElement = document.createElement("button");
    b.type = "button";
    b.textContent = label;
    b.addEventListener("click", onClick);
    return b;
  }
  page.button = button;

  /** mount updates the page through its owning module. */
  function mount(selector: string, ...children: HTMLElement[]): void {
    document.querySelector(selector)!.replaceChildren(...children);
  }
  page.mount = mount;

  /** withDocument updates the page through its owning module. */
  function withDocument<
    K extends "identity" | "pose" | "expression" | "appearance",
  >(key: K, value: IHumanViewerSession[K]): void {
    page.accept(
      { ...page.current.session, [key]: value },
      `Updated the ${key}.`,
    );
  }
  page.withDocument = withDocument;

  /** renderViews updates the page through its owning module. */
  function renderViews(): void {
    const presets: HTMLDivElement = document.createElement("div");
    presets.className = "row";
    for (const v of frameHumanViewerCamera.VIEWS)
      presets.appendChild(
        page.button(v, (): void => {
          page.view = { ...page.view, view: v };
          page.frame();
        }),
      );
    const scale: HTMLSelectElement = document.createElement("select");
    scale.add(new Option("whole body", "whole"));
    scale.add(new Option("close (focus bone)", "close"));
    scale.value = page.view.scale;
    scale.addEventListener("change", (): void => {
      page.view = { ...page.view, scale: scale.value as Scale };
      page.frame();
    });
    const focus: HTMLSelectElement = document.createElement("select");
    for (const b of page.current.skeleton.bones)
      focus.add(new Option(b.bone, b.bone));
    focus.value = page.view.focus;
    focus.addEventListener("change", (): void => {
      page.view = { ...page.view, focus: focus.value as AutoMovieHumanoidBone };
      page.frame();
    });
    const bones: HTMLLabelElement = document.createElement("label");
    const check: HTMLInputElement = document.createElement("input");
    check.type = "checkbox";
    check.checked = page.showBones;
    check.addEventListener("change", (): void => {
      page.showBones = check.checked;
      page.show(page.current);
    });
    bones.append(check, " bone lines");
    const sticks: HTMLLabelElement = document.createElement("label");
    const stickCheck: HTMLInputElement = document.createElement("input");
    stickCheck.type = "checkbox";
    stickCheck.checked = page.showStick;
    stickCheck.addEventListener("change", (): void => {
      page.showStick = stickCheck.checked;
      page.applyVisibility();
    });
    sticks.append(stickCheck, " stick figure");
    const name: HTMLInputElement = document.createElement("input");
    name.value = "human";
    name.title = "Capture name, the prefix of every file";
    const run: HTMLButtonElement = page.button("Capture presets", (): void => {
      run.disabled = true;
      page
        .capture({ name: name.value })
        .then((r: { files: string[]; metadata: string }): void =>
          page.status(
            `Captured ${r.files.length} views; metadata ${r.metadata}`,
          ),
        )
        .catch(page.error)
        .finally((): void => {
          run.disabled = false;
        });
    });
    const skin: HTMLSelectElement = document.createElement("select");
    skin.add(new Option("parts alone", "parts"));
    skin.add(new Option("joined skin", "joined"));
    skin.value = page.assembly;
    skin.addEventListener("change", (): void => {
      page.assembly = skin.value as typeof page.assembly;
      page.accept(page.current.session, `Skin: ${skin.value}.`);
    });
    const hands: HTMLSelectElement = document.createElement("select");
    hands.add(new Option("profile hand", "profile"));
    hands.add(new Option("paddle hand (swap)", "paddle"));
    hands.value = page.hand;
    hands.addEventListener("change", (): void => {
      page.hand = hands.value as typeof page.hand;
      page.accept(page.current.session, `Hand: ${hands.value}.`);
    });
    const shown: HTMLSelectElement = document.createElement("select");
    for (const mode of page.DISPLAY_MODES) shown.add(new Option(mode, mode));
    shown.value = page.displayMode;
    shown.addEventListener("change", (): void => {
      page.displayMode = shown.value as DisplayMode;
      page.applyDisplayMode();
    });
    const row: HTMLDivElement = document.createElement("div");
    row.className = "row";
    const fine: HTMLSelectElement = document.createElement("select");
    fine.add(new Option("skin relief", "on"));
    fine.add(new Option("no skin relief (form)", "off"));
    fine.value = page.relief ? "on" : "off";
    fine.addEventListener("change", (): void => {
      page.relief = fine.value === "on";
      page.applyRelief();
    });
    row.append(scale, focus, skin, hands, shown, fine, bones, sticks);
    const captureRow: HTMLDivElement = document.createElement("div");
    captureRow.className = "row";
    captureRow.append(name, run);
    const renderer: HTMLDivElement = document.createElement("div");
    renderer.textContent = `WebGL: ${page.rendererName}`;
    page.mount("#views", presets, row, captureRow, renderer);
  }
  page.renderViews = renderViews;

  /** renderParts updates the page through its owning module. */
  function renderParts(): void {
    if (page.object === null) return;
    const list: HTMLDivElement = document.createElement("div");
    list.className = "parts";
    const filter: HTMLInputElement = document.createElement("input");
    filter.placeholder = "filter part ids";
    const matching: () => string[] = (): string[] =>
      humanViewerPartIds(page).filter((id: string): boolean =>
        id.includes(filter.value.trim()),
      );
    const fill: () => void = (): void => {
      list.replaceChildren();
      for (const id of matching()) {
        const label: HTMLLabelElement = document.createElement("label");
        const box: HTMLInputElement = document.createElement("input");
        box.type = "checkbox";
        box.checked = !page.hidden.has(id);
        box.addEventListener("change", (): void => {
          if (box.checked) page.hidden.delete(id);
          else page.hidden.add(id);
          page.applyVisibility();
        });
        label.append(box, ` ${id}`);
        list.appendChild(label);
      }
    };
    filter.addEventListener("input", fill);
    const set: (show: (id: string) => boolean) => void = (
      show: (id: string) => boolean,
    ): void => {
      for (const id of humanViewerPartIds(page))
        if (show(id)) page.hidden.delete(id);
        else page.hidden.add(id);
      page.applyVisibility();
      fill();
    };
    const row: HTMLDivElement = document.createElement("div");
    row.className = "row";
    row.append(
      page.button("all", (): void => set((): boolean => true)),
      page.button("none", (): void => set((): boolean => false)),
      page.button("only matching", (): void => {
        const keep: Set<string> = new Set(matching());
        set((id: string): boolean => keep.has(id));
      }),
    );
    fill();
    page.mount("#parts", filter, row, list);
  }
  page.renderParts = renderParts;

  /** renderPanels updates the page through its owning module. */
  function renderPanels(): void {
    const s: IHumanViewerSession = page.current.session;
    page.renderViews();
    page.renderParts();
    const convert: HTMLButtonElement = page.button(
      "Convert traits",
      (): void => {
        try {
          page.accept(
            page.sessionFromTraits(page.traitsDraft, s),
            "Converted the traits into identity and appearance.",
          );
        } catch (cause) {
          page.error(cause);
        }
      },
    );
    page.mount(
      "#traits",
      createHumanViewerDocumentForm<IAutoMovieHumanTraits>({
        document: page.traitsDraft,
        spec: {
          hidden: ["version"],
          nullable: ["stature"],
          choices: {
            sex: HUMAN_VIEWER_CHOICES.sex,
            population: HUMAN_VIEWER_CHOICES.population,
          },
        },
        onChange: (t: IAutoMovieHumanTraits): void => {
          page.traitsDraft = t;
          page.renderPanels();
        },
      }),
      convert,
    );
    page.mount(
      "#identity",
      createHumanViewerDocumentForm<IAutoMovieHumanIdentity>({
        document: s.identity,
        spec: {
          hidden: ["version"],
          choices: { "pigmentation.iris": HUMAN_VIEWER_CHOICES.iris },
        },
        onChange: (d: IAutoMovieHumanIdentity): void =>
          page.withDocument("identity", d),
      }),
    );
    page.mount(
      "#pose",
      createHumanViewerPoseEditor({
        skeleton: page.current.skeleton,
        pose: s.pose,
        onChange: (d: IAutoMovieHumanPose): void =>
          page.withDocument("pose", d),
      }),
    );
    page.mount(
      "#expression",
      createHumanViewerExpressionEditor({
        units: HUMAN_VIEWER_CHOICES.actionUnits,
        expression: s.expression,
        onChange: (d: IAutoMovieHumanExpression): void =>
          page.withDocument("expression", d),
      }),
    );
    type Wear = IAutoMovieHumanAppearance.IUnderwear;
    const style: (
      label: string,
      bottom: Wear["bottom"],
      top: Wear["top"],
    ) => createHumanViewerDocumentForm.IStyleOption<IAutoMovieHumanAppearance> = (
      label: string,
      bottom: Wear["bottom"],
      top: Wear["top"],
    ): createHumanViewerDocumentForm.IStyleOption<IAutoMovieHumanAppearance> => ({
      label,
      matches: (a: IAutoMovieHumanAppearance): boolean =>
        a.underwear.bottom === bottom && a.underwear.top === top,
      apply: (a: IAutoMovieHumanAppearance): IAutoMovieHumanAppearance => ({
        ...a,
        underwear: { ...a.underwear, bottom, top },
      }),
    });
    page.mount(
      "#appearance",
      createHumanViewerDocumentForm<IAutoMovieHumanAppearance>({
        document: s.appearance,
        spec: {
          hidden: ["version"],
          colors: ["underwear.color"],
          choices: {
            "hair.style": HUMAN_VIEWER_CHOICES.hairStyle,
            "hair.color": HUMAN_VIEWER_CHOICES.hairColor,
            "hair.curl": HUMAN_VIEWER_CHOICES.curl,
            "hair.hairline": HUMAN_VIEWER_CHOICES.hairline,
            "brows.color": HUMAN_VIEWER_CHOICES.hairColor,
            "lashes.color": HUMAN_VIEWER_CHOICES.hairColor,
          },
          styles: {
            "underwear.bottom": {
              label: "underwear style",
              covers: ["underwear.bottom", "underwear.top"],
              options: [
                style("briefs", "briefs", "none"),
                style("boxer briefs", "boxerBriefs", "none"),
                style("briefs and bra", "briefs", "bra"),
                style("boxer briefs and bra", "boxerBriefs", "bra"),
              ],
            },
          },
        },
        onChange: (d: IAutoMovieHumanAppearance): void =>
          page.withDocument("appearance", d),
      }),
    );
    const text: HTMLTextAreaElement = document.createElement("textarea");
    text.value = JSON.stringify(s, null, 2);
    page.mount(
      "#json",
      text,
      page.button("Apply JSON", (): void => {
        try {
          page.accept(
            JSON.parse(text.value) as IHumanViewerSession,
            "Applied the JSON documents.",
          );
        } catch (cause) {
          page.error(cause);
        }
      }),
    );
  }
  page.renderPanels = renderPanels;
}
