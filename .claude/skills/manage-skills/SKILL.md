---
name: manage-skills
argument-hint: "[Optional: specific skill name or focus area\\]"
description: Analyzes session changes to detect verification skill
  drift. Dynamically discovers existing skills, creates or updates
  skills as needed, and maintains CLAUDE.md.
disable-model-invocation: true

---

# Session-Based Skill Maintenance

## Purpose

Analyze changes made during the current session to detect and correct
verification skill drift:

1.  Coverage Gaps - Changed files not referenced by any verify skill\
2.  Invalid References - Skills referencing deleted or moved files\
3.  Missing Checks - New patterns/rules not covered by existing
    checks\
4.  Outdated Values - Configuration values or detection commands that
    no longer match

------------------------------------------------------------------------

## When to Run

-   After implementing features that introduce new patterns or rules\
-   When modifying existing verify skills and wanting to ensure
    consistency\
-   Before opening a PR to confirm coverage for changed areas\
-   When validation misses issues you expected it to catch\
-   Periodically, to align skills with codebase evolution

------------------------------------------------------------------------

## Registered Verification Skills

This is the list of verification skills currently registered in the
project.\
Update this table whenever a new skill is created or removed.

| # | 스킬 | 설명 |
|---|------|------|
| 1 | verify-build | Turborepo 빌드 및 타입체크 검증 |
| 2 | verify-imports | ES 모듈 임포트 규칙 검증 (.js 확장자, @flowmvp/ 워크스페이스) |
| 3 | verify-requirements | 구현 기능의 요구사항 만족도 검증 (API, 대시보드, SDK, 설정) |

### Registered Management Skills

| # | 스킬 | 설명 |
|---|------|------|
| 1 | manage-skills | 세션 변경사항 기반 스킬 유지보수 |

### Registered Utility Skills

현재 등록된 유틸리티 스킬이 없습니다.

------------------------------------------------------------------------

# Workflow

## Step 1: Analyze Session Changes

Collect all files modified during the current session:

    git diff HEAD --name-only
    git log --oneline main..HEAD 2>/dev/null
    git diff main...HEAD --name-only 2>/dev/null

Merge results into a deduplicated list.

------------------------------------------------------------------------

## Step 2: Map Registered Skills to Changed Files

Match changed files against registered skill patterns and detection
commands.

------------------------------------------------------------------------

## Step 3: Analyze Coverage Gaps

Check for: - Missing file references\
- Outdated detection commands\
- New uncovered patterns\
- Residual references to deleted files\
- Changed identifiers or configuration values

------------------------------------------------------------------------

## Step 4: CREATE vs UPDATE Decision

Decision logic:

If related to existing domain → UPDATE\
If 3+ related files share a rule → CREATE\
Otherwise → EXEMPT

------------------------------------------------------------------------

## Step 5: Update Existing Skills

Rules: - Add or modify only\
- Update Related Files\
- Add new detection commands\
- Remove deleted file references\
- Update changed identifiers

------------------------------------------------------------------------

## Step 6: Create New Skill

Naming rules: - Must start with verify- - Use kebab-case

Required sections: - Purpose\
- When to Run\
- Related Files\
- Workflow\
- Output Format\
- Exceptions

------------------------------------------------------------------------

## Step 7: Validation

After edits: - Re-read modified SKILL.md files\
- Validate Markdown formatting\
- Confirm all Related Files exist\
- Dry-run detection commands\
- Ensure skill tables are synchronized

------------------------------------------------------------------------

## Step 8: Final Report

Include: - Files analyzed\
- Skills updated\
- Skills created\
- Related files updated\
- Unaffected skills\
- Uncovered changes

------------------------------------------------------------------------

# Quality Standards

All skills must include: - Real file paths\
- Working detection commands\
- PASS/FAIL criteria\
- Realistic exceptions\
- Consistent formatting

------------------------------------------------------------------------

# Related Files

-   .claude/skills/verify-implementation/SKILL.md\
-   .claude/skills/manage-skills/SKILL.md\
-   CLAUDE.md

------------------------------------------------------------------------

# Exceptions

1.  Lock & generated files\
2.  Minor config version bumps\
3.  Documentation files\
4.  Test fixture files\
5.  Unaffected skills\
6.  CLAUDE.md updates\
7.  Vendor code\
8.  CI/CD configuration files
