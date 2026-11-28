# src/props/AutoMovieArchetypeBox.ts#AutoMovieArchetypeBox.create

## @evidence contracts/development/common.md#meaningful-documentation

The factory states where both side affordances and the stacking face lie. It documents the fixed dimensions, optional mounts and default collider.

## @evidence contracts/development/implementation.md#principled-implementation

Each side's authored grip frame sits at the rendered and collidable rail centre. The explicit aperture matches the rail diameter, and the round symmetry permits approach about its long axis. The two mounts run from that rail to the carton wall.

## @evidence contracts/development/implementation.md#efficient-algorithms

The unhandled recipe builds the original single solid and four affordances. The enabled variant adds two bars and their four mounts when the model is constructed.

# src/props/AutoMovieArchetypeBox.ts#AutoMovieArchetypeBox.IParams

## @evidence contracts/development/common.md#meaningful-documentation

The parameters identify the load, dimensions and optional round side handles. Omitting the option preserves the default side-wall contacts.

## @evidence contracts/development/design.md#principled-representation

The construction choice sets the geometry and both corresponding grasp frames. Aperture and the grip length come from the same round bar dimensions.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One optional parameter selects the carton variant. Both variants use the same named side affordances, while the builder retains ownership of their render and collision parts.

# src/props/AutoMovieArchetypeBox.ts#AutoMovieArchetypeBox.IParams.id

## @evidence contracts/development/common.md#meaningful-documentation

The id identifies the scene model, with box as the omitted default.

# src/props/AutoMovieArchetypeBox.ts#AutoMovieArchetypeBox.IParams.load

## @evidence contracts/development/common.md#meaningful-documentation

The load adds the contents' mass to the empty carton. The permissible amount is zero to 25 kilograms, with zero when omitted.

# src/props/AutoMovieArchetypeBox.ts#AutoMovieArchetypeBox.IParams.sideHandles

## @evidence contracts/development/common.md#meaningful-documentation

The flag enables one supported handle on each side. The declaration gives the bar diameter, grip length and false default.

# src/props/AutoMovieArchetypeBox.ts#AutoMovieArchetypeBox.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

The four names identify opposite side contacts, the stacking face and the front face. Both construction choices retain the same side names.

## @evidence contracts/development/design.md#principled-representation

The affordance labels refer to placed material features. Each side moves from the wall to its corresponding rail centre when handles are selected.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The original side identifiers serve both configurations and retain independent left and right roles.
