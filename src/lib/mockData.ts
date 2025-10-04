export interface Student {
  matricule: string;
  promo: string;
  rang: number;
  rangS1: number;
  moyS1: number;
  rangS2: number;
  moyS2: number;
  moyRachat: number;
  recommendedSpecialty: string;
  grades: {
    SYS1: number;
    RES1: number;
    ANUM: number;
    RO: number;
    ORG: number;
    LANG1: number;
    IGL: number;
    THP: number;
    MCSI: number;
    BDD: number;
    SEC: number;
    CPROJ: number;
    PROJ: number;
    LANG2: number;
    ARCH: number;
    SYS2: number;
    RES2: number;
  };
}

// Generate mock data for demonstration
const specialties = ["SIQ", "SIL", "SID", "SIT"];
const promos = ["2022", "2023", "2024"];

const generateRandomGrade = () => Math.random() * 8 + 8; // Grades between 8 and 16

export const mockStudents: Student[] = Array.from({ length: 150 }, (_, i) => {
  const promoIndex = Math.floor(i / 50);
  const promo = promos[promoIndex];
  const grades = {
    SYS1: generateRandomGrade(),
    RES1: generateRandomGrade(),
    ANUM: generateRandomGrade(),
    RO: generateRandomGrade(),
    ORG: generateRandomGrade(),
    LANG1: generateRandomGrade(),
    IGL: generateRandomGrade(),
    THP: generateRandomGrade(),
    MCSI: generateRandomGrade(),
    BDD: generateRandomGrade(),
    SEC: generateRandomGrade(),
    CPROJ: generateRandomGrade(),
    PROJ: generateRandomGrade(),
    LANG2: generateRandomGrade(),
    ARCH: generateRandomGrade(),
    SYS2: generateRandomGrade(),
    RES2: generateRandomGrade(),
  };

  const moyS1 =
    (grades.SYS1 +
      grades.RES1 +
      grades.ANUM +
      grades.RO +
      grades.ORG +
      grades.LANG1 +
      grades.IGL +
      grades.THP) /
    8;

  const moyS2 =
    (grades.MCSI +
      grades.BDD +
      grades.SEC +
      grades.CPROJ +
      grades.PROJ +
      grades.LANG2 +
      grades.ARCH +
      grades.SYS2 +
      grades.RES2) /
    9;

  const moyRachat = (moyS1 + moyS2) / 2;

  // Simple recommendation logic based on best performing modules
  let recommendedSpecialty = specialties[0];
  if (grades.IGL > 13 && grades.PROJ > 13) {
    recommendedSpecialty = "SIQ";
  } else if (grades.SEC > 13 && grades.RES2 > 13) {
    recommendedSpecialty = "SID";
  } else if (grades.BDD > 13 && grades.MCSI > 13) {
    recommendedSpecialty = "SIQ";
  } else if (grades.RES1 > 13 && grades.RES2 > 13) {
    recommendedSpecialty = "SIT";
  } else {
    recommendedSpecialty = "SIL";
  }

  return {
    matricule: `ST${parseInt(promo) * 1000 + (i % 50) + 1}`,
    promo,
    rang: (i % 50) + 1,
    rangS1: Math.floor(Math.random() * 50) + 1,
    moyS1,
    rangS2: Math.floor(Math.random() * 50) + 1,
    moyS2,
    moyRachat,
    recommendedSpecialty,
    grades,
  };
}).sort((a, b) => b.moyRachat - a.moyRachat);
