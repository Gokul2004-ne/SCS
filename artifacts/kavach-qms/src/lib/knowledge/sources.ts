import type { Clause, ClauseKind, Coverage, FrameworkEntry } from './types';

/**
 * Source catalogue. Headings and page numbers were extracted with `pdftotext -layout` from the
 * contents pages of the three supplied PDFs. Summaries are short original paraphrases written for
 * this prototype; no standard body text is reproduced. Headings whose title could not be extracted
 * from the contents page are omitted rather than invented.
 */

export const F17025 = 'iso17025';
export const F15504 = 'iso15504-1';
export const F12207 = 'iso12207';

export const FRAMEWORKS: FrameworkEntry[] = [
  { id: F17025, code: 'ISO/IEC 17025', name: 'General requirements for the competence of testing and calibration laboratories', edition: 'Third edition, 2017-11', file: 'ISO_IEC_17025_2017(E)_1795364715752.pdf', fileNote: '38-page licensed copy. Contents pages 3-4; clause body pages 7-35.', pdfPages: 38, docStatus: 'substantive' },
  { id: F15504, code: 'ISO/IEC 15504-1', name: 'Information technology - Process assessment - Part 1: Concepts and vocabulary', edition: '2004', file: 'ISO-IEC-15504-1-2004_1795364715753.pdf', fileNote: '11-page public PREVIEW. Contents on page 3; body stops inside clause 3 (definitions to 3.44). Not ISO/IEC 330xx.', pdfPages: 11, docStatus: 'preview' },
  { id: F12207, code: 'ISO/IEC/IEEE 12207', name: 'Systems and software engineering - Software life cycle processes', edition: '2017 (first edition)', file: 'ISO-IEC-IEEE-12207-2017_1795364715754.pdf', fileNote: '15-page public PREVIEW. Contents pages 3-5; body stops inside 3.1 Terms and definitions (to 3.1.47).', pdfPages: 15, docStatus: 'preview' },
  { id: 'iso9001', code: 'ISO 9001', name: 'Quality management systems - Requirements', edition: 'Edition not recorded', file: null, fileNote: 'Source document required.', pdfPages: null, docStatus: 'missing' },
  { id: 'iso17065', code: 'ISO/IEC 17065', name: 'Requirements for bodies certifying products, processes and services', edition: 'Edition not recorded', file: null, fileNote: 'Source document required.', pdfPages: null, docStatus: 'missing' },
  { id: 'iso17021', code: 'ISO/IEC 17021-1', name: 'Requirements for bodies providing audit and certification of management systems', edition: 'Edition not recorded', file: null, fileNote: 'Source document required.', pdfPages: null, docStatus: 'missing' },
  { id: 'iso17020', code: 'ISO/IEC 17020', name: 'Requirements for the operation of various types of bodies performing inspection', edition: 'Edition not recorded', file: null, fileNote: 'Source document required.', pdfPages: null, docStatus: 'missing' },
  { id: 'iso42001', code: 'ISO/IEC 42001', name: 'Artificial intelligence management system', edition: 'Edition not recorded', file: null, fileNote: 'Source document required.', pdfPages: null, docStatus: 'missing' },
  { id: 'iso330xx', code: 'ISO/IEC 330xx', name: 'Process assessment series (330xx family)', edition: 'Edition not recorded', file: null, fileNote: 'Source document required. Distinct from the supplied ISO/IEC 15504-1:2004 preview.', pdfPages: null, docStatus: 'missing' },
];

export const frameworkById = (id: string) => FRAMEWORKS.find((f) => f.id === id);

type Row = [number: string, title: string, printed: string, kind: ClauseKind, coverage: Coverage, summary: string, contentsPdfPage: number];

const SEEDED_AT = '2025-01-01T00:00:00.000Z';

