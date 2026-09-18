import { blendPortraitSkin } from "../skin/blendPortraitSkin";
import { applyPortraitFinalSurfaces } from "../../surface/applyPortraitFinalSurfaces";
import { applyPortraitRegionReplacements } from "../../surface/applyPortraitRegionReplacements";
import { assertPortraitSkinTopology } from "../skin/assertPortraitSkinTopology";
import { applyPortraitSurfaceLayers } from "../../surface/applyPortraitSurfaceLayers";
import { subdivideControlMesh } from "../../mesh/subdivideControlMesh";
import { appendPortraitCranium } from "./appendPortraitCranium";
import { appendPortraitNeck } from "./appendPortraitNeck";
import { IControlMesh } from "../../mesh/structures/IControlMesh";
import { IPortraitComponent } from "../../surface/structures/IPortraitComponent";
import { IPortraitComponentHost } from "../../surface/structures/IPortraitComponentHost";
import { IPortraitSurfaceLayer } from "../../surface/structures/IPortraitSurfaceLayer";
import { IPortraitHeadFormation } from "./structures/IPortraitHeadFormation";

/**
 * Prepare the shared millimetre surface consumed by buildPortraitHead.
 * Components fit the same unchanged host; their cuts and attachment regions
 * are validated together before cranial continuation and common refinement.
 * Layers, paired replacements and immutable final proposals run in that order.
 * Colour follows the paired reference coordinates rather than posed geometry.
 *
 * The returned surface owns its arrays and retains resident vertex identities.
 * Source is the blended, pre-attachment host. Finishers retain the component
 * declarations but are not invoked here. Contact seams remain unsealed: their
 * index equivalence belongs to materialization, before normals and interiors.
 * This phase boundary is not a nonintersection or anatomical validity proof.
 * Changing the prepared surface invalidates downstream normals and interiors;
 * callers must derive those from the final surface instead of cached geometry.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-controls-replacement Fits and refines replaceable components on one shared surface before dependent interiors are generated.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-attachments Validates cut ownership and shared topology while retaining contact declarations and resident IDs for final assembly.
 */
