import type {
  IAutoMovieHumanBodyBasisDocument,
  IAutoMovieHumanFaceBasisDocument,
  IAutoMovieHumanPersonDocument,
} from "@automovie/human";

import { renderBodyHumeralHeadControls } from "../body/bodyHumeralHeadControls";
import { renderBodySimpleControls } from "../body/bodySimpleControls";
import { connectedFaceComponents } from "../face/anatomy/connectedFaceComponents";
import { mountConnectedFaceControls } from "../face/connectedControls";
import { mountConnectedFaceIris } from "../face/connectedIris";
import { CONNECTED_PERSON_UNDESCRIBED_INPUTS } from "./CONNECTED_PERSON_UNDESCRIBED_INPUTS";
import type { IConnectedPersonModel } from "./IConnectedPersonModel";
import type { IConnectedPersonSections } from "./IConnectedPersonSections";
import type { IConnectedPersonSectionsProps } from "./IConnectedPersonSectionsProps";
import { mountConnectedPersonMeasuredControls } from "./connectedPersonMeasuredControls";
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

/**
 * Mount every control section of the person editor over the one working
 * document: person and head measurements, head traits, eyes and lashes, skin
 * relief, the oral assembly, face measurements, the body controls and the
 * face channel controls.
 *
 * Each section edits the working document through the panel's one transaction
 * (`IConnectedPersonSectionsProps.controls`) and evaluates nothing itself.
 * Measurement readers run only on an admitted person
 * (`readConnectedPersonAdmitted`). The face controls list the head view's own
 * channels: driver channels carry the body's gains and are never edited from
 * the face, and an aliased face channel is listed disabled with its body
 * owner named.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Mounts the body measurement, anatomy and joint controls over the person's body subtree.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Mounts the face shape, expression and anatomical controls over the person's face subtree.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Routes every section through the panel's one transaction and intent order.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor Routes every face section through the same transaction owner.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-connected-basis Takes facial channels and appearance descriptors from the published head view and routes their face subtree through the complete-person transaction.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-articulation Routes expression and eye inputs together in the complete face subtree; the resident person builder owns jaw, eye and attachment articulation.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-articulation Sends the facial channel document to the original worker evaluator instead of applying a second joint transform in the editor.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-contact Sends oral and expression edits through the same whole-person transaction, so the original facial owner admits their combined contacts rather than separate section previews.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-contact Keeps the full face subtree when an oral or channel control changes, leaving coupled closure, tongue passage and tissue refusals to the resident facial evaluator.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-skin-condition Mounts independent resting nasolabial and regional skin-relief controls over the face document, retaining other face inputs through the shared transaction.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-skin-condition Routes the named skin-relief inputs and current expression together to the original builder; this section neither generates wrinkle fields nor duplicates subdivision.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-skin-colour Mounts owner-described named skin-appearance inputs alongside material inputs, editing numerical appearance separately from geometry and lighting.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-skin-colour Obtains skin-region appearance descriptors from the head view and sends their face.skinAppearance paths through the shared transaction; the facial builder carries the resulting colour on tissue.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-parametric-hair Mounts owner-described hairTraits for existing populations and names new scalpHair populations as document-only inputs; it infers no guide coordinates or missing population.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-controls-replacement Clones the current person and replaces only the edited face subtree, retaining body authoring and the other facial fields handled by each section.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-expression Routes shape, expression, eye and oral sections through one current face document instead of independently posed component previews.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-attachments Publishes no independently fitted section geometry: all face edits reach the original whole-person builder that owns the shared facial boundaries and internal attachments.
 * @author Samchon
 */
export function mountConnectedPersonSections<
  Model extends IConnectedPersonModel,
