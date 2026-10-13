import type {
  IAutoMovieHumanBodyBasisDocument,
  IAutoMovieHumanFaceBasisDocument,
  IAutoMovieHumanPersonDocument,
} from "@automovie/human";

import { renderBodyHumeralHeadControls } from "../body/renderBodyHumeralHeadControls";
import { renderBodySimpleControls } from "../body/renderBodySimpleControls";
import type { IBodySimpleBody } from "../body/IBodySimpleBody";
import type { IBodySimpleControlsProps } from "../body/IBodySimpleControlsProps";
import { connectedFaceComponents } from "../face/anatomy/connectedFaceComponents";
import { mountConnectedFaceControls } from "../face/mountConnectedFaceControls";
import { mountConnectedFaceIris } from "../face/mountConnectedFaceIris";
import { CONNECTED_PERSON_UNDESCRIBED_INPUTS } from "./CONNECTED_PERSON_UNDESCRIBED_INPUTS";
import type { IConnectedPersonModel } from "./IConnectedPersonModel";
import type { IConnectedPersonSections } from "./IConnectedPersonSections";
import type { IConnectedPersonSectionsProps } from "./IConnectedPersonSectionsProps";
import { mountConnectedPersonMeasuredControls } from "./mountConnectedPersonMeasuredControls";
import { createConnectedPersonFaceComponents } from "./createConnectedPersonFaceComponents";
import { createConnectedPersonInputCatalogue } from "./createConnectedPersonInputCatalogue";
import { mountConnectedPersonBodyControls } from "./mountConnectedPersonBodyControls";
import { mountConnectedPersonEyeControls } from "./mountConnectedPersonEyeControls";
import { mountConnectedPersonFaceAnatomy } from "./mountConnectedPersonFaceAnatomy";
import { mountConnectedPersonHeadControls } from "./mountConnectedPersonHeadControls";
import { mountConnectedPersonHeadShapeControls } from "./mountConnectedPersonHeadShapeControls";
import { mountConnectedPersonInputCatalogue } from "./mountConnectedPersonInputCatalogue";
import { mountConnectedPersonOralControls } from "./mountConnectedPersonOralControls";
import { mountConnectedPersonRegionalSkinControls } from "./mountConnectedPersonRegionalSkinControls";
import { mountConnectedPersonSkinReliefControls } from "./mountConnectedPersonSkinReliefControls";
import { prepareConnectedPersonCatalogueInput } from "./prepareConnectedPersonCatalogueInput";
import { readConnectedPersonAdmitted } from "./readConnectedPersonAdmitted";
import { renderConnectedPersonAliasedChannels } from "./renderConnectedPersonAliasedChannels";
import type { IConnectedPersonInputDescriptor } from "./IConnectedPersonInputDescriptor";

/**
 * Mount the existing person, head, eye, skin, oral, face, body and catalogue sections over one working document and transaction. Ordinary person/head/face measurement readers are blocked while the panel displays a labelled construction draft; solver candidates still require later panel admission. Body-only shape readings retain their separate provenance.
 *
 * Body driver channels and face aliases are excluded from face edits and described through their body owner. Simple projection includes face/head/population in its context key. Refresh schedules asynchronous simple and measurement readbacks; returning void does not mean those tasks have settled, and numerical transports remain panel/page-owned.
 *
 * @evidence contracts/common.md#principled-implementation One complete-person transaction composes body/face copies, admitted-state gates protect ordinary readers, and generation-authored driver/alias records prevent independently editing channels defined by the body.
 * @evidence contracts/common.md#clear-and-simple-design Section assembly injects shared intent/status hooks and actual numerical operations into existing controls rather than implementing another evaluator or history owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Draft reads remain unavailable, aliases are not guessed from anatomy and scheduled refresh is not reported as completed measurement or accepted geometry.
 * @evidence contracts/common.md#meaningful-documentation The comment states measurement provenance, shared transaction ownership, projection dependencies and asynchronous refresh limits.
 * @evidence contracts/performance.md#efficient-algorithms Mounting traverses generation channels and owner catalogue/populations plus each control's DOM work. Composing a body/face edit clones the current full document and supplied partition; refresh retains every invoked read/build cost rather than making them disappear behind adapters.
 * @evidence contracts/performance.md#reuse-equivalent-work Controls reuse one panel's numerical transports and shared intent. Simple projection's context includes complete-person dependencies; refreshed catalogue descriptors reflect current populations rather than reusing seeds from an older document.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Mounted controls and their fixed/canonical-population maps live with the panel DOM, with no independent section close or aggregate pending-read cap. Page/panel owners close numerical transports and dispose DOM; this adapter's returned render/refresh handles remain caller-owned.
 *
 * @author Samchon
 */
