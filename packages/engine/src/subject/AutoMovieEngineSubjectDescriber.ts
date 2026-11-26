import {
  IAutoMovieBuildingUnit,
  IAutoMovieBuiltElement,
  IAutoMovieBuiltEnvironment,
  IAutoMovieCompiledInstanceSet,
  IAutoMovieModel,
  IAutoMovieModelPart,
  type IAutoMovieModelPartPoints,
  IAutoMovieSubjectArtifact,
  IAutoMovieSubjectBox,
  IAutoMovieSubjectDescription,
  IAutoMovieVector3,
} from "@automovie/interface";

import { builtEnvironmentPartBoxes } from "../architecture/builtEnvironmentPartBoxes";
import { builtPointBounds } from "../architecture/builtPointBounds";
import { autoMovieInstanceAddressSlot } from "../autoMovieInstanceAddressSlot";
import { autoMovieModelPartPoints } from "../autoMovieModelPartPoints";
import { compareAutoMovieRenderIds } from "../render/compareAutoMovieRenderIds";
import { autoMovieSubjectAddress } from "./internal/autoMovieSubjectAddress";
import { autoMovieSubjectMaterials } from "./internal/autoMovieSubjectMaterials";
import { autoMovieSubjectMemberSummary } from "./internal/autoMovieSubjectMemberSummary";
import { autoMovieSubjectPlacedBounds } from "./internal/autoMovieSubjectPlacedBounds";
import { describeAutoMovieBuildingSubject } from "./internal/describeAutoMovieBuildingSubject";
import { describeAutoMovieInstanceSetSubject } from "./internal/describeAutoMovieInstanceSetSubject";
import { describeAutoMovieInstanceSubject } from "./internal/describeAutoMovieInstanceSubject";
import { describeAutoMovieSpaceSubject } from "./internal/describeAutoMovieSpaceSubject";

type ISceneNode =
  IAutoMovieSubjectArtifact["compiled"]["scene"]["nodes"][number];

interface IBuiltElementEntry {
  environment: IAutoMovieBuiltEnvironment;
  element: IAutoMovieBuiltElement;
}

/**
 * Describes the subjects of one compiled shot artifact, sharing every index and
 * measurement across one description pass.
 *
 * {@link AutoMovieEngineSubjects.describe} and
 * {@link AutoMovieEngineSubjects.describeAll} both describe through one of
 * these, so a subject reads the same whether it is addressed alone or listed in
 * the inventory. The describer indexes the artifact when constructed and
 * memoizes model-frame part points per model and staged part boxes per built
 * environment, so a pass over many elements of one model tessellates it once
 * and stages each environment once for its building units. It treats the
 * artifact as an immutable snapshot; a caller that edits the artifact builds a
 * new describer.
 *
 * Every member summary is the page of
 * {@link AutoMovieEngineSubjects.memberSummary} starting at the constructor's
 * `memberOffset`. Prototype and prototype-part bounds are in model coordinates
 * and every other kind's in world metres.
 */
export class AutoMovieEngineSubjectDescriber {
  private readonly models: Map<string, IAutoMovieModel> = new Map();
  private readonly builtElements: Map<string, IBuiltElementEntry> = new Map();
  private readonly populationSpaces: Map<string, string> = new Map();
  private readonly elementChildren: Map<string, string[]> = new Map();
  private readonly geometry: Map<string, IAutoMovieModelPartPoints.IResult> =
    new Map();
  private readonly partBoxes: Map<string, Map<string, IAutoMovieSubjectBox[]>> =
    new Map();

  /**
   * Index one artifact for description. Environment-owned models are merged
   * over the compiled ones, because a built environment carries the geometry
   * its staged nodes cite.
   *
   * @param artifact Compiled shot artifact and its revision.
   * @param memberOffset Rank of the first member each summary names; a whole
   *   number from 0, which the entry points check.
   */
  public constructor(
    private readonly artifact: IAutoMovieSubjectArtifact,
    private readonly memberOffset: number = 0,
  ) {
    for (const model of artifact.compiled.models)
      this.models.set(model.id, model);
    for (const environment of artifact.compiled.builtEnvironments ?? []) {
      for (const model of environment.models) this.models.set(model.id, model);
      for (const element of environment.elements) {
        const node: string = `${environment.id}/${element.id}`;
        this.builtElements.set(node, { environment, element });
        if (element.parent === null) continue;
        const parent: string = `${environment.id}/${element.parent}`;
        const siblings: string[] = this.elementChildren.get(parent) ?? [];
        siblings.push(node);
        this.elementChildren.set(parent, siblings);
      }
      for (const population of environment.populations ?? [])
        this.populationSpaces.set(
          population.set.id,
          autoMovieSubjectAddress("space", environment.id, population.space),
        );
    }
  }

