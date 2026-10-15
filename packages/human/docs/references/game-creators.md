# Game character creators

Surveyed in the research notes on #2788: Black Desert, Lost Ark, Blade & Soul, Aion, Throne and Liberty, The Sims 4, inZOI, Dragon's Dogma 2, Elden Ring, Cyberpunk 2077, Baldur's Gate 3, Monster Hunter Wilds, Street Fighter 6, Skyrim and Fallout 4 mods (RaceMenu, BodySlide), Daz Studio, Character Creator, VRoid Studio.

## Findings

- All start from artist-sculpted base meshes and combine morph targets with hidden helper-bone scaling. None generates form from formulas.
- Their beauty comes from the sculpted base and from narrow slider ranges that keep every combination attractive.

## Consequences for the rebuild

- "Fixed template plus offsets" is the industry standard. The basis-era defect was opaque external data carrying all shape knowledge, not the template idea; the rebuild carries that knowledge as typed code and formulas.
- Beauty cannot come from a sculpted base here, so it must be expressed as rules: art-anatomy form rules (staggered contour peaks, convex and concave rhythm, counter-tilted rib cage and pelvis, overlap order of superficial muscles), proportion canons, and measured attractiveness findings (averageness, symmetry, dimorphism, waist-to-hip ratio near 0.7, shoulder-to-hip ratio, slightly long legs). Those rules live in `../aesthetics/`.
- Narrow slider ranges have a counterpart in Human's admission rule: only values and combinations a living body can take are admitted, each dependent bound derived from the structure that limits it.
