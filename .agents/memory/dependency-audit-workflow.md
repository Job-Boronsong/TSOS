---
name: Dependency audit workflow
description: How to close dependency audit findings reliably in this workspace.
---

After updating vulnerable dependencies, regenerate the workspace lockfile and run the dependency audit again before declaring the work complete.

**Why:** The advisory registry can return a different set once the dependency graph changes, and first-pass upgrades can expose separate vulnerable transitive packages.

**How to apply:** Patch direct dependencies where practical and use narrowly scoped workspace overrides for transitive fixes. Restart affected workflows after installation, then confirm the final audit has no findings.