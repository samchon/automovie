/** Reverse audit of model handoffs named by settings and spaces prose. */
export interface HandoffDocument { path: string; source: string }
export interface HandoffRow { parent: string; terms: string[]; owners: string[] }

const sections = (document: HandoffDocument): Array<{ key: string; body: string; source: string }> => {
  const lines = document.source.replace(/\r\n/g, "\n").split("\n");
  const starts = lines.flatMap((line, i) => line.startsWith("## ") ? [i] : []);
  return starts.map((start, i) => {
    const heading = lines[start]!;
    const anchor = heading.match(/\{#([^}]+)\}/)?.[1];
    if (anchor === undefined) throw new Error(`handoff: ${document.path}:${start + 1} has no anchor`);
    const source = lines.slice(start, starts[i + 1] ?? lines.length).join("\n");
    return { key: `${document.path}#${anchor}`, body: source.replace(/<!--[\s\S]*?-->/g, ""), source };
  });
};

/** Non-model H2s are routed explicitly; object-bearing exceptions cite their actual prototype. */
export const handoffOtherOwners: Readonly<Record<string, readonly string[]>> = {
  "settings/00-delivery.md#build-scope": ["models/*"],
  "settings/00-delivery.md#delivery-scope": ["models/*"],
  "settings/00-delivery.md#accessibility": ["viewer"],
  "settings/00-delivery.md#operator-access": ["viewer"],
  "settings/00-delivery.md#working-language": ["settings"],
  "settings/00-delivery.md#coverage-map": ["settings"],
  "settings/00-delivery.md#operative-subjects": ["settings"],
  "settings/10-building.md#scale": ["spaces"],
  "settings/10-building.md#fixed-graph": ["spaces"],
  "settings/20-envelope.md#stone-floors": ["materials", "instances"],
  "settings/50-production.md#acceptance": ["review"],
  "settings/50-production.md#runtime-boundary": ["viewer"],
  "settings/40-environment.md#distant-terrain": ["spaces/site.md#distant-ridge"],
  "settings/20-envelope.md#material-language": ["models/cladding.md#roof-tile"],
  "settings/30-interiors.md#administration": ["models/wares.md#scroll", "models/wares.md#small-vessel"],
  "settings/30-interiors.md#offering-room": ["models/wares.md#offering-bowl", "models/wares.md#small-vessel"],
  "settings/30-interiors.md#sanctuary": ["models/wares.md#offering-bowl"],
  "settings/30-interiors.md#storage": ["models/fixtures.md#display-shelf"],
  "settings/35-objects.md#altar": ["models/wares.md#offering-bowl"],
  "settings/35-objects.md#offering-table": ["models/wares.md#offering-bowl"],
  "settings/35-objects.md#shelves": ["models/wares.md#scroll", "models/wares.md#storage-jar"],
  "spaces/building.md#footprint": ["spaces"],
  "spaces/building.md#containment": ["spaces"],
  "spaces/building.md#approach-contacts": ["spaces"],
  "spaces/circulation.md#public-route": ["spaces"],
  "spaces/circulation.md#service-route": ["spaces"],
  "spaces/observations.md#viewer-path": ["viewer"],
  "spaces/ownership.md#surface-map": ["models/*"],
  "spaces/ownership.md#interior-dado": ["spaces"],
  "spaces/site.md#site-paving": ["spaces"],
  "spaces/site.md#site-connections": ["spaces"],
  "spaces/site.md#site-extent": ["spaces"],
  "spaces/site.md#distant-ridge": ["spaces"],
  "spaces/junctions.md#wall-junctions": ["spaces"],
  "spaces/storey.md#wall-ground-contact": ["spaces"],
  "spaces/facades/east.md#east-envelope": ["models/openings.md#door-frame", "models/openings.md#single-door-leaf"],
  "spaces/rooms/service-yard.md#yard-volume": ["models/wares.md#basket", "models/wares.md#storage-jar", "instances"],
  "spaces/rooms/administration.md#office-volume": ["models/wares.md#scroll", "models/wares.md#small-vessel"],
  "spaces/rooms/offering.md#offering-volume": ["models/wares.md#offering-bowl", "models/wares.md#small-vessel"],
  "spaces/rooms/sanctuary.md#sanctuary-volume": ["models/fixtures.md#lampstand", "models/wares.md#offering-bowl"],
  "spaces/rooms/storage.md#storage-volume": ["models/fixtures.md#chest", "models/wares.md#basket", "models/wares.md#storage-jar"],
};

export const modelHandoffRows = (
  parents: readonly HandoffDocument[], models: readonly HandoffDocument[], vocabulary: readonly string[],
  otherOwners: Readonly<Record<string, readonly string[]>> = handoffOtherOwners,
): HandoffRow[] => {
  if (new Set(vocabulary).size !== vocabulary.length || vocabulary.some((term) => term.length === 0)) {
    throw new Error("handoff: vocabulary contains an empty or duplicate term");
  }
  const modelSections = models.flatMap(sections);
  const modelKeys = new Set(modelSections.map((section) => `models/${section.key}`));
  const reverse = new Map<string, Set<string>>();
  for (const section of modelSections) {
    for (const [, family, location] of section.source.matchAll(/@evidence (settings|spaces)\/([^\s]+)/g)) {
      const ref = `${family}/${location}`;
      const owners = reverse.get(ref) ?? new Set<string>();
      owners.add(`models/${section.key}`);
      reverse.set(ref, owners);
    }
  }
  const rows = parents.flatMap(sections).flatMap((section) => {
    const terms = vocabulary.filter((term) => section.body.includes(term));
    if (terms.length === 0) return [];
    const extras = otherOwners[section.key] ?? [];
    for (const owner of extras) {
      if (owner === "models/*") continue;
      if (owner.startsWith("models/") && !modelKeys.has(owner)) throw new Error(`handoff: missing owner ${owner}`);
    }
    const expanded = extras.flatMap((owner) => owner === "models/*" ? [...modelKeys] : [owner]);
    return [{ parent: section.key, terms, owners: [...new Set([...(reverse.get(section.key) ?? []), ...expanded])].sort((a, b) => a.localeCompare(b)) }];
  });
  const actual = new Set(rows.map((row) => row.parent));
  for (const key of Object.keys(otherOwners)) {
    if (!actual.has(key)) throw new Error(`handoff: obsolete owner exception ${key}`);
  }
  return rows.sort((a, b) => a.parent.localeCompare(b.parent));
};

/** Object model units require their own settings identity and obey every declared size band. */
const inheritedDesignFiles = new Set([
  "scale.md", "columns.md", "entablature.md", "openings.md", "cladding.md",
  "fixtures.md", "wares.md", "landscape.md",
]);

export const modelIdentityOwnerFailures = (
  settings: HandoffDocument, models: readonly HandoffDocument[],
): string[] => {
  const identities = new Map(sections(settings).map((section) => [section.key.split("#")[1]!, section]));
  const failures: string[] = [];
  for (const document of models) {
    const units = sections(document);
    // Earlier mixed design files have established parent routes; every new file
    // of authored objects defaults to direct, same-id settings ownership.
    const objectFile = !inheritedDesignFiles.has(document.path);
    if (!objectFile) continue;
    for (const model of units) {
      const id = model.key.split("#")[1]!;
      const parent = identities.get(id);
      const ref = `settings/35-objects.md#${id}`;
      if (!parent) {
        failures.push(`${model.key}: missing settings identity ${ref}`);
        continue;
      }
      if (!model.source.includes(`@evidence ${ref} `) ||
          !model.body.includes(`../settings/35-objects.md#${id}`))
        failures.push(`${model.key}: missing direct settings identity ${ref}`);
      const bands = [...parent.body.matchAll(/(폭|깊이|높이|지름|길이|두께)\s+([\d.]+)~([\d.]+)m/g)];
      const box = model.body.match(/점유 상자는\s*(?:약\s*)?([\d.]+)×([\d.]+)×([\d.]+)m/)
        ?? model.body.match(/기본형 점유 상자는\s*([\d.]+)×([\d.]+)×([\d.]+)m/);
      if (bands.length && !box) {
        failures.push(`${model.key}: no occupancy box for settings dimensions`);
        continue;
      }
      if (!box) continue;
      const [width, height, depth] = box.slice(1).map(Number);
      const values: Record<string, number> = {
        폭: width!, 깊이: depth!, 높이: height!, 지름: Math.max(width!, depth!),
        길이: Math.max(width!, depth!), 두께: Math.min(width!, height!, depth!),
      };
      for (const [, label, low, high] of bands) {
        const value = values[label!]!;
        if (value < Number(low) - 1e-8 || value > Number(high) + 1e-8)
          failures.push(`${model.key}: ${label} ${value}m outside ${ref} ${low}~${high}m`);
      }
    }
  }
  return failures;
};
