import type { IAutoMovieProductionDesignGraph } from "./IAutoMovieProductionDesignGraph";
import { validateProductionDesignText } from "./validateProductionDesignText";
import { validateProductionDesignInvalid } from "./validateProductionDesignInvalid";
import { validateProductionDesignArchetypeNames } from "./validateProductionDesignArchetypeNames";
import { validateProductionDesignModelProfiles } from "./validateProductionDesignModelProfiles";
import { validateProductionDesignUnique } from "./validateProductionDesignUnique";
import { validateProductionDesignPositive } from "./validateProductionDesignPositive";
import { validateProductionDesignMissing } from "./validateProductionDesignMissing";
import { validateProductionDesignUniqueTextValues } from "./validateProductionDesignUniqueTextValues";
import { IAutoMovieDiagnostic } from "@automovie/interface";
import { AutoMovieModelArchetypeRegistry } from "./productionArchetypes";
import { encodeAutoMoviePathSegment } from "./contentIdentity";
import { IAutoMovieModelArchetype } from "@automovie/archetypes";
import { validateModelParameters } from "./validateModelParameters";

/**
 * Check each keyed model's identity, registered archetype, parameters, profiles, single-material palette, ordered LOD, capability and attachment claims.
 *
 * @evidence contracts/common.md#principled-implementation Schema-admitted keyed recipes undergo exact identity, catalogue lookup, parameter/profile admission, one-swatch color, ordered LOD membership and declared capability/bone checks. Unknown archetypes retain their diagnostic and skip only catalogue-dependent checks; current map/registry facts remain the premise and no geometry is built or replaced.
 * @evidence contracts/common.md#clear-and-simple-design This recipe pass owns keyed identity, palette cardinality, LOD order and catalogue capability/bone references; parameter planning and profile semantics stay with their respective validators.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Retained declaration limits, identity comparisons and numerical policies decide admission; no consumer fixture, expected result or foreign-method replacement changes the decision.
 * @evidence contracts/common.md#meaningful-documentation Defines registered-archetype skip boundaries, one-swatch policy, near-to-far LOD and attachment limits; sharedRoot supplies record paths and findings append without invoking geometry builders or changing recipes.
 * @evidence contracts/performance.md#efficient-algorithms Model fields and nested LOD/profile/capability/attachment lists are scanned; catalogue capability/bone searches and parameter-plan costs remain included.
 * @evidence contracts/performance.md#reuse-equivalent-work One archetype lookup supplies parameter, capability and attachment checks for a recipe; LOD/attachment/capability Sets share local membership while no prior graph or strategy verdict is cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Palette entry/key arrays, local identity Sets and delegated parameter/profile temporaries scale with declarations; findings remain in the caller's array without a diagnostic cap. No builder geometry, native handle or task is acquired here.
 */
