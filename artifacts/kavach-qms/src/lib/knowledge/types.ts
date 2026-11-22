/** Knowledge Repository domain types. Browser-local demonstration only; separate from the audit store. */

export type ClauseKind = 'scope' | 'reference' | 'definitions' | 'requirement' | 'concept' | 'conformance' | 'process' | 'informative';

/** body: requirement body text is present in the supplied PDF; partial: preview cuts off mid-clause; contents: heading listed on contents page only; none: user-entered without source. */
export type Coverage = 'body' | 'partial' | 'contents' | 'none';

export type DepType = 'Requires' | 'Related' | 'Conflicts';
export const DEP_TYPES: DepType[] = ['Requires', 'Related', 'Conflicts'];

export type SimRole = 'Auditor' | 'Auditee';

export interface SourceRef {
  file: string;
  /** 1-based PDF page of the contents entry */
  contentsPdfPage: number | null;
  /** 1-based PDF page where the clause body starts, when inside the supplied file */
  bodyPdfPage: number | null;
  /** page number printed in the standard's contents */
  printedPage: string | null;
}

export interface Clause {
  id: string;
  frameworkId: string;
  number: string;
  title: string;
  kind: ClauseKind;
  parentId: string | null;
  plainSummary: string;
  coverage: Coverage;
  source: SourceRef | null;
  origin: 'source' | 'user';
  createdBy: SimRole | 'Source extraction';
  createdAt: string;
  updatedAt: string;
}

export interface Dependency {
  id: string;
  sourceId: string;
  targetId: string;
  type: DepType;
  rationale: string;
  illustrative: boolean;
  createdBy: SimRole;
  createdAt: string;
}

export interface FrameworkEntry {
  id: string;
  code: string;
  name: string;
  edition: string;
  file: string | null;
  fileNote: string;
  pdfPages: number | null;
  docStatus: 'substantive' | 'preview' | 'missing';
}

export interface Repo {
  version: 1;
  clauses: Clause[];
  dependencies: Dependency[];
}