function build(fw: string, file: string, offset: number, rows: Row[]): Clause[] {
  const ids = new Set(rows.map((r) => r[0]));
  return rows.map(([number, title, printed, kind, coverage, plainSummary, contentsPdfPage]) => {
    const parts = number.split('.');
    let parent: string | null = null;
    for (let i = parts.length - 1; i > 0; i--) {
      const p = parts.slice(0, i).join('.');
      if (ids.has(p)) { parent = p; break; }
    }
    const n = Number(printed);
    const inFile = coverage === 'body' || coverage === 'partial';
    return {
      id: `${fw}:${number}`,
      frameworkId: fw,
      number,
      title,
      kind,
      parentId: parent ? `${fw}:${parent}` : null,
      plainSummary,
      coverage,
      source: { file, contentsPdfPage, bodyPdfPage: inFile && Number.isFinite(n) ? n + offset : null, printedPage: printed },
      origin: 'source',
      createdBy: 'Source extraction',
      createdAt: SEEDED_AT,
      updatedAt: SEEDED_AT,
    };
  });
}

const CO = 'Heading listed on the contents page only. The requirement text is not in the supplied preview, so no summary of its content is given.';

const R17025: Row[] = [
  ['1', 'Scope', '1', 'scope', 'body', 'States what the document covers: competence, impartiality and consistent operation of testing, calibration and sampling laboratories.', 3],
  ['2', 'Normative references', '1', 'reference', 'body', 'Points to the referenced vocabulary documents needed to apply the standard.', 3],
  ['3', 'Terms and definitions', '1', 'definitions', 'body', 'Defines the vocabulary used in the requirements. Definitions, not auditable requirements.', 3],
  ['4', 'General requirements', '3', 'requirement', 'body', 'Group heading for impartiality and confidentiality obligations.', 3],
  ['4.1', 'Impartiality', '3', 'requirement', 'body', 'Laboratory work must be unbiased; risks to impartiality are identified on an ongoing basis and eliminated or minimised.', 3],
  ['4.2', 'Confidentiality', '3', 'requirement', 'body', 'Customer information obtained during laboratory activities is protected, with legally enforceable commitments and notice before disclosure.', 3],
  ['5', 'Structural requirements', '4', 'requirement', 'body', 'The laboratory is a legally responsible entity with defined management, scope of activities, responsibilities and authorities.', 3],
  ['6', 'Resource requirements', '5', 'requirement', 'body', 'Group heading for people, facilities, equipment, traceability and external providers.', 3],
  ['6.1', 'General', '5', 'requirement', 'body', 'The laboratory has the resources needed to manage and perform its activities.', 3],
  ['6.2', 'Personnel', '5', 'requirement', 'body', 'Staff are competent, impartial, authorised for their tasks, and their competence is defined, monitored and recorded.', 3],
  ['6.3', 'Facilities and environmental conditions', '6', 'requirement', 'body', 'Premises and environment suit the work and do not compromise result validity; conditions are monitored where relevant.', 3],
  ['6.4', 'Equipment', '6', 'requirement', 'body', 'Equipment is suitable, calibrated where needed, maintained, identified and recorded.', 3],
  ['6.5', 'Metrological traceability', '8', 'requirement', 'body', 'Measurement results are linked to reference standards through a documented unbroken calibration chain.', 3],
  ['6.6', 'Externally provided products and services', '8', 'requirement', 'body', 'Suppliers and outsourced services affecting laboratory activities are specified, evaluated and monitored.', 3],
  ['7', 'Process requirements', '9', 'requirement', 'body', 'Group heading for the laboratory process from request through reporting and data control.', 3],
  ['7.1', 'Review of requests, tenders and contracts', '9', 'requirement', 'body', 'Customer requirements and methods are agreed and the capability to deliver is confirmed before work starts.', 3],
  ['7.2', 'Selection, verification and validation of methods', '10', 'requirement', 'body', 'Group heading for choosing, verifying and validating test or calibration methods.', 3],
  ['7.2.1', 'Selection and verification of methods', '10', 'requirement', 'body', 'Appropriate, current methods are used and the laboratory confirms it can perform them correctly.', 3],
  ['7.2.2', 'Validation of methods', '11', 'requirement', 'body', 'Non-standard, laboratory-developed or modified methods are validated as fit for the intended use.', 3],
  ['7.3', 'Sampling', '12', 'requirement', 'body', 'Sampling follows a plan and method addressing validity factors, with sampling data recorded.', 3],
  ['7.4', 'Handling of test or calibration items', '12', 'requirement', 'body', 'Items are transported, received, identified, stored and disposed of in a way that protects their integrity.', 3],
  ['7.5', 'Technical records', '13', 'requirement', 'body', 'Records hold enough detail to repeat the activity and trace changes and the people involved.', 3],
  ['7.6', 'Evaluation of measurement uncertainty', '13', 'requirement', 'body', 'Contributions to measurement uncertainty are identified and evaluated using appropriate analysis.', 3],
  ['7.7', 'Ensuring the validity of results', '13', 'requirement', 'body', 'Result validity is monitored internally and by comparison with other laboratories, with data analysed and acted upon.', 3],
  ['7.8', 'Reporting of results', '14', 'requirement', 'body', 'Group heading for report content and specific reporting cases.', 3],
  ['7.8.1', 'General', '14', 'requirement', 'body', 'Results are reviewed and authorised before release and reported accurately and clearly.', 3],
  ['7.8.2', 'Common requirements for reports (test, calibration or sampling)', '15', 'requirement', 'body', 'Sets the minimum information every report carries.', 3],
  ['7.8.3', 'Specific requirements for test reports', '15', 'requirement', 'body', 'Additional information needed when interpreting test results.', 3],
  ['7.8.4', 'Specific requirements for calibration certificates', '16', 'requirement', 'body', 'Additional information needed on calibration certificates, including uncertainty and traceability evidence.', 3],
  ['7.8.5', 'Reporting sampling - specific requirements', '16', 'requirement', 'body', 'Additional information when the laboratory is responsible for sampling.', 3],
  ['7.8.6', 'Reporting statements of conformity', '17', 'requirement', 'body', 'A documented decision rule, considering risk, is applied and reported when stating conformity to a specification.', 3],
  ['7.8.7', 'Reporting opinions and interpretations', '17', 'requirement', 'body', 'Only authorised people give opinions, which are based on results and clearly identified as opinions.', 3],
  ['7.8.8', 'Amendments to reports', '17', 'requirement', 'body', 'Changes to issued reports are clearly identified and traceable to the original.', 3],
  ['7.9', 'Complaints', '17', 'requirement', 'body', 'A documented process receives, evaluates and decides on complaints, with impartial review of outcomes.', 3],
  ['7.10', 'Nonconforming work', '18', 'requirement', 'body', 'Work not conforming to procedures or agreements is identified, evaluated, controlled and acted upon.', 3],
  ['7.11', 'Control of data and information management', '19', 'requirement', 'body', 'Data and information systems are validated, protected against unauthorised access and kept intact.', 3],
  ['8', 'Management system requirements', '19', 'requirement', 'body', 'Group heading for the management system, implemented by Option A or Option B.', 3],
  ['8.1', 'Options', '19', 'requirement', 'body', 'Group heading for choosing how the management system is implemented.', 3],
  ['8.1.1', 'General', '19', 'requirement', 'body', 'A management system is established, documented and maintained to support consistent fulfilment of the standard.', 3],
  ['8.1.2', 'Option A', '20', 'requirement', 'body', 'Management system addresses at least clauses 8.2 to 8.9.', 3],
  ['8.1.3', 'Option B', '20', 'requirement', 'body', 'A management system aligned with ISO 9001 that supports clauses 4 to 7 and the intent of 8.2 to 8.9.', 3],
  ['8.2', 'Management system documentation (Option A)', '20', 'requirement', 'body', 'Policies and objectives are documented, communicated and backed by management commitment.', 3],
  ['8.3', 'Control of management system documents (Option A)', '20', 'requirement', 'body', 'Internal and external documents are approved, reviewed, version-identified and available where used.', 3],
  ['8.4', 'Control of records (Option A)', '21', 'requirement', 'body', 'Records are legible, identified, stored, protected, retained and disposed of under control.', 3],
  ['8.5', 'Actions to address risks and opportunities (Option A)', '21', 'requirement', 'body', 'Risks and opportunities are considered and proportionate actions are planned and evaluated.', 3],
  ['8.6', 'Improvement (Option A)', '22', 'requirement', 'body', 'Opportunities for improvement are identified and acted on, including customer feedback.', 3],
  ['8.7', 'Corrective actions (Option A)', '22', 'requirement', 'body', 'Nonconformities are reacted to, root causes found, actions taken and their effectiveness reviewed.', 3],
  ['8.8', 'Internal audits (Option A)', '23', 'requirement', 'body', 'Planned internal audits check conformity and effective implementation, with results reported and acted on.', 3],
  ['8.9', 'Management reviews (Option A)', '23', 'requirement', 'body', 'Top management reviews the management system at planned intervals using defined inputs and recorded outputs.', 3],
  ['Annex A', '(informative) Metrological traceability', '25', 'informative', 'body', 'Informative guidance on establishing and demonstrating traceability. Not an additional requirement.', 4],
  ['Annex B', '(informative) Management system options', '27', 'informative', 'body', 'Informative explanation of Option A and Option B. Not an additional requirement.', 4],
];

