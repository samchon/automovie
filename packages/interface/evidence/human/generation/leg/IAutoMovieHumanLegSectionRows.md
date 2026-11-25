# src/human/generation/leg/IAutoMovieHumanLegSectionRows.ts#IAutoMovieHumanLegSectionRows.IGuide

## @evidence contracts/development/common.md#meaningful-documentation

A guide: its section angle (0 forward, increasing toward lateral on the left leg) and its rows.

## @evidence contracts/development/design.md#principled-representation `name`: The guide's name. `angle`: Section angle, radians. `rows`: The landmark rows, `[rho, rho_theta, rho_thetatheta]`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanLegGuides.profile. Also types AutoMovieHumanLegSectionRows.GUIDES.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `name`, `angle`, `rows`; callers supply the complete record.

# src/human/generation/leg/IAutoMovieHumanLegSectionRows.ts#IAutoMovieHumanLegSectionRows.ISector

## @evidence contracts/development/common.md#meaningful-documentation

A sector after a guide: its thigh and its shank compartment's rows, `[fullness]`.

## @evidence contracts/development/design.md#principled-representation `thigh`: The thigh compartment's name. `shank`: The shank compartment's name. `thighRows`: The thigh compartment's rows.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Also types AutoMovieHumanLegSectionRows.SECTORS.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `thigh`, `shank`, `thighRows`, `shankRows`; callers supply the complete record.
