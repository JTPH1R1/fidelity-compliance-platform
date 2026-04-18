// =============================================================================
// Fidelity Insurance Assessors — DPA 2024 Compliance Audit Tool
// Checklist Data: Malawi Data Protection Act 2024
// Regulator: Malawi Communications Regulatory Authority (MACRA) / DPA
// Effective: 3 June 2024
// =============================================================================

const CHECKLIST_DATA = {

  meta: {
    title: "Malawi Data Protection Act 2024 — Compliance Audit",
    actName: "Data Protection Act, 2024",
    effectiveDate: "3 June 2024",
    regulator: "Malawi Communications Regulatory Authority (MACRA) / Data Protection Authority (DPA)",
    penaltyFine: "MWK 5,000,000",
    penaltyImprisonment: "12 months",
    transitionMajor: "6 months (entities of major importance)",
    transitionOrdinary: "2 years (ordinary data controllers/processors)",
    version: "1.0"
  },

  grades: [
    {
      min: 90, max: 100,
      label: "DISTINCTION",
      badge: "Audit Ready",
      description: "Your organization is fully compliant and demonstrates strong data protection governance. You are ready for a MACRA audit.",
      color: "#0d7a5f",
      textColor: "#ffffff",
      bg: "#d1f2ea",
      border: "#0d7a5f",
      icon: "✓"
    },
    {
      min: 75, max: 89,
      label: "PASS",
      badge: "Substantially Compliant",
      description: "Your organization meets most requirements with minor gaps. Address the identified areas before a formal audit.",
      color: "#1a7a3c",
      textColor: "#ffffff",
      bg: "#d4edda",
      border: "#1a7a3c",
      icon: "✓"
    },
    {
      min: 60, max: 74,
      label: "CONDITIONAL PASS",
      badge: "Needs Improvement",
      description: "Your organization has significant compliance gaps. A structured remediation plan is required within 90 days.",
      color: "#856404",
      textColor: "#ffffff",
      bg: "#fff3cd",
      border: "#856404",
      icon: "⚠"
    },
    {
      min: 40, max: 59,
      label: "FAIL",
      badge: "Non-Compliant",
      description: "Your organization has major compliance deficiencies. Immediate remediation is required to avoid regulatory action by MACRA.",
      color: "#c0392b",
      textColor: "#ffffff",
      bg: "#f8d7da",
      border: "#c0392b",
      icon: "✗"
    },
    {
      min: 0, max: 39,
      label: "CRITICAL FAIL",
      badge: "Seriously Non-Compliant",
      description: "Your organization is seriously non-compliant. You face immediate risk of regulatory enforcement, fines, and reputational damage. Urgent action required.",
      color: "#491217",
      textColor: "#ffffff",
      bg: "#f5c6cb",
      border: "#491217",
      icon: "✗"
    }
  ],

  sections: [

    // =========================================================================
    // SECTION 1: Registration & Classification
    // =========================================================================
    {
      id: "s1",
      number: 1,
      title: "Registration & Classification",
      icon: "📋",
      actRef: "Sections 4, 17–21 — Data Protection Act 2024",
      weight: 6,

      lawText: "Every person who processes personal data of more than 10,000 data subjects, or processes personal data of significance to the economy, society, or national security of Malawi, shall register with MACRA as a data controller or data processor before commencing processing activities. Registration details must be kept current and updated upon material changes.",

      explanation: "This section determines whether your organization knows its legal role and has formally registered with the regulator. Under the Act, any organization that collects, stores, uses, or shares personal information about people must first understand whether it is a <strong>Data Controller</strong> (decides why and how data is processed — e.g., a bank collecting customer details) or a <strong>Data Processor</strong> (processes data on someone else's instructions — e.g., a payroll company processing employee data for a client).\n\nIf your organization processes data for more than <strong>10,000 individuals</strong>, or handles data that affects the national economy, society, or security (e.g., financial records, health data, telecommunications data), you are legally required to <strong>register with MACRA</strong> before processing. Failing to register is a criminal offence under the Act.",

      items: [
        {
          id: "q1",
          question: "Has your organization identified all personal data it collects, stores, uses, or shares?",
          actClause: "Section 4 — Definitions",
          hint: "Personal data is any information relating to an identified or identifiable person. This includes: names, ID numbers, phone numbers, email addresses, financial records, health information, location data, photos, IP addresses, and employee records. Start by creating a simple data map.",
          critical: false
        },
        {
          id: "q2",
          question: "Has your organization formally determined whether it is a Data Controller, Data Processor, or both?",
          actClause: "Section 4 — Definitions",
          hint: "You are a Controller if you decide WHY and HOW data is processed (e.g., a hospital deciding to collect patient health records). You are a Processor if you process data under another organization's instructions (e.g., an IT company managing a hospital's database). You can be both simultaneously for different activities.",
          critical: true
        },
        {
          id: "q3",
          question: "Do you know approximately how many data subjects (individuals) your organization holds data on?",
          actClause: "Section 18 — Registration threshold",
          hint: "Count all individuals whose data you hold: customers, employees, suppliers, website visitors, beneficiaries, students, patients, etc. If this number exceeds 10,000, registration with MACRA is mandatory.",
          critical: false
        },
        {
          id: "q4",
          question: "Has your organization registered with MACRA as required under the Act?",
          actClause: "Sections 18–21 — Registration",
          hint: "Registration must be completed BEFORE processing begins. Contact MACRA or visit the Data Protection Authority website (dpa.mw) for the registration process. MACRA maintains a public register of all data controllers and processors.",
          critical: true
        },
        {
          id: "q5",
          question: "Are your organization's registration details with MACRA current and up to date?",
          actClause: "Section 21 — Updates to registration",
          hint: "Any material change to your organization's processing activities — such as a new product, system, merger, or change in the volume of data processed — must be notified to MACRA within the required period.",
          critical: false
        }
      ]
    },

    // =========================================================================
    // SECTION 2: Data Protection Principles
    // =========================================================================
    {
      id: "s2",
      number: 2,
      title: "Data Protection Principles",
      icon: "⚖️",
      actRef: "Part III, Section 7 — Data Protection Act 2024",
      weight: 12,

      lawText: "A data controller or data processor shall process personal data in accordance with the following principles: (a) lawfulness, fairness and transparency; (b) purpose limitation; (c) data minimisation; (d) accuracy; (e) storage limitation; (f) integrity and confidentiality; (g) accountability; and (h) data quality. These principles apply to ALL personal data processing activities.",

      explanation: "The 8 Data Protection Principles are the foundation of the entire Act. Every single processing activity your organization carries out must comply with all 8 principles. Think of them as the rules of the road — not optional guidelines, but legal requirements.\n\n<strong>1. Lawfulness, Fairness & Transparency:</strong> Process data legally, openly, and fairly.\n<strong>2. Purpose Limitation:</strong> Only use data for the specific reason it was collected.\n<strong>3. Data Minimisation:</strong> Collect only what you actually need — nothing more.\n<strong>4. Accuracy:</strong> Keep data correct and up to date.\n<strong>5. Storage Limitation:</strong> Delete data when you no longer need it.\n<strong>6. Integrity & Confidentiality:</strong> Protect data from unauthorized access and loss.\n<strong>7. Accountability:</strong> Be able to prove you are complying.\n<strong>8. Data Quality:</strong> Ensure data is fit for the purpose it is used for.\n\nViolating any principle is a breach of the Act, regardless of whether harm results.",

      items: [
        {
          id: "q1",
          question: "Does your organization have a documented legal basis for every data processing activity?",
          actClause: "Principle 1 — Lawfulness",
          hint: "For each category of data you process, you must be able to point to a lawful basis: consent, contractual necessity, legal obligation, vital interests, public task, or legitimate interests. This should be documented — not just assumed.",
          critical: true
        },
        {
          id: "q2",
          question: "Do you provide clear Privacy Notices to individuals informing them how their data is used?",
          actClause: "Principle 1 — Transparency",
          hint: "Privacy Notices must be given at or before the point of data collection. They should explain: what data you collect, why, who you share it with, how long you keep it, and individual rights. This applies to websites, intake forms, contracts, and employee onboarding.",
          critical: true
        },
        {
          id: "q3",
          question: "Do you limit data collection to only what is strictly necessary for the stated purpose?",
          actClause: "Principle 3 — Data Minimisation",
          hint: "If you only need a name and email for a subscription, do not collect ID numbers, physical addresses, or family details. Review all your forms and systems to remove unnecessary data fields.",
          critical: false
        },
        {
          id: "q4",
          question: "Do you have processes to ensure personal data remains accurate and up to date?",
          actClause: "Principle 4 — Accuracy",
          hint: "This includes: allowing customers to update their details, regular data cleansing exercises, and procedures to correct data when errors are reported.",
          critical: false
        },
        {
          id: "q5",
          question: "Do you have a documented data retention policy defining how long each type of data is kept?",
          actClause: "Principle 5 — Storage Limitation",
          hint: "Each data category should have a defined retention period (e.g., 'employee records: 7 years after departure'). After the period ends, data must be securely deleted or anonymized. Do not keep data indefinitely 'just in case.'",
          critical: true
        },
        {
          id: "q6",
          question: "Do you only use personal data for the purpose for which it was originally collected?",
          actClause: "Principle 2 — Purpose Limitation",
          hint: "If you collected customer contact details for billing, you cannot use them for marketing without a separate lawful basis. If you need to repurpose data, you must assess compatibility with the original purpose or obtain fresh consent.",
          critical: true
        },
        {
          id: "q7",
          question: "Can your organization demonstrate compliance with all data protection principles (accountability)?",
          actClause: "Principle 7 — Accountability",
          hint: "This means having documented policies, staff training records, audit logs, and being able to show MACRA evidence of compliance at any time. Compliance must be provable — not just practiced.",
          critical: false
        }
      ]
    },

    // =========================================================================
    // SECTION 3: Lawful Basis for Processing
    // =========================================================================
    {
      id: "s3",
      number: 3,
      title: "Lawful Basis for Processing",
      icon: "📝",
      actRef: "Part III, Sections 8–13 — Data Protection Act 2024",
      weight: 10,

      lawText: "Processing of personal data shall only be lawful if it is based on one of the following: (a) the data subject has given consent; (b) processing is necessary for performance of a contract; (c) processing is necessary for compliance with a legal obligation; (d) processing is necessary to protect the vital interests of the data subject; (e) processing is necessary for the performance of a public task; or (f) processing is necessary for legitimate interests pursued by the controller. Special categories of data require explicit consent or specific legal grounds.",

      explanation: "Every time your organization processes personal data, there must be a specific legal reason — a 'lawful basis.' You cannot process data simply because it would be convenient or useful. There are 6 lawful bases under the Act.\n\n<strong>Consent</strong> is the most commonly used but also the most regulated — it must be freely given, specific, informed, and unambiguous. Pre-ticked boxes, bundled consent, or vague statements are not valid.\n\n<strong>Special/Sensitive Categories</strong> of data require even stronger protection. These include: health/medical data, biometric data, genetic data, racial/ethnic origin, political opinions, religious beliefs, sexual orientation, and criminal records. Explicit consent or a specific legal ground is required for these categories.",

      items: [
        {
          id: "q1",
          question: "Has your organization identified and documented the specific lawful basis for each category of data processing?",
          actClause: "Section 8 — Lawful basis",
          hint: "Create a processing register: 'We process [data type] for [purpose] under [lawful basis — e.g. consent / contract / legal obligation].' This must be documented and available for MACRA inspection.",
          critical: true
        },
        {
          id: "q2",
          question: "Where you rely on consent, is it freely given, specific, informed, and unambiguous?",
          actClause: "Section 9 — Consent requirements",
          hint: "Valid consent: the individual must actively opt in (no pre-ticked boxes), know exactly what they are consenting to, consent to a specific purpose (not blanket consent), and consent without any penalty for refusing.",
          critical: true
        },
        {
          id: "q3",
          question: "Do you provide a simple and easy way for data subjects to withdraw their consent at any time?",
          actClause: "Section 9(3) — Withdrawal of consent",
          hint: "Withdrawing consent must be as easy as giving it. You cannot make it harder to opt out than to opt in. You must stop processing the relevant data promptly after consent is withdrawn.",
          critical: false
        },
        {
          id: "q4",
          question: "Do you have a documented procedure for handling special category (sensitive) personal data?",
          actClause: "Section 11 — Special categories of data",
          hint: "Sensitive data includes: health/medical records, biometric data, financial vulnerability information, HIV status, religious beliefs, political opinions, racial/ethnic origin, and criminal records. These require explicit consent (not just ordinary consent) or a specific legal ground.",
          critical: true
        },
        {
          id: "q5",
          question: "Are staff who collect personal data trained on what constitutes valid consent?",
          actClause: "Section 9 — Organizational measures",
          hint: "Staff at reception, sales, call centres, clinics, HR, and customer service all collect data regularly. They must understand the difference between valid and invalid consent and know how to document it properly.",
          critical: false
        }
      ]
    },

    // =========================================================================
    // SECTION 4: Data Subject Rights
    // =========================================================================
    {
      id: "s4",
      number: 4,
      title: "Data Subject Rights",
      icon: "🧑‍⚖️",
      actRef: "Part V, Sections 26–40 — Data Protection Act 2024",
      weight: 12,

      lawText: "Every data subject has the following rights: (a) right of access to their personal data; (b) right to rectification of inaccurate data; (c) right to erasure ('right to be forgotten'); (d) right to restriction of processing; (e) right to data portability; (f) right to object to processing; and (g) rights relating to automated decision-making and profiling. Data controllers must have documented procedures to respond to these rights requests within required timeframes.",

      explanation: "The Act grants every individual (data subject) 7 rights over their personal data. Your organization must have clear, documented procedures for handling each type of request. You must respond promptly — failure to respond is itself a breach of the Act.\n\n<strong>Key Rights:</strong>\n• <strong>Access:</strong> Individuals can request a copy of all data you hold about them.\n• <strong>Rectification:</strong> Individuals can require you to correct inaccurate data.\n• <strong>Erasure:</strong> Individuals can request deletion of their data ('Right to be Forgotten').\n• <strong>Portability:</strong> Individuals can request their data in a machine-readable format.\n• <strong>Objection:</strong> Individuals can object to certain types of processing.\n• <strong>Restriction:</strong> Individuals can request that you temporarily stop processing their data.\n• <strong>Automated decisions:</strong> Individuals have protections against purely automated decisions with significant effects on them.",

      items: [
        {
          id: "q1",
          question: "Do you have a documented procedure for handling Data Subject Access Requests (DSARs)?",
          actClause: "Section 26 — Right of access",
          hint: "An individual can request to see all personal data you hold about them. You must provide a copy within a reasonable timeframe. The first copy must be provided free of charge. Your procedure should include: how to receive the request, how to verify identity, how to locate and compile data, and how to respond.",
          critical: true
        },
        {
          id: "q2",
          question: "Can data subjects request correction of inaccurate or incomplete personal data held about them?",
          actClause: "Section 29 — Right to rectification",
          hint: "When an individual tells you their data is incorrect (e.g., wrong address, misspelled name), you must have a process to update it promptly. You should also notify any third parties to whom you have disclosed the inaccurate data.",
          critical: false
        },
        {
          id: "q3",
          question: "Do you have a process for handling data erasure (deletion) requests?",
          actClause: "Section 30 — Right to erasure",
          hint: "Individuals can request that you delete their data when: consent is withdrawn, the data is no longer necessary, or the data was unlawfully processed. You must assess each request and delete data (or explain why deletion is not possible, e.g., legal obligation to retain).",
          critical: true
        },
        {
          id: "q4",
          question: "Can data subjects receive their personal data in a portable, machine-readable format?",
          actClause: "Section 33 — Right to portability",
          hint: "If you process data by automated means (systems/software) under consent or contract, individuals can request their data in a structured, commonly used format (CSV, JSON, XML) to transfer to another provider.",
          critical: false
        },
        {
          id: "q5",
          question: "Do you have a documented process to handle objections to data processing?",
          actClause: "Section 35 — Right to object",
          hint: "Individuals can object to processing based on legitimate interests, or to direct marketing at any time. Upon receiving an objection to marketing, you must stop processing for that purpose immediately. For other processing, you must demonstrate compelling legitimate grounds to continue.",
          critical: false
        },
        {
          id: "q6",
          question: "Do you respond to data subject rights requests within required timeframes and keep a log of responses?",
          actClause: "Part V — Response timeframes",
          hint: "Log every rights request: date received, type, identity verification date, response date, and outcome. Failure to respond within the required timeframe is a breach of the Act, even if you later comply.",
          critical: true
        },
        {
          id: "q7",
          question: "Do data subjects know how to exercise their rights (published contact details and process)?",
          actClause: "Transparency requirements",
          hint: "Your Privacy Notice must clearly explain: all rights available, how to submit a request, who to contact (name or role + email address), and what to expect in terms of process and timing.",
          critical: false
        }
      ]
    },

    // =========================================================================
    // SECTION 5: Data Protection Officer (DPO)
    // =========================================================================
    {
      id: "s5",
      number: 5,
      title: "Data Protection Officer (DPO)",
      icon: "👤",
      actRef: "Part IV, Sections 22–25 — Data Protection Act 2024",
      weight: 6,

      lawText: "A data controller or data processor shall appoint a data protection officer where: (a) the controller or processor is a public authority or body; (b) the core activities of the controller or processor consist of processing operations which, by virtue of their nature, scope, and purposes, require regular and systematic monitoring of data subjects on a large scale; or (c) the core activities consist of processing on a large scale of special categories of data or personal data relating to criminal convictions. The DPO shall have expert knowledge of data protection law.",

      explanation: "A Data Protection Officer (DPO) is the person responsible for overseeing your organization's data protection compliance. Appointing a DPO is legally mandatory for certain organizations and strongly recommended for all others.\n\n<strong>You MUST appoint a DPO if your organization:</strong>\n• Is a government body, ministry, or public authority\n• Conducts large-scale, systematic monitoring of individuals (e.g., CCTV, location tracking, behavioral profiling)\n• Processes special/sensitive data (health, financial, biometric) on a large scale\n\n<strong>The DPO must:</strong>\n• Have expert knowledge of data protection law and practices\n• Be independent — cannot be penalized for doing their job\n• Report directly to senior management\n• Have their contact details published for data subjects to use\n\nSmaller organizations that do not legally require a DPO should still designate a responsible person to oversee compliance.",

      items: [
        {
          id: "q1",
          question: "Has your organization formally assessed whether it is legally required to appoint a DPO?",
          actClause: "Section 22 — DPO requirement",
          hint: "Even if not legally required, documenting your assessment (and the reasons why you concluded you do/do not need a DPO) demonstrates accountability to MACRA. Keep this assessment on file.",
          critical: true
        },
        {
          id: "q2",
          question: "If required, has a DPO been formally appointed with a documented role description?",
          actClause: "Section 22 — DPO appointment",
          hint: "The DPO appointment must be formal and documented. The role description should cover: duties, authority, independence, access to information, resources, and reporting line. The DPO can be internal (employee) or external (contracted specialist).",
          critical: true
        },
        {
          id: "q3",
          question: "Does the DPO have adequate expertise in data protection law, practices, and your sector?",
          actClause: "Section 23 — DPO qualifications",
          hint: "The DPO should have relevant qualifications, training, or demonstrable experience in data protection. Regular training and staying current with regulatory developments is essential.",
          critical: false
        },
        {
          id: "q4",
          question: "Is the DPO independent and able to perform their duties without conflicts of interest?",
          actClause: "Section 24 — DPO independence",
          hint: "The DPO must not hold a role that creates a conflict of interest (e.g., Head of Marketing or IT Director who also sets data processing policies). They must be free to report compliance issues to the highest management level without fear of dismissal.",
          critical: false
        },
        {
          id: "q5",
          question: "Are the DPO's contact details published and accessible to all data subjects?",
          actClause: "Section 25 — DPO contact publication",
          hint: "Publish the DPO's contact details (name or role title + email address) in your Privacy Notice, on your website, and in client-facing documents. Data subjects should know exactly who to contact for privacy matters.",
          critical: false
        }
      ]
    },

    // =========================================================================
    // SECTION 6: Data Protection Impact Assessment (DPIA)
    // =========================================================================
    {
      id: "s6",
      number: 6,
      title: "Data Protection Impact Assessment (DPIA)",
      icon: "🔍",
      actRef: "Part VI, Sections 41–45 — Data Protection Act 2024",
      weight: 8,

      lawText: "A data controller shall, prior to processing, carry out a data protection impact assessment where the processing is likely to result in a high risk to the rights of data subjects. This includes: processing involving automated decision-making with legal or significant effects; large-scale processing of special categories; systematic monitoring of publicly accessible areas; and processing involving new technologies. The DPIA report shall be submitted to MACRA prior to commencing processing.",

      explanation: "A Data Protection Impact Assessment (DPIA) is a formal, documented process for identifying and minimizing privacy risks BEFORE starting a new data processing activity. It is not optional — it is a legal requirement for high-risk activities.\n\n<strong>A DPIA is mandatory when you plan to:</strong>\n• Process health, financial, or other sensitive data at large scale\n• Install CCTV systems or other public area surveillance\n• Implement automated decision-making or profiling systems\n• Deploy new technology with significant privacy implications\n• Transfer large volumes of data to third parties\n• Monitor employees on a systematic basis\n\n<strong>The DPIA process involves:</strong>\n1. Describing the processing activity in detail\n2. Assessing the necessity and proportionality\n3. Identifying risks to individuals\n4. Identifying measures to mitigate those risks\n5. Documenting the outcome\n6. Submitting to MACRA before commencing\n\nThe key rule: <strong>DPIA first, processing second.</strong>",

      items: [
        {
          id: "q1",
          question: "Has your organization identified all current and planned processing activities that qualify as high-risk?",
          actClause: "Section 41 — When DPIA is required",
          hint: "High-risk activities include: large-scale health/financial data processing, employee monitoring systems, customer profiling, CCTV/biometric systems, automated loan approvals, loyalty program analytics, and any use of new or untested technology involving personal data.",
          critical: true
        },
        {
          id: "q2",
          question: "Is a DPIA conducted and documented BEFORE starting any new high-risk processing activity?",
          actClause: "Sections 41–42 — DPIA process",
          hint: "The DPIA must be completed before processing begins — not after. It must include: a description of the processing, its purposes and necessity, risk assessment, and mitigation measures. A DPIA template is a useful starting tool.",
          critical: true
        },
        {
          id: "q3",
          question: "Are DPIA reports submitted to MACRA before commencing high-risk processing?",
          actClause: "Section 43 — Submission to MACRA",
          hint: "Where a DPIA identifies residual high risk that cannot be sufficiently mitigated, you must consult MACRA before proceeding. MACRA may provide recommendations, impose conditions, or prohibit the processing. Keep records of all MACRA consultations.",
          critical: true
        },
        {
          id: "q4",
          question: "Are DPIAs reviewed and updated when processing activities change significantly?",
          actClause: "Section 42 — Review of DPIAs",
          hint: "A DPIA is a living document. If the nature, purpose, volume, or technology of a processing activity changes materially, the DPIA must be reviewed and updated. Set a schedule for periodic DPIA reviews (at least every 2 years, or after major changes).",
          critical: false
        },
        {
          id: "q5",
          question: "Is there a documented register of all DPIAs conducted, including outcomes and MACRA consultations?",
          actClause: "Accountability principle",
          hint: "Maintain a DPIA register: processing activity name, date of DPIA, risk level identified, mitigation measures, outcome (proceed/do not proceed), and any MACRA consultation reference numbers.",
          critical: false
        }
      ]
    },

    // =========================================================================
    // SECTION 7: Records of Processing Activities (RoPA)
    // =========================================================================
    {
      id: "s7",
      number: 7,
      title: "Records of Processing Activities (RoPA)",
      icon: "🗂️",
      actRef: "Part IV — Record-keeping obligations, Data Protection Act 2024",
      weight: 8,

      lawText: "Every data controller and data processor shall maintain a record of each processing activity under their responsibility. The record shall be made available to MACRA for inspection where required. The record shall include: the name and contact details of the controller/processor; the purposes of processing; a description of categories of data subjects and categories of personal data; the categories of recipients; transfers to third countries; retention periods; and a description of technical and organisational security measures.",

      explanation: "A Record of Processing Activities (RoPA) is essentially a comprehensive inventory of everything your organization does with personal data. Think of it as the 'data map' of your organization. It is one of the very first documents MACRA will request during a compliance audit.\n\n<strong>Your RoPA must cover ALL personal data across the organization:</strong>\n• Customer and client data\n• Employee and HR data\n• Supplier and contractor data\n• Marketing databases and email lists\n• Financial and billing records\n• Website analytics and cookies\n• CCTV footage\n• Medical or health records (if applicable)\n• Student or beneficiary records (if applicable)\n\n<strong>For each data category, the RoPA should record:</strong>\n• What data is collected\n• Why it is collected (purpose)\n• Legal basis for processing\n• Who has access to it\n• Who it is shared with\n• How long it is kept\n• How it is secured\n• Whether it is transferred outside Malawi",

      items: [
        {
          id: "q1",
          question: "Does your organization maintain a comprehensive Record of Processing Activities (RoPA)?",
          actClause: "Record-keeping requirements — DPA 2024",
          hint: "A RoPA can be maintained as a spreadsheet, database, or dedicated compliance software. What matters is that it covers all processing activities and is kept current. A basic template includes columns for: data category, processing purpose, lawful basis, data subjects, retention period, security measures, and third-party transfers.",
          critical: true
        },
        {
          id: "q2",
          question: "Does the RoPA cover ALL personal data processing activities across the entire organization?",
          actClause: "Comprehensiveness requirement",
          hint: "Do not only document 'obvious' data — include HR systems, payroll, CCTV, access control logs, email archives, website analytics, CRM systems, mobile apps, and any manual paper records. Departments should contribute their own data inventory.",
          critical: false
        },
        {
          id: "q3",
          question: "Does the RoPA include defined retention periods for every category of personal data?",
          actClause: "Storage limitation principle",
          hint: "For each data type in your RoPA, specify: how long it is retained (e.g., '3 years from end of contract') and the deletion/anonymization method used after the retention period ends.",
          critical: false
        },
        {
          id: "q4",
          question: "Does the RoPA document all data sharing — including third parties and any transfers outside Malawi?",
          actClause: "Transfer documentation",
          hint: "List every third party that receives personal data: cloud providers, payroll bureaus, IT support companies, courier services, marketing agencies, etc. Record: who receives data, what data, why, under what agreement, and the country of the recipient.",
          critical: false
        },
        {
          id: "q5",
          question: "Is the RoPA regularly reviewed and updated to reflect current processing activities?",
          actClause: "Accuracy and accountability",
          hint: "Assign an owner (e.g., the DPO or compliance officer) responsible for keeping the RoPA current. Review it at least every 12 months and whenever a new system, process, or data type is introduced.",
          critical: false
        },
        {
          id: "q6",
          question: "Is the RoPA stored in a format that can be readily provided to MACRA upon request?",
          actClause: "MACRA inspection rights",
          hint: "MACRA has the legal right to request your RoPA during audits or investigations. It should be stored digitally in a searchable, exportable format. Ensure the DPO or compliance lead knows where it is and can produce it quickly.",
          critical: true
        }
      ]
    },

    // =========================================================================
    // SECTION 8: Data Security Measures
    // =========================================================================
    {
      id: "s8",
      number: 8,
      title: "Data Security Measures",
      icon: "🔒",
      actRef: "Part VII, Sections 46–50 — Data Protection Act 2024",
      weight: 12,

      lawText: "A data controller and data processor shall implement appropriate technical and organisational measures to ensure a level of security appropriate to the risk. Such measures shall include, as appropriate: (a) the pseudonymisation and encryption of personal data; (b) the ability to ensure ongoing confidentiality, integrity, availability and resilience of processing systems; (c) the ability to restore availability and access to personal data in the event of a physical or technical incident; and (d) a process for regularly testing, assessing and evaluating the effectiveness of technical and organisational measures.",

      explanation: "Data security is about protecting personal data from unauthorized access, loss, destruction, or alteration. The Act requires all data controllers and processors to implement security measures that are <strong>appropriate to the risk</strong> — meaning proportionate to the sensitivity of the data and the potential harm if it were compromised.\n\n<strong>Security is not just about IT systems.</strong> It also covers:\n• Physical security (locked filing cabinets, clean desk policy, visitor access control)\n• Organizational measures (policies, procedures, staff training)\n• Technical measures (encryption, access controls, firewalls, backups)\n• Administrative controls (who has access to what data and why)\n\n<strong>Two specific technical measures mentioned in the Act:</strong>\n• <strong>Encryption:</strong> Converting data into a coded form so that only authorized parties can read it\n• <strong>Pseudonymisation:</strong> Replacing identifying information with artificial identifiers to reduce risk while retaining data utility\n\nA data breach that results from inadequate security — even if unintentional — will not excuse your organization from liability.",

      items: [
        {
          id: "q1",
          question: "Does your organization have a documented information security policy covering personal data?",
          actClause: "Section 46 — Security policy",
          hint: "The policy should address: password management, device security (laptops, phones, USBs), email security, data access controls, physical security, cloud storage, software patching, and incident response. It should be reviewed annually.",
          critical: true
        },
        {
          id: "q2",
          question: "Is personal data encrypted both at rest (stored) and in transit (being sent)?",
          actClause: "Section 46 — Encryption",
          hint: "At rest: encrypt databases, laptops, USB drives, and backup media. In transit: use HTTPS/TLS for websites and email encryption for sensitive communications. Unencrypted laptops containing personal data are a major compliance risk.",
          critical: true
        },
        {
          id: "q3",
          question: "Are strict access controls in place limiting who can access personal data?",
          actClause: "Section 46 — Access controls",
          hint: "Apply the 'need-to-know' principle: only staff who require access to personal data to perform their job should have it. Use role-based access control (RBAC), strong passwords, and multi-factor authentication (MFA) for sensitive systems.",
          critical: true
        },
        {
          id: "q4",
          question: "Do you conduct regular security risk assessments and vulnerability testing?",
          actClause: "Section 46 — Regular testing",
          hint: "At minimum: an annual security review of systems handling personal data, periodic vulnerability scans, and review of access logs. Penetration testing is recommended for organizations processing large volumes of sensitive data.",
          critical: false
        },
        {
          id: "q5",
          question: "Do you use pseudonymisation where appropriate to reduce risk?",
          actClause: "Section 46 — Pseudonymisation",
          hint: "Pseudonymisation replaces direct identifiers (names, ID numbers) with codes or tokens. The original data is stored separately and securely. This reduces the risk and impact of a data breach significantly.",
          critical: false
        },
        {
          id: "q6",
          question: "Do all staff who handle personal data receive regular data protection and security awareness training?",
          actClause: "Organizational security measures",
          hint: "Training should be given at onboarding and at least annually thereafter. It should cover: recognizing phishing/social engineering attacks, correct data handling procedures, how to report a breach, and the consequences of mishandling data.",
          critical: true
        },
        {
          id: "q7",
          question: "Do you have physical security controls for paper records and restricted areas containing personal data?",
          actClause: "Section 46 — Physical security",
          hint: "Physical records (files, printouts) must be locked away when not in use. Areas containing personal data systems or files should have controlled access. Enforce a clean desk policy. Shred sensitive documents rather than placing them in general waste bins.",
          critical: false
        }
      ]
    },

    // =========================================================================
    // SECTION 9: Data Breach Notification
    // =========================================================================
    {
      id: "s9",
      number: 9,
      title: "Data Breach Notification",
      icon: "🚨",
      actRef: "Part VIII, Sections 51–55 — Data Protection Act 2024",
      weight: 6,

      lawText: "Where a personal data breach has occurred, the data controller shall, without undue delay and, where feasible, not later than 72 hours after having become aware of the breach, notify MACRA. Where the breach is likely to result in a high risk to the rights of data subjects, the controller shall also communicate the breach to the affected data subjects without undue delay. All personal data breaches shall be documented in a breach register, whether or not they are notified to MACRA.",

      explanation: "A personal data breach is any security incident that results in the accidental or unlawful destruction, loss, alteration, unauthorized disclosure of, or access to, personal data. <strong>Breaches are not limited to hacking.</strong>\n\n<strong>Common examples of data breaches include:</strong>\n• Laptop or phone containing customer data is lost or stolen\n• An email with personal data is sent to the wrong person\n• A USB drive with employee records goes missing\n• Unauthorized staff member accesses confidential files\n• A cyberattack results in data being accessed or exfiltrated\n• Paper files containing personal data are found in general waste\n\n<strong>The 72-hour rule:</strong> You have 72 hours from the moment you discover a breach to notify MACRA. If the breach poses a high risk to individuals (e.g., risk of fraud, identity theft, physical danger), you must ALSO notify the affected individuals within 72 hours.\n\n<strong>Important:</strong> You do not need to wait until you have all the facts. Notify MACRA early with what you know, and provide updates as your investigation continues. Failure to report is itself an offence.",

      items: [
        {
          id: "q1",
          question: "Does your organization have a documented data breach response procedure?",
          actClause: "Section 51 — Breach management",
          hint: "Your procedure should cover: how to identify a breach, who to report it to internally (DPO/IT/management), how to assess its severity, how to notify MACRA within 72 hours, how to notify affected individuals, and how to contain and remediate the breach.",
          critical: true
        },
        {
          id: "q2",
          question: "Do all staff know how to recognize and report a data breach internally?",
          actClause: "Section 51 — Internal reporting",
          hint: "Staff must understand that a breach is not limited to hacking. A lost phone, an email to the wrong recipient, or a visible screen in a public space can all constitute breaches. They must know WHO to report to immediately (DPO, manager, IT helpdesk).",
          critical: true
        },
        {
          id: "q3",
          question: "Does your organization have the capability to notify MACRA within 72 hours of discovering a breach?",
          actClause: "Section 52 — 72-hour MACRA notification",
          hint: "Keep MACRA's breach reporting contact details readily accessible. Have a notification template prepared in advance. The 72-hour clock starts when you BECOME AWARE of the breach — not when the investigation is complete. Notify early and update later.",
          critical: true
        },
        {
          id: "q4",
          question: "Does your organization have a process to notify affected data subjects in case of a high-risk breach?",
          actClause: "Section 53 — Notification to data subjects",
          hint: "If a breach poses a high risk to individuals (financial fraud, identity theft, physical harm, discrimination), you must notify affected individuals promptly — ideally within 72 hours. The notification must explain: what happened, what data was affected, likely consequences, and steps they can take.",
          critical: true
        },
        {
          id: "q5",
          question: "Does your organization maintain a breach register recording all incidents, including near-misses?",
          actClause: "Section 54 — Breach documentation",
          hint: "Record ALL breaches, even those not reported to MACRA (e.g., low-risk incidents). A breach register should include: date of breach, date discovered, nature of breach, data categories affected, number of individuals affected, consequences, and remedial actions taken.",
          critical: false
        }
      ]
    },

    // =========================================================================
    // SECTION 10: Third-Party Data Processing Agreements
    // =========================================================================
    {
      id: "s10",
      number: 10,
      title: "Third-Party Processing Agreements",
      icon: "🤝",
      actRef: "Part IX, Sections 56–60 — Data Protection Act 2024",
      weight: 8,

      lawText: "Where a data controller engages a data processor, the processing shall be governed by a binding written contract between the controller and the processor. The contract shall stipulate that the processor shall: process personal data only on documented instructions from the controller; ensure that persons authorized to process personal data have committed to confidentiality; implement required security measures; assist the controller in ensuring compliance with data subject rights; and delete or return all personal data upon completion of services.",

      explanation: "Whenever your organization shares personal data with — or allows another organization to process it on your behalf — you must have a <strong>written Data Processing Agreement (DPA)</strong> in place. This is not optional.\n\n<strong>Common third-party processors include:</strong>\n• Cloud storage and software providers (Google Workspace, Microsoft 365, etc.)\n• Payroll and HR service companies\n• IT support and managed service providers\n• Call centres and contact centres\n• Marketing agencies managing your email lists\n• Accounting and audit firms\n• Security companies with access to CCTV systems\n\n<strong>As the data controller, you remain responsible</strong> for ensuring your processors handle data correctly, even after you hand it over. If your processor suffers a breach due to inadequate security, you may still be held liable by MACRA.\n\nThe Data Processing Agreement must contain specific legally required provisions — a general service agreement or NDA alone is not sufficient.",

      items: [
        {
          id: "q1",
          question: "Have you identified all third parties who process personal data on your behalf?",
          actClause: "Section 56 — Processor identification",
          hint: "Create a processor register. Review all your vendor, supplier, and service provider contracts. Any company that handles your data — even IT support who might incidentally access employee records — is likely a processor. Do not overlook cloud software subscriptions.",
          critical: true
        },
        {
          id: "q2",
          question: "Do you have formal written Data Processing Agreements with all identified processors?",
          actClause: "Section 57 — Contract requirement",
          hint: "Verbal agreements are not sufficient. Every processor must have a written DPA in place BEFORE they begin processing your data. If you are currently using processors without DPAs, this is a compliance gap that must be remediated urgently.",
          critical: true
        },
        {
          id: "q3",
          question: "Do your Data Processing Agreements include all legally required provisions?",
          actClause: "Section 57 — Required contract provisions",
          hint: "Required provisions include: processor acts only on controller instructions; staff confidentiality obligations; security measures required; assistance with data subject rights requests; assistance with DPIAs; deletion/return of data at end of contract; and audit rights for the controller.",
          critical: false
        },
        {
          id: "q4",
          question: "Do you carry out due diligence on processors before engaging them?",
          actClause: "Section 58 — Processor selection",
          hint: "Before engaging a processor, assess their data protection practices. Ask for: their own privacy policy, security certifications (ISO 27001), evidence of DPA compliance, and details of how they will protect your data. Document this due diligence.",
          critical: false
        },
        {
          id: "q5",
          question: "Do you monitor and periodically audit your processors' ongoing compliance with their agreements?",
          actClause: "Section 59 — Ongoing oversight",
          hint: "Compliance is an ongoing responsibility. Include audit rights in your DPAs. Conduct periodic reviews of processor compliance — especially for high-risk or high-volume processors. Request security reports or certifications annually.",
          critical: false
        }
      ]
    },

    // =========================================================================
    // SECTION 11: International Data Transfers
    // =========================================================================
    {
      id: "s11",
      number: 11,
      title: "International Data Transfers",
      icon: "🌍",
      actRef: "Part X, Sections 61–67 — Data Protection Act 2024",
      weight: 6,

      lawText: "A data controller or data processor shall not transfer personal data to a country outside Malawi unless: (a) the receiving country ensures an adequate level of protection of the rights and freedoms of data subjects in relation to the processing of personal data; or (b) the controller or processor has provided appropriate safeguards, and on condition that enforceable rights and effective legal remedies for data subjects are available. Binding corporate rules and adequacy decisions require approval from MACRA.",

      explanation: "The Act restricts where personal data about Malawian individuals can be sent. If your organization transfers personal data outside Malawi — even indirectly through cloud services hosted abroad — you must ensure the receiving country or service provider provides adequate data protection.\n\n<strong>Common scenarios triggering international transfer rules:</strong>\n• Using cloud software hosted on servers outside Malawi (e.g., Google, Microsoft, AWS)\n• Sending client data to an international parent company or subsidiary\n• Using email providers with servers outside Malawi\n• Sharing data with international NGO headquarters or donors\n• Outsourcing services to providers in other countries\n\n<strong>Permissible transfer mechanisms include:</strong>\n• Adequacy: The receiving country has laws providing adequate protection (MACRA determines adequacy)\n• Standard Contractual Clauses: Legally binding data protection terms incorporated into contracts\n• Binding Corporate Rules: Approved intra-group data protection policies (requires MACRA approval)\n• Explicit consent: The individual has been specifically informed and consents to the international transfer",

      items: [
        {
          id: "q1",
          question: "Has your organization identified whether it transfers personal data outside Malawi?",
          actClause: "Section 61 — Identifying international transfers",
          hint: "International transfers include: using foreign cloud services (even free tools like Google Workspace or Dropbox), emailing data to recipients abroad, sharing data with international partner organizations, and using foreign-based software that processes your data on external servers.",
          critical: true
        },
        {
          id: "q2",
          question: "For each international transfer, have you verified whether the receiving country has adequate data protection laws?",
          actClause: "Section 62 — Adequacy assessment",
          hint: "Check whether MACRA or the DPA has issued an adequacy decision for the receiving country. Countries with comprehensive data protection laws (e.g., EU GDPR-compliant countries) are more likely to be considered adequate.",
          critical: false
        },
        {
          id: "q3",
          question: "Where adequacy cannot be established, are appropriate transfer safeguards in place?",
          actClause: "Sections 63–65 — Transfer safeguards",
          hint: "Options include: standard contractual clauses incorporated into your vendor contracts, binding corporate rules (if transferring within an international group — requires MACRA approval), or explicit informed consent from each data subject for the specific transfer.",
          critical: true
        },
        {
          id: "q4",
          question: "Are all international data transfers documented in your Records of Processing Activities (RoPA)?",
          actClause: "Accountability — transfer documentation",
          hint: "In your RoPA, record: the name of each international transfer recipient, the country, the data categories transferred, the transfer mechanism used (adequacy/contractual clauses/consent), and any MACRA approvals obtained.",
          critical: false
        }
      ]
    },

    // =========================================================================
    // SECTION 12: Children's & Vulnerable Persons' Data
    // =========================================================================
    {
      id: "s12",
      number: 12,
      title: "Children's & Vulnerable Persons' Data",
      icon: "👶",
      actRef: "Part III, Section 13 — Data Protection Act 2024",
      weight: 6,

      lawText: "A data controller or processor who processes personal data of a child or of a person lacking legal capacity shall, prior to processing, take reasonable steps to verify the age or identity of the data subject and, where required, obtain consent from a parent or guardian. Personal data of children shall not be used for profiling or automated decision-making that has significant effects on the child. Special safeguards shall apply to the processing of personal data of children and persons lacking legal capacity.",

      explanation: "Children (under 18) and vulnerable persons are afforded special protection under the Act because they may not fully understand the consequences of sharing their personal data or giving consent.\n\n<strong>Organizations that commonly handle children's data include:</strong>\n• Schools, colleges, and universities\n• Hospitals, clinics, and healthcare providers\n• NGOs and social services organizations\n• Youth programs and sports organizations\n• Online platforms accessible to minors\n• Insurance companies (family policies with dependent children)\n\n<strong>Key requirements:</strong>\n• You must verify age before collecting a child's data\n• Consent from a parent or legal guardian is required — the child's consent alone is not sufficient\n• Children's data must not be used for commercial profiling or behavioral targeting\n• Access to children's data must be strictly limited to authorized personnel\n• Particular care must be taken with sensitive data about children (health, family circumstances)\n\nIf your organization does not knowingly process children's data, mark applicable questions as N/A.",

      items: [
        {
          id: "q1",
          question: "Does your organization knowingly process personal data of children (under 18) or persons lacking legal capacity?",
          actClause: "Section 13 — Children's data",
          hint: "If yes, the following questions are fully applicable. If no (e.g., you only serve corporate clients), mark the remaining questions as N/A — but document your assessment to show MACRA you have considered this.",
          critical: false
        },
        {
          id: "q2",
          question: "Do you have age/identity verification mechanisms in place before collecting a child's data?",
          actClause: "Section 13 — Age verification",
          hint: "Mechanisms may include: date of birth fields with validation, parental consent forms, ID verification at enrollment, or digital verification tools. The standard required is 'reasonable steps' — proportionate to the sensitivity of the data.",
          critical: true
        },
        {
          id: "q3",
          question: "Do you obtain valid consent from a parent or legal guardian before processing a child's personal data?",
          actClause: "Section 13 — Parental consent",
          hint: "The consent must come from the parent/guardian — not the child. It must meet all the standard consent requirements (freely given, informed, specific, unambiguous). Keep records of all parental consents obtained.",
          critical: true
        },
        {
          id: "q4",
          question: "Are additional safeguards in place to prevent misuse of children's data (no profiling, restricted access)?",
          actClause: "Section 13 — Special safeguards",
          hint: "Children's data must not be used for commercial profiling, behavioral advertising, or automated decisions with significant effects. Access must be strictly limited to staff with a legitimate need. Apply enhanced security measures to systems containing children's data.",
          critical: false
        }
      ]
    }

  ] // end sections

}; // end CHECKLIST_DATA
