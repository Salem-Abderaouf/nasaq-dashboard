export interface GlassPaneConfig {
  widthCm: number;
  heightCm: number;
  marginTopCm: number;
  marginLeftCm: number;
  leaf: 'left' | 'right';
}

export interface DoorConfigItem {
  id: string; // e.g. "P1", "P2"
  heightCm: number;
  widthCm: number;
  designation: string;
  priceNormal: number;
  pricePromo: number;
  colorId: string;
  patternId: string;
  doorStructure: 'single' | 'double';
  leftLeafPercent: number; // e.g. 28%
  hardwareColor: 'black' | 'chrome';
  glassPanes: GlassPaneConfig[];
  hasRevetment: boolean;
  revetmentHeightCm: number;
}

export interface ColorCatalogItem {
  id: string;
  name: string;
  hex: string;
  textColor: string;
  isWood: boolean;
}

export interface PatternCatalogItem {
  id: string;
  name: string;
  type: 'none' | 'gold' | 'dark';
  strokeColor: string;
}

export interface StudioGeneralInfo {
  clientName: string;
  clientId?: string;
  docRef: string;
  docDate: string;
  paidAmount: number;
  isPromoEnabled: boolean;
  isPoseEnabled: boolean;
  isTransportEnabled: boolean;
  scale: number;
  gridGap: number;
}
