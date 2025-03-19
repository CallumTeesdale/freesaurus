export const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    }).format(date);
};

export const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
    }).format(date);
};

export const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
    }).format(date);
};

export const capitalizeFirstLetter = (string: string): string => {
    if (!string) return "";
    return string.charAt(0).toUpperCase() + string.slice(1);
};

export const formatPOS = (pos: string): string => {
    const posMap: Record<string, string> = {
        n: "Noun",
        v: "Verb",
        adj: "Adjective",
        adv: "Adverb",
        prep: "Preposition",
        conj: "Conjunction",
        pron: "Pronoun",
        interj: "Interjection",
        det: "Determiner",
    };

    return posMap[pos.toLowerCase()] || capitalizeFirstLetter(pos);
};
