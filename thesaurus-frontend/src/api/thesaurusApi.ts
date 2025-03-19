import axiosInstance from "./axiosConfig";
import {RelationType, SearchFilters, SearchResponse, Word,} from "../types/thesaurus.types";

const THESAURUS_ENDPOINTS = {
    SEARCH: "/api/search",
    WORD: "/api/word/:word",
    SYNONYMS: "/api/synonyms/:word",
    ANTONYMS: "/api/antonyms/:word",
    BROADER_TERMS: "/api/broader/:word",
    NARROWER_TERMS: "/api/narrower/:word",
    RELATED_TERMS: "/api/related/:word",
    DEFINITION: "/api/definition/:word",
    EXAMPLES: "/api/examples/:word",
    ALL_RELATIONS: "/api/all/:word",
};

const replaceWordParam = (url: string, word: string): string => {
    return url.replace(":word", encodeURIComponent(word));
};

interface SearchWordsResponse {
    status: string;
    results: SearchResponse;
}

interface WordResponse {
    status: string;
    word: Word;
}

interface RelatedWordsResponse {
    status: string;
    word: string;
    relation: string;
    related_words: string[];
}

interface DefinitionsResponse {
    status: string;
    word: string;
    definitions: string[];
}

interface ExamplesResponse {
    status: string;
    word: string;
    examples: string[];
}

export const searchWords = async (
    query: string,
    offset: number = 0,
    limit: number = 20,
    filters?: SearchFilters,
): Promise<SearchResponse> => {
    try {
        const params: any = {
            q: query,
            offset,
            limit,
        };

        if (filters?.pos) params.pos = filters.pos;
        if (filters?.exact_match) params.exact_match = true;

        console.log("Making search request to:", THESAURUS_ENDPOINTS.SEARCH, {
            params,
        });
        const response = await axiosInstance.get<SearchWordsResponse>(
            THESAURUS_ENDPOINTS.SEARCH,
            {params},
        );
        console.log("Search response:", response.data);
        return response.data.results;
    } catch (error: any) {
        console.error("Search API error:", error);
        throw error.response?.data || {error: "Search failed"};
    }
};

export const getWord = async (word: string): Promise<Word> => {
    try {
        const url = replaceWordParam(THESAURUS_ENDPOINTS.WORD, word);
        console.log("Getting word details from:", url);
        const response = await axiosInstance.get<WordResponse>(url);
        return response.data.word;
    } catch (error: any) {
        console.error("Get word error:", error);
        throw error.response?.data || {error: "Failed to get word information"};
    }
};

export const getRelatedWords = async (
    word: string,
    relationType: RelationType,
): Promise<string[]> => {
    try {
        let url;

        switch (relationType) {
            case RelationType.Synonym:
                url = replaceWordParam(THESAURUS_ENDPOINTS.SYNONYMS, word);
                break;
            case RelationType.Antonym:
                url = replaceWordParam(THESAURUS_ENDPOINTS.ANTONYMS, word);
                break;
            case RelationType.BroaderTerm:
                url = replaceWordParam(THESAURUS_ENDPOINTS.BROADER_TERMS, word);
                break;
            case RelationType.NarrowerTerm:
                url = replaceWordParam(THESAURUS_ENDPOINTS.NARROWER_TERMS, word);
                break;
            case RelationType.RelatedTerm:
                url = replaceWordParam(THESAURUS_ENDPOINTS.RELATED_TERMS, word);
                break;
            default:
                throw new Error("Invalid relation type");
        }

        console.log(`Getting ${relationType} from:`, url);
        const response = await axiosInstance.get<RelatedWordsResponse>(url);
        return response.data.related_words;
    } catch (error: any) {
        console.error(`Get ${relationType} error:`, error);
        throw error.response?.data || {error: `Failed to get ${relationType}`};
    }
};

export const getDefinition = async (word: string): Promise<string[]> => {
    try {
        const url = replaceWordParam(THESAURUS_ENDPOINTS.DEFINITION, word);
        console.log("Getting definition from:", url);
        const response = await axiosInstance.get<DefinitionsResponse>(url);
        return response.data.definitions;
    } catch (error: any) {
        console.error("Get definition error:", error);
        throw error.response?.data || {error: "Failed to get definition"};
    }
};

export const getExamples = async (word: string): Promise<string[]> => {
    try {
        const url = replaceWordParam(THESAURUS_ENDPOINTS.EXAMPLES, word);
        console.log("Getting examples from:", url);
        const response = await axiosInstance.get<ExamplesResponse>(url);
        return response.data.examples;
    } catch (error: any) {
        console.error("Get examples error:", error);
        throw error.response?.data || {error: "Failed to get examples"};
    }
};

export const getAllRelations = async (word: string): Promise<Word> => {
    try {
        const url = replaceWordParam(THESAURUS_ENDPOINTS.ALL_RELATIONS, word);
        console.log("Getting all relations from:", url);
        const response = await axiosInstance.get<WordResponse>(url);
        return response.data.word;
    } catch (error: any) {
        console.error("Get all relations error:", error);
        throw error.response?.data || {error: "Failed to get all relations"};
    }
};
