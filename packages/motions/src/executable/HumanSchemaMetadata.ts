/**
 * Numeric admission rules layered over typia's schemas of the canonical plain-number contracts.
 * lexiconSchemas applies the versioned metadata before writing any generated output.
 * The adapter mutates generated schema nodes, including shared referenced components;
 * it does not validate action parameters or change the already shipped schema data.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Separates schema generation from runtime parameter validation and states the generated-node mutation.
 * @evidence contracts/development/design.md#principled-representation A path tree stores only numeric refinements; the canonical types still determine object members, requiredness and alternatives.
 * @evidence contracts/development/design.md#minimal-and-owned-surface lexiconSchemas needs apply and its metadata records; capture supports translating an existing schema's numeric rules into this format.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Missing paths or incompatible number/array/union positions throw before the generator writes a file; no fallback removes a declared rule.
 */
export namespace HumanSchemaMetadata {
  /**
   * A generated schema JSON object, narrowed at each keyword boundary by this adapter.
   * @evidence contracts/development/common.md#meaningful-documentation Values are serialized schema keywords, not arbitrary domain objects or a hidden SDK instance.
   * @evidence contracts/development/design.md#principled-representation The adapter reads a small JSON keyword set and follows local references instead of copying typia's full type hierarchy.
   * @evidence contracts/development/design.md#minimal-and-owned-surface follow, shape, capture and apply read or update these records during generation.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts unknown values are narrowed before keyword-specific operations; the record has no executable behavior.
   */
  export interface ISchema {
    [key: string]: unknown;
  }

  /**
   * Metadata below one canonical field; omitted branches carry no numeric admission rule.
   * An empty object is an explicit boundary with no numeric refinements.
   * @evidence contracts/development/common.md#meaningful-documentation Distinguishes omitted child rules from an explicitly empty boundary.
   * @evidence contracts/development/design.md#principled-representation Properties, union branches, array items and tuple positions mirror the traversable schema paths without restating their shapes.
   * @evidence contracts/development/design.md#minimal-and-owned-surface capture produces these trees and apply consumes every supplied branch.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Union matching uses a structural key and occurrence index, not a generated component name that changes when a type moves.
   */
  export interface ITree {
    /** Numeric type, inclusive/exclusive bounds, default and x-unit originally declared by the law. */
    numeric?: ISchema;

    /** Object member names; a missing canonical member makes regeneration fail. */
    properties?: Record<string, ITree>;

    /** Union branches matched by structure rather than generated component names. */
    alternatives?: {
      /** Normalised type, const, required keys, property names and property const values, serialized by shape. */
      shape: string;
      /** Zero-based occurrence among branches with that same structural key; relative order must remain stable for indistinguishable branches. */
      occurrence: number;
      /** Numeric refinements below this branch. */
      tree: ITree;
    }[];

    /** Homogeneous array element metadata. */
    items?: ITree;

    /** Tuple element metadata by zero-based position. */
    prefixItems?: Record<string, ITree>;
  }

  /**
   * All supplied parameter boundaries, keyed by registered action and row name.
   * @evidence contracts/development/common.md#meaningful-documentation Separates full action inputs from row inputs after fixed-key omission.
   * @evidence contracts/development/design.md#principled-representation One version guards the path interpretation and both maps must exactly cover generated parameter boundaries.
   * @evidence contracts/development/design.md#minimal-and-owned-surface lexiconSchemas checks the version and compares each map with the generated names before writing.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Newly added and removed boundaries require deliberate metadata updates even when their numeric tree is empty.
   */
  export interface ICollection {
    /** Metadata format version; changing the path interpretation requires a new version. */
    version: number;

    /** Shipped action names and their parameter paths. */
    actions: Record<string, ITree>;

    /** Registered row names after fixed parameters have been omitted. */
    rows: Record<string, ITree>;
  }

  /**
   * Generated OpenAPI component schemas, keyed by component name.
   * @evidence contracts/development/common.md#meaningful-documentation Names the table used by local reference resolution.
   * @evidence contracts/development/design.md#principled-representation The table points to the existing generated schema objects; applying refinements updates those shared objects.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The generator passes collection.components.schemas to this adapter.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Missing components fail resolution rather than yielding an empty replacement schema.
   */
  export type Components = Record<string, ISchema>;