  /**
   * Describe the subject at one address, regenerating an element part or a
   * single compact instance only because it was addressed.
   *
   * Addresses are those of {@link autoMovieSubjectAddress} and
   * {@link autoMovieInstanceAddress}. Throws an `Error` for an address no
   * subject answers, and whatever `instanceSlot` throws for a member it cannot
   * regenerate.
   *
   * @param subjectId Stable subject address.
   * @returns The subject's description.
   */
  public describe(subjectId: string): IAutoMovieSubjectDescription {
    for (const model of this.models.values()) {
      if (autoMovieSubjectAddress("prototype", model.id) === subjectId)
        return this.prototype(model);
      for (const part of model.parts)
        if (
          autoMovieSubjectAddress("prototype-part", model.id, part.id) ===
          subjectId
        )
          return this.prototypePart(model, part);
    }
    const nodes: ISceneNode[] = this.artifact.compiled.scene.nodes;
    for (const node of nodes)
      if (autoMovieSubjectAddress("element", node.id) === subjectId)
        return this.element(node);
    for (const [node, entry] of this.builtElements)
      if (
        entry.element.model === null &&
        autoMovieSubjectAddress("element", node) === subjectId
      )
        return this.elementGroup(node, entry.element);
    for (const node of nodes) {
      const model: IAutoMovieModel | undefined = this.models.get(node.model);
      for (const part of model?.parts ?? [])
        if (
          autoMovieSubjectAddress("element-part", node.id, part.id) ===
          subjectId
        )
          return this.elementPart(node, model!, part);
    }
    const sets: IAutoMovieCompiledInstanceSet[] =
      this.artifact.compiled.instanceSets;
    for (const set of sets)
      if (autoMovieSubjectAddress("instance-set", set.id) === subjectId)
        return describeAutoMovieInstanceSetSubject(
          set,
          this.models,
          this.populationSpaces.get(set.id) ?? null,
          this.artifact.revision,
          this.memberOffset,
        );
    for (const set of sets) {
      const slot: number | null = autoMovieInstanceAddressSlot(set, subjectId);
      if (slot !== null)
        return describeAutoMovieInstanceSubject(
          set,
          slot,
          this.models,
          this.populationSpaces.get(set.id) ?? null,
          this.artifact.revision,
          (model: IAutoMovieModel): IAutoMovieVector3[] =>
            this.geometryOf(model).all,
        );
    }
    for (const environment of this.artifact.compiled.builtEnvironments ?? []) {
      for (const space of environment.spaces)
        if (
          autoMovieSubjectAddress("space", environment.id, space.id) ===
          subjectId
        )
          return describeAutoMovieSpaceSubject(
            environment,
            space,
            this.artifact.revision,
            this.memberOffset,
          );
      for (const building of environment.buildings)
        if (
          autoMovieSubjectAddress("building", environment.id, building.id) ===
          subjectId
        )
          return this.building(environment, building);
    }
    throw new Error(`Compiled subject "${subjectId}" does not exist.`);
  }