export function validateProductionDesignModels(diagnostics: IAutoMovieDiagnostic[], graph: IAutoMovieProductionDesignGraph, sharedRoot: string, archetypes: AutoMovieModelArchetypeRegistry): void {
for (const [id, model] of graph.models) {
    const target: string = `model:${id}`;
    const file: string = `${sharedRoot}/models/${encodeAutoMoviePathSegment(id)}.json`;
    validateProductionDesignText(diagnostics, model.id, target, file, "id");
    if (model.id !== id)
      validateProductionDesignInvalid(
        diagnostics,
        "design-identity-mismatch",
        target,
        file,
        `Model file identity is "${id}" but value id is "${model.id}". Rewrite the model as a tracked model recipe using one matching id.`,
      );
    if (model.asset !== undefined)
      validateProductionDesignText(diagnostics, model.asset, target, file, "asset");
    validateProductionDesignText(diagnostics, model.archetype, target, file, "archetype");
    // Parameter, capability and attachment checks needing a catalogue entry
    // remain unavailable for an unregistered archetype; independent recipe
    // checks still collect their own diagnostics.
    const archetype: IAutoMovieModelArchetype | undefined = archetypes.get(model.archetype);
    if (archetype === undefined)
      validateProductionDesignInvalid(
        diagnostics,
        "model-archetype-unregistered",
        target,
        file,
        `Model archetype "${model.archetype}" is not registered with this builder. Name a registered archetype (${validateProductionDesignArchetypeNames(archetypes)}) in the tracked model recipe record, or register a builder for "${model.archetype}" before compiling.`,
      );
    validateProductionDesignModelProfiles(diagnostics, model.profiles ?? [], target, file);
    validateModelParameters(diagnostics, model, archetype, target, file);
    const paletteSize: number = Object.keys(model.palette).length;
    if (paletteSize === 0)
      validateProductionDesignInvalid(
        diagnostics,
        "design-collection-empty",
        target,
        file,
        "palette must contain one named #RRGGBB material color. Add it in the tracked model recipe record.",
      );
    else if (paletteSize > 1)
      validateProductionDesignInvalid(
        diagnostics,
        "design-collection-cardinality-invalid",
        target,
        file,
        "palette must contain exactly one material color in the foundation builder. Split visually distinct materials into separate recipes until semantic part-role binding is implemented.",
      );
    const lodTiers: Set<string> = new Set<string>();
    if (model.lod.length === 0)
      validateProductionDesignInvalid(
        diagnostics,
        "design-collection-empty",
        target,
        file,
        "lod must contain at least one representation. Add a hero, near, or far tier in the tracked model recipe record.",
      );
    let previousDistance: number = 0;
    let previousTier: number = -1;
    for (const [index, lod] of model.lod.entries()) {
      validateProductionDesignUnique(diagnostics, lodTiers, lod.tier, target, file, "lod");
      const tier: number = ["hero", "near", "far"].indexOf(lod.tier);
      if (tier <= previousTier)
        validateProductionDesignInvalid(
          diagnostics,
          "model-lod-order-invalid",
          target,
          file,
          `LOD tier "${lod.tier}" is out of near-to-far order. Order unique tiers as hero, near, then far in the tracked model recipe record.`,
        );
      previousTier = tier;
      if (lod.maxDistance === null) {
        if (index !== model.lod.length - 1)
          validateProductionDesignInvalid(
            diagnostics,
            "model-lod-order-invalid",
            target,
            file,
            `Unbounded LOD tier "${lod.tier}" is not final. Move it to the end or give it a finite maxDistance in the tracked model recipe record.`,
          );
      } else {
        validateProductionDesignPositive(diagnostics, lod.maxDistance, target, file, "lod.maxDistance");
        if (
          Number.isFinite(lod.maxDistance) &&
          lod.maxDistance <= previousDistance
        )
          validateProductionDesignInvalid(
            diagnostics,
            "model-lod-order-invalid",
            target,
            file,
            `LOD maxDistance ${lod.maxDistance} is not above prior distance ${previousDistance}. Increase it in the tracked model recipe record.`,
          );
        previousDistance = lod.maxDistance;
      }
      if (lod.recipe !== id && graph.models.has(lod.recipe) === false)
        validateProductionDesignMissing(
          diagnostics,
          target,
          file,
          `LOD recipe "${lod.recipe}"`,
          `Create or correct the model recipe record for "${lod.recipe}" or change ${id}.lod`,
        );
    }
    for (const [name, color] of Object.entries(model.palette)) {
      validateProductionDesignText(diagnostics, name, target, file, "palette.name");
      validateProductionDesignText(diagnostics, color, target, file, `palette.${name}`);
      if (/^#[0-9a-f]{6}$/i.test(color) === false)
        validateProductionDesignInvalid(
          diagnostics,
          "design-color-invalid",
          target,
          file,
          `Palette color "${color}" is not a six-digit hexadecimal sRGB color. Use #RRGGBB in the tracked model recipe record.`,
        );
    }
    validateProductionDesignUniqueTextValues(
      diagnostics,
      model.capabilities,
      target,
      file,
      "capabilities",
    );
    for (const capability of model.capabilities)
      if (
        archetype !== undefined &&
        archetype.capabilities.includes(capability) === false
      )
        validateProductionDesignInvalid(
          diagnostics,
          "design-capability-unsupported",
          target,
          file,
          `Model capability "${capability}" is not implemented for archetype "${model.archetype}". Remove the claim or implement and register its deterministic source/runtime binding before compilation.`,
        );
    const attachmentIds: Set<string> = new Set<string>();
    for (const attachment of model.attachments) {
      validateProductionDesignUnique(
        diagnostics,
        attachmentIds,
        attachment.id,
        target,
        file,
        "attachments",
      );
      validateProductionDesignText(diagnostics, attachment.bone, target, file, "attachments.bone");
      if (
        archetype !== undefined &&
        archetype.bones.length !== 0 &&
        archetype.bones.includes(attachment.bone) === false
      )
        validateProductionDesignInvalid(
          diagnostics,
          "design-attachment-unsupported",
          target,
          file,
          `Attachment "${attachment.id}" names bone "${attachment.bone}", which the builder-owned skeleton of archetype "${model.archetype}" does not materialize. Use one of ${archetype.bones.join(", ")} or remove the attachment.`,
        );
    }
    if (
      archetype !== undefined &&
      archetype.bones.length === 0 &&
      model.attachments.length !== 0
    )
      validateProductionDesignInvalid(
        diagnostics,
        "design-attachment-unsupported",
        target,
        file,
        `Archetype "${model.archetype}" builds no builder-owned skeleton for bone attachments. Remove attachments or name an archetype whose builder owns one.`,
      );
  }
}