const R15504: Row[] = [
  ['1', 'Scope', '1', 'scope', 'body', 'Describes the part as an entry point to process assessment concepts and vocabulary.', 3],
  ['2', 'Normative references', '1', 'reference', 'body', 'Lists referenced documents for this part.', 3],
  ['3', 'Terms and definitions', '1', 'definitions', 'partial', 'Vocabulary for process assessment. The preview stops at definition 3.44; remaining definitions are not available.', 3],
  ['4', 'Concept', '7', 'concept', 'contents', CO, 3],
  ['4.1', 'General', '7', 'concept', 'contents', CO, 3],
  ['4.1.1', 'Purpose and benefits', '7', 'concept', 'contents', CO, 3],
  ['4.1.2', 'Field of application', '8', 'concept', 'contents', CO, 3],
  ['4.1.3', 'Components of ISO/IEC 15504', '9', 'concept', 'contents', CO, 3],
  ['4.1.4', 'Relationship to other International Standards', '12', 'concept', 'contents', CO, 3],
  ['4.2', 'The assessment framework', '13', 'concept', 'contents', CO, 3],
  ['4.2.1', 'The context of assessment process', '13', 'concept', 'contents', CO, 3],
  ['4.2.2', 'Assessment indicators', '14', 'concept', 'contents', CO, 3],
  ['4.3', 'Competency of assessors', '14', 'concept', 'contents', CO, 3],
  ['4.4', 'Process improvement context', '15', 'concept', 'contents', CO, 3],
  ['5', 'Conformance', '', 'conformance', 'contents', CO + ' The printed page number is not legible in the extracted contents.', 3],
  ['Annex A', '(informative) Classified terms and definitions', '18', 'informative', 'contents', CO, 3],
];