  /**
   * Every directly stored subject, sorted by address in render-id order.
   *
   * Holds each model as a prototype with its prototype parts, each staged scene
   * node as an element, each instance set, and, per built environment, its
   * transform-only groups, logical spaces and building units. Element parts and
   * single instances are left out because they are regenerated only when
   * addressed.
   *
   * @returns One description per stored subject.
   */
  public inventory(): IAutoMovieSubjectDescription[] {
    const descriptions: IAutoMovieSubjectDescription[] = [];
    for (const model of this.models.values()) {
      descriptions.push(this.prototype(model));
      for (const part of model.parts)
        descriptions.push(this.prototypePart(model, part));
    }
    for (const node of this.artifact.compiled.scene.nodes)
      descriptions.push(this.element(node));
    for (const set of this.artifact.compiled.instanceSets)
      descriptions.push(
        describeAutoMovieInstanceSetSubject(
          set,
          this.models,
          this.populationSpaces.get(set.id) ?? null,
          this.artifact.revision,
          this.memberOffset,
        ),
      );
    // A transform-only group stages no node, so the scene walk never reaches
    // one; it is still an element the record owns.
    for (const [node, entry] of this.builtElements)
      if (entry.element.model === null)
        descriptions.push(this.elementGroup(node, entry.element));
    for (const environment of this.artifact.compiled.builtEnvironments ?? []) {
      for (const space of environment.spaces)
        descriptions.push(
          describeAutoMovieSpaceSubject(
            environment,
            space,
            this.artifact.revision,
            this.memberOffset,
          ),
        );
      // The unit itself: neither the scene nor the space tree names one.
      for (const building of environment.buildings)
        descriptions.push(this.building(environment, building));
    }
    return descriptions.sort(
      (
        left: IAutoMovieSubjectDescription,
        right: IAutoMovieSubjectDescription,
      ): number => compareAutoMovieRenderIds(left.id, right.id),
    );
  }

  private prototype(model: IAutoMovieModel): IAutoMovieSubjectDescription {
    return this.record({
      id: autoMovieSubjectAddress("prototype", model.id),
      kind: "prototype",
      semanticKind: model.skeleton === null ? "object" : "actor",
      name: model.name,
      model: model.id,
      bounds: {
        declared: null,
        content: builtPointBounds(this.geometryOf(model).all),
        coordinateSpace: "model",
      },
      materials: autoMovieSubjectMaterials(model),
      members: this.summarize(
        model.parts.map((part: IAutoMovieModelPart): string =>
          autoMovieSubjectAddress("prototype-part", model.id, part.id),
        ),
      ),
    });
  }

  private prototypePart(
    model: IAutoMovieModel,
    part: IAutoMovieModelPart,
  ): IAutoMovieSubjectDescription {
    return this.record({
      id: autoMovieSubjectAddress("prototype-part", model.id, part.id),
      kind: "part",
      semanticKind: part.geometry.type,
      name: part.name,
      owner: autoMovieSubjectAddress("prototype", model.id),
      model: model.id,
      transform:
        part.transform === null ? null : structuredClone(part.transform),
      bounds: {
        declared: null,
        content: builtPointBounds(this.geometryOf(model).parts.get(part)!),
        coordinateSpace: "model",
      },
      materials: autoMovieSubjectMaterials(model, part),
    });
  }

  private element(node: ISceneNode): IAutoMovieSubjectDescription {
    const model: IAutoMovieModel | undefined = this.models.get(node.model);
    const address: string = autoMovieSubjectAddress("element", node.id);
    return this.record({
      id: address,
      kind: "element",
      semanticKind:
        this.builtElements.get(node.id)?.element.kind ?? "scene-node",
      name: model?.name ?? null,
      prototype: autoMovieSubjectAddress("prototype", node.model),
      placement: address,
      ...this.builtLinks(node.id),
      model: node.model,
      transform: structuredClone(node.transform),
      bounds: {
        declared: null,
        content:
          model === undefined
            ? null
            : autoMovieSubjectPlacedBounds(
                this.geometryOf(model).all,
                node.transform,
              ),
        coordinateSpace: "world",
      },
      materials: model === undefined ? [] : autoMovieSubjectMaterials(model),
      // Parts and child elements together: both are things this subject
      // contains and addresses this surface resolves, and the children are the
      // only way down to an element no space claims.
      members: this.summarize([
        ...(model?.parts.map((part: IAutoMovieModelPart): string =>
          autoMovieSubjectAddress("element-part", node.id, part.id),
        ) ?? []),
        ...this.childAddresses(node.id),
      ]),
    });
  }

