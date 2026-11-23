# src/human/generation/foot/IAutoMovieHumanFootWebLine.ts#IAutoMovieHumanFootWebLine

## @evidence contracts/development/common.md#meaningful-documentation

The foot fan's shared origin, yaw/turn axes and station levers, together with its crest-height reader. Member comments specify the individual units, frames and optional-value meanings.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups only IWebLine, IInput declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.

## @evidence contracts/development/design.md#principled-representation

IWebLine, IInput separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieHumanFootWebLine exchanges the named IWebLine, IInput contracts with its Human callers. Interface owns these type declarations without importing that implementation.

# src/human/generation/foot/IAutoMovieHumanFootWebLine.ts#IAutoMovieHumanFootWebLine.IWebLine

## @evidence contracts/development/common.md#meaningful-documentation

The fan's axes, levers and stations.

## @evidence contracts/development/design.md#principled-representation `origin`: The shared point: on the vertical yaw axis and the horizontal turn axis. `lateral`: Horizontal, across the foot toward its lateral side: the turn axis. `back`: Horizontal, along the foot toward the heel.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanFootWebLine.of. Read by AutoMovieHumanFootColumn.knots, AutoMovieHumanFootFan.plane, AutoMovieHumanFootFan.station. Also types AutoMovieHumanFootConstruction.line, AutoMovieHumanFootBody.line.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `origin`, `lateral`, `back`, `yaw`, `square`, `yawLever`, `turnLever`, `end`; callers supply the complete record.

# src/human/generation/foot/IAutoMovieHumanFootWebLine.ts#IAutoMovieHumanFootWebLine.IInput

## @evidence contracts/development/common.md#meaningful-documentation

What the web line reads besides the frame.

## @evidence contracts/development/design.md#principled-representation `frame`: The foot's frame. `depth`: The forefoot crest's height over the floor at a place along the foot, foot lengths.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanFootWebLine.of.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `frame`, `depth`; callers supply the complete record.
