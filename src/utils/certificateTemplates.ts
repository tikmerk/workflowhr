import { CertificateType, Employee, CompanyBranding } from "../types";

export interface CertificateDetails {
  refNo: string;
  issueDate: string;
  employee: Employee;
  authorizedSignatory: string;
  signatoryTitle: string;
  companyName: string;
  companyNameBn?: string;
  tagline?: string;
  taglineBn?: string;
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  customReason?: string;
  newDesignation?: string;
  newBranch?: string;
  warningReason?: string;
}

/**
 * Renders the standardized Corporate Letterhead Header matching Notice Board A4 Letterhead
 */
function renderLetterheadHeader(details: CertificateDetails, docTitle: string): string {
  const {
    refNo,
    issueDate,
    companyName,
    tagline = "Social Welfare, Humanitarian Relief & Community Development",
    address = "Gulshan Corporate Avenue, Dhaka-1212, Bangladesh",
    phone = "+880 2-9887766, +880 1700-112233",
    email = "info@muslimwelfare.org",
    logoUrl,
  } = details;

  const logoMarkup = logoUrl
    ? `<img src="${logoUrl}" alt="${companyName}" style="width: 56px; height: 56px; object-fit: contain; border-radius: 10px; border: 1px solid #cbd5e1; padding: 3px; background: #ffffff; flex-shrink: 0;" />`
    : `<div style="width: 54px; height: 54px; border-radius: 10px; background: linear-gradient(135deg, #115e59 0%, #0f766e 100%); color: #ffffff; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 24px; border: 2px solid #0d9488; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); font-family: sans-serif; flex-shrink: 0;">${(companyName?.[0] || "M").toUpperCase()}</div>`;

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; line-height: 1.5;">
      <!-- 1. Official Letterhead Top Header -->
      <div style="padding-bottom: 14px; border-bottom: 3px solid #115e59;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 16px;">
          <!-- Left: Logo & Company Corporate Identity -->
          <div style="display: flex; align-items: center; gap: 14px;">
            ${logoMarkup}
            <div>
              <h1 style="font-size: 22px; font-weight: 900; color: #0f172a; font-family: Georgia, 'Times New Roman', serif; line-height: 1.1; margin: 0; letter-spacing: -0.5px;">
                ${companyName}
              </h1>
              <p style="font-size: 11.5px; font-weight: 700; color: #115e59; margin: 3px 0 2px 0;">
                ${tagline}
              </p>
              <p style="font-size: 10px; color: #475569; font-weight: 500; margin: 0;">
                Registered Corporate Administration & HRM Directorate
              </p>
            </div>
          </div>

          <!-- Right: ISO 9001:2015 Seal & Document Info -->
          <div style="text-align: right; flex-shrink: 0;">
            <div style="display: inline-block; padding: 4px 10px; border-radius: 6px; background-color: #f0fdfa; border: 1px solid #5eead4; color: #134e4a; font-size: 9.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">
              🛡️ ISO 9001:2015 CERTIFIED
            </div>
            <div style="font-size: 9.5px; color: #64748b; font-family: monospace; margin-top: 4px;">
              DOC ID: ${refNo}
            </div>
          </div>
        </div>

        <!-- Corporate Contact Sub-bar -->
        <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; font-size: 10px; color: #475569; padding-top: 8px; border-top: 1px solid #cbd5e1; margin-top: 10px; gap: 8px;">
          <div style="display: flex; align-items: center; gap: 4px;">
            <span>📍 ${address}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 14px; font-family: monospace;">
            <span>📞 ${phone}</span>
            <span>✉️ ${email}</span>
          </div>
        </div>
      </div>

      <!-- 2. Ref No & Date Bar -->
      <div style="display: flex; justify-content: space-between; align-items: center; background-color: #f8fafc; padding: 8px 14px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 11px; margin: 16px 0 22px 0; color: #1e293b;">
        <div>
          <span style="color: #64748b; font-weight: 500;">স্মারক নং / Ref No:</span>
          <span style="font-family: monospace; font-weight: 800; color: #115e59; margin-left: 6px;">${refNo}</span>
        </div>
        <div>
          <span style="color: #64748b; font-weight: 500;">তারিখ / Date of Issue:</span>
          <span style="font-weight: 700; color: #0f172a; margin-left: 6px;">${issueDate}</span>
        </div>
      </div>

      <!-- 3. Document Title Centered Banner -->
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="display: inline-block; font-size: 18px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: #0f172a; border-bottom: 2px solid #0d9488; padding-bottom: 4px; margin: 0; font-family: Georgia, serif;">
          ${docTitle}
        </h2>
      </div>
  `;
}

/**
 * Renders the official Signatory and Stamp Footer
 */
function renderLetterheadFooter(details: CertificateDetails, showEmployeeSignBox: boolean = false): string {
  const { authorizedSignatory, signatoryTitle, companyName, employee } = details;

  return `
      <!-- Official Authorized Signatory and Seal Section -->
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: flex-end; font-size: 11px;">
        <!-- Left: Authorized Signatory (Configured by Super Admin) -->
        <div style="text-align: left;">
          <div style="height: 38px; border-bottom: 1.5px solid #0f172a; width: 210px; margin-bottom: 6px; position: relative;">
            <span style="position: absolute; bottom: 2px; left: 0; font-size: 9px; color: #94a3b8; font-style: italic;">(Authorized Signatory)</span>
          </div>
          <p style="font-weight: 800; color: #0f172a; margin: 0; font-size: 12px;">${authorizedSignatory}</p>
          <p style="color: #475569; margin: 2px 0 0 0; font-weight: 600;">${signatoryTitle}</p>
          <p style="color: #64748b; margin: 2px 0 0 0; font-size: 10px;">${companyName}</p>
        </div>

        ${
          showEmployeeSignBox
            ? `
        <!-- Middle: Candidate Acceptance -->
        <div style="text-align: center;">
          <div style="height: 38px; border-bottom: 1.5px solid #64748b; width: 170px; margin-bottom: 6px; position: relative;">
            <span style="position: absolute; bottom: 2px; left: 0; right: 0; font-size: 9px; color: #94a3b8; font-style: italic;">Candidate Signature</span>
          </div>
          <p style="font-weight: 700; color: #1e293b; margin: 0; font-size: 11px;">${employee.fullName}</p>
          <p style="color: #64748b; margin: 2px 0 0 0; font-size: 10px;">Acceptance of Appointment</p>
        </div>
        `
            : ""
        }

        <!-- Right: Official Verification Stamp / Seal -->
        <div style="text-align: right;">
          <div style="display: inline-block; border: 1.5px dashed #0d9488; background-color: #f0fdfa; padding: 8px 14px; text-align: center; border-radius: 8px; font-size: 9.5px; color: #0f766e;">
            <div style="font-weight: 800; letter-spacing: 0.5px;">OFFICIAL CORPORATE SEAL</div>
            <div style="font-size: 8.5px; color: #475569; margin-top: 3px;">Workflow HR Verified Document</div>
            <div style="font-size: 8px; color: #0d9488; font-family: monospace; margin-top: 2px;">DIGITALLY AUTHENTICATED</div>
          </div>
        </div>
      </div>

      <!-- Legal Compliance & Verification Footer Note -->
      <div style="margin-top: 24px; padding-top: 8px; border-top: 1px dotted #cbd5e1; text-align: center; font-size: 9.5px; color: #64748b;">
        This document is officially issued under the authorization of ${companyName}. To authenticate this credential online, visit <strong>https://workflowhr.tikmerk.com/verify</strong> or scan the verification QR code.
      </div>
    </div>
  `;
}

export function generateCertificateHTML(type: CertificateType, details: CertificateDetails): string {
  const { refNo, issueDate, employee, companyName, customReason, warningReason } = details;

  const textJustifyClass = "text-justify text-slate-800 leading-relaxed font-sans text-sm space-y-4";

  switch (type) {
    case "NOC":
    case "NOC_LETTER" as any: {
      const header = renderLetterheadHeader(details, "No Objection Certificate (NOC)");
      const footer = renderLetterheadFooter(details);
      return `
        ${header}
        <div class="${textJustifyClass}">
          <p style="font-weight: 700; color: #0f172a; margin-bottom: 12px;">TO WHOM IT MAY CONCERN,</p>
          <p style="text-align: justify; line-height: 1.7; color: #1e293b; margin-bottom: 14px;">
            This is to certify that <strong>${employee.fullName}</strong>, bearing Employee ID <strong>${employee.employeeCode}</strong>, is a permanent employee of <strong>${companyName}</strong>, currently serving as <strong>${employee.designationTitle}</strong> in the Department of <strong>${employee.departmentName}</strong> (${employee.branchName}) since <strong>${employee.joiningDate}</strong>.
          </p>
          <p style="text-align: justify; line-height: 1.7; color: #1e293b; margin-bottom: 14px;">
            The management has <strong>No Objection</strong> whatsoever regarding ${customReason || "their personal travel abroad / higher education pursuit / visa application"}. During their tenure, they have shown exemplary dedication, good moral conduct, and outstanding professional discipline.
          </p>
          <p style="text-align: justify; line-height: 1.7; color: #1e293b; margin-bottom: 14px;">
            This certificate is issued upon the formal request of the employee without any financial or legal liability on behalf of the company.
          </p>
        </div>
        ${footer}
      `;
    }

    case "EXPERIENCE_CERTIFICATE": {
      const header = renderLetterheadHeader(details, "Certificate of Experience");
      const footer = renderLetterheadFooter(details);
      return `
        ${header}
        <div class="${textJustifyClass}">
          <p style="font-weight: 700; color: #0f172a; margin-bottom: 12px;">TO WHOM IT MAY CONCERN,</p>
          <p style="text-align: justify; line-height: 1.7; color: #1e293b; margin-bottom: 14px;">
            This is to certify that <strong>${employee.fullName}</strong> (Employee ID: <strong>${employee.employeeCode}</strong>) has been working with <strong>${companyName}</strong> as <strong>${employee.designationTitle}</strong> in the Department of <strong>${employee.departmentName}</strong> at our <strong>${employee.branchName}</strong> from <strong>${employee.joiningDate}</strong> to the present date.
          </p>
          <p style="text-align: justify; line-height: 1.7; color: #1e293b; margin-bottom: 14px;">
            During their tenure with us, ${employee.gender === "FEMALE" ? "she" : "he"} has displayed strong analytical competence, problem-solving skills, and commendable teamwork. Their professional contributions have been integral to organizational success.
          </p>
          <p style="text-align: justify; line-height: 1.7; color: #1e293b; margin-bottom: 14px;">
            We wish ${employee.gender === "FEMALE" ? "her" : "him"} all the best in all future professional endeavors and career opportunities.
          </p>
        </div>
        ${footer}
      `;
    }

    case "SALARY_CERTIFICATE": {
      const header = renderLetterheadHeader(details, "Salary & Employment Certificate");
      const footer = renderLetterheadFooter(details);
      return `
        ${header}
        <div class="${textJustifyClass}">
          <p style="font-weight: 700; color: #0f172a; margin-bottom: 12px;">TO WHOM IT MAY CONCERN,</p>
          <p style="text-align: justify; line-height: 1.7; color: #1e293b; margin-bottom: 14px;">
            This is to certify that <strong>${employee.fullName}</strong> is a full-time regular employee of <strong>${companyName}</strong>, working as <strong>${employee.designationTitle}</strong> at our <strong>${employee.branchName}</strong>.
          </p>

          <div style="margin: 16px 0; padding: 14px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
            <p style="font-weight: 800; color: #0f172a; margin-top: 0; margin-bottom: 10px; font-size: 12px;">Current Monthly Salary Structure Breakdown:</p>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 11px;">
              <span>Basic Salary:</span><span style="font-weight: 700; text-align: right;">BDT ${(employee.salary?.basic || 50000).toLocaleString()}</span>
              <span>House Rent Allowance:</span><span style="font-weight: 700; text-align: right;">BDT ${(employee.salary?.houseRent || 25000).toLocaleString()}</span>
              <span>Medical Allowance:</span><span style="font-weight: 700; text-align: right;">BDT ${(employee.salary?.medicalAllowance || 5000).toLocaleString()}</span>
              <span>Conveyance / Transport:</span><span style="font-weight: 700; text-align: right;">BDT ${(employee.salary?.transportAllowance || 5000).toLocaleString()}</span>
              <span>Special Allowance:</span><span style="font-weight: 700; text-align: right;">BDT ${(employee.salary?.specialAllowance || 5000).toLocaleString()}</span>
              <span style="border-top: 1.5px solid #cbd5e1; padding-top: 6px; font-weight: 800; color: #0f172a;">Total Gross Monthly Compensation:</span>
              <span style="border-top: 1.5px solid #cbd5e1; padding-top: 6px; font-weight: 800; text-align: right; color: #047857; font-size: 12px;">BDT ${(employee.salary?.grossSalary || 90000).toLocaleString()}</span>
            </div>
          </div>

          <p style="text-align: justify; line-height: 1.7; color: #1e293b; margin-bottom: 14px;">
            This certificate is issued at the formal request of the employee for banking, personal loan, or official verification purposes.
          </p>
        </div>
        ${footer}
      `;
    }

    case "APPOINTMENT_LETTER":
    case "OFFER_LETTER": {
      const isOffer = type === "OFFER_LETTER";
      const header = renderLetterheadHeader(details, isOffer ? "Formal Job Offer Letter" : "Official Letter of Appointment");
      const footer = renderLetterheadFooter(details, true);
      return `
        ${header}
        <div class="${textJustifyClass}">
          <div style="margin-bottom: 14px; font-size: 12px;">
            <p style="margin: 0; color: #64748b;">To,</p>
            <p style="margin: 2px 0 0 0; font-weight: 800; color: #0f172a; font-size: 13px;">${employee.fullName}</p>
            <p style="margin: 2px 0 0 0; color: #475569;">${employee.presentAddress || "Dhaka, Bangladesh"}</p>
          </div>

          <p style="font-weight: 700; color: #0f172a; margin-bottom: 10px;">Dear ${employee.fullName},</p>
          <p style="text-align: justify; line-height: 1.7; color: #1e293b; margin-bottom: 14px;">
            We are pleased to appoint you to the position of <strong>${employee.designationTitle}</strong> in the Department of <strong>${employee.departmentName}</strong> at <strong>${companyName}</strong> (${employee.branchName}).
          </p>

          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin: 14px 0;">
            <ul style="margin: 0; padding-left: 18px; font-size: 11px; line-height: 1.8; color: #334155;">
              <li><strong>Designation:</strong> ${employee.designationTitle}</li>
              <li><strong>Date of Joining:</strong> ${employee.joiningDate}</li>
              <li><strong>Gross Monthly Emoluments:</strong> BDT ${(employee.salary?.grossSalary || 90000).toLocaleString()}</li>
              <li><strong>Working Hours & Shift:</strong> ${employee.shiftName || "Regular Morning Shift"} (As per roster)</li>
              <li><strong>Probation Period:</strong> 6 Months from the joining date</li>
            </ul>
          </div>

          <p style="text-align: justify; line-height: 1.7; color: #1e293b; margin-bottom: 14px;">
            You will be subject to all policies, geofencing attendance rules, and ethical standards of conduct outlined in the official organizational manual.
          </p>
        </div>
        ${footer}
      `;
    }

    case "INCREMENT_LETTER" as any: {
      const header = renderLetterheadHeader(details, "Salary Increment & Revision Letter");
      const footer = renderLetterheadFooter(details);
      return `
        ${header}
        <div class="${textJustifyClass}">
          <p style="margin-bottom: 10px; font-size: 12px; color: #475569;">
            To: <strong>${employee.fullName}</strong> (Employee ID: <strong>${employee.employeeCode}</strong>)
          </p>
          <p style="font-weight: 700; color: #0f172a; margin-bottom: 10px;">Dear ${employee.fullName},</p>
          <p style="text-align: justify; line-height: 1.7; color: #1e293b; margin-bottom: 14px;">
            Following your annual performance appraisal review, the management of <strong>${companyName}</strong> is pleased to announce a merit salary revision effective from this month.
          </p>
          <p style="text-align: justify; line-height: 1.7; color: #1e293b; margin-bottom: 14px;">
            We deeply appreciate your continued commitment to organizational standards, excellence, and client satisfaction.
          </p>
        </div>
        ${footer}
      `;
    }

    case "INTERNSHIP_COMPLETION" as any: {
      const header = renderLetterheadHeader(details, "Certificate of Internship Completion");
      const footer = renderLetterheadFooter(details);
      return `
        ${header}
        <div class="${textJustifyClass}">
          <p style="font-weight: 700; color: #0f172a; margin-bottom: 12px;">TO WHOM IT MAY CONCERN,</p>
          <p style="text-align: justify; line-height: 1.7; color: #1e293b; margin-bottom: 14px;">
            This is to certify that <strong>${employee.fullName}</strong> has successfully completed an intensive internship program in the Department of <strong>${employee.departmentName}</strong> at <strong>${companyName}</strong>.
          </p>
          <p style="text-align: justify; line-height: 1.7; color: #1e293b; margin-bottom: 14px;">
            During this period, ${employee.gender === "FEMALE" ? "she" : "he"} demonstrated exceptional curiosity, professional discipline, and remarkable aptitude in operations and technical delivery.
          </p>
        </div>
        ${footer}
      `;
    }

    case "RECOMMENDATION_LETTER" as any: {
      const header = renderLetterheadHeader(details, "Letter of Recommendation");
      const footer = renderLetterheadFooter(details);
      return `
        ${header}
        <div class="${textJustifyClass}">
          <p style="font-weight: 700; color: #0f172a; margin-bottom: 12px;">TO WHOM IT MAY CONCERN,</p>
          <p style="text-align: justify; line-height: 1.7; color: #1e293b; margin-bottom: 14px;">
            It gives me immense pleasure to write this letter of recommendation for <strong>${employee.fullName}</strong>, who has been an indispensable member of our organization as <strong>${employee.designationTitle}</strong>.
          </p>
          <p style="text-align: justify; line-height: 1.7; color: #1e293b; margin-bottom: 14px;">
            I strongly recommend ${employee.gender === "FEMALE" ? "her" : "him"} for any senior technical or leadership capacity in prospective organizations or academic institutions.
          </p>
        </div>
        ${footer}
      `;
    }

    case "WARNING_LETTER": {
      const header = renderLetterheadHeader(details, "Official HR Warning Notice");
      const footer = renderLetterheadFooter(details);
      return `
        ${header}
        <div class="${textJustifyClass}">
          <p style="margin-bottom: 10px; font-size: 12px; color: #475569;">
            To: <strong>${employee.fullName}</strong> (Employee ID: <strong>${employee.employeeCode}</strong>)
          </p>
          <p style="color: #b91c1c; font-weight: 800; margin-bottom: 12px;">
            Subject: Formal Notice Regarding Compliance / Performance Standard Issue
          </p>
          <p style="text-align: justify; line-height: 1.7; color: #1e293b; margin-bottom: 14px;">
            This formal warning letter is issued regarding: <em>"${warningReason || "Repeated unexcused late attendances / non-compliance with operational protocols"}"</em>.
          </p>
          <p style="text-align: justify; line-height: 1.7; color: #1e293b; margin-bottom: 14px;">
            You are advised to take immediate corrective measures. Recurrence of similar behavior may result in administrative disciplinary actions under the company's code of conduct.
          </p>
        </div>
        ${footer}
      `;
    }

    case "RELIEVING_LETTER":
    case "RELEASE_LETTER" as any:
    default: {
      const header = renderLetterheadHeader(details, "Relieving & Clearance Certificate");
      const footer = renderLetterheadFooter(details);
      return `
        ${header}
        <div class="${textJustifyClass}">
          <p style="font-weight: 700; color: #0f172a; margin-bottom: 12px;">TO WHOM IT MAY CONCERN,</p>
          <p style="text-align: justify; line-height: 1.7; color: #1e293b; margin-bottom: 14px;">
            This is to certify that <strong>${employee.fullName}</strong>, formerly employed as <strong>${employee.designationTitle}</strong> in the Department of <strong>${employee.departmentName}</strong> at <strong>${companyName}</strong> (${employee.branchName}), has been formally relieved of ${employee.gender === "FEMALE" ? "her" : "his"} duties on <strong>${issueDate}</strong>.
          </p>
          <p style="text-align: justify; line-height: 1.7; color: #1e293b; margin-bottom: 14px;">
            All organizational assets, documentation, and handover processes have been duly verified and cleared with zero pending dues.
          </p>
        </div>
        ${footer}
      `;
    }
  }
}

export function generateCertificateHtml(
  type: any,
  employee: Employee,
  branding?: Partial<CompanyBranding>,
  signatoryOverride?: {
    authorizedSignatory?: string;
    signatoryTitle?: string;
    customReason?: string;
    refNo?: string;
    issueDate?: string;
  }
): string {
  const prefix = branding?.employeeIdPrefix || "MWO";
  const refNo =
    signatoryOverride?.refNo ||
    `${prefix}-2026-${employee.employeeCode || employee.id.slice(0, 6)}-${Math.floor(Math.random() * 900 + 100)}`;
  const issueDate =
    signatoryOverride?.issueDate ||
    new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const authorizedSignatory =
    signatoryOverride?.authorizedSignatory ||
    branding?.defaultSignatoryName ||
    "Md. Ibrahim Hossain";

  const signatoryTitle =
    signatoryOverride?.signatoryTitle ||
    branding?.defaultSignatoryTitle ||
    "Executive Director & Head of Administration";

  return generateCertificateHTML(type, {
    refNo,
    issueDate,
    employee,
    authorizedSignatory,
    signatoryTitle,
    companyName: branding?.companyName || "Muslim Welfare Organization",
    companyNameBn: branding?.companyNameBn,
    tagline: branding?.tagline,
    taglineBn: branding?.taglineBn,
    address: branding?.address,
    phone: branding?.phone,
    email: branding?.email,
    logoUrl: branding?.logoUrl,
    customReason: signatoryOverride?.customReason,
  });
}
