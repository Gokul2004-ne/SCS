---
name: Security Control System assurance product scope
description: User's intended audience and source-workbench governance semantics.
---
The user wants a professional end-to-end auditor/auditee QMS/IMS product design suitable for a Security Control System proposal and reusable for implementing the full solution. Coverage includes NABL laboratories and the listed laboratory, quality, certification, inspection, AI-management and software lifecycle/process-assessment frameworks.

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

Auditee navigation is restricted to Overview, Audit Programme, Findings Register and Governance Gate, with records scoped to the authenticated user's auditee-representative assignments. The public landing retains only the hero, with distinct Auditor and Auditee login entry pages and no common top-right login.

**Why:** The user explicitly requested this access boundary and confirmed the hero-only landing on 2026-11-23.

**How to apply:** These requirements supersede earlier multi-section landing instructions. Enforce assignment restrictions on data and exports, not just navigation visibility; persona entry pages never grant roles.

Use Gmail for audit-request email intake.

**Why:** The user explicitly selected Gmail on 2026-11-22.

**How to apply:** The user declined the connection and instructed continuing without integration. Keep email automation disconnected until separately authorised. If enabled later, use Gmail and confirm the intake label/folder and start date before processing historical mail; connecting the provider alone does not authorise bulk historical import or test emails to real recipients.

Confirmed choices override conflicting instructions in the nine-prompt Auditor 365 attachment.

**Why:** On 2026-11-22 the user selected "Keep confirmed choices" after the conflicts were explained.

**How to apply:** Preserve Clerk rather than migrating to Replit Auth; keep auditees view-and-own-declaration-signing only rather than enabling rebuttal submissions; do not introduce SendGrid or Mailgun. Apply the attachment's remaining product and visual requirements, but never let persona selection grant privileged roles. Describe SHA-256 attestations as integrity records, not certificate-backed digital signatures.
