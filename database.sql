CREATE DATABASE IF NOT EXISTS clickfit;
USE clickfit;

CREATE TABLE IF NOT EXISTS users (
  ID INT NOT NULL AUTO_INCREMENT,
  email VARCHAR(255) CHARACTER SET 'utf8mb4' NOT NULL,
  password VARCHAR(255) CHARACTER SET 'utf8mb4' NOT NULL,
  type VARCHAR(255) CHARACTER SET 'utf8mb4' NOT NULL,
  active TINYINT DEFAULT 1,
  PRIMARY KEY (ID),
  UNIQUE INDEX email_UNIQUE (email)
)

CREATE PROCEDURE addUser (
  IN p_email VARCHAR(255),
  IN p_password VARCHAR(255),
  IN p_type VARCHAR(255)
)
BEGIN
  INSERT INTO users (email, password, type, active)
  VALUES (p_email, p_password, p_type, 1);

  SELECT LAST_INSERT_ID() AS user_id;
END

CALL addUser('admin@clickfit.com', 'hashed_password_here', 'admin');
CALL addUser('trainer@clickfit.com', 'hashed_password_here', 'trainer');
CALL addUser('member@clickfit.com', 'hashed_password_here', 'member');
