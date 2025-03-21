CREATE TABLE IF NOT EXISTS user_favorites
(
    id
    UUID
    PRIMARY
    KEY
    DEFAULT
    uuid_generate_v4
(
),
    user_id UUID NOT NULL REFERENCES users
(
    id
) ON DELETE CASCADE,
    word VARCHAR
(
    255
) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(
),
    CONSTRAINT user_word_unique UNIQUE
(
    user_id,
    word
)
    );

CREATE INDEX idx_user_favorites_user_id ON user_favorites (user_id);
CREATE INDEX idx_user_favorites_word ON user_favorites (word);