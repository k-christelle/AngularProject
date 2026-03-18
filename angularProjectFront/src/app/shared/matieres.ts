export type MatiereKey =
  | 'BD'
  | 'WEB'
  | 'GRAILS'
  | 'MOBILE'
  | 'CLOUD';

export interface MatiereConfig {
  key: MatiereKey;
  label: string;
  matiereImageUrl: string;
  profNom: string;
  profPhotoUrl: string;
}

export const MATIERES: readonly MatiereConfig[] = [
  {
    key: 'BD',
    label: 'Base de données',
    matiereImageUrl: 'assets/matieres/bdd.svg',
    profNom: 'Prof BDD',
    profPhotoUrl: 'assets/profs/prof-bdd.svg'
  },
  {
    key: 'WEB',
    label: 'Technologies Web',
    matiereImageUrl: 'assets/matieres/web.svg',
    profNom: 'Prof Web',
    profPhotoUrl: 'assets/profs/prof-web.svg'
  },
  {
    key: 'GRAILS',
    label: 'Grails',
    matiereImageUrl: 'assets/matieres/grails.svg',
    profNom: 'Prof Grails',
    profPhotoUrl: 'assets/profs/prof-grails.svg'
  },
  {
    key: 'MOBILE',
    label: 'Mobile',
    matiereImageUrl: 'assets/matieres/mobile.svg',
    profNom: 'Prof Mobile',
    profPhotoUrl: 'assets/profs/prof-mobile.svg'
  },
  {
    key: 'CLOUD',
    label: 'Cloud',
    matiereImageUrl: 'assets/matieres/cloud.svg',
    profNom: 'Prof Cloud',
    profPhotoUrl: 'assets/profs/prof-cloud.svg'
  }
] as const;

export function getMatiereConfig(key: MatiereKey | string | null | undefined): MatiereConfig | undefined {
  if (!key) return undefined;
  return MATIERES.find(m => m.key === key);
}

