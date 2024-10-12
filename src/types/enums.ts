export enum MatchRule {
  all = 'all',
  any = 'any',
}

export enum SearchRuleType {
  Keyword = 'keyword',
  Date = 'date',
}

export enum KeywordSearchRuleType {
  Contains = 'contains',
  AreEmpty = 'areEmpty',
  AreNotEmpty = 'areNotEmpty',
}

export enum DateSearchRuleType {
  IsInTheRange = 'isInTheRange',
  IsBefore = 'isBefore',
  IsAfter = 'isAfter',
}
