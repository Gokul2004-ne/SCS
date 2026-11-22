---
name: Defence assurance product scope
description: User's intended audience and source-workbench governance semantics.
---
The user wants a professional end-to-end auditor/auditee QMS/IMS product design suitable for an Indian Army Defence proposal and reusable for implementing the full solution. Coverage includes NABL laboratories and the listed laboratory, quality, certification, inspection, AI-management and software lifecycle/process-assessment frameworks.

**Why:** The user requested product design and workflows to propose the niche solution, not a claim of accreditation or production security.

**How to apply:** Keep demonstrable prototype behaviour distinct from future production deployment, identity, AI and classified-data controls. Do not imply official endorsement.

The supplied HTML and workbook specify separate finding-rebuttal and post-acceptance D1–D8 RCA loops, separate iteration counts, and a four-signoff closure gate: auditor and auditee each sign impartiality and confidentiality declarations.

**Why:** These are the source workbench's defining organisational controls, not independently verified universal ISO requirements.

**How to apply:** Preserve the acceptance-before-RCA gate and all four signoffs when evolving workflows. Verify normative clause mappings and editions against licensed standards before production use. Source friction definitions differ between dashboard and extraction report; keep thresholds explicit rather than presenting them as ISO rules.

Use public sources for the ISO clause knowledge graph and GraphRAG.

**Why:** The user explicitly instructed: "Take from the open sources of clauses and ISOs mentioned in the documents".

**How to apply:** Source and cite accessible authoritative material, keep editions separate, and disclose gaps where full clause text is not openly available. Public availability is not permission to reproduce entire copyrighted standards.

The user's latest persona rule is auditor control of audit functionality and auditee viewing of current audit progress only; cross-framework dependency loops are authored by auditors.

**Why:** The user explicitly narrowed the earlier collaborative auditee role while requesting a demonstrable Auditor 365 / Auditor AI Twin workflow.

**How to apply:** Apply organisation-scoped server RBAC, not a client persona toggle. On 2026-11-22 the user confirmed that auditees can view assigned current audit progress and sign their own declarations only. They cannot edit audit records, submit rebuttals, score clauses or author dependencies. Never let auditors impersonate auditee signers.

Use Gmail for audit-request email intake.

**Why:** The user explicitly selected Gmail on 2026-11-22.

**How to apply:** Use the Gmail API integration for email-to-ticket automation. Confirm the intake label/folder and start date before processing historical mail; connecting the provider alone does not authorise bulk historical import or test emails to real recipients.
