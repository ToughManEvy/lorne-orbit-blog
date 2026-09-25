ALTER TABLE posts ADD COLUMN pinned INTEGER NOT NULL DEFAULT 0 CHECK (pinned IN (0, 1));
CREATE UNIQUE INDEX posts_single_pinned_idx ON posts (pinned) WHERE pinned = 1;