const pr = (n: string, t: string, p: string, pg = 3): Row => [n, t, p, 'process', 'contents', CO, pg];
const kc = (n: string, t: string, p: string, pg = 3): Row => [n, t, p, 'concept', 'contents', CO, pg];
const R12207: Row[] = [
  ['1', 'Scope', '1', 'scope', 'body', 'Introduces the standard as a common framework of software life cycle processes.', 3],
  ['1.1', 'Overview', '1', 'scope', 'body', 'Summarises what the process framework covers.', 3],
  ['1.2', 'Purpose', '1', 'scope', 'body', 'Explains why a shared process vocabulary helps acquirers and suppliers.', 3],
  ['1.3', 'Field of application', '1', 'scope', 'body', 'Describes the kinds of software systems and organisations it applies to.', 3],
  ['1.4', 'Limitations', '2', 'scope', 'body', 'Notes what the document does not prescribe.', 3],
  ['2', 'Normative references', '2', 'reference', 'body', 'States the normative reference position for this document.', 3],
  ['3', 'Terms, definitions, and abbreviated terms', '2', 'definitions', 'partial', 'Vocabulary clause. Definitions, not process requirements.', 3],
  ['3.1', 'Terms and definitions', '2', 'definitions', 'partial', 'Defined terms. The preview stops at definition 3.1.47; remaining definitions are not available.', 3],
  ['3.2', 'Abbreviated terms', '11', 'definitions', 'contents', CO, 3],
  ['4', 'Conformance', '11', 'conformance', 'contents', CO, 3],
  ['4.1', 'Intended usage', '11', 'conformance', 'contents', CO, 3],
  ['4.2', 'Full conformance', '12', 'conformance', 'contents', CO, 3],
  ['4.2.1', 'Full conformance to outcomes', '12', 'conformance', 'contents', CO, 3],
  ['4.2.2', 'Full conformance to tasks', '12', 'conformance', 'contents', CO, 3],
  ['4.3', 'Tailored conformance', '12', 'conformance', 'contents', CO, 3],
  kc('5', 'Key concepts and application', '13'),
  kc('5.1', 'Introduction', '13'),
  kc('5.2', 'Software system concepts', '13'),
  kc('5.2.1', 'Software systems', '13'),
  kc('5.2.2', 'Software system structure', '13'),
  kc('5.2.3', 'Enabling systems', '15'),
  kc('5.2.4', 'Life cycle processes for the software system', '16'),
  kc('5.3', 'Organization and project concepts', '16'),
  kc('5.3.1', 'Organizations', '16'),
  kc('5.3.2', 'Organization and project-level adoption', '17'),
  kc('5.4', 'Life cycle concepts', '17'),
  kc('5.4.1', 'Software life cycle stages', '17'),
  kc('5.4.2', 'Life cycle model for the software system', '17'),
  kc('5.5', 'Process concepts', '19'),
  kc('5.5.1', 'Criteria for processes', '19'),
  kc('5.5.2', 'Description of processes', '19'),
  kc('5.5.3', 'General characteristics of processes', '19'),
  kc('5.5.4', 'Tailoring', '19'),
  kc('5.6', 'Process groups', '19'),
  kc('5.6.1', 'Introduction', '19'),
  kc('5.6.2', 'Agreement processes', '21'),
  kc('5.6.3', 'Organizational project-enabling processes', '22'),
  kc('5.6.4', 'Technical Management processes', '22'),
  kc('5.6.5', 'Technical processes', '22'),
  kc('5.7', 'Process application', '22'),
  kc('5.8', 'Process reference model', '23'),
  pr('6', 'Software life cycle processes', '24'),
  pr('6.1', 'Agreement processes', '24'),
  pr('6.1.1', 'Acquisition process', '24'),
  pr('6.1.2', 'Supply process', '27'),
  pr('6.2', 'Organizational Project-Enabling processes', '28'),
  pr('6.2.1', 'Life cycle model management process', '29'),
  pr('6.2.2', 'Infrastructure Management process', '30'),
  pr('6.2.3', 'Portfolio Management process', '31'),
  pr('6.2.4', 'Human Resource Management process', '33'),
  pr('6.2.5', 'Quality Management process', '34', 4),
  pr('6.2.6', 'Knowledge Management process', '36', 4),
  pr('6.3', 'Technical Management processes', '37', 4),
  pr('6.3.1', 'Project Planning process', '38', 4),
  pr('6.3.2', 'Project assessment and control process', '40', 4),
  pr('6.3.3', 'Decision Management process', '43', 4),
  pr('6.3.4', 'Risk Management process', '44', 4),
  pr('6.3.5', 'Configuration Management process', '46', 4),
  pr('6.3.6', 'Information Management process', '50', 4),
  pr('6.3.7', 'Measurement process', '52', 4),
  pr('6.3.8', 'Quality Assurance process', '53', 4),
  pr('6.4', 'Technical processes', '55', 4),
  pr('6.4.1', 'Business or Mission Analysis process', '56', 4),
  pr('6.4.2', 'Stakeholder Needs and Requirements Definition process', '59', 4),
  pr('6.4.3', 'System/Software requirements definition process', '63', 4),
  pr('6.4.4', 'Architecture Definition process', '66', 4),
  pr('6.4.5', 'Design Definition process', '71', 4),
  pr('6.4.6', 'System Analysis process', '74', 4),
  pr('6.4.7', 'Implementation process', '75', 4),
  pr('6.4.8', 'Integration process', '79', 4),
  pr('6.4.9', 'Verification process', '82', 4),
  pr('6.4.10', 'Transition process', '85', 4),
  pr('6.4.11', 'Validation process', '89', 4),
  pr('6.4.12', 'Operation process', '92', 4),
  pr('6.4.13', 'Maintenance process', '95', 4),
  pr('6.4.14', 'Disposal process', '99', 4),
  ['Annex A', '(normative) Tailoring process', '102', 'conformance', 'contents', CO, 4],
  ['Annex B', '(informative) Examples of process information items', '104', 'informative', 'contents', CO, 4],
  ['Annex C', '(informative) Process Reference Model for assessment purposes', '107', 'informative', 'contents', CO, 4],
  ['Annex D', '(informative) Process integration and process constructs', '109', 'informative', 'contents', CO, 4],
  ['Annex E', '(informative) Process views', '111', 'informative', 'contents', CO, 4],
  ['Annex F', '(informative) Software system architecture modelling', '120', 'informative', 'contents', CO, 4],
  ['Annex G', '(informative) Application of software life cycle processes to a system of systems', '123', 'informative', 'contents', CO, 5],
  ['Annex H', '(informative) Application of Agile', '127', 'informative', 'contents', CO, 5],
  ['Annex I', '(informative) Process Mapping from ISO/IEC/IEEE 12207:2008', '129', 'informative', 'contents', CO, 5],
];