export function preparePortraitHead(
  host: IPortraitComponentHost,
  components: IPortraitComponent[],
  rounds: number,
  surfaceLayers: readonly IPortraitSurfaceLayer[] = [],
  anatomy: IPortraitHeadFormation = {},
) {
  if (!Number.isInteger(rounds) || rounds < 0 || rounds > 4)
    throw new Error(
      "Portrait subdivision rounds must be an integer from zero through four.",
    );
  const assemble = (
    host: IPortraitComponentHost,
    components: IPortraitComponent[],
    anatomy: IPortraitHeadFormation,
  ) => {
    if (
      new Set(components.map((component) => component.id)).size !==
      components.length
    )
      throw new Error("Portrait component instance identities must be unique.");
    // Fit all parts to one unchanged basis. Sequentially fitting to another
    // part's displacement would make the result depend on component ordering.
    const plans = components.map((component) => component.fit(host));
    const source = blendPortraitSkin(
      host.positions,
      host.indices,
      plans.flatMap((plan) => plan.constraints),
    );
    const removed = new Set<number>();
    for (const plan of plans)
      for (const triangle of plan.cutFaces) {
        if (
          !Number.isInteger(triangle) ||
          triangle < 0 ||
          triangle >= host.indices.length / 3
        )
          throw new Error(
            "A component cut must name a resident host triangle.",
          );
        if (removed.has(triangle))
          throw new Error(
            "Portrait components cannot cut the same host triangle.",
          );
        removed.add(triangle);
      }
    const cage: IControlMesh = {
      positions: source.map((point) => [...point]),
      indices: [] as number[],
      groups: [] as number[],
    };
    for (let i = 0; i < host.indices.length; i += 3) {
      if (removed.has(i / 3)) continue;
      cage.indices.push(...host.indices.slice(i, i + 3));
      cage.groups.push(0);
    }
    const regions = [{ id: "head", material: "skin" }];
    const region = (id: string, material: string): number => {
      if (regions.some((entry) => entry.id === id))
        throw new Error("A component skin region must have a unique identity.");
      return regions.push({ id, material }) - 1;
    };
    // Attachers append shared topology now and return closures for interiors.
    // Those closures are invoked only after the complete skin has been refined.
    const finishers = plans.map((plan) => plan.attach(cage, source, region));
    if (cage.groups.length * 3 !== cage.indices.length)
      throw new Error(
        "Every attached skin triangle needs one material region.",
      );
    if (
      cage.groups.some(
        (group) =>
          !Number.isInteger(group) || group < 0 || group >= regions.length,
      )
    )
      throw new Error("Component skin must use a registered material region.");
    const continuation =
      anatomy.performance === undefined
        ? cage
        : {
            positions: cage.positions.map((point, vertex) =>
              finiteContinuationPoint(
                anatomy.performance!.reference([...point], vertex),
              ),
            ),
            indices: [] as number[],
            groups: [] as number[],
          };
    const firstContinuation = cage.positions.length;
    const collar = appendPortraitCranium(continuation, anatomy.cranium);
    const neckCrop = appendPortraitNeck(continuation, collar, anatomy.neck);
    if (anatomy.performance !== undefined) {
      for (const point of continuation.positions.slice(firstContinuation))
        cage.positions.push(
          finiteContinuationPoint(anatomy.performance.pose([...point])),
        );
      cage.indices.push(...continuation.indices);
      cage.groups.push(...continuation.groups);
    }
    assertPortraitSkinTopology(cage, [
      neckCrop,
      ...finishers.flatMap((attached) => attached.openings),
    ]);
    return { cage, regions, finishers, source };
  };
  const { cage, regions, finishers, source } = assemble(
    host,
    components,
    anatomy,
  );
  const appearance = anatomy.appearance;
  if (
    appearance !== undefined &&
    (appearance.components.length !== components.length ||
      components.some(
        (component, i) => component.id !== appearance.components[i].id,
      ))
  )
    throw new Error(
      "Skin colour reference must retain component identities and order.",
    );
  const reference =
    appearance === undefined
      ? undefined
      : assemble(appearance.host, appearance.components, {
          cranium: anatomy.cranium,
          neck: anatomy.neck,
          performance: appearance.performance,
        });
  if (reference !== undefined) {
    assertCorrespondingCages(cage, reference.cage);
    const currentCurves = finishers.flatMap((part) => part.curves ?? []);
    const referenceCurves = reference.finishers.flatMap(
      (part) => part.curves ?? [],
    );
    if (
      currentCurves.length !== referenceCurves.length ||
      currentCurves.some(
        (curve, i) =>
          curve.length !== referenceCurves[i].length ||
          curve.some((id, j) => id !== referenceCurves[i][j]),
      )
    )
      throw new Error("Skin colour reference must retain subdivision curves.");
    if (
      regions.length !== reference.regions.length ||
      regions.some(
        (region, i) =>
          region.id !== reference.regions[i].id ||
          region.material !== reference.regions[i].material,
      )
    )
      throw new Error(
        "Skin colour reference must retain component region identities.",
      );
    cage.reference = reference.cage.positions;
  }
  const replacements = finishers.flatMap((attached, index) => {
    const current = attached.replacements ?? [];
    if (reference === undefined) return current;
    const originals = reference.finishers[index].replacements ?? [];
    if (current.length !== originals.length)
      throw new Error(
        "Skin colour reference must retain replacement identities.",
      );
    return current.map((replacement, i) => {
      const original = originals[i];
      if (replacement.group !== original.group)
        throw new Error(
          "Skin colour reference must retain replacement regions.",
        );
      return {
        group: replacement.group,
        append: (mesh: IControlMesh, boundary: readonly number[]) => {
          const originalMesh: IControlMesh = {
            positions: mesh.reference!.map((p) => [...p]),
            indices: [...mesh.indices],
            groups: [...mesh.groups],
          };
          replacement.append(mesh, boundary);
          original.append(originalMesh, boundary);
          assertCorrespondingCages(mesh, originalMesh);
          mesh.reference = originalMesh.positions;
        },
      };
    });
  });
  const surface = applyPortraitFinalSurfaces(
    applyPortraitRegionReplacements(
      applyPortraitSurfaceLayers(
        subdivideControlMesh(
          cage,
          rounds,
          finishers.flatMap((attached) => attached.curves ?? []),
        ),
        surfaceLayers,
      ),
      replacements,
    ),
    finishers.flatMap((attached, index) =>
      attached.finalSurface === undefined
        ? []
        : [
            {
              id: components[index].id,
              propose: attached.finalSurface,
            },
          ],
    ),
  );
  if (appearance !== undefined)
    surface.colors = surface.reference!.map((point) => {
      const rgb = appearance.sample(point);
      if (
        rgb.length !== 3 ||
        rgb.some((v) => !Number.isFinite(v) || v < 0 || v > 1)
      )
        throw new Error("Skin colour must return finite linear RGB in [0,1].");
      return [...rgb];
    });
  return { surface, regions, finishers, source };
}

function assertCorrespondingCages(
  current: IControlMesh,
  reference: IControlMesh,
): void {
  if (
    current.positions.length !== reference.positions.length ||
    current.indices.length !== reference.indices.length ||
    current.indices.some((id, i) => id !== reference.indices[i]) ||
    current.groups.length !== reference.groups.length ||
    current.groups.some((id, i) => id !== reference.groups[i])
  )
    throw new Error(
      "Skin colour reference and performance must share control topology.",
    );
}

function finiteContinuationPoint(point: number[]): number[] {
  if (point.length !== 3 || !point.every(Number.isFinite))
    throw new Error("Head continuation must return finite XYZ millimetres.");
  return [...point];
}

