import { CertificateType, Employee } from "../types";

export interface CertificateDetails {
  refNo: string;
  issueDate: string;
  employee: Employee;
  authorizedSignatory: string;
  signatoryTitle: string;
  companyName: string;
  customReason?: string;
  newDesignation?: string;
  newBranch?: string;
  warningReason?: string;
}

export function generateCertificateHTML(type: CertificateType, details: CertificateDetails): string {
  const { refNo, issueDate, employee, authorizedSignatory, signatoryTitle, companyName, customReason, newDesignation, newBranch, warningReason } = details;

  switch (type) {
    case "NOC":
    case "NOC_LETTER" as any:
      return `
        <div class="certificate-content text-slate-800 leading-relaxed font-serif">
          <div class="text-center pb-4 border-b border-slate-300">
            <h2 class="text-2xl font-bold tracking-wide uppercase text-slate-900">No Objection Certificate (NOC)</h2>
            <p class="text-xs text-slate-500 font-sans mt-1">Ref No: ${refNo} | Date: ${issueDate}</p>
          </div>
          <div class="pt-6 space-y-4 text-sm font-sans">
            <p><strong>TO WHOM IT MAY CONCERN,</strong></p>
            <p>
              This is to certify that <strong>${employee.fullName}</strong>, bearing Employee ID <strong>${employee.employeeCode}</strong>, is a permanent employee of <strong>${companyName}</strong>, currently serving as <strong>${employee.designationTitle}</strong> in the Department of <strong>${employee.departmentName}</strong> (${employee.branchName}) since <strong>${employee.joiningDate}</strong>.
            </p>
            <p>
              The management has <strong>No Objection</strong> whatsoever regarding ${customReason || "their personal travel abroad / higher education pursuit / visa application"}. During their tenure, they have shown exemplary dedication, good moral conduct, and outstanding professional discipline.
            </p>
            <p>
              This certificate is issued upon the request of the employee without any financial or legal liability on behalf of the company.
            </p>
            <div class="pt-12 flex justify-between items-end text-xs">
              <div>
                <p class="font-bold text-slate-900">${authorizedSignatory}</p>
                <p class="text-slate-600">${signatoryTitle}</p>
                <p class="text-slate-500">${companyName}</p>
              </div>
              <div class="border border-dashed border-slate-300 p-3 text-center rounded text-[10px] text-slate-400">
                Official Seal / Verified Digital Stamp<br/>Workflow HR System
              </div>
            </div>
          </div>
        </div>
      `;

    case "EXPERIENCE_CERTIFICATE":
      return `
        <div class="certificate-content text-slate-800 leading-relaxed font-serif">
          <div class="text-center pb-4 border-b border-slate-300">
            <h2 class="text-2xl font-bold tracking-wide uppercase text-slate-900">Certificate of Experience</h2>
            <p class="text-xs text-slate-500 font-sans mt-1">Ref No: ${refNo} | Date: ${issueDate}</p>
          </div>
          <div class="pt-6 space-y-4 text-sm font-sans">
            <p><strong>TO WHOM IT MAY CONCERN,</strong></p>
            <p>
              This is to certify that <strong>${employee.fullName}</strong> (Employee ID: <strong>${employee.employeeCode}</strong>) has been working with <strong>${companyName}</strong> as <strong>${employee.designationTitle}</strong> in the Department of <strong>${employee.departmentName}</strong> at our <strong>${employee.branchName}</strong> from <strong>${employee.joiningDate}</strong> to the present date.
            </p>
            <p>
              During their tenure with us, ${employee.gender === "FEMALE" ? "she" : "he"} has displayed strong analytical competence, problem-solving skills, and commendable teamwork. Their professional contributions have been integral to organizational success.
            </p>
            <p>
              We wish ${employee.gender === "FEMALE" ? "her" : "him"} all the best in all future endeavors and career opportunities.
            </p>
            <div class="pt-12 flex justify-between items-end text-xs">
              <div>
                <p class="font-bold text-slate-900">${authorizedSignatory}</p>
                <p class="text-slate-600">${signatoryTitle}</p>
                <p class="text-slate-500">${companyName}</p>
              </div>
              <div class="border border-dashed border-slate-300 p-3 text-center rounded text-[10px] text-slate-400">
                Corporate HR Verification<br/>Workflow HR Verified
              </div>
            </div>
          </div>
        </div>
      `;

    case "SALARY_CERTIFICATE":
      return `
        <div class="certificate-content text-slate-800 leading-relaxed font-serif">
          <div class="text-center pb-4 border-b border-slate-300">
            <h2 class="text-2xl font-bold tracking-wide uppercase text-slate-900">Salary & Employment Certificate</h2>
            <p class="text-xs text-slate-500 font-sans mt-1">Ref No: ${refNo} | Date: ${issueDate}</p>
          </div>
          <div class="pt-6 space-y-4 text-sm font-sans">
            <p><strong>TO WHOM IT MAY CONCERN,</strong></p>
            <p>
              This is to certify that <strong>${employee.fullName}</strong> is a full-time regular employee of <strong>${companyName}</strong>, working as <strong>${employee.designationTitle}</strong> at <strong>${employee.branchName}</strong>.
            </p>
            <div class="my-3 p-4 bg-slate-50 border border-slate-200 rounded">
              <p class="font-bold mb-2 text-slate-900">Current Monthly Salary Structure Breakdown:</p>
              <div class="grid grid-cols-2 gap-2 text-xs">
                <span>Basic Salary:</span><span class="font-semibold text-right">BDT ${(employee.salary?.basic || 50000).toLocaleString()}</span>
                <span>House Rent Allowance:</span><span class="font-semibold text-right">BDT ${(employee.salary?.houseRent || 25000).toLocaleString()}</span>
                <span>Medical Allowance:</span><span class="font-semibold text-right">BDT ${(employee.salary?.medicalAllowance || 5000).toLocaleString()}</span>
                <span>Conveyance / Transport:</span><span class="font-semibold text-right">BDT ${(employee.salary?.transportAllowance || 5000).toLocaleString()}</span>
                <span>Special Allowance:</span><span class="font-semibold text-right">BDT ${(employee.salary?.specialAllowance || 5000).toLocaleString()}</span>
                <span class="border-t pt-1 font-bold">Total Gross Monthly Compensation:</span>
                <span class="border-t pt-1 font-bold text-right text-emerald-700">BDT ${(employee.salary?.grossSalary || 90000).toLocaleString()}</span>
              </div>
            </div>
            <p>
              This certificate is issued at the request of the employee for banking, loan, or official verification purposes.
            </p>
            <div class="pt-8 flex justify-between items-end text-xs">
              <div>
                <p class="font-bold text-slate-900">${authorizedSignatory}</p>
                <p class="text-slate-600">${signatoryTitle}</p>
                <p class="text-slate-500">${companyName}</p>
              </div>
              <div class="border border-dashed border-slate-300 p-3 text-center rounded text-[10px] text-slate-400">
                Finance & Payroll Audit Stamp<br/>Workflow HR System
              </div>
            </div>
          </div>
        </div>
      `;

    case "APPOINTMENT_LETTER":
    case "OFFER_LETTER":
      return `
        <div class="certificate-content text-slate-800 leading-relaxed font-serif">
          <div class="text-center pb-4 border-b border-slate-300">
            <h2 class="text-2xl font-bold tracking-wide uppercase text-slate-900">${type === "OFFER_LETTER" ? "Formal Job Offer Letter" : "Official Letter of Appointment"}</h2>
            <p class="text-xs text-slate-500 font-sans mt-1">Ref No: ${refNo} | Date: ${issueDate}</p>
          </div>
          <div class="pt-6 space-y-3 text-sm font-sans">
            <p>To,<br/><strong>${employee.fullName}</strong><br/>${employee.presentAddress || "Dhaka, Bangladesh"}</p>
            <p class="pt-2"><strong>Dear ${employee.fullName},</strong></p>
            <p>
              We are pleased to offer you the position of <strong>${employee.designationTitle}</strong> in the Department of <strong>${employee.departmentName}</strong> at <strong>${companyName}</strong> (${employee.branchName}).
            </p>
            <ul class="list-disc pl-5 space-y-1 text-xs text-slate-700">
              <li><strong>Designation:</strong> ${employee.designationTitle}</li>
              <li><strong>Date of Joining:</strong> ${employee.joiningDate}</li>
              <li><strong>Gross Monthly Emoluments:</strong> BDT ${(employee.salary?.grossSalary || 90000).toLocaleString()}</li>
              <li><strong>Working Hours & Shift:</strong> ${employee.shiftName || "Regular Morning Shift"} (As per company shift roster)</li>
              <li><strong>Probation Period:</strong> 6 Months from the joining date</li>
            </ul>
            <p>
              You will be subject to all policies, geofencing attendance rules, and standards of conduct outlined in the Workflow HR Enterprise manual.
            </p>
            <div class="pt-10 flex justify-between items-end text-xs">
              <div>
                <p class="font-bold text-slate-900">${authorizedSignatory}</p>
                <p class="text-slate-600">${signatoryTitle}</p>
              </div>
              <div class="text-right">
                <p class="border-t border-slate-400 pt-1 font-bold">Candidate Acceptance Signature</p>
                <p class="text-slate-500">${employee.fullName}</p>
              </div>
            </div>
          </div>
        </div>
      `;

    case "INCREMENT_LETTER" as any:
      return `
        <div class="certificate-content text-slate-800 leading-relaxed font-serif">
          <div class="text-center pb-4 border-b border-slate-300">
            <h2 class="text-2xl font-bold tracking-wide uppercase text-slate-900">Salary Increment & Revision Letter</h2>
            <p class="text-xs text-slate-500 font-sans mt-1">Ref No: ${refNo} | Date: ${issueDate}</p>
          </div>
          <div class="pt-6 space-y-4 text-sm font-sans">
            <p>To: <strong>${employee.fullName}</strong> (${employee.employeeCode})</p>
            <p><strong>Dear ${employee.fullName},</strong></p>
            <p>
              Following your annual performance appraisal review, the management of <strong>${companyName}</strong> is pleased to announce a merit salary revision of 15% effective from this month.
            </p>
            <p>
              We appreciate your continued commitment to organizational standards and client satisfaction.
            </p>
            <div class="pt-12 flex justify-between items-end text-xs">
              <div>
                <p class="font-bold text-slate-900">${authorizedSignatory}</p>
                <p class="text-slate-600">${signatoryTitle}</p>
              </div>
            </div>
          </div>
        </div>
      `;

    case "INTERNSHIP_COMPLETION" as any:
      return `
        <div class="certificate-content text-slate-800 leading-relaxed font-serif">
          <div class="text-center pb-4 border-b border-slate-300">
            <h2 class="text-2xl font-bold tracking-wide uppercase text-slate-900">Certificate of Internship Completion</h2>
            <p class="text-xs text-slate-500 font-sans mt-1">Ref No: ${refNo} | Date: ${issueDate}</p>
          </div>
          <div class="pt-6 space-y-4 text-sm font-sans">
            <p><strong>TO WHOM IT MAY CONCERN,</strong></p>
            <p>
              This is to certify that <strong>${employee.fullName}</strong> has successfully completed an intensive internship program in the Department of <strong>${employee.departmentName}</strong> at <strong>${companyName}</strong>.
            </p>
            <p>
              During this period, ${employee.gender === "FEMALE" ? "she" : "he"} demonstrated exceptional curiosity, discipline, and aptitude in software engineering and operations.
            </p>
            <div class="pt-12 flex justify-between items-end text-xs">
              <div>
                <p class="font-bold text-slate-900">${authorizedSignatory}</p>
                <p class="text-slate-600">${signatoryTitle}</p>
              </div>
            </div>
          </div>
        </div>
      `;

    case "RECOMMENDATION_LETTER" as any:
      return `
        <div class="certificate-content text-slate-800 leading-relaxed font-serif">
          <div class="text-center pb-4 border-b border-slate-300">
            <h2 class="text-2xl font-bold tracking-wide uppercase text-slate-900">Letter of Recommendation</h2>
            <p class="text-xs text-slate-500 font-sans mt-1">Ref No: ${refNo} | Date: ${issueDate}</p>
          </div>
          <div class="pt-6 space-y-4 text-sm font-sans">
            <p><strong>TO WHOM IT MAY CONCERN,</strong></p>
            <p>
              It gives me immense pleasure to write this letter of recommendation for <strong>${employee.fullName}</strong>, who has been an indispensable member of our organization as <strong>${employee.designationTitle}</strong>.
            </p>
            <p>
              I strongly recommend ${employee.gender === "FEMALE" ? "her" : "him"} for any senior technical or leadership capacity in prospective organizations or academic institutions.
            </p>
            <div class="pt-12 flex justify-between items-end text-xs">
              <div>
                <p class="font-bold text-slate-900">${authorizedSignatory}</p>
                <p class="text-slate-600">${signatoryTitle}</p>
              </div>
            </div>
          </div>
        </div>
      `;

    case "WARNING_LETTER":
      return `
        <div class="certificate-content text-slate-800 leading-relaxed font-serif">
          <div class="text-center pb-4 border-b border-red-300">
            <h2 class="text-2xl font-bold tracking-wide uppercase text-red-700">Official Warning Notice</h2>
            <p class="text-xs text-slate-500 font-sans mt-1">Ref No: ${refNo} | Date: ${issueDate}</p>
          </div>
          <div class="pt-6 space-y-4 text-sm font-sans">
            <p>To: <strong>${employee.fullName}</strong> (${employee.employeeCode})</p>
            <p class="text-red-700 font-semibold">Subject: Formal Notice Regarding Compliance / Performance Issue</p>
            <p>
              This formal warning letter is issued regarding: <em>"${warningReason || "Repeated unexcused late attendances / non-compliance with operational protocols"}"</em>.
            </p>
            <p>
              You are advised to take immediate corrective measures. Recurrence of similar behavior may result in administrative disciplinary actions under the company's code of conduct.
            </p>
            <div class="pt-12 flex justify-between items-end text-xs">
              <div>
                <p class="font-bold text-slate-900">${authorizedSignatory}</p>
                <p class="text-slate-600">${signatoryTitle}</p>
              </div>
            </div>
          </div>
        </div>
      `;

    case "RELIEVING_LETTER":
    case "RELEASE_LETTER" as any:
    default:
      return `
        <div class="certificate-content text-slate-800 leading-relaxed font-serif">
          <div class="text-center pb-4 border-b border-slate-300">
            <h2 class="text-2xl font-bold tracking-wide uppercase text-slate-900">Relieving & Clearance Certificate</h2>
            <p class="text-xs text-slate-500 font-sans mt-1">Ref No: ${refNo} | Date: ${issueDate}</p>
          </div>
          <div class="pt-6 space-y-4 text-sm font-sans">
            <p><strong>TO WHOM IT MAY CONCERN,</strong></p>
            <p>
              This is to certify that <strong>${employee.fullName}</strong>, formerly employed as <strong>${employee.designationTitle}</strong> in the Department of <strong>${employee.departmentName}</strong> at <strong>${companyName}</strong> (${employee.branchName}), has been formally relieved of ${employee.gender === "FEMALE" ? "her" : "his"} duties on <strong>${issueDate}</strong>.
            </p>
            <p>
              All organizational assets, documentation, and handover processes have been duly verified and cleared with zero pending dues.
            </p>
            <div class="pt-12 flex justify-between items-end text-xs">
              <div>
                <p class="font-bold text-slate-900">${authorizedSignatory}</p>
                <p class="text-slate-600">${signatoryTitle}</p>
                <p class="text-slate-500">${companyName}</p>
              </div>
            </div>
          </div>
        </div>
      `;
  }
}

export function generateCertificateHtml(type: any, employee: Employee): string {
  return generateCertificateHTML(type, {
    refNo: `APEX-2026-${employee.employeeCode}-${Math.floor(Math.random() * 900 + 100)}`,
    issueDate: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    employee,
    authorizedSignatory: "Md. Ibrahim Hossain",
    signatoryTitle: "Chief Executive Officer & Head of People",
    companyName: "Apex Global Technologies Ltd.",
  });
}