export function seedClauses(): Clause[] {
  return [
    ...build(F17025, FRAMEWORKS[0].file!, 6, R17025),
    ...build(F15504, FRAMEWORKS[1].file!, 6, R15504),
    ...build(F12207, FRAMEWORKS[2].file!, 8, R12207),
  ];
}

export const COVERAGE_LABEL: Record<Coverage, { label: string; tone: string; explain: string }> = {
  body: { label: 'Body in source', tone: 'teal', explain: 'The clause text is present in the supplied PDF at the cited page. The summary here is an original paraphrase, not the standard text.' },
  partial: { label: 'Partial preview', tone: 'amber', explain: 'The supplied preview starts this clause but stops before it ends. Treat as incomplete.' },
  contents: { label: 'Contents only', tone: 'plum', explain: 'Only the heading appears on the contents page. The requirement text is not available, so no requirement can be inferred from it.' },
  none: { label: 'No source', tone: 'slate', explain: 'Entered by a user without a linked source page. Verify against a licensed edition before relying on it.' },
};

export const KIND_LABEL: Record<ClauseKind, string> = {
  scope: 'Scope', reference: 'Normative reference', definitions: 'Definitions', requirement: 'Requirement',
  concept: 'Concept / guidance', conformance: 'Conformance', process: 'Process description', informative: 'Informative annex',
};
