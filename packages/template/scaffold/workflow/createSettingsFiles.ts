/** Selects flat legacy canon and one level of numbered subject folders, excluding the outline. */
export function createSettingsFiles(): string[] {
  return ["settings/*.md", "settings/???-*/*.md"];
}
