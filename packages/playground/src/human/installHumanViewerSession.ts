import {
  AutoMovieHuman,
  AutoMovieHumanAdmissionError,
  IAutoMovieHumanTraits,
  validateAutoMovieHumanAppearance,
  validateAutoMovieHumanIdentity,
} from "@automovie/human";
import { IAutoMovieExpression, IAutoMoviePose } from "@automovie/interface";

import { HumanViewerPaddleHandGenerator } from "./HumanViewerPaddleHandGenerator";
import type { HumanViewerPage } from "./HumanViewerPage";
import { IHumanViewerSession } from "./IHumanViewerSession";
import { hashHumanViewerSession } from "./hashHumanViewerSession";
import { keyHumanViewerIdentity } from "./keyHumanViewerIdentity";

/** Accepted documents and their reusable Human instance. */
type IAccepted = HumanViewerPage.IAccepted;

/** Install session admission and persistence on one page. Refused documents preserve the last accepted specimen.
 *
 * @evidence contracts/common.md#principled-implementation Validates public documents before obtaining the display model; equality of admitted identity and hand generator permits Human reuse.
 * @evidence contracts/common.md#clear-and-simple-design Session admission owns documents, while the display and panels own their effects.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses the admitted public documents and the same live page instances; no fixture or capture-only geometry is substituted.
 * @evidence contracts/common.md#meaningful-documentation Describes the module's page responsibility and ownership boundary.
 * @evidence contracts/performance.md#efficient-algorithms Admission follows Human validation and model construction; serialization is linear in the saved document.
 * @evidence contracts/performance.md#reuse-equivalent-work Session identity controls Human reuse; edits and captures use the current accepted state rather than a second model.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The page retains one accepted Human and replaces it only after successful admission.
 */
export function installHumanViewerSession(page: HumanViewerPage): void {
  /** Convert traits into a session, keeping the given pose and expression. */
  function sessionFromTraits(
    traits: IAutoMovieHumanTraits,
    keep?: Pick<IHumanViewerSession, "pose" | "expression">,
  ): IHumanViewerSession {
    return {
      format: "automovie-human-session",
      version: 1,
      traits: structuredClone(traits),
      identity: AutoMovieHuman.fromTraits({
        id: page.MODEL_ID,
        traits,
        converter: page.converter,
      }).getIdentity(),
      pose: structuredClone(keep?.pose ?? { version: 1, joints: [] }),
      expression: structuredClone(
        keep?.expression ?? { version: 1, units: [] },
      ),
      appearance: page.converter.toAppearance(traits),
    };
  }
  page.sessionFromTraits = sessionFromTraits;

  /** Admit every document of a session; throws the package's refusal unchanged. */
  function admit(session: IHumanViewerSession): IAccepted {
    if (
      session === null ||
      typeof session !== "object" ||
      session.format !== "automovie-human-session" ||
      session.version !== 1
    )
      throw new Error(
        "Not a Human session: expected format automovie-human-session, version 1.",
      );
    if (
      session.curveDesign !== undefined &&
      (session.curveDesign === null ||
        typeof session.curveDesign !== "object" ||
        !["current-skin", "curve-design"].includes(
          session.curveDesign.source,
        ) ||
        typeof session.curveDesign.compareExistingSurface !== "boolean" ||
        (session.curveDesign.showControlPoints !== undefined &&
          typeof session.curveDesign.showControlPoints !== "boolean") ||
        (session.curveDesign.pelvisRepresentation !== undefined &&
          !["external-r6b", "pants-r6"].includes(
            session.curveDesign.pelvisRepresentation,
          )))
    )
      throw new Error("Invalid curve inspection session state.");
    const appearance: ReturnType<typeof validateAutoMovieHumanAppearance> =
      validateAutoMovieHumanAppearance(session.appearance);
    if (!appearance.success)
      throw new AutoMovieHumanAdmissionError("appearance", appearance.errors);
    const identity: ReturnType<typeof validateAutoMovieHumanIdentity> =
      validateAutoMovieHumanIdentity(session.identity);
    if (!identity.success)
      throw new AutoMovieHumanAdmissionError("identity", identity.errors);
    const identityKey: string = keyHumanViewerIdentity(identity.data);
    const human: AutoMovieHuman =
      page.current?.generatorChoice === page.hand &&
      page.current.identityKey === identityKey
        ? page.current.human
        : new AutoMovieHuman({
            id: page.MODEL_ID,
            identity: identity.data,
            parts:
              page.hand === "paddle"
                ? { hand: new HumanViewerPaddleHandGenerator() }
                : undefined,
          });
    // Refused pose/expression documents must not bake or replace the feature cache.
    const pose: IAutoMoviePose = human.pose({ pose: session.pose });
    const expression: IAutoMovieExpression = human.express({
      expression: session.expression,
    });
    return {
      generatorChoice: page.hand,
      identityKey,
      session: {
        ...structuredClone(session),
        identity: identity.data,
        appearance: appearance.data,
      },
      human,
      model: human.getModel({
        appearance: appearance.data,
        assembly: page.assembly,
        skinFinish: page.skinFinish,
        surfaceMeasurements: session.surfaceMeasurements,
      }),
      skeleton: human.getSkeleton(),
      pose,
      expression,
    };
  }
  page.admit = admit;

  /** Admit a candidate session; on refusal keep the last valid person. */
  function accept(candidate: IHumanViewerSession, note: string): boolean {
    try {
      if (page.closed) throw new Error("The Human page is closed.");
      page.show(page.admit(candidate));
      const generated: ReturnType<AutoMovieHuman["inspectSurface"]> | undefined =
        candidate.surfaceMeasurements === undefined ? undefined :
          page.current.human.inspectSurface({measurements: candidate.surfaceMeasurements});
      page.status(generated === undefined ? note :
        `${note} Partial generated rest surface (${generated.revision}): ${generated.diagnostics.join("; ")}`);
      return true;
    } catch (cause) {
      page.error(cause);
      return false;
    }
  }
  page.accept = accept;

  // ── session ─────────────────────────────────────────────────────────────────
  function save(): void {
    const text: string = JSON.stringify(page.current.session, null, 2);
    localStorage.setItem(page.STORAGE_KEY, text);
    const link: HTMLAnchorElement = document.createElement("a");
    link.href = URL.createObjectURL(
      new Blob([text], { type: "application/json" }),
    );
    link.download = "human-session.json";
    link.click();
    URL.revokeObjectURL(link.href);
    void hashHumanViewerSession(page.current.session).then(
      (hash: string): void =>
        page.status(
          `Saved to local storage and human-session.json (documents ${hash.slice(0, 12)}).`,
        ),
    );
  }
  page.save = save;
}
