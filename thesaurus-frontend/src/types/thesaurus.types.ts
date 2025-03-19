export interface Word {
    id: string;
    word: string;
    definitions: string[];
    pos: string[]; // Parts of speech
    synonyms: string[];
    antonyms: string[];
    broader_terms: string[]; // Hypernyms
    narrower_terms: string[]; // Hyponyms
    related_terms: string[]; // Other relations
    examples: string[];
}

export interface SearchResponse {
    hits: Word[];
    offset: number;
    limit: number;
    total: number;
}

export interface SearchFilters {
    pos?: string; // Filter by part of speech
    exact_match?: boolean; // Exact word match
}

export interface RelationResponse {
    word: string;
    relation: string;
    related_words: string[];
}

export enum RelationType {
    Synonym = "synonyms",
    Antonym = "antonyms",
    BroaderTerm = "broader_terms",
    NarrowerTerm = "narrower_terms",
    RelatedTerm = "related_terms",
}

export interface RelationTypeInfo {
    id: RelationType;
    displayName: string;
    color: string;
}

export const relationTypes: Record<RelationType, RelationTypeInfo> = {
    [RelationType.Synonym]: {
        id: RelationType.Synonym,
        displayName: "Synonyms",
        color: "blue",
    },
    [RelationType.Antonym]: {
        id: RelationType.Antonym,
        displayName: "Antonyms",
        color: "red",
    },
    [RelationType.BroaderTerm]: {
        id: RelationType.BroaderTerm,
        displayName: "Broader Terms",
        color: "green",
    },
    [RelationType.NarrowerTerm]: {
        id: RelationType.NarrowerTerm,
        displayName: "Narrower Terms",
        color: "orange",
    },
    [RelationType.RelatedTerm]: {
        id: RelationType.RelatedTerm,
        displayName: "Related Terms",
        color: "grape",
    },
};

export interface ThesaurusState {
    currentWord: Word | null;
    searchResults: SearchResponse | null;
    isLoading: boolean;
    error: string | null;
}
