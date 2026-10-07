import { forgeProp } from "@automovie/engine";
import { IAutoMoviePropSpec } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { FILM_IMPORTED_PROP_BYTES } from "../internal/FILM_IMPORTED_PROP_BYTES";
import { assertFilmImportedLodClosure } from "../internal/assertFilmImportedLodClosure";
import { createImportedPropSpec } from "../internal/createImportedPropSpec";
import { filmImportedPropDigest as digest } from "../internal/filmImportedPropDigest";
import { createSkeleton } from "../internal/fixtures";
import { namedFacts } from "../internal/predicates";
import { createDoorPropSpec } from "./test_film_forge_prop";

const HERO_BYTES = FILM_IMPORTED_PROP_BYTES.hero;
const SIDECAR_BYTES = FILM_IMPORTED_PROP_BYTES.sidecar;

/** Forge a fresh imported chair after one mutation, so cases never compound. */
const refuses = (
  mutate: (spec: IAutoMoviePropSpec) => void,
  path: string,
  message: string,
): boolean => {
  const spec = createImportedPropSpec();
  mutate(spec);
  const result = forgeProp(spec);
  return (
    result.success === false &&
    result.violations.some(
      (item) => item.path === path && item.expected.includes(message),
    )
  );
};

/** The same mutation, asserted to leave the prop forgeable. */
const tolerated = (mutate: (spec: IAutoMoviePropSpec) => void): boolean => {
  const spec = createImportedPropSpec();
  mutate(spec);
  return forgeProp(spec).success;
};

/**
 * A prop may draw a registered external appearance, and stating that reference
 * opens the origin gate exactly as far as the record can be checked: the
 * reference must classify something, the media must be a kind a prop can be,
 * and the builder-sealed byte closure must be internally coherent. Nothing the
 * prop means moves out of the spec, and a prop that names no reference keeps
 * the generated contract it always had, message for message.
 *
 * Scenarios:
 *
 * 1. The imported chair forges and the accepted spec is echoed for the staging
 *    join, carrying its reference, its body, and its seat affordance.
 * 2. Regression on the generated contract: the canonical generated door still
 *    forges, and the same imported model with no reference (absent field and an
 *    explicit `null` alike) still reports the original `origin must be
 *    "generated"` violation verbatim, at the original path.
 * 3. A reference that is blank classifies nothing, and a generated model that
 *    cites one references bytes nothing draws; both are refused by name.
 * 4. A reference with no bytes behind it is refused: a null `asset`, and an absent
 *    builder-sealed closure, which stops the closure gates rather than
 *    reporting each of them against a record that is not there.
 * 5. Wrong media is refused: a humanoid ingest profile is a performer and goes
 *    through forgeCast, a rigid appearance maps no humanoid bones, and neither
 *    does any of its levels.
 * 6. The sealed byte ledger is refused when a path is blank, when one path is
 *    sealed twice, and when a digest is not `sha256:` plus 64 lowercase hex
 *    digits; the boundary case of 63 digits and the case of uppercase digits
 *    are each refused.
 * 7. The LOD closure is refused when a level repeats, when a level disagrees with
 *    the appearance's profile, when a level's digest is malformed, when a level
 *    reads a path the ledger seals under a different digest (and a malformed
 *    digest is not also reported as that disagreement), when a level binds
 *    bytes the ledger does not cover, when there is no hero at all, and when
 *    the hero binds bytes other than the ones the prop draws.
 * 8. An imported appearance changes none of the other prop contracts: a skeleton
 *    still makes it an actor, a model id still has to equal the node,
 *    `validateModel` still judges the deterministic proxy it left behind, and
 *    the door's own hinge articulation both rides on it and is still gated on
 *    it, so the reference buys the pixels and not an exemption.
 */