export function mountConnectedPersonSections<
  Model extends IConnectedPersonModel,
>(props: IConnectedPersonSectionsProps<Model>): IConnectedPersonSections {
  // measurements are read on an admitted person; a draft has none
  const admitted: <Arguments extends unknown[], Reading>(read: (...input: Arguments) => Promise<Reading>) => (...input: Arguments) => Promise<Reading> = <Arguments extends unknown[], Reading>(
    read: (...input: Arguments) => Promise<Reading>,
  ): (...input: Arguments) => Promise<Reading> => readConnectedPersonAdmitted((): boolean => props.isDraft(), read);
  const shared: IConnectedPersonSectionsProps<Model>["controls"] = props.controls;
  const dom: Document = shared.dom;
  const refuse: (error: unknown) => void = shared.refuse;
  const panel: IConnectedPersonSectionsProps<Model>["panel"] = props.panel;
  const change: (next: IAutoMovieHumanPersonDocument, ticket?: number) => Promise<boolean> = (
    next: IAutoMovieHumanPersonDocument,
    ticket: number = shared.reserve(),
  ): Promise<boolean> => shared.change(next, ticket);
  const bodySection: HTMLElement = props.app.querySelector<HTMLElement>("#body-section")!;
  const faceSection: HTMLElement = props.app.querySelector<HTMLElement>("#face-section")!;
  const withBody: (body: IAutoMovieHumanBodyBasisDocument) => IAutoMovieHumanPersonDocument = (
    body: IAutoMovieHumanBodyBasisDocument,
  ): IAutoMovieHumanPersonDocument => ({
    ...structuredClone(shared.current()),
    body: structuredClone(body),
  });
  const withFace: (face: IAutoMovieHumanFaceBasisDocument) => IAutoMovieHumanPersonDocument = (
    face: IAutoMovieHumanFaceBasisDocument,
  ): IAutoMovieHumanPersonDocument => ({
    ...structuredClone(shared.current()),
    face: structuredClone(face),
  });
  const simpleContainer: HTMLElement = bodySection.querySelector<HTMLElement>(
    '[data-role="person-simple-controls"]',
  )!;
  const simpleStatus: HTMLElement = dom.createElement("small");
  const simple: ReturnType<typeof renderBodySimpleControls> = renderBodySimpleControls({
    dom,
    container: simpleContainer,
    wholeSource:
      "this person's source rest-skin reader, including its own head; posed and closure stages are excluded",
    current: (): IBodySimpleBody => {
      const person: IAutoMovieHumanPersonDocument = shared.current();
      return {
        shape: person.body.shape,
        anatomy: person.body.anatomy,
        contextKey: JSON.stringify([
          person.face,
          person.headShape,
          person.population,
        ]),
      };
    },
    project: (body: IBodySimpleBody): ReturnType<IBodySimpleControlsProps["project"]> =>
      panel.projectSimple(
        withBody({
          ...shared.current().body,
          shape: body.shape,
          anatomy: body.anatomy,
        }),
      ),
    expand: (values: Parameters<IBodySimpleControlsProps["expand"]>[0], shape: Record<string, number>): Promise<Record<string, number>> =>
      panel.expandSimple(withBody({ ...shared.current().body, shape }), values),
    reserveIntent: shared.reserve,
    currentIntent: props.currentIntent,
    isCurrentIntent: shared.isCurrent,
    onApply: (shape: Record<string, number>, ticket: number): void => {
      void change(withBody({ ...shared.current().body, shape }), ticket);
    },
    onRefuse: refuse,
    onBusy: shared.busy,
    onDraftChanged: props.draftChanged,
    onPreparing: (active: boolean): void => {
      simpleStatus.textContent = active
        ? "Reading the current person's simple measurements…"
        : "";
    },
  });
  simpleContainer.append(simpleStatus);
  const personMeasurements: ReturnType<typeof mountConnectedPersonMeasuredControls> = mountConnectedPersonMeasuredControls({
    ...shared,
    container: bodySection.querySelector<HTMLElement>(
      '[data-role="person-measurements"]',
    )!,
    read: admitted(panel.readPersonMeasurement),
    solve: panel.solvePersonMeasurement,
  });
  const headMeasurements: ReturnType<typeof mountConnectedPersonHeadControls> = mountConnectedPersonHeadControls({
    ...shared,
    container: faceSection.querySelector<HTMLElement>(
      '[data-role="head-measurements"]',
    )!,
    read: admitted(panel.readPersonHead),
    solve: panel.solvePersonHead,
  });
  const headShapeControls: ReturnType<typeof mountConnectedPersonHeadShapeControls> = mountConnectedPersonHeadShapeControls({
    ...shared,
    container: faceSection.querySelector<HTMLElement>(
      '[data-role="head-measurements"]',
    )!,
    source: panel.headShapeSource,
  });
  const eyeControls: ReturnType<typeof mountConnectedPersonEyeControls> = mountConnectedPersonEyeControls({
    ...shared,
    faceBasis: panel.face,
    container: faceSection.querySelector<HTMLElement>(
      '[data-role="eye-controls"]',
    )!,
  });
  const skinReliefControls: ReturnType<typeof mountConnectedPersonSkinReliefControls> = mountConnectedPersonSkinReliefControls({
    ...shared,
    container: faceSection.querySelector<HTMLElement>(
      '[data-role="skin-relief-controls"]',
    )!,
  });
  const regionalSkinControls: ReturnType<typeof mountConnectedPersonRegionalSkinControls> = mountConnectedPersonRegionalSkinControls({
    ...shared,
    container: faceSection.querySelector<HTMLElement>(
      '[data-role="skin-relief-controls"]',
    )!,
  });
  const oralControls: ReturnType<typeof mountConnectedPersonOralControls> = mountConnectedPersonOralControls({
    ...shared,
    container: faceSection.querySelector<HTMLElement>(
      '[data-role="oral-controls"]',
    )!,
  });
  const faceAnatomy: ReturnType<typeof mountConnectedPersonFaceAnatomy> = mountConnectedPersonFaceAnatomy({
    ...shared,
    container: faceSection.querySelector<HTMLElement>(
      '[data-role="face-anatomy"]',
    )!,
    read: admitted(panel.readFaceMeasurements),
    solve: panel.solveFaceMeasurement,
  });
  const bodyControls: ReturnType<typeof mountConnectedPersonBodyControls> = mountConnectedPersonBodyControls({
    dom,
    section: bodySection,
    body: panel.body,
    reach: panel.bodyReach,
    current: (): IAutoMovieHumanBodyBasisDocument => shared.current().body,
    reserve: shared.reserve,
    isCurrent: shared.isCurrent,
    solve: panel.solveMeasurement,
    change: (next: IAutoMovieHumanBodyBasisDocument, ticket?: number): Promise<boolean> => change(withBody(next), ticket),
    busy: shared.busy,
    report: shared.report,
    refuse,
  });
  // the body editor's humeral-head radii, written into the person's body
  const humeralHeads: ReturnType<typeof renderBodyHumeralHeadControls> = renderBodyHumeralHeadControls({
    dom,
    container: bodySection.querySelector<HTMLElement>(
      '[data-role="humeral-heads"]',
    )!,
    current: (): IAutoMovieHumanBodyBasisDocument => shared.current().body,
    onChange: (body: IAutoMovieHumanBodyBasisDocument): void => void change(withBody(body)),
    onRefuse: refuse,
  });
  // The face controls list the head view's own channels. Driver channels carry
  // the body's gains and are never edited from the face. An aliased face
  // channel is defined once by its body channel: it is listed disabled with
  // that owner named, and a document stating it is refused by name.
  const drivers: Set<string> = new Set(
    panel.face.channels
      .filter((channel: (typeof panel.face.channels)[number]): boolean => channel.id.startsWith("driver:"))
      .map((channel: (typeof panel.face.channels)[number]): string => channel.id),
  );
  const aliased: Set<string> = new Set(panel.aliases.map((alias: (typeof panel.aliases)[number]): string => alias.face));
  const faceControls: ReturnType<typeof mountConnectedFaceControls> = mountConnectedFaceControls(faceSection, {
    basis: {
      ...panel.face,
      channels: panel.face.channels.filter(
        (channel: (typeof panel.face.channels)[number]): boolean => !drivers.has(channel.id) && !aliased.has(channel.id),
      ),
    },
    // the face editor's anatomical groups, bound to the head view
    components: createConnectedPersonFaceComponents({
      tree: connectedFaceComponents,
      basis: panel.face.id,
      excluded: [...aliased],
    }),
    document: (): IAutoMovieHumanFaceBasisDocument => shared.current().face,
    change: async (face: IAutoMovieHumanFaceBasisDocument): Promise<void> => {
      await change(withFace(face));
    },
    refuse,
  });
  const appearanceAnchor: HTMLDivElement = dom.createElement("div");
  appearanceAnchor.id = "face-appearance";
  faceSection.append(appearanceAnchor);
  const iris: ReturnType<typeof mountConnectedFaceIris> = mountConnectedFaceIris(faceSection, {
    basis: panel.face,
    document: (): IAutoMovieHumanFaceBasisDocument => shared.current().face,
    change: async (face: IAutoMovieHumanFaceBasisDocument): Promise<void> => {
      await change(withFace(face));
    },
    refuse,
  });
  renderConnectedPersonAliasedChannels(dom, faceSection, panel.aliases);
  // one list of every input whose owner publishes a descriptor
  const catalogue: ReturnType<typeof mountConnectedPersonInputCatalogue> = mountConnectedPersonInputCatalogue({
    ...shared,
    container: props.app.querySelector<HTMLElement>(
      '[data-role="input-catalogue"]',
    )!,
    inputs: (): IConnectedPersonInputDescriptor[] =>
      createConnectedPersonInputCatalogue({
        face: panel.face,
        body: panel.body,
        person: shared.current(),
        excluded: new Set([...drivers, ...aliased]),
        headShape: panel.headShapeSource,
      }),
    undescribed: CONNECTED_PERSON_UNDESCRIBED_INPUTS,
    prepare: (document: IAutoMovieHumanPersonDocument, path: readonly string[]): IAutoMovieHumanPersonDocument =>
      prepareConnectedPersonCatalogueInput(panel.face, document, path),
  });
  const renderAll: () => void = (): void => {
    bodyControls.render();
    faceControls.refresh();
  };
  return {
    render: renderAll,
    refresh: (displayed: IAutoMovieHumanPersonDocument): void => {
      void simple.refresh({
        shape: displayed.body.shape,
        anatomy: displayed.body.anatomy,
        contextKey: JSON.stringify([
          displayed.face,
          displayed.headShape,
          displayed.population,
        ]),
      });
      personMeasurements.refresh();
      headMeasurements.refresh();
      headShapeControls.refresh();
      humeralHeads.refresh(displayed.body.humeralHeads);
      eyeControls.refresh();
      skinReliefControls.refresh();
      regionalSkinControls.refresh();
      oralControls.refresh();
      faceAnatomy.refresh();
      catalogue.refresh();
      iris.refresh();
    },
  };
}
