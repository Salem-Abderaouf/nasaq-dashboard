export type Language = 'fr' | 'en' | 'ar';
export type Direction = 'ltr' | 'rtl';

export interface LanguageOption {
  code: Language;
  label: string;
  nativeLabel: string;
  flag: string;
  dir: Direction;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', flag: '🇬🇧', dir: 'ltr' },
  { code: 'fr', label: 'Français', nativeLabel: 'Français', flag: '🇫🇷', dir: 'ltr' },
  { code: 'ar', label: 'Arabe', nativeLabel: 'العربية', flag: '🇩🇿', dir: 'rtl' }
];
