ALTER TABLE posts ADD COLUMN views INTEGER NOT NULL DEFAULT 0;
CREATE TABLE analytics_daily (day TEXT PRIMARY KEY, views INTEGER NOT NULL DEFAULT 0, visitors INTEGER NOT NULL DEFAULT 0, article_views INTEGER NOT NULL DEFAULT 0);
CREATE TABLE analytics_visitors (day TEXT NOT NULL, visitor TEXT NOT NULL, PRIMARY KEY(day, visitor));
CREATE TABLE analytics_hits (day TEXT NOT NULL, visitor TEXT NOT NULL, page TEXT NOT NULL, bucket INTEGER NOT NULL, post_id INTEGER, PRIMARY KEY(day, visitor, page, bucket));
CREATE TRIGGER analytics_new_visitor AFTER INSERT ON analytics_visitors BEGIN
  INSERT INTO analytics_daily(day, visitors) VALUES (NEW.day, 1) ON CONFLICT(day) DO UPDATE SET visitors = visitors + 1;
END;
CREATE TRIGGER analytics_new_hit AFTER INSERT ON analytics_hits BEGIN
  INSERT INTO analytics_daily(day, views, article_views) VALUES (NEW.day, 1, CASE WHEN NEW.post_id IS NULL THEN 0 ELSE 1 END)
    ON CONFLICT(day) DO UPDATE SET views = views + 1, article_views = article_views + excluded.article_views;
  UPDATE posts SET views = views + 1 WHERE id = NEW.post_id;
END;
