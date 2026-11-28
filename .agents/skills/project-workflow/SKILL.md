---
name: project-workflow
description: Follow the Alcohol Consumption Tracker branch, worktree, and release workflow. Use when creating or relocating worktrees, starting feature branches, integrating work into develop, or considering a merge into main.
---

# Project workflow

## Checkout and worktrees

- The preferred local checkout for this project is `E:\work\AlcoholConsumption`,
  with `develop` as the development branch. This is a local-machine path; check
  that it exists and is the intended repository before relying on it.
- Put new worktrees next to the checkout, under `E:\work`, and use the pattern
  `AlcoholConsumption-<work-name>` for the directory and `<work-name>` for
  the branch, for example `AlcoholConsumption-next-work` and `next-work`.
- Create feature branches from `develop` and integrate finished feature work
  back into `develop`. Check the actual branch, repository, worktree state, and
  available upstream changes first; preserve existing uncommitted work.
- Respect the host application's workspace and branch management. Do not move
  or rename an active app-managed worktree behind the application, switch a
  shared checkout, or bypass a configured branch prefix. If the host cannot
  honor the preferred location or name, explain the limitation and ask the user
  how to proceed rather than claiming the preference was applied.

## Release

- `main` is the release branch. Merge `develop` into `main` only after the
  relevant changes have been tested and the user has explicitly approved that
  merge.
- Report failed or incomplete tests and obtain any required approval before
  merging. Do not treat this skill as authorization to merge a pull request.
