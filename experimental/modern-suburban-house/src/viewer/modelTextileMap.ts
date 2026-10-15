const textileColours = new Set([
  0xb7afa3, 0xcfc8bc, 0x6b7040, 0x6e7f8c, 0x8e8579, 0xeae6dc, 0xede9e0,
]);
/** The reviewed textile palette receives one neutral weave without recolouring it. */
export function modelTextileMap(fallback: number): string | undefined {
  return textileColours.has(fallback) ? "/textures/woven.png" : undefined;
}
