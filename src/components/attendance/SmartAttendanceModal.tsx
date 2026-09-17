import React, { useState } from "react";
import { Employee, AttendanceRecord, Branch, Shift, BiometricKioskSettings } from "../../types";
import { RealtimeFaceRecognitionView } from "../views/RealtimeFaceRecognitionView";
import { FaceEnrollmentModal } from "./FaceEnrollmentModal";

interface SmartAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoggedIn?: boolean;
  currentEmployee?: Employee | null;
  allEmployees?: Employee[];
  employees?: Employee[];
  selectedBranch?: Branch;
  allBranches?: Branch[];
  branches?: Branch[];
  attendanceLogs?: AttendanceRecord[];
  shifts?: Shift[];
  biometricSettings?: BiometricKioskSettings;
  onUpdateBiometricSettings?: (settings: BiometricKioskSettings) => void;
  onAttendanceSuccess: (record: AttendanceRecord) => void;
  onSwitchEmployee?: (employee: Employee) => void;
  onUpdateFacePhoto?: (
    employeeId: string,
    photoUrl: string,
    verificationScore?: number,
    faceDescriptor?: number[]
  ) => void;
  existingTodayRecord?: AttendanceRecord;
}

const DEFAULT_FALLBACK_BRANCH: Branch = {
  id: "branch-dhaka",
  companyId: "comp-01",
  name: "Dhaka Principal Campus (HQ)",
  code: "DHK-HQ",
  isHeadOffice: true,
  address: "Gulshan-2 Corporate Avenue, Dhaka",
  city: "Dhaka",
  state: "Dhaka Division",
  country: "Bangladesh",
  phone: "+880 1700-112233",
  email: "dhaka.hq@muslimwelfare.org",
  latitude: 23.7925,
  longitude: 90.4078,
  geofenceRadiusMeters: 150,
  wifiSSIDWhitelist: ["MWO_CORP_5G", "MWO_GUEST_SECURE"],
  totalEmployees: 48,
  activeStatus: "ACTIVE",
};

export const SmartAttendanceModal: React.FC<SmartAttendanceModalProps> = ({
  isOpen,
  onClose,
  isLoggedIn,
  currentEmployee: initialEmployee,
  allEmployees = [],
  employees = [],
  selectedBranch,
  allBranches = [],
  branches = [],
  attendanceLogs = [],
  shifts = [],
  biometricSettings,
  onUpdateBiometricSettings,
  onAttendanceSuccess,
  onUpdateFacePhoto,
}) => {
  const [enrollingEmployee, setEnrollingEmployee] = useState<Employee | null>(null);

  if (!isOpen) return null;

  const staffList = allEmployees.length > 0 ? allEmployees : employees;
  const branchList = allBranches.length > 0 ? allBranches : branches;

  const activeBranch =
    selectedBranch ||
    (initialEmployee ? branchList.find((b) => b.id === initialEmployee.branchId) : null) ||
    branchList[0] ||
    DEFAULT_FALLBACK_BRANCH;

  // Mobile, Tablet, PC all default to AUTO_KIOSK unless super admin enforces ONE_TO_ONE_ONLY
  const initialMode =
    biometricSettings?.modeAvailability === "ONE_TO_ONE_ONLY"
      ? "ONE_TO_ONE"
      : "AUTO_KIOSK";

  return (
    <>
      <RealtimeFaceRecognitionView
        employees={staffList}
        branches={branchList}
        attendanceLogs={attendanceLogs}
        currentEmployee={initialEmployee || undefined}
        shifts={shifts}
        initialMode={initialMode}
        biometricSettings={biometricSettings}
        onUpdateBiometricSettings={onUpdateBiometricSettings}
        isModal={true}
        onClose={onClose}
        selectedBranchId={activeBranch.id}
        onLogAttendance={(record) => {
          onAttendanceSuccess(record);
        }}
        onOpenEnrollmentModal={(emp) => {
          if (emp) {
            setEnrollingEmployee(emp);
          }
        }}
      />

      {enrollingEmployee && (
        <FaceEnrollmentModal
          isOpen={Boolean(enrollingEmployee)}
          onClose={() => setEnrollingEmployee(null)}
          employee={enrollingEmployee}
          onEnrollmentSuccess={(photoUrl, score, descriptor) => {
            if (onUpdateFacePhoto) {
              onUpdateFacePhoto(enrollingEmployee.id, photoUrl, score, descriptor);
            }
            setEnrollingEmployee(null);
          }}
        />
      )}
    </>
  );
};
