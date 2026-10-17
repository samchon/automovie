# Ptex

Walt Disney Animation Studios, Ptex overview, https://ptex.us/overview.html.

## Licence

Technique comparison only; Human uses no Ptex code. Its software licence is outside this note.

## What it says

- Per-face textures with no UV assignment, used on "virtually every surface" of Disney Animation productions since 2008.
- Per-face resolution varies; many textures live in one file.
- "Seamless filtering", with no visible seams across faces.
- Supports Catmull-Clark (quad and non-quad faces), Loop and polymeshes.

## What Human takes

The reason not to use it: Human's output contract (`IAutoMovieMesh.uvs`, glTF) and its published layout for downstream textures need UV coordinates (`../techniques/uv-layout.md`).
