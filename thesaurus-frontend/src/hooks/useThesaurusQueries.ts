import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    searchWords,
    getWord,
    getRelatedWords,
    getDefinition,
    getExamples,
    getAllRelations
} from '../api/thesaurusApi';
import { RelationType, SearchFilters } from '@/types';
import { useEffect } from 'react';
import { addToRecentSearches } from '../utils/userDataDb';

export const queryKeys = {
    search: 'search',
    word: 'word',
    relatedWords: 'relatedWords',
    definitions: 'definitions',
    examples: 'examples',
    allRelations: 'allRelations',
};

export const useSearchWords = (
    query: string,
    offset: number = 0,
    limit: number = 20,
    filters?: SearchFilters,
    enabled: boolean = true
) => {
    return useQuery({
        queryKey: [queryKeys.search, query, offset, limit, filters],
        queryFn: () => searchWords(query, offset, limit, filters),
        enabled: enabled && query.length >= 2,
        staleTime: 10 * 60 * 1000,
    });
};

export const useWordDetails = (word: string) => {
    return useQuery({
        queryKey: [queryKeys.word, word],
        queryFn: () => getWord(word),
        enabled: !!word,
        staleTime: 60 * 60 * 1000, // 1 hour
    });
};

export const useRelatedWords = (word: string, relationType: RelationType) => {
    return useQuery({
        queryKey: [queryKeys.relatedWords, word, relationType],
        queryFn: () => getRelatedWords(word, relationType),
        enabled: !!word,
        staleTime: 60 * 60 * 1000, // 1 hour
    });
};

export const useDefinitions = (word: string) => {
    return useQuery({
        queryKey: [queryKeys.definitions, word],
        queryFn: () => getDefinition(word),
        enabled: !!word,
        staleTime: 60 * 60 * 1000, // 1 hour
    });
};

export const useExamples = (word: string) => {
    return useQuery({
        queryKey: [queryKeys.examples, word],
        queryFn: () => getExamples(word),
        enabled: !!word,
        staleTime: 60 * 60 * 1000, // 1 hour
    });
};

export const useAllRelations = (word: string) => {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: [queryKeys.allRelations, word],
        queryFn: () => getAllRelations(word),
        enabled: !!word,
        staleTime: 60 * 60 * 1000, // 1 hour
    });

    useEffect(() => {
        if (query.isSuccess && query.data) {
            const data = query.data;
            queryClient.setQueryData([queryKeys.word, word], data);
            queryClient.setQueryData([queryKeys.definitions, word], data.definitions);
            queryClient.setQueryData([queryKeys.examples, word], data.examples);
            queryClient.setQueryData([queryKeys.relatedWords, word, RelationType.Synonym], data.synonyms);
            queryClient.setQueryData([queryKeys.relatedWords, word, RelationType.Antonym], data.antonyms);
            queryClient.setQueryData([queryKeys.relatedWords, word, RelationType.BroaderTerm], data.broader_terms);
            queryClient.setQueryData([queryKeys.relatedWords, word, RelationType.NarrowerTerm], data.narrower_terms);
            queryClient.setQueryData([queryKeys.relatedWords, word, RelationType.RelatedTerm], data.related_terms);
            addToRecentSearches(word).catch(console.error);
        }
    }, [query.isSuccess, query.data, word, queryClient]);

    return query;
};