  /**
   * A built element the builder stages no node for. It has an identity, a kind,
   * a parent and a space but no geometry, so like
   * `builtEnvironmentPlacementBounds` it states no transform, bounds, materials
   * or prototype, only the structure a walk needs.
   */
  private elementGroup(
    node: string,
    element: IAutoMovieBuiltElement,
  ): IAutoMovieSubjectDescription {
    const address: string = autoMovieSubjectAddress("element", node);
    return this.record({
      id: address,
      kind: "element",
      semanticKind: element.kind,
      placement: address,
      ...this.builtLinks(node),
      bounds: { declared: null, content: null, coordinateSpace: "world" },
      members: this.summarize(this.childAddresses(node)),
    });
  }

  private elementPart(
    node: ISceneNode,
    model: IAutoMovieModel,
    part: IAutoMovieModelPart,
  ): IAutoMovieSubjectDescription {
    const address: string = autoMovieSubjectAddress(
      "element-part",
      node.id,
      part.id,
    );
    return this.record({
      id: address,
      kind: "part",
      semanticKind: part.geometry.type,
      name: part.name,
      prototype: autoMovieSubjectAddress("prototype-part", model.id, part.id),
      placement: address,
      owner: autoMovieSubjectAddress("element", node.id),
      model: model.id,
      space: this.builtLinks(node.id).space,
      transform: structuredClone(node.transform),
      bounds: {
        declared: null,
        content: autoMovieSubjectPlacedBounds(
          this.geometryOf(model).parts.get(part)!,
          node.transform,
        ),
        coordinateSpace: "world",
      },
      materials: autoMovieSubjectMaterials(model, part),
    });
  }

  private building(
    environment: IAutoMovieBuiltEnvironment,
    building: IAutoMovieBuildingUnit,
  ): IAutoMovieSubjectDescription {
    let boxes: Map<string, IAutoMovieSubjectBox[]> | undefined =
      this.partBoxes.get(environment.id);
    if (boxes === undefined) {
      boxes = builtEnvironmentPartBoxes(environment);
      this.partBoxes.set(environment.id, boxes);
    }
    return describeAutoMovieBuildingSubject(
      environment,
      building,
      boxes,
      this.artifact.revision,
      this.memberOffset,
    );
  }

  /** A description with every unstated field at its empty value. */
  private record(
    fields: Pick<
      IAutoMovieSubjectDescription,
      "id" | "kind" | "semanticKind" | "bounds"
    > &
      Partial<IAutoMovieSubjectDescription>,
  ): IAutoMovieSubjectDescription {
    return {
      version: 1,
      revision: this.artifact.revision,
      name: null,
      prototype: null,
      placement: null,
      owner: null,
      model: null,
      space: null,
      transform: null,
      materials: [],
      ...fields,
      members: fields.members ?? this.summarize([]),
    };
  }

  private summarize(
    ids: readonly string[],
  ): IAutoMovieSubjectDescription["members"] {
    return autoMovieSubjectMemberSummary(ids, this.memberOffset);
  }

  private childAddresses(node: string): string[] {
    return (this.elementChildren.get(node) ?? []).map((child: string): string =>
      autoMovieSubjectAddress("element", child),
    );
  }

  /** The owner and space addresses a built element states, or nulls. */
  private builtLinks(node: string): {
    owner: string | null;
    space: string | null;
  } {
    const built: IBuiltElementEntry | undefined = this.builtElements.get(node);
    if (built === undefined) return { owner: null, space: null };
    const environment: IAutoMovieBuiltEnvironment = built.environment;
    const element: IAutoMovieBuiltElement = built.element;
    return {
      owner:
        element.parent === null
          ? null
          : autoMovieSubjectAddress(
              "element",
              `${environment.id}/${element.parent}`,
            ),
      space:
        element.space === null
          ? null
          : autoMovieSubjectAddress("space", environment.id, element.space),
    };
  }

  private geometryOf(
    model: IAutoMovieModel,
  ): IAutoMovieModelPartPoints.IResult {
    let geometry: IAutoMovieModelPartPoints.IResult | undefined =
      this.geometry.get(model.id);
    if (geometry === undefined) {
      geometry = autoMovieModelPartPoints(model);
      this.geometry.set(model.id, geometry);
    }
    return geometry;
  }
}
