# Construct a crafted form

Use this branch when crafting or changing a form from curves, sections or parametric surfaces. [Asset workflows](workflows.md#construct-and-assemble) owns the parts, their frames and their shared boundaries; this branch owns how each part's surface and every quantity on it are generated. Test the construction with development's [testing](../development/testing.md) rules for generated geometry.

## Derive everything from the generating definition

For a loft, keep sections, guides and their parameter directions related through one generating definition; for another representation, retain its corresponding sketches, fields or procedural structure. Evaluate every geometric quantity of the form on that definition's curves, sections, parametric surfaces and frames: placements, attachments, skin weights, texture coordinates, measurements and the joins between parts. Tessellation is the last step, made for renderers and exporters, and nothing is read back from it. A quantity found by reading, searching, clipping, ray casting or relaxing the form's own triangles or vertices moves with the detail setting, so it drifts between the preview and the final render and answers to no input.

This governs a crafted form only. A directly used or generated mesh, the weights of an imported mesh under [rigging](rigging.md), and a fixed source observed for [recovery](recovery.md) have no generating definition to evaluate, so their own triangles are what is measured.

## Evaluate the definition efficiently

Set up each section or segment once, with its coefficients and derivatives, and evaluate each point from that setup in constant time. Invert a parametrization with a table or an analytic step, such as Newton's method on the analytic derivative, rather than a long bisection over full evaluations. Solve a dimension on the part it controls instead of regenerating the whole form inside a solver loop. Slow generation lengthens every [inspection round](inspection.md), and a round that costs too much invites local patches in place of repairs at the cause.

## Keep stylization a separate layer

Express stylization, such as exaggerated proportions or fantasy features, as a separate layer of transforms over the generating curves and parts rather than as edits inside their construction. The base construction and its tests then stay valid underneath, and every repair to the base reaches the stylized variant. Record the adopted stylization in the [production decisions](../production/profile.md#what-to-record).
