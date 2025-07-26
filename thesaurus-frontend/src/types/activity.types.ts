export interface Activity {
    id: string;
    user_id: string;
    activity_type: 'search' | 'view_word' | 'add_favorite' | 'remove_favorite' | 'login' | 'logout' | 'register';
    word?: string;
    details?: any;
    created_at: string;
}