export const test_film_prop_imported_appearance = (): void => {
  const forged = forgeProp(createImportedPropSpec());
  TestValidator.equals(
    "an imported chair forges",
    forged.success === true
      ? {
          node: forged.prop.node,
          modelRef: forged.prop.modelRef,
          origin: forged.prop.model.origin,
          mass: forged.prop.model.body?.mass ?? null,
          affordance: forged.prop.model.affordances?.[0]?.kind ?? null,
        }
      : null,
    {
      node: "chair",
      modelRef: "chair-recipe",
      origin: "imported",
      mass: 6,
      affordance: "stack-top",
    },
  );

  TestValidator.equals(
    "a prop naming no reference keeps the generated contract",
    namedFacts([
      [
        "generatedDoorStillForges",
        () => forgeProp(createDoorPropSpec()).success,
      ],
      [
        "importedWithoutReferenceIsRefusedVerbatim",
        () => {
          const spec = createImportedPropSpec();
          delete spec.modelRef;
          const result = forgeProp(spec);
          return (
            result.success === false &&
            result.violations.some(
              (item) =>
                item.path === "$input.model.origin" &&
                item.expected ===
                  'a forged prop\'s origin must be "generated", but was "imported"',
            )
          );
        },
      ],
      [
        "anExplicitNullReferenceIsTheSameSilence",
        () => {
          const spec = createImportedPropSpec();
          spec.modelRef = null;
          const result = forgeProp(spec);
          return (
            result.success === false &&
            result.violations.some(
              (item) =>
                item.path === "$input.model.origin" &&
                item.expected ===
                  'a forged prop\'s origin must be "generated", but was "imported"',
            )
          );
        },
      ],
      [
        "aGeneratedPropNamingNoReferenceIsNotJudgedAsImported",
        () => {
          const spec = createDoorPropSpec();
          const result = forgeProp(spec);
          return result.success === true && (spec.modelRef ?? null) === null;
        },
      ],
    ]),
    {
      generatedDoorStillForges: true,
      importedWithoutReferenceIsRefusedVerbatim: true,
      anExplicitNullReferenceIsTheSameSilence: true,
      aGeneratedPropNamingNoReferenceIsNotJudgedAsImported: true,
    },
  );

  TestValidator.equals(
    "the reference itself, and the bytes behind it, are gated",
    namedFacts([
      [
        "blankReference",
        () =>
          refuses(
            (spec) => (spec.modelRef = "   "),
            "$input.modelRef",
            "an empty reference classifies nothing",
          ),
      ],
      [
        "generatedModelCitingAReference",
        () =>
          refuses(
            (spec) => (spec.model.origin = "generated"),
            "$input.model.origin",
            'its origin must be "imported", but was "generated"',
          ),
      ],
      [
        "nullAsset",
        () =>
          refuses(
            (spec) => (spec.model.asset = null),
            "$input.model.asset",
            "must name the binary payload",
          ),
      ],
      [
        "absentSealedClosure",
        () =>
          refuses(
            (spec) => delete spec.model.imported,
            "$input.model.imported",
            "carries no builder-sealed ingest closure",
          ),
      ],
      [
        "anAbsentClosureStopsTheClosureGates",
        () => {
          const spec = createImportedPropSpec();
          delete spec.model.imported;
          const result = forgeProp(spec);
          return (
            result.success === false &&
            result.violations.every(
              (item) => !item.path.startsWith("$input.model.imported."),
            )
          );
        },
      ],
    ]),
    {
      blankReference: true,
      generatedModelCitingAReference: true,
      nullAsset: true,
      absentSealedClosure: true,
      anAbsentClosureStopsTheClosureGates: true,
    },
  );

  TestValidator.equals(
    "wrong media and a malformed byte ledger are refused",
    namedFacts([
      [
        "humanoidProfileIsAPerformer",
        () =>
          refuses(
            (spec) => {
              spec.model.imported!.profile = "vrm-humanoid-v1";
              spec.model.imported!.lod[0]!.profile = "vrm-humanoid-v1";
            },
            "$input.model.imported.profile",
            "goes through forgeCast",
          ),
      ],
      [
        "appearanceMappingHumanoidBones",
        () =>
          refuses(
            (spec) =>
              spec.model.imported!.humanoidBones.push({
                bone: "hips",
                node: 3,
                weighted: true,
              }),
            "$input.model.imported.humanoidBones",
            "maps no humanoid bones",
          ),
      ],
      [
        "levelMappingHumanoidBones",
        () =>
          refuses(
            (spec) =>
              spec.model.imported!.lod[0]!.humanoidBones.push({
                bone: "hips",
                node: 3,
                weighted: false,
              }),
            "$input.model.imported.lod[0].humanoidBones",
            "maps no humanoid bones",
          ),
      ],
      [
        "blankLedgerPath",
        () =>
          refuses(
            (spec) => (spec.model.imported!.assets[1]!.path = " "),
            "$input.model.imported.assets[1].path",
            "non-empty project-relative path",
          ),
      ],
      [
        "duplicatedLedgerPath",
        () =>
          refuses(
            (spec) =>
              spec.model.imported!.assets.push({
                path: HERO_BYTES,
                digest: digest("c"),
              }),
            "$input.model.imported.assets[2].path",
            "is declared twice",
          ),
      ],
      [
        "aBlankPathIsNotAlsoCalledADuplicate",
        () => {
          const spec = createImportedPropSpec();
          spec.model.imported!.assets[0]!.path = "";
          spec.model.imported!.assets[1]!.path = "";
          const result = forgeProp(spec);
          return (
            result.success === false &&
            result.violations.every(
              (item) => !item.expected.includes("is declared twice"),
            )
          );
        },
      ],
      [
        "shortLedgerDigest",
        () =>
          refuses(
            (spec) =>
              (spec.model.imported!.assets[1]!.digest = `sha256:${"b".repeat(63)}`),
            "$input.model.imported.assets[1].digest",
            "64 lowercase hexadecimal digits",
          ),
      ],
      [
        "uppercaseLedgerDigest",
        () =>
          refuses(
            (spec) =>
              (spec.model.imported!.assets[1]!.digest = `sha256:${"B".repeat(64)}`),
            "$input.model.imported.assets[1].digest",
            "64 lowercase hexadecimal digits",
          ),
      ],
    ]),
    {
      humanoidProfileIsAPerformer: true,
      appearanceMappingHumanoidBones: true,
      levelMappingHumanoidBones: true,
      blankLedgerPath: true,
      duplicatedLedgerPath: true,
      aBlankPathIsNotAlsoCalledADuplicate: true,
      shortLedgerDigest: true,
      uppercaseLedgerDigest: true,
    },
  );

  assertFilmImportedLodClosure({
    createImportedPropSpec,
    refuses,
    tolerated,
    digest,
    SIDECAR_BYTES,
  });

  TestValidator.equals(
    "every other prop contract still holds over an imported appearance",
    namedFacts([
      [
        "aSkeletonStillMakesItAnActor",
        () =>
          refuses(
            (spec) => (spec.model.skeleton = createSkeleton()),
            "$input.model.skeleton",
            "riggable actors go through forgeCast",
          ),
      ],
      [
        "theModelIdStillHasToEqualTheNode",
        () =>
          refuses(
            (spec) => (spec.model.id = "chair-recipe"),
            "$input.model.id",
            "the staged scene joins on it",
          ),
      ],
      [
        "validateModelStillJudgesTheProxy",
        () =>
          refuses(
            (spec) =>
              (spec.model.parts[0]!.geometry = {
                type: "primitive",
                shape: { type: "box", width: 0, height: 0.9, depth: 0.5 },
              }),
            "$input.model.parts[0].geometry.shape.width",
            "must be a finite number > 0",
          ),
      ],
      [
        "anImportedPropMayStillArticulate",
        () =>
          tolerated(
            (spec) => (spec.articulation = createDoorPropSpec().articulation),
          ),
      ],
      [
        "andItsArticulationIsStillGated",
        () =>
          refuses(
            (spec) => {
              const articulation = createDoorPropSpec().articulation!;
              articulation.binding.boneMap.pivot = "ghost";
              spec.articulation = articulation;
            },
            '$input.articulation.binding.boneMap["pivot"]',
            "which is not a declared articulation node",
          ),
      ],
    ]),
    {
      aSkeletonStillMakesItAnActor: true,
      theModelIdStillHasToEqualTheNode: true,
      validateModelStillJudgesTheProxy: true,
      anImportedPropMayStillArticulate: true,
      andItsArticulationIsStillGated: true,
    },
  );
};
