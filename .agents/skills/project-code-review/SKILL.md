---
name: project-code-review
description: Review changes in the Alcohol Consumption Tracker for bugs, security, architecture, and project conventions. Use when asked to review code, a branch, or a pull request in this project.
---

# Project code review

Review the requested diff or files without modifying them. If the scope is not specified, inspect staged and unstaged changes; if there are none, clarify the intended scope. Read enough surrounding code and `.github/copilot-instructions.md` to understand the behavior.

Check the parts relevant to the changes:

- **Security:** authentication and admin authorization, user ownership of drinks and entries, input validation, secrets, sensitive data exposure, and unsafe database queries. Trace affected request paths rather than assuming middleware is present.
- **Architecture:** Express routes, Prisma singleton, React pages, services and Zustand stores follow the project guidelines. Account for the SQLite local schema and PostgreSQL production schema when reviewing database changes.
- **Behavior:** correctness, edge cases, regressions, API compatibility, and the pure alcohol calculation. Check both English and Czech translations for changed UI text.
- **Validation:** review relevant tests and run appropriate existing checks when practical; report what was not verified. Avoid tests that modify production data or other external state.

Report actionable findings first, ordered by severity, with file and line references, the scenario, and its impact. Distinguish confirmed problems from uncertainty. If there are no findings, say so and mention any meaningful testing or security limitations; do not claim the application is completely secure.