  /**
   * Follow local component references and return the same terminal schema object.
   * @param schema Borrowed schema or local component reference.
   * @param components Borrowed generated component table.
   * @returns Terminal schema, without cloning it.
   * @throws {Error} For a missing component or a cycle in the reference chain.
   * @evidence contracts/development/common.md#meaningful-documentation States borrowed identity and both reference failures.
   * @evidence contracts/development/implementation.md#principled-implementation Resolves the final reference path segment against the supplied component table while recording visited names.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One reference-chain loop.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Missing or cyclic references cannot silently lose metadata.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the reference-chain length.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Component tables are mutated during refinement, so no cross-call result cache is retained.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The visited-name set is released on return or failure.
   */
  export function follow(schema: ISchema, components: Components): ISchema {
    const seen: Set<string> = new Set();
    while (typeof schema.$ref === "string") {
      const name: string = schema.$ref.split("/").at(-1)!;
      if (seen.has(name)) throw new Error(`Cyclic schema reference ${name}`);
      seen.add(name);
      const found: ISchema | undefined = components[name];
      if (!found) throw new Error(`Missing schema component ${name}`);
      schema = found;
    }
    return schema;
  }

  /**
   * Shallow structural key for matching a union branch across canonical type renaming.
   * Integer and number share one key; numeric rules and generated reference names
   * are excluded. Equal keys are distinguished by their occurrence order in oneOf.
   * @param given Borrowed branch schema.
   * @param components Borrowed generated component table.
   * @returns Deterministic JSON key with UTF-16-sorted property and required names.
   * @evidence contracts/development/common.md#meaningful-documentation States which details are ignored and the ordering obligation for equal keys.
   * @evidence contracts/development/implementation.md#principled-implementation Type, constant discriminator, required names, property names and immediate property constants survive movement from tagged to canonical contracts.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Follow, collect the structural fields, sort and serialize.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts This key is not claimed to prove full schema equivalence; apply separately checks every metadata-bearing path.
   * @evidence contracts/development/implementation.md#efficient-algorithms Sorting is O(p log p) for p immediate properties or required names.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Branches are small generation-time records and may be refined between calls.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Temporary arrays are released after serialization; no schema is retained.
   */
  export function shape(given: ISchema, components: Components): string {
    const schema: ISchema = follow(given, components);
    const properties: Record<string, ISchema> = (schema.properties ??
      {}) as Record<string, ISchema>;
    return JSON.stringify({
      type: schema.type === "integer" ? "number" : schema.type,
      const: schema.const,
      required: Array.isArray(schema.required)
        ? [...schema.required].sort((left: string, right: string): number =>
            left < right ? -1 : left > right ? 1 : 0,
          )
        : undefined,
      properties: Object.keys(properties).sort(
        (left: string, right: string): number =>
          left < right ? -1 : left > right ? 1 : 0,
      ),
      discriminants: Object.entries(properties)
        .flatMap(([key, child]: [string, ISchema]): [string, unknown][] => {
          const own: ISchema = follow(child, components);
          return "const" in own ? [[key, own.const]] : [];
        })
        .sort(([a]: [string, unknown], [b]: [string, unknown]): number =>
          a.localeCompare(b),
        ),
    });
  }

  /**
   * Capture integer, bound, multiple, default and unit rules from a generated schema.
   * @param given Borrowed existing schema.
   * @param components Borrowed component table.
   * @param active Ancestors in this traversal; a repeated ancestor ends that branch.
   * @returns A numeric-rule tree, or undefined when this branch contains no rules.
   * @evidence contracts/development/common.md#meaningful-documentation States the captured keyword set, missing result and cycle stopping rule.
   * @evidence contracts/development/implementation.md#principled-implementation Walks properties, oneOf branches, homogeneous items and tuple items, retaining only nodes leading to numeric metadata.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One node's metadata followed by four child-location cases.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Structural fields remain in the schema; capture never converts them into a second domain contract.
   * @evidence contracts/development/implementation.md#efficient-algorithms Visits every reachable non-cyclic schema path; shared components can be visited once per incoming path to retain path-specific rules.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The ancestor set is path-local, since a shared component can occur at multiple metadata locations.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned tree contains only metadata and path keys; traversal sets are released after recursion.
   */
  export function capture(
    given: ISchema,
    components: Components,
    active: Set<ISchema> = new Set(),
  ): ITree | undefined {
    const schema: ISchema = follow(given, components);
    if (active.has(schema)) return undefined;
    const next: Set<ISchema> = new Set(active).add(schema);
    const tree: ITree = {};
    const keywords: string[] = [
      "minimum",
      "maximum",
      "exclusiveMinimum",
      "exclusiveMaximum",
      "multipleOf",
      "default",
      "x-unit",
    ];
    if (
      schema.type === "integer" ||
      keywords.some((key: string): boolean => key in schema)
    ) {
      const numeric: ISchema = {};
      if (schema.type === "number" || schema.type === "integer")
        numeric.type = schema.type;
      for (const key of keywords) if (key in schema) numeric[key] = schema[key];
      tree.numeric = numeric;
    }
    if (schema.properties && typeof schema.properties === "object")
      for (const [key, child] of Object.entries(schema.properties)) {
        const captured: ITree | undefined = capture(
          child as ISchema,
          components,
          next,
        );
        if (captured) (tree.properties ??= {})[key] = captured;
      }
    if (Array.isArray(schema.oneOf)) {
      const counts: Map<string, number> = new Map();
      for (const child of schema.oneOf) {
        const key: string = shape(child as ISchema, components);
        const occurrence: number = counts.get(key) ?? 0;
        counts.set(key, occurrence + 1);
        const captured: ITree | undefined = capture(
          child as ISchema,
          components,
          next,
        );
        if (captured)
          (tree.alternatives ??= []).push({
            shape: key,
            occurrence,
            tree: captured,
          });
      }
    }
    if (schema.items && typeof schema.items === "object") {
      const captured: ITree | undefined = capture(
        schema.items as ISchema,
        components,
        next,
      );
      if (captured) tree.items = captured;
    }
    if (Array.isArray(schema.prefixItems))
      for (let index: number = 0; index < schema.prefixItems.length; index++) {
        const captured: ITree | undefined = capture(
          schema.prefixItems[index] as ISchema,
          components,
          next,
        );
        if (captured) (tree.prefixItems ??= {})[String(index)] = captured;
      }
    return Object.keys(tree).length ? tree : undefined;
  }

