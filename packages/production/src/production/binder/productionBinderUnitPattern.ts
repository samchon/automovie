/**
 * Supported unit spelling is exactly three digits followed by lowercase hyphen-separated slug components and .md. The shared nonglobal pattern supports unit filtering and numeric tie-breaking; matching alone does not admit file bytes or document titles.
 */
export const productionBinderUnitPattern: RegExp = /^([0-9]{3})-[a-z0-9]+(?:-[a-z0-9]+)*\.md$/u;