>(props: IConnectedPersonSectionsProps<Model>): IConnectedPersonSections {
  // measurements are read on an admitted person; a draft has none
  const admitted = <Arguments extends unknown[], Reading>(
    read: (...input: Arguments) => Promise<Reading>,
  ) => readConnectedPersonAdmitted(() => props.isDraft(), read);
  const shared = props.controls;
  const { dom, refuse } = shared;
  const panel = props.panel;
  const change = (
    next: IAutoMovieHumanPersonDocument,
    ticket: number = shared.reserve(),
  ): Promise<boolean> => shared.change(next, ticket);
  const bodySection = props.app.querySelector<HTMLElement>("#body-section")!;
  const faceSection = props.app.querySelector<HTMLElement>("#face-section")!;
  const withBody = (
    body: IAutoMovieHumanBodyBasisDocument,
  ): IAutoMovieHumanPersonDocument => ({
    ...structuredClone(shared.current()),
    body: structuredClone(body),
  });
  const withFace = (
    face: IAutoMovieHumanFaceBasisDocument,
  ): IAutoMovieHumanPersonDocument => ({
    ...structuredClone(shared.current()),
    face: structuredClone(face),
  });
  const simpleContainer = bodySection.querySelector<HTMLElement>(
    '[data-role="person-simple-controls"]',
  )!;
  const simpleStatus = dom.createElement("small");
  const simple = renderBodySimpleControls({
    dom,
    container: simpleContainer,
    wholeSource:
      "this person's source rest-skin reader, including its own head; posed and closure stages are excluded",
    current: () => {
      const person = shared.current();
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
    project: (body) =>
      panel.projectSimple(
        withBody({
          ...shared.current().body,
          shape: body.shape,
          anatomy: body.anatomy,
        }),
      ),
    expand: (values, shape) =>
      panel.expandSimple(withBody({ ...shared.current().body, shape }), values),
    reserveIntent: shared.reserve,
    currentIntent: props.currentIntent,
    isCurrentIntent: shared.isCurrent,
    onApply: (shape, ticket) => {
      void change(withBody({ ...shared.current().body, shape }), ticket);
    },
    onRefuse: refuse,
    onBusy: shared.busy,
    onDraftChanged: props.draftChanged,
    onPreparing: (active) => {
      simpleStatus.textContent = active
        ? "Reading the current person's simple measurements…"
        : "";
    },
  });
  simpleContainer.append(simpleStatus);
  const personMeasurements = mountConnectedPersonMeasuredControls({
    ...shared,
    container: bodySection.querySelector<HTMLElement>(
      '[data-role="person-measurements"]',
    )!,
    read: admitted(panel.readPersonMeasurement),
    solve: panel.solvePersonMeasurement,
  });
  const headMeasurements = mountConnectedPersonHeadControls({
    ...shared,
    container: faceSection.querySelector<HTMLElement>(
      '[data-role="head-measurements"]',
    )!,
    read: admitted(panel.readPersonHead),
    solve: panel.solvePersonHead,
  });
  const headShapeControls = mountConnectedPersonHeadShapeControls({
    ...shared,
    container: faceSection.querySelector<HTMLElement>(
      '[data-role="head-measurements"]',
    )!,
    source: panel.headShapeSource,
  });
  const eyeControls = mountConnectedPersonEyeControls({
    ...shared,
    faceBasis: panel.face,
    container: faceSection.querySelector<HTMLElement>(
      '[data-role="eye-controls"]',
    )!,
  });
  const skinReliefControls = mountConnectedPersonSkinReliefControls({
    ...shared,
    container: faceSection.querySelector<HTMLElement>(
      '[data-role="skin-relief-controls"]',
    )!,
  });
  const regionalSkinControls = mountConnectedPersonRegionalSkinControls({
    ...shared,
    container: faceSection.querySelector<HTMLElement>(
      '[data-role="skin-relief-controls"]',
    )!,
  });
  const oralControls = mountConnectedPersonOralControls({
    ...shared,
    container: faceSection.querySelector<HTMLElement>(
      '[data-role="oral-controls"]',
    )!,
  });
  const faceAnatomy = mountConnectedPersonFaceAnatomy({
    ...shared,
    container: faceSection.querySelector<HTMLElement>(
      '[data-role="face-anatomy"]',
    )!,
    read: admitted(panel.readFaceMeasurements),
    solve: panel.solveFaceMeasurement,
  });
  const bodyControls = mountConnectedPersonBodyControls({
    dom,
    section: bodySection,
    body: panel.body,
    reach: panel.bodyReach,
    current: () => shared.current().body,
    reserve: shared.reserve,
    isCurrent: shared.isCurrent,
    solve: panel.solveMeasurement,
    change: (next, ticket) => change(withBody(next), ticket),
    busy: shared.busy,
    report: shared.report,
    refuse,
  });
  // the body editor's humeral-head radii, written into the person's body
  const humeralHeads = renderBodyHumeralHeadControls({
    dom,
    container: bodySection.querySelector<HTMLElement>(
      '[data-role="humeral-heads"]',
    )!,
    current: () => shared.current().body,
    onChange: (body) => void change(withBody(body)),
    onRefuse: refuse,
  });
  // The face controls list the head view's own channels. Driver channels carry
  // the body's gains and are never edited from the face. An aliased face
  // channel is defined once by its body channel: it is listed disabled with
  // that owner named, and a document stating it is refused by name.
  const drivers = new Set(
    panel.face.channels
      .filter((channel) => channel.id.startsWith("driver:"))
      .map((channel) => channel.id),
  );
  const aliased = new Set(panel.aliases.map((alias) => alias.face));
  const faceControls = mountConnectedFaceControls(faceSection, {
    basis: {
      ...panel.face,
      channels: panel.face.channels.filter(
        (channel) => !drivers.has(channel.id) && !aliased.has(channel.id),
      ),
    },
    // the face editor's anatomical groups, bound to the head view
    components: createConnectedPersonFaceComponents({
      tree: connectedFaceComponents,
      basis: panel.face.id,
      excluded: [...aliased],
    }),
    document: () => shared.current().face,
    change: async (face) => {
      await change(withFace(face));
    },
    refuse,
  });
  const appearanceAnchor = dom.createElement("div");
  appearanceAnchor.id = "face-appearance";
  faceSection.append(appearanceAnchor);
  const iris = mountConnectedFaceIris(faceSection, {
    basis: panel.face,
    document: () => shared.current().face,
    change: async (face) => {
      await change(withFace(face));
    },
    refuse,
  });
  renderConnectedPersonAliasedChannels(dom, faceSection, panel.aliases);
  // one list of every input whose owner publishes a descriptor
  const catalogue = mountConnectedPersonInputCatalogue({
    ...shared,
    container: props.app.querySelector<HTMLElement>(
      '[data-role="input-catalogue"]',
    )!,
    inputs: () =>
      createConnectedPersonInputCatalogue({
        face: panel.face,
        body: panel.body,
        person: shared.current(),
        excluded: new Set([...drivers, ...aliased]),
        headShape: panel.headShapeSource,
      }),
    undescribed: CONNECTED_PERSON_UNDESCRIBED_INPUTS,
    prepare: (document, path) =>
      prepareConnectedPersonCatalogueInput(panel.face, document, path),
  });
  const renderAll = (): void => {
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
