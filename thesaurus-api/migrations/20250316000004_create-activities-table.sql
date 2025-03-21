CREATE TABLE IF NOT EXISTS user_activities
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
    activity_type VARCHAR
(
    50
) NOT NULL,
    word VARCHAR
(
    255
),
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(
)
    );

CREATE INDEX idx_user_activities_user_id ON user_activities (user_id);
CREATE INDEX idx_user_activities_type ON user_activities (activity_type);
CREATE INDEX idx_user_activities_created_at ON user_activities (created_at DESC);