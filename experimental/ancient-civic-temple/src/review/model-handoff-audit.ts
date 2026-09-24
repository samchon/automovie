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
  "settings/00-delivery.md#operator-access": ["viewer"],
  "settings/00-delivery.md#working-language": ["settings"],
  "settings/00-delivery.md#coverage-map": ["settings"],
  "settings/00-delivery.md#operative-subjects": ["settings"],
  "settings/10-building.md#scale": ["spaces"],
  "settings/20-envelope.md#stone-floors": ["spaces"],
  "settings/50-production.md#acceptance": ["review"],
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
  "spaces/ownership.md#surface-map": ["spaces"],
  "spaces/ownership.md#interior-dado": ["spaces"],
  "spaces/site.md#site-paving": ["spaces"],
  "spaces/site.md#site-connections": ["spaces"],
  "spaces/storey.md#wall-ground-contact": ["spaces"],
  "spaces/facades/east.md#east-envelope": ["spaces"],
  "spaces/rooms/service-yard.md#yard-volume": ["models/wares.md#basket", "models/wares.md#storage-jar"],
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
