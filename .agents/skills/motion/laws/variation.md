# Variation

Parameters, skill and seed vary takes while keeping each take reproducible.

## One law, many performances

Vary one law through parameters, skill and seed. Add a parameter with a study-based bound when the law cannot express a variation.

## Skill

Interpolate each measured quantity between novice and expert using studies of that action family. Mark unsupported quantities provisional.

Vary performance within the same joint limits. Preserve any fixed outcome. Skill may affect a selected [outcome rule](declaration.md#outcome-as-input) when the rule admits it.

## Variability across tasks

Model interval variance as a constant motor term plus a term growing with interval (Wing and Kristofferson 1973). Scale endpoint scatter up with distance and down with movement time (Schmidt et al. 1979). Motor noise grows with command magnitude (Harris and Wolpert 1998).

## Independent draws

Key each random draw by seed, performer, action, instance and quantity. Preserve other draws when action order or membership changes.

Vary motion within studied bounds. Use the caller's affected count or derive it from the supplied studied rate. Use the seed to select members.
