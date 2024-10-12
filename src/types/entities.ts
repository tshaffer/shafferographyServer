import { SearchRuleType, DateSearchRuleType, KeywordSearchRuleType, MatchRule } from "enums";

export interface GeoData {
  latitude: number;
  longitude: number;
  altitude: number;
  latitudeSpan: number;
  longitudeSpan: number;
}

export interface MediaItem {
  googleId: string,
  fileName: string,
  albumId: string;
  filePath?: string,
  productUrl?: string,
  baseUrl?: string,
  mimeType?: string,
  creationTime?: string,
  width?: number,
  height?: number
  orientation?: number,
  description?: string,
  geoData?: GeoData,
  people?: string[],
  keywordNodeIds: string[],
}

// export enum DateSelectorType {
//   All = 'all',
//   ByDateRange = 'byDateRange',
// }

export interface PhotosToDisplaySpec {
  specifyDateRange: boolean;
  startDate?: string;
  endDate?: string;
}

export interface DateRangeSpecification {
  specifyDateRange: boolean;
  startDate?: string;
  endDate?: string;
}

export interface Keyword {
  keywordId: string;
  label: string;
  type: string;
}

export interface KeywordNode {
  nodeId: string;
  keywordId: string;
  parentNodeId: string;
  childrenNodeIds: string[];
}

export interface KeywordData {
  keywords: Keyword[];
  keywordNodes: KeywordNode[];
  keywordRootNodeId: string;
}

export interface SearchRule {
  searchRuleType: SearchRuleType;
  searchRule: KeywordSearchRule | DateSearchRule;
}

export interface DateSearchRule {
  dateSearchRuleType: DateSearchRuleType;
  date: string;
  date2?: string;
}

export interface KeywordSearchRule {
  keywordSearchRuleType: KeywordSearchRuleType;
  keywordNodeId?: string;
}

export interface SearchSpec {
  matchRule: MatchRule;
  searchRules: SearchRule[];
}

export interface Takeout {
  id: string;
  label: string;
  albumName: string;
  path: string;
}

export interface AddedTakeoutData {
  addedKeywordData: KeywordData;
  addedMediaItems: MediaItem[];
}
