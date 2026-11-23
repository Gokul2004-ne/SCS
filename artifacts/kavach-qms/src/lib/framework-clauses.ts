export interface FrameworkClause {
  number: string;
  title: string;
  description: string;
}

export const FRAMEWORK_CLAUSES: Record<string, FrameworkClause[]> = {
  iso17025: [
    {
      number: '4.1',
      title: 'Impartiality',
      description:
        'Laboratory activities shall be undertaken impartially and structured and managed to safeguard impartiality. Risks to impartiality must be identified and eliminated or minimised on an ongoing basis.',
    },
    {
      number: '4.2',
      title: 'Confidentiality',
      description:
        'The laboratory shall be responsible, through legally enforceable agreements, for the management of all information obtained or created during laboratory activities, with customer notice prior to release.',
    },
    {
      number: '5',
      title: 'Structural Requirements',
      description:
        'The laboratory shall be a legal entity or a defined part of a legal entity, specify responsibility, authority and interrelationships of personnel managing and performing activities.',
    },
    {
      number: '6.1',
      title: 'General Resources',
      description:
        'The laboratory shall have available the personnel, facilities, equipment, systems and support services necessary to manage and perform its laboratory activities.',
    },
    {
      number: '6.2',
      title: 'Personnel Competence & Authorisation',
      description:
        'All personnel who could influence laboratory activities shall act impartially, be competent, and have documented qualifications, training, technical knowledge and authorisations.',
    },
    {
      number: '6.3',
      title: 'Facilities & Environmental Conditions',
      description:
        'Facilities and environmental conditions shall be suitable for laboratory activities and shall not adversely affect the validity of results. Environmental factors must be monitored and controlled.',
    },
    {
      number: '6.4',
      title: 'Equipment & Calibration',
      description:
        'Equipment shall be suitable, calibrated when measurement accuracy or uncertainty affects result validity, uniquely identified, maintained, and operated under controlled calibration status.',
    },
    {
      number: '6.5',
      title: 'Metrological Traceability',
      description:
        'The laboratory shall establish and maintain metrological traceability of its measurement results through an unbroken, documented calibration chain linked to SI reference standards.',
    },
    {
      number: '6.6',
      title: 'Externally Provided Products & Services',
      description:
        'The laboratory shall ensure that only suitable externally provided products and services (including calibration and testing suppliers) are evaluated, approved and used.',
    },
    {
      number: '7.1',
      title: 'Review of Requests, Tenders & Contracts',
      description:
        'The laboratory shall have a procedure to review customer requirements, verify technical capability, and document agreed methods and decision rules prior to work commencement.',
    },
    {
      number: '7.2',
      title: 'Selection, Verification & Validation of Methods',
      description:
        'Appropriate standard or validated non-standard methods shall be selected, verified before introduction, and documented to ensure fitness for intended measurement use.',
    },
    {
      number: '7.4',
      title: 'Handling of Test & Calibration Items',
      description:
        'The laboratory shall have procedures for transportation, receipt, identification, storage and handling to prevent deterioration, contamination or loss during test custody.',
    },
    {
      number: '7.5',
      title: 'Technical Records',
      description:
        'Technical records shall contain sufficient detail to enable repetition of the activity under conditions as close as possible to the original, and trace factors and personnel involved.',
    },
    {
      number: '7.6',
      title: 'Evaluation of Measurement Uncertainty',
      description:
        'The laboratory shall identify all contributions to measurement uncertainty and evaluate uncertainty using appropriate statistical analysis and uncertainty budgets.',
    },
    {
      number: '7.7',
      title: 'Ensuring Validity of Results',
      description:
        'The laboratory shall monitor result validity using reference materials, blind re-testing, control charts, and participation in proficiency testing or inter-laboratory comparisons.',
    },
    {
      number: '7.8',
      title: 'Reporting of Results',
      description:
        'Reports and calibration certificates shall be reviewed and authorized before release, and report results accurately, clearly, unambiguously, including measurement uncertainty.',
    },
    {
      number: '7.10',
      title: 'Nonconforming Work',
      description:
        'The laboratory shall have a procedure when any aspect of testing or calibration does not conform to procedures, including immediate containment, risk evaluation and authorization.',
    },
    {
      number: '7.11',
      title: 'Control of Data & Information Management',
      description:
        'Laboratory Information Management Systems (LIMS) and automated telemetry tools shall be validated, protected against tampering, backed up, and maintained under configuration control.',
    },
    {
      number: '8.5',
      title: 'Actions to Address Risks & Opportunities',
      description:
        'The laboratory shall consider risks and opportunities associated with laboratory activities to assure system integrity and prevent or reduce undesired effects.',
    },
    {
      number: '8.7',
      title: 'Corrective Actions',
      description:
        'When nonconformities occur, the laboratory shall react, take containment action, investigate root causes using 8D or equivalent discipline, and evaluate action effectiveness.',
    },
  ],

  iso9001: [
    {
      number: '4.1',
      title: 'Context of the Organization',
      description:
        'Determine external and internal issues relevant to organizational purpose and strategic direction that affect its ability to achieve QMS intended outcomes.',
    },
    {
      number: '4.2',
      title: 'Needs & Expectations of Interested Parties',
      description:
        'Determine interested parties relevant to the QMS and their statutory, regulatory, and quality requirements.',
    },
    {
      number: '4.4',
      title: 'Quality Management System & Processes',
      description:
        'Establish, implement, maintain and continually improve QMS processes, process inputs/outputs, performance criteria, and interactions.',
    },
    {
      number: '5.1',
      title: 'Leadership & Commitment',
      description:
        'Top management shall demonstrate leadership and commitment regarding the quality management system and customer focus.',
    },
    {
      number: '5.2',
      title: 'Quality Policy',
      description:
        'Establish, maintain and communicate a quality policy supporting organizational strategic direction and commitment to continual improvement.',
    },
    {
      number: '6.1',
      title: 'Actions to Address Risks & Opportunities',
      description:
        'Determine risks and opportunities that need to be addressed to assure QMS outcomes, enhance desirable effects, and prevent failures.',
    },
    {
      number: '7.1',
      title: 'Resources & Infrastructure',
      description:
        'Determine and provide resources needed for QMS operation, including monitoring and measuring resources with documented calibration validity.',
    },
    {
      number: '7.5',
      title: 'Documented Information',
      description:
        'Create, update and control documented information required by the standard, ensuring identification, format, approval, and protection.',
    },
    {
      number: '8.1',
      title: 'Operational Planning & Control',
      description:
        'Plan, implement and control processes needed to meet requirements for product and service provision in accordance with quality criteria.',
    },
    {
      number: '8.5',
      title: 'Production & Service Provision',
      description:
        'Implement production and service delivery under controlled conditions, including traceability, verification, and customer property protection.',
    },
    {
      number: '8.7',
      title: 'Control of Nonconforming Outputs',
      description:
        'Ensure outputs that do not conform to requirements are identified and controlled to prevent unintended delivery or operational use.',
    },
    {
      number: '9.2',
      title: 'Internal Audit',
      description:
        'Conduct internal audits at planned intervals to determine whether the QMS conforms to planned arrangements and is effectively implemented.',
    },
    {
      number: '10.2',
      title: 'Nonconformity & Corrective Action',
      description:
        'React to nonconformity, take action to control and correct it, eliminate root causes to prevent recurrence, and review effectiveness.',
    },
  ],

  iso12207: [
    {
      number: '6.1',
      title: 'Agreement Processes',
      description:
        'Define activities necessary to establish agreements between acquirer and supplier, specifying software deliverables and acceptance criteria.',
    },
    {
      number: '6.2',
      title: 'Organizational Project-Enabling Processes',
      description:
        'Establish life cycle models, infrastructure, quality management, and asset reuse policies across software engineering projects.',
    },
    {
      number: '6.3.1',
      title: 'Project Planning Process',
      description:
        'Produce software project management plans defining work breakdown structures, schedules, budgets, technical gates, and resource allocations.',
    },
    {
      number: '6.3.5',
      title: 'Configuration Management Process',
      description:
        'Establish and maintain the integrity of software work products, code repositories, change control baselines, and release archives.',
    },
    {
      number: '6.3.8',
      title: 'Quality Assurance Process',
      description:
        'Provide independent assurance that software work products and life cycle processes comply with contractual specifications and standards.',
    },
    {
      number: '6.4.3',
      title: 'Software Requirements Definition',
      description:
        'Transform operational stakeholder requirements into defined, testable, and traceable software technical requirements baselines.',
    },
    {
      number: '6.4.4',
      title: 'Architecture Definition Process',
      description:
        'Define software architecture models, architectural elements, interfaces, safety/security partitions, and select preferred baselines.',
    },
    {
      number: '6.4.5',
      title: 'Design Definition Process',
      description:
        'Provide detailed software unit design, algorithmic logic, internal interfaces, data structures, and bidirectional trace to requirements.',
    },
    {
      number: '6.4.7',
      title: 'Software Implementation Process',
      description:
        'Produce software code units, compile binaries according to coding standards, and execute automated unit test verification.',
    },
    {
      number: '6.4.8',
      title: 'Software Integration Process',
      description:
        'Combine software units and components into integrated software builds, verifying interface compatibility and regression baselines.',
    },
    {
      number: '6.4.9',
      title: 'Verification Process',
      description:
        'Provide objective evidence through code reviews, static analysis, structural coverage, and formal testing that deliverables meet requirements.',
    },
    {
      number: '6.4.11',
      title: 'Validation Process',
      description:
        'Provide objective evidence that the software fulfills its intended mission and operational use in target hardware and field conditions.',
    },
  ],

  iso15504: [
    {
      number: 'ENG.1',
      title: 'Requirements Elicitation',
      description:
        'Gather, analyze, process and track customer and system requirements throughout the software engineering lifecycle.',
    },
    {
      number: 'ENG.3',
      title: 'System Architectural Design',
      description:
        'Establish system architecture identifying software, hardware, and communication items with defined interface specifications.',
    },
    {
      number: 'ENG.4',
      title: 'Software Requirements Analysis',
      description:
        'Transform system requirements into a consistent baseline of analyzed, prioritized, and testable software requirements.',
    },
    {
      number: 'ENG.5',
      title: 'Software Design',
      description:
        'Establish detailed software design partitioned into units, data structures, and documented behavioral sequences.',
    },
    {
      number: 'ENG.6',
      title: 'Software Construction',
      description:
        'Produce verified software code units implementing the software design in accordance with language coding and safety guidelines.',
    },
    {
      number: 'ENG.7',
      title: 'Software Integration',
      description:
        'Integrate software units according to the integration plan and verify interface and execution consistency.',
    },
    {
      number: 'ENG.8',
      title: 'Software Testing',
      description:
        'Execute test suites against software releases, recording test logs, pass/fail status, and coverage metrics.',
    },
    {
      number: 'SUP.1',
      title: 'Quality Assurance',
      description:
        'Independently monitor and audit work products and software engineering processes for compliance with standard procedures.',
    },
    {
      number: 'SUP.8',
      title: 'Configuration Management',
      description:
        'Control and record modifications to software items, maintaining baseline integrity, change requests, and release hashes.',
    },
    {
      number: 'MAN.5',
      title: 'Risk Management',
      description:
        'Continuously identify, analyze, prioritize, and treat technical and project risks with documented contingency plans.',
    },
  ],

  iso42001: [
    {
      number: '4.1',
      title: 'Context & AI Specific Scope',
      description:
        'Determine external and internal factors, stakeholder expectations, and intended applications relevant to AI system governance.',
    },
    {
      number: '5.1',
      title: 'Leadership & AI Governance',
      description:
        'Top management shall demonstrate commitment to responsible, ethical, transparent, and safe AI development and operation.',
    },
    {
      number: '6.1.4',
      title: 'AI System Impact Assessment',
      description:
        'Conduct and document formal impact assessments evaluating safety, fundamental rights, bias, security, and unintended behaviors of AI systems.',
    },
    {
      number: '7.2',
      title: 'AI Competence & Data Literacy',
      description:
        'Ensure personnel involved in developing, evaluating, and supervising AI models possess verifiable technical competence and ethics training.',
    },
    {
      number: '8.1',
      title: 'Operational Planning of AI Lifecycle',
      description:
        'Implement controlled procedures for data provenance, data quality, feature engineering, model training, validation, and versioning.',
    },
    {
      number: '8.4',
      title: 'AI Impact Assessment Operation',
      description:
        'Operationalize ongoing risk and impact assessments throughout runtime deployment, updating risk controls as model data evolves.',
    },
    {
      number: '9.1',
      title: 'Monitoring, Measurement & Evaluation of AI',
      description:
        'Continuously monitor AI system performance, accuracy drift, bias metrics, adversarial robustness, and explainability records.',
    },
    {
      number: '10.2',
      title: 'AI Nonconformity & Incident Management',
      description:
        'React to AI anomalies, hallucinations, or safety violations with rapid containment, model rollback, root cause analysis, and retuning.',
    },
  ],

  iso17020: [
    {
      number: '4.1',
      title: 'Impartiality & Independence',
      description:
        'Inspection activities shall be undertaken impartially with structural independence (Type A/B/C) free from commercial or operational pressures.',
    },
    {
      number: '4.2',
      title: 'Confidentiality',
      description:
        'The inspection body shall protect confidential information obtained during inspections through legally binding commitments.',
    },
    {
      number: '6.1',
      title: 'Personnel Competence',
      description:
        'Inspectors shall possess relevant qualifications, training, experience, and knowledge of inspection requirements and equipment operation.',
    },
    {
      number: '7.1',
      title: 'Inspection Methods & Procedures',
      description:
        'Use standardized, validated inspection methods and procedures, ensuring safety and proper handling of inspection items.',
    },
    {
      number: '7.4',
      title: 'Inspection Records & Certificates',
      description:
        'Maintain retrievable, traceable records of inspection observations, data, calibrations, and authorized certificates.',
    },
  ],

  iso17065: [
    {
      number: '4.1',
      title: 'Legal & Contractual Matters',
      description:
        'Maintain legally enforceable agreements with clients for certification activities and authorized mark usage.',
    },
    {
      number: '4.2',
      title: 'Management of Impartiality',
      description:
        'Structure product certification activities to safeguard impartiality and prevent conflicts of interest.',
    },
    {
      number: '7.4',
      title: 'Evaluation',
      description:
        'Plan and conduct evaluation activities (testing, inspection, factory audit) against certification scheme standards.',
    },
    {
      number: '7.6',
      title: 'Certification Decision',
      description:
        'Assign independent persons who did not participate in evaluation to review evidence and make certification decisions.',
    },
  ],

  iso17021: [
    {
      number: '5.2',
      title: 'Management of Impartiality',
      description:
        'Certification bodies shall identify, analyze, and eliminate or minimize threats to impartiality on a continuous basis.',
    },
    {
      number: '7.1',
      title: 'Competence of Personnel',
      description:
        'Define and verify auditor competence criteria for specific management system standards and technical sectors.',
    },
    {
      number: '9.4',
      title: 'Conducting Audits',
      description:
        'Execute Stage 1 document review and Stage 2 on-site audits, sampling objective evidence and documenting audit findings.',
    },
  ],
};

export function getClausesForFramework(frameworkId: string): FrameworkClause[] {
  const norm = frameworkId.toLowerCase().replace(/[^a-z0-9]/g, '');
  for (const [key, clauses] of Object.entries(FRAMEWORK_CLAUSES)) {
    if (norm.includes(key.toLowerCase()) || key.toLowerCase().includes(norm)) {
      return clauses;
    }
  }
  // Default to ISO 17025 if not explicitly mapped
  return FRAMEWORK_CLAUSES.iso17025;
}
