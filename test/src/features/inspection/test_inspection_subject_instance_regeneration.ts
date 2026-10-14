import { describeAutoMovieSubject } from "../../../../packages/engine/src/describeAutoMovieSubject";
import { instanceSlot } from "../../../../packages/engine/src/populationRuntime/instanceSlot";
import { materializeCompiledInstanceSet } from "../../../../packages/engine/src/populationRuntime/materializeCompiledInstanceSet";
import { productionRuntimeModelId } from "../../../../packages/engine/src/productionRuntimeModelId";
import { IAutoMovieCompiledInstanceSet, IAutoMovieInstanceSetDesign, IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { namedFacts } from "../internal/namedFacts";
import { nclose } from "../internal/nclose";
import { vclose } from "../internal/vclose";
import { throwsError } from "../internal/throwsError";
import { subjectInspectionArtifact } from "../internal/subjectInspectionArtifact";
import { type IAutoMovieSubjectArtifact, type IAutoMovieSubjectDescription, type IAutoMovieInstanceSlot } from "../../../../packages/interface/src/index";
/** What a description and the regenerator each say about one member. */
interface IMemberFacts {
  id: string;
  semanticKind: string | undefined;
  model: string | null;
  translation: IAutoMovieVector3 | undefined;
  rotation: IAutoMovieQuaternion | undefined;
  scale: IAutoMovieVector3 | undefined;
}

/** Sixty-four scattered trees drawing the base and two declared variants, with per-axis scale and a seeded tilt. */
const orchard: () => IAutoMovieInstanceSetDesign = (): IAutoMovieInstanceSetDesign => ({
  id: "orchard",
  modelRecipe: "tree",
  prototypes: [
    { id: "sapling", modelRecipe: "sapling", weight: 1 },
    { id: "stump", modelRecipe: "stump", weight: 0.5 },
  ],
  count: 64,
  layout: { kind: "scatter", radius: 12 },
  anchor: { x: 3, y: 0.5, z: -4 },
  facingDeg: 37,
  seed: 20_260_912,
  variation: {
    scale: { min: 0.65, max: 1.35 },
    scale3: {
      min: { x: 0.7, y: 0.9, z: 0.6 },
      max: { x: 1.3, y: 1.6, z: 1.1 },
    },
    rotationDeg: {
      x: { min: -4, max: 4 },
      y: { min: -30, max: 30 },
      z: { min: -6, max: 6 },
    },
    palette: ["#446633"],
    traits: [],
  },
});

/** Twelve shrubs in a grid turned a quarter turn, with nothing but a uniform scale range. */
const hedge: () => IAutoMovieInstanceSetDesign = (): IAutoMovieInstanceSetDesign => ({
  id: "hedge",
  modelRecipe: "shrub",
  count: 12,
  layout: { kind: "grid", rows: 3, columns: 4, spacing: { x: 1.5, z: 2 } },
  anchor: { x: -2, y: 0, z: 6 },
  facingDeg: 90,
  seed: 7,
  variation: {
    scale: { min: 0.8, max: 1.25 },
    palette: ["#335522"],
    traits: [],
  },
});

/**
 * A described instance member is the member its compiled set regenerates.
 *
 * Subject inspection answers where one member of a compact instance set stands,
 * how it is turned and scaled, which prototype it drew and which model draws it.
 * The formation determinism contract makes a one-member answer the transform
 * and state the full compiled runtime holds, so the description is pinned to
 * the engine's one instance-member regenerator for every slot rather than to
 * numbers read off either implementation. A second copy of that member law in
 * the description interpolated a seeded sample in another form, drifted from it
 * in the last bit of scale, and described members the regenerator refuses.
 *
 * Scenarios:
 *
 * 1. Every member of a scattered set with a prototype table, per-axis scale and
 *    a seeded rotation range is described with the regenerator's node,
 *    prototype, translation, rotation and per-axis scale, and with the runtime
 *    model of the prototype it drew.
 * 2. Every member of a plain grid set, whose regenerated member names no
 *    prototype, rotation or per-axis scale, is described with the regenerator's
 *    node and translation, as the default prototype with the set's runtime
 *    model, and with its one scale on all three axes.
 * 3. That plain member is turned by the set heading about +Y: a quarter turn is
 *    the quaternion (0, sqrt(1/2), 0, sqrt(1/2)).
 * 4. The comparison discriminates: the varied set's members carry a rotation and
 *    a per-axis scale to compare, and a member's description is not its
 *    neighbour's regenerated place or scale.
 * 5. A hand-edited set whose palette is empty refuses description with the
 *    regenerator's refusal, while its twin with a swatch is described.
 *
 * @evidence contracts/testing.md#behavioral-verification Describes every scattered/grid slot and checks discrete identity plus exact finite coordinate parity with the compiled regenerator; a neighboring transform, lost per-axis scale or divergent empty-palette admission fails.
 * @evidence contracts/testing.md#independent-expectations Slot comparisons intentionally test consumer parity with instanceSlot, so a defect shared by both paths can pass. The independent quarter-turn quaternion and distinct-neighbor assertions supplement that oracle; zero-tolerance predicates preserve the existing exact regenerated-value requirement.
 * @evidence contracts/testing.md#distinguishing-cases Keeps all 64 varied members and 12 uniform-scale members, prototype/model identity, heading, neighbor placement/scale discrimination and empty-palette refusal with a swatch twin; malformed addresses and other layouts belong to instances.
 * @evidence contracts/testing.md#execution-ownership This exported test is discovered by the runner and directly calls materialization, member generation and description source with in-memory design records; it renders no trees, launches no host and proves no GPU appearance.
 */
export function test_inspection_subject_instance_regeneration(): void {
  const world: { routes: never[]; } = { routes: [] };
  const trees: IAutoMovieCompiledInstanceSet = materializeCompiledInstanceSet({
    instanceSet: orchard(),
    world,
  });
  const shrubs: IAutoMovieCompiledInstanceSet = materializeCompiledInstanceSet({
    instanceSet: hedge(),
    world,
  });
  const artifact: IAutoMovieSubjectArtifact = subjectInspectionArtifact({
    models: [],
    nodes: [],
    instanceSets: [trees, shrubs],
    environment: null,
  });
  const describe: (set: IAutoMovieCompiledInstanceSet, slot: number) => IAutoMovieSubjectDescription = (set: IAutoMovieCompiledInstanceSet, slot: number): IAutoMovieSubjectDescription  =>
    describeAutoMovieSubject(artifact, instanceSlot(set, slot).node);
  const described: (set: IAutoMovieCompiledInstanceSet, slot: number) => IMemberFacts = (
    set: IAutoMovieCompiledInstanceSet,
    slot: number,
  ): IMemberFacts => {
    const description: IAutoMovieSubjectDescription = describe(set, slot);
    return {
      id: description.id,
      semanticKind: description.semanticKind,
      model: description.model,
      translation: description.transform?.translation,
      rotation: description.transform?.rotation,
      scale: description.transform?.scale,
    };
  };

  TestValidator.predicate(
    "a varied member is described as its compiled set regenerates it",
    trees.count === 64 && Array.from({ length: trees.count }, (_: unknown, slot: number): boolean => {
      const member: IAutoMovieInstanceSlot = instanceSlot(trees, slot);
      return sameMemberFacts(described(trees, slot), {
        id: member.node,
        semanticKind: member.prototype,
        model: productionRuntimeModelId(member.modelRecipe),
        translation: member.position,
        rotation: member.rotation,
        scale: member.scale3,
      });
    }).every((matched: boolean): boolean => matched),
  );

  TestValidator.predicate(
    "a plain member is described with its regenerated place and one scale",
    shrubs.count === 12 && Array.from(
      { length: shrubs.count },
      (_: unknown, slot: number): boolean => {
        const member: IAutoMovieInstanceSlot = instanceSlot(shrubs, slot);
        return sameMemberFacts({ ...described(shrubs, slot), rotation: undefined }, {
          id: member.node,
          semanticKind: "default",
          model: productionRuntimeModelId("shrub"),
          translation: member.position,
          scale: { x: member.scale, y: member.scale, z: member.scale },
          rotation: undefined,
        });
      },
    ).every((matched: boolean): boolean => matched),
  );

  const turned: IAutoMovieQuaternion | undefined = described(shrubs, 5).rotation;
  const barren: IAutoMovieCompiledInstanceSet = {
    ...shrubs,
    id: "barren",
    variation: { ...shrubs.variation, palette: [] },
  };
  TestValidator.equals(
    "a described member is compared with its own regenerated state",
    namedFacts([
      [
        "variedShape",
        (): boolean  =>
          describe(trees, 0).transform !== null &&
          instanceSlot(trees, 0).rotation !== undefined &&
          instanceSlot(trees, 0).scale3 !== undefined,
      ],
      [
        "neighbourPlace",
        (): boolean  =>
          !sameVector(describe(trees, 0).transform?.translation,
            instanceSlot(trees, 1).position),
      ],
      [
        "neighbourScale",
        (): boolean  =>
          !sameVector(describe(trees, 0).transform?.scale,
            instanceSlot(trees, 1).scale3),
      ],
      [
        "plainHeading",
        (): boolean  =>
          turned !== undefined &&
          nclose(turned.x, 0, 1e-15) &&
          nclose(turned.y, Math.SQRT1_2, 1e-15) &&
          nclose(turned.z, 0, 1e-15) &&
          nclose(turned.w, Math.SQRT1_2, 1e-15),
      ],
      [
        "emptyPaletteRefuses",
        (): boolean  =>
          throwsError(
            (): IAutoMovieSubjectDescription  =>
              describeAutoMovieSubject(
                subjectInspectionArtifact({
                  models: [],
                  nodes: [],
                  instanceSets: [barren],
                  environment: null,
                }),
                "instance:barren:slot:000000",
              ),
            'Instance set "barren" slot 0 derived non-finite variation or an empty palette.',
          ),
      ],
      [
        "swatchTwinDescribed",
        (): boolean  =>
          describeAutoMovieSubject(artifact, "instance:hedge:slot:000000")
            .kind === "instance",
      ],
    ]),
    {
      variedShape: true,
      neighbourPlace: true,
      neighbourScale: true,
      plainHeading: true,
      emptyPaletteRefuses: true,
      swatchTwinDescribed: true,
    },
  );
}

/** Preserve the exact-coordinate parity contract without structural float equality. */
function sameVector(a: IAutoMovieVector3 | undefined, b: IAutoMovieVector3 | undefined): boolean {
  return a === undefined || b === undefined ? a === b : vclose(a, b, 0);
}

/** Identity is discrete; regenerated coordinates and quaternion signs must match exactly. */
function sameMemberFacts(a: IMemberFacts, b: IMemberFacts): boolean {
  const rotationMatches: boolean = a.rotation === undefined || b.rotation === undefined
    ? a.rotation === b.rotation
    : nclose(a.rotation.x, b.rotation.x, 0) && nclose(a.rotation.y, b.rotation.y, 0) &&
      nclose(a.rotation.z, b.rotation.z, 0) && nclose(a.rotation.w, b.rotation.w, 0);
  return a.id === b.id && a.semanticKind === b.semanticKind && a.model === b.model &&
    sameVector(a.translation, b.translation) && sameVector(a.scale, b.scale) && rotationMatches;
}