  /**
   * Mutate generated nodes with a complete numeric metadata tree.
   * @param given Generated schema node, possibly a shared component reference.
   * @param tree Borrowed path tree to apply in full.
   * @param components Mutable generated component objects used for dereferencing.
   * @param location Diagnostic action/row path.
   * @throws {Error} For a missing or structurally incompatible metadata path.
   * Prior nodes may already be mutated on failure; lexiconSchemas discards the
   * generation and writes no output until every boundary succeeds.
   * @evidence contracts/development/common.md#meaningful-documentation States mutation, partial in-memory failure and the generator's output-write boundary.
   * @evidence contracts/development/implementation.md#principled-implementation Each declared path must still identify a compatible number, object member, union branch or array position before its refinements are assigned.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Numeric assignment followed by the four supported child-location cases.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A stale path throws; no numeric rule is dropped as a recovery strategy.
   * @evidence contracts/development/implementation.md#efficient-algorithms Work follows the metadata tree, with a scan of immediate oneOf branches for each refined alternative.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Generated objects are updated in place; caching a structural match across those updates would need separate invalidation.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds only recursive call state and temporary branch matches; no persistent cache.
   */
  export function apply(
    given: ISchema,
    tree: ITree,
    components: Components,
    location: string,
  ): void {
    const schema: ISchema = follow(given, components);
    if (tree.numeric) {
      if (
        tree.numeric.type &&
        schema.type !== "number" &&
        schema.type !== "integer"
      )
        throw new Error(
          `${location}: numeric metadata no longer names a numeric field`,
        );
      Object.assign(schema, tree.numeric);
    }
    for (const [key, child] of Object.entries(tree.properties ?? {})) {
      const properties: Record<string, ISchema> = (schema.properties ??
        {}) as Record<string, ISchema>;
      if (!properties[key])
        throw new Error(`${location}.${key}: metadata path no longer exists`);
      apply(properties[key], child, components, `${location}.${key}`);
    }
    for (const alternative of tree.alternatives ?? []) {
      if (!Array.isArray(schema.oneOf))
        throw new Error(`${location}: metadata union no longer exists`);
      const matching: ISchema[] = (schema.oneOf as ISchema[]).filter(
        (child: ISchema): boolean =>
          shape(child, components) === alternative.shape,
      );
      const child: ISchema | undefined = matching[alternative.occurrence];
      if (!child)
        throw new Error(
          `${location}: metadata union branch no longer exists (${alternative.shape})`,
        );
      apply(
        child,
        alternative.tree,
        components,
        `${location}|${alternative.occurrence}`,
      );
    }
    if (tree.items) {
      if (!schema.items || typeof schema.items !== "object")
        throw new Error(`${location}[]: metadata array no longer exists`);
      apply(schema.items as ISchema, tree.items, components, location + "[]");
    }
    for (const [key, child] of Object.entries(tree.prefixItems ?? {})) {
      if (
        !Array.isArray(schema.prefixItems) ||
        !schema.prefixItems[Number(key)]
      )
        throw new Error(
          `${location}[${key}]: metadata tuple position no longer exists`,
        );
      apply(
        schema.prefixItems[Number(key)] as ISchema,
        child,
        components,
        `${location}[${key}]`,
      );
    }
  }
}
